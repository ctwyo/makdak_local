import asyncio
import os
import re
from typing import Optional
from dotenv import load_dotenv
from telethon import TelegramClient, events, functions, types
from telethon.errors import RPCError

try:
    import aiohttp
    from aiohttp import web
except ImportError as exc:
    raise RuntimeError(
        "aiohttp is required. Install dependencies with "
        "'pip install telethon aiohttp python-dotenv'."
    ) from exc


load_dotenv()

API_ID = int(os.environ["TELEGRAM_API_ID"])
API_HASH = os.environ["TELEGRAM_API_HASH"]
SESSION_NAME = os.environ.get("TELETHON_SESSION_NAME", "userbot")
BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:3000")
TARGET_CHAT_ID = int(os.environ.get("TELEGRAM_CHAT_ID", "-1002714385523"))
USERBOT_HOST = os.environ.get("USERBOT_HOST", "127.0.0.1")
USERBOT_PORT = int(os.environ.get("USERBOT_PORT", "4000"))

TRIGGERS = {
    "\u041d\u043e\u0432\u044b\u0439 \u0437\u0430\u043a\u0430\u0437 \u043e\u0442": "zakaz",
    "@\u043c\u043e\u043d\u0442\u0430\u0436": "montazh",
}

ORDER_HEADER_PATTERN = (
    "\u041d\u043e\u0432\u044b\u0439 \u0437\u0430\u043a\u0430\u0437 \u043e\u0442\\s+(.+)"
)


def extract_action(text: str):
    for trigger, action in TRIGGERS.items():
        if re.search(trigger, text, flags=re.IGNORECASE):
            cleaned = re.sub(
                rf"\s*{trigger}\s*", " ", text, flags=re.IGNORECASE
            ).strip()
            if cleaned:
                return action, cleaned
    return None, None


def parse_order_message(message: str) -> Optional[dict]:
    lines = [line.strip() for line in message.splitlines()]
    lines = [line for line in lines if line]
    if not lines:
        return None

    full_name = ""
    username = ""
    user_id = ""
    order_start_idx = 0
    header_regex = re.compile(ORDER_HEADER_PATTERN, flags=re.IGNORECASE)

    for idx, line in enumerate(lines):
        header_match = header_regex.match(line)
        lower_line = line.lower()

        if header_match:
            full_name = header_match.group(1).strip().rstrip(".")
            order_start_idx = idx + 1
            continue

        if lower_line.startswith("userid:"):
            user_id = re.sub(r"^userId:\s*", "", line, flags=re.IGNORECASE).strip()
            order_start_idx = idx + 1
            continue

        if lower_line.startswith("username:"):
            username = re.sub(r"^username:\s*@?", "", line, flags=re.IGNORECASE).strip()
            order_start_idx = idx + 1
            continue

        if not full_name:
            full_name = line.rstrip(".")
            order_start_idx = idx + 1

    order_lines = lines[order_start_idx:]
    if not order_lines:
        return None

    order_text = "\n".join(order_lines).strip()
    if not order_text:
        return None

    return {
        "full_name": full_name,
        "username": username,
        "order_text": order_text,
        "user_id": user_id,
    }


def extract_topic_id(event: events.NewMessage.Event) -> int:
    message = event.message
    candidate_attrs = (
        "reply_to_top_id",
        "message_thread_id",
        "forum_topic_id",
        "top_msg_id",
    )

    for attr in candidate_attrs:
        value = getattr(message, attr, None)
        if value:
            return value

    reply_header = getattr(message, "reply_to", None)
    if reply_header:
        for attr in candidate_attrs:
            value = getattr(reply_header, attr, None)
            if value:
                return value

    return 0


client = TelegramClient(SESSION_NAME, API_ID, API_HASH)
_http_session: aiohttp.ClientSession | None = None
web_runner: web.AppRunner | None = None


async def get_http_session() -> aiohttp.ClientSession:
    global _http_session
    if _http_session is None or _http_session.closed:
        _http_session = aiohttp.ClientSession()
    return _http_session


async def forward_order(payload: dict):
    session = await get_http_session()
    url = f"{BACKEND_URL.rstrip('/')}/new-order"
    async with session.post(url, json=payload) as response:
        if response.status >= 400:
            body = await response.text()
            raise RuntimeError(
                f"Failed to forward order. Status: {response.status}. Body: {body}"
            )


def _coerce_int(value):
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


async def send_via_userbot(
    chat_id,
    text,
    *,
    reply_to: int | None = None,
    topic_id: int | None = None,
    reaction: str | None = None,
):
    send_kwargs: dict = {}
    if reply_to is not None:
        send_kwargs["reply_to"] = reply_to
    if topic_id:
        send_kwargs["comment_to"] = topic_id

    await client.send_message(chat_id, text, **send_kwargs)

    if reaction and reply_to is not None:
        input_peer = await client.get_input_entity(chat_id)
        try:
            await client.send_reaction(
                input_peer, reply_to, reaction, big=False, add_to_recent=True
            )
        except AttributeError:
            await client(
                functions.messages.SendReactionRequest(
                    peer=input_peer,
                    msg_id=reply_to,
                    reaction=[types.ReactionEmoji(emoticon=reaction)],
                    big=False,
                    add_to_recent=True,
                )
            )


