import { Router } from 'express';
import bcrypt from 'bcrypt';
import { Op } from 'sequelize';

import themes from '../../models/themes.js';
import { County, User } from '../../models/models.js';

const userRouter = Router();
const folder = 'admin/users';

userRouter.get('/', (req, res, next) =>
  res.render(`${folder}/index`) // рендерим индексную страницу
);

userRouter.get('/add', (req, res, next) => // страница добавления пользователя
  County.findAll({ raw: true }) // находим все районы
    .then(counties =>
      res.render(`${folder}/add`, {
        themes: themes, // тематики - роли
        counties: counties
      })
    )
);

userRouter.post('/add', (req, res, next) => {
  let username = req.body.username;
  let password = req.body.password;
  let role = req.body.role;
  let countyId = req.body.county != 'admin' ? req.body.county : null; // получаем данные из формы

  bcrypt.hash(password, 7) // хэшируем пароль
    .then(hash => User.create({
      Username: username,
      Password: hash,
      Role: role,
      Id_county: countyId
    })) // добавляем пользователя в БД
    .then(_ => res.render('admin/ok'))
    .catch(err => next(err));
});

userRouter.get('/all', (req, res, next) => // страница со всеми пользователями
  User.findAll({
    raw: true,
    order: [
      ['Id_user', 'ASC'] // сортируем результат по id
    ]
  })
    .then(users => {
      let countyIds = users.map(user => user.Id_county); // выделяем у пользователей id их районов
      let uniqueCountyIds = countyIds.filter((element, index) => {
        return (countyIds.indexOf(element) === index && element != null); // выделяем из id районов уникальные не равные null значения
      });

      let counties = County.findAll({
        raw: true,
        where: {
          Id_county: {
            [Op.in]: uniqueCountyIds
          }
        } // находим те районы, к которым привязаны существующие пользователи
      });

      return Promise.all([users, counties]); // возвращаем результаты в следующую цепочку
    })
    .then(([users, counties]) => {
      users.forEach(user => { // проходимся по пользователям
        if (user.Id_county != null) { // если id района не null (например, как у админов)
          user.County = counties.find(county => county.Id_county == user.Id_county).County_name; // находим район текущего пользователя и выделяем имя
        }
      })
      res.render(`${folder}/table`, {
        result: users
      })
    })
);

userRouter.get('/:id/delete', (req, res, next) => // страница удаления пользователя
  User.findByPk(req.params.id) // находим пользователя
    .then(user => res.render(`${folder}/delete`, {
      username: user.Username
    })) // если найден, показываем страницу удаления
    .catch(err => next(err))
);

userRouter.post('/:id/delete', (req, res, next) =>
  User.destroy({
    where: {
      Id_user: req.params.id
    } // удаляем пользователя по id
  })
    .then(_ => res.redirect('/admin/users/all'))
    .catch(err => next(err))
);

userRouter.get('/:id/edit', (req, res, next) => // страница редактирования роли пользователя
  User.findByPk(req.params.id) // находим пользователя
    .then(user => res.render(`${folder}/edit`, {
      username: user.Username,
      themes: themes
    })) // если найден, показываем страницу редактирования
    .catch(err => next(err))
);

userRouter.post('/:id/edit', (req, res, next) =>
  User.update({
    Role: req.body.role
  }, // обновляем данные о поли пользователя, берём из формы
    {
      where: {
        Id_user: req.params.id // указываем id нужного пользователя
      }
    })
    .then(result => res.redirect('/admin/users/all'))
    .catch(err => next(err))
);

export default userRouter;