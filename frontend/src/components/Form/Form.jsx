import { Button, TextField } from "@mui/material";
import styles from "./form.module.css";
import { useState } from "react";

import { useDispatch, useSelector } from "react-redux";
import { addOrderApi } from "../../features/slices/ordersThunks";
import { selectUserName } from "../../features/slices/userSlice";
import TelegramMessage from "../TelegramMessage/TelegramMessage";

const Form = () => {
  const dispatch = useDispatch();
  const [input, setInput] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const userName = useSelector(selectUserName);

  const handleClick = async () => {
    if (input) {
      try {
        await dispatch(
          addOrderApi({ text: input, fullName: userName })
        ).unwrap();

        setInput("");
      } catch (err) {
        console.error("Failed to add new order", err);
      }
    }
  };

  return (
    <form className={styles.form}>
      <div className={styles.container}>
        <TextField
          value={input}
          id="outlined-basic"
          label="Заказ"
          variant="outlined"
          onChange={(e) => setInput(e.target.value)}
          className={styles.textField}
        />
        <Button
          disabled={!input.trim()}
          onClick={handleClick}
          variant="contained"
          className={styles.button}
        >
          Добавить заказ
        </Button>
        <TelegramMessage
          isModalOpen={isModalOpen}
          setIsModalOpen={setIsModalOpen}
          onClick={() => setIsModalOpen(true)}
        />
      </div>
    </form>
  );
};

export default Form;
