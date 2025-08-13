import {
  Box,
  Button,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Modal,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import TelegramIcon from "@mui/icons-material/Telegram";
import styles from "./telegram-message.module.css";
import {
  fetchChats,
  sendMessgageToTelegram,
} from "../../features/slices/ordersThunks";
import { useEffect, useState } from "react";

const TelegramMessage = ({ isModalOpen, setIsModalOpen }) => {
  const [message, setMessage] = useState("");
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const chatsData = await fetchChats();

      setChats(chatsData);
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!isModalOpen) {
      setSelectedChat(""); // Сброс выбранного чата при закрытии модалки
    }
  }, [isModalOpen]);

  const handleSendMessage = () => {
    if (selectedChat && message !== "") {
      const chatId = selectedChat.chatId;
      const topicId = selectedChat.topicId;

      sendMessgageToTelegram(topicId, message, chatId);
      setMessage("");
      setIsModalOpen(false);
    } else {
      console.log("Чат не выбран");
    }
  };

  return (
    <>
      <IconButton
        sx={{
          "&:focus, &:focus-within": {
            outline: "none",
            boxShadow: "none",
          },
        }}
        onClick={() => setIsModalOpen(true)}
      >
        <TelegramIcon
          sx={{ width: "40px", height: "40px", paddingRight: "5px" }}
        />
      </IconButton>
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            maxWidth: 500,
            minWidth: 350,
            bgcolor: "background.paper",
            boxShadow: 24,
            p: { xs: 2, sm: 4 },
            borderRadius: "8px",
          }}
        >
          <Typography variant="body1" sx={{ marginBottom: "10px" }}>
            Отправить сообщение в группу Заказ оборудования
          </Typography>

          <FormControl fullWidth>
            <InputLabel id="demo-simple-select-label">Кому</InputLabel>
            <Select
              labelId="demo-simple-select-label"
              id="demo-simple-select"
              value={selectedChat}
              onChange={(e) => setSelectedChat(e.target.value)}
              label="Кому"
            >
              {chats.length > 0 ? (
                chats.map((chat) => (
                  <MenuItem key={chat.topicId} value={chat}>
                    {chat.chatTitle}-{chat.topicId}
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled>Нет чатов</MenuItem>
              )}
            </Select>
          </FormControl>

          <TextField
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            multiline
            rows={6}
            fullWidth
            className={styles.textfield}
            label="Введите сообщение"
            variant="outlined"
            sx={{
              marginBottom: 2,
              "& .MuiOutlinedInput-root": {
                height: "200px", // Высота TextField
                alignItems: "flex-start", // Текст начинается сверху
              },
            }}
          />
          <Button
            variant="contained"
            disabled={!message}
            color="primary"
            onClick={() => {
              handleSendMessage();
            }}
          >
            Отправить
          </Button>
        </Box>
      </Modal>
    </>
  );
};

export default TelegramMessage;
