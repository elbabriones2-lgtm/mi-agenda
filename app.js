/* ============================================================
   Mi Agenda v2.8 — Resistente a bloqueo de Safari
   ============================================================ */

const DIAS = ['','Lunes','Martes','Miercoles','Jueves','Viernes','Sabado'];
const DIAS_CORTO = ['','Lu','Ma','Mi','Ju','Vi','Sa'];

let medicos = [];
let rutaSemanal = {};
let visitas = [];
let recordatorios = [];
let miUbicacion = null;

const CENTROS = { managua: [12.1364, -86.2514], leon: [12.4379, -86.8780] };

// ===== STORAGE CON FALLBACK =====
let storageOK = false;
try {
  localStorage.setItem('__test__', '1');
  localStorage.removeItem('__test__');
  storageOK = true;
} catch(e) {
  console.warn('localStorage bloqueado, usando memoria temporal');
}

let memStorage = {};

function lsSet(key, val) {
  if (storageOK) localStorage.setItem(key, val);
  else memStorage[key] = val;
}
function lsGet(key) {
  if (storageOK) return localStorage.getItem(key);
  return memStorage[key] || null;
}
function lsRemove(key) {
  if (storageOK) localStorage.removeItem(key);
  else delete memStorage[key];
}

function saveData() {
  try {
    lsSet('agenda_medicos', JSON.stringify(medicos));
    lsSet('agenda_ruta', JSON.stringify(rutaSemanal));
    lsSet('agenda_visitas', JSON.stringify(visitas));
    lsSet('agenda_recordatorios', JSON.stringify(recordatorios));
    lsSet('agenda_mi_ubicacion', JSON.stringify(miUbicacion));
  } catch(e) {
    showToast('Error guardando datos: ' + e.message, 'err');
  }
}

function loadData() {
  try {
    const rawMed = lsGet('agenda_medicos');
    if (rawMed) {
      medicos = JSON.parse(rawMed);
      rutaSemanal = JSON.parse(lsGet('agenda_ruta') || '{}');
      visitas = JSON.parse(lsGet('agenda_visitas') || '[]');
      recordatorios = JSON.parse(lsGet('agenda_recordatorios') || '[]');
      miUbicacion = JSON.parse(lsGet('agenda_mi_ubicacion') || 'null');
    } else {
      seedDemo();
    }
  } catch(e) {
    showToast('Error cargando datos', 'err');
    seedDemo();
  }
}

function seedDemo() {
  if (medicos.length) return;
  medicos = [
    { id:1, nombre:'Dr. Perez', codigo:'MED-001', especialidad:'Cardiologia', zona:'managua', nota:'Llegar antes de las 10am', lat:12.1350, lng:-86.2510, franjas:[
      {dias:[1,2,3,4,5], inicio:'08:00', fin:'11:00'}, {dias:[1,2,3,4,5], inicio:'14:00', fin:'17:00'}
    ]},
    { id:2, nombre:'Dra. Lopez', codigo:'MED-002', especialidad:'Ginecologia', zona:'managua', nota:'Traer Prenalin Plus', lat:12.1400, lng:-86.2450, franjas:[
      {dias:[2,4], inicio:'12:00', fin:'15:00'}
    ]},
    { id:3, nombre:'Dr. Ruiz', codigo:'MED-003', especialidad:'Medicina General', zona:'managua', nota:'No atiende sabados', lat:12.1300, lng:-86.2600, franjas:[
      {dias:[1,2,3,4,5], inicio:'08:00', fin:'16:00'}
    ]},
    { id:4, nombre:'Dr. Gomez', codigo:'MED-004', especialidad:'Neurologia', zona:'managua', nota:'Primera visita del dia', lat:12.1380, lng:-86.2480, franjas:[
      {dias:[1,3,5], inicio:'07:00', fin:'10:00'}, {dias:[2,4], inicio:'14:00', fin:'18:00'}
    ]},
    { id:5, nombre:'Dra. Castillo', codigo:'MED-005', especialidad:'Pediatria', zona:'leon', nota:'Traer muestras', lat:12.4360, lng:-86.8760, franjas:[
      {dias:[1,3,5], inicio:'08:00', fin:'12:00'}
    ]},
    { id:6, nombre:'Dr. Morales', codigo:'MED-006', especialidad:'Dermatologia', zona:'leon', nota:'Solo con cita previa', lat:12.4390, lng:-86.8800, franjas:[
      {dias:[2,4], inicio:'14:00', fin:'18:00'}
    ]},
    { id:7, nombre:'Dra. Hernandez', codigo:'MED-007', especialidad:'Cardiologia', zona:'leon', nota:'Traer ECG previo', lat:12.4340, lng:-86.8740, franjas:[
      {dias:[1,2,3,4,5], inicio:'08:00', fin:'15:00'}
    ]}
  ];
  rutaSemanal = { 1:[1,3,4,5,7], 2:[1,2,4,6,7], 3:[1,3,4,5,7], 4:[1,2,4,6,7], 5:[1,3,4,5,7], 6:[] };
}

// ===== PIN SYSTEM =====
const PIN_DEFAULT = '2288';

function getStoredPin() {
  return lsGet('agenda_pin');
}

function setPin(pin) {
  lsSet('agenda_pin', pin);
}

function isSessionActive() {
  const session = sessionStorage.getItem('agenda_session');
  if (!session) return false;
  try {
    const data = JSON.parse(session);
    return (Date.now() - data.time) < (8 * 60 * 60 * 1000);
  } catch(e) { return false; }
}

function activateSession() {
  sessionStorage.setItem('agenda_session', JSON.stringify({time: Date.now()}));
}

function clearSession() {
  sessionStorage.removeItem('agenda_session');
}

function initLogin() {
  const overlay = document.getElementById('login-overlay');
  const app = document.getElementById('app');
  const title = document.getElementById('login-title');
  const subtitle = document.getElementById('login-subtitle');
  const errorEl = document.getElementById('login-error');
  const passInput = document.getElementById('login-pass');
  const loginBtn = document.getElementById('btn-login');

  if (isSessionActive()) {
    overlay.classList.add('hidden');
    app.classList.remove('hidden');
    initApp();
    return;
  }

  if (window.location.search.includes('resetpin=1')) {
    lsRemove('agenda_pin');
    sessionStorage.removeItem('agenda_session');
    showToast('PIN reiniciado. Crea uno nuevo.', 'ok');
  }

  let storedPin = getStoredPin();
  let isFirstTime = !storedPin;

  if (isFirstTime) {
    setPin(PIN_DEFAULT);
    storedPin = PIN_DEFAULT;
    isFirstTime = false;
  }

  title.textContent = 'Acceso protegido';
  subtitle.textContent = 'Ingresa el codigo de acceso';

  overlay.classList.remove('hidden');
  app.classList.add('hidden');
  passInput.value = '';
  passInput.focus();

  let resetBtn = document.getElementById('btn-reset-pin');
  if (!resetBtn) {
    resetBtn = document.createElement('button');
    resetBtn.id = 'btn-reset-pin';
    resetBtn.textContent = 'Olvidaste tu codigo?';
    resetBtn.style.cssText = 'background:none;border:none;color:var(--primary);font-size:0.85rem;margin-top:12px;cursor:pointer;text-decoration:underline;';
    resetBtn.onclick = () => {
      if (confirm('Seguro que queres borrar el codigo y crear uno nuevo?')) {
        lsRemove('agenda_pin');
        sessionStorage.removeItem('agenda_session');
        location.reload();
      }
    };
    loginBtn.parentNode.insertBefore(resetBtn, loginBtn.nextSibling);
  }
  resetBtn.style.display = 'inline-block';

  loginBtn.onclick = () => {
    const pin = passInput.value.trim();
    if (!pin || pin.length < 3) {
      errorEl.textContent = 'El codigo debe tener al menos 3 caracteres';
      errorEl.classList.remove('hidden');
      return;
    }
    if (pin === storedPin) {
      activateSession();
      overlay.classList.add('hidden');
      app.classList.remove('hidden');
      errorEl.classList.add('hidden');
      initApp();
    } else {
      errorEl.textContent = 'Codigo incorrecto';
      errorEl.classList.remove('hidden');
      passInput.value = '';
      passInput.focus();
    }
  };

  passInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') loginBtn.click();
  });
}

