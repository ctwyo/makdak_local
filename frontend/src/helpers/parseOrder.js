// export function parseOrder(text) {
//   const lines = text.trim().split("\n");
//   const order = {};

//   lines.forEach((line) => {
//     const [name, quantity] = line.split(" ");
//     order[name] = parseInt(quantity, 10);
//   });

//   return order;
// }

// export function parseOrder(text) {
//   const lines = text.trim().split("\n");
//   const order = {};

//   lines.forEach((line) => {
//     const [name, quantity] = line.split(" ");
//     const parsedQuantity = quantity ? parseInt(quantity, 10) : ""; // Если quantity нет, оставляем пустое значение
//     order[name] = parsedQuantity;
//   });

//   return order;
// }
export function parseOrder(text) {
  const lines = text.trim().split("\n");
  const order = {};

  lines.forEach((line) => {
    const parts = line.trim().split(" "); // Разделяем строку по пробелам
    const quantity = parseInt(parts[parts.length - 1], 10); // Последняя часть — это количество

    // Если количество корректное, то добавляем его
    if (!isNaN(quantity)) {
      const name = parts.slice(0, -1).join(" "); // Всё, что до последней части — это название товара
      order[name] = quantity;
    } else {
      // Если количество отсутствует, оставляем пустое значение
      order[line] = ""; // Всё строка — это название товара без количества
    }
  });

  return order;
}
