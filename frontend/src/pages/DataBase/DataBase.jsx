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
  ListItemButton,
  ListItemIcon,
  Avatar,
  Stack,
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import Checkbox from "@mui/material/Checkbox";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { ru } from "date-fns/locale";
import Loader from "../../components/Loader/Loader";
import { 
  parseEquipment, 
  getUniqueFullNames,
  getUniqueEquipmentNames,
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

  // Фильтры для оборудования
  const [equipmentStartDate, setEquipmentStartDate] = useState(null);
  const [equipmentEndDate, setEquipmentEndDate] = useState(null);
  const [equipmentSelectedUser, setEquipmentSelectedUser] = useState("");
  const [equipmentNamesSelected, setEquipmentNamesSelected] = useState([]);

  // Модальное окно для деталей заказа
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetailsOpen, setOrderDetailsOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchDoneOrders());
  }, [dispatch]);

  // Заказы только типа "zakaz" для списков-подстановок
  const zakazOnlyOrders = useMemo(
    () => doneOrders.filter((o) => !o.action || o.action === 'zakaz'),
    [doneOrders]
  );

  // Получаем уникальные имена пользователей только из zakaz
  const uniqueFullNames = useMemo(
    () => getUniqueFullNames(zakazOnlyOrders),
    [zakazOnlyOrders]
  );

  // Фильтрация заказов
  const filteredOrders = useMemo(() => {
    return doneOrders.filter(order => {
      // Показываем только заказы типа "zakaz"
      if (order.action && order.action !== 'zakaz') {
        return false;
      }
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

      // Фильтр по оборудованию удален

      return true;
    });
  }, [doneOrders, startDate, endDate, selectedUser]);

  // Фильтрация для поиска по оборудованию
  const equipmentFilteredOrders = useMemo(() => {
    return doneOrders.filter(order => {
      // Показываем только заказы типа "zakaz"
      if (order.action && order.action !== 'zakaz') {
        return false;
      }
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

  // Возможные названия оборудования (алфавитно)
  const equipmentNames = useMemo(
    () => getUniqueEquipmentNames(equipmentFilteredOrders),
    [equipmentFilteredOrders]
  );

  // Сортировка: выбранные позиции выводим сверху списка
  const sortedEquipmentNames = useMemo(() => {
    if (!equipmentNames || equipmentNames.length === 0) return [];
    if (!equipmentNamesSelected || equipmentNamesSelected.length === 0) return equipmentNames;
    const selectedSet = new Set(equipmentNamesSelected);
    const selected = equipmentNames.filter((n) => selectedSet.has(n));
    const rest = equipmentNames.filter((n) => !selectedSet.has(n));
    return [...selected, ...rest];
  }, [equipmentNames, equipmentNamesSelected]);

  // Плоский список записей по оборудованию
  const equipmentEntries = useMemo(() => {
    const entries = [];
    equipmentFilteredOrders.forEach(order => {
      const items = parseEquipment(order.text);
      items.forEach(item => {
        if (equipmentNamesSelected.length > 0 && !equipmentNamesSelected.includes(item.name)) return;
        entries.push({
          orderId: order.id,
          date: order.createdAt,
          fullName: order.fullName,
          name: item.name,
          quantity: item.quantity || 0,
        });
      });
    });
    return entries.sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [equipmentFilteredOrders, equipmentNamesSelected]);

  const totalEquipmentQuantity = useMemo(() => {
    return equipmentEntries.reduce((sum, e) => sum + (e.quantity || 0), 0);
  }, [equipmentEntries]);

  // Ранее здесь формировалась агрегированная структура по оборудованию.
  // Логику заменили на плоский список записей equipmentEntries.

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

  // Сброс фильтров поиска по оборудованию
  const handleResetEquipmentFilters = () => {
    setEquipmentStartDate(null);
    setEquipmentEndDate(null);
    setEquipmentSelectedUser("");
    setEquipmentNamesSelected([]);
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
       

        {/* Переключатель режимов */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-start' }}>
          <Stack direction="row" spacing={1}>
            <Button
              onClick={() => setViewMode('orders')}
              variant={viewMode === 'orders' ? 'contained' : 'outlined'}
              color="primary"
              startIcon={<FilterListIcon />}
              sx={{
                borderRadius: 999,
                textTransform: 'none',
                fontWeight: 600,
                px: 2.5,
                py: 1,
              }}
            >
              Фильтр по заказам
            </Button>
            <Button
              onClick={() => setViewMode('equipment')}
              variant={viewMode === 'equipment' ? 'contained' : 'outlined'}
              color="primary"
              startIcon={<SearchIcon />}
              sx={{
                borderRadius: 999,
                textTransform: 'none',
                fontWeight: 600,
                px: 2.5,
                py: 1,
              }}
            >
              Поиск по оборудованию
            </Button>
          </Stack>
        </Box>

        {/* Режим: Фильтр по заказам */}
        {viewMode === 'orders' && (
          <>
            {/* Фильтры для заказов */}
            <Card sx={{ mb: 3 }}>
              
              <CardContent>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
                    gap: 2,
                    alignItems: 'center',
                  }}
                >
                  <DatePicker
                    label="Дата от"
                    value={startDate}
                    onChange={setStartDate}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                  <DatePicker
                    label="Дата до"
                    value={endDate}
                    onChange={setEndDate}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                  <FormControl fullWidth>
                    <InputLabel>Пользователь</InputLabel>
                    <Select
                      value={selectedUser}
                      onChange={(e) => setSelectedUser(e.target.value)}
                      label="Пользователь"
                    >
                      <MenuItem value="">Все пользователи</MenuItem>
                      {uniqueFullNames.map((name) => (
                        <MenuItem key={name} value={name}>
                          {name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Box />
                </Box>
              </CardContent>
            </Card>

            {/* Статистика (как в поиске по оборудованию) */}
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Stack direction="row" spacing={1}>
                <Chip 
                  label={`Найдено заказов: ${filteredOrders.length}`}
                  variant="outlined"
                  color="default"
                />
              </Stack>
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
             
              <CardContent>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' },
                    gap: 2,
                    alignItems: 'center',
                  }}
                >
                  <DatePicker
                    label="Дата от"
                    value={equipmentStartDate}
                    onChange={setEquipmentStartDate}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                  <DatePicker
                    label="Дата до"
                    value={equipmentEndDate}
                    onChange={setEquipmentEndDate}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                  <FormControl fullWidth>
                    <InputLabel>Пользователь</InputLabel>
                    <Select
                      value={equipmentSelectedUser}
                      onChange={(e) => setEquipmentSelectedUser(e.target.value)}
                      label="Пользователь"
                    >
                      <MenuItem value="">Все пользователи</MenuItem>
                      {uniqueFullNames.map((name) => (
                        <MenuItem key={name} value={name}>
                          {name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Autocomplete
                    multiple
                    disableCloseOnSelect
                    options={sortedEquipmentNames}
                    value={equipmentNamesSelected}
                    onChange={(_, newValue) => setEquipmentNamesSelected(newValue)}
                    renderTags={(value) => (
                      value.length ? (
                        <Box sx={{ ml: 0.5, fontWeight: 600, color: 'text.primary' }}>
                          {`Выбрано ${value.length}`}
                        </Box>
                      ) : null
                    )}
                    renderOption={(props, option, { selected }) => (
                      <li {...props}>
                        <Checkbox style={{ marginRight: 8 }} checked={selected} />
                        {option}
                      </li>
                    )}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        fullWidth
                        label="Оборудование"
                        placeholder={equipmentNamesSelected.length ? '' : 'Начните ввод...'}
                      />
                    )}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <Button startIcon={<RestartAltIcon />} variant="outlined" onClick={handleResetEquipmentFilters}>
                      Сбросить
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Stack direction="row" spacing={1}>
                <Chip 
                  label={`Найдено заказов: ${equipmentEntries.length}`} 
                  variant="outlined"
                  color="default"
                />
                {equipmentNamesSelected.length > 0 && (
                  <Chip 
                    label={`Итого: ${totalEquipmentQuantity} шт.`} 
                    color="primary"
                    variant="filled"
                  />
                )}
              </Stack>
            </Box>

            {equipmentEntries.length > 0 && (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Дата</TableCell>
                      <TableCell>Оборудование</TableCell>
                      <TableCell>Кол-во</TableCell>
                      <TableCell>Пользователь</TableCell>
                      <TableCell>Заказ</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {equipmentEntries.map((e, idx) => (
                      <TableRow key={`${e.orderId}-${idx}`} hover>
                        <TableCell>{formatDate(e.date)}</TableCell>
                        <TableCell>{e.name}</TableCell>
                        <TableCell>{e.quantity}</TableCell>
                        <TableCell>{e.fullName}</TableCell>
                        <TableCell>
                          <Button variant="text" size="small" onClick={() => handleEquipmentOrderClick(e.orderId)}>
                            Открыть заказ #{e.orderId}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {equipmentEntries.length === 0 && (
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
