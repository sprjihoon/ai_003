'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    for(const tbl of ['inspections','Clothes','clothes']){
      // PlanetScale uses lowercase table names but some MySQL may be case-sensitive;
      // try-catch separate adds to tolerate already-existing or missing tables.
      try{
        await queryInterface.addColumn(tbl, 'tenant_id', {
          type: Sequelize.STRING(64),
          allowNull: false,
          defaultValue: 'default',
          after: 'company'
        });
      }catch(err){ console.warn(`[migration tenant_id] skip ${tbl}`, err.message); }
    }
  },

  async down (queryInterface) {
    for(const tbl of ['inspections','Clothes','clothes']){
      try{ await queryInterface.removeColumn(tbl, 'tenant_id'); }
      catch(err){ console.warn(`[migration tenant_id down]`, err.message); }
    }
  }
}; 