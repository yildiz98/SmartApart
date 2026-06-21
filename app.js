const STORAGE_KEY = 'smartapart_v1_data';
const ROLE_KEY = 'smartapart_v1_role';
const defaultData = {
  role: 'admin', currentApartmentId: 1,
  apartments: [
    {id:1,no:'1',owner:'Ahmet Yılmaz',tenant:'Ali Demir',phone:'0533 111 22 33',occupied:true,due:1200,status:'paid'},
    {id:2,no:'2',owner:'Mehmet Kaya',tenant:'',phone:'0542 222 33 44',occupied:true,due:1200,status:'unpaid'},
    {id:3,no:'3',owner:'Ayşe Çelik',tenant:'Zeynep Arslan',phone:'0532 333 44 55',occupied:true,due:1200,status:'pending'},
    {id:4,no:'4',owner:'Fatma Şahin',tenant:'',phone:'',occupied:false,due:1200,status:'unpaid'}
  ],
  vehicles: [
    {id:1,apartmentId:1,plate:'33 ABC 123',brand:'Toyota',model:'Corolla',parking:'A-1'},
    {id:2,apartmentId:1,plate:'33 XYZ 456',brand:'Honda',model:'Civic',parking:'A-2'},
    {id:3,apartmentId:2,plate:'07 KLM 789',brand:'Renault',model:'Clio',parking:'B-1'}
  ]
};
let data = loadData();
function loadData(){ const saved=localStorage.getItem(STORAGE_KEY); return saved?JSON.parse(saved):structuredClone(defaultData); }
function saveData(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
function money(n){ return '₺' + Number(n||0).toLocaleString('tr-TR'); }
function statusText(s){ return s==='paid'?'Ödendi':s==='unpaid'?'Ödenmedi':'Bekliyor'; }
function statusClass(s){ return s==='paid'?'paid':s==='unpaid'?'unpaid':'pending'; }
function statusIcon(s){ return s==='paid'?'🟢':s==='unpaid'?'🔴':'⚠️'; }
function visibleApartments(){ return data.role==='admin'?data.apartments:data.apartments.filter(a=>a.id===data.currentApartmentId); }
function visibleVehicles(){ const ids=visibleApartments().map(a=>a.id); return data.vehicles.filter(v=>ids.includes(v.apartmentId)); }
function render(){
  document.getElementById('activeRoleText').textContent = data.role==='admin'?'Yönetici':'Daire Sakini';
  document.querySelectorAll('.admin-only').forEach(el=>el.style.display=data.role==='admin'?'inline-flex':'none');
  fillResidentSelect(); renderStats(); renderApartments(); renderDues(); renderVehicles(); saveData();
}
function renderStats(){
  const ap = visibleApartments();
  const paid = ap.filter(a=>a.status==='paid').reduce((t,a)=>t+Number(a.due||0),0);
  const unpaid = ap.filter(a=>a.status!=='paid').reduce((t,a)=>t+Number(a.due||0),0);
  const stats=[['🏢','Toplam Daire',ap.length],['✅','Dolu Daire',ap.filter(a=>a.occupied).length],['🏠','Boş Daire',ap.filter(a=>!a.occupied).length],['🟢','Toplanan Aidat',money(paid)],['🔴','Ödenmeyen Aidat',money(unpaid)],['🚗','Kayıtlı Araç',visibleVehicles().length]];
  document.getElementById('statsGrid').innerHTML=stats.map(s=>`<div class="stat"><div class="emoji">${s[0]}</div><small>${s[1]}</small><strong>${s[2]}</strong></div>`).join('');
  document.getElementById('kasaDurumu').textContent=money(paid-unpaid);
}
function renderApartments(){
  document.getElementById('apartmentList').innerHTML = visibleApartments().map(a=>{
    const cars=data.vehicles.filter(v=>v.apartmentId===a.id);
    return `<div class="apartment-card" onclick="${data.role==='admin'?`openApartmentForm(${a.id})`:''}">
      <h3>👤 Daire ${a.no}</h3>
      <div class="info-row"><span>Malik</span><b>${a.owner||'-'}</b></div>
      <div class="info-row"><span>Kiracı</span><b>${a.tenant||'Boş / Yok'}</b></div>
      <div class="info-row"><span>Telefon</span><b>${a.phone||'-'}</b></div>
      <div class="info-row"><span>Aidat</span><b>${money(a.due)}</b></div>
      <div class="info-row"><span>Durum</span><span class="status ${statusClass(a.status)}">${statusIcon(a.status)} ${statusText(a.status)}</span></div>
      <div class="chips">${cars.length?cars.map(c=>`<span class="chip">${c.plate}</span>`).join(''):'<span class="chip">Araç yok</span>'}</div>
    </div>`;
  }).join('');
}
function renderDues(){
  document.getElementById('duesTable').innerHTML = visibleApartments().map(a=>`<tr>
    <td>${a.no}</td><td>${a.owner}</td>
    <td>${data.role==='admin'?`<input class="amount-input" type="number" value="${a.due}" onchange="updateDue(${a.id},this.value)">`:money(a.due)}</td>
    <td>${data.role==='admin'?`<select class="table-status" onchange="updateStatus(${a.id},this.value)"><option value="paid" ${a.status==='paid'?'selected':''}>🟢 Ödendi</option><option value="unpaid" ${a.status==='unpaid'?'selected':''}>🔴 Ödenmedi</option><option value="pending" ${a.status==='pending'?'selected':''}>⚠️ Bekliyor</option></select>`:`<span class="status ${statusClass(a.status)}">${statusIcon(a.status)} ${statusText(a.status)}</span>`}</td>
  </tr>`).join('');
}
function renderVehicles(){
  const apMap=Object.fromEntries(data.apartments.map(a=>[a.id,a]));
  document.getElementById('vehicleList').innerHTML = visibleVehicles().map(v=>`<div class="vehicle-card" onclick="${data.role==='admin'?`openVehicleForm(${v.id})`:''}">
    <h3>🚗 ${v.plate}</h3>
    <div class="info-row"><span>Daire</span><b>${apMap[v.apartmentId]?.no||'-'}</b></div>
    <div class="info-row"><span>Marka / Model</span><b>${v.brand||'-'} ${v.model||''}</b></div>
    <div class="info-row"><span>Park Yeri</span><b>${v.parking||'-'}</b></div>
  </div>`).join('') || '<div class="card">Kayıtlı araç yok.</div>';
}
function updateDue(id,val){ const a=data.apartments.find(x=>x.id===id); a.due=Number(val||0); render(); }
function updateStatus(id,val){ const a=data.apartments.find(x=>x.id===id); a.status=val; render(); }
function fillResidentSelect(){
  const s=document.getElementById('residentSelect');
  s.innerHTML=data.apartments.map(a=>`<option value="${a.id}">Daire ${a.no} - ${a.owner}</option>`).join('');
  s.value=data.currentApartmentId;
}
function openLogin(){ document.getElementById('loginView').classList.remove('hidden'); document.querySelectorAll('.page').forEach(p=>p.classList.remove('active')); }
function loginAsAdmin(){ data.role='admin'; document.getElementById('loginView').classList.add('hidden'); showPage('dashboardView'); render(); }
function loginAsResident(){ data.role='resident'; data.currentApartmentId=Number(document.getElementById('residentSelect').value); document.getElementById('loginView').classList.add('hidden'); showPage('dashboardView'); render(); }
function showPage(id){ document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active',p.id===id)); document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.page===id)); }
document.querySelectorAll('.nav-btn').forEach(btn=>btn.addEventListener('click',()=>{document.getElementById('loginView').classList.add('hidden');showPage(btn.dataset.page)}));
function closeModal(){ document.getElementById('modal').classList.add('hidden'); }
function showModal(title,html){ document.getElementById('modalTitle').textContent=title; document.getElementById('modalBody').innerHTML=html; document.getElementById('modal').classList.remove('hidden'); }
function openApartmentForm(id=null){
  const a=id?data.apartments.find(x=>x.id===id):{id:null,no:'',owner:'',tenant:'',phone:'',occupied:true,due:1200,status:'unpaid'};
  showModal(id?'Daire Düzenle':'Yeni Daire', `<input id="fNo" placeholder="Daire No" value="${a.no}"><input id="fOwner" placeholder="Malik" value="${a.owner}"><input id="fTenant" placeholder="Kiracı" value="${a.tenant}"><input id="fPhone" placeholder="Telefon" value="${a.phone}"><input id="fDue" type="number" placeholder="Aidat" value="${a.due}"><select id="fStatus"><option value="paid" ${a.status==='paid'?'selected':''}>🟢 Ödendi</option><option value="unpaid" ${a.status==='unpaid'?'selected':''}>🔴 Ödenmedi</option><option value="pending" ${a.status==='pending'?'selected':''}>⚠️ Bekliyor</option></select><select id="fOcc"><option value="true" ${a.occupied?'selected':''}>Dolu</option><option value="false" ${!a.occupied?'selected':''}>Boş</option></select><div class="form-actions">${id?`<button class="danger-btn" onclick="deleteApartment(${id})">Sil</button>`:''}<button class="save-btn" onclick="saveApartment(${id||'null'})">Kaydet</button></div>`);
}
function saveApartment(id){
  const obj={id:id||Date.now(),no:fNo.value,owner:fOwner.value,tenant:fTenant.value,phone:fPhone.value,occupied:fOcc.value==='true',due:Number(fDue.value||0),status:fStatus.value};
  if(id){ const i=data.apartments.findIndex(x=>x.id===id); data.apartments[i]=obj; } else data.apartments.push(obj);
  closeModal(); render();
}
function deleteApartment(id){ if(confirm('Bu daire ve araçları silinsin mi?')){ data.apartments=data.apartments.filter(a=>a.id!==id); data.vehicles=data.vehicles.filter(v=>v.apartmentId!==id); closeModal(); render(); }}
function openVehicleForm(id=null){
 const v=id?data.vehicles.find(x=>x.id===id):{id:null,apartmentId:data.apartments[0]?.id,plate:'',brand:'',model:'',parking:''};
 const options=data.apartments.map(a=>`<option value="${a.id}" ${v.apartmentId===a.id?'selected':''}>Daire ${a.no} - ${a.owner}</option>`).join('');
 showModal(id?'Araç Düzenle':'Yeni Araç', `<select id="vApartment">${options}</select><input id="vPlate" placeholder="Plaka" value="${v.plate}"><input id="vBrand" placeholder="Marka" value="${v.brand}"><input id="vModel" placeholder="Model" value="${v.model}"><input id="vParking" placeholder="Park Yeri" value="${v.parking}"><div class="form-actions">${id?`<button class="danger-btn" onclick="deleteVehicle(${id})">Sil</button>`:''}<button class="save-btn" onclick="saveVehicle(${id||'null'})">Kaydet</button></div>`);
}
function saveVehicle(id){ const obj={id:id||Date.now(),apartmentId:Number(vApartment.value),plate:vPlate.value.toUpperCase(),brand:vBrand.value,model:vModel.value,parking:vParking.value}; if(id){ const i=data.vehicles.findIndex(x=>x.id===id); data.vehicles[i]=obj; } else data.vehicles.push(obj); closeModal(); render(); }
function deleteVehicle(id){ if(confirm('Araç silinsin mi?')){ data.vehicles=data.vehicles.filter(v=>v.id!==id); closeModal(); render(); }}
function resetMonth(){ if(confirm('Bu ay için tüm aidatlar Ödenmedi yapılsın mı?')){ data.apartments.forEach(a=>a.status='unpaid'); render(); }}
if('serviceWorker' in navigator){ window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js')); }
render();
