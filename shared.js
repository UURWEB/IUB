/* ═══════════════════════════════════════════════════════════
   UNION OF THE UNITED REPUBLICS (U.U.R.) FINANCIAL NETWORK — shared core
   Used by every brand site. Keeps the original Firestore
   schema (accounts / transactions / loans / bills / stocks /
   positions / trades / casino* / market / presence / adminLogs)
   and adds: VNB + Valorian Frank FX, manager role, staff.
   ═══════════════════════════════════════════════════════════ */

const FB_CONFIG = {
  apiKey:            "AIzaSyChstZGtH4hIExL_gPcUji7aoG5j0NKhmc",
  authDomain:        "uurweb.firebaseapp.com",
  projectId:         "uurweb",
  storageBucket:     "uurweb.firebasestorage.app",
  messagingSenderId: "239623573104",
  appId:             "1:239623573104:web:191687b4475eb5f59c6eb5"
};
const ADMINS      = ['minekid123','adamenek','purpleaki123'];
const HEAD_ADMIN_UID = 'PTP7igQ2U2TlY5phreKl61H8plu1';
const HEAD_ADMIN_USERNAME = 'Minekid123';
const FAKE_DOMAIN = '@uurweb.rp';
const SUPPORT_STORAGE_KEY = 'uur:head-admin-support-session';

firebase.initializeApp(FB_CONFIG);
const auth = firebase.auth();
const db   = firebase.firestore();
const FV   = firebase.firestore.FieldValue;

/* ── Global session state ── */
const G = {
  authUser:null, actorProfile:null, actorUsername:'', actorRole:'user',
  user:null, username:'', role:'user', managerBank:'',
  profile:null, supportMode:false, supportSessionId:null, supportTargetUid:null, supportTargetUsername:'',
  accountId:null, meraldAccountId:null, vnbAccountId:null,
  accounts:{},            // id → account doc (owned)
  fx:{ vfPerEmerul:2.40, spreadPct:0.5 },
  unsubs:[], presenceTimer:null,
  casinoSettings:null, marketSettings:null, businessMemberships:{},
  activeProfile:{type:'personal',businessId:null,name:'Personal'}, pendingTaskCount:0
};

/* ── Tiny helpers ── */
const $  = id => document.getElementById(id);
const esc = s => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clamp = (v,a,b)=>Math.min(b,Math.max(a,Number(v)||0));
const now8601 = ()=>new Date().toISOString();
function dateFromAny(v){ if(!v) return new Date(0); if(v.toDate) return v.toDate(); const d=new Date(v); return isNaN(d)?new Date(0):d; }
function fmtDateTime(v){ const d=dateFromAny(v); return d.getTime()?d.toLocaleString(undefined,{month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'}):'—'; }
function fmtDate(v){ const d=dateFromAny(v); return d.getTime()?d.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}):'—'; }
function cryptoRandom(){ const a=new Uint32Array(1); crypto.getRandomValues(a); return a[0]/4294967296; }
function normalish(){ let s=0; for(let i=0;i<6;i++) s+=cryptoRandom(); return (s-3)/3; }
function refCode(prefix){ return prefix+'-'+Math.random().toString(36).slice(2,8).toUpperCase(); }

function normalizeUsername(v){ return String(v||'').toLowerCase().replace(/\s+/g,''); }
function authenticatedUid(){ return G.authUser?.uid || G.user?.uid || null; }
function authenticatedUsername(){ return G.actorUsername || G.username || ''; }
function effectiveUid(){ return G.user?.uid || authenticatedUid(); }
function isHeadAdminIdentity(user=G.authUser){
  return !!user && user.uid===HEAD_ADMIN_UID;
}
function readSupportPreference(){ try{return JSON.parse(localStorage.getItem(SUPPORT_STORAGE_KEY)||'null')}catch{return null} }
function saveSupportPreference(v){ try{ if(v)localStorage.setItem(SUPPORT_STORAGE_KEY,JSON.stringify(v));else localStorage.removeItem(SUPPORT_STORAGE_KEY); }catch{} }

/* ── Money formatting (U.U.R. Emerul + Valorian Frank) ── */
const EMERUL_CODE = 'EM';
const EMERUL_NAME = 'U.U.R. Emerul';
function fmt(n){ return 'EM '+Number(n||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}); }
function fmtVF(n){ return '₣'+Number(n||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}); }
function fmtCur(n,cur){ return cur==='VF' ? fmtVF(n) : fmt(n); }
function accountCurrency(a){
  const raw=String(a?.currency||'').toUpperCase();
  return (raw==='VF' || a?.bank==='VNB') ? 'VF' : EMERUL_CODE; // all legacy non-VF accounts are treated as Emerul
}
function fxRate(fx=G.fx){ return Number(fx?.vfPerEmerul ?? fx?.vfPerUsd ?? 2.40) || 2.40; }
function emerulEquivalent(a){ const b=Number(a?.balance||0); return accountCurrency(a)==='VF' ? b/fxRate() : b; }

function bankName(a){ return String(a?.bank||'IUB').toUpperCase(); }
function accountStatus(a){ return String(a?.status||'active').toLowerCase(); }

/* ── Brands registry ── */
const BRANDS = {
  IUB:    { name:'International Union Banking', short:'IUB',    logo:'assets/iub.png',    page:'iub.html',    tag:'The Central Bank of the Union',   color:'#1a6b45' },
  MERALD: { name:'Merald Banking',              short:'MERALD', logo:'assets/merald.png', page:'merald.html', tag:'Banking that moves at your speed',  color:'#0c8a54' },
  VNB:    { name:'Valorianische Nationalbank',  short:'VNB',    logo:'assets/vnb.png',    page:'vnb.html',    tag:'Die Nationalbank Valorias · Banking Act of 1926', color:'#7a1420' },
  CSE:    { name:'Central Stock Exchange',      short:'CSE',    logo:'assets/cse.png',    page:'cse.html',    tag:'Where the Union trades',            color:'#1246a0' },
  OC:     { name:'OC Online Casino',            short:'OC',     logo:'assets/oc-casino.png', page:'casino.html', tag:'The Union\u2019s premier gaming floor', color:'#c9a24b' }
};

