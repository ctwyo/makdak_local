import styles from "./item-name.module.css";

const ItemName = ({ name }) => {
  return <span className={styles.itemName}>{name}</span>;
};

export default ItemName;
