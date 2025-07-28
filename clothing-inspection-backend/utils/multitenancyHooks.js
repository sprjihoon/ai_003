// utils/multitenancyHooks.js – 글로벌 테넌시 훅

/**
 * 모델에 beforeFind / beforeCreate 훅을 주입하여
 * options.tenant_id 값 기반으로 자동 필터/삽입을 수행한다.
 *
 * 사용법 (모델 정의 파일에서):
 *   const { addTenantHooks } = require('../utils/multitenancyHooks');
 *   addTenantHooks(Model);
 */
function addTenantHooks(model){
  if(!model || typeof model.addHook!=='function'){
    console.warn('[multitenancyHooks] invalid model passed');
    return;
  }

  // 중복 주입 방지: model has custom flag
  if(model.__tenantHooksApplied) return;
  model.__tenantHooksApplied = true;

  // ───── beforeFind ───────────────────────────
  model.addHook('beforeFind', (options={})=>{
    if(!options.where) options.where = {};
    // caller가 options.tenant_id 로 지정하면 where 에 강제 주입
    if(options.tenant_id){
      options.where.tenant_id = options.tenant_id;
      delete options.tenant_id;
    }
  });

  // ───── beforeCreate ─────────────────────────
  model.addHook('beforeCreate', (instance, options={})=>{
    if(options.tenant_id && !instance.tenant_id){
      instance.tenant_id = options.tenant_id;
    }
  });

  // (선택) beforeBulkCreate 도 동일 로직 적용
  model.addHook('beforeBulkCreate', (instances, options={})=>{
    if(options.tenant_id){
      for(const inst of instances){
        if(!inst.tenant_id) inst.tenant_id = options.tenant_id;
      }
    }
  });
}

module.exports = { addTenantHooks }; 