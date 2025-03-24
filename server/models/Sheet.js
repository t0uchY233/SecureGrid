const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

/**
 * Модель таблицы (документа)
 */
const Sheet = sequelize.define('Sheet', {
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
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  rows: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 50,
    validate: {
      min: 1,
      max: 1000
    }
  },
  columns: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 20,
    validate: {
      min: 1,
      max: 100
    }
  },
  // Владелец таблицы
  ownerId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'owner_id'
  },
  // Метаданные для дополнительных настроек
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  }
}, {
  tableName: 'sheets',
  underscored: true,
  timestamps: true,
  paranoid: true, // Мягкое удаление (soft delete)
  indexes: [
    {
      fields: ['owner_id']
    },
    {
      fields: ['name']
    }
  ]
});

/**
 * Модель ячейки таблицы
 */
const Cell = sequelize.define('Cell', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  // Идентификатор таблицы
  sheetId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'sheet_id'
  },
  // Координаты ячейки в таблице
  row: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  column: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  // Сырое значение, введенное пользователем (может быть формулой)
  value: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Вычисленное значение (результат формулы или то же, что и value для обычных данных)
  displayValue: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'display_value'
  },
  // Тип данных в ячейке: string, number, boolean, date, formula
  type: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'string',
    validate: {
      isIn: [['string', 'number', 'boolean', 'date', 'formula']]
    }
  },
  // Формат отображения данных
  format: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  // Метаданные для доп. информации
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true
  }
}, {
  tableName: 'cells',
  underscored: true,
  timestamps: true,
  indexes: [
    {
      fields: ['sheet_id']
    },
    {
      fields: ['sheet_id', 'row', 'column'],
      unique: true
    }
  ]
});

/**
 * Модель разрешений доступа к таблице
 */
const Permission = sequelize.define('Permission', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  // Идентификатор таблицы
  sheetId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'sheet_id'
  },
  // Идентификатор пользователя
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id'
  },
  // Роль пользователя: owner, editor, viewer
  role: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'viewer',
    validate: {
      isIn: [['owner', 'editor', 'viewer']]
    }
  }
}, {
  tableName: 'permissions',
  underscored: true,
  timestamps: true,
  indexes: [
    {
      fields: ['sheet_id', 'user_id'],
      unique: true
    }
  ]
});

// Устанавливаем связи между моделями
Sheet.hasMany(Cell, { foreignKey: 'sheetId', as: 'cells' });
Cell.belongsTo(Sheet, { foreignKey: 'sheetId' });

Sheet.hasMany(Permission, { foreignKey: 'sheetId', as: 'permissions' });
Permission.belongsTo(Sheet, { foreignKey: 'sheetId' });

module.exports = { Sheet, Cell, Permission };