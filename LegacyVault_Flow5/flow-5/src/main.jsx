import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {
  ShieldCheck, Wallet, UsersRound, Grid2X2, Handshake, FileText, Plus, Check,
  X, ChevronDown, ChevronRight, Search, Clock3, CircleCheck, CircleAlert,
  AlertTriangle, Settings2, LogOut, ArrowLeft, UploadCloud, FileUp, KeyRound,
  RefreshCw, FileCheck2, Shield, LockKeyhole, Info, History, Menu, SlidersHorizontal,
} from 'lucide-react';
import {
  DEMO_MODE, listCases, getCaseDetail, approveCase, rejectCase, uploadDocument,
  resetDemoCases,
} from './api';
import {STATUS_LABELS, canReview, validRejectReason, validateUpload, formatBytes} from './rules.mjs';
import './style.css';

const sectionTitles={queue:'Legal Verification Queue',history:'Verified History',settings:'Verification Settings',executor:'Submit Legal Documents'};
const sectionDescriptions={
  queue:'Review submitted documents and authorize vault unlock for approved cases.',
  history:'Review previously processed verification cases and decisions.',
  settings:'Review legal verification policies and integration requirements.',
  executor:'Upload the death certificate for an existing handover case.',
};

function StatusBadge({status}){
  const key=(status||'PENDING').toUpperCase();
  return <span className={`status status-${key.toLowerCase()}`}>
    <span className="status-dot" aria-hidden="true"/>{STATUS_LABELS[key]||key}
  </span>;
}

function IconLogo(){
  return <span className="brand-mark"><Wallet size={17} strokeWidth={2.5}/></span>;
}

function Sidebar({section,onSectionChange,mobileOpen,setMobileOpen}){
  const items=[
    {id:'queue',label:'Verification Queue',Icon:UsersRound},
    {id:'history',label:'Verified History',Icon:Grid2X2},
    {id:'settings',label:'Settings',Icon:Handshake},
  ];
  const change=(id)=>{onSectionChange(id);setMobileOpen(false);};
  return <>
    {mobileOpen && <button className="sidebar-backdrop" type="button" aria-label="Close navigation" onClick={()=>setMobileOpen(false)}/>}
    <aside className={`sidebar ${mobileOpen?'sidebar-mobile-open':''}`}>
      <div className="brand"><IconLogo/><span>LegacyVault</span></div>
      <nav className="primary-nav" aria-label="Flow 5 navigation">
        {items.map(({id,label,Icon})=><button type="button" key={id} className={`nav-link ${section===id?'active':''}`} onClick={()=>change(id)} aria-current={section===id?'page':undefined}>
          <Icon size={17} strokeWidth={1.65}/><span>{label}</span>
        </button>)}
      </nav>
      <div className="sidebar-profile">
        <span className="avatar">TP</span>
        <span className="profile-copy"><strong>Thanh Pham</strong><small>Legal verifier</small></span>
      </div>
      <div className="sidebar-bottom">
        <span className="sidebar-bottom-label">FLOW 5 SUPPORT</span>
        <button type="button" className={`nav-link ${section==='executor'?'active':''}`} onClick={()=>change('executor')} aria-current={section==='executor'?'page':undefined}>
          <FileUp size={16} strokeWidth={1.7}/><span>Executor submission</span>
        </button>
        <span className="sidebar-mode">{DEMO_MODE?'Local demonstration':'API connected mode'}</span>
      </div>
    </aside>
  </>;
}

function CaseCard({record,active,onClick}){
  return <button type="button" className={`case-card ${active?'case-card-active':''}`} onClick={onClick} aria-pressed={active}>
    <span className="case-cell case-title-col"><strong>Case #{record.case_number}</strong><small>Vault owner · {record.vault_owner_name}</small></span>
    <span className="case-cell case-executor-col"><span className="case-cell-label">EXECUTOR</span><strong>{record.executor_name}</strong></span>
    <span className="case-cell case-date-col"><span className="case-cell-label">SUBMITTED</span><span>{record.submitted_date_formatted||record.submitted_date||'—'}</span></span>
    <span className="case-badge-col"><StatusBadge status={record.status}/></span>
    <span className="case-card-chevron"><ChevronDown size={17}/></span>
  </button>;
}

function DocumentCard({document,onView}){
  return <button type="button" className="document-card" onClick={()=>onView(document)} title={`View ${document.file_name}`}>
    <span className="document-icon"><FileText size={19} strokeWidth={1.8}/></span>
    <span className="document-copy"><strong>{document.file_name}</strong><small>Uploaded by {document.uploaded_by||'Executor'} · {document.file_size_formatted||'—'}</small></span>
    <ChevronRight size={16} className="document-chevron"/>
  </button>;
}