// ===== CAMBIAR PIN =====
document.getElementById('btn-cambiar-pin').addEventListener('click', (e) => {
  e.preventDefault();
  document.getElementById('modal-cambiar-pin').classList.remove('hidden');
  document.getElementById('pin-actual').value = '';
  document.getElementById('pin-nuevo').value = '';
  document.getElementById('pin-confirmar').value = '';
  document.getElementById('pin-error').classList.add('hidden');
  document.getElementById('main-nav').classList.add('hidden');
  document.getElementById('nav-overlay').classList.add('hidden');
});

document.getElementById('btn-guardar-pin').addEventListener('click', () => {
  const actual = document.getElementById('pin-actual').value.trim();
  const nuevo = document.getElementById('pin-nuevo').value.trim();
  const confirmar = document.getElementById('pin-confirmar').value.trim();
  const errorEl = document.getElementById('pin-error');
  const storedPin = getStoredPin();

  if (actual !== storedPin) {
    errorEl.textContent = 'Codigo actual incorrecto';
    errorEl.classList.remove('hidden');
    return;
  }
  if (!nuevo || nuevo.length < 3) {
    errorEl.textContent = 'El codigo nuevo debe tener al menos 3 caracteres';
    errorEl.classList.remove('hidden');
    return;
  }
  if (nuevo !== confirmar) {
    errorEl.textContent = 'Los codigos nuevos no coinciden';
    errorEl.classList.remove('hidden');
    return;
  }
  setPin(nuevo);
  document.getElementById('modal-cambiar-pin').classList.add('hidden');
  showToast('Codigo cambiado correctamente', 'ok');
});

// ===== DOM HELPERS =====
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function showToast(msg, type='info') {
  const container = $('#toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast toast-' + type;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

function formatFranjas(franjas) {
  return franjas.map(f => {
    const diasStr = f.dias.map(d => DIAS_CORTO[d]).join(',');
    return diasStr + ' ' + f.inicio + '-' + f.fin;
  }).join(' | ');
}

function getMedico(id) { return medicos.find(m => m.id == id); }
function nextId(arr) { return arr.length ? Math.max(...arr.map(x=>x.id)) + 1 : 1; }

// ===== WAZE =====
function abrirWaze(lat, lng, label) {
  if (!lat || !lng) { showToast('Este medico no tiene coordenadas', 'warn'); return; }
  const appUrl = 'waze://?ll=' + lat + ',' + lng + '&navigate=yes';
  const webUrl = 'https://waze.com/ul?ll=' + lat + ',' + lng + '&navigate=yes';
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  if (isMobile) { window.location.href = appUrl; setTimeout(() => { window.location.href = webUrl; }, 800); }
  else { window.open(webUrl, '_blank'); }
}

// ===== GPS =====
function capturarGPS(callback) {
  if (!navigator.geolocation) { showToast('GPS no disponible', 'err'); return; }
  showToast('Buscando senal GPS...', 'info');
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      miUbicacion = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy, timestamp: new Date().toISOString() };
      saveData();
      showToast('GPS: ' + miUbicacion.lat.toFixed(4) + ', ' + miUbicacion.lng.toFixed(4), 'ok');
      if (callback) callback(miUbicacion);
    },
    (err) => { showToast('Error GPS: ' + (err.message || 'Permiso denegado'), 'err'); },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  );
}

$('#btn-gps').addEventListener('click', () => {
  capturarGPS(() => { $('#btn-gps').classList.add('active'); renderDashboard(); if (mapaZonas) renderMapaZonas(); });
});
$('#btn-capturar-gps').addEventListener('click', () => {
  capturarGPS((coords) => { $('#med-lat').value = coords.lat.toFixed(6); $('#med-lng').value = coords.lng.toFixed(6); });
});

// ===== NAV =====
$('#btn-menu').addEventListener('click', () => { $('#main-nav').classList.toggle('hidden'); $('#nav-overlay').classList.toggle('hidden'); });
$('#nav-overlay').addEventListener('click', () => { $('#main-nav').classList.add('hidden'); $('#nav-overlay').classList.add('hidden'); });
$$('.nav-link').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const section = link.dataset.section;
    if (!section) return;
    $$('.section').forEach(s => s.classList.remove('active'));
    $(`#${section}`).classList.add('active');
    $$('.nav-link').forEach(l => l.classList.remove('active'));
    link.classList.add('active');
    $('#main-nav').classList.add('hidden');
    $('#nav-overlay').classList.add('hidden');
    if (section === 'dashboard') renderDashboard();
    if (section === 'medicos') renderMedicos();
    if (section === 'ruta') renderRuta();
    if (section === 'visita') renderVisitaSection();
    if (section === 'mapa') renderMapaZonas();
    if (section === 'estadisticas') renderEstadisticas();
  });
});

$('#btn-cerrar-sesion').addEventListener('click', (e) => {
  e.preventDefault();
  clearSession();
  $('#login-pass').value = '';
  $('#login-overlay').classList.remove('hidden');
  $('#app').classList.add('hidden');
  $('#main-nav').classList.add('hidden');
  $('#nav-overlay').classList.add('hidden');
  showToast('Sesion cerrada. Ingresa el codigo para volver.', 'ok');
  setTimeout(initLogin, 300);
});

