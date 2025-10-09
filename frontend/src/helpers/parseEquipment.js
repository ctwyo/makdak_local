/**
 * Парсит текст заказа и извлекает оборудование с количеством
 * @param {string} text - Текст заказа
 * @returns {Array} Массив объектов с названием оборудования и количеством
 */
export function parseEquipment(text) {
  if (!text) return [];
  
  const lines = text.trim().split('\n');
  const equipment = [];
  
  lines.forEach((line) => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return;
    
    // Разделяем строку по пробелам
    const parts = trimmedLine.split(' ');
    
    if (parts.length >= 2) {
      // Последняя часть должна быть числом (количество)
      const lastPart = parts[parts.length - 1];
      const quantity = parseInt(lastPart, 10);
      
      if (!isNaN(quantity)) {
        // Всё, что до последней части - это название оборудования
        const equipmentName = parts.slice(0, -1).join(' ').trim();
        if (equipmentName) {
          equipment.push({
            name: equipmentName,
            quantity: quantity
          });
        }
      } else {
        // Если последняя часть не число, добавляем всю строку как название без количества
        equipment.push({
          name: trimmedLine,
          quantity: null
        });
      }
    } else {
      // Если только одно слово, добавляем как название без количества
      equipment.push({
        name: trimmedLine,
        quantity: null
      });
    }
  });
  
  return equipment;
}

/**
 * Получает уникальные названия оборудования из массива заказов
 * @param {Array} orders - Массив заказов
 * @returns {Array} Массив уникальных названий оборудования
 */
export function getUniqueEquipmentNames(orders) {
  const equipmentNames = new Set();
  
  orders.forEach(order => {
    const equipment = parseEquipment(order.text);
    equipment.forEach(item => {
      if (item.name) {
        equipmentNames.add(item.name);
      }
    });
  });
  
  return Array.from(equipmentNames).sort();
}

/**
 * Получает уникальные имена пользователей из массива заказов
 * @param {Array} orders - Массив заказов
 * @returns {Array} Массив уникальных имен пользователей
 */
export function getUniqueFullNames(orders) {
  const fullNames = new Set();
  
  orders.forEach(order => {
    if (order.fullName && order.fullName.trim()) {
      fullNames.add(order.fullName.trim());
    }
  });
  
  return Array.from(fullNames).sort();
}

/**
 * Анализирует заказы и возвращает статистику по оборудованию
 * @param {Array} orders - Массив заказов
 * @param {string} equipmentName - Название оборудования для фильтрации (опционально)
 * @param {Date} startDate - Начальная дата (опционально)
 * @param {Date} endDate - Конечная дата (опционально)
 * @returns {Object} Статистика по оборудованию
 */
export function getEquipmentAnalytics(orders, equipmentName = null, startDate = null, endDate = null) {
  const analytics = {};
  
  orders.forEach(order => {
    // Фильтрация по дате
    if (startDate || endDate) {
      const orderDate = new Date(order.updatedAt);
      if (startDate && orderDate < startDate) return;
      if (endDate && orderDate > endDate) return;
    }
    
    const equipment = parseEquipment(order.text);
    const fullName = order.fullName || 'Не указано';
    
    equipment.forEach(item => {
      // Фильтрация по названию оборудования
      if (equipmentName && !item.name.toLowerCase().includes(equipmentName.toLowerCase())) {
        return;
      }
      
      if (!analytics[item.name]) {
        analytics[item.name] = {};
      }
      
      if (!analytics[item.name][fullName]) {
        analytics[item.name][fullName] = {
          totalQuantity: 0,
          ordersCount: 0,
          orders: []
        };
      }
      
      const quantity = item.quantity || 0;
      analytics[item.name][fullName].totalQuantity += quantity;
      analytics[item.name][fullName].ordersCount += 1;
      analytics[item.name][fullName].orders.push({
        orderId: order.id,
        quantity: quantity,
        date: order.updatedAt
      });
    });
  });
  
  return analytics;
}

/**
 * Проверяет, находится ли дата в указанном диапазоне
 * @param {Date} date - Проверяемая дата
 * @param {Date} startDate - Начальная дата
 * @param {Date} endDate - Конечная дата
 * @returns {boolean}
 */
export function isDateInRange(date, startDate, endDate) {
  if (!startDate && !endDate) return true;
  
  const checkDate = new Date(date);
  
  // Устанавливаем время на начало дня для корректного сравнения
  const start = startDate ? new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()) : null;
  const end = endDate ? new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59) : null;
  const check = new Date(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate());
  
  if (start && end) {
    return check >= start && check <= end;
  }
  
  if (start) {
    return check >= start;
  }
  
  if (end) {
    return check <= end;
  }
  
  return true;
}