function Modal({title,children,onClose,wide=false}){
  useEffect(()=>{
    const closeOnEscape=(event)=>{if(event.key==='Escape')onClose();};
    document.addEventListener('keydown',closeOnEscape);
    return ()=>document.removeEventListener('keydown',closeOnEscape);
  },[onClose]);
  return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}>
    <section className={`modal ${wide?'modal-wide':''}`} role="dialog" aria-modal="true" aria-label={title}>
      <header className="modal-heading"><h2>{title}</h2><button type="button" className="icon-button" onClick={onClose} aria-label="Close dialog"><X size={20}/></button></header>
      {children}
    </section>
  </div>;
}

function CaseDetail({record,onApprove,onReject,onView,working}){
  const docs=record.documents||[];
  const isApproved=record.status==='APPROVED';
  const isRejected=record.status==='REJECTED';
  return <section className="case-detail-section" aria-label={`${record.case_number} details`}>
    <h2>Case #{record.case_number} - Detail</h2>
    <div className="detail-panel">
      <div className="document-well">
        {docs.length?docs.map((doc,i)=><DocumentCard key={doc.document_id||i} document={doc} onView={onView}/>):<div className="document-placeholder"><FileText size={19}/>No document uploaded</div>}
      </div>
      <div className="detail-info">
        {isApproved?<div className="decision-message approved-message">
          <div className="decision-title"><span className="decision-icon"><Check size={17} strokeWidth={2.7}/></span><strong>{record.approved_title||'Case approved'}</strong></div>
          <p>{record.approved_message||`Document verified successfully. Case #${record.case_number} was approved and vault unlock has been authorized.`}</p>
          {DEMO_MODE&&<span className="demo-footnote">Demo state only · no actual vault unlock token issued</span>}
        </div>:isRejected?<div className="decision-message rejected-message">
          <div className="decision-title"><span className="decision-icon"><X size={17} strokeWidth={2.7}/></span><strong>Case rejected</strong></div>
          <p>{record.rejection_reason||'This case was rejected. The Executor should review the reason and provide corrected documents.'}</p>
          <span className="decision-secondary">The Executor must supply the required updates before a new review.</span>
        </div>:<>
          <p className="guideline">{record.review_guideline||"Confirm the document is authentic and matches the vault owner's legal record before approving this case."}</p>
          <div className="decision-actions">
            <button type="button" disabled={working||!canReview(record.status)||!docs.length} className="btn btn-primary" onClick={onApprove}>Approve &amp; Sign</button>
            <button type="button" disabled={working||!canReview(record.status)} className="btn btn-outline-danger" onClick={onReject}>Reject</button>
          </div>
        </>}
      </div>
    </div>
  </section>;
}

function ApproveDialog({record,close,confirm,working,error}){
  const [note,setNote]=useState('');
  const [pin,setPin]=useState('');
  const [checked,setChecked]=useState(false);
  return <Modal title="Approve & Sign" onClose={close}>
    <div className="modal-body">
      <div className="dialog-lead"><ShieldCheck size={22}/><span>Approve <strong>Case #{record.case_number}</strong> after reviewing the submitted documents.</span></div>
      <label className="field-label" htmlFor="signature-note">Verification note <span className="field-optional">(optional)</span></label>
      <textarea id="signature-note" rows="3" value={note} onChange={e=>setNote(e.target.value)} placeholder="Example: Documents reviewed against supporting legal records." maxLength={1000}/>
      <label className="field-label" htmlFor="verifier-pin">Verifier PIN <span className="field-optional">(optional, if backend requires it)</span></label>
      <input id="verifier-pin" type="password" autoComplete="off" value={pin} onChange={e=>setPin(e.target.value)} placeholder="Enter verifier PIN"/>
      <label className="confirm-check"><input type="checkbox" checked={checked} onChange={e=>setChecked(e.target.checked)}/><span>I have reviewed the documents and understand this action requires legal authorization.</span></label>
      {DEMO_MODE&&<p className="inline-note"><Info size={14}/>Demo mode: no real digital signature or unlock authorization is produced.</p>}
      {error&&<p className="form-error" role="alert">{error}</p>}
    </div>
    <footer className="modal-actions"><button className="btn btn-secondary" type="button" onClick={close} disabled={working}>Cancel</button><button type="button" className="btn btn-primary" disabled={!checked||working} onClick={()=>confirm({signature_note:note.trim(),verifier_pin:pin})}>{working?'Processing…':'Approve & Sign'}</button></footer>
  </Modal>;
}