// ===== DASHBOARD =====
function renderDashboard() {
  const hoy = new Date().getDay();
  const diaSem = hoy === 0 ? 1 : hoy;
  const idsHoy = rutaSemanal[diaSem] || [];
  const medicosHoy = idsHoy.map(id => getMedico(id)).filter(Boolean);
  const visitasHoy = visitas.filter(v => { const d = new Date(v.fecha); return d.toDateString() === new Date().toDateString(); });
  const visitadosHoy = new Set(visitasHoy.map(v => v.medicoId));

  $('#dash-total-hoy').textContent = medicosHoy.length;
  $('#dash-visitados').textContent = visitadosHoy.size;
  $('#dash-pendientes').textContent = Math.max(0, medicosHoy.length - visitadosHoy.size);

  const ubiEl = $('#dash-mi-ubicacion');
  if (miUbicacion) {
    ubiEl.innerHTML = '<strong>📍 ' + miUbicacion.lat.toFixed(5) + ', ' + miUbicacion.lng.toFixed(5) + '</strong><br><span style="font-size:0.8rem;color:var(--text-light)">Precision: ~' + Math.round(miUbicacion.accuracy) + 'm — ' + new Date(miUbicacion.timestamp).toLocaleString('es') + '</span>';
  } else {
    ubiEl.innerHTML = 'Toca <strong>📍</strong> en el header para capturar tu ubicacion actual.';
  }

  const ahora = new Date();
  const horaStr = String(ahora.getHours()).padStart(2,'0') + ':' + String(ahora.getMinutes()).padStart(2,'0');
  let proxHTML = '';
  medicosHoy.forEach(m => {
    m.franjas.forEach(f => {
      if (!f.dias.includes(diaSem)) return;
      if (f.inicio >= horaStr) {
        proxHTML += '<div class="medico-item"><h4>' + m.nombre + ' — ' + m.especialidad + '</h4><div class="medico-meta">🕐 ' + DIAS[diaSem] + ' ' + f.inicio + '-' + f.fin + ' <span class="fr-badge">' + m.codigo + '</span></div>' + (m.lat ? '<button class="waze-btn" onclick="abrirWaze(' + m.lat + ',' + m.lng + ',\'' + m.nombre + '\')">🚗 Waze</button>' : '') + '</div>';
      }
    });
  });
  $('#dash-proximas-list').innerHTML = proxHTML || '<p class="empty-msg">No hay mas atenciones programadas para hoy.</p>';

  const recs = recordatorios.filter(r => new Date(r.fecha).toDateString() === new Date().toDateString());
  $('#dash-recordatorios-list').innerHTML = recs.length ? recs.map(r => '<div class="fr-badge">⏰ ' + r.hora + ' — ' + r.msg + '</div>').join('<br>') : '<p class="empty-msg">Sin recordatorios para hoy.</p>';
}

// ===== MEDICOS =====
function renderMedicos() {
  const container = $('#medicos-list');
  if (!medicos.length) { container.innerHTML = '<p class="empty-msg">No hay medicos registrados.</p>'; return; }
  container.innerHTML = medicos.map(m => {
    const zonaColor = m.zona === 'leon' ? '#fdebd0' : '#e6fffa';
    const zonaText = m.zona === 'leon' ? '#d35400' : '#0d7377';
    const zonaLabel = m.zona === 'leon' ? '🦁 Leon' : '🏙️ Managua';
    return '<div class="medico-item" data-id="' + m.id + '"><button class="delete-btn" onclick="eliminarMedico(' + m.id + ')">🗑</button><h4>' + m.nombre + ' <span class="fr-badge">' + m.codigo + '</span> <span class="fr-badge" style="background:' + zonaColor + ';color:' + zonaText + '">' + zonaLabel + '</span></h4><div class="medico-meta">' + m.especialidad + '</div><div class="medico-meta">🕐 ' + formatFranjas(m.franjas) + '</div>' + (m.nota ? '<div class="medico-meta">📝 ' + m.nota + '</div>' : '') + (m.lat ? '<div class="medico-meta">📍 ' + m.lat.toFixed(5) + ', ' + m.lng.toFixed(5) + '</div><button class="waze-btn" onclick="abrirWaze(' + m.lat + ',' + m.lng + ',\'' + m.nombre + '\')">🚗 Abrir en Waze</button>' : '<div class="medico-meta" style="color:var(--warning)">⚠️ Sin coordenadas para Waze</div>') + '</div>';
  }).join('');
}

window.eliminarMedico = function(id) {
  if (!confirm('Eliminar este medico?')) return;
  medicos = medicos.filter(m => m.id !== id);
  Object.keys(rutaSemanal).forEach(d => { rutaSemanal[d] = rutaSemanal[d].filter(x => x !== id); });
  saveData();
  renderMedicos();
  renderDashboard();
  showToast('Medico eliminado', 'ok');
};

$('#btn-add-medico').addEventListener('click', () => {
  $('#modal-medico').classList.remove('hidden');
  $('#med-nombre').value = ''; $('#med-codigo').value = ''; $('#med-especialidad').value = '';
  $('#med-nota').value = ''; $('#med-lat').value = ''; $('#med-lng').value = ''; $('#med-zona').value = 'managua';
  $('#franjas-container').innerHTML = createFranjaHTML(0);
});
$('.modal-close').addEventListener('click', () => $('#modal-medico').classList.add('hidden'));

function createFranjaHTML(idx) {
  return '<div class="franja-row" data-index="' + idx + '"><div class="dias-checks"><label><input type="checkbox" class="dia-check" value="1"> Lun</label><label><input type="checkbox" class="dia-check" value="2"> Mar</label><label><input type="checkbox" class="dia-check" value="3"> Mie</label><label><input type="checkbox" class="dia-check" value="4"> Jue</label><label><input type="checkbox" class="dia-check" value="5"> Vie</label><label><input type="checkbox" class="dia-check" value="6"> Sab</label></div><div class="horario-inputs"><input type="time" class="hora-inicio" value="08:00"><span>a</span><input type="time" class="hora-fin" value="11:00"></div></div>';
}

$('#btn-add-franja').addEventListener('click', () => {
  const idx = $$('.franja-row').length;
  $('#franjas-container').insertAdjacentHTML('beforeend', createFranjaHTML(idx));
});

$('#btn-guardar-medico').addEventListener('click', () => {
  const nombre = $('#med-nombre').value.trim();
  const codigo = $('#med-codigo').value.trim();
  const especialidad = $('#med-especialidad').value.trim();
  if (!nombre || !codigo) { showToast('Nombre y codigo son obligatorios', 'err'); return; }
  const franjas = [];
  $$('.franja-row').forEach(row => {
    const dias = Array.from(row.querySelectorAll('.dia-check:checked')).map(cb => parseInt(cb.value));
    const inicio = row.querySelector('.hora-inicio').value;
    const fin = row.querySelector('.hora-fin').value;
    if (dias.length && inicio && fin) franjas.push({ dias, inicio, fin });
  });
  const medico = {
    id: nextId(medicos), nombre, codigo, especialidad,
    zona: $('#med-zona').value, nota: $('#med-nota').value.trim(),
    lat: parseFloat($('#med-lat').value) || null,
    lng: parseFloat($('#med-lng').value) || null,
    franjas
  };
  medicos.push(medico);
  saveData();
  $('#modal-medico').classList.add('hidden');
  renderMedicos();
  renderDashboard();
  showToast('Medico guardado correctamente', 'ok');
});