/* ── NPC staff directory ── */
const STAFF = {
  IUB: [
    {n:'Margaret Holloway', t:'Senior Relationship Manager', b:'22 years in Union banking. Specialist in commercial lending and estate accounts.'},
    {n:'Daniel Okafor',     t:'Branch Director, Central City', b:'Oversees retail operations and the IUB certificate desk.'},
    {n:'Priya Ramanathan',  t:'Credit & Loans Officer', b:'Handles loan underwriting and repayment planning.'},
    {n:'Thomas Beck',       t:'Treasury Analyst', b:'Manages interbank settlement and reserve reporting.'}
  ],
  MERALD: [
    {n:'Jules Fontaine',    t:'Member Success Lead', b:'Your first stop for vaults, cards and Transfer Guard.'},
    {n:'Aria Chen',         t:'Product Specialist', b:'Runs the MERALD savings goals and insights program.'},
    {n:'Marco Silva',       t:'Fraud & Security', b:'Watches transfer patterns so you don\u2019t have to.'}
  ],
  VNB: [
    {n:'Dr. Elisabeth von Adler', t:'Direktorin · Geldpolitik', b:'Chairs the Frank Rate Committee and sets policy guidance.'},
    {n:'Konrad Weiss',      t:'Leiter Devisenhandel', b:'Runs the VNB foreign exchange desk and daily fixing.'},
    {n:'Sofia Lindqvist',   t:'Kundenbetreuerin International', b:'Assists foreign depositors with Frank accounts.'}
  ],
  CSE: [
    {n:'Raymond Cole',      t:'Head of Market Operations', b:'Keeps the tape running and the book balanced.'},
    {n:'Ingrid Vasquez',    t:'Listings & Compliance', b:'Reviews issuers and enforces trading rules.'},
    {n:'Felix Grant',       t:'Client Brokerage Desk', b:'Execution support for retail traders.'}
  ],
  OC: [
    {n:'Vince "Lucky" Delaney', t:'Casino Host', b:'VIP comps, table minimums, and a story for every chip.'},
    {n:'Nadia Sorel',       t:'Games Integrity Manager', b:'Certifies every wheel, deck and reel on the floor.'},
    {n:'Omar Haddad',       t:'Cage Manager', b:'Handles buy-ins and payouts to your bank of choice.'}
  ]
};
function yourManager(brand){
  const list = STAFF[brand]||[]; if(!list.length) return null;
  let h=0; const u=(G.user?.uid||'x'); for(let i=0;i<u.length;i++) h=(h*31+u.charCodeAt(i))>>>0;
  return list[h%list.length];
}
function staffCards(brand){
  return (STAFF[brand]||[]).map(s=>{
    const initials = s.n.split(' ').map(w=>w[0]).filter(c=>/[A-Z]/.test(c)).slice(0,2).join('');
    return `<div class="staff-card"><div class="staff-avatar">${initials}</div><div><div class="staff-name">${esc(s.n)}</div><div class="staff-title">${esc(s.t)}</div><div class="staff-bio">${esc(s.b)}</div></div></div>`;
  }).join('');
}

/* ── Toast + modal (auto-injected) ── */
function ensureChrome(){
  if(!$('uur-toasts')){ const t=document.createElement('div'); t.id='uur-toasts'; document.body.appendChild(t); }
  if(!$('uur-modal')){
    const m=document.createElement('div'); m.id='uur-modal'; m.innerHTML='<div class="uur-modal-card"><div class="uur-modal-head"><div id="uur-modal-title"></div><button onclick="closeModal()" class="uur-modal-x">✕</button></div><div id="uur-modal-sub"></div><div id="uur-modal-body"></div><div id="uur-modal-foot"></div></div>';
    m.addEventListener('click',e=>{ if(e.target===m) closeModal(); });
    document.body.appendChild(m);
  }
}
function toast(msg, ok=true){
  ensureChrome();
  const el=document.createElement('div'); el.className='uur-toast '+(ok?'ok':'bad'); el.textContent=msg;
  $('uur-toasts').appendChild(el);
  requestAnimationFrame(()=>el.classList.add('show'));
  setTimeout(()=>{ el.classList.remove('show'); setTimeout(()=>el.remove(),300); }, 4200);
}
function showModal(title, sub, bodyHTML, footHTML){
  ensureChrome();
  $('uur-modal-title').textContent=title; $('uur-modal-sub').textContent=sub||'';
  $('uur-modal-body').innerHTML=bodyHTML||''; $('uur-modal-foot').innerHTML=footHTML||'';
  $('uur-modal').classList.add('open');
}
function closeModal(){ const m=$('uur-modal'); if(m) m.classList.remove('open'); }

/* ── Roles ── */
function isHeadAdmin(){ return G.actorRole==='head_admin' || (!G.supportMode && G.role==='head_admin'); }
function isAdmin(){ return G.role==='admin' || G.role==='head_admin'; }
function isManager(){ return G.role==='manager'; }
function isStaffUser(){ return isAdmin()||isManager(); }
function canManageBank(bank){
  if(isAdmin()) return true;
  if(!isManager()) return false;
  const mb = String(G.managerBank||'').toUpperCase();
  return mb==='ALL' || mb===String(bank).toUpperCase();
}

function businessMembershipFor(businessId){ return G.businessMemberships?.[String(businessId||'')]||null; }
function canUseBusinessAccount(account, permission='view'){
  if(!account||account.ownerType!=='business'||!account.businessId) return false;
  const m=businessMembershipFor(account.businessId); if(!m) return false;
  if(['owner','admin'].includes(String(m.role||'').toLowerCase())) return true;
  const perms=Array.isArray(m.permissions)?m.permissions:[];
  return perms.includes(permission)||perms.includes('all');
}

function activeProfileStorageKey(){ return 'uur:active-operating-profile'; }
function savedOperatingProfile(){
  try{ const v=JSON.parse(localStorage.getItem(activeProfileStorageKey())||'null'); return v&&typeof v==='object'?v:null; }catch{return null;}
}
function saveOperatingProfile(profile){ try{ localStorage.setItem(activeProfileStorageKey(),JSON.stringify(profile||{type:'personal'})); }catch{} }
function activeBusinessId(){ return G.activeProfile?.type==='business' ? G.activeProfile.businessId : null; }
function operatingProfileName(){ return G.activeProfile?.name || (G.activeProfile?.type==='business'?'Business':'Personal'); }
function operatingAccounts(bank){
  const all=Object.values(G.accounts||{}).filter(a=>!bank||bankName(a)===String(bank).toUpperCase());
  if(G.activeProfile?.type==='business') return all.filter(a=>a.businessId===G.activeProfile.businessId);
  return all.filter(a=>a.ownerUid===G.user?.uid && !a.businessId && a.ownerType!=='business');
}
function preferredOperatingAccount(bank,currency){ return operatingAccounts(bank).find(a=>!currency||accountCurrency(a)===currency)||null; }
function setOperatingProfile(type,businessId,name){
  saveOperatingProfile({type:type==='business'?'business':'personal',businessId:type==='business'?businessId:null,name:name||null});
  location.reload();
}

