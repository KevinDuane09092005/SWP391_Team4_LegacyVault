import { initialCases } from './fixtures';
import { STATUS_LABELS, matchesQuery, canReview } from './rules.mjs';

const BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE !== 'false';
const STORAGE_KEY = 'legacyvault-flow5-demo-v1';
let tokenProvider = () => null;

// Integrate your app's authenticated session in one place; never embed JWTs in Vite env files.
export function configureTokenProvider(provider) {
  if (typeof provider !== 'function') throw new Error('Provide a function that returns the current access token.');
  tokenProvider = provider;
}

const clone = value => JSON.parse(JSON.stringify(value));
function getMockCases() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(stored)) return stored;
  } catch { /* Invalid demo data: reset to fixtures. */ }
  return clone(initialCases);
}
function saveMockCases(cases) {localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));}
export function resetDemoCases() { if (DEMO_MODE) localStorage.removeItem(STORAGE_KEY); }
const delay = () => new Promise(resolve=>setTimeout(resolve, 180));

async function request(method, path, body, isMultipart=false) {
  if (!BASE) throw new Error('Set VITE_API_BASE_URL before disabling demo mode.');
  const token = await tokenProvider();
  if (!token) throw new Error('No authentication token. Integrate configureTokenProvider() with your login flow.');
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers: {Authorization:`Bearer ${token}`, ...((!isMultipart && body!==undefined)? {'Content-Type':'application/json'}:{})},
    ...(body!==undefined?{body:isMultipart?body:JSON.stringify(body)}:{}),
  });
  if (!response.ok) {
    let details;
    try { details = await response.json(); } catch { /* non-JSON error */ }
    throw new Error(details?.message || `Request failed (${response.status}).`);
  }
  if (response.status === 204) return null;
  return response.json();
}

export async function listCases({status='ALL', search='',page=0,size=10}={}) {
  if (!DEMO_MODE) {
    const params=new URLSearchParams({status,search,page:String(page),size:String(size)});
    return request('GET',`/legal-verification/verifier/queue?${params}`);
  }
  await delay();
  const all=getMockCases().filter(r=>(status==='ALL'||r.status===status) && matchesQuery(r,search));
  const start=page*size;
  return {content:all.slice(start,start+size).map(r=>({
    case_id:r.case_id, case_number:r.case_number, vault_owner_name:r.vault_owner_name,
    executor_name:r.executor_name, submitted_date:r.submitted_date,
    submitted_date_formatted:r.submitted_date_formatted,status:r.status,
    status_label:STATUS_LABELS[r.status]||r.status,documents_count:r.documents?.length||0
  })),total_elements:all.length,total_pages:Math.ceil(all.length/size)};
}

export async function getCaseDetail(caseId){
  if(!DEMO_MODE) return request('GET',`/legal-verification/cases/${encodeURIComponent(caseId)}`);
  await delay();
  const r=getMockCases().find(r=>r.case_id===caseId||r.case_number===caseId);
  if (!r) throw new Error('Case not found.');
  return clone(r);
}

export async function approveCase(caseId,{signature_note='',verifier_pin=''}={}){
  if(!DEMO_MODE) return request('POST',`/legal-verification/cases/${encodeURIComponent(caseId)}/approve`,{
    ...(signature_note?{signature_note}:{}),...(verifier_pin?{verifier_pin}:{})
  });
  await delay();
  const data=getMockCases();const record=data.find(r=>r.case_id===caseId||r.case_number===caseId);
  if(!record) throw new Error('Case not found.');
  if(!canReview(record.status))throw new Error('This case cannot be approved in its current state.');
  record.status='APPROVED';record.status_label='Approved';
  record.approved_title='Case approved';
  record.approved_message=`Document verified successfully. Case #${record.case_number} was approved and vault unlock has been authorized.`;
  record.vault_unlock_authorized=true;record.verified_at=new Date().toISOString();
  saveMockCases(data);
  return {case_id:record.case_id,case_number:record.case_number,status:record.status,status_label:record.status_label,
    approved_title:record.approved_title,approved_message:record.approved_message,
    vault_unlock_authorized:true,verified_at:record.verified_at};
}

export async function rejectCase(caseId, reason){
  if(!DEMO_MODE)return request('POST',`/legal-verification/cases/${encodeURIComponent(caseId)}/reject`,{reason});
  await delay();
  const data=getMockCases();const record=data.find(r=>r.case_id===caseId||r.case_number===caseId);
  if(!record)throw new Error('Case not found.');
  if(!canReview(record.status))throw new Error('This case cannot be rejected in its current state.');
  record.status='REJECTED';record.status_label='Rejected';record.rejection_reason=reason;record.vault_unlock_authorized=false;
  saveMockCases(data);
  return {case_id:record.case_id,case_number:record.case_number,status:'REJECTED',rejection_reason:reason};
}

export async function uploadDocument(caseId,file){
  if(!DEMO_MODE){const data=new FormData();data.append('file',file);
    return request('POST',`/legal-verification/cases/${encodeURIComponent(caseId)}/documents`,data,true);
  }
  await delay();
  const data=getMockCases();const record=data.find(r=>r.case_id===caseId||r.case_number===caseId);
  if(!record)throw new Error('Case not found.');
  const newDoc={document_id:`demo-${Date.now()}`,document_type:'DEATH_CERTIFICATE',file_name:file.name,
    file_size_formatted:`${(file.size/1024/1024).toFixed(1)} MB`,uploaded_by:'Executor',file_url:null};
  record.documents=[...(record.documents||[]),newDoc];record.documents_count=record.documents.length;
  // Upload alone DOES NOT set SUBMITTED; YAML lacks a submit-review endpoint.
  saveMockCases(data);
  return newDoc;
}
