import {
  Box,
  Button,
  IconButton,
  Modal,
  TextField,
  Typography,
  Fade,
  Grow,
} from "@mui/material";
import styles from "./orderui.module.css";
import ItemId from "../ItemId/ItemId";
import ItemName from "../ItemName/ItemName";
import ItemStatus from "../ItemStatus/ItemStatus";
import DoneButton from "../DoneButton/DoneButton";
import DeleteButton from "../DeleteButton/DeleteButton";
import ItemText from "../ItemText/ItemText";

const OrderUI = ({
  order,
  onDelete,
  onDone,
  isDeleting,
  saveText,
  isModalOpen,
  setIsModalOpen,
  isEditing,
  setIsEditing,
  editedText,
  setEditedText,
}) => {
  const { id, text, name, status } = order;

  return (
    <>
      <Grow in={!isDeleting} timeout={300}>
        <li
          className={`${styles.item}`}
          key={id}
          onClick={() => setIsModalOpen(!isModalOpen)}
        >
          <div className={styles.itemHeader}>
            <ItemId id={id} status={status} />
            <ItemName name={name} />

            <div className={styles.itemButtons}>
              <ItemStatus status={status} />
              <DoneButton status={status} onDone={onDone} />
              <DeleteButton onDelete={onDelete} />
            </div>
          </div>
          <ItemText text={text} />
        </li>
      </Grow>

      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <Box
          className={styles.ModalBox}
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 500,
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
            borderRadius: "8px",
          }}
        >
          <Typography variant="h6" component="h2" mb={2}>
            {name}
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
              {text}
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

export default OrderUI;
