const express = require('express');
const router = express.Router();
const { Op, Sequelize } = require('sequelize');
const Inspection = require('../models/inspection');
const InspectionDetail = require('../models/inspectionDetail');
const { Product, ProductVariant } = require('../models');
const User = require('../models/user');
const { auth } = require('../middleware/auth');
const ActivityLog = require('../models/ActivityLog');
const { getSetting, setSetting } = require('../utils/settings');
const Tenant = require('../models/Tenant');
const bcrypt = require('bcrypt');

// 관리자 통계 (기간 필터)
router.get('/stats/overview', auth, async (req, res) => {
  try {
    // 기존: if (req.user.role !== 'admin') {
    // 수정: admin 과 super_admin 허용
    const hasAdminRole = ['admin','super_admin'].includes(req.user.role);
    if (!hasAdminRole) {
      return res.status(403).json({ message: '관리자 권한이 필요합니다.' });
    }
    const { start, end } = req.query;
    const startDate = start ? new Date(start) : new Date('1970-01-01');
    const endDate = end ? new Date(end + 'T23:59:59') : new Date();

    // where for Inspection date
    const inspWhere = {
      createdAt: { [Op.between]: [startDate, endDate] },
      status: { [Op.in]: ['approved', 'completed'] }
    };

    // 도매처별 집계
    const wholesalerRows = await InspectionDetail.findAll({
      include: [{
        model: ProductVariant,
        as: 'ProductVariant',
        attributes: [],
        include: [{ model: Product, as: 'product', attributes: [] }]
      }, {
        model: Inspection,
        as: 'Inspection',
        attributes: [],
        where: inspWhere
      }],
      attributes: [
        [Sequelize.col('ProductVariant->product.wholesaler'), 'wholesaler'],
        [Sequelize.fn('SUM', Sequelize.col('InspectionDetail.totalQuantity')), 'inbound'],
        [Sequelize.fn('SUM', Sequelize.col('InspectionDetail.defectQuantity')), 'defect']
      ],
      group: ['ProductVariant->product.wholesaler'],
      raw: true
    });

    const wholesalerStats = wholesalerRows.map(r => {
      const inbound = parseInt(r.inbound || 0, 10);
      const defect = parseInt(r.defect || 0, 10);
      return {
        wholesaler: r.wholesaler || 'Unknown',
        inbound,
        defect,
        defectRate: inbound ? ((defect / inbound) * 100).toFixed(2) : '0.00'
      };
    });

    // 운영자(업체)별 집계
    const operatorRows = await InspectionDetail.findAll({
      include: [{ model: Inspection, as:'Inspection', attributes: ['company'], where: inspWhere }],
      attributes: [
        [Sequelize.col('Inspection.company'), 'company'],
        [Sequelize.fn('SUM', Sequelize.col('InspectionDetail.totalQuantity')), 'inbound'],
        [Sequelize.fn('SUM', Sequelize.col('InspectionDetail.defectQuantity')), 'defect']
      ],
      group: ['Inspection.company'],
      raw: true
    });

    const operatorStats = operatorRows.map(r => {
      const inbound = parseInt(r.inbound || 0, 10);
      const defect = parseInt(r.defect || 0, 10);
      return {
        company: r.company || 'Unknown',
        inbound,
        defect,
        defectRate: inbound ? ((defect / inbound) * 100).toFixed(2) : '0.00'
      };
    });

    // 요약 숫자
    const [skuCnt, workerCnt, inspectorCnt, operatorCnt] = await Promise.all([
      ProductVariant.count(),
      User.count({ where: { role: 'worker' } }),
      User.count({ where: { role: 'inspector' } }),
      User.count({ where: { role: 'operator' } })
    ]);

    res.json({
      wholesalerStats,
      operatorStats,
      summary: {
        totalSkus: skuCnt,
        workerCount: workerCnt,
        inspectorCount: inspectorCnt,
        operatorCount: operatorCnt
      }
    });
  } catch (err) {
    if (err.name === 'SequelizeDatabaseError' && /doesn\'t exist/i.test(err.message)) {
      console.warn('⚠️ admin overview skipped – missing tables:', err.message);
      return res.json({
        wholesalerStats: [],
        operatorStats: [],
        summary: { totalSkus: 0, workerCount: 0, inspectorCount: 0, operatorCount: 0 }
      });
    }
    console.error('admin overview error', err);
    res.status(500).json({ message: err.message });
  }
});

