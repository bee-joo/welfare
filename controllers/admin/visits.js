import { Router } from 'express';
import { Client, Reception, Request } from '../../models/models.js';
import { Op } from 'sequelize';

const visitRouter = Router();
const folder = 'admin/visits';

visitRouter.get('/', (req, res, next) => { // корневая страница визитов
  let findCondition = {
    raw: true,
    order: [
      ['Cabinet', 'ASC'],
      ['Num_reception', 'ASC'],
    ],
    where: {}
  }; // создаём объект с условием поиска окон, пока что здесь только сортировка по номеру кабинета и окна

  if (req.session.role != 'admin') {
    findCondition.where.Id_county = req.session.countyId;
    findCondition.where.Theme = req.session.role; // если роль пользователя не админ, то в условия поиска добавляем тематику и район, доступную данному модератору
  }

  Reception.findAll(findCondition) // поиск окон
    .then(receptions => res.render(`${folder}/index`, {
      receptions: receptions
    }))
    .catch(err => next(err))
});

visitRouter.post('/', (req, res, next) => {
  let receptionId = req.body.receptionId;
  let selectedDate = req.body.date; // берём данные из формы

  if (req.body.receptionId == null) {
    return res.status(400).render('error', {
      error: {
        title: 'Ошибка',
        text: 'Неверные данные'
      }
    }); // если id окна оказался пустым (например, окно оказалось невыбранным), то возвращаем ошибку
  }

  let startDate = new Date(selectedDate);
  startDate.setUTCHours(0, 0, 0);

  let endDate = new Date(selectedDate);
  endDate.setUTCHours(23, 59, 59); // создаём отрезок дат и времени для поиска визитов

  let result = [];

  Reception.findByPk(receptionId) // находим окно по id
    .then(reception => {
      let requests = Request.findAll({
        where: {
          Id_reception: receptionId,
          Date_visit: {
            [Op.between]: [startDate, endDate]
          }
        }, // затем находим визиты, в которых указан нужный id окна и подходящая дата
        order: [
          ['Date_visit', 'ASC'] // сортировка визитов по дате
        ]
      });

      return Promise.all([reception, requests]); // возвращаем в цепочку полученные данные
    })
    .then(([reception, requests]) => {
      let clients = Client.findAll({
        where: {
          Id_client: {
            [Op.in]: requests.map(r => r.Id_client) // получаем id клиентов из массива визитов
          }
        }
      }); // находим клиентов по полученным id

      return Promise.all([reception, requests, clients]) // возвращаем в цепочку полученные данные
    })
    .then(([reception, requests, clients]) => {
      requests.forEach(r => { // проходимся по визитам
        let date = new Date(r.Date_visit);
        let minutes = date.getMinutes(); // создаём объект даты из даты визита и получаем минуты

        if (minutes < 10) {
          minutes = `0${minutes}`; // минуты отображаются в виде числа, поэтому чтобы корректно их отображать нужно добавлять 0 к числам меньше 10
        }

        result.push({
          date: { hours: date.getHours(), minutes: minutes },
          client: clients.find(c => c.Id_client == r.Id_client) // находим клиента по id в массиве клиентов
        }) // добавляем в результат объект с датой визита и данными клиента
      });

      res.render(`${folder}/table`, {
        result: result,
        date: selectedDate,
        reception: reception
      }) // рендерим результат
    })
    .catch(err => next(err));
})

export default visitRouter;