function requireAdmin(what){ if(!isAdmin()){ toast('Only admins can '+(what||'do that')+'.',false); return false;} return true; }
function requireBankStaff(bank, what){ if(!canManageBank(bank)){ toast('Only '+bank+' staff can '+(what||'do that')+'.',false); return false;} return true; }

async function audit(action, detail){
  try{
    await db.collection('adminLogs').add({
      action, detail:detail||{}, actor:authenticatedUsername(), actorUid:authenticatedUid(), actorRole:G.actorRole||G.role,
      actingAsUid:G.supportMode?effectiveUid():null, actingAsUsername:G.supportMode?G.username:null,
      supportSessionId:G.supportMode?G.supportSessionId:null, createdAt:now8601()
    });
  }catch(e){ console.warn('audit failed',e); }
}

/* ── Presence ──
   Firestore has no reliable browser onDisconnect hook. The heartbeat timestamp
   is therefore the source of truth; the online Boolean is only an immediate hint.
   Admin pages treat a record as online only while its heartbeat is fresh. */
const PRESENCE_HEARTBEAT_MS = 30000;
async function setPresence(online, state){
  if(!G.user) return;
  const visible = !document.hidden;
  const resolvedState = state || (online && visible ? 'online' : (visible ? 'offline' : 'away'));
  try{
    await db.collection('presence').doc(authenticatedUid()).set({
      username:authenticatedUsername(),
      online:!!online,
      state:resolvedState,
      page:(document.body.dataset.brand||'portal')+(G.supportMode?` · supporting ${G.username}`:''),
      supportTargetUid:G.supportMode?effectiveUid():null,
      supportTargetUsername:G.supportMode?G.username:null,
      lastSeen:FV.serverTimestamp(),
      clientLastSeen:now8601()
    },{merge:true});
  }catch(e){ console.warn('presence update failed',e); }
}
function startPresence(){
  if(G.presenceTimer) clearInterval(G.presenceTimer);
  const publish=()=>setPresence(!document.hidden, document.hidden?'away':'online');
  publish();
  G.presenceTimer=setInterval(()=>{
    if(!document.hidden) setPresence(true,'online');
  }, PRESENCE_HEARTBEAT_MS);
  document.addEventListener('visibilitychange',publish);
  window.addEventListener('pagehide',()=>{ try{ setPresence(false,'offline'); }catch{} });
  window.addEventListener('beforeunload',()=>{ try{ setPresence(false,'offline'); }catch{} });
}

/* ── FX (Valorian Frank) ── */
const DEFAULT_FX = { vfPerEmerul:2.40, spreadPct:0.5 };
function normalizeFx(data={}){
  return {...DEFAULT_FX, ...data, vfPerEmerul:Number(data.vfPerEmerul ?? data.vfPerUsd ?? DEFAULT_FX.vfPerEmerul)};
}
function subscribeFx(onChange){
  G.unsubs.push(db.collection('fx').doc('settings').onSnapshot(doc=>{
    G.fx = doc.exists ? normalizeFx(doc.data()) : {...DEFAULT_FX};
    if(onChange) onChange(G.fx);
  }, err=>console.warn('fx listener', err)));
}
async function ensureFxSettings(){
  if(!isAdmin()) return;
  const ref=db.collection('fx').doc('settings'); const s=await ref.get();
  if(!s.exists) await ref.set({...DEFAULT_FX, createdAt:now8601(), updatedBy:authenticatedUid()});
  else if(!s.data().vfPerEmerul) await ref.set({vfPerEmerul:fxRate(s.data())},{merge:true});
}
/* rate incl. spread: buying VF (Emerul→VF) gets slightly fewer francs; selling VF gets slightly fewer Emerul */
function fxQuote(direction, amount){
  const r=fxRate(), sp=Number(G.fx.spreadPct||0)/100;
  if(direction==='em2vf'){ const rate=r*(1-sp); return {rate, out:Math.round(amount*rate*100)/100}; }
  const rate=r*(1+sp); return {rate, out:Math.round(amount/rate*100)/100};
}


/* ── Account bootstrap (keeps legacy IDs, adds VNB lazily) ── */
async function loadOwnedAccounts(){
  const uid=G.user.uid;
  const snap = await db.collection('accounts').where('ownerUid','==',uid).get();
  G.accounts={};
  snap.docs.forEach(d=>{ G.accounts[d.id]={...d.data(), id:d.id}; });

  /* Load business memberships and every account the signed-in member is
     authorized to operate. Existing personal accounts remain unchanged. */
  G.businessMemberships={};
  try{
    const ms=await db.collection('businessMembers').where('uid','==',uid).get();
    ms.docs.forEach(d=>{const m={id:d.id,...d.data()};if(m.businessId)G.businessMemberships[m.businessId]=m;});
    for(const businessId of Object.keys(G.businessMemberships)){
      const bs=await db.collection('accounts').where('businessId','==',businessId).get();
      bs.docs.forEach(d=>{G.accounts[d.id]={...d.data(),id:d.id,ownerType:'business',businessId};});
    }
  }catch(err){ console.warn('business memberships unavailable',err); }

  const p=G.profile||{};
  const personal=Object.values(G.accounts).filter(a=>a.ownerType!=='business'&&!a.businessId&&a.ownerUid===uid);
  const byBank = b => personal.find(a=>bankName(a)===b);
  G.accountId       = (p.iubAccountId && G.accounts[p.iubAccountId] && G.accounts[p.iubAccountId].ownerType!=='business') ? p.iubAccountId : (byBank('IUB')?.id || p.accountId || null);
  G.meraldAccountId = (p.meraldAccountId && G.accounts[p.meraldAccountId] && G.accounts[p.meraldAccountId].ownerType!=='business') ? p.meraldAccountId : (byBank('MERALD')?.id || null);
  G.vnbAccountId    = (p.vnbAccountId && G.accounts[p.vnbAccountId] && G.accounts[p.vnbAccountId].ownerType!=='business') ? p.vnbAccountId : (byBank('VNB')?.id || null);

  const pref=savedOperatingProfile();
  if(pref?.type==='business' && pref.businessId && G.businessMemberships[pref.businessId]){
    const bizAccounts=Object.values(G.accounts).filter(a=>a.businessId===pref.businessId);
    const bizName=bizAccounts[0]?.businessName||pref.name||'Business';
    G.activeProfile={type:'business',businessId:pref.businessId,name:bizName};
    G.accountId=bizAccounts.find(a=>bankName(a)==='IUB')?.id||null;
    G.meraldAccountId=bizAccounts.find(a=>bankName(a)==='MERALD')?.id||null;
    G.vnbAccountId=bizAccounts.find(a=>bankName(a)==='VNB')?.id||null;
    const ordered={};bizAccounts.forEach(a=>ordered[a.id]=a);Object.values(G.accounts).filter(a=>a.businessId!==pref.businessId).forEach(a=>ordered[a.id]=a);G.accounts=ordered;
  }else{
    G.activeProfile={type:'personal',businessId:null,name:G.username||'Personal'};
    saveOperatingProfile(G.activeProfile);
    const ordered={};personal.forEach(a=>ordered[a.id]=a);Object.values(G.accounts).filter(a=>!ordered[a.id]).forEach(a=>ordered[a.id]=a);G.accounts=ordered;
  }
}
async function ensureVnbAccount(){
  if(G.vnbAccountId) return G.vnbAccountId;
  const ref = db.collection('accounts').doc();
  await ref.set({name:`${G.username} VNB`, bank:'VNB', currency:'VF', ownerUid:G.user.uid, ownerUsername:G.username, balance:0, status:'active', accountType:'checking', interestApr:0, createdAt:now8601()});
  await db.collection('users').doc(G.user.uid).set({vnbAccountId:ref.id},{merge:true});
  G.vnbAccountId=ref.id;
  toast('Your Valorian Frank account has been opened.');
  return ref.id;
}


