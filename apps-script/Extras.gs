/**
 * Organizador BlackLine · Funciones extra para la app
 * Subtareas, tareas que se repiten, mes nuevo de hábitos, Google Calendar y Gmail.
 *
 * Pegar como un archivo NUEVO dentro del proyecto de Apps Script de tu Sheet
 * (Extensiones > Apps Script > "+" > Secuencia de comandos > nombre: Extras).
 * No reemplaza nada de lo que ya tienes. Además hay que agregar UNA línea en WebApp
 * (dentro de "switch (p.action)", debajo de case 'semanaGuardar'):
 *
 *     case 'extra':       return app_json_(app_extra_(p));
 *
 * Después: elige la función "autorizarExtras" arriba, toca Ejecutar y acepta los permisos.
 * Por último: Implementar > Administrar implementaciones > editar (lápiz) > Versión: Nueva versión.
 */

const EX_VERSION = '2026-10-06';
const EX_HOJA = 'Tareas';
const EX_PRIMERA = 4;
const EX_ULTIMA = 400;
const EX_COL_SUB = 21;   // U: ☑ Subtareas
const EX_COL_REP = 22;   // V: 🔁 Repetir
const EX_REPETIR = ['Diaria', 'Días hábiles', 'Semanal', 'Quincenal', 'Mensual', 'Anual'];
const EX_HAB_HOJA = 'Hábitos';
const EX_HAB_HISTORIAL = 'Historial hábitos';

// Días hacia adelante que se leen del calendario (incluye hoy).
const INT_DIAS_CALENDARIO = 7;
// Correos que la app te propone como tareas (búsquedas de Gmail).
const INT_GMAIL_DESTACADOS = 'is:starred newer_than:21d';
const INT_GMAIL_IMPORTANTES = 'in:inbox is:important is:unread newer_than:3d -category:promotions -category:social';
const INT_MAX_CORREOS = 10;

/** Ejecutar UNA vez desde el editor para dar permiso de lectura a Calendario y Gmail. */
function autorizarExtras() {
  const cal = CalendarApp.getDefaultCalendar().getName();
  const sinLeer = GmailApp.getInboxUnreadCount();
  Logger.log('Listo. Calendario: ' + cal + ' · correos sin leer: ' + sinLeer);
}

function app_extra_(p) {
  switch (p.op) {
    case 'extras':     return ex_leer_();
    case 'google':     return app_google_(p);
    case 'subtareas':  return ex_escribir_(p, EX_COL_SUB, ex_textoSub_(p.subtareas));
    case 'repetir':    return ex_escribir_(p, EX_COL_REP, EX_REPETIR.indexOf(p.valor) >= 0 ? p.valor : '');
    case 'siguiente':  return ex_siguiente_(p);
    case 'mesHabitos': return ex_mesHabitos_();
    default:           return { ok: false, error: 'op desconocida: ' + p.op };
  }
}

/* ---------- subtareas y repetición ---------- */
function ex_hoja_() {
  const sh = SpreadsheetApp.getActive().getSheetByName(EX_HOJA);
  if (!sh) throw new Error('no encuentro la hoja "' + EX_HOJA + '"');
  return sh;
}

function ex_leer_() {
  const sh = ex_hoja_(), n = EX_ULTIMA - EX_PRIMERA + 1;
  const tareas = sh.getRange(EX_PRIMERA, 2, n, 1).getValues();
  const extra = sh.getRange(EX_PRIMERA, EX_COL_SUB, n, 2).getValues();
  const filas = [];
  for (let i = 0; i < n; i++) {
    if (!tareas[i][0] || (!extra[i][0] && !extra[i][1])) continue;
    filas.push({ row: EX_PRIMERA + i, sub: String(extra[i][0] || ''), rep: String(extra[i][1] || '') });
  }
  return { ok: true, version: EX_VERSION, filas: filas };
}

