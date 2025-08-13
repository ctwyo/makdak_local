import {
  Document,
  Packer,
  Table,
  TableCell,
  TableRow,
  Paragraph,
  WidthType,
  AlignmentType,
  TextRun,
  TableLayoutType,
  Footer,
  PageNumber,
} from "docx";
import { saveAs } from "file-saver";
import petrovich from "petrovich";

export const createDocument = (order, fullName = "") => {
  const currentDate = new Date().toLocaleDateString("ru-RU");
  let transformedFullName = fullName;

  if (fullName && fullName !== undefined) {
    const [lastName, initials] = fullName.split(" ", 2);
    const transformedLastName = petrovich.male.last.genitive(lastName);
    transformedFullName = `${transformedLastName} ${initials}`;
  }

  // Функция для создания параграфа с заданными параметрами
  const createParagraph = (
    text,
    alignment, // Используем строковый тип для выравнивания
    lineSpacing = 480 // Интервал между строками по умолчанию - 2.0 (480 в half-points)
  ) =>
    new Paragraph({
      children: [
        new TextRun({
          text,
          size: 24, // Установка шрифта 12 пунктов (24 half-points)
        }),
      ],
      alignment: AlignmentType[alignment], // Приводим значение к типу AlignmentType
      spacing: { line: lineSpacing }, // Интервал между строками
    });

  // Создание шапки документа (заголовок и информация)
  const createHeader = () => {
    return [
      new Paragraph({
        children: [
          new TextRun({
            text: "ООО “Тилпос-Сервис”", // Пример текста шапки
            size: 48,
            font: "Arial", // Установка шрифта 14 пунктов
          }),
        ],
        alignment: AlignmentType.CENTER, // Центрирование текста
      }),

      new Paragraph({
        border: {
          bottom: {
            color: "000000", // Чёрная полоса
            space: 1,
            size: 24, // Размер полосы
            style: "single", // Добавляем стиль линии
          },
        },
      }),

      new Paragraph({
        children: [
          new TextRun({
            text: "ИНН 5029270150, КПП 502901001", // Пример текста о компании
            size: 20,
            font: "Arial", // Установка шрифта 12 пунктов
          }),
        ],
        alignment: AlignmentType.CENTER, // Центрирование текста
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: "141031, МО, г.о. Мытищи, п. Вешки, тер.ТПЗ Алтуфьево, ш. 2-й километр Липкинского, ВЛД. 1, стр. 1А, этаж 2, помещ.33", // Пример текста о компании
            size: 20,
            font: "Arial", // Установка шрифта 12 пунктов
          }),
        ],
        alignment: AlignmentType.CENTER, // Центрирование текста
      }),
      new Paragraph({
        spacing: { before: 300 }, // Интервал перед таблицей
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `${currentDate}`, // Добавляем текущую дату
            size: 22,
            font: "Arial",
          }),
        ],
        alignment: AlignmentType.LEFT, // Выравнивание по правому краю
      }),
      new Paragraph({
        spacing: { before: 300 }, // Интервал перед таблицей
      }),

      new Paragraph({
        children: [
          new TextRun({
            text: "Акт приема-передачи оборудования", // Добавляем текущую дату
            size: 22,
            bold: true,
            font: "Arial",
          }),
        ],
        alignment: AlignmentType.CENTER, // Выравнивание по правому краю
      }),

      new Paragraph({
        children: [
          new TextRun({
            text: `1. ООО «Тилпос-Сервис», передает оборудование со склада хранения «Тилпос-Сервис» на ответственное хранение инженеру выездного обслуживания в лице ${transformedFullName}`,
            size: 22,
            font: "Arial",
          }),
        ],
        alignment: AlignmentType.JUSTIFIED,
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `2. Наименование и количество оборудования, согласно нижеперечисленного списка:`,
            size: 22,
            font: "Arial",
          }),
        ],
        alignment: AlignmentType.JUSTIFIED,
      }),
      new Paragraph({
        spacing: { before: 50 }, // Интервал перед таблицей
      }),
    ];
  };

  // Функция для создания таблицы
  const createTable = (order) => {
    // Заголовок таблицы
    const tableHeader = new TableRow({
      children: [
        new TableCell({
          children: [createParagraph("№ п/п", "CENTER")],
          width: { size: 2000, type: WidthType.DXA },
        }),
        new TableCell({
          children: [createParagraph("Наименование", "CENTER")],
          width: { size: 6000, type: WidthType.DXA },
        }),
        new TableCell({
          children: [
            createParagraph("Серийный номер", "CENTER", 240), // Интервал 1.0
          ],
          width: { size: 4000, type: WidthType.DXA },
        }),
        new TableCell({
          children: [createParagraph("Количество", "CENTER")],
          width: { size: 3000, type: WidthType.DXA },
        }),
      ],
    });

    // Содержимое таблицы
    const tableContent = Object.entries(order).map(
      ([name, quantity], index) =>
        new TableRow({
          children: [
            new TableCell({
              children: [createParagraph(String(index + 1), "CENTER")],
            }),
            new TableCell({
              children: [createParagraph(name, "LEFT")],
            }),
            new TableCell({
              children: [createParagraph("", "CENTER", 240)], // Пустая ячейка для серийного номера
            }),
            new TableCell({
              children: [createParagraph(`${quantity} шт.`, "CENTER")],
            }),
          ],
        })
    );

    // Возвращаем таблицу
    return new Table({
      rows: [tableHeader, ...tableContent],
      width: { size: 10000, type: WidthType.DXA }, // Таблица на всю ширину
      alignment: AlignmentType.CENTER, // Центрируем таблицу
      layout: TableLayoutType.FIXED, // Фиксированная ширина таблицы
    });
  };

  const createFooter = () => {
    return [
      new Paragraph({
        children: [
          new TextRun({
            text: "3. Выданные материальные ценности полностью осмотрены и приняты материально ответственным лицом.",
            size: 22,
            font: "Arial",
          }),
        ],
        alignment: AlignmentType.JUSTIFIED,
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: "4. Расхождения по качеству и количеству не выявлено.",
            size: 22,
            font: "Arial",
          }),
        ],
        alignment: AlignmentType.JUSTIFIED,
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: "5. Стороны взаимных претензий и замечаний не имеют.",
            size: 22,
            font: "Arial",
          }),
        ],
        alignment: AlignmentType.JUSTIFIED,
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: "6. Настоящий Акт составлен в двух экземплярах по одному для каждой из сторон.",
            size: 22,
            font: "Arial",
          }),
        ],
        alignment: AlignmentType.JUSTIFIED,
      }),
      new Paragraph({
        spacing: { before: 300 },
      }),

      // new Paragraph({
      //   children: [
      //     new TextRun({
      //       text: `Оборудование передал:                                                         	Оборудование получил:`,
      //       size: 22,
      //       font: "Arial",
      //     }),
      //   ],
      //   alignment: AlignmentType.JUSTIFIED,
      // }),

      new Table({
        borders: {
          top: { style: "none" },
          bottom: { style: "none" },
          left: { style: "none" },
          right: { style: "none" },
          insideHorizontal: { style: "none" },
          insideVertical: { style: "none" },
        },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: "Оборудование передал:",
                        size: 22,
                        font: "Arial",
                      }),
                    ],
                    alignment: AlignmentType.LEFT,
                  }),
                ],
                width: { size: 5000, type: WidthType.DXA },
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: "Оборудование получил:",
                        size: 22,
                        font: "Arial",
                      }),
                    ],
                    alignment: AlignmentType.RIGHT,
                  }),
                ],
                width: { size: 5000, type: WidthType.DXA },
              }),
            ],
          }),
        ],
        width: { size: 10000, type: WidthType.DXA },
        layout: TableLayoutType.FIXED,
        alignment: AlignmentType.CENTER, // Выравнивание всей таблицы по центру
      }),

      new Paragraph({
        spacing: { before: 10 },
      }),

      new Table({
        borders: {
          top: { style: "none" },
          bottom: { style: "none" },
          left: { style: "none" },
          right: { style: "none" },
          insideHorizontal: { style: "none" },
          insideVertical: { style: "none" },
        },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: "ООО «Тилпос-Сервис»",
                        size: 22,
                        font: "Arial",
                      }),
                    ],
                    alignment: AlignmentType.LEFT, // Выравнивание текста по центру
                  }),
                ],
                width: { size: 5000, type: WidthType.DXA },
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `${fullName}`,
                        size: 22,
                        font: "Arial",
                      }),
                    ],
                    alignment: AlignmentType.RIGHT,
                  }),
                ],
                width: { size: 5000, type: WidthType.DXA },
              }),
            ],
          }),
        ],
        width: { size: 10000, type: WidthType.DXA },
        layout: TableLayoutType.FIXED,
        alignment: AlignmentType.CENTER, // Выравнивание всей таблицы по центру
      }),
      //////
      new Paragraph({
        spacing: { before: 300 },
      }),

      new Table({
        borders: {
          top: { style: "none" },
          bottom: { style: "none" },
          left: { style: "none" },
          right: { style: "none" },
          insideHorizontal: { style: "none" },
          insideVertical: { style: "none" },
        },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: "__________________ /___________/",
                        size: 22,
                        font: "Arial",
                      }),
                    ],
                    alignment: AlignmentType.LEFT,
                  }),
                ],
                width: { size: 5000, type: WidthType.DXA },
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: "__________________ /___________/",
                        size: 22,
                        font: "Arial",
                      }),
                    ],
                    alignment: AlignmentType.RIGHT,
                  }),
                ],
                width: { size: 5000, type: WidthType.DXA },
              }),
            ],
          }),
        ],
        width: { size: 10000, type: WidthType.DXA },
        layout: TableLayoutType.FIXED,
        alignment: AlignmentType.CENTER, // Выравнивание всей таблицы по центру
      }),
    ];
  };

  // Создаем нижний колонтитул с номерами страниц
  const createFooterWithPageNumber = () => {
    return new Footer({
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun("Страница "),
            new TextRun({
              children: [PageNumber.CURRENT],
            }),
            new TextRun(" из "),
            new TextRun({
              children: [PageNumber.TOTAL_PAGES],
            }),
          ],
        }),
      ],
    });
  };

  // Создание документа
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            width: 12240, // 210 мм
            height: 15840, // 297 мм
            orientation: "portrait", // Вертикальная ориентация
            margin: {
              top: 1440, // 2 см
              bottom: 1440, // 2 см
              left: 1440, // 2 см
              right: 1440, // 2 см
            },
          },
        },
        children: [...createHeader(), createTable(order), ...createFooter()],
      },
    ],
  });
  const date = new Date();
  const formattedDate = date.toLocaleDateString("ru-RU");
  // Создание и сохранение документа
  Packer.toBlob(doc).then((blob) => {
    saveAs(blob, `${formattedDate} ${fullName}.docx`);
  });
};
