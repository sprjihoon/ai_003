const { DataTypes } = require('sequelize');
const sequelize            = require('../config/database');

// 테넌트(고객사, 브랜드) 모델
// ‑ tenant_id : 고객사가 로그인 시 입력하는 식별자(고유)
// ‑ tenant_name : 회사/브랜드 표시용 이름
// ‑ tenant_type : fulfillment | brand
//
// NOTE: 실제 PK(id)는 Sequelize가 자동 생성하는 auto-increment 정수 id 로 두고,
// tenant_id 는 비즈니스 키로써 UNIQUE 처리한다.
module.exports = sequelize.define('Tenant', {
  tenant_id: {
    type      : DataTypes.STRING(64),
    allowNull : false,
    unique    : true,
    comment   : '사업장/브랜드 구분용 로그인 ID'
  },
  tenant_name: {
    type      : DataTypes.STRING(128),
    allowNull : false,
    comment   : '표시용 이름'
  },
  tenant_type: {
    type      : DataTypes.ENUM('fulfillment','brand'),
    allowNull : false,
    comment   : '테넌트 유형'
  }
}, {
  tableName : 'tenants',
  timestamps: true
});

// association helper
module.exports.associate = (models) => {
  if(models.User){
    module.exports.hasMany(models.User, {
      foreignKey : 'tenant_id',
      sourceKey  : 'tenant_id',
      as         : 'users',
      constraints: false
    });
  }
}; 