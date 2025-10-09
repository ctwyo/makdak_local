import styles from "./item-status.module.css";
import DoneIcon from "@mui/icons-material/Done";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import DoneAllIcon from "@mui/icons-material/DoneAll";

const statusComponents = {
  ready: DoneIcon,
  pending: PendingActionsIcon,
  done: DoneAllIcon,
};

const ItemStatus = ({ status }) => {
  const StatusIcon = statusComponents[status] || null;
  return (
    <div className={`${styles.itemStatus} ${styles[`status-${status}`]}`}>
      {StatusIcon && <StatusIcon className={styles.itemDone} />}
      <span>{status}</span>
    </div>
  );
};

export default ItemStatus;
