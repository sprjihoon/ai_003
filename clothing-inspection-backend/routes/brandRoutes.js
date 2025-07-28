const express = require('express');
const router  = express.Router();
const { auth } = require('../middleware/auth');
const Brand    = require('../models/Brand');

// role check (operator / admin / super_admin)
const canManage = (req,res,next)=>{
  const role = (req.user?.role||'').toLowerCase();
  if(['operator','admin','super_admin'].includes(role)) return next();
  return res.status(403).json({ message:'권한이 없습니다.'});
};

// ──────────────────────────────────────
// 목록
router.get('/', auth, async (req,res)=>{
  const list = await Brand.findAll({
    where:{},
    order:[['createdAt','DESC']],
    tenant_id: req.user.tenant_id
  });
  res.json(list);
});

// 생성
router.post('/', auth, canManage, async (req,res)=>{
  try{
    const { name, code } = req.body;
    if(!name || !code) return res.status(400).json({ message:'name, code required' });
    const row = await Brand.create({ name, code }, { tenant_id: req.user.tenant_id });
    res.status(201).json(row);
  }catch(err){
    if(err.name==='SequelizeUniqueConstraintError'){
      return res.status(400).json({ message:'동일 이름의 브랜드가 이미 존재합니다.'});
    }
    console.error('brand create error', err);
    res.status(500).json({ message: err.message });
  }
});

// 수정
router.put('/:id', auth, canManage, async (req,res)=>{
  try{
    const brand = await Brand.findOne({ where:{ id:req.params.id }, tenant_id:req.user.tenant_id });
    if(!brand) return res.status(404).json({ message:'Brand not found' });
    const { name, code } = req.body;
    await brand.update({ name, code });
    res.json(brand);
  }catch(err){
    console.error('brand update error', err);
    res.status(500).json({ message: err.message });
  }
});

// 삭제
router.delete('/:id', auth, canManage, async (req,res)=>{
  try{
    const brand = await Brand.findOne({ where:{ id:req.params.id }, tenant_id:req.user.tenant_id });
    if(!brand) return res.status(404).json({ message:'Brand not found' });
    await brand.destroy();
    res.json({ success:true });
  }catch(err){
    console.error('brand delete error', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router; 