import { Router } from 'express';
import { Available, Reception } from '../../models/models.js';
import { Op } from 'sequelize';

import { NotFoundError } from '../../errors.js';

const availableRouter = Router(); // создаём роутер
const folder = 'admin/available'; // задаём переменную с папкой, где содержатся шаблоны для этого роутера

availableRouter.get('/', (req, res, next) => {
  res.render(`${folder}/index`) // рендерим индексную страницу
});

availableRouter.get('/find/:date', (req, res, next) => { // маршрут для поиска доступных номерков по дате
  let selectedDate = req.params.date; // берём дату из переменной маршрута

  res.cookie('dateAvailableAdmin', req.params.date, { signed: true }); // сохраняем дату в куки (для последующего перенаправления обратно на эту страницу)

  let startDate = new Date(selectedDate); // создаём объект даты начала поиска
  startDate.setUTCHours(0, 0, 0); // задаём 0 часов, 0 минут, 0 секунд

  let endDate = new Date(selectedDate); // создаём объект конца поиска
  endDate.setUTCHours(23, 59, 59); // задаём 23 часа, 59 минут, 59 секунд

  let result = []; // массив результатов

  Available.findAll({
    where: {
      Available_date: {
        [Op.between]: [startDate, endDate] // находим свободные номерки, дата которых находится между созданными датами
      }
    },
    order: [
      ['Available_date', 'ASC'] // сортируем результат по дате
    ]
  })
    .then(available => {
      let receptionIds = available.map(a => a.Id_reception); // получаем массив с id окон, которые указаны в полученных номерках

      let whereCondition = {
        where: {
          Id_reception: {
            [Op.in]: receptionIds
          }
        }
      }; // создаём объект с условием поиска - id нужных нам окон должны находиться в полученном выше массиве id окон

      if (req.session.role != 'admin') {
        whereCondition.where.Id_county = req.session.countyId;
        whereCondition.where.Theme = req.session.role; // если роль текущего пользователя - не админ, то в условие поиска добавляем его роль в качестве тематики и id его района
      }

      let receptions = Reception.findAll(whereCondition); // находим окна по заданному выше условию

      return Promise.all([available, receptions]); // возвращаем номерки и окна в цепочку дальше
    })
    .then(([available, receptions]) => {
      available.forEach(a => { // проходимся по доступным номеркам
        let reception = receptions.find(r => r.Id_reception == a.Id_reception); // находим окно по id окна, указанному в номерке (пригождается, если номерок не подходит по роли пользователя)

        if (reception != null) { // если окно найдено
          let minutes = a.Available_date.getMinutes();

          if (minutes < 10) {
            minutes = `0${minutes}`; // минуты отображаются в виде числа, поэтому чтобы корректно их отображать нужно добавлять 0 к числам меньше 10
          }

          result.push({
            id: a.Id_available,
            date: `${a.Available_date.getHours()}:${minutes}`,
            reception: reception
          }) // добавляем в результат объект с id номерка, временем и объектом окна
        }
      })
    })
    .then(_ => res.render(`${folder}/table`, {
      result: result
    })) // рендерим таблицу с номерками
    .catch(err => next(err));
});

availableRouter.get('/add', (req, res, next) => { // маршрут формы для добавления номерка
  let findCondition = {
    raw: true,
    order: [
      ['Cabinet', 'ASC'],
      ['Num_reception', 'ASC'],
    ],
    where: {}
  }; // создаём объект с условием поиска окон - пока мы их просто сортируем

  if (req.session.role != 'admin') {
    findCondition.where.Theme = req.session.role;
    findCondition.where.Id_county = req.session.countyId;
  } // если роль текущего пользователя - не админ, то в условие поиска добавляем его роль в качестве тематики

  Reception.findAll(findCondition)
    .then(receptions => res.render(`${folder}/add`, {
      receptions: receptions,
      loggedIn: true
    }))
    .catch(err => next(err)); // находим окна по заданному выше условию и рендерим страницу 
});

availableRouter.get('/:id/delete', (req, res, next) => // маршрут для удаления номерка по id
  Available.findByPk(req.params.id) // находим номерок
    .then(available => Reception.findByPk(available.Id_reception)) // затем находим окно номерка
    .then(reception => {
      if (req.session.role == 'admin' || (req.session.role == reception.Theme && req.session.countyId == reception.Id_county)) {
        res.render(`${folder}/delete`) // если с ролями всё верно, то показываем страницу удаления
      } else {
        res.status(404).render('error', {
          error: NotFoundError // если роль не подходит, то показываем ошибку 404
        })
      }
    })
    .catch(err => next(err))
);

availableRouter.post('/', (req, res, next) =>
  res.redirect(`/admin/available/find/${req.body.date}`) // при отправке формы с датой перенаправляем на страницу поиска по дате
);

availableRouter.post('/add', (req, res, next) => {
  if (req.body.receptionId == null) {
    return res.status(400).render('error', {
      error: {
        title: 'Ошибка',
        text: 'Неверные данные'
      }
    }); // если id окна из формы пустой, то возвращаем ошибку 
  }

  // здесь мы парсим строку с временем вида 01.01.2023T12:00
  // т.е. сначала разбиваем строку по разделителю Т, а потом разбиваем строку с временем по разделителю :
  let [selectedDate, time] = req.body.date.split('T');
  let [hours, minutes] = time.split(':');

  // создаём объект с датой и задаём час и минуты
  let date = new Date(selectedDate);
  date.setUTCHours(hours);
  date.setUTCMinutes(minutes);

  Available.create({
    Id_reception: req.body.receptionId,
    Available_date: date // создаём номерок
  })
    .then(result => res.render('admin/ok')) // рендерим страницу успеха
    .catch(err => next(err))
});

availableRouter.post('/:id/delete', (req, res, next) => {
  let date = req.signedCookies.dateAvailableAdmin; // берём куки с выбранной датой
  res.clearCookie('dateAvailableAdmin', { signed: true }); // очищаем дату из куки

  Available.destroy({
    where: {
      Id_available: req.params.id
    }
  }) // удаляем номерок по id
    .then(result => res.redirect(`/admin/available/find/${date}`)) // возвращаемся на страницу с поиском по дате
    .catch(err => next(err));
});

export default availableRouter;