// Confirma que la fila sigue siendo la misma tarea (por si alguien movió filas en el Sheet).
function ex_fila_(sh, row, tarea) {
  row = Number(row);
  const txt = String(tarea || '').trim();
  if (row >= EX_PRIMERA && row <= EX_ULTIMA && String(sh.getRange(row, 2).getValue()).trim() === txt) return row;
  const col = sh.getRange(EX_PRIMERA, 2, EX_ULTIMA - EX_PRIMERA + 1, 1).getValues();
  for (let i = 0; i < col.length; i++) if (String(col[i][0]).trim() === txt) return EX_PRIMERA + i;
  throw new Error('no encuentro la tarea "' + txt + '"');
}

function ex_textoSub_(lista) {
  return (lista || []).filter(function (s) { return s && String(s.t || '').trim(); }).slice(0, 40)
    .map(function (s) { return (s.ok ? '☑ ' : '☐ ') + String(s.t).trim(); }).join('\n');
}

function ex_escribir_(p, col, valor) {
  const sh = ex_hoja_(), row = ex_fila_(sh, p.row, p.tarea);
  sh.getRange(row, col).setValue(valor);
  return { ok: true, row: row };
}

function ex_hoy_() { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }

function ex_proxima_(d, rep) {
  const n = new Date(d.getTime());
  if (rep === 'Diaria') n.setDate(n.getDate() + 1);
  else if (rep === 'Días hábiles') { do { n.setDate(n.getDate() + 1); } while (n.getDay() === 0 || n.getDay() === 6); }
  else if (rep === 'Semanal') n.setDate(n.getDate() + 7);
  else if (rep === 'Quincenal') n.setDate(n.getDate() + 14);
  else if (rep === 'Mensual') { const dia = n.getDate(); n.setDate(1); n.setMonth(n.getMonth() + 1); n.setDate(Math.min(dia, new Date(n.getFullYear(), n.getMonth() + 1, 0).getDate())); }
  else if (rep === 'Anual') n.setFullYear(n.getFullYear() + 1);
  else throw new Error('frecuencia desconocida: ' + rep);
  return n;
}

// Al completar una tarea que se repite: crea la siguiente en la primera fila libre.
// La repetición pasa a la nueva fila, así desmarcar y volver a marcar no la duplica.
function ex_siguiente_(p) {
  const sh = ex_hoja_(), row = ex_fila_(sh, p.row, p.tarea);
  const v = sh.getRange(row, 1, 1, EX_COL_REP).getValues()[0];
  const rep = String(v[EX_COL_REP - 1] || '');
  if (!rep) return { ok: true, creada: false };
  const hoy = ex_hoy_();
  let fecha = (v[9] instanceof Date) ? new Date(v[9].getTime()) : new Date(hoy.getTime());
  fecha.setHours(0, 0, 0, 0);
  do { fecha = ex_proxima_(fecha, rep); } while (fecha <= hoy);
  const col = sh.getRange(EX_PRIMERA, 2, EX_ULTIMA - EX_PRIMERA + 1, 1).getValues();
  let libre = -1;
  for (let i = 0; i < col.length; i++) if (!col[i][0]) { libre = EX_PRIMERA + i; break; }
  if (libre < 0) throw new Error('no quedan filas libres en Tareas');
  const sub = String(v[EX_COL_SUB - 1] || '').replace(/☑/g, '☐');
  // Solo columnas de datos: H, M, N y P–T son fórmulas automáticas y no se tocan.
  sh.getRange(libre, 1, 1, 7).setValues([[false, v[1], v[2], v[3], v[4], v[5], v[6]]]);
  sh.getRange(libre, 9, 1, 4).setValues([[v[8], fecha, 'Pendiente', '']]);
  sh.getRange(libre, 15).setValue(v[14]);
  sh.getRange(libre, EX_COL_SUB, 1, 2).setValues([[sub, rep]]);
  sh.getRange(row, EX_COL_REP).setValue('');
  const tz = SpreadsheetApp.getActive().getSpreadsheetTimeZone();
  return { ok: true, creada: true, row: libre, fecha: Utilities.formatDate(fecha, tz, 'yyyy-MM-dd') };
}

