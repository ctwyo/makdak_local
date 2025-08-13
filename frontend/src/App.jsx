import { useEffect } from "react";
import "./App.css";
import { Layout } from "./components/Layout/Layout";
import MakDakPage from "./pages/MakDakPage/MakDakPage";
import OrdersPage from "./pages/OrdersPage/OrdersPage";
import { useDispatch, useSelector } from "react-redux";
import { fetchOrders, LOCAL_IP, NGROK } from "./features/slices/ordersThunks";
import AppRoutes from "./routes";
import { Navigate, Route, useNavigate } from "react-router";
import {
  selectUserId,
  selectUserName,
  setUserId,
  setUserName,
} from "./features/slices/userSlice";
import {
  addOrderToState,
  removeOrderFromState,
  updateOrderStatus,
  updateOrderText,
} from "./features/slices/ordersSlice";

function App() {
  const dispatch = useDispatch();
  const userId = useSelector(selectUserId);
  const userName = useSelector(selectUserName);
  const navigate = useNavigate();

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    const userName = localStorage.getItem("userName");
    dispatch(setUserId(userId));
    dispatch(setUserName(userName));
    dispatch(fetchOrders());
    if (!userName || userName === "null") {
      navigate("/registration");
    }
  }, [dispatch]);

  useEffect(() => {
    let socket;

    const connectSocket = () => {
      socket = new WebSocket(`ws://${LOCAL_IP}:3000`);
      // socket = new WebSocket(`wss://${LOCAL_IP}:3000`);
      // socket = new WebSocket(`wss://${NGROK}`);
      console.log("socket open");

      socket.onmessage = async (event) => {
        const data = JSON.parse(event.data);

        if (data.type === "new-order" && data.order.userId !== userId) {
          console.log("new order from ws", data.order);
          dispatch(addOrderToState(data.order));
        }

        if (data.type === "delete-order" && data.userId !== userId) {
          console.log("delete order from ws ", data.id);
          dispatch(removeOrderFromState(data.id));
        }

        if (data.type === "update-order" && data.userId !== userId) {
          console.log("update order from ws", data.order.id);
          dispatch(updateOrderStatus(data.order));
        }

        if (data.type === "update-order-text" && data.userId !== userId) {
          console.log(`text ws: ${data.order.text}`);
          dispatch(updateOrderText(data.order));
        }
      };

      socket.onclose = () => {
        console.log("socket closed, reconnecting...");
        setTimeout(() => connectSocket(), 1000); // Попытка переподключения через 1 секунду
      };
    };

    connectSocket();

    return () => socket && socket.close();
  }, [dispatch, userId]);

  return <AppRoutes />;
}

export default App;
