import test from 'node:test';
import assert from 'node:assert/strict';
import {VALID_STATUSES,canReview,validRejectReason,validateUpload,matchesQuery,formatBytes} from '../src/rules.mjs';

test('all five contract statuses are supported',()=>assert.deepEqual(VALID_STATUSES,['PENDING','SUBMITTED','UNDER_REVIEW','APPROVED','REJECTED']));
test('only submitted and under review cases allow review',()=>{
  assert.equal(canReview('UNDER_REVIEW'),true);
  assert.equal(canReview('SUBMITTED'),true);
  for(const v of ['APPROVED','REJECTED','PENDING']) assert.equal(canReview(v),false);
});
test('reject reason must be meaningful',()=>{
  assert.equal(validRejectReason(''),false);
  assert.equal(validRejectReason('  a  '),false);
  assert.equal(validRejectReason('Illegible document'),true);
});
test('only supported extension and content types accepted',()=>{
  for(const type of [{name:'death.pdf',type:'application/pdf'},{name:'photo.png',type:'image/png'},{name:'photo.jpg',type:'image/jpeg'}]){
    assert.equal(validateUpload({...type,size:15*1024*1024}),null);
  }
  assert.match(validateUpload({name:'secret.exe',type:'application/octet-stream',size:99}),/PDF/);
  assert.match(validateUpload({name:'fake.pdf',type:'application/octet-stream',size:99}),/PDF/);
  assert.match(validateUpload({name:'too-large.pdf',type:'application/pdf',size:15*1024*1024+1}),/15 MB/);
  assert.match(validateUpload({name:'empty.pdf',type:'application/pdf',size:0}),/empty/);
  assert.match(validateUpload(null),/choose/);
});
test('search by case, owner, executor',()=>{
  const item={case_number:'LV-1042',vault_owner_name:'Thanh Pham',executor_name:'Linh Pham'};
  for(const s of ['LV-1042','thanh','LINH',''])assert.equal(matchesQuery(item,s),true);
  assert.equal(matchesQuery(item,'Maya'),false);
});
test('file byte formatting is stable',()=>{
  assert.equal(formatBytes(120),'120 B');
  assert.equal(formatBytes(1024),'1.0 KB');
  assert.equal(formatBytes(1024*1024),'1.0 MB');
});
