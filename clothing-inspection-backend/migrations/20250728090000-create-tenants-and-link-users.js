'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // ① tenants 테이블 생성
    await queryInterface.createTable('tenants', {
      id: {
        type         : Sequelize.INTEGER.UNSIGNED,
        primaryKey   : true,
        autoIncrement: true,
        allowNull    : false
      },
      tenant_id: {
        type     : Sequelize.STRING(64),
        allowNull: false,
        unique   : true
      },
      tenant_name: {
        type     : Sequelize.STRING(128),
        allowNull: false
      },
      tenant_type: {
        type     : Sequelize.ENUM('fulfillment','brand'),
        allowNull: false
      },
      createdAt: {
        allowNull: false,
        type     : Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type     : Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // ② users 테이블에 tenant_id 컬럼 추가
    await queryInterface.addColumn('users', 'tenant_id', {
      type     : Sequelize.STRING(64),
      allowNull: false,
      defaultValue: 'default',
      after    : 'password'
    });

    // ③ 기본 index (tenant_id)
    await queryInterface.addIndex('users', ['tenant_id']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('users','tenant_id');
    await queryInterface.dropTable('tenants');
  }
}; 