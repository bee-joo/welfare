import { Sequelize } from 'sequelize';
import * as dotenv from 'dotenv'

dotenv.config();

const sequelize = new Sequelize(process.env.CONN_STRING, { // создание подключения к БД
  dialect: 'postgres',
  define: {
    timestamps: false,
    freezeTableName: true
  }
});

export default sequelize;