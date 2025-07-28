'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // inspection_details
    await queryInterface.addColumn('inspection_details', 'tenant_id', {
      type: Sequelize.STRING(64),
      allowNull: false,
      defaultValue: 'default',
      after: 'inspectionId'
    });
    await queryInterface.addIndex('inspection_details', ['tenant_id']);

    // products
    await queryInterface.addColumn('products', 'tenant_id', {
      type: Sequelize.STRING(64),
      allowNull: false,
      defaultValue: 'default',
      after: 'location'
    });
    await queryInterface.addIndex('products', ['tenant_id']);
  },

  async down (queryInterface) {
    await queryInterface.removeColumn('inspection_details', 'tenant_id');
    await queryInterface.removeColumn('products', 'tenant_id');
  }
}; 