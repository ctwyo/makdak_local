import Form from "../../components/Form/Form";
import Loader from "../../components/Loader/Loader";
import OrdersList from "../../components/OrdersList/OrdersList";
import ThemeButton from "../../components/ThemeButton/ThemeButton";
import styles from "./orders-page.module.css";
const OrdersPage = () => {
  return (
    <div className={styles.pageWrapper}>
      <Form />
      <OrdersList />
    </div>
  );
};

export default OrdersPage;
