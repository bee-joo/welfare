import { Router } from 'express';
import bcrypt from 'bcrypt';

import { User } from '../models/models.js';
import { checkAuth } from '../middlewares.js';

const loginRouter = Router();

loginRouter.get('/login', (req, res, next) =>
  res.render('login') // в корневом маршруте рендерим форму для логина
);

loginRouter.post('/login', (req, res, next) => { // маршрут отправки формы
  // получаем имя пользователя и пароль из данных формы 
  let username = req.body.username;
  let password = req.body.password;

  User.findOne({
    where: {
      Username: username
    } // находим пользователя по логину
  })
    .then(user =>
      bcrypt.compare(password, user.Password, (err, same) => { // сравниваем пароль из формы и хэш из БД 
        if (same) { // если расшифрованный пароль равен паролю из формы
          // указываем разные атрибуты в объекте сессии
          req.session.loggedin = true; // указываем, что пользователь залогинен
          req.session.username = username; // указываем в сессии имя пользователя
          req.session.role = user.Role; // указываем в сессии его роль

          if (user.Role != 'admin') {
            req.session.countyId = user.Id_county; // если роль - не админ, то указываем в сессии id района модератора
          }

          res.redirect('/admin'); // перенаправляем на админ панель
        } else {
          res.render('login', {
            error: true // а если пароли не равны, сигнализируем об ошибке
          });
        }
      })
    )
    .catch(err => res.render('login', {
      error: true
    }));
});

loginRouter.get('/logout', checkAuth, (req, res, next) => {
  req.session.destroy();
  res.redirect('/');
})

export default loginRouter;