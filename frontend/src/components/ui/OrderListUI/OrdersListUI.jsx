import { useEffect, useState } from "react";
import Loader from "../../Loader/Loader";
import Order from "../../Order/Order";
import OrderCard from "../../OrderCard/OrderCard";
import styles from "./orders-list-ui.module.css";
const OrderListUI = ({ orders }) => {
  const readyOrders = orders
    .filter((order) => order.status === "ready")
    .sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt));

  const pendingOrders = orders
    .filter((order) => order.status === "pending")
    .sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt));

  if (!orders) {
    return <Loader />;
  }

  const totalOrders = readyOrders.length + pendingOrders.length;
  const stripeWidth = totalOrders > 0 ? Math.max(150, totalOrders * 160) : 0;

  return (
    <div className={styles.listWrapper}>
      <ul className={styles.list}>
        {pendingOrders.map((order) => (
          <Order key={order._id} order={order} />
        ))}
      </ul>

      <ul className={styles.list}>
        {readyOrders.map((order) => (
          <Order key={order._id} order={order} />
        ))}
      </ul>
      {/* {stripeWidth > 0 && (
        <div
          className={styles.glowingStripe}
          style={{ width: `${stripeWidth}px` }}
        ></div>
      )} */}
    </div>
  );
};

export default OrderListUI;
