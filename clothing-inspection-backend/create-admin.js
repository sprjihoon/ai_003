const bcrypt = require('bcrypt');
const { User, Tenant } = require('./models');

async function createAdminUser() {
  try {
    // 1. master 테넌트 존재 확인/생성
    const [masterTenant] = await Tenant.findOrCreate({
      where: { tenant_id: 'master' },
      defaults: {
        tenant_id: 'master',
        tenant_name: 'Master Tenant',
        tenant_type: 'brand' // 'brand' 또는 'fulfillment'
      }
    });

    // 기존 admin 계정 삭제
    await User.destroy({
      where: { username: 'admin', tenant_id: 'master' }
    });

    const hashedPassword = await bcrypt.hash('admin123', 10);
    await User.create({
      username: 'admin',
      password: hashedPassword,
      role: 'admin',
      tenant_id: masterTenant.tenant_id, // master 테넌트 ID 사용
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('관리자 계정이 생성되었습니다.');
    console.log('테넌트 ID: master');
    console.log('아이디: admin');
    console.log('비밀번호: admin123');
  } catch (error) {
    console.error('관리자 계정 생성 실패:', error);
  } finally {
    process.exit();
  }
}

createAdminUser(); 