const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { addTenantHooks } = require('../utils/multitenancyHooks');

const Inspection = sequelize.define('Inspection', {
  inspectionName: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    comment: '검수 전표 이름 (업체명+날짜+버전)'
  },
  company: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'approved', 'rejected'),
    allowNull: false,
    defaultValue: 'pending'
  },
  workStatus: {
    type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'error'),
    allowNull: false,
    defaultValue: 'pending'
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  result: {
    type: DataTypes.ENUM('pass', 'fail'),
    allowNull: false
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  rejectReason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  inspector_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  tenant_id:{
    type: DataTypes.STRING(64),
    allowNull:false,
    comment:'테넌트 식별자'
  }
}, {
  timestamps: false,
  tableName: 'inspections',
  defaultScope: {
    // runtime에서 override 예정; placeholder
  }
});

Inspection.associate = models => {
  // Remove duplicate associations - they are already defined in index.js
  // Link to read tracking (no FK in PlanetScale)
  Inspection.hasMany(models.InspectionRead, {
    foreignKey: 'inspection_id',
    constraints: false
  });
};

addTenantHooks(Inspection);

module.exports = Inspection;
