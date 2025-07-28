const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  tenant_id: {
    type: DataTypes.STRING(64),
    allowNull: false,
    comment: '테넌트 식별자',
  },
  company: {
    type: DataTypes.STRING,
    allowNull: true
  },
  role: {
    type: DataTypes.ENUM('operator', 'inspector', 'viewer', 'super_admin', 'admin', 'worker'),
    allowNull: false,
    defaultValue: 'inspector'
  }
}, {
  timestamps: true,
  tableName: 'users'
});

module.exports = User;

// association helper
module.exports.associate = models => {
  User.hasMany(models.Inspection, {
    foreignKey: 'inspector_id',
    as: 'inspections',
    constraints: false
  });

  // read history
  User.hasMany(models.InspectionRead, {
    foreignKey: 'user_id',
    constraints: false
  });

  // tenant relation
  if(models.Tenant){
    User.belongsTo(models.Tenant, {
      foreignKey : 'tenant_id',
      targetKey  : 'tenant_id',
      as         : 'tenant',
      constraints: false
    });
  }
};
