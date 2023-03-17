import { Router } from 'express';
import bcrypt from 'bcrypt';

import { User } from '../../models/models.js';

const passwordRouter = Router(); // создаём роутер

passwordRouter.get('/', (req, res, next) =>
  res.render('admin/password') // рендерим форму с паролем на корневом маршруте
);

passwordRouter.post('/', (req, res, next) => { // маршрут при отправке формы
  // получаем имя пользователя из сессии и введённые пароли из формы
  let username = req.session.username; 
  let password = req.body.password;
  let passwordConfirm = req.body.passwordConfirm;

  // если пароли не совпадают, сигнализируем об ошибке
  if (password != passwordConfirm) {
    return res.render('admin/password', {
      error: true
    });
  }

  // хэшируем пароль с солью равной 7
  bcrypt.hash(password, 7)
    .then(hash =>
      User.update({
        Password: hash
      },
        {
          where: {
            Username: username
          }
        }
      )) // обновляем пароль в БД с полученным именем пользователя
    .then(_ => res.render('admin/ok')) // затем сигнализируем об успехе
    .catch(err => next(err));
})

export default passwordRouter;