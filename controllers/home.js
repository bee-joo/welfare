import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { Available, Client, County, Reception, Request } from '../models/models.js';
import { Op } from 'sequelize';

import themes from '../models/themes.js';
import { NotFoundError } from '../errors.js';

const homeRouter = Router(); // создаём роутер для страниц с выбором номерка

homeRouter.get('/', (req, res, next) =>
  County.findAll({ 
    raw: true,
    order: [
      ['County_name', 'ASC'] // сортировка по имени района
    ]
  })
    .then(counties =>
      res.render('index', {
        themes: themes,
        counties: counties
      })) // рендерим индексную страницу на корневом маршруте
);

homeRouter.post('/', (req, res, next) => {
  res.cookie('theme', req.body.theme, { signed: true });
  res.cookie('date', req.body.date, { signed: true });
  res.cookie('countyId', req.body.county, { signed: true });

  res.redirect('/time'); // при отправке формы на корневой странице сохраняем промежуточные данные в куки
});

homeRouter.get('/time', (req, res, next) => { // следующая форма - выбора номерка с временем
  let selectedDate = req.signedCookies.date;
  let theme = req.signedCookies.theme; 
  let countyId = req.signedCookies.countyId; // берём данные из куки

  if (selectedDate == null || theme == null || countyId == null) {
    return res.status(404).render('error', {
      error: NotFoundError
    }); // если данные не были введены - выводим ошибку
  }

  let currentDate = new Date();
  currentDate.setUTCDate(currentDate.getUTCDate() - 1);
  currentDate.setUTCHours(23, 59, 59); // получаем текущую дату и трансформируем её в конец предыдущего дня

  if (new Date(selectedDate) < currentDate) { // и затем сравниваем полученную дату с выбранной - мы не можем показывать номерки за дни, которые были до сегодняшнего
    return res.render('error', {
      error: {
        title: 'Ошибка',
        text: 'Нельзя записаться на эту дату'
      } // если введена слишком старая дата - выводим ошибку
    });
  }

  let startDate = new Date(selectedDate); // если всё хорошо - берём выбранную дату и превращаем её в диапазон от начала дня до самого конца дня - для корректного поиска в бд по дате
  startDate.setUTCHours(0, 0, 0); // начало выбранного дня

  let endDate = new Date(selectedDate);
  endDate.setUTCHours(23, 59, 59); // конец выбранного дня

  Reception.findAll({
    where: {
      Theme: theme,
      Id_county: countyId
    } // ищем окна с выбранной тематикой и районом
  })
    .then(receptions => {
      let available = Available.findAll({ // затем ищем свободные номерки
        where: {
          Available_date: {
            [Op.between]: [startDate, endDate] // указываем диапазон выбранного дня
          },
          Id_reception: {
            [Op.in]: receptions.map(r => r.Id_reception) // затем выводим id нужных нам окон - по ним также производится поиск
          }
        },
        order: [
          ['Available_date', 'ASC'] // сортировка по дате (а точнее времени)
        ]
      });

      return Promise.all([available, receptions]) // возвращаем полученные данные в следующую цепочку
    })
    .then(([available, receptions]) => {
      if (!available.length) {
        return res.status(404).render('error', {
          error: {
            title: 'Ошибка',
            text: 'Номерков нет'
          } // если номерков нет - возвращаем ошибку
        });
      }

      let results = [];

      receptions.forEach(reception => // проходимся по выбранным окнам
        results.push({ // добавляем в массив результатов объект, который содержит:
          reception: reception, // само окно
          available: available // а также номерки
            .filter(a => a.Id_reception == reception.Id_reception) // номерки фильтруем по id текущего окна
            .map(a => { // трансформация номерков для валидного отображения их времени
              let date = new Date(a.Available_date); // создаём объект даты номерка
              let minutes = date.getMinutes(); // получаем минуты

              if (minutes < 10) {
                minutes = `0${minutes}`; // корректное отображение минут (мы не хотим, чтобы пользователь видел 10:1 вместо 10:01)
              }

              a.date = { hours: date.getHours(), minutes: minutes }; // добавляем в номерок свойство, содержащее объект с часами и минутами номерка
              return a;
            })
        })
      );

      res.render('time', { results: results }); // рендерим результат
    })
    .catch(err => next(err));
});

homeRouter.post('/time', (req, res, next) => {
  res.cookie('availableId', req.body.availableId, { signed: true }); // при выборе номерка сохраняем его id в куки
  res.redirect('/data');
});

homeRouter.get('/data', (req, res, next) => {
  let selectedDate = req.signedCookies.date;
  let theme = req.signedCookies.theme;
  let availableId = req.signedCookies.availableId; // берём из куки сохранённые ранее данные

  if (selectedDate == null || theme == null || availableId == null) {
    return res.status(404).render('error', {
      error: NotFoundError // если данных в куки нет - возвращаем ошибку
    });
  }

  res.render('data', {
    date: selectedDate,
    theme: theme,
  }); // рендерим форму с вводом данных
});

homeRouter.post(
  '/data',
  body('name').not().isEmpty().trim().escape().isLength({ min: 2 }), // валидация поля name - не должно быть пустым и короче 2 символов
  body('email').isEmail().normalizeEmail().escape(), // валидация почты
  body('phone').isLength({ min: 10, max: 10 }).isNumeric().not().isEmpty(), // валидация телефона - 10 цифр (код +7 отображается в форме и не сохраняется в БД)
  (req, res, next) => {
    let selectedDate = req.signedCookies.date;
    let theme = req.signedCookies.theme;
    let availableId = req.signedCookies.availableId; // берём из куки сохранённые ранее данные

    let formData = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone
    }; // берём данные из формы

    let errors = validationResult(req); // здесь мы можем вывести результат валидации

    if (!errors.isEmpty()) { // если ошибка есть - показываем пользователю форму и говорим где ошибка
      let error = {};
      errors.array().forEach(e => {
        error[e.param] = true;
      }); // проходимся по ошибкам и создаём объект с ошибками
      return res.render('data', {
        date: selectedDate,
        theme: theme,
        formData: formData,
        error: error
      });
    }

    res.clearCookie('availableId', { signed: true });
    res.clearCookie('theme', { signed: true });
    res.clearCookie('date', { signed: true }); 
    res.clearCookie('countyId', { signed: true }); // очищаем куки

    Available.findByPk(availableId) // далее сохраняем данные клиента в БД, сначала находим выбранный номерок в БД
      .then(available => {
        let client = Client.create({
          Name: formData.name,
          Email: formData.email,
          Phone: formData.phone
        }); // создаём в БД объект клиента

        let reception = Reception.findByPk(available.Id_reception); // находим окно, которое указано в выбранном номерке

        return Promise.all([available, client, reception]); // возвращаем в следующую цепочку полученные данные
      })
      .then(([available, client, reception]) => {
        let formattedDate = new Date(available.Available_date); // форматируем дату из номерка
        formattedDate.setUTCHours(available.Available_date.getHours()); // задаём ей UTC-часы (это очень важно, так как в бд тип данных timestamp without timezone, если указывать не UTC-часы в объекте даты, то в БД часы сдвигаются к моему часовому поясу)

        Request.create({
          Id_reception: reception.Id_reception,
          Id_client: client.Id_client,
          Date_visit: formattedDate
        }); // создаём в БД объект визита клиента

        return available; // возвращаем в цепочку объект номерка
      })
      .then(available => Available.destroy({
        where: {
          Id_available: available.Id_available
        } // удаляем номерок из БД
      }))
      .then(_ => res.render('success'));
  }
);

export default homeRouter;