import styles from "./item-status.module.css";
import DoneIcon from "@mui/icons-material/Done";
import PendingActionsIcon from "@mui/icons-material/PendingActions";

const statusComponents = {
  ready: DoneIcon,
  pending: PendingActionsIcon,
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