async def handle_order_ready(request: web.Request) -> web.Response:
    try:
        payload = await request.json()
    except Exception:
        return web.json_response({"error": "Invalid JSON payload"}, status=400)

    chat_id = payload.get("chatId")
    message_id = payload.get("messageId")
    topic_id = payload.get("topicId")
    text = payload.get("text")
    reaction = payload.get("reaction", "👍")

    if chat_id is None or text is None:
        return web.json_response(
            {"error": "Missing required fields 'chatId' or 'text'"},
            status=400,
        )

    chat_id_int = _coerce_int(chat_id)
    if chat_id_int is None:
        chat_id_int = chat_id
    message_id_int = _coerce_int(message_id)
    topic_id_int = _coerce_int(topic_id)

    try:
        await send_via_userbot(
            chat_id_int,
            text,
            reply_to=message_id_int,
            topic_id=topic_id_int,
            reaction=reaction,
        )
        return web.json_response({"status": "ok"})
    except Exception as error:
        print(f"Failed to send ready notification: {error}")
        return web.json_response({"error": "Failed to send message"}, status=500)


async def handle_send_message(request: web.Request) -> web.Response:
    try:
        payload = await request.json()
    except Exception:
        return web.json_response({"error": "Invalid JSON payload"}, status=400)

    chat_id = payload.get("chatId")
    text = payload.get("text")
    message_id = payload.get("messageId")
    topic_id = payload.get("topicId")
    reaction = payload.get("reaction")

    if chat_id is None or text is None:
        return web.json_response(
            {"error": "Missing required fields 'chatId' or 'text'"},
            status=400,
        )

    chat_id_int = _coerce_int(chat_id)
    if chat_id_int is None:
        chat_id_int = chat_id
    message_id_int = _coerce_int(message_id)
    topic_id_int = _coerce_int(topic_id)

    try:
        await send_via_userbot(
            chat_id_int,
            text,
            reply_to=message_id_int,
            topic_id=topic_id_int,
            reaction=reaction,
        )
        return web.json_response({"status": "ok"})
    except Exception as error:
        print(f"Failed to send message via userbot: {error}")
        return web.json_response({"error": "Failed to send message"}, status=500)


async def start_http_server():
    global web_runner
    app = web.Application()
    app.add_routes(
        [
            web.post("/order-ready", handle_order_ready),
            web.post("/send-message", handle_send_message),
        ]
    )
    web_runner = web.AppRunner(app)
    await web_runner.setup()
    site = web.TCPSite(web_runner, USERBOT_HOST, USERBOT_PORT)
    await site.start()
    print(f"Userbot HTTP server listening on http://{USERBOT_HOST}:{USERBOT_PORT}")


async def stop_http_server():
    global web_runner
    if web_runner is not None:
        await web_runner.cleanup()
        web_runner = None


@client.on(events.NewMessage(chats=TARGET_CHAT_ID))
async def handle_new_message(event: events.NewMessage.Event):
    text = event.raw_text or ""
    action, cleaned_text = extract_action(text)
    if not action or not cleaned_text:
        return

    order_details = parse_order_message(cleaned_text)

    if not order_details:
        print("Failed to parse order message, skipping.")
        return

    sender = await event.get_sender()
    chat = await event.get_chat()
    input_chat = await event.get_input_chat()
    topic_id = extract_topic_id(event)

    parsed_full_name = order_details.get("full_name", "")

    effective_full_name = (
        parsed_full_name
        or " ".join(
            part for part in [getattr(sender, "first_name", ""), getattr(sender, "last_name", "")]
            if part
        )
    ).strip()
    if not effective_full_name:
        effective_full_name = getattr(sender, "username", "") or "Unknown"

    if " " in effective_full_name:
        first_name, last_name = effective_full_name.split(" ", 1)
    else:
        first_name, last_name = effective_full_name, ""

    try:
        await client(
            functions.messages.SendReactionRequest(
                peer=input_chat,
                msg_id=event.message.id,
                reaction=[types.ReactionEmoji(emoticon="👍")],
                big=False,
                add_to_recent=True,
            )
        )
    except RPCError as reaction_error:
        print(f"Failed to add reaction on incoming message: {reaction_error}")
    except Exception as reaction_error:
        print(f"Unexpected error reacting on incoming message: {reaction_error}")

    payload = {
        "text": order_details["order_text"],
        "firstName": first_name,
        "lastName": last_name,
        "chatId": event.chat_id,
        "messageId": event.message.id,
        "action": action,
        "fromTelegram": True,
        "chatTitle": getattr(chat, "title", "") or "",
        "topicId": topic_id or 0,
        "fullName": effective_full_name,
        "sourceMessage": cleaned_text,
    }

    try:
        await forward_order(payload)
        print(
            f"Forwarded order from user {payload['userId']}: "
            f"{order_details['order_text']}"
        )
    except Exception as error:
        print(f"Failed to forward order: {error}")


async def main():
    await client.start()
    await start_http_server()
    print("Telethon userbot is running and listening for orders...")
    try:
        await client.run_until_disconnected()
    finally:
        await stop_http_server()
        if _http_session and not _http_session.closed:
            await _http_session.close()


if __name__ == "__main__":
    asyncio.run(main())