function RejectDialog({record,close,confirm,working,error}){
  const [reason,setReason]=useState('');
  const [touched,setTouched]=useState(false);
  return <Modal title={`Reject Case #${record.case_number}`} onClose={close}>
    <div className="modal-body">
      <p className="modal-instruction">Provide a reason so the Executor knows what must be corrected before resubmitting documents.</p>
      <label className="field-label" htmlFor="rejection-reason">Reason for rejection <span className="field-required">*</span></label>
      <textarea id="rejection-reason" rows="4" value={reason} onBlur={()=>setTouched(true)} onChange={e=>setReason(e.target.value)} placeholder="Describe missing, unreadable, or mismatched information..." maxLength={1000}/>
      {touched&&!validRejectReason(reason)&&<p className="form-error">Please enter a reason of at least 5 characters.</p>}
      {error&&<p className="form-error" role="alert">{error}</p>}
    </div>
    <footer className="modal-actions"><button className="btn btn-secondary" type="button" onClick={close} disabled={working}>Cancel</button><button className="btn btn-danger" type="button" disabled={working||!validRejectReason(reason)} onClick={()=>confirm(reason.trim())}>{working?'Processing…':'Reject Case'}</button></footer>
  </Modal>;
}

function ExecutorSubmission({onUploaded}){
  const [caseId,setCaseId]=useState(DEMO_MODE?'LV-1042':'');
  const [file,setFile]=useState(null);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [success,setSuccess]=useState(null);
  async function submit(event){
    event.preventDefault();setError('');setSuccess(null);
    if(!caseId.trim()){setError('Enter your handover case number or ID.');return;}
    const validation=validateUpload(file);
    if(validation){setError(validation);return;}
    const form=event.currentTarget;
    setBusy(true);
    try{
      const response=await uploadDocument(caseId.trim(),file);
      setSuccess(response);setFile(null);
      form.reset();
      onUploaded();
    }catch(e){setError(e.message||'Upload failed.');}
    finally{setBusy(false);}
  }
  return <div className="executor-grid">
    <section className="feature-panel">
      <div className="feature-heading"><span className="feature-symbol"><FileUp size={21}/></span><div><h2>Submit Legal Documents</h2><p>Digital Executor · Document upload</p></div></div>
      <p className="support-copy">Submit a death certificate for an existing Handover Case. Documents are reviewed by the Legal Verifier before any authorization is considered.</p>
      <form className="upload-form" onSubmit={submit} noValidate>
        <label className="field-label" htmlFor="submission-case">Handover Case ID</label>
        <input id="submission-case" value={caseId} onChange={e=>setCaseId(e.target.value)} placeholder="e.g. LV-1042" required />
        <label className="field-label" htmlFor="upload-file">Death certificate</label>
        <label className="drop-file" htmlFor="upload-file"><UploadCloud size={28} strokeWidth={1.5}/><strong>{file?.name||'Choose a PDF, PNG or JPG file'}</strong><small>{file?formatBytes(file.size):'Maximum file size: 15 MB'}</small></label>
        <input id="upload-file" className="visually-hidden" type="file" accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg" onChange={e=>{setFile(e.target.files?.[0]||null);setError('');}}/>
        {error&&<p className="form-error" role="alert">{error}</p>}
        {success&&<div className="inline-success" role="status"><CircleCheck size={17}/><div><strong>Document uploaded</strong><p>{success.file_name} · Upload alone does not submit the case for review.</p></div></div>}
        <button className="btn btn-primary upload-submit" type="submit" disabled={busy}>{busy?'Uploading…':'Upload Document'}</button>
      </form>
    </section>
    <aside className="support-panel"><span className="support-icon"><Info size={21}/></span><h3>Submission workflow</h3><p>According to the supplied YAML, the Executor can upload a file using:</p><code>POST /legal-verification/cases/{'{caseId}'}/documents</code><p>The API file does not define a separate “Submit for review” endpoint. Please coordinate that missing action with the Backend team; this page does not pretend the case was submitted.</p><p>In demo mode only document metadata is saved locally, not the actual sensitive file.</p></aside>
  </div>;
}

