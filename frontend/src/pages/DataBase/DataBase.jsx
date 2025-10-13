import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchDoneOrders } from "../../features/slices/ordersThunks";
import { selectDoneOrders, selectOrdersLoading, selectOrdersError } from "../../features/slices/ordersSlice";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Chip,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Divider,
  Button,
  ButtonGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { ru } from "date-fns/locale";
import Loader from "../../components/Loader/Loader";
import { 
  parseEquipment, 
  getUniqueFullNames,
  isDateInRange
} from "../../helpers/parseEquipment";

const DataBase = () => {
  const dispatch = useDispatch();
  const doneOrders = useSelector(selectDoneOrders);
  const loading = useSelector(selectOrdersLoading);
  const error = useSelector(selectOrdersError);

  // Режим просмотра
  const [viewMode, setViewMode] = useState('orders'); // 'orders' или 'equipment'

  // Фильтры для заказов
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [selectedUser, setSelectedUser] = useState("");
  const [equipmentFilter, setEquipmentFilter] = useState("");

  // Фильтры для оборудования
  const [equipmentStartDate, setEquipmentStartDate] = useState(null);
  const [equipmentEndDate, setEquipmentEndDate] = useState(null);
  const [equipmentSelectedUser, setEquipmentSelectedUser] = useState("");
  const [equipmentSearch, setEquipmentSearch] = useState("");

  // Модальное окно для деталей заказа
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetailsOpen, setOrderDetailsOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchDoneOrders());
  }, [dispatch]);

  // Получаем уникальные имена пользователей
  const uniqueFullNames = useMemo(() => getUniqueFullNames(doneOrders), [doneOrders]);

  // Фильтрация заказов
  const filteredOrders = useMemo(() => {
    return doneOrders.filter(order => {
      // Фильтр по диапазону дат
      if (startDate || endDate) {
        if (!isDateInRange(order.createdAt, startDate, endDate)) {
          return false;
        }
      }

      // Фильтр по пользователю
      if (selectedUser && order.fullName) {
        if (order.fullName !== selectedUser) {
          return false;
        }
      }

      // Фильтр по оборудованию
      if (equipmentFilter) {
        const equipment = parseEquipment(order.text);
        const hasEquipment = equipment.some(item => 
          item.name.toLowerCase().includes(equipmentFilter.toLowerCase())
        );
        if (!hasEquipment) {
          return false;
        }
      }

      return true;
    });
  }, [doneOrders, startDate, endDate, selectedUser, equipmentFilter]);

  // Фильтрация для поиска по оборудованию
  const equipmentFilteredOrders = useMemo(() => {
    return doneOrders.filter(order => {
      // Фильтр по диапазону дат
      if (equipmentStartDate || equipmentEndDate) {
        if (!isDateInRange(order.createdAt, equipmentStartDate, equipmentEndDate)) {
          return false;
        }
      }

      // Фильтр по пользователю
      if (equipmentSelectedUser && order.fullName) {
        if (order.fullName !== equipmentSelectedUser) {
          return false;
        }
      }

      return true;
    });
  }, [doneOrders, equipmentStartDate, equipmentEndDate, equipmentSelectedUser]);

  // Получаем оборудование из отфильтрованных заказов для поиска
  const equipmentFromFilteredOrders = useMemo(() => {
    const equipmentMap = {};
    
    equipmentFilteredOrders.forEach(order => {
      const equipment = parseEquipment(order.text);
      
      equipment.forEach(item => {
        // Если есть поиск по оборудованию, показываем только его
        if (equipmentSearch && !item.name.toLowerCase().includes(equipmentSearch.toLowerCase())) {
          return;
        }
        
        if (!equipmentMap[item.name]) {
          equipmentMap[item.name] = {
            name: item.name,
            totalQuantity: 0,
            orders: []
          };
        }
        
        const quantity = item.quantity || 0;
        equipmentMap[item.name].totalQuantity += quantity;
        equipmentMap[item.name].orders.push({
          orderId: order.id,
          quantity: quantity,
          date: order.createdAt,
          fullName: order.fullName
        });
      });
    });
    
    return Object.values(equipmentMap);
  }, [equipmentFilteredOrders, equipmentSearch]);

  const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear());
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${day}.${month}.${year} ${hours}:${minutes}`;
  };

  const handleOrderClick = (order) => {
    setSelectedOrder(order);
    setOrderDetailsOpen(true);
  };

  const handleCloseOrderDetails = () => {
    setOrderDetailsOpen(false);
    setSelectedOrder(null);
  };

  // Открыть детали заказа из списка оборудования
  const handleEquipmentOrderClick = (orderId) => {
    const order = doneOrders.find((o) => o.id === orderId);
    if (order) {
      setSelectedOrder(order);
      setOrderDetailsOpen(true);
    }
  };

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return <Typography color="error">Ошибка: {error}</Typography>;
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          База данных завершенных заказов
        </Typography>

        {/* Переключатель режимов */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
          <ButtonGroup variant="contained" aria-label="outlined primary button group">
            <Button 
              onClick={() => setViewMode('orders')}
              color={viewMode === 'orders' ? 'primary' : 'inherit'}
            >
              Фильтр по заказам
            </Button>
            <Button 
              onClick={() => setViewMode('equipment')}
              color={viewMode === 'equipment' ? 'primary' : 'inherit'}
            >
              Поиск по оборудованию
            </Button>
          </ButtonGroup>
        </Box>

        {/* Режим: Фильтр по заказам */}
        {viewMode === 'orders' && (
          <>
            {/* Фильтры для заказов */}
            <Card sx={{ mb: 3 }}>
              <CardHeader title="Фильтры для заказов" />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <DatePicker
                      label="Дата от"
                      value={startDate}
                      onChange={setStartDate}
                      renderInput={(params) => <TextField {...params} fullWidth />}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <DatePicker
                      label="Дата до"
                      value={endDate}
                      onChange={setEndDate}
                      renderInput={(params) => <TextField {...params} fullWidth />}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>Пользователь</InputLabel>
                      <Select
                        value={selectedUser}
                        onChange={(e) => setSelectedUser(e.target.value)}
                        label="Пользователь"
                      >
                        <MenuItem value="">Все пользователи</MenuItem>
                        {uniqueFullNames.map(name => (
                          <MenuItem key={name} value={name}>
                            {name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      label="Оборудование"
                      value={equipmentFilter}
                      onChange={(e) => setEquipmentFilter(e.target.value)}
                      placeholder="Фильтр по оборудованию..."
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Статистика */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6">
                Найдено заказов: {filteredOrders.length} из {doneOrders.length}
              </Typography>
            </Box>

            {/* Таблица заказов */}
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>№</TableCell>
                    <TableCell>Дата создания</TableCell>
                    <TableCell>Имя пользователя</TableCell>
                    <TableCell>Статус</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredOrders.map((order, index) => (
                    <TableRow 
                      key={order._id}
                      hover
                      onClick={() => handleOrderClick(order)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>{order.id}</TableCell>
                      <TableCell>{formatDate(order.createdAt)}</TableCell>
                      <TableCell>{order.fullName || "Не указано"}</TableCell>
                      <TableCell>
                        <Chip
                          label={order.status === "done" ? "Завершен" : order.status}
                          color={order.status === "done" ? "success" : "default"}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {filteredOrders.length === 0 && (
              <Typography variant="body1" sx={{ textAlign: 'center', mt: 3 }}>
                Заказы не найдены
              </Typography>
            )}
          </>
        )}

        {/* Режим: Поиск по оборудованию */}
        {viewMode === 'equipment' && (
          <>
            {/* Фильтры для оборудования */}
            <Card sx={{ mb: 3 }}>
              <CardHeader title="Фильтры для поиска оборудования" />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <DatePicker
                      label="Дата от"
                      value={equipmentStartDate}
                      onChange={setEquipmentStartDate}
                      renderInput={(params) => <TextField {...params} fullWidth />}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <DatePicker
                      label="Дата до"
                      value={equipmentEndDate}
                      onChange={setEquipmentEndDate}
                      renderInput={(params) => <TextField {...params} fullWidth />}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>Пользователь</InputLabel>
                      <Select
                        value={equipmentSelectedUser}
                        onChange={(e) => setEquipmentSelectedUser(e.target.value)}
                        label="Пользователь"
                      >
                        <MenuItem value="">Все пользователи</MenuItem>
                        {uniqueFullNames.map(name => (
                          <MenuItem key={name} value={name}>
                            {name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      label="Оборудование"
                      value={equipmentSearch}
                      onChange={(e) => setEquipmentSearch(e.target.value)}
                      placeholder="Поиск по оборудованию..."
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Статистика по оборудованию */}
            {equipmentFromFilteredOrders.length > 0 && (
              <Card>
                <CardHeader title="Статистика по оборудованию" />
                <CardContent>
                  {equipmentFromFilteredOrders.map((equipment, index) => (
                    <Box key={index} sx={{ mb: 2 }}>
                      <Typography variant="h6" sx={{ mb: 1 }}>
                        {equipment.name}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <Chip 
                          label={`Всего: ${equipment.totalQuantity}`} 
                          color="primary" 
                          size="small" 
                        />
                        <Chip 
                          label={`Заказов: ${equipment.orders.length}`} 
                          color="secondary" 
                          size="small" 
                        />
                      </Box>
                      <Box sx={{ ml: 2 }}>
                    {equipment.orders.map((order, idx) => (
                      <Typography
                        key={idx}
                        variant="body2"
                        sx={{ mb: 0.5, cursor: 'pointer', textDecoration: 'underline' }}
                        onClick={() => handleEquipmentOrderClick(order.orderId)}
                      >
                        Заказ #{order.orderId} - {order.quantity} шт. ({formatDate(order.date)}) - {order.fullName}
                      </Typography>
                    ))}
                      </Box>
                      {index < equipmentFromFilteredOrders.length - 1 && <Divider sx={{ mt: 2 }} />}
                    </Box>
                  ))}
                </CardContent>
              </Card>
            )}

            {equipmentFromFilteredOrders.length === 0 && (
              <Typography variant="body1" sx={{ textAlign: 'center', mt: 3 }}>
                Оборудование не найдено
              </Typography>
            )}
          </>
        )}

        {/* Модальное окно с деталями заказа */}
        <Dialog 
          open={orderDetailsOpen} 
          onClose={handleCloseOrderDetails}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Детали заказа #{selectedOrder?.id}
          </DialogTitle>
          <DialogContent>
            {selectedOrder && (
              <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Заказ #{selectedOrder.id}
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>Дата создания:</strong> {formatDate(selectedOrder.createdAt)}
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>Дата завершения:</strong> {formatDate(selectedOrder.updatedAt)}
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>Пользователь:</strong> {selectedOrder.fullName || "Не указано"}
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  <strong>Статус:</strong> {selectedOrder.status === "done" ? "Завершен" : selectedOrder.status}
                </Typography>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Заказанное оборудование:
                </Typography>
                <List dense sx={{ mb: 1 }}>
                  {parseEquipment(selectedOrder.text).map((item, idx) => (
                    <ListItem key={idx} disableGutters sx={{ py: 0.5 }}>
                      <Box
                        sx={{
                          width: '100%',
                          bgcolor: 'action.hover',
                          border: '1px solid',
                          borderColor: 'divider',
                          px: 1.5,
                          py: 1,
                          borderRadius: 1,
                        }}
                      >
                        <Typography variant="body1">{item.name}</Typography>
                        {item.quantity !== null && (
                          <Typography variant="caption" color="text.secondary">
                            {item.quantity} шт.
                          </Typography>
                        )}
                      </Box>
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseOrderDetails}>Закрыть</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default DataBase;
