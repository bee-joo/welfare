class Error {
  constructor(title, text) {
    this.title = title;
    this.text = text;
  }
} // класс для создания объекта с ошибкой

export const NotFoundError = new Error('Не найдено', 'Страница не найдена');
export const BadRequestError = new Error('Ошибка', 'Произошла ошибка');