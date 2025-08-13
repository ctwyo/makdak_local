import { IconButton } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import styles from "./delete-button.module.css";
const DeleteButton = ({ onDelete }) => {
  return (
    <IconButton
      className={styles.itemDeleteButton}
      sx={{ padding: "10px" }}
      onClick={onDelete}
    >
      <DeleteIcon />
    </IconButton>
  );
};

export default DeleteButton;