// ===== RUTA SEMANAL =====
let currentRutaDay = 1;
function renderRuta() {
  const sel = $('#select-medico-ruta');
  sel.innerHTML = '<option value="">-- Seleccionar medico --</option>' + medicos.map(m => '<option value="' + m.id + '">' + m.nombre + ' (' + m.codigo + ') — ' + (m.zona === 'leon' ? 'Leon' : 'Managua') + '</option>').join('');
  renderRutaDia(currentRutaDay);
}
function renderRutaDia(dia) {
  currentRutaDay = dia;
  $('#ruta-dia-nombre').textContent = DIAS[dia];
  $$('.tab-btn').forEach(b => b.classList.toggle('active', parseInt(b.dataset.day) === dia));
  const ids = rutaSemanal[dia] || [];
  const container = $('#ruta-dia-list');
  if (!ids.length) { container.innerHTML = '<p class="empty-msg">Sin medicos en ruta este dia.</p>'; return; }
  container.innerHTML = ids.map(id => {
    const m = getMedico(id);
    if (!m) return '';
    const franjasHoy = m.franjas.filter(f => f.dias.includes(dia));
    const zonaLabel = m.zona === 'leon' ? '🦁 Leon' : '🏙️ Managua';
    return '<div class="ruta-item"><button class="delete-btn" onclick="quitarDeRuta(' + dia + ',' + id + ')">🗑</button><h4>' + m.nombre + ' <span class="fr-badge">' + m.codigo + '</span></h4><div class="ruta-meta">' + m.especialidad + ' — ' + zonaLabel + '</div><div class="ruta-meta">🕐 ' + franjasHoy.map(f => f.inicio + '-' + f.fin).join(' | ') + '</div>' + (m.lat ? '<button class="waze-btn" onclick="abrirWaze(' + m.lat + ',' + m.lng + ',\'' + m.nombre + '\')">🚗 Waze</button>' : '') + '</div>';
  }).join('');
}
window.quitarDeRuta = function(dia, id) {
  rutaSemanal[dia] = (rutaSemanal[dia] || []).filter(x => x !== id);
  saveData();
  renderRutaDia(dia);
  renderDashboard();
};
$$('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => renderRutaDia(parseInt(btn.dataset.day)));
});
$('#btn-add-ruta').addEventListener('click', () => {
  const id = parseInt($('#select-medico-ruta').value);
  if (!id) { showToast('Selecciona un medico', 'warn'); return; }
  if (!rutaSemanal[currentRutaDay]) rutaSemanal[currentRutaDay] = [];
  if (rutaSemanal[currentRutaDay].includes(id)) { showToast('Ya esta en la ruta', 'warn'); return; }
  rutaSemanal[currentRutaDay].push(id);
  saveData();
  renderRutaDia(currentRutaDay);
  renderDashboard();
  showToast('Agregado a la ruta', 'ok');
});

// ===== HORARIO SUGERIDO =====
function calcularHorarioSugerido() {
  const medId = parseInt($('#visita-medico').value);
  const fechaVal = $('#visita-fecha').value;
  if (!medId || !fechaVal) { showToast('Selecciona medico y fecha primero', 'warn'); return; }
  const m = getMedico(medId);
  const fecha = new Date(fechaVal + 'T00:00:00');
  const diaSem = fecha.getDay() === 0 ? 1 : fecha.getDay();
  const franjasValidas = m.franjas.filter(f => f.dias.includes(diaSem));
  if (!franjasValidas.length) {
    $('#hora-sugerida-msg').innerHTML = '⚠️ ' + m.nombre + ' no atiende ' + DIAS[diaSem];
    $('#hora-sugerida-msg').className = 'sugerencia-msg show';
    return;
  }
  const idsRuta = rutaSemanal[diaSem] || [];
  const horariosOcupados = [];
  idsRuta.forEach(id => {
    if (id === medId) return;
    const otro = getMedico(id);
    if (!otro) return;
    otro.franjas.filter(f => f.dias.includes(diaSem)).forEach(f => horariosOcupados.push({ inicio: f.inicio, fin: f.fin }));
    visitas.filter(v => v.medicoId === id && v.fecha === fechaVal).forEach(v => horariosOcupados.push({ inicio: v.hora, fin: v.hora }));
  });
  let sugerido = null;
  for (const franja of franjasValidas) {
    let [hh, mm] = franja.inicio.split(':').map(Number);
    let candidato = String(hh).padStart(2,'0') + ':' + String(mm).padStart(2,'0');
    const fin = franja.fin;
    while (candidato < fin) {
      const cMin = hh * 60 + mm;
      const choca = horariosOcupados.some(o => {
        const oStart = parseInt(o.inicio.split(':')[0]) * 60 + parseInt(o.inicio.split(':')[1]);
        const oEnd = parseInt(o.fin.split(':')[0]) * 60 + parseInt(o.fin.split(':')[1]);
        return cMin >= oStart - 30 && cMin <= oEnd + 30;
      });
      if (!choca) { sugerido = candidato; break; }
      mm += 30;
      if (mm >= 60) { mm -= 60; hh++; }
      candidato = String(hh).padStart(2,'0') + ':' + String(mm).padStart(2,'0');
    }
    if (sugerido) break;
  }
  const msgEl = $('#hora-sugerida-msg');
  if (sugerido) {
    $('#visita-hora').value = sugerido;
    msgEl.innerHTML = '✅ <strong>Horario sugerido: ' + sugerido + '</strong><br><span style="font-size:0.8rem">Sin choque con otros medicos de la ruta.</span>';
    msgEl.className = 'sugerencia-msg show';
    validarHorarioVisita();
  } else {
    msgEl.innerHTML = '⚠️ No se encontro hueco libre en las franjas de ' + m.nombre + ' para ' + DIAS[diaSem] + '. Revisa la ruta del dia.';
    msgEl.className = 'sugerencia-msg show';
  }
}
$('#btn-hora-sugerida').addEventListener('click', calcularHorarioSugerido);

