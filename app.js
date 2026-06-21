const STORAGE_KEY='emfe3_smartapart_v3';
let paymentRange='this';
const defaultData={
  apartment:{name:'EMFE 3 Apartmanı',manager:'Yönetici',phone:'0555 123 45 67',email:'emfe3@yonetici.com'},
  apartments:[
    {id:1,floor:'1',no:'1',name:'Ahmet Yılmaz',phone:'0555 111 22 33',vehicles:['33 ABC 123','33 XYZ 456']},
    {id:2,floor:'1',no:'2',name:'Mehmet Kaya',phone:'0555 222 33 44',vehicles:['07 KLM 789']},
    {id:3,floor:'2',no:'3',name:'Ayşe Kaya',phone:'0555 333 44 55',vehicles:[]}
  ],
  payments:[
    {id:1,apartmentId:1,type:'Aidat',title:'Haziran Aidatı',amount:1200,date:'2026-06-05',status:'paid'},
    {id:2,apartmentId:1,type:'İnternet',title:'Haziran İnternet',amount:350,date:'2026-06-05',status:'unpaid'},
    {id:3,apartmentId:2,type:'Aidat',title:'Haziran Aidatı',amount:1200,date:'2026-06-07',status:'unpaid'},
    {id:4,apartmentId:3,type:'Ortak Gider',title:'Ortak Gider',amount:500,date:'2026-06-08',status:'pending'}
  ]
};
let data=load();
function load(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY))||structuredClone(defaultData)}catch(e){return structuredClone(defaultData)}}
function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(data))}
function money(n){return '₺ '+Number(n||0).toLocaleString('tr-TR')}
function byId(id){return data.apartments.find(a=>a.id==id)}
function debtOf(id){return data.payments.filter(p=>p.apartmentId==id&&p.status!=='paid').reduce((t,p)=>t+Number(p.amount||0),0)}
function paidOf(id){return data.payments.filter(p=>p.apartmentId==id&&p.status==='paid').reduce((t,p)=>t+Number(p.amount||0),0)}
function monthKey(d){return (d||'').slice(0,7)}
function currentMonth(){return new Date().toISOString().slice(0,7)}
function lastMonth(){const d=new Date();d.setMonth(d.getMonth()-1);return d.toISOString().slice(0,7)}
function filteredPayments(){return data.payments.filter(p=>paymentRange==='all'||monthKey(p.date)===(paymentRange==='this'?currentMonth():lastMonth()))}
function showPage(id){document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active',p.id===id));document.querySelectorAll('.nav').forEach(n=>n.classList.toggle('active',n.dataset.page===id));render()}
function render(){save();renderHeader();renderHome();renderApartments();renderPayments();renderReports()}
function renderHeader(){document.querySelector('.title strong').textContent=data.apartment.name;document.querySelector('.profile-card h2')?.replaceChildren(document.createTextNode(data.apartment.name))}
function renderHome(){
 const totalDebt=data.payments.filter(p=>p.status!=='paid').reduce((t,p)=>t+p.amount,0), totalPaid=data.payments.filter(p=>p.status==='paid').reduce((t,p)=>t+p.amount,0), monthPaid=data.payments.filter(p=>p.status==='paid'&&monthKey(p.date)===currentMonth()).reduce((t,p)=>t+p.amount,0), monthTotal=data.payments.filter(p=>monthKey(p.date)===currentMonth()).reduce((t,p)=>t+p.amount,0), percent=monthTotal?Math.round(monthPaid/monthTotal*100):0;
 document.getElementById('monthlyCollected').textContent=money(monthPaid);document.getElementById('monthlyTarget').textContent='Toplam borç: '+money(monthTotal);document.getElementById('monthlyPercent').textContent='%'+percent;document.getElementById('progressBar').style.width=percent+'%';
 const vehicleCount=data.apartments.reduce((t,a)=>t+(a.vehicles?.length||0),0);
 document.getElementById('statsGrid').innerHTML=[['Toplam Daire',data.apartments.length],['Toplam Araç',vehicleCount],['Toplam Borç',money(totalDebt)],['Toplam Tahsilat',money(totalPaid)],['Bekleyen Ödeme',data.payments.filter(p=>p.status!=='paid').length],['Bu Ay Tahsilat',money(monthPaid)]].map(x=>`<div class="stat"><small>${x[0]}</small><b>${x[1]}</b></div>`).join('');
 document.getElementById('recentPayments').innerHTML=data.payments.slice().sort((a,b)=>b.id-a.id).slice(0,5).map(paymentCard).join('')||'<div class="card muted">Henüz ödeme kaydı yok.</div>';
}
function renderApartments(){
 const q=(document.getElementById('apartmentSearch')?.value||'').toLowerCase(), f=document.getElementById('apartmentFilter')?.value||'all';
 let list=data.apartments.filter(a=>`${a.floor} ${a.no} ${a.name} ${a.phone} ${(a.vehicles||[]).join(' ')}`.toLowerCase().includes(q));
 if(f==='debt')list=list.filter(a=>debtOf(a.id)>0); if(f==='paid')list=list.filter(a=>debtOf(a.id)===0);
 document.getElementById('apartmentList').innerHTML=list.map(a=>{const debt=debtOf(a.id);return `<div class="apartment-card ${debt?'debt':''}" onclick="openApartmentDetail(${a.id})"><div class="card-head"><div><h3>${a.floor}. Kat - Daire ${a.no}</h3><p>${a.name}</p></div><span class="badge ${debt?'debt':'paid'}">${debt?'Borçlu':'Borçsuz'}</span></div><div class="info"><div><small>Telefon</small><b>${a.phone||'-'}</b></div><div><small>Borç</small><b>${money(debt)}</b></div></div><div class="chips">${(a.vehicles||[]).length?a.vehicles.map(v=>`<span class="chip">🚗 ${v}</span>`).join(''):'<span class="chip">Araç yok</span>'}</div></div>`}).join('')||'<div class="card muted">Daire bulunamadı.</div>';
}
function setPaymentRange(r){paymentRange=r;document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active',t.dataset.range===r));renderPayments()}
function renderPayments(){document.getElementById('paymentList').innerHTML=filteredPayments().slice().sort((a,b)=>b.id-a.id).map(paymentCard).join('')||'<div class="card muted">Bu aralıkta ödeme yok.</div>'}
function paymentCard(p){const a=byId(p.apartmentId)||{};const cls=p.status==='paid'?'paid':p.status==='pending'?'wait':'debt', txt=p.status==='paid'?'Tahsil Edildi':p.status==='pending'?'Bekliyor':'Ödenmedi';return `<div class="payment-card"><div class="payment-top"><div><h3>${p.type} - ${p.title}</h3><small>${a.floor?`${a.floor}. Kat - Daire ${a.no} • `:''}${a.name||''}</small></div><span class="badge ${cls}">${txt}</span></div><div class="money-row"><span>${p.date||'-'}</span><b>${money(p.amount)}</b></div><div class="pay-actions"><button class="ok" onclick="markPayment(${p.id},'paid')">Tahsil Et</button><button class="warn" onclick="markPayment(${p.id},'pending')">Bekliyor</button><button class="delete" onclick="deletePayment(${p.id})">Sil</button></div></div>`}
function renderReports(){const totalDebt=data.payments.filter(p=>p.status!=='paid').reduce((t,p)=>t+p.amount,0), totalPaid=data.payments.filter(p=>p.status==='paid').reduce((t,p)=>t+p.amount,0);document.getElementById('reportStats').innerHTML=[['Toplam Daire',data.apartments.length],['Toplam Borç',money(totalDebt)],['Toplam Tahsilat',money(totalPaid)],['Kasa Durumu',money(totalPaid-totalDebt)]].map(x=>`<div class="stat"><small>${x[0]}</small><b>${x[1]}</b></div>`).join('')}
function closeModal(){document.getElementById('modal').classList.add('hidden')}function modal(t,h){document.getElementById('modalTitle').textContent=t;document.getElementById('modalBody').innerHTML=h;document.getElementById('modal').classList.remove('hidden')}
function openApartmentForm(id=null){const a=id?byId(id):{floor:'',no:'',name:'',phone:'',vehicles:[]};modal(id?'Daire Düzenle':'Yeni Daire',`<input id="fFloor" placeholder="Kat No" value="${a.floor||''}"><input id="fNo" placeholder="Daire No" value="${a.no||''}"><input id="fName" placeholder="İsim Soyisim" value="${a.name||''}"><input id="fPhone" placeholder="Telefon" value="${a.phone||''}"><textarea id="fVehicles" placeholder="Araç plakaları - her satıra bir araç">${(a.vehicles||[]).join('\n')}</textarea><div class="form-actions">${id?`<button class="danger-btn" onclick="deleteApartment(${id})">Sil</button>`:''}<button class="save" onclick="saveApartment(${id||'null'})">Kaydet</button></div>`)}
function saveApartment(id){const obj={id:id||Date.now(),floor:fFloor.value,no:fNo.value,name:fName.value,phone:fPhone.value,vehicles:fVehicles.value.split('\n').map(x=>x.trim().toUpperCase()).filter(Boolean)};if(id){data.apartments[data.apartments.findIndex(a=>a.id==id)]=obj}else data.apartments.push(obj);closeModal();render()}
function deleteApartment(id){if(confirm('Daire ve ona ait ödemeler silinsin mi?')){data.apartments=data.apartments.filter(a=>a.id!=id);data.payments=data.payments.filter(p=>p.apartmentId!=id);closeModal();render()}}
function openApartmentDetail(id){const a=byId(id);const pays=data.payments.filter(p=>p.apartmentId==id);modal(`${a.floor}. Kat - Daire ${a.no}`,`<p class="muted"><b>${a.name}</b><br>${a.phone||''}</p><div class="chips">${(a.vehicles||[]).map(v=>`<span class="chip">🚗 ${v}</span>`).join('')||'<span class="chip">Araç yok</span>'}</div><br><button class="primary" onclick="openPaymentForm(${id})">Bu Daireye Borç Ekle</button><br><br>${pays.map(paymentCard).join('')||'<p class="muted">Ödeme kaydı yok.</p>'}<br><button class="primary" onclick="openApartmentForm(${id})">Daireyi Düzenle</button>`)}
function openPaymentForm(apartmentId=null){const opts=data.apartments.map(a=>`<option value="${a.id}" ${apartmentId==a.id?'selected':''}>${a.floor}. Kat - Daire ${a.no} - ${a.name}</option>`).join('');modal('Ödeme / Borç Ekle',`<select id="pApartment">${opts}</select><select id="pType"><option>Aidat</option><option>İnternet</option><option>Ortak Gider</option><option>Diğer</option></select><input id="pTitle" placeholder="Açıklama: Haziran Aidatı"><input id="pAmount" type="number" placeholder="Tutar"><input id="pDate" type="date" value="${new Date().toISOString().slice(0,10)}"><select id="pStatus"><option value="unpaid">Ödenmedi</option><option value="paid">Tahsil Edildi</option><option value="pending">Bekliyor</option></select><div class="form-actions"><button class="save" onclick="savePayment()">Kaydet</button></div>`)}
function savePayment(){data.payments.push({id:Date.now(),apartmentId:Number(pApartment.value),type:pType.value,title:pTitle.value||pType.value,amount:Number(pAmount.value||0),date:pDate.value,status:pStatus.value});closeModal();render()}
function markPayment(id,status){const p=data.payments.find(x=>x.id==id);if(p){p.status=status;render()}}function deletePayment(id){if(confirm('Ödeme kaydı silinsin mi?')){data.payments=data.payments.filter(p=>p.id!=id);render()}}
function openSettings(){modal('Apartman Bilgileri',`<input id="sName" value="${data.apartment.name}" placeholder="Apartman adı"><input id="sManager" value="${data.apartment.manager}" placeholder="Yönetici adı"><input id="sPhone" value="${data.apartment.phone}" placeholder="Telefon"><input id="sEmail" value="${data.apartment.email}" placeholder="E-posta"><button class="primary" onclick="saveSettings()">Kaydet</button>`)}
function openManager(){openSettings()}function saveSettings(){data.apartment={name:sName.value,manager:sManager.value,phone:sPhone.value,email:sEmail.value};closeModal();render()}
function exportBackup(){const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='emfe3-yedek.json';a.click()}
function importBackup(e){const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{data=JSON.parse(r.result);save();render();alert('Yedek yüklendi.')}catch(err){alert('Yedek dosyası okunamadı.')}};r.readAsText(f)}
function resetDemo(){if(confirm('Tüm veriler sıfırlansın mı?')){localStorage.removeItem(STORAGE_KEY);data=structuredClone(defaultData);render()}}
if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js'))}
render();
