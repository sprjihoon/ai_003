const bcrypt = require('bcrypt');
const { User, Tenant } = require('./models');
require('dotenv').config();

async function createSuperAdmin() {
  try {
    console.log('🚀 슈퍼 어드민 계정 생성 시작...');

    // 마스터 테넌트 생성 (모든 테넌트를 관리할 수 있는 최상위 테넌트)
    const [masterTenant] = await Tenant.findOrCreate({
      where: { tenant_id: 'master' },
      defaults: {
        tenant_id: 'master',
        name: 'Master Tenant',
        description: 'Super Admin Master Tenant for managing all tenants',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    console.log('✅ 마스터 테넌트 생성/확인 완료');

    // 기존 슈퍼 어드민 계정 삭제 (있다면)
    await User.destroy({
      where: { 
        username: 'superadmin',
        tenant_id: 'master'
      }
    });

    // 강력한 비밀번호 생성
    const password = 'SuperAdmin2024!@#';
    const hashedPassword = await bcrypt.hash(password, 12);

    // 슈퍼 어드민 계정 생성
    const superAdmin = await User.create({
      username: 'superadmin',
      email: 'superadmin@ai003.com',
      password: hashedPassword,
      tenant_id: 'master',
      company: 'AI_003 System',
      role: 'super_admin',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('🎉 슈퍼 어드민 계정이 성공적으로 생성되었습니다!');
    console.log('');
    console.log('====================================');
    console.log('📋 슈퍼 어드민 계정 정보');
    console.log('====================================');
    console.log(`🔐 테넌트 ID: master`);
    console.log(`👤 사용자명: superadmin`);
    console.log(`📧 이메일: superadmin@ai003.com`);
    console.log(`🔑 비밀번호: ${password}`);
    console.log(`🏢 회사: AI_003 System`);
    console.log(`👑 역할: super_admin`);
    console.log('====================================');
    console.log('');
    console.log('💡 이 계정으로 로그인하면:');
    console.log('   ✅ 모든 테넌트 관리 가능');
    console.log('   ✅ 모든 사용자 관리 가능');
    console.log('   ✅ 시스템 전체 설정 관리 가능');
    console.log('   ✅ 모든 검수 데이터 접근 가능');
    console.log('');
    console.log('⚠️  보안을 위해 첫 로그인 후 비밀번호를 변경해주세요!');

  } catch (error) {
    console.error('❌ 슈퍼 어드민 계정 생성 실패:', error);
    console.error('상세 오류:', error.message);
  } finally {
    process.exit();
  }
}

// 스크립트 실행
createSuperAdmin(); 