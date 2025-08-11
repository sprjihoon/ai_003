// config/database.js (PlanetScale DATABASE_URL 방식으로 수정)
require('dotenv').config();
const { Sequelize } = require('sequelize');

// Normalize env
const DB_HOST = process.env.DB_HOST || process.env.MYSQL_HOST || '127.0.0.1';
const DB_PORT = process.env.DB_PORT || process.env.MYSQL_PORT || 3306;
const DB_NAME = process.env.DB_NAME || process.env.MYSQL_DATABASE || 'clothing_inspection';
const DB_USER = process.env.DB_USER || process.env.MYSQL_USER || 'root';
const DB_PASS = process.env.DB_PASS ?? process.env.DB_PASSWORD ?? process.env.MYSQL_PASSWORD ?? null;

// DATABASE_URL 또는 개별 DB 설정 검증
if (!process.env.DATABASE_URL && !DB_HOST) {
  throw new Error('❌ Missing DATABASE_URL or DB_HOST - at least one database configuration is required');
}

let sequelize;

if (process.env.DATABASE_URL) {
  // PlanetScale DATABASE_URL 방식 - SSL 파라미터는 제거하고 dialectOptions에서 SSL 설정
  let sanitizedUrl = process.env.DATABASE_URL
    .replace(/([?&])sslaccept=[^&]+&?/gi, '$1')
    .replace(/([?&])ssl=[^&]+&?/gi, '$1')
    .replace(/([?&])sslmode=[^&]+&?/gi, '$1')
    .replace(/([?&])sslcert=[^&]+&?/gi, '$1')
    .replace(/([?&])sslkey=[^&]+&?/gi, '$1')
    .replace(/([?&])sslrootcert=[^&]+&?/gi, '$1')
    .replace(/([?&])sslca=[^&]+&?/gi, '$1')
    .replace(/([?&])$/, '');
  
  console.log('🔗 Using DATABASE_URL with PlanetScale SSL configuration');
  
  sequelize = new Sequelize(sanitizedUrl, {
    dialect: 'mysql',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: false,
    define: {
      foreignKeyConstraints: false
    }
  });
} else {
  // 개별 환경변수 방식 (fallback)
  console.log('🔗 Using individual DB environment variables');
  sequelize = new Sequelize(
    DB_NAME,
    DB_USER,
    DB_PASS,
    {
      host: DB_HOST,
      port: DB_PORT,
      dialect: 'mysql',
      dialectOptions: {
        ssl: process.env.DB_SSL === 'true' ? { require: true, rejectUnauthorized: false } : undefined
      },
      logging: false,
      define: {
        foreignKeyConstraints: false
      }
    }
  );
}

module.exports = sequelize;
