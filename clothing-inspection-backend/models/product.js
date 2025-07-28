// models/product.js – defines Product and ProductVariant as separate models

const { addTenantHooks } = require('../utils/multitenancyHooks');

module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define(
    'Product',
    {
      company: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      productName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      size: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      color: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      wholesaler: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      wholesalerProductName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      location: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      tenant_id: {
        type: DataTypes.STRING(64),
        allowNull: false,
        comment: '테넌트 식별자',
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'products',
      timestamps: false,
    }
  );

  // association helper
  Product.associate = (models)=>{
    if(models.Tenant){
      Product.belongsTo(models.Tenant, {
        foreignKey:'tenant_id',
        targetKey:'tenant_id',
        as:'tenant',
        constraints:false
      });
    }
  };

  addTenantHooks(Product);

  return Product;
};
