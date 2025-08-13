import { useSelector } from "react-redux";
import OrderListUI from "../ui/OrderListUI/OrdersListUI";

import {
  selectOrders,
  selectOrdersError,
  selectOrdersLoading,
} from "../../features/slices/ordersSlice";
import Loader from "../Loader/Loader";

const OrdersList = () => {
  const orders = useSelector(selectOrders);
  const isError = useSelector(selectOrdersError);
  const isLoading = useSelector(selectOrdersLoading);

  if (isError) {
    return <div>Ошибка: {isError}</div>;
  }

  return <>{isLoading ? <Loader /> : <OrderListUI orders={orders} />}</>;
};

export default OrdersList;