/* ── Member-facing bank ownership summary for individual bank apps ── */
async function mountBankOwnershipSummary(bank, elementId='bank-owner-panel'){
  const el=$(elementId); if(!el||!G.user) return;
  try{
    const equity=[]; const settlements=[];
    const addUnique=(target,items)=>items.forEach(x=>{if(!target.some(y=>y.id===x.id))target.push(x)});
    const personal=await db.collection('bankEquity').where('ownerUid','==',G.user.uid).get();
    addUnique(equity,personal.docs.map(d=>({id:d.id,...d.data()})));
    const personalSettlements=await db.collection('bankOwnerSettlements').where('ownerUid','==',G.user.uid).get().catch(()=>null);
    if(personalSettlements)addUnique(settlements,personalSettlements.docs.map(d=>({id:d.id,...d.data()})));
    for(const businessId of Object.keys(G.businessMemberships||{})){
      const [es,ss]=await Promise.all([
        db.collection('bankEquity').where('businessId','==',businessId).get().catch(()=>null),
        db.collection('bankOwnerSettlements').where('businessId','==',businessId).get().catch(()=>null)
      ]);
      if(es)addUnique(equity,es.docs.map(d=>({id:d.id,...d.data()})));
      if(ss)addUnique(settlements,ss.docs.map(d=>({id:d.id,...d.data()})));
    }
    const stakes=equity.filter(x=>x.bank===bank&&String(x.status||'active')==='active');
    if(!stakes.length){el.classList.add('hide');return;}
    const result=settlements.filter(x=>x.bank===bank).reduce((n,x)=>n+Number(x.amount||0),0);
    const pct=stakes.reduce((n,x)=>n+Number(x.ownershipPct||0),0);
    const names=stakes.map(x=>x.businessName||x.ownerName||x.ownerUsername||G.username).join(', ');
    const cur=bank==='VNB'?'VF':'EM';
    el.classList.remove('hide');
    el.innerHTML=`<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px"><div><h2>Bank ownership</h2><div class="sub">Ownership controlled by this login: ${esc(names)}</div></div><span style="border:1px solid rgba(90,140,230,.35);border-radius:999px;padding:4px 8px;font-size:10px;font-weight:800">${pct.toFixed(2)}%</span></div><div style="display:flex;justify-content:space-between;gap:12px;padding:9px 0;border-top:1px solid rgba(128,160,210,.18);font-size:12px"><span>Cumulative settled result</span><b style="color:${result>=0?'#25c47a':'#ef5b65'}">${result>=0?'+':'−'}${fmtCur(Math.abs(result),cur)}</b></div><a href="services.html" style="display:inline-block;margin-top:7px;font-size:11px;font-weight:800">Open ownership statements →</a>`;
  }catch(err){console.warn('bank ownership summary',err);el.classList.add('hide')}
}

/* ── Universal transfer engine (handles cross-currency via FX) ── */
async function transferBetween(fromId, toId, amount, note){
  const amt=Math.round(Number(amount)*100)/100;
  if(!fromId||!toId||fromId===toId) throw new Error('Choose two different accounts.');
  if(!amt||amt<=0) throw new Error('Enter a valid amount.');
  const fromRef=db.collection('accounts').doc(fromId), toRef=db.collection('accounts').doc(toId);
  const transferId=db.collection('bankTransfers').doc().id;
  const createdAt=now8601();
  let summary=null;
  await db.runTransaction(async tx=>{
    const [fs,ts]=await Promise.all([tx.get(fromRef),tx.get(toRef)]);
    if(!fs.exists||!ts.exists) throw new Error('Account not found.');
    const from={...fs.data(),id:fs.id}, to={...ts.data(),id:ts.id};
    if(from.ownerUid!==G.user.uid && !isStaffUser() && !canUseBusinessAccount(from,'transfer')) throw new Error('You can only send from your own or authorized business accounts.');
    if(accountStatus(from)!=='active' && !isStaffUser()) throw new Error('The source account is restricted.');
    if(accountStatus(to)==='closed') throw new Error('The destination account is closed.');
    if(Number(from.balance||0)<amt) throw new Error('Insufficient balance.');
    const fc=accountCurrency(from), tc=accountCurrency(to);
    let credit=amt, fxNote='';
    if(fc!==tc){
      const q = fc===EMERUL_CODE ? fxQuote('em2vf',amt) : fxQuote('vf2em',amt);
      credit=q.out; fxNote=` · FX @ ${q.rate.toFixed(4)} ${fc===EMERUL_CODE?'₣/EM':'EM/₣'}`;
    }
    tx.update(fromRef,{balance:FV.increment(-amt), updatedAt:createdAt});
    tx.update(toRef,{balance:FV.increment(credit), updatedAt:createdAt});
    tx.set(db.collection('bankTransfers').doc(transferId),{fromAccountId:fromId,toAccountId:toId,fromBank:bankName(from),toBank:bankName(to),amount:amt,credited:credit,fromCurrency:fc,toCurrency:tc,note:String(note||'Transfer').slice(0,140),ownerUid:G.user.uid,ownerUsername:G.username,createdAt});
    tx.set(db.collection('transactions').doc(),{accountId:fromId,ownerUid:from.ownerUid,ownerUsername:from.ownerUsername,bank:bankName(from),type:'transfer_out',amount:amt,description:`${bankName(from)} transfer to ${to.name}: ${note||'Transfer'}${fxNote}`,relatedAccountId:toId,transferId,createdAt,createdBy:authenticatedUid()});
    tx.set(db.collection('transactions').doc(),{accountId:toId,ownerUid:to.ownerUid,ownerUsername:to.ownerUsername,bank:bankName(to),type:'transfer_in',amount:credit,description:`Transfer from ${from.name} (${bankName(from)}): ${note||'Transfer'}${fxNote}`,relatedAccountId:fromId,transferId,createdAt,createdBy:authenticatedUid()});
    summary={from,to,amt,credit,fc,tc};
  });
  return summary;
}

