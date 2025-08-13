import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Modal,
  TextField,
  Typography,
} from "@mui/material";
import DoneIcon from "@mui/icons-material/Done";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import styles from "./order-card.module.css";
import { useSelector } from "react-redux";
import { selectOrdersLoading } from "../../features/slices/ordersSlice";
import ArticleIcon from "@mui/icons-material/Article";

const OrderCard = ({
  order,
  onDelete,
  onDone,
  saveText,
  isModalOpen,
  setIsModalOpen,
  isEditing,
  setIsEditing,
  editedText,
  setEditedText,
  onDownload,
}) => {
  const isLoading = useSelector(selectOrdersLoading);
  const {
    id,
    text,
    firstName,
    lastName,
    status,
    action,
    updatedAt,
    fromTelegram,
    fullName,
  } = order;

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

  const handleCardClick = () => setIsModalOpen(true);

  const formatText = (text) => {
    return text.split("\n").map((line, index) => (
      <span key={index}>
        {" "}
        {line} <br />{" "}
      </span>
    ));
  };

  return (
    <>
      {/* <Grow in={true} timeout={500}> */}
      <Card
        className={`${styles.card} ${
          action === "montazh" ? styles.montazhCard : ""
        }`}
        onClick={handleCardClick}
        sx={{ padding: "10px" }}
      >
        <CardHeader
          sx={{ padding: "0px" }}
          avatar={
            <Typography className={styles.itemId}>
              {action === "montazh" ? "М" : ""}
              {id}
            </Typography>
          }
          action={
            <div className={styles.itemButtons}>
              {fromTelegram && action !== "montazh" && (
                <IconButton
                  sx={{
                    "&:focus, &:focus-within": {
                      outline: "none",
                      boxShadow: "none",
                    },
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDownload();
                  }}
                >
                  <ArticleIcon />
                </IconButton>
              )}
              <div
                className={`${styles.itemStatus} ${styles[`status-${status}`]}`}
              >
                {status === "ready" && (
                  <DoneIcon className={styles.itemReady} />
                )}
              </div>

              {status === "pending" && (
                <IconButton
                  sx={{
                    "&:focus, &:focus-within": {
                      outline: "none",
                      boxShadow: "none",
                      padding: "10px",
                    },
                  }}
                  className={styles.itemDone}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDone(e);
                  }}
                >
                  <CheckCircleIcon />
                </IconButton>
              )}
              <IconButton
                className={styles.itemDeleteButton}
                sx={{
                  "&:focus, &:focus-within": {
                    outline: "none",
                    boxShadow: "none",
                    padding: "10px",
                  },
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(e);
                }}
              >
                <DeleteIcon />
              </IconButton>
            </div>
          }
          title={
            <Typography className={styles.itemName}>
              {fullName || `${firstName} ${lastName}`}
              {/* {firstName} {lastName} */}
            </Typography>
          }
          className={styles.cardHeader}
        />
        <CardContent
          className={styles.textContainer}
          sx={{
            padding: "0px",
            "&:last-child": { paddingBottom: "0px" },
          }}
        >
          <Typography
            variant="body2"
            color="textSecondary"
            component="p"
            textAlign="left"
            className={styles.itemText}
          >
            {formatText(text)}
          </Typography>

          <Typography
            color="textSecondary"
            component="p"
            fontSize="10px"
            textAlign="right"
          >
            {formatDate(updatedAt)}
          </Typography>
        </CardContent>
      </Card>
      {/* </Grow> */}

      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <Box
          className={`${styles.ModalBox} ${styles.scrollBarTheme}`}
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: 350, sm: 400, md: 500 },
            bgcolor: "background.paper",
            boxShadow: 24,
            p: { xs: 2, sm: 4 },
            borderRadius: "8px",
            maxHeight: "80vh",
            overflowY: "auto",
          }}
        >
          <Typography variant="h6" component="h2" mb={2}>
            {firstName}
          </Typography>

          {isEditing ? (
            <TextField
              className={styles.itemTextField}
              fullWidth
              multiline
              rows={12}
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              sx={{
                width: "100%", // Увеличиваем ширину
                minHeight: "300px", // Задаем минимальную высоту
                fontSize: "1.1rem", // Увеличиваем размер шрифта
                padding: "12px", // Добавляем внутренний отступ
              }}
            />
          ) : (
            <Typography variant="body1" sx={{ mb: 2 }}>
              {formatText(text)}
            </Typography>
          )}

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            {isEditing ? (
              <>
                <Button variant="contained" color="primary" onClick={saveText}>
                  Сохранить
                </Button>
                <Button onClick={() => setIsEditing(false)}>Отменить</Button>
              </>
            ) : (
              <Button variant="outlined" onClick={() => setIsEditing(true)}>
                Редактировать
              </Button>
            )}

            <Button onClick={() => setIsModalOpen(false)}>Закрыть</Button>
          </div>
        </Box>
      </Modal>
    </>
  );
};

export default OrderCard;
