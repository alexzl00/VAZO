/** Run: node --test tests/bonus-treatment-defaults.test.cjs
 * Pure resolver tests (no React, Supabase or browser runtime needed).
 */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript');
const fs=require('node:fs');
const Module=require('node:module');
require.extensions['.ts'] = (mod,file) => {
  const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{
    compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}
  }).outputText;
  mod._compile(code,file);
};
const {resolveBonusTreatments, BONUS_DEFAULT_CONFIG}=require('../src/utils/bonusTreatmentDefaults.ts');
const monthly={frequency:'monthly',paymentType:'cash'};
test('config stays in one place',()=>{
 assert.equal(BONUS_DEFAULT_CONFIG.sickLeaveTreatment,'notPaid');
 assert.equal(BONUS_DEFAULT_CONFIG.vacationTreatment,'variableBase');
});
test('NULL/undefined means automatic, without mutating stored bonus',()=>{
 const bonus={...monthly,sickLeaveTreatment:null,vacationTreatment:undefined};
 const result=resolveBonusTreatments(bonus);
 assert.deepEqual(result,{
  sickLeaveTreatment:{value:'notPaid',source:'default'},
  vacationTreatment:{value:'variableBase',source:'default'}
 });
 assert.equal(bonus.sickLeaveTreatment,null);
 assert.equal(bonus.vacationTreatment,undefined);
});
test('explicit decisions always override defaults',()=>{
 assert.deepEqual(resolveBonusTreatments({...monthly,sickLeaveTreatment:'paidInFull',vacationTreatment:'excluded'}),{
  sickLeaveTreatment:{value:'paidInFull',source:'explicit'},
  vacationTreatment:{value:'excluded',source:'explicit'},
 });
});
test('fallback vacation policy depends on frequency and payment type',()=>{
 for(const frequency of ['quarterly','annual','oneOff']){
  assert.deepEqual(resolveBonusTreatments({frequency,paymentType:'cash'}).vacationTreatment,{value:'excluded',source:'default'});
 }
 assert.equal(resolveBonusTreatments({...monthly,paymentType:'nonCash'}).vacationTreatment.value,'excluded');
 assert.equal(resolveBonusTreatments({...monthly}).vacationTreatment.value,'variableBase');
});
test('explicit variableBase on a nonmonthly bonus remains explicit so calculator can validate it',()=>{
 const result=resolveBonusTreatments({frequency:'quarterly',paymentType:'cash',vacationTreatment:'variableBase'});
 assert.equal(result.vacationTreatment.value,'variableBase');
 assert.equal(result.vacationTreatment.source,'explicit');
});
