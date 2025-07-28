const { DataTypes } = require('sequelize');
const sequelize            = require('../config/database');
const { addTenantHooks }    = require('../utils/multitenancyHooks');

const Brand = sequelize.define('Brand', {
  tenant_id: {
    type      : DataTypes.STRING(64),
    allowNull : false
  },
  name: {
    type      : DataTypes.STRING(128),
    allowNull : false
  },
  code: {
    type      : DataTypes.STRING(64),
    allowNull : false
  }
}, {
  tableName: 'brands',
  timestamps: true
});

// association
Brand.associate = (models)=>{
  if(models.Tenant){
    Brand.belongsTo(models.Tenant, {
      foreignKey : 'tenant_id',
      targetKey  : 'tenant_id',
      as         : 'tenant',
      constraints: false
    });
  }
};

addTenantHooks(Brand);

module.exports = Brand; 