import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  deleteUserApi,
  fetchCouriersApi,
  updateUserApi,
} from "../../features/slices/databaseSlice";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  Paper,
  CircularProgress,
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import Loader from "../../components/Loader/Loader";

const DataBase = () => {
  const dispatch = useDispatch();
  const { couriers, loading, error } = useSelector((state) => state.database);

  const [editedData, setEditedData] = useState({});
  const [editingId, setEditingId] = useState(null); // ID редактируемой записи
  const [deleteId, setDeleteId] = useState(null); // ID для удаления

  useEffect(() => {
    dispatch(fetchCouriersApi());
  }, [dispatch]);

  const handleEdit = (id, field, value) => {
    setEditedData((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const handleSave = (id) => {
    const userData = editedData[id];
    if (!userData) return;

    dispatch(updateUserApi({ id, data: userData })).unwrap();
    setEditedData((prev) => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
    setEditingId(null); // Выход из режима редактирования
  };

  const handleCancel = () => {
    setEditedData((prev) => {
      const { [editingId]: _, ...rest } = prev;
      return rest;
    });
    setEditingId(null); // Отмена редактирования
  };

  const handleDelete = (id) => {
    // Здесь можно добавить логику удаления через API
    dispatch(deleteUserApi(id)).unwrap();
    console.log("Удалено:", id);
    setDeleteId(null);
  };

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return <Typography color="error">Ошибка: {error}</Typography>;
  }

  return (
    <>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>№</TableCell>
              <TableCell>Полное имя</TableCell>
              <TableCell>ID телеграм</TableCell>
              <TableCell>Роль</TableCell>
              <TableCell>Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {couriers.map((courier, index) => {
              const isEditing = editingId === courier.userId;
              return (
                <TableRow key={courier.userId}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    {isEditing ? (
                      <TextField
                        value={
                          editedData[courier.userId]?.fullName ||
                          courier.fullName
                        }
                        onChange={(e) =>
                          handleEdit(courier.userId, "fullName", e.target.value)
                        }
                        size="small"
                      />
                    ) : (
                      courier.fullName
                    )}
                  </TableCell>
                  <TableCell>{courier.userName}</TableCell>
                  <TableCell>
                    {isEditing ? (
                      <TextField
                        select
                        SelectProps={{ native: true }}
                        value={editedData[courier.userId]?.role || courier.role}
                        onChange={(e) =>
                          handleEdit(courier.userId, "role", e.target.value)
                        }
                        size="small"
                      >
                        <option value="courier">courier</option>
                        <option value="admin">admin</option>
                      </TextField>
                    ) : (
                      courier.role
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <>
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={() => handleSave(courier.userId)}
                        >
                          Сохранить
                        </Button>
                        <Button
                          variant="outlined"
                          color="secondary"
                          onClick={handleCancel}
                          style={{ marginLeft: 8 }}
                        >
                          Отмена
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="outlined"
                          onClick={() => {
                            setEditingId(courier.userId);
                            setEditedData((prev) => ({
                              ...prev,
                              [courier.userId]: {
                                fullName: courier.fullName,
                                role: courier.role,
                              },
                            }));
                          }}
                        >
                          Редактировать
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          onClick={() => setDeleteId(courier.userId)}
                          style={{ marginLeft: 8 }}
                        >
                          Удалить
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Диалог для подтверждения удаления */}
      <Dialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">Удалить запись?</DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Вы уверены, что хотите удалить эту запись? Это действие нельзя
            отменить.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)} color="primary">
            Отмена
          </Button>
          <Button
            onClick={() => handleDelete(deleteId)}
            color="error"
            autoFocus
          >
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DataBase;