/* ── Manager desk ops (shared by all bank pages) ── */
async function staffAdjustBalance(bank, accountId, amount, memo){
  if(!requireBankStaff(bank,'adjust balances')) return;
  const amt=Math.round(Number(amount)*100)/100;
  if(!amt) return toast('Enter a non-zero amount.',false);
  const ref=db.collection('accounts').doc(accountId);
  await db.runTransaction(async tx=>{
    const s=await tx.get(ref); if(!s.exists) throw new Error('Account not found.');
    const a=s.data();
    if(bankName(a)!==bank) throw new Error('That account belongs to another institution.');
    if(amt<0 && Number(a.balance||0)<Math.abs(amt)) throw new Error('Adjustment would overdraw the account.');
    tx.update(ref,{balance:FV.increment(amt), updatedAt:now8601()});
    tx.set(db.collection('transactions').doc(),{accountId,ownerUid:a.ownerUid,ownerUsername:a.ownerUsername,bank,type:amt>=0?'deposit':'fee',amount:Math.abs(amt),description:`${amt>=0?'Credit':'Debit'} by ${G.role} ${G.username}: ${memo||'Account adjustment'}`,createdAt:now8601(),createdBy:authenticatedUid()});
  });
  await audit('staff.adjust',{bank,accountId,amount:amt,memo});
  toast('Adjustment posted.');
}
async function staffSetStatus(bank, accountId, status){
  if(!requireBankStaff(bank,'change account status')) return;
  await db.collection('accounts').doc(accountId).update({status, updatedAt:now8601()});
  await audit('staff.status',{bank,accountId,status});
  toast(`Account marked ${status}.`);
}


/* ── Network-wide administrator announcements ── */
function subscribeNetworkNotices(){
  let host=$('uur-network-notices');
  if(!host){host=document.createElement('div');host.id='uur-network-notices';document.body.prepend(host);}
  const un=db.collection('networkNotices').orderBy('createdAt','desc').limit(5).onSnapshot(s=>{
    const now=Date.now(),items=s.docs.map(d=>({id:d.id,...d.data()})).filter(n=>n.active!==false&&(!n.expiresAt||dateFromAny(n.expiresAt).getTime()>=now)).slice(0,3);
    host.innerHTML=items.map(n=>`<div class="uur-network-notice uur-network-${esc(n.severity||'info')}"><div><b>${esc(n.title||'Network notice')}</b><span>${esc(n.body||'')}</span></div><small>${esc(n.by||'Union of the United Republics Administration')}</small></div>`).join('');
    host.style.display=items.length?'block':'none';
  },e=>console.warn('network notices',e));
  G.unsubs.push(un);
}



/* ── Persistent collapsible activity panels ── */
function ensureCollapsibleStyles(){
  if(document.getElementById('uur-collapsible-styles')) return;
  const st=document.createElement('style'); st.id='uur-collapsible-styles'; st.textContent=`
    .uur-collapse-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
    .uur-collapse-head>div{min-width:0;flex:1}
    .uur-collapse-btn{flex:0 0 auto;border:1px solid rgba(128,160,210,.28);border-radius:8px;padding:6px 9px;background:rgba(255,255,255,.035);color:inherit;font:700 10px/1.1 system-ui,sans-serif;letter-spacing:.04em;text-transform:uppercase;cursor:pointer}
    .uur-collapse-btn:hover{background:rgba(90,130,210,.11);border-color:rgba(100,150,240,.48)}
    .uur-collapsible-body{overflow:hidden}
    .uur-collapsible-body[hidden]{display:none!important}
    [data-uur-collapsible].uur-collapsed{padding-bottom:12px!important}
  `; document.head.appendChild(st);
}
function setupCollapsiblePanels(){
  ensureCollapsibleStyles();
  document.querySelectorAll('[data-uur-collapsible]').forEach(panel=>{
    if(panel.dataset.uurCollapseReady==='1') return;
    panel.dataset.uurCollapseReady='1';
    const body=panel.querySelector('.uur-collapsible-body'),btn=panel.querySelector('.uur-collapse-btn');
    if(!body||!btn) return;
    const brand=String(document.body?.dataset?.brand||location.pathname||'site').toLowerCase();
    const key='uur:collapsed:'+brand+':'+String(panel.dataset.uurCollapsible||'panel');
    const apply=(collapsed)=>{
      body.hidden=!!collapsed; panel.classList.toggle('uur-collapsed',!!collapsed);
      btn.textContent=collapsed?'Expand':'Minimize'; btn.setAttribute('aria-expanded',collapsed?'false':'true');
      try{localStorage.setItem(key,collapsed?'1':'0')}catch{}
    };
    let initial=false; try{initial=localStorage.getItem(key)==='1'}catch{}
    btn.addEventListener('click',()=>apply(!body.hidden)); apply(initial);
  });
}

/* ── Auth session boot for every page ──
   opts: { requireAuth:true, onReady(profile), brand:'IUB' } */