/* ---------- hábitos: mes nuevo ---------- */
// Guarda el resumen del mes que termina en "Historial hábitos" y deja la grilla lista para el mes actual.
function ex_mesHabitos_() {
  const ss = SpreadsheetApp.getActive(), sh = ss.getSheetByName(EX_HAB_HOJA);
  if (!sh) throw new Error('no encuentro la hoja "' + EX_HAB_HOJA + '"');
  const tz = ss.getSpreadsheetTimeZone(), hoy = ex_hoy_();
  const primero = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const actual = sh.getRange('B3').getValue();
  const nombre = Utilities.formatDate(primero, tz, 'MMMM yyyy');
  if (actual instanceof Date && actual.getFullYear() === primero.getFullYear() && actual.getMonth() === primero.getMonth()) return { ok: true, cambiado: false, mes: nombre };
  const grilla = sh.getRange(6, 1, 35, 33).getValues();   // A6:AG40
  let hist = ss.getSheetByName(EX_HAB_HISTORIAL);
  if (!hist) { hist = ss.insertSheet(EX_HAB_HISTORIAL); hist.appendRow(['Mes', 'Hábito', 'Días hechos', 'Meta (días)']); hist.setFrozenRows(1); }
  const mesAnt = actual instanceof Date ? Utilities.formatDate(actual, tz, 'MMMM yyyy') : String(actual);
  grilla.forEach(function (r) {
    if (!r[0]) return;
    const hechos = r.slice(2).filter(function (x) { return x === true; }).length;
    hist.appendRow([mesAnt, r[0], hechos, r[1]]);
  });
  grilla.forEach(function (r, i) { r.forEach(function (x, j) { if (j >= 2 && x === true) sh.getRange(6 + i, 1 + j).setValue(false); }); });
  sh.getRange('B3').setValue(primero);
  return { ok: true, cambiado: true, mes: nombre };
}

/* ---------- automatismos del Sheet (al editar a mano) ---------- */
function onOpen() {
  SpreadsheetApp.getUi().createMenu('Organizador')
    .addItem('Empezar un mes nuevo de hábitos', 'ex_menuMes')
    .addToUi();
}
function ex_menuMes() {
  const r = ex_mesHabitos_();
  SpreadsheetApp.getActive().toast(r.cambiado ? 'Listo: hábitos de ' + r.mes + ' (el mes anterior quedó en "' + EX_HAB_HISTORIAL + '")' : 'Ya estás en el mes actual');
}

function onEdit(e) {
  try {
    const sh = e.range.getSheet();
    if (sh.getName() !== EX_HOJA || e.range.getNumRows() > 1 || e.range.getNumColumns() > 1) return;
    const row = e.range.getRow(), col = e.range.getColumn();
    if (row < EX_PRIMERA || row > EX_ULTIMA) return;
    if (col === 1) {
      const hecho = e.range.getValue() === true;
      const cierre = sh.getRange(row, 12);
      if (hecho && !cierre.getValue()) cierre.setValue(new Date());
      if (!hecho) cierre.setValue('');
      if (hecho && sh.getRange(row, EX_COL_REP).getValue()) ex_siguiente_({ row: row, tarea: sh.getRange(row, 2).getValue() });
    } else if (col === 2 && e.range.getValue()) {
      const v = sh.getRange(row, 6, 1, 6).getValues()[0];   // F..K
      if (!v[0]) sh.getRange(row, 6).setValue('No');
      if (!v[1]) sh.getRange(row, 7).setValue('Sí');
      if (!v[3]) sh.getRange(row, 9).setValue('Pequeña');
      if (!v[5]) sh.getRange(row, 11).setValue('Pendiente');
    } else if (col === 4 && e.range.getValue()) {
      const cats = SpreadsheetApp.getActive().getSheetByName('Config').getRange('B5:C30').getValues();
      const c = cats.filter(function (r) { return r[0] === e.range.getValue(); })[0];
      if (c && c[1]) sh.getRange(row, 3).setValue(c[1]);
    } else if (col === 5 && e.range.getValue()) {
      const ps = SpreadsheetApp.getActive().getSheetByName('Proyectos').getRange('A5:C24').getValues();
      const p = ps.filter(function (r) { return r[0] === e.range.getValue(); })[0];
      if (p) { if (p[1]) sh.getRange(row, 3).setValue(p[1]); if (p[2]) sh.getRange(row, 4).setValue(p[2]); }
    }
  } catch (err) { /* los automatismos nunca deben bloquear la edición */ }
}

