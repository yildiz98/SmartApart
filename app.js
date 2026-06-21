const KEY='emfe3_smartapart_v17_firebase';
let paymentFilter='all';

const firebaseConfig = {
  apiKey: "AIzaSyCPB0AY7cRjJ-DhS0YFPF4Y0Y2ZJUsXIN0",
  authDomain: "smartapart-ab8de.firebaseapp.com",
  projectId: "smartapart-ab8de",
  storageBucket: "smartapart-ab8de.firebasestorage.app",
  messagingSenderId: "875587120223",
  appId: "1:875587120223:web:b60b64df851fd40052ffea",
  measurementId: "G-DKR5RHYYBX"
};
let fbApp=null, fbAuth=null, fbDb=null, fbDocRef=null, fbUnsub=null;
let cloudReady=false, remoteLoaded=false, saveTimer=null, applyingRemote=false;
const defaultData={manager:'Turgut Yiğit',apartments:[],payments:[],expenses:[],fundIncomes:[]};
let data=load();
function load(){try{return JSON.parse(localStorage.getItem(KEY))||structuredClone(defaultData)}catch(e){return structuredClone(defaultData)}}
function save(){
  localStorage.setItem(KEY, JSON.stringify(data));
  if (cloudReady && remoteLoaded && fbDocRef && !applyingRemote) {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      fbDocRef.set({...data, updatedAt: firebase.firestore.FieldValue.serverTimestamp()}, {merge:true})
        .catch(err => console.error('Firebase kayıt hatası:', err));
    }, 350);
  }
}
function money(n){return '₺ '+Number(n||0).toLocaleString('tr-TR')}
function apt(id){return data.apartments.find(a=>a.id==id)||{floor:'-',no:'-',name:'-'}}
function totalPaid(){return data.payments.filter(p=>p.paid).reduce((t,p)=>t+Number(p.amount||0),0)}
function totalDebt(){return data.payments.filter(p=>!p.paid).reduce((t,p)=>t+Number(p.amount||0),0)}
function totalExpenses(){return data.expenses.reduce((t,e)=>t+Number(e.amount||0),0)}
function totalFundIncome(){return data.fundIncomes.reduce((t,i)=>t+Number(i.amount||0),0)}
function totalIncome(){return totalPaid()+totalFundIncome()}
function balance(){return totalIncome()-totalExpenses()}
function debtMonths(apartmentId){return data.payments.filter(p=>p.apartmentId==apartmentId&&!p.paid&&p.type==='Aidat').length}
function trDate(d){return d?new Date(d+'T00:00:00').toLocaleDateString('tr-TR'):''}
function setText(id,val){const el=document.getElementById(id); if(el) el.textContent=val}
function setHTML(id,val){const el=document.getElementById(id); if(el) el.innerHTML=val}
function showPage(id){document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active',p.id===id));document.querySelectorAll('[data-page]').forEach(b=>b.classList.toggle('active',b.dataset.page===id));const titles={home:'Ana Sayfa',apartments:'Daireler',payments:'Aidat Takibi',incomes:'Ekstra Gelirler',expenses:'Giderler',fund:'Fon Yönetimi',profile:'Profil'};setText('pageTitle',titles[id]||'Ana Sayfa'); if(id==='whatsapp') renderWhatsapp(); render()}
function render(){setText('managerNameHero',data.manager);setText('managerNameProfile',data.manager);renderStats();renderRecentExpenses();renderIncomes();renderApartments();renderPayments();renderFund();renderExpenses();renderCriticalDebtors();save()}
function renderStats(){const occupied=data.apartments.length;const debtors=getDebtors().length;const stats=[['🏢','Toplam Daire',occupied,'Daire',''],['✅','Dolu Daire',occupied,'Daire',''],['👤','Kiracı Sayısı',occupied,'Kişi',''],['🔴','Borçlu Daire',debtors,'Daire','openDebtorsModal()']];setHTML('statsGrid',stats.map(s=>`<div class="stat ${s[4]?'clickable':''}" ${s[4]?`onclick="${s[4]}" title="Borçluları göster"`:''}><i>${s[0]}</i><div><span>${s[1]}</span><strong>${s[2]}</strong><small>${s[3]}</small></div></div>`).join(''));setText('monthlyIncome',money(totalPaid()));setText('fundBalance',money(balance()));setText('extraIncomeTotal',money(totalFundIncome()));setText('debtTotalHome',money(totalDebt()));setHTML('extraIncomeBreakdown',data.fundIncomes.slice(0,2).map(i=>`<b>• ${i.title}: ${money(i.amount)}</b>`).join(''))}
function expenseIcon(t){return t==='Temizlik'?'🧹':t==='Bahçe'?'🌳':t==='Bakım'?'🛠️':'⚡'}
function renderRecentExpenses(){const rows=data.expenses.slice(0,4).map(e=>`<div class="row"><i>${expenseIcon(e.type)}</i><div><b>${e.job}</b><small>${trDate(e.date)}</small></div><strong class="red-text">${money(e.amount)}</strong><button>›</button></div>`).join('');setHTML('recentExpenses',rows||'<div class="empty">Henüz gider kaydı yok.</div>')}
function renderIncomes(){const rows=data.fundIncomes.map(i=>`<div class="row"><i>💰</i><div><b>${i.title}</b><small>${trDate(i.date)} • ${i.note||''}</small></div><strong class="green-text">${money(i.amount)}</strong></div>`).join('');setHTML('homeIncomeList',rows||'<div class="empty">Ekstra gelir yok.</div>');setHTML('incomeList',rows||'<div class="empty">Ekstra gelir yok.</div>')}
function renderApartments(){const q=(document.getElementById('searchApt')?.value||'').toLowerCase();const rows=data.apartments.filter(a=>(a.no+a.name+a.phone+a.floor).toLowerCase().includes(q)).map(a=>{const debt=data.payments.filter(p=>p.apartmentId===a.id&&!p.paid).reduce((t,p)=>t+p.amount,0);const months=debtMonths(a.id);return `<div class="card apt-card ${debt?'debt':''}" onclick="openApartmentForm(${a.id})"><h3>${a.floor}. Kat - Daire ${a.no}</h3><p>${a.name}</p><small>${a.phone}</small><div class="car-tags">${a.vehicles.map(v=>`<span>${v}</span>`).join('')||'<span>Araç yok</span>'}</div><div class="apt-bottom"><b>${debt?money(debt):'Borç Yok'}</b><em>${months?months+' Aylık Aidat Borcu':'Ödendi'}</em></div></div>`}).join('');setHTML('apartmentList',rows||'<div class="card empty">Henüz daire kaydı yok. + Daire butonundan ilk kaydı oluşturun.</div>')}
function renderPayments(){const all=data.payments;const paid=all.filter(p=>p.paid);const unpaid=all.filter(p=>!p.paid);const paidSum=paid.reduce((t,p)=>t+p.amount,0);const target=all.reduce((t,p)=>t+p.amount,0);const pct=target?Math.round(paidSum/target*100):0;const month=new Date().toLocaleDateString('tr-TR',{month:'long',year:'numeric'});['aidatMonthTitle','aidatMonthTitleHome'].forEach(id=>setText(id,month));['aidatPaidAmount','aidatPaidAmountHome'].forEach(id=>setText(id,money(paidSum)));['aidatTargetAmount','aidatTargetAmountHome'].forEach(id=>setText(id,money(target)));['aidatPercent','aidatPercentHome'].forEach(id=>setText(id,'%'+pct));['aidatProgress','aidatProgressHome'].forEach(id=>{const el=document.getElementById(id); if(el) el.style.width=pct+'%'});setText('tabAllCount','('+all.length+')');setText('tabPaidCount','('+paid.length+')');setText('tabUnpaidCount','('+unpaid.length+')');document.querySelectorAll('.aidat-tabs button').forEach(b=>b.classList.toggle('active',b.dataset.filter===paymentFilter));let list=all.filter(p=>paymentFilter==='all'||(paymentFilter==='paid'?p.paid:!p.paid));setHTML('paymentList',list.map(p=>{const a=apt(p.apartmentId);return `<div class="aidat-item ${p.paid?'is-paid':'is-unpaid'}"><div class="aidat-info"><h3>${a.floor}. Kat - Daire ${a.no}</h3><p>${a.name}</p><strong>${p.type} • ${money(p.amount)}</strong><small>${p.month}</small></div><div class="aidat-state"><span>${p.paid?'Ödendi':'Ödenmedi'}</span><small>${p.paid?'Ödeme: '+trDate(p.date):'Bekliyor'}</small><button onclick="togglePayment(${p.id})">›</button></div></div>`}).join('')||'<div class="card">Bu sekmede kayıt yok.</div>')}
function setPaymentFilter(f){paymentFilter=f;renderPayments()}
function renderFund(){const summary=[['Toplanan Aidatlar',totalPaid(),'green'],['Ekstra Gelirler',totalFundIncome(),'blue'],['Toplam Giderler',totalExpenses(),'red'],['Kalan Fon',balance(),'navy']];setHTML('fundSummary',summary.map(i=>`<div class="fund-box ${i[2]}"><span>${i[0]}</span><strong>${money(i[1])}</strong></div>`).join(''));renderFinanceHome();drawFundDonut('fundPageDonut','fundPageDonutTotal','fundPageLegend')}

function renderFinanceHome(){
  const aid=totalPaid(), ext=totalFundIncome(), exp=totalExpenses(), bal=Math.max(0,balance());
  setText('financeAidatTotal', money(aid));
  setText('financeExtraTotal', money(ext));
  setText('financeExpenseTotal', money(exp));
  setText('financeBalanceTotal', money(bal));
  const total=aid+ext+exp+bal;
  const parts=[['Aidatlar',aid,'#22c55e'],['Reklam / Bağış',ext,'#0b63ce'],['Giderler',exp,'#ef233c'],['Kalan Fon',bal,'#7c3aed']];
  drawDonut('financeHomeDonut','financeHomeTotal','financeHomeLegend',parts,total,'Toplam Fon');
}
function getDebtors(){
  return data.apartments.map(a=>{
    const unpaid=data.payments.filter(p=>p.apartmentId===a.id&&!p.paid);
    const debt=unpaid.reduce((t,p)=>t+Number(p.amount||0),0);
    const months=debtMonths(a.id);
    return {a,unpaid,debt,months};
  }).filter(x=>x.debt>0).sort((a,b)=>b.debt-a.debt);
}
function openDebtorsModal(){
  const rows=getDebtors();
  const total=rows.reduce((t,x)=>t+x.debt,0);
  const html=rows.length?`<div class="debtor-summary"><span>Toplam Borçlu Daire</span><strong>${rows.length}</strong><span>Toplam Borç</span><strong>${money(total)}</strong></div>` + rows.map(x=>`<div class="debtor-detail"><div><h3>${x.a.floor}. Kat - Daire ${x.a.no}</h3><p>${x.a.name}</p><small>${x.a.phone||'-'}</small></div><div class="debtor-amount"><b>${money(x.debt)}</b><em>${x.months||x.unpaid.length} Ay / Kalem Borç</em></div><ul>${x.unpaid.map(p=>`<li><span>${p.type} - ${p.month||'Açıklama yok'}</span><b>${money(p.amount)}</b></li>`).join('')}</ul></div>`).join(''):'<div class="empty">Borçlu daire yok.</div>';
  showModal('Borçlu Daireler Listesi', html);
}
function renderCriticalDebtors(){
  const rows=getDebtors().slice(0,4);
  setHTML('criticalDebtors', rows.map(x=>`<div class="debtor-row" onclick="openDebtorsModal()"><i>🔴</i><div><b>Daire ${x.a.no} - ${x.a.name}</b><small>${x.months||x.unpaid.length} Ay / Kalem Borç</small></div><strong>${money(x.debt)}</strong></div>`).join('') || '<div class="empty">Borçlu daire yok.</div>');
}

function drawFundDonut(donutId,totalId,legendId){const aid=totalPaid(), ext=totalFundIncome(), exp=totalExpenses(), bal=Math.max(0,balance());const total=aid+ext+exp+bal;const parts=[['Aidatlar',aid,'#22c55e'],['Ekstra Gelirler',ext,'#0b63ce'],['Giderler',exp,'#ef233c'],['Kalan Fon',bal,'#7c3aed']];drawDonut(donutId,totalId,legendId,parts,total,'Toplam Gelir')}
function renderExpenses(){const by={};data.expenses.forEach(e=>by[e.type]=(by[e.type]||0)+Number(e.amount||0));const parts=Object.entries(by).map(([k,v],idx)=>[k,v,['#2563eb','#22c55e','#f59e0b','#7c3aed','#ef4444'][idx%5]]);drawDonut('expenseDonut','expenseDonutTotal','expenseLegend',parts,totalExpenses(),'Toplam Gider');drawDonut('expenseDonutSmall','expenseDonutSmallTotal','expenseLegendSmall',parts,totalExpenses(),'Toplam Gider');setHTML('expenseList',data.expenses.map(e=>`<div class="card expense-card"><h3>${expenseIcon(e.type)} ${e.job}</h3><p>${e.person}</p><small>${trDate(e.date)} • ${e.note||''}</small><strong>${money(e.amount)}</strong></div>`).join('')||'<div class="card empty">Henüz gider kaydı yok.</div>')}
function drawDonut(donutId,totalId,legendId,parts,total,label){const d=document.getElementById(donutId); if(!d) return; let start=0;const seg=parts.map(([k,v,c])=>{const deg=total?Number(v)/total*360:0;const s=`${c} ${start}deg ${start+deg}deg`;start+=deg;return s}).join(',');d.style.background=`conic-gradient(${seg||'#e5e7eb 0 360deg'})`;setHTML(totalId,`${money(total)}<br><small>${label}</small>`);setHTML(legendId,parts.map(([k,v,c])=>`<p><i style="background:${c}"></i>${k}<b>${money(v)}</b></p>`).join(''))}
function togglePayment(id){const p=data.payments.find(x=>x.id===id);p.paid=!p.paid;p.date=p.paid?new Date().toISOString().slice(0,10):'';render()}
function openWhatsapp(type='gider'){showPage('whatsapp');document.getElementById('waType').value=type;renderWhatsapp()}
function makeMsg(){const type=document.getElementById('waType')?.value||'gider';
if(type==='gider'){return `🏢 EMFE 3 APARTMANI

Değerli sakinlerimiz,

Aşağıda son yapılan giderler bilgilerinize sunulmuştur.

${data.expenses.slice(0,5).map(e=>`${expenseIcon(e.type)} ${e.job}
📅 ${trDate(e.date)}
💰 ${money(e.amount)}`).join('\n\n')}

📢 Bilgilerinize sunarız.

👨‍💼 Apartman Yönetimi
EMFE 3 Apartmanı`}
if(type==='aidat'){const debtors=data.apartments.filter(a=>data.payments.some(p=>p.apartmentId===a.id&&!p.paid));return `🏢 EMFE 3 APARTMANI

🔔 Aidat Hatırlatma

Değerli sakinlerimiz,

Aidat ödemesi bekleyen dairelerimizin ödemelerini yapmalarını rica ederiz.

📊 Borçlu Daire Sayısı: ${debtors.length}
💰 Toplam Borç: ${money(totalDebt())}

👨‍💼 Apartman Yönetimi`}
if(type==='ozet'){return `🏢 EMFE 3 APARTMANI

📊 Aylık Fon Özeti

💳 Toplanan Aidatlar: ${money(totalPaid())}
💰 Ekstra Gelirler: ${money(totalFundIncome())}
📉 Toplam Giderler: ${money(totalExpenses())}
🏦 Kalan Fon: ${money(balance())}

👨‍💼 Apartman Yönetimi`}
return `🏢 EMFE 3 APARTMANI

📢 Genel Duyuru

Değerli sakinlerimiz,

Bilgilendirme mesajıdır.

👨‍💼 Apartman Yönetimi`}
function renderWhatsapp(){setText('waPreview',makeMsg())}
function shareWhatsapp(){window.open('https://wa.me/?text='+encodeURIComponent(makeMsg()),'_blank')}
async function copyWhatsapp(){await navigator.clipboard.writeText(makeMsg());alert('Mesaj kopyalandı')}
function openPaymentForm(){if(!data.apartments.length){alert('Önce daire kaydı ekleyin.');return;}const opts=data.apartments.map(a=>`<option value="${a.id}">${a.floor}. Kat - Daire ${a.no} - ${a.name}</option>`).join('');showModal('Ödeme Ekle',`<select id="pApt">${opts}</select><select id="pType"><option>Aidat</option><option>İnternet</option><option>Ortak Gider</option><option>Diğer</option></select><input id="pMonth" placeholder="Ay / Açıklama" value="Haziran 2026"><input id="pAmount" type="number" placeholder="Tutar"><select id="pPaid"><option value="false">Bekliyor</option><option value="true">Tahsil Edildi</option></select><button class="save" onclick="savePayment()">Kaydet</button>`)}
function savePayment(){data.payments.push({id:Date.now(),apartmentId:+pApt.value,type:pType.value,amount:+pAmount.value||0,month:pMonth.value,paid:pPaid.value==='true',date:pPaid.value==='true'?new Date().toISOString().slice(0,10):''});closeModal();render()}
function openExpenseForm(){showModal('Gider Ekle',`<select id="eType"><option>Temizlik</option><option>Bahçe</option><option>Bakım</option><option>Diğer</option></select><input id="eJob" placeholder="Yapılan İş"><input id="ePerson" placeholder="Firma / Kişi"><input id="eAmount" type="number" placeholder="Tutar"><input id="eDate" type="date" value="${new Date().toISOString().slice(0,10)}"><textarea id="eNote" placeholder="Açıklama"></textarea><button class="save" onclick="saveExpense()">Kaydet</button>`)}
function saveExpense(){data.expenses.unshift({id:Date.now(),type:eType.value,job:eJob.value,person:ePerson.value,amount:+eAmount.value||0,date:eDate.value,note:eNote.value});closeModal();render()}
function openFundIncomeForm(){showModal('Ekstra Gelir Ekle',`<select id="fTitle"><option>Reklam Geliri</option><option>Bağış Geliri</option><option>Kira Geliri</option><option>Sponsorluk</option><option>Diğer</option></select><input id="fAmount" type="number" placeholder="Tutar"><input id="fDate" type="date" value="${new Date().toISOString().slice(0,10)}"><textarea id="fNote" placeholder="Açıklama"></textarea><button class="save" onclick="saveFundIncome()">Kaydet</button>`)}
function saveFundIncome(){data.fundIncomes.unshift({id:Date.now(),title:fTitle.value,amount:+fAmount.value||0,date:fDate.value,note:fNote.value});closeModal();render()}
function openApartmentForm(id=null){const a=id?data.apartments.find(x=>x.id===id):{id:null,floor:'',no:'',name:'',phone:'',vehicles:[]};showModal(id?'Daire Düzenle':'Daire Ekle',`<input id="aFloor" placeholder="Kat" value="${a.floor}"><input id="aNo" placeholder="Daire No" value="${a.no}"><input id="aName" placeholder="İsim Soyisim" value="${a.name}"><input id="aPhone" placeholder="Telefon" value="${a.phone}"><textarea id="aVehicles" placeholder="Araçlar - her satıra bir plaka">${a.vehicles.join('\n')}</textarea><button class="save" onclick="saveApartment(${id||'null'})">Kaydet</button>`)}
function saveApartment(id){const obj={id:id||Date.now(),floor:aFloor.value,no:aNo.value,name:aName.value,phone:aPhone.value,vehicles:aVehicles.value.split('\n').map(x=>x.trim()).filter(Boolean)};if(id){data.apartments[data.apartments.findIndex(a=>a.id===id)]=obj}else data.apartments.push(obj);closeModal();render()}
function showModal(t,h){modalTitle.textContent=t;modalBody.innerHTML=h;modal.classList.remove('hidden')}
function closeModal(){modal.classList.add('hidden')}
function backupData(){const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='emfe3-yedek.json';a.click()}
function restoreData(e){const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{data=JSON.parse(r.result);render()};r.readAsText(f)}
function resetData(){if(confirm('Demo verilere dönülsün mü?')){localStorage.removeItem(KEY);data=structuredClone(defaultData);render()}}

function showLogin(message=''){
  const login=document.getElementById('loginScreen');
  const layout=document.querySelector('.layout');
  if(login) login.style.display='grid';
  if(layout) layout.style.display='none';
  setText('loginError', message);
}
function showApp(){
  const login=document.getElementById('loginScreen');
  const layout=document.querySelector('.layout');
  if(login) login.style.display='none';
  if(layout) layout.style.display='grid';
}
async function loginAdmin(){
  const email=document.getElementById('loginEmail')?.value.trim();
  const password=document.getElementById('loginPassword')?.value;
  setText('loginError','');
  if(!fbAuth){ setText('loginError','Firebase bağlantısı yüklenemedi.'); return; }
  try{ await fbAuth.signInWithEmailAndPassword(email,password); }
  catch(err){ setText('loginError','Giriş başarısız: e-posta veya şifreyi kontrol edin.'); console.error(err); }
}
async function logoutAdmin(){ if(fbAuth) await fbAuth.signOut(); }
function startCloudSync(user){
  cloudReady=true; remoteLoaded=false;
  fbDocRef=fbDb.collection('smartApartData').doc('emfe3-main');
  if(fbUnsub) fbUnsub();
  fbUnsub=fbDocRef.onSnapshot(async snap=>{
    applyingRemote=true;
    if(snap.exists){
      const remote=snap.data() || {};
      data={...structuredClone(defaultData), ...remote};
      delete data.updatedAt;
      localStorage.setItem(KEY, JSON.stringify(data));
    } else {
      await fbDocRef.set({...data, createdAt: firebase.firestore.FieldValue.serverTimestamp(), owner:user.email}, {merge:true});
    }
    remoteLoaded=true; applyingRemote=false; showApp(); render();
  }, err=>{ console.error(err); showLogin('Firestore bağlantısı başarısız. Kuralları ve interneti kontrol edin.'); });
}
function initFirebaseApp(){
  try{
    if(typeof firebase==='undefined') throw new Error('Firebase SDK bulunamadı');
    fbApp=firebase.initializeApp(firebaseConfig);
    fbAuth=firebase.auth();
    fbDb=firebase.firestore();
    fbAuth.onAuthStateChanged(user=>{
      if(user){ startCloudSync(user); }
      else { cloudReady=false; remoteLoaded=false; if(fbUnsub) fbUnsub(); showLogin(); }
    });
  }catch(err){ console.error(err); showLogin('Firebase başlatılamadı.'); }
}
function registerServiceWorker(){
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try{
        const reg = await navigator.serviceWorker.register('./service-worker.js');
        reg.update();
        navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload());
        setInterval(() => reg.update(), 60000);
      }catch(e){ console.warn('Service worker kurulamadı', e); }
    });
  }
}
function initApp(){
  showLogin('');
  initFirebaseApp();
  registerServiceWorker();
}
initApp();
