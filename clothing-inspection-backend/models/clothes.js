// models/clothes.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { addTenantHooks } = require('../utils/multitenancyHooks');

const Clothes = sequelize.define('Clothes', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  brand: {
    type: DataTypes.STRING,
    allowNull: true
  },
  size: {
    type: DataTypes.STRING,
    allowNull: true
  },
  company: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'inspected', 'rejected'),
    defaultValue: 'pending'
  },
  tenant_id:{
    type: DataTypes.STRING(64),
    allowNull:false,
    comment:'테넌트 식별자'
  }
});

addTenantHooks(Clothes);

module.exports = Clothes;
