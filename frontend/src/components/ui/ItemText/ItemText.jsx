import styles from "./item-text.module.css";
const ItemText = ({ text }) => {
  return (
    <div className={styles.itemTextContainer}>
      <span className={styles.itemText}>{text}</span>
    </div>
  );
};

export default ItemText;
