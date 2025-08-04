// config/database.js (PlanetScale DATABASE_URL 방식으로 수정)
require('dotenv').config();
const { Sequelize } = require('sequelize');

// DATABASE_URL 또는 개별 DB 설정 검증
if (!process.env.DATABASE_URL && !process.env.DB_HOST) {
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
    process.env.DB_NAME || 'clothing_inspection',
    process.env.DB_USER || 'root',
    process.env.DB_PASS,
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
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
    }
  );
}

module.exports = sequelize;