/* ---------- Google Calendar y Gmail ---------- */
function app_google_(p) {
  const tz = SpreadsheetApp.getActive().getSpreadsheetTimeZone();
  const out = { ok: true, eventos: [], correos: [], avisos: [] };
  try { out.eventos = int_eventos_(tz); } catch (err) { out.avisos.push('calendario: ' + (err && err.message || err)); }
  try { out.correos = int_correos_(tz); } catch (err) { out.avisos.push('gmail: ' + (err && err.message || err)); }
  return out;
}

function int_eventos_(tz) {
  const ini = ex_hoy_();
  const fin = new Date(ini.getTime() + INT_DIAS_CALENDARIO * 86400000);
  const eventos = [];
  CalendarApp.getAllCalendars().forEach(function (cal) {
    const id = cal.getId();
    if (cal.isHidden() || /#holiday@|#contacts@|addressbook#/.test(id)) return;
    cal.getEvents(ini, fin).forEach(function (e) {
      try { if (e.getMyStatus() === CalendarApp.GuestStatus.NO) return; } catch (x) {}
      const todoElDia = e.isAllDayEvent();
      const inicio = e.getStartTime(), termino = e.getEndTime();
      eventos.push({
        id: e.getId() + '|' + Utilities.formatDate(inicio, tz, 'yyyy-MM-dd'),
        titulo: e.getTitle() || '(sin título)',
        fecha: Utilities.formatDate(inicio, tz, 'yyyy-MM-dd'),
        inicio: todoElDia ? '' : Utilities.formatDate(inicio, tz, 'HH:mm'),
        fin: todoElDia ? '' : Utilities.formatDate(termino, tz, 'HH:mm'),
        todoElDia: todoElDia,
        lugar: e.getLocation() || '',
        calendario: cal.getName(),
        color: cal.getColor() || ''
      });
    });
  });
  eventos.sort(function (a, b) { return (a.fecha + (a.inicio || '00:00')).localeCompare(b.fecha + (b.inicio || '00:00')); });
  return eventos.slice(0, 80);
}

function int_correos_(tz) {
  const vistos = {}, correos = [];
  [[INT_GMAIL_DESTACADOS, 'destacado'], [INT_GMAIL_IMPORTANTES, 'importante']].forEach(function (b) {
    GmailApp.search(b[0], 0, INT_MAX_CORREOS).forEach(function (th) {
      const id = th.getId();
      if (vistos[id]) return;
      vistos[id] = true;
      const msgs = th.getMessages(), m = msgs[msgs.length - 1];
      correos.push({
        id: id,
        asunto: th.getFirstMessageSubject() || '(sin asunto)',
        de: String(m.getFrom()).replace(/<.*>/, '').replace(/"/g, '').trim(),
        fecha: Utilities.formatDate(m.getDate(), tz, 'yyyy-MM-dd'),
        resumen: String(m.getPlainBody() || '').replace(/\s+/g, ' ').slice(0, 140),
        link: 'https://mail.google.com/mail/u/0/#all/' + id,
        motivo: b[1]
      });
    });
  });
  return correos.slice(0, INT_MAX_CORREOS * 2);
}
