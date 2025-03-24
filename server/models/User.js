const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/db');

/**
 * Модель пользователя
 */
const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [8, 100]
    }
  },
  role: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'user',
    validate: {
      isIn: [['user', 'admin']]
    }
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_login'
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'active',
    validate: {
      isIn: [['active', 'inactive', 'suspended']]
    }
  },
  preferences: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  }
}, {
  tableName: 'users',
  underscored: true,
  timestamps: true,
  paranoid: true, // Мягкое удаление (soft delete)
  indexes: [
    {
      fields: ['email'],
      unique: true
    }
  ],
  // Исключаем поле password из стандартного ответа модели
  defaultScope: {
    attributes: { exclude: ['password'] }
  },
  scopes: {
    // Для аутентификации добавляем поле password
    withPassword: {
      attributes: {}
    }
  }
});

// Хук перед созданием - хешируем пароль
User.beforeCreate(async (user) => {
  user.password = await bcrypt.hash(user.password, 12);
});

// Хук перед обновлением - хешируем пароль если он изменён
User.beforeUpdate(async (user) => {
  if (user.changed('password')) {
    user.password = await bcrypt.hash(user.password, 12);
  }
});

// Проверка пароля
User.prototype.validPassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

// Статический метод для поиска пользователя по email с паролем
User.findByEmailWithPassword = function(email) {
  return this.scope('withPassword').findOne({ where: { email } });
};

/**
 * Модель сессии пользователя для отслеживания активных токенов
 */
const Session = sequelize.define('Session', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id'
  },
  token: {
    type: DataTypes.STRING,
    allowNull: false
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'user_agent'
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'ip_address'
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'expires_at'
  }
}, {
  tableName: 'sessions',
  underscored: true,
  timestamps: true,
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['token'],
      unique: true
    }
  ]
});

// Устанавливаем связи между моделями
User.hasMany(Session, { foreignKey: 'userId', as: 'sessions' });
Session.belongsTo(User, { foreignKey: 'userId' });

module.exports = { User, Session };