// ===== REGISTRAR VISITA =====
function renderVisitaSection() {
  const sel = $('#visita-medico');
  sel.innerHTML = '<option value="">-- Seleccionar --</option>' + medicos.map(m => '<option value="' + m.id + '">' + m.nombre + ' (' + m.codigo + ') — ' + (m.zona === 'leon' ? 'Leon' : 'Managua') + '</option>').join('');
  $('#visita-fecha').valueAsDate = new Date();
  $('#hora-sugerida-msg').className = 'sugerencia-msg';
  $('#ia-preview').classList.add('hidden');
  renderVisitasList();
}
function validarHorarioVisita() {
  const medId = parseInt($('#visita-medico').value);
  const fechaVal = $('#visita-fecha').value;
  const horaVal = $('#visita-hora').value;
  const msgEl = $('#visita-validacion');
  if (!medId || !fechaVal || !horaVal) { msgEl.className = 'validation-msg'; return; }
  const m = getMedico(medId);
  const fecha = new Date(fechaVal + 'T00:00:00');
  const diaSem = fecha.getDay() === 0 ? 1 : fecha.getDay();
  const franjasValidas = m.franjas.filter(f => f.dias.includes(diaSem));
  if (!franjasValidas.length) {
    msgEl.className = 'validation-msg show err';
    msgEl.innerHTML = '⚠️ <strong>' + m.nombre + ' NO atiende ' + DIAS[diaSem] + '.</strong><br>Sus franjas: ' + formatFranjas(m.franjas);
    return false;
  }
  const enFranja = franjasValidas.some(f => horaVal >= f.inicio && horaVal <= f.fin);
  if (!enFranja) {
    msgEl.className = 'validation-msg show warn';
    msgEl.innerHTML = '⚠️ La hora <strong>' + horaVal + '</strong> esta fuera del horario de atencion para ' + DIAS[diaSem] + '.<br>Horarios validos: ' + franjasValidas.map(f => f.inicio + '-' + f.fin).join(' | ') + '<br>Puedes guardar igualmente, pero verifica antes de ir.';
    return false;
  }
  msgEl.className = 'validation-msg show ok';
  msgEl.innerHTML = '✅ Horario correcto para ' + DIAS[diaSem] + ': ' + franjasValidas.map(f => f.inicio + '-' + f.fin).join(' | ');
  return true;
}
$('#visita-medico, #visita-fecha, #visita-hora').forEach(el => {
  el.addEventListener('change', validarHorarioVisita);
});

// ===== IA REDACCION =====
const PLANTILLAS = {
  general: 'Se realizo visita medica al Dr./Dra. [NOMBRE], especialista en [ESPECIALIDAD]. Se presento el portafolio de productos, se entregaron muestras segun solicitud y se recogio feedback sobre la experiencia con los medicamentos. El medico manifesto interes en continuar recibiendo informacion actualizada. Proxima visita programada segun calendario establecido.',
  nuevo: 'Primer contacto con el Dr./Dra. [NOMBRE], especialista en [ESPECIALIDAD]. Se presento la empresa y el portafolio de productos disponibles. Se entrego material informativo y muestras de presentacion. El medico mostro interes en [PRODUCTO]. Se acordo realizar seguimiento en la proxima visita para evaluar la incorporacion de los productos a su prescripcion habitual.',
  seguimiento: 'Visita de seguimiento al Dr./Dra. [NOMBRE]. Se verifico el estado de pedidos pendientes y se resolvieron dudas sobre indicaciones y posologia de los productos. El medico reporto [OBSERVACIONES]. Se reforzo el compromiso de fidelizacion y se programo la proxima entrega de muestras.',
  muestras: 'Se realizo entrega de muestras medicas al Dr./Dra. [NOMBRE], especialista en [ESPECIALIDAD]. Productos entregados: [DETALLE]. El medico reporto [REACCIONES/SOLICITUDES]. Se documento la recepcion y se coordino la reposicion de inventario para la proxima visita.',
  queja: 'Durante la visita al Dr./Dra. [NOMBRE], se registro el siguiente inconveniente: [DETALLE]. Se tomaron las siguientes acciones correctivas: [ACCIONES]. Se acordo realizar seguimiento en la proxima visita para verificar la resolucion del caso. El medico quedo satisfecho con la atencion brindada.'
};

function pulirRedaccionIA(texto, medico) {
  if (!texto.trim()) return '';
  let pulido = texto.trim();
  pulido = pulido.charAt(0).toUpperCase() + pulido.slice(1);
  if (!pulido.endsWith('.')) pulido += '.';
  const reemplazos = {'q': 'que', 'xq': 'porque', 'x': 'por', 'tb': 'tambien', 'bn': 'bien', 'msj': 'mensaje', 'info': 'informacion', 'dr': 'doctor', 'dra': 'doctora', 'pac': 'paciente', 'recet': 'receto', 'indic': 'indico', 'preg': 'pregunto'};
  Object.entries(reemplazos).forEach(([k, v]) => {
    const regex = new RegExp('\\b' + k + '\\b', 'gi');
    pulido = pulido.replace(regex, v);
  });
  if (pulido.length > 120 && !pulido.includes('\n')) {
    const oraciones = pulido.match(/[^.!?]+[.!?]+/g) || [pulido];
    if (oraciones.length > 2) {
      const mitad = Math.ceil(oraciones.length / 2);
      pulido = oraciones.slice(0, mitad).join(' ') + '\n\n' + oraciones.slice(mitad).join(' ');
    }
  }
  if (medico) {
    pulido = pulido.replace(/\[NOMBRE\]/g, medico.nombre);
    pulido = pulido.replace(/\[ESPECIALIDAD\]/g, medico.especialidad);
  }
  return pulido;
}

$('#btn-pulir-ia').addEventListener('click', () => {
  const texto = $('#visita-notas').value.trim();
  if (!texto) { showToast('Escribi algo primero para pulir', 'warn'); return; }
  const medId = parseInt($('#visita-medico').value);
  const medico = medId ? getMedico(medId) : null;
  const pulido = pulirRedaccionIA(texto, medico);
  const preview = $('#ia-preview');
  preview.innerHTML = '<div class="ia-label">✨ Version pulida por IA</div><div class="ia-text">' + pulido.replace(/\n/g, '<br>') + '</div><div class="ia-actions-footer"><button class="btn-ia" onclick="aplicarTextoPulido()">✅ Aplicar este texto</button><button class="btn-outline btn-small" onclick="document.getElementById(\'ia-preview\').classList.add(\'hidden\')">❌ Descartar</button></div>';
  preview.dataset.pulido = pulido;
  preview.classList.remove('hidden');
});

window.aplicarTextoPulido = function() {
  const pulido = $('#ia-preview').dataset.pulido;
  if (pulido) { $('#visita-notas').value = pulido; $('#ia-preview').classList.add('hidden'); showToast('Texto pulido aplicado', 'ok'); }
};

$('#btn-plantilla-ia').addEventListener('click', () => { $('#modal-plantillas').classList.remove('hidden'); });
$$('.plantilla-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tipo = btn.dataset.template;
    const medId = parseInt($('#visita-medico').value);
    const medico = medId ? getMedico(medId) : null;
    let plantilla = PLANTILLAS[tipo] || '';
    if (medico) { plantilla = plantilla.replace(/\[NOMBRE\]/g, medico.nombre).replace(/\[ESPECIALIDAD\]/g, medico.especialidad); }
    $('#visita-notas').value = plantilla;
    $('#modal-plantillas').classList.add('hidden');
    showToast('Plantilla cargada. Edita los campos entre corchetes.', 'ok');
  });
});

$('#btn-guardar-visita').addEventListener('click', () => {
  const medId = parseInt($('#visita-medico').value);
  const fecha = $('#visita-fecha').value;
  const hora = $('#visita-hora').value;
  const notas = $('#visita-notas').value.trim();
  if (!medId || !fecha || !hora) { showToast('Completa todos los campos', 'err'); return; }
  visitas.push({ id: nextId(visitas), medicoId: medId, fecha, hora, notas, timestamp: new Date().toISOString() });
  saveData();
  $('#visita-notas').value = ''; $('#visita-hora').value = '';
  $('#visita-validacion').className = 'validation-msg';
  $('#hora-sugerida-msg').className = 'sugerencia-msg';
  $('#ia-preview').classList.add('hidden');
  renderVisitasList();
  renderDashboard();
  showToast('Visita registrada y guardada', 'ok');
});

