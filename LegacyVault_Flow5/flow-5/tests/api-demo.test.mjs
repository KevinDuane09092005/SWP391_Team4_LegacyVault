import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const src=new URL('../src/api.js',import.meta.url);
let source=await readFile(src,'utf8');
source=source
  .replace("from './fixtures'",`from '${new URL('../src/fixtures.js',import.meta.url).href}'`)
  .replace("from './rules.mjs'",`from '${new URL('../src/rules.mjs',import.meta.url).href}'`)
  .replaceAll('import.meta.env','({VITE_DEMO_MODE:"true",VITE_API_BASE_URL:""})');
const api=await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const cache=new Map();
globalThis.localStorage={getItem:k=>cache.get(k)??null,setItem:(k,v)=>cache.set(k,v),removeItem:k=>cache.delete(k)};

// Single test means mock storage state changes are deterministic.
test('demo API supports Figma queue, approve, reject, and upload without issuing real unlock tokens', async()=>{
  api.resetDemoCases();
  let queue=await api.listCases({status:'ALL',page:0,size:10});
  assert.equal(queue.total_elements,2);
  assert.equal(queue.content[0].case_number,'LV-1042');
  assert.equal(queue.content[0].status,'UNDER_REVIEW');
  const current=queue.content[0];
  let detail=await api.getCaseDetail(current.case_id);
  assert.equal(detail.documents[0].file_name,'Death_Certificate_ThanhPham.pdf');
  assert.equal(detail.documents[0].file_url,null);
  await assert.rejects(()=>api.rejectCase('not-a-case','reason'));
  const approved=await api.approveCase(current.case_id,{signature_note:'Checked'});
  assert.equal(approved.status,'APPROVED');
  assert.equal(approved.vault_unlock_authorized,true); // Explicitly demo only, not an actual token.
  detail=await api.getCaseDetail(current.case_id);
  assert.equal(detail.status,'APPROVED');
  await assert.rejects(()=>api.rejectCase(current.case_id,'Reason to reject'));
  api.resetDemoCases();
  const rejected=await api.rejectCase(current.case_id,'Document cannot be verified.');
  assert.equal(rejected.status,'REJECTED');
  assert.equal((await api.getCaseDetail(current.case_id)).rejection_reason,'Document cannot be verified.');
  api.resetDemoCases();
  const upload=await api.uploadDocument(current.case_id,{name:'death-certificate.pdf',size:1024*1024});
  assert.equal(upload.file_url,null);
  detail=await api.getCaseDetail(current.case_id);
  assert.equal(detail.documents.length,2);
  assert.equal(detail.status,'UNDER_REVIEW'); // Upload does not imply submission.
  const filter=await api.listCases({status:'APPROVED',search:'Maya'});
  assert.equal(filter.total_elements,1);
  api.resetDemoCases();
});
