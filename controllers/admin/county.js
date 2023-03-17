import { Router } from 'express';
import { County } from '../../models/models.js';

const countyRouter = Router(); // создаём роутер
const folder = 'admin/county'; // задаём переменную с папкой, где содержатся шаблоны для этого роутера

countyRouter.get('/', (req, res, next) => {
  County.findAll(
    {
      raw: true,
      order: [
        ['County_name', 'ASC']
      ]
    })
    .then(counties => res.render(`${folder}/index`, {
      counties: counties
    }))
    .catch(err => next(err)) // рендерим индексную страницу
});

countyRouter.get('/add', (req, res, next) =>
  res.render(`${folder}/add`) // маршрут добавления района - рендерим форму
);

countyRouter.post('/add', (req, res, next) =>
  County.create({
    County_name: req.body.name
  }) // берём данные из формы и сохраняем в БД
    .then(result => res.redirect('/admin/county'))
    .catch(err => next(err))
);

countyRouter.get('/:id/delete', (req, res, next) => // маршрут удаления окна
  County.findByPk(req.params.id)
    .then(county => {
      res.render(`${folder}/delete`, {
        county: county.County_name
      })
    }) // находим по id район и если он найден, то рендерим страницу удаления
    .catch(err => next(err))
);

countyRouter.post('/:id/delete', (req, res, next) =>
  County.destroy({
    where: {
      Id_county: req.params.id
    }
  }) // удаляем район по id
    .then(result => res.redirect('/admin/county'))
    .catch(err => next(err))
);

export default countyRouter;