function SettingsPage({onReset}){
  return <div className="settings-layout"><div className="feature-panel settings-card"><div className="feature-heading"><span className="feature-symbol"><Settings2 size={22}/></span><div><h2>Review configuration</h2><p>Backend-managed settings</p></div></div><div className="setting-item"><div><strong>Reviewer authorization</strong><p>Bearer authentication and Legal Verifier permissions</p></div><span className="read-only">Backend required</span></div><div className="setting-item"><div><strong>Document protection</strong><p>Protected file URLs and reviewer access policy</p></div><span className="read-only">Backend required</span></div><div className="setting-item"><div><strong>Digital signing</strong><p>Signing and vault unlock authorization must be performed by a trusted backend</p></div><span className="read-only">Backend required</span></div><p className="inline-note"><Info size={15}/>The supplied YAML does not define Settings endpoints. These items are read-only.</p></div>
    {DEMO_MODE&&<div className="feature-panel reset-panel"><h2>Demo data</h2><p>Restore the original Figma example cases (LV-1042 Under Review, LV-1038 Approved).</p><button className="btn btn-secondary" type="button" onClick={onReset}><RefreshCw size={15}/> Reset demo cases</button></div>}</div>;
}

function App(){
  const [section,setSection]=useState('queue');
  const [mobileOpen,setMobileOpen]=useState(false);
  const [cases,setCases]=useState([]);
  const [selectedId,setSelectedId]=useState(null);
  const [detail,setDetail]=useState(null);
  const [loading,setLoading]=useState(true);
  const [detailLoading,setDetailLoading]=useState(false);
  const [pageError,setPageError]=useState('');
  const [detailError,setDetailError]=useState('');
  const [search,setSearch]=useState('');
  const [statusFilter,setStatusFilter]=useState('ALL');
  const [historyStatus,setHistoryStatus]=useState('APPROVED');
  const [page,setPage]=useState(0);
  const [pageInfo,setPageInfo]=useState({total_elements:0,total_pages:0});
  const [refreshCount,setRefreshCount]=useState(0);
  const [modal,setModal]=useState(null);
  const [modalError,setModalError]=useState('');
  const [working,setWorking]=useState(false);
  const refresh=useCallback(()=>setRefreshCount(c=>c+1),[]);
  const status=section==='history'?historyStatus:statusFilter;

  useEffect(()=>{setPage(0);setSearch('');setStatusFilter('ALL');},[section]);
  useEffect(()=>{
    if(section!=='queue' && section!=='history')return;
    let ignore=false;
    setLoading(true);setPageError('');
    listCases({status,search,page,size:10}).then(response=>{
      if(ignore)return;
      const data=response?.content||[];
      setCases(data);
      setPageInfo({total_elements:response.total_elements||0,total_pages:response.total_pages||0});
      setSelectedId(old=>data.some(row=>row.case_id===old)?old:data[0]?.case_id||null);
    }).catch(error=>{if(!ignore){setPageError(error.message);setCases([]);setSelectedId(null);}}).finally(()=>{if(!ignore)setLoading(false);});
    return ()=>{ignore=true;};
  },[section,status,search,page,refreshCount]);

  useEffect(()=>{
    if(!selectedId || (section!=='queue' && section!=='history')){setDetail(null);return;}
    let ignore=false;
    setDetail(null);setDetailError('');setDetailLoading(true);
    getCaseDetail(selectedId).then(data=>{if(!ignore)setDetail(data);}).catch(err=>{if(!ignore)setDetailError(err.message);}).finally(()=>{if(!ignore)setDetailLoading(false);});
    return ()=>{ignore=true;};
  },[selectedId,section,refreshCount]);

  function goToSection(id){setSection(id);setModal(null);setPageError('');setDetailError('');}
  function newReview(){
    const target=cases.find(record=>canReview(record.status));
    if(target){setSelectedId(target.case_id);document.querySelector('.case-detail-section')?.scrollIntoView({behavior:'smooth',block:'nearest'});}
    else setPageError('No cases requiring review in the current list.');
  }
  async function confirmApprove(payload){
    if(!detail)return;setWorking(true);setModalError('');
    try{await approveCase(detail.case_id,payload);setModal(null);refresh();}
    catch(err){setModalError(err.message||'Approval failed.');}
    finally{setWorking(false);}
  }
  async function confirmReject(reason){
    if(!detail)return;setWorking(true);setModalError('');
    try{await rejectCase(detail.case_id,reason);setModal(null);refresh();}
    catch(err){setModalError(err.message||'Rejection failed.');}
    finally{setWorking(false);}
  }
  function onViewDocument(document){setModal({type:'file',doc:document});}
  function resetDemo(){resetDemoCases();setSelectedId(null);setSection('queue');refresh();}

  const showList=section==='queue'||section==='history';
  return <div className="app-shell">
    <Sidebar section={section} onSectionChange={goToSection} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen}/>
    <main className="main-view">
      <header className="page-header">
        <button className="mobile-menu icon-button" type="button" aria-label="Open navigation" onClick={()=>setMobileOpen(true)}><Menu size={23}/></button>
        <div className="heading-copy"><h1>{sectionTitles[section]}</h1><p>{sectionDescriptions[section]}</p></div>
        {section==='queue'&&<button type="button" className="btn btn-primary new-review" onClick={newReview}><Plus size={15}/><span>New review</span></button>}
      </header>
      <div className="content-container">
        {showList&&<>
          <div className="queue-toolbar">
            <label className="search-field"><Search size={17}/><input value={search} onChange={e=>{setSearch(e.target.value);setPage(0);}} placeholder="Search cases, owners, executors" aria-label="Search cases"/></label>
            {section==='queue'?<label className="filter-field"><SlidersHorizontal size={16}/><select aria-label="Filter by status" value={statusFilter} onChange={e=>{setStatusFilter(e.target.value);setPage(0);}}><option value="ALL">All statuses</option><option value="SUBMITTED">Submitted</option><option value="UNDER_REVIEW">Under Review</option><option value="APPROVED">Approved</option><option value="REJECTED">Rejected</option></select><ChevronDown size={15}/></label>:<div className="history-tabs"><button type="button" className={historyStatus==='APPROVED'?'selected':''} onClick={()=>{setHistoryStatus('APPROVED');setPage(0);}}>Approved</button><button type="button" className={historyStatus==='REJECTED'?'selected':''} onClick={()=>{setHistoryStatus('REJECTED');setPage(0);}}>Rejected</button></div>}
          </div>
          {pageError&&<div className="error-banner" role="alert"><CircleAlert size={17}/><span>{pageError}</span><button type="button" onClick={refresh}>Retry</button></div>}
          <section className="queue-list" aria-label="Verification cases">
            {loading?<div className="empty-list"><RefreshCw className="spin" size={22}/>Loading verification cases…</div>:
              cases.length?cases.map(record=><CaseCard key={record.case_id} record={record} active={selectedId===record.case_id} onClick={()=>setSelectedId(record.case_id)}/>):<div className="empty-list"><FileCheck2 size={24}/><strong>No cases found</strong><small>Try another search or status filter.</small></div>}
          </section>
          {pageInfo.total_pages>1&&<div className="pagination"><button type="button" className="btn btn-secondary" disabled={page===0||loading} onClick={()=>setPage(p=>p-1)}>Previous</button><span>Page {page+1} of {pageInfo.total_pages}</span><button type="button" className="btn btn-secondary" disabled={page+1>=pageInfo.total_pages||loading} onClick={()=>setPage(p=>p+1)}>Next</button></div>}
          {detailLoading?<div className="detail-pending">Loading case details…</div>:detailError?<div className="error-banner" role="alert"><CircleAlert size={17}/>{detailError}</div>:detail&&<CaseDetail record={detail} onApprove={()=>{setModalError('');setModal({type:'approve'});}} onReject={()=>{setModalError('');setModal({type:'reject'});}} onView={onViewDocument} working={working}/>}
        </>}
        {section==='executor'&&<ExecutorSubmission onUploaded={refresh}/>}
        {section==='settings'&&<SettingsPage onReset={resetDemo}/>}
      </div>
      {DEMO_MODE&&<span className="demo-badge"><span/>Demo data · No real legal authorization</span>}
    </main>
    {modal?.type==='approve'&&detail&&<ApproveDialog key={detail.case_id} record={detail} close={()=>setModal(null)} confirm={confirmApprove} working={working} error={modalError}/>}
    {modal?.type==='reject'&&detail&&<RejectDialog key={detail.case_id} record={detail} close={()=>setModal(null)} confirm={confirmReject} working={working} error={modalError}/>}
    {modal?.type==='file'&&<Modal title="Document preview" onClose={()=>setModal(null)}>
      <div className="modal-body"><div className="file-preview-icon"><FileText size={31}/></div><h3 className="file-preview-title">{modal.doc.file_name}</h3><p className="preview-description">{modal.doc.uploaded_by||'Executor'} · {modal.doc.file_size_formatted||'—'}</p>
        {modal.doc.file_url&&!DEMO_MODE?<><p className="inline-note"><LockKeyhole size={15}/>Documents use protected file URLs. Confirm the destination is trusted.</p><a className="btn btn-primary modal-file-link" href={modal.doc.file_url} target="_blank" rel="noopener noreferrer">Open secure document</a></>:<p className="inline-note"><Info size={15}/>No file preview in demo mode. Only document metadata is available.</p>}
      </div>
      <footer className="modal-actions"><button type="button" className="btn btn-secondary" onClick={()=>setModal(null)}>Close</button></footer>
    </Modal>}
  </div>;
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>);