function renderVisitasList() {
  const container = $('#visitas-list');
  if (!visitas.length) { container.innerHTML = '<p class="empty-msg">Sin visitas registradas.</p>'; return; }
  const sorted = [...visitas].sort((a,b) => new Date(b.fecha + 'T' + b.hora) - new Date(a.fecha + 'T' + a.hora));
  container.innerHTML = sorted.slice(0,20).map(v => {
    const m = getMedico(v.medicoId);
    return '<div class="visita-item"><h4>' + (m ? m.nombre : 'Desconocido') + ' — ' + v.fecha + ' ' + v.hora + '</h4><div class="medico-meta">' + (v.notas ? v.notas.replace(/\n/g, '<br>') : 'Sin notas') + '</div></div>';
  }).join('');
}

// ===== RECORDATORIOS =====
let notifPermiso = false;
$('#btn-notif').addEventListener('click', async () => {
  if (!('Notification' in window)) { showToast('Tu navegador no soporta notificaciones', 'err'); return; }
  const perm = await Notification.requestPermission();
  notifPermiso = perm === 'granted';
  if (notifPermiso) { showToast('Notificaciones activadas', 'ok'); crearRecordatoriosDelDia(); }
  else { showToast('Permiso denegado', 'warn'); }
});
function crearRecordatoriosDelDia() {
  const hoyStr = new Date().toDateString();
  recordatorios = recordatorios.filter(r => new Date(r.fecha).toDateString() !== hoyStr);
  const hoy = new Date().getDay();
  const diaSem = hoy === 0 ? 1 : hoy;
  const idsHoy = rutaSemanal[diaSem] || [];
  idsHoy.forEach(id => {
    const m = getMedico(id);
    if (!m) return;
    m.franjas.forEach(f => {
      if (!f.dias.includes(diaSem)) return;
      const [hh, mm] = f.inicio.split(':');
      const recHora = new Date();
      recHora.setHours(parseInt(hh), parseInt(mm) - 15, 0);
      if (recHora > new Date()) {
        recordatorios.push({
          id: Date.now() + Math.random(), medicoId: m.id,
          fecha: new Date().toISOString().split('T')[0],
          hora: String(recHora.getHours()).padStart(2,'0') + ':' + String(recHora.getMinutes()).padStart(2,'0'),
          msg: '⏰ ' + m.nombre + ' atiende a las ' + f.inicio + ' (' + m.especialidad + ')',
          disparado: false
        });
      }
    });
  });
  saveData();
  renderDashboard();
}
setInterval(() => {
  if (!notifPermiso) return;
  const ahora = new Date();
  const horaStr = String(ahora.getHours()).padStart(2,'0') + ':' + String(ahora.getMinutes()).padStart(2,'0');
  recordatorios.forEach(r => {
    if (r.disparado) return;
    if (r.hora === horaStr && new Date(r.fecha).toDateString() === ahora.toDateString()) {
      r.disparado = true; saveData();
      if (Notification.permission === 'granted') {
        new Notification('Recordatorio de Visita', { body: r.msg, icon: 'https://cdn-icons-png.flaticon.com/512/2964/2964514.png' });
      }
      showToast(r.msg, 'warn');
    }
  });
}, 30000);

// ===== RUTA OPTIMA =====
let mapaOptima = null;
$('#btn-calcular-ruta').addEventListener('click', () => {
  const dia = parseInt($('#opt-dia').value);
  const criterio = $('#opt-criterio').value;
  const ids = rutaSemanal[dia] || [];
  let lista = ids.map(id => getMedico(id)).filter(Boolean);
  if (!lista.length) { showToast('No hay medicos en ruta ese dia', 'warn'); return; }

  if (criterio === 'horario') {
    lista.sort((a,b) => {
      const fa = a.franjas.filter(f=>f.dias.includes(dia));
      const fb = b.franjas.filter(f=>f.dias.includes(dia));
      return (fa.length ? fa[0].inicio : '99:99').localeCompare(fb.length ? fb[0].inicio : '99:99');
    });
  } else if (criterio === 'proximidad') {
    const ref = miUbicacion ? [miUbicacion.lat, miUbicacion.lng] : CENTROS.managua;
    lista.sort((a,b) => {
      if (!a.lat || !a.lng) return 1;
      if (!b.lat || !b.lng) return -1;
      return Math.hypot(a.lat - ref[0], a.lng - ref[1]) - Math.hypot(b.lat - ref[0], b.lng - ref[1]);
    });
  } else if (criterio === 'sin-choque') {
    const items = lista.map(m => ({ m, franjas: m.franjas.filter(f=>f.dias.includes(dia)), start: m.franjas.filter(f=>f.dias.includes(dia)).length ? m.franjas.filter(f=>f.dias.includes(dia))[0].inicio : '99:99' }));
    items.sort((a,b) => a.start.localeCompare(b.start));
    const resultado = [];
    const usados = new Set();
    items.forEach(item => { if (!usados.has(item.m.id)) { resultado.push(item.m); usados.add(item.m.id); } });
    items.forEach(item => { if (!usados.has(item.m.id)) resultado.push(item.m); });
    lista = resultado;
  }

  $('#opt-ruta-list').innerHTML = lista.map((m,i) => {
    const franjas = m.franjas.filter(f=>f.dias.includes(dia));
    return '<div class="opt-item"><div class="opt-num">' + (i+1) + '</div><div class="opt-info"><strong>' + m.nombre + '</strong> <span class="fr-badge">' + m.codigo + '</span><div class="opt-hora">' + m.especialidad + ' — 🕐 ' + franjas.map(f => f.inicio + '-' + f.fin).join(' | ') + '</div>' + (m.nota ? '<div class="opt-hora">📝 ' + m.nota + '</div>' : '') + (m.lat ? '<button class="waze-btn" onclick="abrirWaze(' + m.lat + ',' + m.lng + ',\'' + m.nombre + '\')">🚗 Waze</button>' : '') + '</div></div>';
  }).join('');

  const primera = lista.find(m => m.lat && m.lng);
  const btnWaze = $('#btn-waze-ruta');
  if (primera) { btnWaze.style.display = 'inline-block'; btnWaze.onclick = () => abrirWaze(primera.lat, primera.lng, primera.nombre); }
  else { btnWaze.style.display = 'none'; }

  const mapEl = $('#opt-mapa');
  if (mapaOptima) { mapaOptima.remove(); mapaOptima = null; }
  mapaOptima = L.map(mapEl);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' }).addTo(mapaOptima);
  const group = L.featureGroup();
  lista.forEach((m,i) => {
    if (!m.lat || !m.lng) return;
    const marker = L.marker([m.lat, m.lng]).addTo(mapaOptima);
    marker.bindPopup('<b>' + (i+1) + '. ' + m.nombre + '</b><br>' + m.especialidad + '<br>🕐 ' + m.franjas.filter(f=>f.dias.includes(dia)).map(f => f.inicio + '-' + f.fin).join(', '));
    group.addLayer(marker);
  });
  const routeCoords = lista.filter(m=>m.lat&&m.lng).map(m=>[m.lat,m.lng]);
  if (routeCoords.length > 1) L.polyline(routeCoords, {color: '#0d7377', weight: 4, opacity: 0.7, dashArray: '10, 10'}).addTo(mapaOptima);
  if (group.getLayers().length) mapaOptima.fitBounds(group.getBounds().pad(0.1));
  else mapaOptima.setView(CENTROS.managua, 12);
  $('#opt-resultado').classList.remove('hidden');
  setTimeout(() => mapaOptima.invalidateSize(), 300);
});