async function resolveSupportContext(opts){
  G.supportMode=false;G.supportSessionId=null;G.supportTargetUid=null;G.supportTargetUsername='';
  if(G.actorRole!=='head_admin') return;
  const brand=String(opts?.brand||document.body?.dataset?.brand||'').toUpperCase();
  if(['ADMIN','ADVADMIN'].includes(brand)) return;
  const pref=readSupportPreference(); if(!pref?.sessionId||!pref?.targetUid) return;
  try{
    const ss=await db.collection('supportSessions').doc(pref.sessionId).get();
    if(!ss.exists) return saveSupportPreference(null);
    const session=ss.data();
    if(session.status!=='active'||session.actorUid!==authenticatedUid()||session.targetUid!==pref.targetUid) return saveSupportPreference(null);
    if(session.expiresAt && dateFromAny(session.expiresAt).getTime()<=Date.now()){await ss.ref.set({status:'expired',endedAt:now8601(),endedByUid:authenticatedUid()},{merge:true});saveSupportPreference(null);return;}
    const ts=await db.collection('users').doc(pref.targetUid).get();
    if(!ts.exists){saveSupportPreference(null);return;}
    const tp=ts.data()||{}, uname=tp.username||session.targetUsername||'Supported user';
    G.supportMode=true;G.supportSessionId=ss.id;G.supportTargetUid=pref.targetUid;G.supportTargetUsername=uname;
    G.user={uid:pref.targetUid,email:String(uname).replace(/\s+/g,'')+FAKE_DOMAIN,isVirtualSupportUser:true};
    G.username=uname;G.profile=tp;G.role=tp.role==='manager'?'manager':tp.role==='admin'?'admin':'user';G.managerBank=tp.managerBank||'';
    await ss.ref.set({lastUsedAt:now8601(),lastPage:brand||'PORTAL'},{merge:true});
    await audit('support.page.opened',{page:brand||'PORTAL',targetUid:pref.targetUid,targetUsername:uname});
  }catch(e){console.warn('support context unavailable',e);saveSupportPreference(null);}
}
function mountSupportActionObserver(){
  if(!G.supportMode||document.documentElement.dataset.uurSupportObserver==='1')return;
  document.documentElement.dataset.uurSupportObserver='1';
  document.addEventListener('click',e=>{
    const control=e.target.closest('button,a,[role="button"]');if(!control)return;
    const label=String(control.getAttribute('aria-label')||control.textContent||control.getAttribute('href')||'control').replace(/\s+/g,' ').trim().slice(0,120);
    audit('support.ui.action',{page:String(document.body?.dataset?.brand||'PORTAL'),control:label,href:control.getAttribute('href')||null});
  },true);
}
function mountSupportBanner(){
  document.getElementById('uur-support-banner')?.remove(); if(!G.supportMode)return;
  const el=document.createElement('div');el.id='uur-support-banner';
  el.innerHTML=`<div><b>HEAD ADMIN SUPPORT MODE</b><span>Minekid123 is operating as ${esc(G.username)}. Every supported action is audit logged.</span></div><button type="button">Exit support mode</button>`;
  el.querySelector('button').addEventListener('click',exitSupportMode);document.body.prepend(el);
}
async function exitSupportMode(){
  const id=G.supportSessionId||readSupportPreference()?.sessionId;
  try{if(id)await db.collection('supportSessions').doc(id).set({status:'ended',endedAt:now8601(),endedByUid:authenticatedUid()},{merge:true});}catch(e){console.warn(e)}
  saveSupportPreference(null);location.href='admin.html';
}
function bootPage(opts){
  ensureChrome();
  auth.onAuthStateChanged(async user=>{
    if(!user){
      if(opts.requireAuth!==false){ location.href='index.html'; return; }
      if(opts.onSignedOut) opts.onSignedOut();
      return;
    }
    G.authUser=user;G.user=user;
    G.actorUsername=(user.email||'').replace(FAKE_DOMAIN,'');G.username=G.actorUsername;
    try{
      const uref=db.collection('users').doc(user.uid);
      let snap=await uref.get();
      if(!snap.exists){ await uref.set({username:G.actorUsername, role:'user', createdAt:now8601()}); snap=await uref.get(); }
      G.actorProfile=snap.data()||{};G.profile=G.actorProfile;G.actorUsername=G.actorProfile.username||G.actorUsername;G.username=G.actorUsername;
      if(String(G.actorProfile.loginStatus||'active')==='retired'){
        alert('This legacy business login has been retired. Sign in with the owner account and use the Business Center.');
        await auth.signOut(); location.href='index.html'; return;
      }
      G.actorRole='user';
      if(isHeadAdminIdentity(user,G.actorProfile)) G.actorRole='head_admin';
      else if(ADMINS.includes(normalizeUsername(G.actorUsername)) || G.actorProfile.role==='admin') G.actorRole='admin';
      else { try{ const a=await db.collection('admins').doc(user.uid).get(); if(a.exists) G.actorRole='admin'; }catch{} }
      if(G.actorRole==='user' && G.actorProfile.role==='manager'){ G.actorRole='manager'; }
      G.role=G.actorRole;G.managerBank=G.actorProfile.managerBank||'';
      await resolveSupportContext(opts);
      await loadOwnedAccounts();
      subscribeFx(opts.onFx);startPresence();subscribeNetworkNotices();
      if(opts.onReady) await opts.onReady(G.profile);
      mountSupportBanner();mountSupportActionObserver();setupCollapsiblePanels();
    }catch(err){
      console.error('boot failed',err);toast('Could not load your profile: '+(err.message||err),false);
    }
  });
}
async function doLogout(){
  try{ await setPresence(false); }catch{}
  if(G.supportMode){try{await db.collection('supportSessions').doc(G.supportSessionId).set({status:'ended',endedAt:now8601(),endedByUid:authenticatedUid()},{merge:true});}catch{}saveSupportPreference(null);}
  G.unsubs.forEach(u=>{try{u()}catch{}}); G.unsubs=[];
  if(G.presenceTimer) clearInterval(G.presenceTimer);
  await auth.signOut();location.href='index.html';
}

/* ── Shared subscriptions used by bank pages ── */
function subscribeAccount(accountId, cb){
  const un=db.collection('accounts').doc(accountId).onSnapshot(d=>cb(d.exists?{...d.data(),id:d.id}:null), e=>console.error('acct listen',e));
  G.unsubs.push(un); return un;
}
function subscribeTransactions(accountId, cb, lim=300){
  const un=db.collection('transactions').where('accountId','==',accountId).limit(lim).onSnapshot(s=>{
    cb(s.docs.map(d=>({...d.data(),id:d.id})).sort((a,b)=>dateFromAny(b.createdAt)-dateFromAny(a.createdAt)));
  }, e=>console.error('tx listen',e));
  G.unsubs.push(un); return un;
}

/* ── CSV export ── */
function csvCell(v){ const s=String(v??''); return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s; }
function downloadTextFile(name, text){
  const blob=new Blob([text],{type:'text/csv'}); const a=document.createElement('a');
  a.href=URL.createObjectURL(blob); a.download=name; a.click(); URL.revokeObjectURL(a.href);
}
function exportStatement(account, txs){
  const rows=[['Date','Type','Amount','Currency','Description']];
  (txs||[]).forEach(t=>rows.push([fmtDateTime(t.createdAt),t.type,Number(t.amount||0).toFixed(2),accountCurrency(account),t.description||'']));
  downloadTextFile(`${bankName(account)}-statement-${(account.name||'account').replace(/\s+/g,'_')}.csv`, rows.map(r=>r.map(csvCell).join(',')).join('\n'));
  toast('Statement downloaded.');
}

