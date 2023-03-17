import { Router } from 'express';

import availableRouter from './admin/available.js';
import countyRouter from './admin/county.js';
import passwordRouter from './admin/password.js';
import receptionRouter from './admin/receptions.js';
import userRouter from './admin/users.js';
import visitRouter from './admin/visits.js';

import { checkAdmin } from '../middlewares.js';

const adminRouter = Router(); // создаём роутер для админ панели

adminRouter.get('/', (req, res, next) => {
  let isAdmin = req.session.role == 'admin'; // проверяем, является ли текущий пользователь админом
  res.render('admin/index', {
    admin: isAdmin
  }); // рендерим главную страницу админ панели
});

// регистрация других роутеров админ панели
// checkAdmin - middleware для проверки является ли пользователь администратором
// middleware применяются ко всем маршрутам в роутере, чтобы не применять его к каждому отдельно
// код данных middleware приведён в файле middlewares.js
adminRouter.use('/available', availableRouter);
adminRouter.use('/county', checkAdmin, countyRouter);
adminRouter.use('/password', passwordRouter);
adminRouter.use('/receptions', checkAdmin, receptionRouter);
adminRouter.use('/users', checkAdmin, userRouter);
adminRouter.use('/visits', visitRouter);

export default adminRouter;