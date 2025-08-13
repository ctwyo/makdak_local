import { useDispatch, useSelector } from "react-redux";
import styles from "./makdak-list-ui.module.css";
import { selectOrders } from "../../../features/slices/ordersSlice";
import Loader from "../../Loader/Loader";
import MakDakOrder from "../MakDakOrder/MakDakOrder";
import { useEffect } from "react";
import { fetchOrders } from "../../../features/slices/ordersThunks";
export const MakDakListUI = () => {
  const orders = useSelector(selectOrders);

  if (!orders) {
    return <Loader />;
  }

  const readyOrders = orders
    .filter((order) => order.status === "ready")
    .sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt));

  const pendingOrders = orders
    .filter((order) => order.status === "pending")
    .sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt));

  return (
    <>
      <div className={styles.makdakHeader}>
        <h2>В процессе</h2>
        <h2>Готово</h2>
      </div>
      <div className={styles.listWrapper}>
        <ul className={styles.list}>
          {pendingOrders.map((order) => (
            <MakDakOrder key={order._id} order={order} />
          ))}
        </ul>

        <ul className={styles.list}>
          {readyOrders.map((order) => (
            <MakDakOrder key={order._id} order={order} />
          ))}
        </ul>
      </div>
    </>
  );
};