function printBrandedStatement(account, txs, monthLabel){
  const currency=accountCurrency(account), rows=(txs||[]).map(t=>`<tr><td>${esc(fmtDateTime(t.createdAt))}</td><td>${esc(t.type||'transaction')}</td><td>${esc(t.description||'')}</td><td style="text-align:right">${esc(fmtCur(Number(t.amount||0),currency))}</td></tr>`).join('')||'<tr><td colspan="4">No transactions for this period.</td></tr>';
  const w=window.open('','_blank','width=980,height=760'); if(!w)return toast('Allow pop-ups to print the statement.',false);
  w.document.write(`<!doctype html><html><head><title>${esc(bankName(account))} statement</title><style>body{font:14px Arial;color:#172033;margin:40px}header{display:flex;justify-content:space-between;border-bottom:3px solid #274c8f;padding-bottom:18px;margin-bottom:24px}h1{margin:0;font-size:25px}.muted{color:#64748b}table{width:100%;border-collapse:collapse;margin-top:22px}th,td{padding:10px;border-bottom:1px solid #d9e0eb;text-align:left}th{background:#eef3fa;font-size:11px;text-transform:uppercase}footer{margin-top:35px;border-top:1px solid #d9e0eb;padding-top:12px;color:#64748b;font-size:11px}</style></head><body><header><div><h1>Union of the United Republics</h1><div class="muted">${esc(bankName(account))} Monthly Account Statement</div></div><div style="text-align:right"><b>${esc(monthLabel||'Account statement')}</b><br>${esc(account.name||'Account')}<br>${esc(account.id||'')}</div></header><p><b>Account owner:</b> ${esc(account.ownerUsername||G.username)}<br><b>Currency:</b> ${esc(currency==='VF'?'Valorian Frank':'U.U.R. Emerul')}<br><b>Current balance:</b> ${esc(fmtCur(account.balance,currency))}</p><table><thead><tr><th>Date</th><th>Type</th><th>Description</th><th style="text-align:right">Amount</th></tr></thead><tbody>${rows}</tbody></table><footer>Generated by the Union of the United Republics Financial Network. This is a fictional role-play financial statement.</footer><script>window.onload=()=>window.print()<\/script></body></html>`); w.document.close();
}

/* ── Shared chrome CSS (toasts, modal, staff cards, portal switcher) ── */
(function(){
  const css=document.createElement('style');
  css.textContent=`
#uur-toasts{position:fixed;bottom:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:8px}
.uur-toast{padding:12px 18px;border-radius:10px;font:600 13px/1.4 system-ui,sans-serif;color:#fff;max-width:340px;opacity:0;transform:translateY(8px);transition:all .3s;box-shadow:0 10px 30px rgba(0,0,0,.35)}
.uur-toast.show{opacity:1;transform:none}
.uur-toast.ok{background:#15803d}.uur-toast.bad{background:#b91c1c}
#uur-modal{position:fixed;inset:0;background:rgba(4,8,16,.66);backdrop-filter:blur(4px);z-index:9000;display:none;align-items:flex-start;justify-content:center;padding:6vh 16px;overflow:auto}
#uur-modal.open{display:flex}
.uur-modal-card{background:var(--modal-bg,#101826);color:var(--modal-fg,#e6edf5);border:1px solid rgba(255,255,255,.12);border-radius:16px;max-width:640px;width:100%;padding:24px;box-shadow:0 40px 80px rgba(0,0,0,.5)}
.uur-modal-head{display:flex;justify-content:space-between;align-items:center;gap:12px}
#uur-modal-title{font-size:18px;font-weight:800}
#uur-modal-sub{font-size:12.5px;opacity:.7;margin:6px 0 16px}
.uur-modal-x{background:transparent;border:0;color:inherit;font-size:16px;cursor:pointer;opacity:.6}
.uur-modal-x:hover{opacity:1}
#uur-modal-foot{display:flex;gap:10px;justify-content:flex-end;margin-top:18px}
.staff-card{display:flex;gap:14px;padding:14px;border-radius:12px;border:1px solid var(--staff-border,rgba(127,127,127,.25));background:var(--staff-bg,rgba(127,127,127,.06));margin-bottom:10px}
.staff-avatar{width:46px;height:46px;border-radius:50%;flex:none;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:15px;background:var(--staff-avatar,#334155);color:#fff}
.staff-name{font-weight:700;font-size:14px}.staff-title{font-size:12px;opacity:.75;margin:1px 0 4px;font-weight:600}
.staff-bio{font-size:12px;opacity:.65;line-height:1.45}
.uur-switcher{position:fixed;bottom:18px;left:18px;z-index:8000}
.uur-switcher-btn{width:52px;height:52px;border-radius:50%;border:1px solid rgba(255,255,255,.2);background:#0b1220;color:#fff;font-weight:800;cursor:pointer;box-shadow:0 10px 30px rgba(0,0,0,.4);font-size:11px;letter-spacing:.05em}
.uur-switcher-menu{position:absolute;bottom:60px;left:0;background:#0d1526;border:1px solid rgba(255,255,255,.14);border-radius:14px;padding:8px;display:none;min-width:230px;box-shadow:0 24px 60px rgba(0,0,0,.5)}
.uur-switcher.open .uur-switcher-menu{display:block}
.uur-switcher-menu a{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:9px;color:#dbe4f0;text-decoration:none;font:600 13px system-ui,sans-serif}
.uur-switcher-menu a:hover{background:rgba(255,255,255,.07)}
.uur-switcher-menu img{width:30px;height:auto}
.uur-profile-box{padding:9px 10px 10px;border-bottom:1px solid rgba(255,255,255,.11);margin-bottom:5px}
.uur-profile-box label{display:block;color:#8190a8;font:800 9px/1.2 system-ui,sans-serif;letter-spacing:.09em;text-transform:uppercase;margin-bottom:6px}
.uur-profile-box select{width:100%;border:1px solid rgba(255,255,255,.14);border-radius:8px;padding:8px;background:#111c30;color:#e8eef8;font:600 12px system-ui,sans-serif}
.uur-profile-active{display:block;color:#9fb2ce;font:500 10px/1.35 system-ui,sans-serif;margin-top:6px}
.uur-task-badge{position:fixed;bottom:24px;left:80px;z-index:7999;display:none;align-items:center;gap:7px;text-decoration:none;border:1px solid rgba(243,183,79,.42);background:#3d2a08;color:#ffe6ad;border-radius:999px;padding:8px 11px;font:800 10px/1 system-ui,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.34)}
.uur-task-badge.show{display:flex}.uur-task-count{display:grid;place-items:center;min-width:20px;height:20px;border-radius:999px;background:#f3b74f;color:#211600;padding:0 5px}
#uur-support-banner{position:sticky;top:0;z-index:9998;display:flex;align-items:center;justify-content:space-between;gap:14px;padding:10px 16px;background:#5b2109;color:#ffedd5;border-bottom:1px solid #fdba74;font:600 12px/1.4 system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.28)}
#uur-support-banner div{display:flex;align-items:center;gap:12px;flex-wrap:wrap}#uur-support-banner b{font-size:10px;letter-spacing:.08em}#uur-support-banner span{opacity:.92}#uur-support-banner button{border:1px solid rgba(255,255,255,.35);background:rgba(255,255,255,.1);color:#fff7ed;border-radius:8px;padding:7px 10px;font-weight:800;cursor:pointer;white-space:nowrap}
#uur-network-notices{display:none;position:relative;z-index:8500;font-family:system-ui,sans-serif}
.uur-network-notice{display:flex;justify-content:space-between;gap:16px;align-items:center;padding:9px 18px;border-bottom:1px solid rgba(255,255,255,.14);background:#172033;color:#edf4ff;font-size:12px;line-height:1.45}
.uur-network-notice b{margin-right:8px}.uur-network-notice span{opacity:.9}.uur-network-notice small{opacity:.7;white-space:nowrap;font-size:10px}.uur-network-warning{background:#4a3508;color:#fff0b0}.uur-network-critical{background:#4b1118;color:#ffd3d7}
@media(max-width:700px){.uur-network-notice{align-items:flex-start;flex-direction:column;gap:3px}.uur-network-notice small{white-space:normal}}
`;
  document.head.appendChild(css);
})();

