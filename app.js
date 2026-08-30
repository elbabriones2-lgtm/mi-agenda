/* Mi Agenda v3.0 — Ultra Simple */

const DIAS = ['','Lunes','Martes','Miercoles','Jueves','Viernes','Sabado'];
const DIAS_CORTO = ['','Lu','Ma','Mi','Ju','Vi','Sa'];

let medicos = [];
let rutaSemanal = {};
let visitas = [];
let recordatorios = [];
let miUbicacion = null;

const CENTROS = { managua: [12.1364, -86.2514], leon: [12.4379, -86.8780] };

// ===== STORAGE =====
let storageOK = false;
try {
  localStorage.setItem('__test__', '1');
  localStorage.removeItem('__test__');
  storageOK = true;
} catch(e) {
  console.warn('localStorage bloqueado');
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
  } catch(e) {}
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
    seedDemo();
  }
}

function seedDemo() {
  if (medicos.length) return;
  medicos = [
    { id:1, nombre:'Dr. Perez', codigo:'MED-001', especialidad:'Cardiologia', zona:'managua', nota:'Llegar antes de las 10am', lat:12.1350, lng:-86.2510, franjas:[{dias:[1,2,3,4,5], inicio:'08:00', fin:'11:00'},{dias:[1,2,3,4,5], inicio:'14:00', fin:'17:00'}]},
    { id:2, nombre:'Dra. Lopez', codigo:'MED-002', especialidad:'Ginecologia', zona:'managua', nota:'Traer Prenalin Plus', lat:12.1400, lng:-86.2450, franjas:[{dias:[2,4], inicio:'12:00', fin:'15:00'}]},
    { id:3, nombre:'Dr. Ruiz', codigo:'MED-003', especialidad:'Medicina General', zona:'managua', nota:'No atiende sabados', lat:12.1300, lng:-86.2600, franjas:[{dias:[1,2,3,4,5], inicio:'08:00', fin:'16:00'}]},
    { id:4, nombre:'Dr. Gomez', codigo:'MED-004', especialidad:'Neurologia', zona:'managua', nota:'Primera visita del dia', lat:12.1380, lng:-86.2480, franjas:[{dias:[1,3,5], inicio:'07:00', fin:'10:00'},{dias:[2,4], inicio:'14:00', fin:'18:00'}]},
    { id:5, nombre:'Dra. Castillo', codigo:'MED-005', especialidad:'Pediatria', zona:'leon', nota:'Traer muestras', lat:12.4360, lng:-86.8760, franjas:[{dias:[1,3,5], inicio:'08:00', fin:'12:00'}]},
    { id:6, nombre:'Dr. Morales', codigo:'MED-006', especialidad:'Dermatologia', zona:'leon', nota:'Solo con cita previa', lat:12.4390, lng:-86.8800, franjas:[{dias:[2,4], inicio:'14:00', fin:'18:00'}]},
    { id:7, nombre:'Dra. Hernandez', codigo:'MED-007', especialidad:'Cardiologia', zona:'leon', nota:'Traer ECG previo', lat:12.4340, lng:-86.8740, franjas:[{dias:[1,2,3,4,5], inicio:'08:00', fin:'15:00'}]}
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
  }

  let storedPin = getStoredPin();
  if (!storedPin) {
    setPin(PIN_DEFAULT);
    storedPin = PIN_DEFAULT;
  }

  overlay.classList.remove('hidden');
  app.classList.add('hidden');
  passInput.value = '';
  passInput.focus();

  loginBtn.onclick = function() {
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

  passInput.onkeypress = function(e) {
    if (e.key === 'Enter') loginBtn.click();
  };
}

// ===== DOM HELPERS =====
function $(sel) { return document.querySelector(sel); }
function $$(sel) { return document.querySelectorAll(sel); }

function showToast(msg, type) {
  type = type || 'info';
  const container = $('#toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast toast-' + type;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(function() { toast.remove(); }, 4000);
}

function formatFranjas(franjas) {
  return franjas.map(function(f) {
    var diasStr = f.dias.map(function(d) { return DIAS_CORTO[d]; }).join(',');
    return diasStr + ' ' + f.inicio + '-' + f.fin;
  }).join(' | ');
}

function getMedico(id) { return medicos.find(function(m) { return m.id == id; }); }
function nextId(arr) { return arr.length ? Math.max.apply(null, arr.map(function(x) { return x.id; })) + 1 : 1; }

// ===== WAZE =====
function abrirWaze(lat, lng, label) {
  if (!lat || !lng) { showToast('Este medico no tiene coordenadas', 'warn'); return; }
  var appUrl = 'waze://?ll=' + lat + ',' + lng + '&navigate=yes';
  var webUrl = 'https://waze.com/ul?ll=' + lat + ',' + lng + '&navigate=yes';
  var isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  if (isMobile) { window.location.href = appUrl; setTimeout(function() { window.location.href = webUrl; }, 800); }
  else { window.open(webUrl, '_blank'); }
}

// ===== GPS =====
function capturarGPS(callback) {
  if (!navigator.geolocation) { showToast('GPS no disponible', 'err'); return; }
  showToast('Buscando senal GPS...', 'info');
  navigator.geolocation.getCurrentPosition(
    function(pos) {
      miUbicacion = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy, timestamp: new Date().toISOString() };
      saveData();
      showToast('GPS: ' + miUbicacion.lat.toFixed(4) + ', ' + miUbicacion.lng.toFixed(4), 'ok');
      if (callback) callback(miUbicacion);
    },
    function(err) { showToast('Error GPS: ' + (err.message || 'Permiso denegado'), 'err'); },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  );
}

// ===== NAV =====
$('#btn-menu').addEventListener('click', function() { $('#main-nav').classList.toggle('hidden'); $('#nav-overlay').classList.toggle('hidden'); });
$('#nav-overlay').addEventListener('click', function() { $('#main-nav').classList.add('hidden'); $('#nav-overlay').classList.add('hidden'); });
$$('.nav-link').forEach(function(link) {
  link.addEventListener('click', function(e) {
    e.preventDefault();
    var section = link.dataset.section;
    if (!section) return;
    $$('.section').forEach(function(s) { s.classList.remove('active'); });
    $('#' + section).classList.add('active');
    $$('.nav-link').forEach(function(l) { l.classList.remove('active'); });
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

$('#btn-cerrar-sesion').addEventListener('click', function(e) {
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
  var hoy = new Date().getDay();
  var diaSem = hoy === 0 ? 1 : hoy;
  var idsHoy = rutaSemanal[diaSem] || [];
  var medicosHoy = idsHoy.map(function(id) { return getMedico(id); }).filter(Boolean);
  var visitasHoy = visitas.filter(function(v) { var d = new Date(v.fecha); return d.toDateString() === new Date().toDateString(); });
  var visitadosHoy = new Set(visitasHoy.map(function(v) { return v.medicoId; }));

  $('#dash-total-hoy').textContent = medicosHoy.length;
  $('#dash-visitados').textContent = visitadosHoy.size;
  $('#dash-pendientes').textContent = Math.max(0, medicosHoy.length - visitadosHoy.size);

  var ubiEl = $('#dash-mi-ubicacion');
  if (miUbicacion) {
    ubiEl.innerHTML = '<strong>📍 ' + miUbicacion.lat.toFixed(5) + ', ' + miUbicacion.lng.toFixed(5) + '</strong><br><span style="font-size:0.8rem;color:var(--text-light)">Precision: ~' + Math.round(miUbicacion.accuracy) + 'm — ' + new Date(miUbicacion.timestamp).toLocaleString('es') + '</span>';
  } else {
    ubiEl.innerHTML = 'Toca <strong>📍</strong> en el header para capturar tu ubicacion actual.';
  }

  var ahora = new Date();
  var horaStr = String(ahora.getHours()).padStart(2,'0') + ':' + String(ahora.getMinutes()).padStart(2,'0');
  var proxHTML = '';
  medicosHoy.forEach(function(m) {
    m.franjas.forEach(function(f) {
      if (!f.dias.includes(diaSem)) return;
      if (f.inicio >= horaStr) {
        proxHTML += '<div class="medico-item"><h4>' + m.nombre + ' — ' + m.especialidad + '</h4><div class="medico-meta">🕐 ' + DIAS[diaSem] + ' ' + f.inicio + '-' + f.fin + ' <span class="fr-badge">' + m.codigo + '</span></div>' + (m.lat ? '<button class="waze-btn" onclick="abrirWaze(' + m.lat + ',' + m.lng + ',\'' + m.nombre + '\')">🚗 Waze</button>' : '') + '</div>';
      }
    });
  });
  $('#dash-proximas-list').innerHTML = proxHTML || '<p class="empty-msg">No hay mas atenciones programadas para hoy.</p>';

  var recs = recordatorios.filter(function(r) { return new Date(r.fecha).toDateString() === new Date().toDateString(); });
  $('#dash-recordatorios-list').innerHTML = recs.length ? recs.map(function(r) { return '<div class="fr-badge">⏰ ' + r.hora + ' — ' + r.msg + '</div>'; }).join('<br>') : '<p class="empty-msg">Sin recordatorios para hoy.</p>';
}

// ===== MEDICOS =====
function renderMedicos() {
  var container = $('#medicos-list');
  if (!medicos.length) { container.innerHTML = '<p class="empty-msg">No hay medicos registrados.</p>'; return; }
  container.innerHTML = medicos.map(function(m) {
    var zonaColor = m.zona === 'leon' ? '#fdebd0' : '#e6fffa';
    var zonaText = m.zona === 'leon' ? '#d35400' : '#0d7377';
    var zonaLabel = m.zona === 'leon' ? '🦁 Leon' : '🏙️ Managua';
    return '<div class="medico-item" data-id="' + m.id + '"><button class="delete-btn" onclick="eliminarMedico(' + m.id + ')">🗑</button><h4>' + m.nombre + ' <span class="fr-badge">' + m.codigo + '</span> <span class="fr-badge" style="background:' + zonaColor + ';color:' + zonaText + '">' + zonaLabel + '</span></h4><div class="medico-meta">' + m.especialidad + '</div><div class="medico-meta">🕐 ' + formatFranjas(m.franjas) + '</div>' + (m.nota ? '<div class="medico-meta">📝 ' + m.nota + '</div>' : '') + (m.lat ? '<div class="medico-meta">📍 ' + m.lat.toFixed(5) + ', ' + m.lng.toFixed(5) + '</div><button class="waze-btn" onclick="abrirWaze(' + m.lat + ',' + m.lng + ',\'' + m.nombre + '\')">🚗 Abrir en Waze</button>' : '<div class="medico-meta" style="color:var(--warning)">⚠️ Sin coordenadas para Waze</div>') + '</div>';
  }).join('');
}

window.eliminarMedico = function(id) {
  if (!confirm('Eliminar este medico?')) return;
  medicos = medicos.filter(function(m) { return m.id !== id; });
  Object.keys(rutaSemanal).forEach(function(d) { rutaSemanal[d] = rutaSemanal[d].filter(function(x) { return x !== id; }); });
  saveData();
  renderMedicos();
  renderDashboard();
  showToast('Medico eliminado', 'ok');
};

$('#btn-add-medico').addEventListener('click', function() {
  $('#modal-medico').classList.remove('hidden');
  $('#med-nombre').value = ''; $('#med-codigo').value = ''; $('#med-especialidad').value = '';
  $('#med-nota').value = ''; $('#med-lat').value = ''; $('#med-lng').value = ''; $('#med-zona').value = 'managua';
  $('#franjas-container').innerHTML = createFranjaHTML(0);
});
$('.modal-close').addEventListener('click', function() { $('#modal-medico').classList.add('hidden'); });

function createFranjaHTML(idx) {
  return '<div class="franja-row" data-index="' + idx + '"><div class="dias-checks"><label><input type="checkbox" class="dia-check" value="1"> Lun</label><label><input type="checkbox" class="dia-check" value="2"> Mar</label><label><input type="checkbox" class="dia-check" value="3"> Mie</label><label><input type="checkbox" class="dia-check" value="4"> Jue</label><label><input type="checkbox" class="dia-check" value="5"> Vie</label><label><input type="checkbox" class="dia-check" value="6"> Sab</label></div><div class="horario-inputs"><input type="time" class="hora-inicio" value="08:00"><span>a</span><input type="time" class="hora-fin" value="11:00"></div></div>';
}

$('#btn-add-franja').addEventListener('click', function() {
  var idx = $$('.franja-row').length;
  $('#franjas-container').insertAdjacentHTML('beforeend', createFranjaHTML(idx));
});

$('#btn-guardar-medico').addEventListener('click', function() {
  var nombre = $('#med-nombre').value.trim();
  var codigo = $('#med-codigo').value.trim();
  var especialidad = $('#med-especialidad').value.trim();
  if (!nombre || !codigo) { showToast('Nombre y codigo son obligatorios', 'err'); return; }
  var franjas = [];
  $$('.franja-row').forEach(function(row) {
    var dias = Array.from(row.querySelectorAll('.dia-check:checked')).map(function(cb) { return parseInt(cb.value); });
    var inicio = row.querySelector('.hora-inicio').value;
    var fin = row.querySelector('.hora-fin').value;
    if (dias.length && inicio && fin) franjas.push({ dias: dias, inicio: inicio, fin: fin });
  });
  var medico = {
    id: nextId(medicos), nombre: nombre, codigo: codigo, especialidad: especialidad,
    zona: $('#med-zona').value, nota: $('#med-nota').value.trim(),
    lat: parseFloat($('#med-lat').value) || null,
    lng: parseFloat($('#med-lng').value) || null,
    franjas: franjas
  };
  medicos.push(medico);
  saveData();
  $('#modal-medico').classList.add('hidden');
  renderMedicos();
  renderDashboard();
  showToast('Medico guardado correctamente', 'ok');
});

// ===== RUTA SEMANAL =====
var currentRutaDay = 1;
function renderRuta() {
  var sel = $('#select-medico-ruta');
  sel.innerHTML = '<option value="">-- Seleccionar medico --</option>' + medicos.map(function(m) { return '<option value="' + m.id + '">' + m.nombre + ' (' + m.codigo + ') — ' + (m.zona === 'leon' ? 'Leon' : 'Managua') + '</option>'; }).join('');
  renderRutaDia(currentRutaDay);
}
function renderRutaDia(dia) {
  currentRutaDay = dia;
  $('#ruta-dia-nombre').textContent = DIAS[dia];
  $$('.tab-btn').forEach(function(b) { b.classList.toggle('active', parseInt(b.dataset.day) === dia); });
  var ids = rutaSemanal[dia] || [];
  var container = $('#ruta-dia-list');
  if (!ids.length) { container.innerHTML = '<p class="empty-msg">Sin medicos en ruta este dia.</p>'; return; }
  container.innerHTML = ids.map(function(id) {
    var m = getMedico(id);
    if (!m) return '';
    var franjasHoy = m.franjas.filter(function(f) { return f.dias.includes(dia); });
    var zonaLabel = m.zona === 'leon' ? '🦁 Leon' : '🏙️ Managua';
    return '<div class="ruta-item"><button class="delete-btn" onclick="quitarDeRuta(' + dia + ',' + id + ')">🗑</button><h4>' + m.nombre + ' <span class="fr-badge">' + m.codigo + '</span></h4><div class="ruta-meta">' + m.especialidad + ' — ' + zonaLabel + '</div><div class="ruta-meta">🕐 ' + franjasHoy.map(function(f) { return f.inicio + '-' + f.fin; }).join(' | ') + '</div>' + (m.lat ? '<button class="waze-btn" onclick="abrirWaze(' + m.lat + ',' + m.lng + ',\'' + m.nombre + '\')">🚗 Waze</button>' : '') + '</div>';
  }).join('');
}
window.quitarDeRuta = function(dia, id) {
  rutaSemanal[dia] = (rutaSemanal[dia] || []).filter(function(x) { return x !== id; });
  saveData();
  renderRutaDia(dia);
  renderDashboard();
};
$$('.tab-btn').forEach(function(btn) {
  btn.addEventListener('click', function() { renderRutaDia(parseInt(btn.dataset.day)); });
});
$('#btn-add-ruta').addEventListener('click', function() {
  var id = parseInt($('#select-medico-ruta').value);
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
  var medId = parseInt($('#visita-medico').value);
  var fechaVal = $('#visita-fecha').value;
  if (!medId || !fechaVal) { showToast('Selecciona medico y fecha primero', 'warn'); return; }
  var m = getMedico(medId);
  var fecha = new Date(fechaVal + 'T00:00:00');
  var diaSem = fecha.getDay() === 0 ? 1 : fecha.getDay();
  var franjasValidas = m.franjas.filter(function(f) { return f.dias.includes(diaSem); });
  if (!franjasValidas.length) {
    $('#hora-sugerida-msg').innerHTML = '⚠️ ' + m.nombre + ' no atiende ' + DIAS[diaSem];
    $('#hora-sugerida-msg').className = 'sugerencia-msg show';
    return;
  }
  var idsRuta = rutaSemanal[diaSem] || [];
  var horariosOcupados = [];
  idsRuta.forEach(function(id) {
    if (id === medId) return;
    var otro = getMedico(id);
    if (!otro) return;
    otro.franjas.filter(function(f) { return f.dias.includes(diaSem); }).forEach(function(f) { horariosOcupados.push({ inicio: f.inicio, fin: f.fin }); });
    visitas.filter(function(v) { return v.medicoId === id && v.fecha === fechaVal; }).forEach(function(v) { horariosOcupados.push({ inicio: v.hora, fin: v.hora }); });
  });
  var sugerido = null;
  for (var fi = 0; fi < franjasValidas.length; fi++) {
    var franja = franjasValidas[fi];
    var parts = franja.inicio.split(':');
    var hh = parseInt(parts[0]);
    var mm = parseInt(parts[1]);
    var candidato = String(hh).padStart(2,'0') + ':' + String(mm).padStart(2,'0');
    var fin = franja.fin;
    while (candidato < fin) {
      var cMin = hh * 60 + mm;
      var choca = horariosOcupados.some(function(o) {
        var oStart = parseInt(o.inicio.split(':')[0]) * 60 + parseInt(o.inicio.split(':')[1]);
        var oEnd = parseInt(o.fin.split(':')[0]) * 60 + parseInt(o.fin.split(':')[1]);
        return cMin >= oStart - 30 && cMin <= oEnd + 30;
      });
      if (!choca) { sugerido = candidato; break; }
      mm += 30;
      if (mm >= 60) { mm -= 60; hh++; }
      candidato = String(hh).padStart(2,'0') + ':' + String(mm).padStart(2,'0');
    }
    if (sugerido) break;
  }
  var msgEl = $('#hora-sugerida-msg');
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
  var sel = $('#visita-medico');
  sel.innerHTML = '<option value="">-- Seleccionar --</option>' + medicos.map(function(m) { return '<option value="' + m.id + '">' + m.nombre + ' (' + m.codigo + ') — ' + (m.zona === 'leon' ? 'Leon' : 'Managua') + '</option>'; }).join('');
  $('#visita-fecha').valueAsDate = new Date();
  $('#hora-sugerida-msg').className = 'sugerencia-msg';
  $('#ia-preview').classList.add('hidden');
  renderVisitasList();
}
function validarHorarioVisita() {
  var medId = parseInt($('#visita-medico').value);
  var fechaVal = $('#visita-fecha').value;
  var horaVal = $('#visita-hora').value;
  var msgEl = $('#visita-validacion');
  if (!medId || !fechaVal || !horaVal) { msgEl.className = 'validation-msg'; return; }
  var m = getMedico(medId);
  var fecha = new Date(fechaVal + 'T00:00:00');
  var diaSem = fecha.getDay() === 0 ? 1 : fecha.getDay();
  var franjasValidas = m.franjas.filter(function(f) { return f.dias.includes(diaSem); });
  if (!franjasValidas.length) {
    msgEl.className = 'validation-msg show err';
    msgEl.innerHTML = '⚠️ <strong>' + m.nombre + ' NO atiende ' + DIAS[diaSem] + '.</strong><br>Sus franjas: ' + formatFranjas(m.franjas);
    return false;
  }
  var enFranja = franjasValidas.some(function(f) { return horaVal >= f.inicio && horaVal <= f.fin; });
  if (!enFranja) {
    msgEl.className = 'validation-msg show warn';
    msgEl.innerHTML = '⚠️ La hora <strong>' + horaVal + '</strong> esta fuera del horario de atencion para ' + DIAS[diaSem] + '.<br>Horarios validos: ' + franjasValidas.map(function(f) { return f.inicio + '-' + f.fin; }).join(' | ') + '<br>Puedes guardar igualmente, pero verifica antes de ir.';
    return false;
  }
  msgEl.className = 'validation-msg show ok';
  msgEl.innerHTML = '✅ Horario correcto para ' + DIAS[diaSem] + ': ' + franjasValidas.map(function(f) { return f.inicio + '-' + f.fin; }).join(' | ');
  return true;
}
$('#visita-medico').addEventListener('change', validarHorarioVisita);
$('#visita-fecha').addEventListener('change', validarHorarioVisita);
$('#visita-hora').addEventListener('change', validarHorarioVisita);

// ===== IA REDACCION =====
var PLANTILLAS = {
  general: 'Se realizo visita medica al Dr./Dra. [NOMBRE], especialista en [ESPECIALIDAD]. Se presento el portafolio de productos, se entregaron muestras segun solicitud y se recogio feedback sobre la experiencia con los medicamentos. El medico manifesto interes en continuar recibiendo informacion actualizada. Proxima visita programada segun calendario establecido.',
  nuevo: 'Primer contacto con el Dr./Dra. [NOMBRE], especialista en [ESPECIALIDAD]. Se presento la empresa y el portafolio de productos disponibles. Se entrego material informativo y muestras de presentacion. El medico mostro interes en [PRODUCTO]. Se acordo realizar seguimiento en la proxima visita para evaluar la incorporacion de los productos a su prescripcion habitual.',
  seguimiento: 'Visita de seguimiento al Dr./Dra. [NOMBRE]. Se verifico el estado de pedidos pendientes y se resolvieron dudas sobre indicaciones y posologia de los productos. El medico reporto [OBSERVACIONES]. Se reforzo el compromiso de fidelizacion y se programo la proxima entrega de muestras.',
  muestras: 'Se realizo entrega de muestras medicas al Dr./Dra. [NOMBRE], especialista en [ESPECIALIDAD]. Productos entregados: [DETALLE]. El medico reporto [REACCIONES/SOLICITUDES]. Se documento la recepcion y se coordino la reposicion de inventario para la proxima visita.',
  queja: 'Durante la visita al Dr./Dra. [NOMBRE], se registro el siguiente inconveniente: [DETALLE]. Se tomaron las siguientes acciones correctivas: [ACCIONES]. Se acordo realizar seguimiento en la proxima visita para verificar la resolucion del caso. El medico quedo satisfecho con la atencion brindada.'
};

function pulirRedaccionIA(texto, medico) {
  if (!texto.trim()) return '';
  var pulido = texto.trim();
  pulido = pulido.charAt(0).toUpperCase() + pulido.slice(1);
  if (!pulido.endsWith('.')) pulido += '.';
  var reemplazos = {'q': 'que', 'xq': 'porque', 'x': 'por', 'tb': 'tambien', 'bn': 'bien', 'msj': 'mensaje', 'info': 'informacion', 'dr': 'doctor', 'dra': 'doctora', 'pac': 'paciente', 'recet': 'receto', 'indic': 'indico', 'preg': 'pregunto'};
  Object.keys(reemplazos).forEach(function(k) {
    var regex = new RegExp('\\b' + k + '\\b', 'gi');
    pulido = pulido.replace(regex, reemplazos[k]);
  });
  if (pulido.length > 120 && !pulido.includes('\n')) {
    var oraciones = pulido.match(/[^.!?]+[.!?]+/g) || [pulido];
    if (oraciones.length > 2) {
      var mitad = Math.ceil(oraciones.length / 2);
      pulido = oraciones.slice(0, mitad).join(' ') + '\n\n' + oraciones.slice(mitad).join(' ');
    }
  }
  if (medico) {
    pulido = pulido.replace(/\[NOMBRE\]/g, medico.nombre);
    pulido = pulido.replace(/\[ESPECIALIDAD\]/g, medico.especialidad);
  }
  return pulido;
}

$('#btn-pulir-ia').addEventListener('click', function() {
  var texto = $('#visita-notas').value.trim();
  if (!texto) { showToast('Escribi algo primero para pulir', 'warn'); return; }
  var medId = parseInt($('#visita-medico').value);
  var medico = medId ? getMedico(medId) : null;
  var pulido = pulirRedaccionIA(texto, medico);
  var preview = $('#ia-preview');
  preview.innerHTML = '<div class="ia-label">✨ Version pulida por IA</div><div class="ia-text">' + pulido.replace(/\n/g, '<br>') + '</div><div class="ia-actions-footer"><button class="btn-ia" onclick="aplicarTextoPulido()">✅ Aplicar este texto</button><button class="btn-outline btn-small" onclick="document.getElementById(\'ia-preview\').classList.add(\'hidden\')">❌ Descartar</button></div>';
  preview.dataset.pulido = pulido;
  preview.classList.remove('hidden');
});

window.aplicarTextoPulido = function() {
  var pulido = $('#ia-preview').dataset.pulido;
  if (pulido) { $('#visita-notas').value = pulido; $('#ia-preview').classList.add('hidden'); showToast('Texto pulido aplicado', 'ok'); }
};

$('#btn-plantilla-ia').addEventListener('click', function() { $('#modal-plantillas').classList.remove('hidden'); });
$$('.plantilla-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    var tipo = btn.dataset.template;
    var medId = parseInt($('#visita-medico').value);
    var medico = medId ? getMedico(medId) : null;
    var plantilla = PLANTILLAS[tipo] || '';
    if (medico) { plantilla = plantilla.replace(/\[NOMBRE\]/g, medico.nombre).replace(/\[ESPECIALIDAD\]/g, medico.especialidad); }
    $('#visita-notas').value = plantilla;
    $('#modal-plantillas').classList.add('hidden');
    showToast('Plantilla cargada. Edita los campos entre corchetes.', 'ok');
  });
});

$('#btn-guardar-visita').addEventListener('click', function() {
  var medId = parseInt($('#visita-medico').value);
  var fecha = $('#visita-fecha').value;
  var hora = $('#visita-hora').value;
  var notas = $('#visita-notas').value.trim();
  if (!medId || !fecha || !hora) { showToast('Completa todos los campos', 'err'); return; }
  visitas.push({ id: nextId(visitas), medicoId: medId, fecha: fecha, hora: hora, notas: notas, timestamp: new Date().toISOString() });
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
  var container = $('#visitas-list');
  if (!visitas.length) { container.innerHTML = '<p class="empty-msg">Sin visitas registradas.</p>'; return; }
  var sorted = visitas.slice().sort(function(a,b) { return new Date(b.fecha + 'T' + b.hora) - new Date(a.fecha + 'T' + a.hora); });
  container.innerHTML = sorted.slice(0,20).map(function(v) {
    var m = getMedico(v.medicoId);
    return '<div class="visita-item"><h4>' + (m ? m.nombre : 'Desconocido') + ' — ' + v.fecha + ' ' + v.hora + '</h4><div class="medico-meta">' + (v.notas ? v.notas.replace(/\n/g, '<br>') : 'Sin notas') + '</div></div>';
  }).join('');
}

// ===== RECORDATORIOS =====
var notifPermiso = false;
$('#btn-notif').addEventListener('click', async function() {
  if (!('Notification' in window)) { showToast('Tu navegador no soporta notificaciones', 'err'); return; }
  var perm = await Notification.requestPermission();
  notifPermiso = perm === 'granted';
  if (notifPermiso) { showToast('Notificaciones activadas', 'ok'); crearRecordatoriosDelDia(); }
  else { showToast('Permiso denegado', 'warn'); }
});
function crearRecordatoriosDelDia() {
  var hoyStr = new Date().toDateString();
  recordatorios = recordatorios.filter(function(r) { return new Date(r.fecha).toDateString() !== hoyStr; });
  var hoy = new Date().getDay();
  var diaSem = hoy === 0 ? 1 : hoy;
  var idsHoy = rutaSemanal[diaSem] || [];
  idsHoy.forEach(function(id) {
    var m = getMedico(id);
    if (!m) return;
    m.franjas.forEach(function(f) {
      if (!f.dias.includes(diaSem)) return;
      var parts = f.inicio.split(':');
      var recHora = new Date();
      recHora.setHours(parseInt(parts[0]), parseInt(parts[1]) - 15, 0);
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
setInterval(function() {
  if (!notifPermiso) return;
  var ahora = new Date();
  var horaStr = String(ahora.getHours()).padStart(2,'0') + ':' + String(ahora.getMinutes()).padStart(2,'0');
  recordatorios.forEach(function(r) {
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
var mapaOptima = null;
$('#btn-calcular-ruta').addEventListener('click', function() {
  var dia = parseInt($('#opt-dia').value);
  var criterio = $('#opt-criterio').value;
  var ids = rutaSemanal[dia] || [];
  var lista = ids.map(function(id) { return getMedico(id); }).filter(Boolean);
  if (!lista.length) { showToast('No hay medicos en ruta ese dia', 'warn'); return; }

  if (criterio === 'horario') {
    lista.sort(function(a,b) {
      var fa = a.franjas.filter(function(f) { return f.dias.includes(dia); });
      var fb = b.franjas.filter(function(f) { return f.dias.includes(dia); });
      return (fa.length ? fa[0].inicio : '99:99').localeCompare(fb.length ? fb[0].inicio : '99:99');
    });
  } else if (criterio === 'proximidad') {
    var ref = miUbicacion ? [miUbicacion.lat, miUbicacion.lng] : CENTROS.managua;
    lista.sort(function(a,b) {
      if (!a.lat || !a.lng) return 1;
      if (!b.lat || !b.lng) return -1;
      return Math.hypot(a.lat - ref[0], a.lng - ref[1]) - Math.hypot(b.lat - ref[0], b.lng - ref[1]);
    });
  } else if (criterio === 'sin-choque') {
    var items = lista.map(function(m) { return { m: m, franjas: m.franjas.filter(function(f) { return f.dias.includes(dia); }), start: m.franjas.filter(function(f) { return f.dias.includes(dia); }).length ? m.franjas.filter(function(f) { return f.dias.includes(dia); })[0].inicio : '99:99' }; });
    items.sort(function(a,b) { return a.start.localeCompare(b.start); });
    var resultado = [];
    var usados = new Set();
    items.forEach(function(item) { if (!usados.has(item.m.id)) { resultado.push(item.m); usados.add(item.m.id); } });
    items.forEach(function(item) { if (!usados.has(item.m.id)) resultado.push(item.m); });
    lista = resultado;
  }

  $('#opt-ruta-list').innerHTML = lista.map(function(m, i) {
    var franjas = m.franjas.filter(function(f) { return f.dias.includes(dia); });
    return '<div class="opt-item"><div class="opt-num">' + (i+1) + '</div><div class="opt-info"><strong>' + m.nombre + '</strong> <span class="fr-badge">' + m.codigo + '</span><div class="opt-hora">' + m.especialidad + ' — 🕐 ' + franjas.map(function(f) { return f.inicio + '-' + f.fin; }).join(' | ') + '</div>' + (m.nota ? '<div class="opt-hora">📝 ' + m.nota + '</div>' : '') + (m.lat ? '<button class="waze-btn" onclick="abrirWaze(' + m.lat + ',' + m.lng + ',\'' + m.nombre + '\')">🚗 Waze</button>' : '') + '</div></div>';
  }).join('');

  var primera = lista.find(function(m) { return m.lat && m.lng; });
  var btnWaze = $('#btn-waze-ruta');
  if (primera) { btnWaze.style.display = 'inline-block'; btnWaze.onclick = function() { abrirWaze(primera.lat, primera.lng, primera.nombre); }; }
  else { btnWaze.style.display = 'none'; }

  var mapEl = $('#opt-mapa');
  if (mapaOptima) { mapaOptima.remove(); mapaOptima = null; }
  mapaOptima = L.map(mapEl);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' }).addTo(mapaOptima);
  var group = L.featureGroup();
  lista.forEach(function(m, i) {
    if (!m.lat || !m.lng) return;
    var marker = L.marker([m.lat, m.lng]).addTo(mapaOptima);
    marker.bindPopup('<b>' + (i+1) + '. ' + m.nombre + '</b><br>' + m.especialidad + '<br>🕐 ' + m.franjas.filter(function(f) { return f.dias.includes(dia); }).map(function(f) { return f.inicio + '-' + f.fin; }).join(', '));
    group.addLayer(marker);
  });
  var routeCoords = lista.filter(function(m) { return m.lat && m.lng; }).map(function(m) { return [m.lat, m.lng]; });
  if (routeCoords.length > 1) L.polyline(routeCoords, {color: '#0d7377', weight: 4, opacity: 0.7, dashArray: '10, 10'}).addTo(mapaOptima);
  if (group.getLayers().length) mapaOptima.fitBounds(group.getBounds().pad(0.1));
  else mapaOptima.setView(CENTROS.managua, 12);
  $('#opt-resultado').classList.remove('hidden');
  setTimeout(function() { mapaOptima.invalidateSize(); }, 300);
});

// ===== MAPA ZONAS =====
var mapaZonas = null;
function renderMapaZonas() {
  var zona = $('#mapa-zona').value;
  var filtro = $('#mapa-filtro').value;
  var hoy = new Date().getDay();
  var diaSem = hoy === 0 ? 1 : hoy;
  var idsHoy = new Set(rutaSemanal[diaSem] || []);

  var mapEl = $('#mapa-container');
  if (mapaZonas) { mapaZonas.remove(); mapaZonas = null; }
  mapaZonas = L.map(mapEl);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' }).addTo(mapaZonas);

  var group = L.featureGroup();
  medicos.forEach(function(m) {
    if (!m.lat || !m.lng) return;
    if (zona !== 'todos' && m.zona !== zona) return;
    if (filtro === 'ruta-hoy' && !idsHoy.has(m.id)) return;
    var color = m.zona === 'leon' ? '#e67e22' : '#0d7377';
    var isRuta = idsHoy.has(m.id);
    var iconHtml = '<div style="background:' + (isRuta ? '#e74c3c' : color) + ';width:28px;height:28px;border-radius:50%;border:2px solid white;box-shadow:0 2px 5px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-size:11px;font-weight:700;">' + m.codigo.split('-')[1] + '</div>';
    var icon = L.divIcon({ html: iconHtml, className: '', iconSize: [28,28], iconAnchor: [14,14] });
    var marker = L.marker([m.lat, m.lng], {icon: icon}).addTo(mapaZonas);
    marker.bindPopup('<b>' + m.nombre + '</b> (' + m.codigo + ')<br>' + m.especialidad + '<br>' + (m.zona === 'leon' ? '🦁 Leon' : '🏙️ Managua') + '<br>🕐 ' + formatFranjas(m.franjas) + '<br><button onclick="abrirWaze(' + m.lat + ',' + m.lng + ',\'' + m.nombre + '\')" style="margin-top:6px;padding:5px 12px;background:#93c47d;border:none;border-radius:4px;cursor:pointer;font-weight:600;font-size:0.85rem;">🚗 Waze</button>');
    group.addLayer(marker);
  });
  if (miUbicacion) {
    var yoIcon = L.divIcon({ html: '<div style="background:#3498db;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 0 0 3px #3498db,0 2px 5px rgba(0,0,0,0.3);"></div>', className: '', iconSize: [16,16], iconAnchor: [8,8] });
    var yo = L.marker([miUbicacion.lat, miUbicacion.lng], {icon: yoIcon}).addTo(mapaZonas);
    yo.bindPopup('<b>📍 Mi ubicacion</b>'); group.addLayer(yo);
  }
  if (group.getLayers().length) mapaZonas.fitBounds(group.getBounds().pad(0.15));
  else mapaZonas.setView(CENTROS[zona] || CENTROS.managua, 12);
  setTimeout(function() { mapaZonas.invalidateSize(); }, 300);
}
$('#mapa-zona').addEventListener('change', renderMapaZonas);
$('#mapa-filtro').addEventListener('change', renderMapaZonas);
$('#btn-mi-ubi-mapa').addEventListener('click', function() { capturarGPS(function() { renderMapaZonas(); }); });

// ===== ESTADISTICAS =====
function renderEstadisticas() {
  $('#stat-total-medicos').textContent = medicos.length;
  var hoy = new Date();
  var inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  $('#stat-total-visitas').textContent = visitas.filter(function(v) { return new Date(v.fecha) >= inicioMes; }).length;
  var totalFranjasSemana = 0, franjasVisitadas = 0;
  for (var d = 1; d <= 6; d++) {
    (rutaSemanal[d] || []).forEach(function(id) {
      var m = getMedico(id); if (!m) return;
      m.franjas.filter(function(f) { return f.dias.includes(d); }).forEach(function() {
        totalFranjasSemana++;
        if (visitas.some(function(v) { return v.medicoId === id && v.fecha === hoy.toISOString().split('T')[0]; })) franjasVisitadas++;
      });
    });
  }
  $('#stat-cobertura').textContent = (totalFranjasSemana ? Math.round((franjasVisitadas / totalFranjasSemana) * 100) : 0) + '%';

  var diasLabels = ['Lun','Mar','Mie','Jue','Vie','Sab'];
  var visitasPorDia = [0,0,0,0,0,0];
  visitas.forEach(function(v) { var d = new Date(v.fecha).getDay(); var idx = d === 0 ? 0 : d - 1; if (idx >= 0 && idx < 6) visitasPorDia[idx]++; });
  drawBarChart('chart-semanal', diasLabels, visitasPorDia, '#0d7377');

  var medCount = {};
  visitas.forEach(function(v) { medCount[v.medicoId] = (medCount[v.medicoId] || 0) + 1; });
  var topMeds = Object.keys(medCount).map(function(id) { return { name: getMedico(parseInt(id))?.nombre || '???', count: medCount[id] }; }).sort(function(a,b) { return b.count - a.count; }).slice(0,10);
  drawBarChart('chart-medicos', topMeds.map(function(m) { return m.name; }), topMeds.map(function(m) { return m.count; }), '#14a085');

  var mesesLabels = [], mesesData = [];
  for (var i = 5; i >= 0; i--) {
    var dt = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    mesesLabels.push(dt.toLocaleString('es', {month:'short'}));
    var finMes = new Date(dt.getFullYear(), dt.getMonth() + 1, 0);
    mesesData.push(visitas.filter(function(v) { var dv = new Date(v.fecha); return dv >= dt && dv <= finMes; }).length);
  }
  drawLineChart('chart-mensual', mesesLabels, mesesData, '#0d7377');

  var zonaCount = {managua:0, leon:0};
  visitas.forEach(function(v) { var m = getMedico(v.medicoId); if (m && m.zona) zonaCount[m.zona]++; });
  drawPieChart('chart-zonas', ['Managua','Leon'], [zonaCount.managua, zonaCount.leon], ['#0d7377','#e67e22']);
}

function drawBarChart(canvasId, labels, data, color) {
  var canvas = document.getElementById(canvasId); if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var dpr = window.devicePixelRatio || 1;
  var rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr; canvas.height = 200 * dpr;
  ctx.scale(dpr, dpr);
  var w = rect.width, h = 200;
  ctx.clearRect(0,0,w,h);
  var max = Math.max.apply(null, data.concat([1]));
  var barW = Math.max(20, (w - 40) / labels.length - 8);
  var startX = 20;
  labels.forEach(function(label, i) {
    var barH = (data[i] / max) * (h - 50);
    var x = startX + i * (barW + 8);
    var y = h - 30 - barH;
    ctx.fillStyle = color; ctx.fillRect(x, y, barW, barH);
    ctx.fillStyle = '#1a202c'; ctx.font = '11px Inter, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(label, x + barW/2, h - 10);
    if (data[i] > 0) ctx.fillText(data[i], x + barW/2, y - 4);
  });
}
function drawLineChart(canvasId, labels, data, color) {
  var canvas = document.getElementById(canvasId); if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var dpr = window.devicePixelRatio || 1;
  var rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr; canvas.height = 200 * dpr;
  ctx.scale(dpr, dpr);
  var w = rect.width, h = 200;
  ctx.clearRect(0,0,w,h);
  var max = Math.max.apply(null, data.concat([1]));
  var stepX = (w - 40) / (labels.length - 1);
  var points = data.map(function(v, i) { return {x: 20 + i * stepX, y: h - 30 - (v / max) * (h - 50)}; });
  ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.beginPath();
  points.forEach(function(p, i) { if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
  ctx.stroke();
  points.forEach(function(p, i) {
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1a202c'; ctx.font = '11px Inter'; ctx.textAlign = 'center';
    ctx.fillText(labels[i], p.x, h - 10);
    if (data[i] > 0) ctx.fillText(data[i], p.x, p.y - 10);
  });
}
function drawPieChart(canvasId, labels, data, colors) {
  var canvas = document.getElementById(canvasId); if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var dpr = window.devicePixelRatio || 1;
  var rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr; canvas.height = 200 * dpr;
  ctx.scale(dpr, dpr);
  var w = rect.width, h = 200;
  ctx.clearRect(0,0,w,h);
  var total = data.reduce(function(a,b) { return a + b; }, 0) || 1;
  var cx = w / 2 - 60, cy = h / 2, r = Math.min(cx, cy) - 10;
  var start = -Math.PI / 2;
  data.forEach(function(v, i) {
    var angle = (v / total) * Math.PI * 2;
    ctx.fillStyle = colors[i]; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, start, start + angle); ctx.closePath(); ctx.fill();
    start += angle;
  });
  var ly = 30;
  labels.forEach(function(label, i) {
    ctx.fillStyle = colors[i]; ctx.fillRect(w - 110, ly - 8, 12, 12);
    ctx.fillStyle = '#1a202c'; ctx.font = '12px Inter'; ctx.textAlign = 'left';
    ctx.fillText(label + ': ' + data[i], w - 94, ly + 2);
    ly += 22;
  });
}

// ===== EXPORTAR =====
$('#btn-export-csv').addEventListener('click', function() {
  var csv = 'Dia,Medico,Codigo,Especialidad,Zona,Horarios,Nota,Lat,Lng,Visitado\n';
  for (var d = 1; d <= 6; d++) {
    (rutaSemanal[d] || []).forEach(function(id) {
      var m = getMedico(id); if (!m) return;
      var franjas = m.franjas.filter(function(f) { return f.dias.includes(d); });
      var horario = franjas.map(function(f) { return f.inicio + '-' + f.fin; }).join('; ');
      var visitado = visitas.some(function(v) { return v.medicoId === id && v.fecha === new Date().toISOString().split('T')[0]; }) ? 'Si' : 'No';
      csv += '"' + DIAS[d] + '","' + m.nombre + '","' + m.codigo + '","' + m.especialidad + '","' + m.zona + '","' + horario + '","' + (m.nota || '') + '","' + (m.lat || '') + '","' + (m.lng || '') + '","' + visitado + '"\n';
    });
  }
  var blob = new Blob(['\uFEFF' + csv], {type:'text/csv;charset=utf-8;'});
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a'); a.href = url; a.download = 'RutaSemanal.csv'; a.click();
  showToast('CSV descargado', 'ok');
});

$('#btn-export-xlsx').addEventListener('click', function() {
  var html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><style>td,th{border:1px solid #ccc;padding:6px;font-family:Arial;font-size:11px}th{background:#0d7377;color:#fff}</style></head><body><table><tr><th>Dia</th><th>Medico</th><th>Codigo</th><th>Especialidad</th><th>Zona</th><th>Horarios del Dia</th><th>Nota</th><th>Latitud</th><th>Longitud</th><th>Visitado Hoy</th></tr>';
  for (var d = 1; d <= 6; d++) {
    (rutaSemanal[d] || []).forEach(function(id) {
      var m = getMedico(id); if (!m) return;
      var franjas = m.franjas.filter(function(f) { return f.dias.includes(d); });
      var horario = franjas.map(function(f) { return f.inicio + '-' + f.fin; }).join('; ');
      var visitado = visitas.some(function(v) { return v.medicoId === id && v.fecha === new Date().toISOString().split('T')[0]; }) ? 'Si' : 'No';
      html += '<tr><td>' + DIAS[d] + '</td><td>' + m.nombre + '</td><td>' + m.codigo + '</td><td>' + m.especialidad + '</td><td>' + m.zona + '</td><td>' + horario + '</td><td>' + (m.nota || '') + '</td><td>' + (m.lat || '') + '</td><td>' + (m.lng || '') + '</td><td>' + visitado + '</td></tr>';
    });
  }
  html += '</table></body></html>';
  var blob = new Blob([html], {type:'application/vnd.ms-excel'});
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a'); a.href = url; a.download = 'RutaSemanal.xls'; a.click();
  showToast('Excel descargado', 'ok');
});

$('#import-csv').addEventListener('change', function(e) {
  var file = e.target.files[0]; if (!file) return;
  var reader = new FileReader();
  reader.onload = function(ev) {
    var lines = ev.target.result.split('\n').filter(function(l) { return l.trim(); });
    var count = 0;
    lines.slice(1).forEach(function(line) {
      var parts = line.split(',').map(function(p) { return p.replace(/^"|"$/g, '').trim(); });
      if (parts.length < 4) return;
      var nombre = parts[0], codigo = parts[1], especialidad = parts[2], horariosRaw = parts[3], nota = parts[4] || '', lat = parts[5] || '', lng = parts[6] || '', zona = parts[7] || 'managua';
      var franjas = [];
      if (horariosRaw) {
        horariosRaw.split(',').forEach(function(h) {
          var match = h.trim().match(/^([\w,]+)\s+(\d{1,2}:\d{2})-(\d{1,2}:\d{2})$/);
          if (match) {
            var diasMap = {'Lu':1,'Ma':2,'Mi':3,'Ju':4,'Vi':5,'Sa':6,'Lun':1,'Mar':2,'Mie':3,'Jue':4,'Vie':5,'Sab':6};
            var dias = match[1].split(/[,\-]/).map(function(d) { return diasMap[d.trim()]; }).filter(Boolean);
            franjas.push({dias: dias, inicio: match[2], fin: match[3]});
          }
        });
      }
      medicos.push({
        id: nextId(medicos), nombre: nombre, codigo: codigo, especialidad: especialidad,
        zona: zona.toLowerCase(), nota: nota, lat: parseFloat(lat) || null, lng: parseFloat(lng) || null, franjas: franjas
      });
      count++;
    });
    saveData(); renderMedicos(); renderDashboard();
    showToast(count + ' medicos importados', 'ok');
    e.target.value = '';
  };
  reader.readAsText(file);
});

// ===== CAMBIAR PIN =====
$('#btn-cambiar-pin').addEventListener('click', function(e) {
  e.preventDefault();
  $('#modal-cambiar-pin').classList.remove('hidden');
  $('#pin-actual').value = '';
  $('#pin-nuevo').value = '';
  $('#pin-confirmar').value = '';
  $('#pin-error').classList.add('hidden');
  $('#main-nav').classList.add('hidden');
  $('#nav-overlay').classList.add('hidden');
});

$('#btn-guardar-pin').addEventListener('click', function() {
  var actual = $('#pin-actual').value.trim();
  var nuevo = $('#pin-nuevo').value.trim();
  var confirmar = $('#pin-confirmar').value.trim();
  var errorEl = $('#pin-error');
  var storedPin = getStoredPin();

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
  $('#modal-cambiar-pin').classList.add('hidden');
  showToast('Codigo cambiado correctamente', 'ok');
});

// ===== INIT =====
function initApp() {
  loadData();
  renderDashboard();
  renderMedicos();
}

initLogin();
