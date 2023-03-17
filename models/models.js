import { DataTypes } from 'sequelize';
import sequelize from './db.js';

export const Client = sequelize.define('Client', {
  Id_client: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false
  },
  Name: {
    type: DataTypes.STRING(50)
  },
  Email: {
    type: DataTypes.STRING(50)
  },
  Phone: {
    type: DataTypes.BIGINT
  }
});

export const Reception = sequelize.define('Reception', {
  Id_reception: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false
  },
  Id_county: {
    type: DataTypes.INTEGER
  },
  Cabinet: {
    type: DataTypes.INTEGER
  },
  Num_reception: {
    type: DataTypes.STRING(50)
  },
  Theme: {
    type: DataTypes.STRING(50)
  }
});

export const Request = sequelize.define('Request', {
  Id_request: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false
  },
  Id_reception: {
    type: DataTypes.INTEGER
  },
  Id_client: {
    type: DataTypes.INTEGER
  },
  Date_visit: {
    type: DataTypes.DATE
  }
});

export const Available = sequelize.define('Available', {
  Id_available: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false
  },
  Id_reception: {
    type: DataTypes.INTEGER
  },
  Available_date: {
    type: DataTypes.DATE
  }
});

export const User = sequelize.define('User', {
  Id_user: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false
  },
  Username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  Password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  Role: {
    type: DataTypes.STRING(50)
  },
  Id_county: {
    type: DataTypes.INTEGER
  }
})

export const County = sequelize.define('County', {
  Id_county: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false
  },
  County_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  }
})

Request.belongsTo(Reception, {
  foreignKey: 'Id_reception'
});

Request.belongsTo(Client, {
  foreignKey: 'Id_client'
});

Available.belongsTo(Reception, {
  foreignKey: 'Id_reception'
});

Reception.belongsTo(County, {
  foreignKey: 'Id_county'
});

User.belongsTo(County, {
  foreignKey: 'Id_county'
});