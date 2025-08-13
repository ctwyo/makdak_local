import { IconButton } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import styles from "./done-button.module.css";
const DoneButton = ({ status, onDone }) => {
  if (status !== "pending") return null;
  return (
    <IconButton
      sx={{ padding: "10px" }}
      className={styles.itemDone}
      onClick={onDone}
    >
      <CheckCircleIcon />
    </IconButton>
  );
};

export default DoneButton;
