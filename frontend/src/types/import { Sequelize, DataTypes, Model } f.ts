import { Sequelize, DataTypes, Model } from 'sequelize';

const sequelize = new Sequelize('database', 'username', 'password', {
  dialect: 'mysql',
  host: 'localhost'
});

class User extends Model {}
User.init({
  userId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: DataTypes.STRING,
  email: DataTypes.STRING,
  passwordHash: DataTypes.STRING,
  createdAt: DataTypes.DATE,
  lastLogin: DataTypes.DATE,
  role: DataTypes.STRING,
  isActive: DataTypes.BOOLEAN
}, {
  sequelize,
  modelName: 'User',
  tableName: 'users',
  timestamps: false
});

// ... 其他模型定義 ...

export { sequelize, User };