// ===== MAPA ZONAS =====
let mapaZonas = null;
function renderMapaZonas() {
  const zona = $('#mapa-zona').value;
  const filtro = $('#mapa-filtro').value;
  const hoy = new Date().getDay();
  const diaSem = hoy === 0 ? 1 : hoy;
  const idsHoy = new Set(rutaSemanal[diaSem] || []);

  const mapEl = $('#mapa-container');
  if (mapaZonas) { mapaZonas.remove(); mapaZonas = null; }
  mapaZonas = L.map(mapEl);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' }).addTo(mapaZonas);

  const group = L.featureGroup();
  medicos.forEach(m => {
    if (!m.lat || !m.lng) return;
    if (zona !== 'todos' && m.zona !== zona) return;
    if (filtro === 'ruta-hoy' && !idsHoy.has(m.id)) return;
    const color = m.zona === 'leon' ? '#e67e22' : '#0d7377';
    const isRuta = idsHoy.has(m.id);
    const iconHtml = '<div style="background:' + (isRuta ? '#e74c3c' : color) + ';width:28px;height:28px;border-radius:50%;border:2px solid white;box-shadow:0 2px 5px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-size:11px;font-weight:700;">' + m.codigo.split('-')[1] + '</div>';
    const icon = L.divIcon({ html: iconHtml, className: '', iconSize: [28,28], iconAnchor: [14,14] });
    const marker = L.marker([m.lat, m.lng], {icon}).addTo(mapaZonas);
    marker.bindPopup('<b>' + m.nombre + '</b> (' + m.codigo + ')<br>' + m.especialidad + '<br>' + (m.zona === 'leon' ? '🦁 Leon' : '🏙️ Managua') + '<br>🕐 ' + formatFranjas(m.franjas) + '<br><button onclick="abrirWaze(' + m.lat + ',' + m.lng + ',\'' + m.nombre + '\')" style="margin-top:6px;padding:5px 12px;background:#93c47d;border:none;border-radius:4px;cursor:pointer;font-weight:600;font-size:0.85rem;">🚗 Waze</button>');
    group.addLayer(marker);
  });
  if (miUbicacion) {
    const yoIcon = L.divIcon({ html: '<div style="background:#3498db;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 0 0 3px #3498db,0 2px 5px rgba(0,0,0,0.3);"></div>', className: '', iconSize: [16,16], iconAnchor: [8,8] });
    const yo = L.marker([miUbicacion.lat, miUbicacion.lng], {icon: yoIcon}).addTo(mapaZonas);
    yo.bindPopup('<b>📍 Mi ubicacion</b>'); group.addLayer(yo);
  }
  if (group.getLayers().length) mapaZonas.fitBounds(group.getBounds().pad(0.15));
  else mapaZonas.setView(CENTROS[zona] || CENTROS.managua, 12);
  setTimeout(() => mapaZonas.invalidateSize(), 300);
}
$('#mapa-zona, #mapa-filtro').forEach(el => el.addEventListener('change', renderMapaZonas));
$('#btn-mi-ubi-mapa').addEventListener('click', () => { capturarGPS(() => renderMapaZonas()); });

// ===== ESTADISTICAS =====
function renderEstadisticas() {
  $('#stat-total-medicos').textContent = medicos.length;
  const hoy = new Date();
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  $('#stat-total-visitas').textContent = visitas.filter(v => new Date(v.fecha) >= inicioMes).length;
  let totalFranjasSemana = 0, franjasVisitadas = 0;
  for (let d=1; d<=6; d++) {
    (rutaSemanal[d]||[]).forEach(id => {
      const m = getMedico(id); if (!m) return;
      m.franjas.filter(f => f.dias.includes(d)).forEach(() => {
        totalFranjasSemana++;
        if (visitas.some(v => v.medicoId === id && v.fecha === hoy.toISOString().split('T')[0])) franjasVisitadas++;
      });
    });
  }
  $('#stat-cobertura').textContent = (totalFranjasSemana ? Math.round((franjasVisitadas/totalFranjasSemana)*100) : 0) + '%';

  const diasLabels = ['Lun','Mar','Mie','Jue','Vie','Sab'];
  const visitasPorDia = [0,0,0,0,0,0];
  visitas.forEach(v => { const d = new Date(v.fecha).getDay(); const idx = d===0?0:d-1; if (idx>=0&&idx<6) visitasPorDia[idx]++; });
  drawBarChart('chart-semanal', diasLabels, visitasPorDia, '#0d7377');

  const medCount = {};
  visitas.forEach(v => { medCount[v.medicoId] = (medCount[v.medicoId]||0)+1; });
  const topMeds = Object.entries(medCount).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([id,c])=>({name:getMedico(id)?.nombre||'???',count:c}));
  drawBarChart('chart-medicos', topMeds.map(m=>m.name), topMeds.map(m=>m.count), '#14a085');

  const mesesLabels=[], mesesData=[];
  for (let i=5; i>=0; i--) {
    const dt = new Date(hoy.getFullYear(), hoy.getMonth()-i, 1);
    mesesLabels.push(dt.toLocaleString('es', {month:'short'}));
    const finMes = new Date(dt.getFullYear(), dt.getMonth()+1, 0);
    mesesData.push(visitas.filter(v => { const dv = new Date(v.fecha); return dv >= dt && dv <= finMes; }).length);
  }
  drawLineChart('chart-mensual', mesesLabels, mesesData, '#0d7377');

  const zonaCount = {managua:0, leon:0};
  visitas.forEach(v => { const m = getMedico(v.medicoId); if (m && m.zona) zonaCount[m.zona]++; });
  drawPieChart('chart-zonas', ['Managua','Leon'], [zonaCount.managua, zonaCount.leon], ['#0d7377','#e67e22']);
}

