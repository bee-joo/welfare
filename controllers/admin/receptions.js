import { Router } from 'express';
import { County, Reception } from '../../models/models.js';

import themes from '../../models/themes.js';

const receptionRouter = Router(); // роутер для кабинетов с окнами
const folder = 'admin/receptions'; // указываем папку с шаблонами

receptionRouter.get('/', (req, res, next) => { // корневой маршрут
  Reception.findAll({
    raw: true,
    order: [
      ['Cabinet', 'ASC'],
      ['Num_reception', 'ASC']
    ]
  }) // находим все существующие кабинеты с окнами
    .then(receptions => {
      let counties = County.findAll({
        raw: true,
        order: [
          ['County_name', 'ASC'] // сортировка по имени района
        ]
      });
      return Promise.all([receptions, counties]);
    })
    .then(([receptions, counties]) => {
      let result = [];

      counties.forEach(county => { // проходимся по районам
        let currReceptions = receptions.filter(rec => rec.Id_county == county.Id_county); // находим окна у текущего района
        if (currReceptions.length == 0) {
          currReceptions = null; // если окон нет - будет значение null (чтобы отобразить текст в случае отсутствия окон)
        }
        result.push(
          {
            county: county.County_name,
            receptions: currReceptions
          }
        );
      });

      res.render(`${folder}/index`, {
        result: result
      });
    }) // рендерим страницу с результатами поиска
    .catch(err => next(err));
});

receptionRouter.get('/add', (req, res, next) =>
  County.findAll({
    raw: true,
    order: [
      ['County_name', 'ASC'] // сортировка по имени района
    ]
  })
    .then(counties =>
      res.render(`${folder}/add`, {
        themes: themes,
        counties: counties
      })
    ) // маршрут добавления окна - рендерим форму
);

receptionRouter.get('/:id/delete', (req, res, next) => // маршрут удаления окна
  Reception.findByPk(req.params.id)
    .then(reception => {
      res.render(`${folder}/delete`, {
        reception: reception
      })
    }) // находим по id окно и если оно найдено, то рендерим страницу удаления
    .catch(err => next(err))
);

receptionRouter.get('/:id/edit', (req, res, next) => // маршрут редактирования окна
  Reception.findByPk(req.params.id)
    .then(reception => {
      res.render(`${folder}/edit`, {
        themes: themes,
        reception: reception
      })
    }) // находим по id окно и если оно найдено, то рендерим страницу редактирования
    .catch(err => next(err))
);

receptionRouter.post('/add', (req, res, next) =>
  Reception.create({
    Id_county: req.body.county,
    Cabinet: req.body.cabinet,
    Num_reception: req.body.reception,
    Theme: req.body.theme
  }) // берём данные из формы добавления окна и сохраняем в БД
    .then(result => res.redirect('/admin/receptions'))
    .catch(err => next(err))
);

receptionRouter.post('/:id/delete', (req, res, next) =>
  Reception.destroy({
    where: {
      Id_reception: req.params.id
    }
  }) // удаляем окно по id
    .then(result => res.redirect('/admin/receptions'))
    .catch(err => next(err))
);

receptionRouter.post('/:id/edit', (req, res, next) =>
  Reception.update({
    Cabinet: req.body.cabinet,
    Num_reception: req.body.reception,
    Theme: req.body.theme
  }, // обновляем данные о кабинете, берём их из формы
    {
      where: {
        Id_reception: req.params.id // указываем id нужного кабинета
      }
    })
    .then(result => res.redirect('/admin/receptions'))
    .catch(err => next(err))
);

export default receptionRouter;