import styles from "./item-id.module.css";

const ItemId = ({ id, status }) => {
  return <span className={`${styles.itemId} ${styles[status]}`}>{id}</span>;
};

export default ItemId;
