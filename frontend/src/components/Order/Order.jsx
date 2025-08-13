import { useDispatch, useSelector } from "react-redux";
import Loader from "../Loader/Loader";
import OrderUI from "../ui/OrderUI/OrderUI";
import {
  deleteOrderApi,
  updateOrderStatusApi,
  updateOrderTextApi,
} from "../../features/slices/ordersThunks";
import { selectOrdersLoading } from "../../features/slices/ordersSlice";

import { useState } from "react";
import OrderCard from "../OrderCard/OrderCard";
import { createDocument } from "../../helpers/createDocument";
import { parseOrder } from "../../helpers/parseOrder";
const Order = ({ order }) => {
  const { text, id, _id, fullName } = order;
  const dispatch = useDispatch();
  const [isDeleting, setIsDeleting] = useState(false);
  const isLoading = useSelector(selectOrdersLoading);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(text);

  const handleDelete = async (event) => {
    event.stopPropagation();
    setIsDeleting(true);
    try {
      await dispatch(deleteOrderApi(_id)).unwrap();
      setIsDeleting(false);
    } catch (err) {
      console.error("Failed to delete order", err);
      setIsDeleting(false);
    }
  };
  const handleDone = async (event) => {
    event.stopPropagation();
    try {
      await dispatch(updateOrderStatusApi(_id)).unwrap();
      console.log("done", _id);
    } catch (err) {
      console.error("Failed to update order", err);
    }
  };

  const handleSaveText = async () => {
    setIsEditing(false);
    try {
      await dispatch(updateOrderTextApi({ id: id, text: editedText })).unwrap();
    } catch (err) {
      console.error("Failed to update order text", err);
    }

    setIsModalOpen(false);
  };

  const handleOpen = () => setIsModalOpen(true);
  const handleClose = () => {
    setIsModalOpen(false);
    setIsEditing(false);
  };

  const handleDownload = () => {
    const parsedOrderText = parseOrder(text);
    console.log(parsedOrderText);
    createDocument(parsedOrderText, fullName);
  };

  return (
    <>
      {isLoading ? (
        <Loader />
      ) : (
        <OrderCard
          isDeleting={isDeleting}
          onDelete={handleDelete}
          onDone={handleDone}
          order={order}
          saveText={handleSaveText}
          isModalOpen={isModalOpen}
          setIsModalOpen={setIsModalOpen}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          editedText={editedText}
          setEditedText={setEditedText}
          onDownload={handleDownload}
        />
      )}
    </>
  );
};

export default Order;
