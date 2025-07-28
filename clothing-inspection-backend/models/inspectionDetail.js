const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Inspection = require('./inspection');
const { ProductVariant } = require('./product');
const { addTenantHooks } = require('../utils/multitenancyHooks');

const InspectionDetail = sequelize.define('InspectionDetail', {
  inspectionId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  productVariantId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  totalQuantity: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  normalQuantity: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  defectQuantity: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  handledNormal: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  handledDefect: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  handledHold: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  result: {
    type: DataTypes.ENUM('pass', 'fail'),
    allowNull: false
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  qualityGrade: {
    type: DataTypes.ENUM('A', 'B', 'C', 'D', 'E'),
    allowNull: true
  },
  photoUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  tenant_id:{
    type: DataTypes.STRING(64),
    allowNull:false,
    comment:'테넌트 식별자'
  }
}, {
  timestamps: true,
  tableName: 'inspection_details'
});

// association helper
module.exports.associate = (models)=>{
  if(models.Tenant){
    module.exports.belongsTo(models.Tenant, {
      foreignKey: 'tenant_id',
      targetKey : 'tenant_id',
      as        : 'tenant',
      constraints:false
    });
  }
};

module.exports = InspectionDetail;

addTenantHooks(module.exports);