function drawBarChart(canvasId, labels, data, color) {
  const canvas = document.getElementById(canvasId); if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr; canvas.height = 200 * dpr;
  ctx.scale(dpr, dpr);
  const w = rect.width, h = 200;
  ctx.clearRect(0,0,w,h);
  const max = Math.max(...data, 1);
  const barW = Math.max(20, (w - 40) / labels.length - 8);
  const startX = 20;
  labels.forEach((label, i) => {
    const barH = (data[i] / max) * (h - 50);
    const x = startX + i * (barW + 8);
    const y = h - 30 - barH;
    ctx.fillStyle = color; ctx.fillRect(x, y, barW, barH);
    ctx.fillStyle = '#1a202c'; ctx.font = '11px Inter, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(label, x + barW/2, h - 10);
    if (data[i] > 0) ctx.fillText(data[i], x + barW/2, y - 4);
  });
}
function drawLineChart(canvasId, labels, data, color) {
  const canvas = document.getElementById(canvasId); if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr; canvas.height = 200 * dpr;
  ctx.scale(dpr, dpr);
  const w = rect.width, h = 200;
  ctx.clearRect(0,0,w,h);
  const max = Math.max(...data, 1);
  const stepX = (w - 40) / (labels.length - 1);
  const points = data.map((v,i) => ({x: 20 + i*stepX, y: h - 30 - (v/max)*(h-50)}));
  ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.beginPath();
  points.forEach((p,i) => { if (i===0) ctx.moveTo(p.x,p.y); else ctx.lineTo(p.x,p.y); });
  ctx.stroke();
  points.forEach((p,i) => {
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(p.x,p.y,5,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = '#1a202c'; ctx.font = '11px Inter'; ctx.textAlign = 'center';
    ctx.fillText(labels[i], p.x, h-10);
    if (data[i] > 0) ctx.fillText(data[i], p.x, p.y - 10);
  });
}
function drawPieChart(canvasId, labels, data, colors) {
  const canvas = document.getElementById(canvasId); if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr; canvas.height = 200 * dpr;
  ctx.scale(dpr, dpr);
  const w = rect.width, h = 200;
  ctx.clearRect(0,0,w,h);
  const total = data.reduce((a,b)=>a+b,0) || 1;
  const cx = w/2 - 60, cy = h/2, r = Math.min(cx, cy) - 10;
  let start = -Math.PI/2;
  data.forEach((v,i) => {
    const angle = (v/total) * Math.PI * 2;
    ctx.fillStyle = colors[i]; ctx.beginPath(); ctx.moveTo(cx,cy); ctx.arc(cx,cy,r,start,start+angle); ctx.closePath(); ctx.fill();
    start += angle;
  });
  let ly = 30;
  labels.forEach((label,i) => {
    ctx.fillStyle = colors[i]; ctx.fillRect(w-110, ly-8, 12, 12);
    ctx.fillStyle = '#1a202c'; ctx.font = '12px Inter'; ctx.textAlign = 'left';
    ctx.fillText(label + ': ' + data[i], w-94, ly+2);
    ly += 22;
  });
}

// ===== EXPORTAR =====
$('#btn-export-csv').addEventListener('click', () => {
  let csv = 'Dia,Medico,Codigo,Especialidad,Zona,Horarios,Nota,Lat,Lng,Visitado\n';
  for (let d=1; d<=6; d++) {
    (rutaSemanal[d]||[]).forEach(id => {
      const m = getMedico(id); if (!m) return;
      const franjas = m.franjas.filter(f=>f.dias.includes(d));
      const horario = franjas.map(f=>f.inicio+'-'+f.fin).join('; ');
      const visitado = visitas.some(v => v.medicoId===id && v.fecha===new Date().toISOString().split('T')[0]) ? 'Si' : 'No';
      csv += '"' + DIAS[d] + '","' + m.nombre + '","' + m.codigo + '","' + m.especialidad + '","' + m.zona + '","' + horario + '","' + (m.nota||'') + '","' + (m.lat||'') + '","' + (m.lng||'') + '","' + visitado + '"\n';
    });
  }
  const blob = new Blob(['\uFEFF' + csv], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'RutaSemanal.csv'; a.click();
  showToast('CSV descargado', 'ok');
});

$('#btn-export-xlsx').addEventListener('click', () => {
  let html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><style>td,th{border:1px solid #ccc;padding:6px;font-family:Arial;font-size:11px}th{background:#0d7377;color:#fff}</style></head><body><table><tr><th>Dia</th><th>Medico</th><th>Codigo</th><th>Especialidad</th><th>Zona</th><th>Horarios del Dia</th><th>Nota</th><th>Latitud</th><th>Longitud</th><th>Visitado Hoy</th></tr>';
  for (let d=1; d<=6; d++) {
    (rutaSemanal[d]||[]).forEach(id => {
      const m = getMedico(id); if (!m) return;
      const franjas = m.franjas.filter(f=>f.dias.includes(d));
      const horario = franjas.map(f=>f.inicio+'-'+f.fin).join('; ');
      const visitado = visitas.some(v => v.medicoId===id && v.fecha===new Date().toISOString().split('T')[0]) ? 'Si' : 'No';
      html += '<tr><td>' + DIAS[d] + '</td><td>' + m.nombre + '</td><td>' + m.codigo + '</td><td>' + m.especialidad + '</td><td>' + m.zona + '</td><td>' + horario + '</td><td>' + (m.nota||'') + '</td><td>' + (m.lat||'') + '</td><td>' + (m.lng||'') + '</td><td>' + visitado + '</td></tr>';
    });
  }
  html += '</table></body></html>';
  const blob = new Blob([html], {type:'application/vnd.ms-excel'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'RutaSemanal.xls'; a.click();
  showToast('Excel descargado', 'ok');
});

$('#import-csv').addEventListener('change', (e) => {
  const file = e.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    const lines = ev.target.result.split('\n').filter(l=>l.trim());
    let count = 0;
    lines.slice(1).forEach(line => {
      const parts = line.split(',').map(p => p.replace(/^"|"$/g,'').trim());
      if (parts.length < 4) return;
      const [nombre, codigo, especialidad, horariosRaw, nota, lat, lng, zona] = parts;
      const franjas = [];
      if (horariosRaw) {
        horariosRaw.split(',').forEach(h => {
          const match = h.trim().match(/^([\w,]+)\s+(\d{1,2}:\d{2})-(\d{1,2}:\d{2})$/);
          if (match) {
            const diasMap = {'Lu':1,'Ma':2,'Mi':3,'Ju':4,'Vi':5,'Sa':6,'Lun':1,'Mar':2,'Mie':3,'Jue':4,'Vie':5,'Sab':6};
            const dias = match[1].split(/[,\-]/).map(d=>diasMap[d.trim()]).filter(Boolean);
            franjas.push({dias, inicio:match[2], fin:match[3]});
          }
        });
      }
      medicos.push({
        id: nextId(medicos), nombre, codigo, especialidad,
        zona: (zona||'managua').toLowerCase(),
        nota: nota||'', lat: parseFloat(lat)||null, lng: parseFloat(lng)||null, franjas
      });
      count++;
    });
    saveData(); renderMedicos(); renderDashboard();
    showToast(count + ' medicos importados', 'ok');
    e.target.value = '';
  };
  reader.readAsText(file);
});

// ===== INIT APP =====
function initApp() {
  loadData();
  renderDashboard();
  renderMedicos();
}

// ===== START =====
initLogin();