// ===== 활동 로그 =====
router.get('/activity', auth, async (req, res)=>{
  try{
    const hasAdminRole = ['admin','super_admin'].includes(req.user.role);
    if(!hasAdminRole) return res.status(403).json({ message:'관리자 권한 필요' });
    let { start, end, date, level } = req.query;

    // date 파라미터가 있으면 동일한 날짜로 start/end 설정
    if (date && !start && !end) {
      start = date;
      end   = date;
    }

    // 기본값: 오늘 날짜
    if (!start && !end) {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm   = String(today.getMonth()+1).padStart(2,'0');
      const dd   = String(today.getDate()).padStart(2,'0');
      start = `${yyyy}-${mm}-${dd}`;
      end   = start;
    }

    const startDate = new Date(start);
    const endDate   = new Date((end||start)+'T23:59:59');

    const where = { createdAt:{ [Op.between]:[startDate,endDate] } };
    if(level) where.level = level;

    const logs = await ActivityLog.findAll({
      where,
      include:[
        { model: Inspection, attributes:['inspectionName'] },
        { model: User, attributes:['id','username'] }
      ],
      order:[['createdAt','DESC']]
    });

    res.json(logs.map(l=>({
      id:l.id,
      createdAt:l.createdAt,
      level:l.level,
      type:l.type,
      message:l.message,
      inspectionName:l.Inspection?.inspectionName||null,
      user:l.User?.username||null
    })));
  }catch(err){
    console.error('activity list error', err);
    res.status(500).json({ message:err.message });
  }
});

// ===== 미확정·작업 지연 전표 =====
router.get('/alerts', auth, async (req,res)=>{
  try{
    const hasAdminRole = ['admin','super_admin'].includes(req.user.role);
    if(!hasAdminRole) return res.status(403).json({ message:'관리자 권한 필요' });
    const delayDays = parseInt(req.query.delayDays||2,10); // 기본 2일
    const delayDate = new Date(Date.now() - delayDays*24*60*60*1000);

    const unconfirmed = await Inspection.findAll({ where:{ status:{ [Op.in]:['pending','rejected'] } }, attributes:['id','inspectionName','company','status','updatedAt']});
    const delayed = await Inspection.findAll({
      where:{ status:{ [Op.in]:['approved','completed'] }, workStatus:{ [Op.ne]:'completed' }, createdAt:{ [Op.lt]: delayDate } },
      attributes:['id','inspectionName','company','workStatus','createdAt']
    });
    res.json({ unconfirmed, delayed });
  }catch(err){ console.error('alerts error', err); res.status(500).json({ message:err.message }); }
});

// ===== 시스템 설정: 이메일 From =====
router.get('/settings/email-from', auth, async (req,res)=>{
  const hasAdminRole = ['admin','super_admin'].includes(req.user.role);
  if(!hasAdminRole) return res.status(403).json({ message:'관리자 권한 필요' });
  try{
    const val = await getSetting('emailFrom');
    res.json({ emailFrom: val });
  }catch(err){ res.status(500).json({ message: err.message }); }
});

router.put('/settings/email-from', auth, async (req,res)=>{
  const hasAdminRole = ['admin','super_admin'].includes(req.user.role);
  if(!hasAdminRole) return res.status(403).json({ message:'관리자 권한 필요' });
  const { emailFrom } = req.body;
  if(!emailFrom) return res.status(400).json({ message:'emailFrom required' });
  try{
    await setSetting('emailFrom', emailFrom);
    res.json({ success:true });
  }catch(err){ res.status(500).json({ message: err.message }); }
});

// ────────────────────
//  테넌트 관리 (슈퍼어드민)
// ────────────────────

const isSuperAdmin = (req,res,next)=>{
  if(req.user.role!=='super_admin'){
    return res.status(403).json({ message:'슈퍼어드민 권한이 필요합니다.'});
  }
  return next();
};

// 목록
router.get('/tenants', auth, isSuperAdmin, async (_req,res)=>{
  const list = await Tenant.findAll();
  res.json(list);
});

