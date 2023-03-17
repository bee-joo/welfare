import express from 'express';
import cookieParser from 'cookie-parser';
import * as dotenv from 'dotenv'
import hbs from 'hbs';
import helmet from 'helmet';

import session from 'express-session';

import adminRouter from './controllers/admin.js';
import homeRouter from './controllers/home.js';
import loginRouter from './controllers/login.js';
import sequelize from './models/db.js';
import * as models from './models/models.js';
import { notFoundHandler, errorHandler, checkAuth } from './middlewares.js';

dotenv.config(); // загружаем переменные из файла .env
const app = express();

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

app.use(helmet()); // различные утилиты для защиты сайта
app.use(express.static('static')); // раздача статического контента из директории /static
app.use(cookieParser(process.env.COOKIE_SECRET)); // секрет для шифрования cookies
app.use(express.urlencoded({ extended: false })); // декодирование данных из формы

app.set("view engine", "hbs"); // выбор Handlebars в качестве шаблонизатора
hbs.registerPartials('./views/partials'); // задаём папку с partial шаблонами

app.use(homeRouter); // используем все маршруты из homeRouter
app.use('/admin', checkAuth, adminRouter); // checkAuth - middleware для проверки аутентифицирован ли пользователь, применяем ко всем маршрутам из adminRouter (код в файле middlewares.js)
app.use('/login', loginRouter);

app.use('*', notFoundHandler); // если ничего не совпало с маршрутами, которые обозначены выше - кидаем ошибку 404 с помощью handler
app.use(errorHandler); // используем handler ошибок

const port = process.env.PORT ?? 3000;

app.listen(port, () => {
  sequelize.sync()
    .then(() => {
      console.log(`App is running on port ${port}`);
    })
    .catch(err => console.error(err));
});