/* ── Floating network switcher (every brand page gets one) ── */
function mountSwitcher(current){
  document.querySelectorAll('.uur-switcher').forEach(x=>x.remove());
  const wrap=document.createElement('div'); wrap.className='uur-switcher';
  const links=Object.values(BRANDS).filter(b=>b.short!==current).map(b=>`<a href="${b.page}"><img src="${b.logo}" alt=""><span>${esc(b.name)}</span></a>`).join('');
  const adminLink=isAdmin()&&current!=='ADMIN'?`<a href="admin.html"><span style="width:30px;text-align:center;font-size:15px">⚙</span><span>Network Administration</span></a>`:'';
  const advancedLink=isAdmin()&&current!=='ADVADMIN'?`<a href="advanced-admin.html"><span style="width:30px;text-align:center;font-size:15px">▦</span><span>Programs & Economy</span></a>`:'';
  const servicesLink=current!=='SERVICES'?`<a href="services.html"><span style="width:30px;text-align:center;font-size:15px">◆</span><span>Finance Services</span></a>`:'';
  const bizOptions=Object.entries(G.businessMemberships||{}).map(([businessId,m])=>{const acct=Object.values(G.accounts||{}).find(a=>a.businessId===businessId);const name=acct?.businessName||m.businessName||m.name||businessId;return `<option value="business:${esc(businessId)}" ${G.activeProfile?.businessId===businessId?'selected':''}>${esc(name)}</option>`;}).join('');
  wrap.innerHTML=`<div class="uur-switcher-menu"><div class="uur-profile-box"><label>Operating profile</label><select id="uur-global-profile"><option value="personal" ${G.activeProfile?.type!=='business'?'selected':''}>Personal · ${esc(G.username)}</option>${bizOptions}</select><span class="uur-profile-active">Currently operating as ${esc(operatingProfileName())}. Accounts and actions stay legally separate.</span></div><a href="index.html"><span style="width:30px;text-align:center;font-size:16px">⌂</span><span>Union Portal Home</span></a>${servicesLink}${adminLink}${advancedLink}${links}<a href="#" onclick="doLogout();return false"><span style="width:30px;text-align:center;font-size:15px">⎋</span><span>Sign out</span></a></div><button class="uur-switcher-btn" title="Union of the United Republics Financial Network">U.U.R</button>`;
  wrap.querySelector('button').addEventListener('click',()=>wrap.classList.toggle('open'));
  wrap.querySelector('#uur-global-profile')?.addEventListener('change',e=>{const v=e.target.value;if(v==='personal')setOperatingProfile('personal');else{const id=v.slice(9),acct=Object.values(G.accounts||{}).find(a=>a.businessId===id);setOperatingProfile('business',id,acct?.businessName||id)}});
  document.addEventListener('click',e=>{if(!wrap.contains(e.target))wrap.classList.remove('open')});document.body.appendChild(wrap);mountPendingTaskIndicator();
}

async function mountPendingTaskIndicator(){
  if(!G.user)return;let el=document.getElementById('uur-task-badge');if(!el){el=document.createElement('a');el.id='uur-task-badge';el.className='uur-task-badge';el.href='services.html';document.body.appendChild(el)}
  try{const uid=G.user.uid,[ns,apps,invs,invites,transfers]=await Promise.all([db.collection('notifications').where('recipientUid','==',uid).limit(100).get().catch(()=>null),db.collection('businessApplications').where('ownerUid','==',uid).limit(50).get().catch(()=>null),db.collection('invoices').where('recipientUid','==',uid).limit(100).get().catch(()=>null),db.collection('businessInvitations').where('recipientUid','==',uid).limit(50).get().catch(()=>null),db.collection('businessOwnershipTransfers').where('newOwnerUid','==',uid).limit(50).get().catch(()=>null)]);let count=0;if(ns)count+=ns.docs.filter(d=>d.data().read!==true).length;if(apps)count+=apps.docs.filter(d=>['pending','changes_requested'].includes(String(d.data().status||'pending'))).length;if(invs)count+=invs.docs.filter(d=>['pending','due','overdue'].includes(String(d.data().status||'pending'))).length;if(invites)count+=invites.docs.filter(d=>String(d.data().status||'pending')==='pending').length;if(transfers)count+=transfers.docs.filter(d=>String(d.data().status||'pending')==='pending').length;G.pendingTaskCount=count;el.innerHTML=`<span>Pending tasks</span><span class="uur-task-count">${count}</span>`;el.classList.toggle('show',count>0)}catch(e){console.warn('pending task indicator',e);el.classList.remove('show')}
}
