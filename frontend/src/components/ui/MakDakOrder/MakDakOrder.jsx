import React from "react";
import {
  Card,
  CardContent,
  CardActions,
  Button,
  Typography,
  CardHeader,
} from "@mui/material";
import styles from "./makdak-order.module.css";
import Loader from "../../Loader/Loader";
import Robot from "../../Robot/Robot";

const MakDakOrder = ({ order }) => {
  const { firstName, lastName, text, status, id, action, updatedAt, fullName } =
    order;

  const getFirstLine = (text) => {
    if (!text) return "";
    const lines = text.split("\n");
    return lines[0];
  };

  const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Месяцы начинаются с 0
    const year = String(date.getFullYear()).slice(2); // Берем только последние 2 цифры
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0"); // Добавляем секунды

    return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;
  };

  return (
    <Card
      className={`${styles.card} ${action === "montazh" ? styles.montazh : ""}`}
    >
      <CardContent className={styles.cardContent}>
        <div className={styles.headerContainer}>
          <Typography
            variant="h6"
            component="div"
            textAlign={"left"}
            className={styles.fullName}
          >
            {fullName || `${firstName} ${lastName}`}
            {/* {firstName} {lastName} */}
          </Typography>
          <Typography variant="body2" color="text.primary" fontSize={"2rem"}>
            {id}
          </Typography>
        </div>
        {action === "montazh" ? (
          <Typography
            textAlign={"left"}
            fontSize={"15px"}
            sx={{
              whiteSpace: "nowrap", // Запрещает перенос строки
              overflow: "hidden", // Обрезает содержимое, выходящее за границы
              textOverflow: "ellipsis", // Добавляет многоточие
            }}
          >
            {getFirstLine(text)}
          </Typography>
        ) : null}
        <Typography variant="body2" color="text.secondary" textAlign={"right"}>
          {formatDate(updatedAt)}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default MakDakOrder;
