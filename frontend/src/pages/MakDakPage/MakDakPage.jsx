import { useSelector } from "react-redux";
import { MakDakListUI } from "../../components/ui/MakDakListUI/MakDakListUI";
import styles from "./makdak.module.css";
import { selectOrders } from "../../features/slices/ordersSlice";
const MakDakPage = () => {
  const orders = useSelector(selectOrders);
  return <MakDakListUI orders={orders} />;
};

export default MakDakPage;
