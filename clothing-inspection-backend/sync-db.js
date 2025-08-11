// sync-db.js
const sequelize = require('./config/database');
require('./models');
const { User, Tenant } = require('./models');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function syncDatabase() {
  try {
    console.log('🛠 DB 동기화 시작...');
    await sequelize.authenticate();
    console.log('✅ DB 연결 성공');

    await sequelize.sync({
      force: true,
      logging: (sql) => {
        if (/foreign key/i.test(sql)) {
          console.error('🚨 FK SQL →', sql);
        }
      }
    });
    console.log('✅ DB 동기화 완료');

    // 1. master 테넌트 생성
    const [masterTenant] = await Tenant.findOrCreate({
      where: { tenant_id: 'master' },
      defaults: {
        tenant_id: 'master',
        tenant_name: 'Master Tenant',
        tenant_type: 'brand'
      }
    });
    console.log('✅ Master 테넌트 생성 완료');

    // 2. 기본 관리자 계정 생성 (master 테넌트 소속)
    const adminRaw = process.env.ADMIN_PASSWORD || 'admin123';
    const adminPassword = await bcrypt.hash(adminRaw, 10);
    await User.create({
      username: 'admin',
      password: adminPassword,
      role: 'admin',
      tenant_id: masterTenant.tenant_id
    });
    console.log('✅ 관리자 계정 생성 완료 (tenant: master)');

    // 3. 운영자 계정 정보
    const operatorRaw = process.env.OPERATOR_PASSWORD || 'op123';
    const operatorPassword = await bcrypt.hash(operatorRaw, 10);
    const operators = [
      { username: 'op1', email: 'op1@naver.com', company: '테스트업체1' },
      { username: 'op2', email: 'op2@naver.com', company: '테스트업체2' },
      { username: 'op3', email: 'op3@naver.com', company: '테스트업체3' },
      { username: 'op4', email: 'op4@naver.com', company: '테스트업체4' },
      { username: 'op5', email: 'op5@naver.com', company: '테스트업체5' },
      { username: 'op6', email: 'op6@naver.com', company: '테스트업체6' }
    ];

    // 각 운영자별로 테넌트 생성 및 연결
    for (const op of operators) {
      const [opTenant] = await Tenant.findOrCreate({
        where: { tenant_id: op.company },
        defaults: {
          tenant_id: op.company,
          tenant_name: op.company,
          tenant_type: 'brand'
        }
      });
      await User.create({
        username: op.username,
        email: op.email,
        password: operatorPassword,
        company: op.company,
        role: 'operator',
        tenant_id: opTenant.tenant_id
      });
      console.log(`✅ 운영자 계정 생성: ${op.username} (tenant: ${op.company})`);
    }

    console.log('🎉 DB 초기화 및 계정 생성 완료');
  } catch (error) {
    console.error('❌ DB 동기화 중 오류 발생:', error.message);
  } finally {
    await sequelize.close();
    console.log('✅ DB 연결 종료');
  }
}

syncDatabase().then(() => {
  console.log('✅ sync-db.js 완료');
}).catch(err => {
  console.error('❌ sync-db.js 오류:', err.message);
});