// 생성 (운영자 계정 동시 생성)
router.post('/tenants', auth, isSuperAdmin, async (req,res)=>{
  try{
    const { tenantId, tenantName, tenantType, operatorUsername, operatorPassword } = req.body;
    if(!tenantId || !tenantName || !tenantType) return res.status(400).json({ message:'필수 값 누락' });

    // 트랜잭션 내부 수행
    const t = await Tenant.sequelize.transaction();
    try{
      const tenant = await Tenant.create({
        tenant_id  : tenantId,
        tenant_name: tenantName,
        tenant_type: tenantType
      }, { transaction:t });

      if(operatorUsername && operatorPassword){
        const hashed = await bcrypt.hash(operatorPassword, 10);
        await User.create({
          tenant_id: tenantId,
          username : operatorUsername,
          password : hashed,
          role     : 'operator'
        },{ transaction:t });
      }

      await t.commit();
      res.status(201).json({ success:true });
    }catch(err){ await t.rollback(); throw err; }
  }catch(err){ console.error('create tenant error', err); res.status(500).json({ message: err.message }); }
});

// 슈퍼 어드민 생성 엔드포인트 (보안을 위해 특별한 키 필요)
router.post('/create-super-admin', async (req, res) => {
  try {
    // 실행 가드: 운영에서 비활성화 가능
    if (process.env.ENABLE_SUPERADMIN_SEED !== 'true') {
      return res.status(403).json({ message: 'This endpoint is disabled' });
    }

    const { secret } = req.body;
    const expected = process.env.SUPERADMIN_SEED_SECRET || 'CREATE_SUPER_ADMIN_2024';
    if (secret !== expected) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const bcrypt = require('bcrypt');
    const sequelize = require('../config/database');

    console.log('🚀 슈퍼 어드민 계정 생성 시작...');

    // 테이블이 없으면 생성 (Raw SQL로 확실하게)
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS tenants (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id VARCHAR(64) NOT NULL UNIQUE,
        tenant_name VARCHAR(128) NOT NULL,
        tenant_type ENUM('fulfillment', 'brand') NOT NULL,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        email VARCHAR(255) UNIQUE,
        password VARCHAR(255) NOT NULL,
        tenant_id VARCHAR(64) NOT NULL,
        company VARCHAR(255),
        role ENUM('operator', 'inspector', 'viewer', 'super_admin', 'admin', 'worker') NOT NULL DEFAULT 'inspector',
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // 마스터 테넌트 생성/업데이트 (Raw SQL)
    await sequelize.query(`
      INSERT INTO tenants (tenant_id, tenant_name, tenant_type) 
      VALUES ('master', 'Master Tenant', 'fulfillment')
      ON DUPLICATE KEY UPDATE tenant_name='Master Tenant'
    `);

    // 기존 슈퍼 어드민 삭제 (있다면)
    await sequelize.query(`
      DELETE FROM users WHERE username = 'superadmin' AND tenant_id = 'master'
    `);

    // 슈퍼 어드민 계정 생성
    const password = 'SuperAdmin2024!@#';
    const hashedPassword = await bcrypt.hash(password, 12);

    await sequelize.query(`
      INSERT INTO users (username, email, password, tenant_id, company, role)
      VALUES (?, ?, ?, ?, ?, ?)
    `, {
      replacements: ['superadmin', 'superadmin@ai003.com', hashedPassword, 'master', 'AI_003 System', 'super_admin']
    });

    res.json({
      success: true,
      message: '슈퍼 어드민 계정이 성공적으로 생성되었습니다!',
      account: {
        tenantId: 'master',
        username: 'superadmin',
        email: 'superadmin@ai003.com',
        password: password,
        company: 'AI_003 System',
        role: 'super_admin'
      }
    });

  } catch (error) {
    console.error('슈퍼 어드민 생성 오류:', error);
    res.status(500).json({ 
      success: false, 
      message: '슈퍼 어드민 계정 생성 실패',
      error: error.message 
    });
  }
});

// ─────────────────────────────
//  슈퍼어드민: 테넌트 전체 삭제
//  DELETE /api/admin/tenants/:tenantId/full
// ─────────────────────────────

router.delete('/tenants/:tenantId/full', auth, isSuperAdmin, async (req, res) => {
  const { tenantId } = req.params;
  const sequelize = require('../config/database');

  const tables = [
    'inspection_details',
    'inspections',
    'product_variants',
    'products',
    'users'
  ];

  const t = await sequelize.transaction();
  try {
    for (const tbl of tables) {
      await sequelize.query(`DELETE FROM ${tbl} WHERE tenant_id = ?`, {
        replacements: [tenantId],
        transaction: t
      });
    }

    await sequelize.query('DELETE FROM tenants WHERE tenant_id = ?', {
      replacements: [tenantId],
      transaction: t
    });

    await t.commit();
    res.json({ success: true });
  } catch (err) {
    await t.rollback();
    console.error('tenant cascade delete error', err);
    res.status(500).json({ message: err.message });
  }
}); 

// ─────────────────────────────
//  슈퍼어드민: 스키마 보정 (온라인 변경)
//  POST /api/admin/schema/ensure-tenant-columns
// ─────────────────────────────
router.post('/schema/ensure-tenant-columns', auth, isSuperAdmin, async (_req,res)=>{
	const sequelize = require('../config/database');
	try{
		// product_variants.tenant_id 없으면 추가
		const [rows] = await sequelize.query("SHOW COLUMNS FROM product_variants LIKE 'tenant_id'");
		if(!Array.isArray(rows) || rows.length===0){
			await sequelize.query("ALTER TABLE product_variants ADD COLUMN tenant_id VARCHAR(64) NULL AFTER barcode");
		}

		// products 테이블 필수 컬럼 보정
		const ensureColumn = async (table, column, ddl) => {
			const [r] = await sequelize.query(`SHOW COLUMNS FROM ${table} LIKE '${column}'`);
			if(!Array.isArray(r) || r.length===0){
				await sequelize.query(`ALTER TABLE ${table} ADD COLUMN ${ddl}`);
			}
		};
		await ensureColumn('products', 'size', "size JSON NULL AFTER productName");
		await ensureColumn('products', 'color', "color JSON NULL AFTER size");
		await ensureColumn('products', 'wholesalerProductName', "wholesalerProductName VARCHAR(255) NULL AFTER wholesaler");
		await ensureColumn('products', 'location', "location VARCHAR(255) NULL AFTER wholesalerProductName");

		// inspections 테이블에 tenant_id 없으면 추가
		await ensureColumn('inspections', 'tenant_id', "tenant_id VARCHAR(64) NULL AFTER inspector_id");
		await ensureColumn('inspections', 'rejectReason', "rejectReason TEXT NULL AFTER comment");

		// inspection_comments 테이블이 없으면 생성
		const [ic] = await sequelize.query("SHOW TABLES LIKE 'inspection_comments'");
		if(!Array.isArray(ic) || ic.length===0){
			await sequelize.query(`
				CREATE TABLE IF NOT EXISTS inspection_comments (
					id INT AUTO_INCREMENT PRIMARY KEY,
					content TEXT NOT NULL,
					parent_comment_id INT NULL,
					inspection_id INT NOT NULL,
					user_id INT NOT NULL,
					created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
					updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
				)
			`);
		}

		// inspection_receipt_photos 테이블이 없으면 생성
		const [irp] = await sequelize.query("SHOW TABLES LIKE 'inspection_receipt_photos'");
		if(!Array.isArray(irp) || irp.length===0){
			await sequelize.query(`
				CREATE TABLE IF NOT EXISTS inspection_receipt_photos (
					id INT AUTO_INCREMENT PRIMARY KEY,
					inspectionId INT NOT NULL,
					photoUrl VARCHAR(255) NOT NULL,
					uploadedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
				)
			`);
		}else{
			// 누락 컬럼 보강
			await ensureColumn('inspection_receipt_photos', 'photoUrl', "photoUrl VARCHAR(255) NULL AFTER inspectionId");
			await ensureColumn('inspection_receipt_photos', 'uploadedAt', "uploadedAt DATETIME NULL DEFAULT CURRENT_TIMESTAMP AFTER photoUrl");
		}

		res.json({ success:true });
	}catch(err){
		console.error('schema ensure error', err);
		res.status(500).json({ message: err.message });
	}
});

router.get('/schema/verify', auth, isSuperAdmin, async (_req,res)=>{
	const sequelize = require('../config/database');
	try{
		const q = async (sql)=>{ try{ const [r]=await sequelize.query(sql); return r; }catch(e){ return { error:e.message }; } };
		const result = {
			products: await q("SHOW COLUMNS FROM products"),
			product_variants: await q("SHOW COLUMNS FROM product_variants"),
			inspection_comments: await q("SHOW COLUMNS FROM inspection_comments"),
			inspection_receipt_photos: await q("SHOW COLUMNS FROM inspection_receipt_photos")
		};
		res.json({ success:true, result });
	}catch(err){ res.status(500).json({ success:false, message: err.message }); }
});

module.exports = router; 