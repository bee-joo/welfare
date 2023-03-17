import { NotFoundError, BadRequestError } from './errors.js';

export const notFoundHandler = (req, res) => {
  res.status(404).render('error.hbs', {
    error: NotFoundError,
    loggedIn: req.session.loggedin
  });
}; // хэндлер для ненайденых маршрутов - отправляем код 404 и страницу с ошибкой

export const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error.hbs', {
    error: BadRequestError,
    loggedIn: req.session.loggedin
  });
}; // хэндлер всех ошибок сайта - показываем пользователю страницу с ошибкой и выводим её в консоль

export const checkAuth = (req, res, next) => {
  if (req.session.loggedin) {
    next();
  } else {
    res.redirect('/login');
  }
}; // middleware для проверки аутентификации - если в сессии указано, что пользователь залогинен - пускаем дальше, иначе редирект на страницу логина

export const checkAdmin = (req, res, next) => {
  if (req.session.role == 'admin') {
    next();
  } else {
    res.status(403).render('error.hbs', {
      error: {
        title: 'Недоступно',
        text: 'Страница недоступна'
      },
      loggedIn: req.session.loggedin
    });
  }
}; // middleware для проверки роли админа - если в сессии указано, что пользователь админ - пускаем дальше, иначе страница с ошибкой