// config/cli-config.js  (sequelize-cli 전용)
require('dotenv').config();

module.exports = {
  production: {
    url    : process.env.DATABASE_URL,
    dialect: 'mysql',
    dialectOptions: {
      ssl: {
        require            : true,
        rejectUnauthorized : false
      }
    }
  }
}; 