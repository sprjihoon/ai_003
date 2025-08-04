// config/database.js (PlanetScale DATABASE_URL 방식으로 수정)
require('dotenv').config();
const { Sequelize } = require('sequelize');

// DATABASE_URL 또는 개별 DB 설정 검증
if (!process.env.DATABASE_URL && !process.env.DB_HOST) {
  throw new Error('❌ Missing DATABASE_URL or DB_HOST - at least one database configuration is required');
}

let sequelize;

if (process.env.DATABASE_URL) {
  // PlanetScale DATABASE_URL 방식
  const sanitizedUrl = process.env.DATABASE_URL.replace(/([?&])sslaccept=[^&]+&?/i, '$1').replace(/([?&])$/, '');
  
  sequelize = new Sequelize(sanitizedUrl, {
    dialect: 'mysql',
    logging: false,
    define: {
      foreignKeyConstraints: false
    }
  });
} else {
  // 개별 환경변수 방식 (fallback)
  sequelize = new Sequelize(
    process.env.DB_NAME || 'clothing_inspection',
    process.env.DB_USER || 'root',
    process.env.DB_PASS,
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      dialect: 'mysql',
      logging: false,
      define: {
        foreignKeyConstraints: false
      }
    }
  );
}

module.exports = sequelize;
