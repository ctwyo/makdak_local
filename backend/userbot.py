import asyncio
import os
import re
import json
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
    "Новый заказ от": "zakaz",
    "@хочу": "zakaz",
    "@монтаж": "montazh",
}

ORDER_HEADER_PATTERN = (
    "Новый заказ от\\s+(.+)"
)


def get_user_full_name(user_id, username=None):
    """Получить fullName из users.json по userId или userName"""
    try:
        users_path = os.path.join(os.getcwd(), "users.json")
        with open(users_path, 'r', encoding='utf-8') as f:
            users = json.load(f)
        
        # Сначала ищем по userId
        user = next((u for u in users if u.get("userId") == str(user_id)), None)
        
        # Если не нашли по userId и есть username, ищем по userName
        if not user and username:
            user = next((u for u in users if u.get("userName") == username), None)
        
        return user.get("fullName") if user else None
    except Exception as e:
        print(f"Ошибка при чтении users.json: {e}")
        return None


def extract_action(text: str):
    print(f"DEBUG extract_action: Исходный текст: '{text}'")
    for trigger, action in TRIGGERS.items():
        # Ищем триггер в начале сообщения (первой строки)
        if re.search(rf"^\s*{re.escape(trigger)}", text, flags=re.IGNORECASE):
            print(f"DEBUG extract_action: Найден триггер '{trigger}' -> action '{action}'")
            if trigger == "Новый заказ от":
                # Не удаляем шапку, она нужна парсеру для извлечения ФИО
                cleaned = text.strip()
            else:
                # Для @хочу удаляем только ведущий триггер в начале
                cleaned = re.sub(
                    rf"^\s*{re.escape(trigger)}\s*", "", text, flags=re.IGNORECASE
                ).strip()
            print(f"DEBUG extract_action: Очищенный текст: '{cleaned}'")
            if cleaned:
                return action, cleaned
    print(f"DEBUG extract_action: Триггеры не найдены")
    return None, None


def parse_order_message(message: str, action: str = None) -> Optional[dict]:
    print(f"Parsing message: '{message}'")
    lines = [line.strip() for line in message.splitlines()]
    lines = [line for line in lines if line]
    print(f"Lines after filtering: {lines}")
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
            # Для @хочу не парсим имя из строк, имя берется из users.json
            if action == "zakaz":
                continue
            # Для других случаев парсим имя из первой строки
            full_name = line.rstrip(".")
            order_start_idx = idx + 1

    order_lines = lines[order_start_idx:]
    print(f"Order lines: {order_lines}")
    if not order_lines:
        return None

    # Если после триггера пришла всего одна строка без шапки/служебных полей,
    # трактуем её как текст заказа, а имя берём из username/full_name, если были
    if len(order_lines) == 1 and not full_name and not username and not user_id:
        single_line_text = order_lines[0].strip()
        if single_line_text:
            return {
                "full_name": full_name,
                "username": username,
                "order_text": single_line_text,
                "user_id": user_id,
            }

    # Специальная обработка для монтажа: если есть full_name и несколько строк,
    # то весь текст после full_name идет в order_text (без комментариев для монтажа)
    if action == "montazh" and full_name and len(order_lines) > 0:
        montazh_text = "\n".join(order_lines).strip()
        if montazh_text:
            return {
                "full_name": full_name,
                "username": username,
                "order_text": montazh_text,
                "user_id": user_id,
            }

    # Разделяем основной текст заказа и комментарий
    order_text_lines = []
    comment_lines = []
    in_comment_section = False
    
    for line in order_lines:
        lower_line = line.lower()
        if lower_line.startswith("комментарий:") or lower_line.startswith("комментарий"):
            in_comment_section = True
            # Убираем префикс "Комментарий:" из первой строки комментария
            comment_line = re.sub(r"^комментарий:\s*", "", line, flags=re.IGNORECASE).strip()
            if comment_line:
                comment_lines.append(comment_line)
            continue
        
        if in_comment_section:
            comment_lines.append(line)
        else:
            order_text_lines.append(line)
    
    order_text = "\n".join(order_text_lines).strip()
    comment_text = "\n".join(comment_lines).strip()
    
    print(f"Order text: '{order_text}'")
    print(f"Comment text: '{comment_text}'")
    
    if not order_text:
        return None

    result = {
        "full_name": full_name,
        "username": username,
        "order_text": order_text,
        "user_id": user_id,
    }
    
    # Добавляем комментарий только если он есть
    if comment_text:
        result["comment"] = comment_text
    
    return result


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
    print(f"DEBUG: Получено сообщение: '{text}'")
    action, cleaned_text = extract_action(text)
    print(f"DEBUG: action={action}, cleaned_text='{cleaned_text}'")
    if not action or not cleaned_text:
        return

    order_details = parse_order_message(cleaned_text, action)

    if not order_details:
        print("Failed to parse order message, skipping.")
        return

    sender = await event.get_sender()
    chat = await event.get_chat()
    input_chat = await event.get_input_chat()
    topic_id = extract_topic_id(event)

    parsed_full_name = order_details.get("full_name", "")
    
    # Получаем fullName из users.json или используем firstName из Telegram
    user_id = getattr(sender, "id", None)
    username = getattr(sender, "username", None)
    full_name_from_users = get_user_full_name(user_id, username) if user_id else None
    
    # Определяем тип сообщения по наличию parsed_full_name
    if parsed_full_name:
        # Это сообщение с шапкой "Новый заказ от" - используем имя из шапки
        effective_full_name = parsed_full_name
    else:
        # Это сообщение @хочу - используем имя из users.json
        effective_full_name = (
            full_name_from_users
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
        "userId": user_id,
        "userName": username,
        "chatTitle": getattr(chat, "title", "") or "",
        "topicId": topic_id or 0,
        "fullName": effective_full_name,
        "sourceMessage": cleaned_text,
    }
    
    # Добавляем комментарий в payload если он есть
    if "comment" in order_details:
        payload["comment"] = order_details["comment"]
        print(f"Added comment to payload: '{order_details['comment']}'")
    else:
        print("No comment found in order_details")
    
    print(f"Final payload: {payload}")

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


