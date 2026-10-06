/**
 * Organizador BlackLine · Funciones extra para la app
 * Subtareas, tareas que se repiten, recordatorios en tu calendario, base de datos de
 * contactos (clientes, proveedores…), mes nuevo de hábitos, Google Calendar y Gmail.
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
 * Para actualizar este archivo más adelante: reemplaza todo su contenido y repite los dos pasos anteriores.
 */

const EX_VERSION = '2026-10-08';
const EX_NIVEL = 3;      // la app lo usa para saber qué funciones tiene este script
const EX_HOJA = 'Tareas';
const EX_PRIMERA = 4;
const EX_ULTIMA = 400;
const EX_COL_SUB = 21;   // U: ☑ Subtareas
const EX_COL_REP = 22;   // V: 🔁 Repetir
const EX_COL_EVT = 23;   // W: 📅 Evento (auto)
const EX_REPETIR = ['Diaria', 'Días hábiles', 'Semanal', 'Quincenal', 'Mensual', 'Anual'];
const EX_HAB_HOJA = 'Hábitos';
const EX_HAB_HISTORIAL = 'Historial hábitos';

// Recordatorios: cada tarea pendiente con fecha queda como evento en este calendario.
const EX_CAL_NOMBRE = 'Organizador BlackLine';
const EX_HORA_RECORDATORIO = '09:00';   // hora del aviso si la tarea no tiene "⏰ HH:MM" en las notas
const EX_AVISO_MINUTOS = 10;            // aviso en el teléfono, minutos antes
const EX_APP_URL = 'https://snowpv.github.io/Organizador/';

// Base de datos de contactos.
const EX_HOJA_CONTACTOS = 'Contactos';
const EX_HOJA_INTER = 'Interacciones';
const EX_CAB_CONTACTOS = ['ID', 'Tipo', 'Nombre', 'Empresa', 'Email', 'Teléfono', 'Etiquetas / intereses', 'Notas', 'Última interacción', 'Interacciones', 'Origen', 'Creado'];
const EX_CAB_INTER = ['Fecha', 'Contacto (ID)', 'Tipo', 'Detalle', 'Link', 'Clave (no editar)'];
// Solo los correos que llegan por el correo de la tienda crean contactos.
const EX_CORREO_TIENDA = 'contacto@blacklinechile.cl';
const EX_DIAS_ESCANEO_INICIAL = 90;     // la primera vez revisa 90 días hacia atrás; después, solo lo nuevo
const EX_IGNORAR_RE = /no-?reply|notific|mailer|newsletter|bounce|news@|marketing@|alerts?@|calendar-|@.*(mailchimp|sendgrid|hubspot)/i;
const EX_DOMINIOS_PERSONALES = /^(gmail|googlemail|hotmail|outlook|live|yahoo|icloud|me|msn|proton|protonmail)\./i;

// Días hacia adelante que se leen del calendario (incluye hoy).
const INT_DIAS_CALENDARIO = 7;
// Correos que la app te propone como tareas (búsquedas de Gmail).
const INT_GMAIL_DESTACADOS = 'is:starred newer_than:21d';
const INT_GMAIL_IMPORTANTES = 'in:inbox is:important is:unread newer_than:3d -category:promotions -category:social';
const INT_MAX_CORREOS = 10;

/**
 * Ejecutar desde el editor la primera vez y cada vez que actualices este archivo:
 * da los permisos, crea el calendario de recordatorios y programa las tareas automáticas.
 */
function autorizarExtras() {
  const cal = ex_calendario_();
  const sinLeer = GmailApp.getInboxUnreadCount();
  ex_baseHojas_();
  ex_instalarTriggers_();
  Logger.log('Listo. Calendario de recordatorios: ' + cal.getName() + ' · correos sin leer: ' + sinLeer + ' · tareas automáticas programadas.');
}

function app_extra_(p) {
  switch (p.op) {
    case 'extras':     return ex_leer_();
    case 'google':     return app_google_(p);
    case 'subtareas':  return ex_escribir_(p, EX_COL_SUB, ex_textoSub_(p.subtareas));
    case 'repetir':    return ex_escribir_(p, EX_COL_REP, EX_REPETIR.indexOf(p.valor) >= 0 ? p.valor : '');
    case 'siguiente':  return ex_siguiente_(p);
    case 'mesHabitos': return ex_mesHabitos_();
    case 'sinc':       return ex_sincCalendario_();
    case 'base':       return ex_leerBase_();
    case 'contacto':   return ex_guardarContacto_(p.contacto || {});
    case 'nota':       return ex_nota_(p);
    case 'escanear':   return ex_escanearBase_();
    default:           return { ok: false, error: 'op desconocida: ' + p.op };
  }
}

/* ---------- fechas (siempre en la zona horaria del Sheet) ---------- */
function ex_tz_() { return SpreadsheetApp.getActive().getSpreadsheetTimeZone(); }
function ex_ymd_(d, tz) { return Utilities.formatDate(d, tz || ex_tz_(), 'yyyy-MM-dd'); }
function ex_hoyYmd_(tz) { return ex_ymd_(new Date(), tz); }
// Fecha "pura" para sumar días sin problemas de horario: mediodía UTC.
function ex_dia_(ymd) { const p = ymd.split('-'); return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2], 12)); }
function ex_diaYmd_(d) { return d.getUTCFullYear() + '-' + ('0' + (d.getUTCMonth() + 1)).slice(-2) + '-' + ('0' + d.getUTCDate()).slice(-2); }
function ex_aFecha_(ymd, tz, hhmm) { return Utilities.parseDate(ymd + ' ' + (hhmm || '00:00'), tz || ex_tz_(), 'yyyy-MM-dd HH:mm'); }
function ex_norm_(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }

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
  return { ok: true, version: EX_VERSION, nivel: EX_NIVEL, filas: filas, calendario: EX_CAL_NOMBRE };
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

// Recibe y devuelve fechas "puras" (mediodía UTC).
function ex_proxima_(d, rep) {
  const n = new Date(d.getTime());
  if (rep === 'Diaria') n.setUTCDate(n.getUTCDate() + 1);
  else if (rep === 'Días hábiles') { do { n.setUTCDate(n.getUTCDate() + 1); } while (n.getUTCDay() === 0 || n.getUTCDay() === 6); }
  else if (rep === 'Semanal') n.setUTCDate(n.getUTCDate() + 7);
  else if (rep === 'Quincenal') n.setUTCDate(n.getUTCDate() + 14);
  else if (rep === 'Mensual') { const dia = n.getUTCDate(); n.setUTCDate(1); n.setUTCMonth(n.getUTCMonth() + 1); n.setUTCDate(Math.min(dia, new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth() + 1, 0)).getUTCDate())); }
  else if (rep === 'Anual') n.setUTCFullYear(n.getUTCFullYear() + 1);
  else throw new Error('frecuencia desconocida: ' + rep);
  return n;
}

// Al completar una tarea que se repite: crea la siguiente en la primera fila libre.
// La repetición pasa a la nueva fila, así desmarcar y volver a marcar no la duplica.
function ex_siguiente_(p) {
  const sh = ex_hoja_(), row = ex_fila_(sh, p.row, p.tarea), tz = ex_tz_();
  const v = sh.getRange(row, 1, 1, EX_COL_REP).getValues()[0];
  const rep = String(v[EX_COL_REP - 1] || '');
  if (!rep) return { ok: true, creada: false };
  const hoy = ex_hoyYmd_(tz);
  let fecha = ex_dia_((v[9] instanceof Date) ? ex_ymd_(v[9], tz) : hoy);
  do { fecha = ex_proxima_(fecha, rep); } while (ex_diaYmd_(fecha) <= hoy);
  const ymd = ex_diaYmd_(fecha);
  const col = sh.getRange(EX_PRIMERA, 2, EX_ULTIMA - EX_PRIMERA + 1, 1).getValues();
  let libre = -1;
  for (let i = 0; i < col.length; i++) if (!col[i][0]) { libre = EX_PRIMERA + i; break; }
  if (libre < 0) throw new Error('no quedan filas libres en Tareas');
  const sub = String(v[EX_COL_SUB - 1] || '').replace(/☑/g, '☐');
  // Solo columnas de datos: H, M, N y P–T son fórmulas automáticas y no se tocan.
  sh.getRange(libre, 1, 1, 7).setValues([[false, v[1], v[2], v[3], v[4], v[5], v[6]]]);
  sh.getRange(libre, 9, 1, 4).setValues([[v[8], ex_aFecha_(ymd, tz), 'Pendiente', '']]);
  sh.getRange(libre, 15).setValue(v[14]);
  sh.getRange(libre, EX_COL_SUB, 1, 3).setValues([[sub, rep, '']]);
  sh.getRange(row, EX_COL_REP).setValue('');
  return { ok: true, creada: true, row: libre, fecha: ymd };
}

/* ---------- recordatorios en el calendario ---------- */
function ex_calendario_() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('EX_CAL_ID');
  let cal = id ? CalendarApp.getCalendarById(id) : null;
  if (!cal) {
    cal = CalendarApp.getCalendarsByName(EX_CAL_NOMBRE)[0] || CalendarApp.createCalendar(EX_CAL_NOMBRE, { summary: 'Tareas del Organizador BlackLine', color: CalendarApp.Color.PURPLE });
    props.setProperty('EX_CAL_ID', cal.getId());
  }
  return cal;
}

function ex_firma_(s) {
  return Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, s, Utilities.Charset.UTF_8)).slice(0, 12);
}

function ex_descripcion_(r) {
  const partes = [[r[2], r[3], r[4] ? '🚀 ' + r[4] : ''].filter(String).join(' · ')];
  if (r[EX_COL_SUB - 1]) partes.push('Pasos:\n' + r[EX_COL_SUB - 1]);
  if (r[14]) partes.push('Notas: ' + r[14]);
  partes.push('Abrir el organizador: ' + EX_APP_URL);
  return partes.join('\n\n');
}

// Crea, actualiza o borra un evento por tarea. Se ejecuta cada hora y cuando la app cambia algo.
function ex_sincCalendario_() {
  const sh = ex_hoja_(), tz = ex_tz_(), n = EX_ULTIMA - EX_PRIMERA + 1;
  const v = sh.getRange(EX_PRIMERA, 1, n, EX_COL_EVT).getValues();
  const cal = ex_calendario_();
  const colores = { '1': CalendarApp.EventColor.RED, '2': CalendarApp.EventColor.BLUE, '3': CalendarApp.EventColor.YELLOW, '4': CalendarApp.EventColor.GRAY };
  const r0 = { ok: true, creados: 0, actualizados: 0, borrados: 0, calendario: cal.getName() };
  v.forEach(function (r, i) {
    const row = EX_PRIMERA + i, tarea = String(r[1] || '').trim();
    const guardado = String(r[EX_COL_EVT - 1] || '').split('::'), evId = guardado[0], firmaAnt = guardado[1];
    const activa = tarea && r[0] !== true && r[9] instanceof Date;
    if (!activa) {
      if (evId) {
        try { const e = cal.getEventById(evId); if (e) e.deleteEvent(); } catch (x) {}
        sh.getRange(row, EX_COL_EVT).setValue(''); r0.borrados++;
      }
      return;
    }
    const hora = String(r[14] || '').match(/⏰\s*(\d{1,2}):(\d{2})/);
    const ini = ex_aFecha_(ex_ymd_(r[9], tz), tz, hora ? ('0' + hora[1]).slice(-2) + ':' + hora[2] : EX_HORA_RECORDATORIO);
    const fin = new Date(ini.getTime() + 15 * 60000);
    const q = String(r[7] || '').charAt(0);
    const titulo = (q === '1' ? '🔥 ' : '📋 ') + tarea;
    const desc = ex_descripcion_(r);
    const firma = ex_firma_(titulo + '|' + ini.getTime() + '|' + desc);
    if (evId && firma === firmaAnt) return;
    let e = null;
    if (evId) { try { e = cal.getEventById(evId); } catch (x) {} }
    if (!e) {
      e = cal.createEvent(titulo, ini, fin, { description: desc });
      e.removeAllReminders(); e.addPopupReminder(EX_AVISO_MINUTOS);
      r0.creados++;
    } else {
      e.setTitle(titulo); e.setTime(ini, fin); e.setDescription(desc);
      r0.actualizados++;
    }
    try { if (colores[q]) e.setColor(colores[q]); } catch (x) {}
    sh.getRange(row, EX_COL_EVT).setValue(e.getId() + '::' + firma);
  });
  return r0;
}

/* ---------- base de datos de contactos ---------- */
function ex_baseHojas_() {
  const ss = SpreadsheetApp.getActive();
  let cs = ss.getSheetByName(EX_HOJA_CONTACTOS), is = ss.getSheetByName(EX_HOJA_INTER);
  if (!cs) { cs = ss.insertSheet(EX_HOJA_CONTACTOS); cs.appendRow(EX_CAB_CONTACTOS); cs.setFrozenRows(1); }
  if (!is) { is = ss.insertSheet(EX_HOJA_INTER); is.appendRow(EX_CAB_INTER); is.setFrozenRows(1); }
  return { cs: cs, is: is };
}

function ex_filasContactos_(cs) {
  const n = cs.getLastRow() - 1;
  return n > 0 ? cs.getRange(2, 1, n, EX_CAB_CONTACTOS.length).getValues() : [];
}

function ex_leerBase_() {
  const b = ex_baseHojas_(), tz = ex_tz_();
  const f = function (d) { return d instanceof Date ? ex_ymd_(d, tz) : ''; };
  const contactos = ex_filasContactos_(b.cs).filter(function (r) { return r[0]; }).map(function (r) {
    return { id: String(r[0]), tipo: r[1] || 'Por clasificar', nombre: r[2], empresa: r[3], email: r[4], telefono: String(r[5] || ''), etiquetas: r[6], notas: r[7], ultima: f(r[8]), n: Number(r[9]) || 0, origen: r[10], creado: f(r[11]) };
  });
  const ni = b.is.getLastRow() - 1;
  const inter = (ni > 0 ? b.is.getRange(2, 1, ni, 5).getValues() : []).filter(function (r) { return r[1]; })
    .map(function (r) { return { fecha: f(r[0]), id: String(r[1]), tipo: r[2], detalle: r[3], link: r[4] }; })
    .sort(function (a, b2) { return b2.fecha.localeCompare(a.fecha); }).slice(0, 600);
  return { ok: true, contactos: contactos, interacciones: inter };
}

function ex_guardarContacto_(c) {
  const b = ex_baseHojas_(), filas = ex_filasContactos_(b.cs);
  const email = String(c.email || '').trim().toLowerCase();
  let id = String(c.id || '').trim();
  let i = id ? filas.findIndex(function (r) { return String(r[0]) === id; }) : -1;
  if (i < 0 && email) i = filas.findIndex(function (r) { return String(r[0]) === email || String(r[4]).toLowerCase() === email; });
  const tel = function (t) { return t ? "'" + String(t).replace(/^'/, '') : ''; };
  if (i >= 0) {
    // Solo se cambian los campos que vienen; el resto queda como estaba.
    const r = filas[i], campo = function (k, j, f) { return c[k] === undefined ? r[j] : (f ? f(c[k]) : c[k]); };
    id = String(r[0]);
    b.cs.getRange(i + 2, 2, 1, 7).setValues([[campo('tipo', 1), campo('nombre', 2), campo('empresa', 3), c.email === undefined ? r[4] : email, campo('telefono', 5, tel), campo('etiquetas', 6), campo('notas', 7)]]);
  } else {
    const datos = [c.tipo || 'Por clasificar', c.nombre || '', c.empresa || '', email, tel(c.telefono), c.etiquetas || '', c.notas || ''];
    id = email || ('c-' + Date.now());
    b.cs.appendRow([id].concat(datos, ['', 0, '✍️ Manual', new Date()]));
  }
  return { ok: true, id: id };
}

function ex_nota_(p) {
  const b = ex_baseHojas_(), texto = String(p.texto || '').trim();
  if (!p.id || !texto) throw new Error('falta el contacto o el texto');
  b.is.appendRow([new Date(), String(p.id), '📝 Nota', texto, '', 'n:' + Date.now()]);
  ex_recalcular_(b.cs, b.is);
  return { ok: true };
}

function ex_direcciones_(s) {
  const out = [], re = /(?:"?([^"<,]*)"?\s*<([^>]+)>)|([^\s,<>"]+@[^\s,<>"]+)/g;
  let m;
  while ((m = re.exec(String(s || '')))) out.push({ nombre: String(m[1] || '').trim(), email: String(m[2] || m[3] || '').trim().toLowerCase() });
  return out;
}

function ex_empresa_(email) {
  const dom = String(email).split('@')[1] || '';
  if (!dom || EX_DOMINIOS_PERSONALES.test(dom)) return '';
  const base = dom.split('.')[0];
  return base.charAt(0).toUpperCase() + base.slice(1);
}

function ex_adivinarTipo_(texto) {
  const t = ex_norm_(texto);
  if (/factura|orden de compra|\boc\b|despacho|distribuid|importador|lista de precios|proforma|invoice|purchase order|guia de despacho|nota de credito/.test(t)) return 'Proveedor';
  if (/bicicleta|\bbici|talla|test ride|mantencion|reparacion|precio|disponib|comprar|reserva|consulta|levo|ebike|e-bike|cotizar/.test(t)) return 'Cliente';
  return 'Por clasificar';
}

// Datos de un formulario web o de un correo reenviado: "Nombre: …", "Email: …", "Teléfono: …", "De: Nombre <correo>".
function ex_datosCorreo_(texto) {
  const t = String(texto || ''), d = {};
  const m1 = t.match(/(?:^|\n)\s*\*?(?:nombre(?: completo)?|name)\*?\s*:\s*([^\n]{2,60})/i);
  const m2 = t.match(/(?:e-?mail|correo(?: electr[oó]nico)?)\*?\s*:\s*<?([^\s<>]+@[^\s<>]+?)>?(?:\s|$)/i);
  const m3 = t.match(/(?:tel[eé]fono|celular|fono|m[oó]vil|phone|whatsapp)\*?\s*:\s*(\+?[\d][\d\s().-]{6,18}\d)/i);
  const m4 = t.match(/(?:^|\n)\s*(?:De|From)\s*:\s*([^\n]+)/);
  if (m4) { const a = ex_direcciones_(m4[1])[0]; if (a) { d.email = a.email; d.nombre = a.nombre; } }
  if (m2) d.email = m2[1].toLowerCase();
  if (m1) d.nombre = m1[1].trim();
  if (m3) d.telefono = m3[1].replace(/[^\d+]/g, '');
  return d;
}

// Limpia lo que haya armado una versión anterior que leía todo tu correo personal (se hace una sola vez).
function ex_purgarAntiguos_(b) {
  const filas = ex_filasContactos_(b.cs);
  const quedan = filas.filter(function (r) { return r[0] && ['✉️ Gmail', '📅 Calendario'].indexOf(String(r[10])) < 0; });
  if (quedan.length === filas.length) return;
  const ids = {};
  quedan.forEach(function (r) { ids[String(r[0])] = true; });
  const ni = b.is.getLastRow() - 1;
  const inter = (ni > 0 ? b.is.getRange(2, 1, ni, EX_CAB_INTER.length).getValues() : []).filter(function (r) { return ids[String(r[1])]; });
  if (filas.length) b.cs.getRange(2, 1, filas.length, EX_CAB_CONTACTOS.length).clearContent();
  if (ni > 0) b.is.getRange(2, 1, ni, EX_CAB_INTER.length).clearContent();
  if (quedan.length) b.cs.getRange(2, 1, quedan.length, EX_CAB_CONTACTOS.length).setValues(quedan);
  if (inter.length) b.is.getRange(2, 1, inter.length, EX_CAB_INTER.length).setValues(inter);
}

// Arma la base de contactos con los correos que llegan por contacto@blacklinechile.cl (y tus respuestas a esas
// personas). Las reuniones del calendario y las tareas completadas se suman al historial de contactos que ya existen.
function ex_escanearBase_() {
  const b = ex_baseHojas_(), tz = ex_tz_(), props = PropertiesService.getScriptProperties();
  const yo = String(Session.getEffectiveUser().getEmail() || '').toLowerCase();
  const tienda = EX_CORREO_TIENDA.toLowerCase();
  const primera = !props.getProperty('EX_ESCANEO_TIENDA');
  if (primera) ex_purgarAntiguos_(b);
  const dias = primera ? EX_DIAS_ESCANEO_INICIAL : 4;
  const desde = Date.now() - dias * 86400000;
  const contactos = {};
  ex_filasContactos_(b.cs).forEach(function (r, i) { if (r[0]) contactos[String(r[0])] = { tipo: r[1], nombre: r[2], empresa: r[3], tel: String(r[5] || ''), fila: i + 2 }; });
  const ni = b.is.getLastRow() - 1;
  const claves = {};
  (ni > 0 ? b.is.getRange(2, 6, ni, 1).getValues() : []).forEach(function (r) { claves[String(r[0])] = true; });
  const nuevosC = [], nuevasI = [], telefonos = [];
  // crear = false: solo se usa si el contacto ya existe (no agrega gente nueva).
  const asegurar = function (email, nombre, pista, crear, tel) {
    email = String(email || '').trim().toLowerCase();
    if (!email || email === yo || email === tienda || EX_IGNORAR_RE.test(email)) return null;
    const c = contactos[email];
    if (c) {
      if (c.tipo === 'Ignorar') return null;
      if (tel && !c.tel) { c.tel = tel; if (c.fila) telefonos.push([c.fila, tel]); else c.nuevo[5] = "'" + tel; }
      return email;
    }
    if (!crear) return null;
    const fila = [email, ex_adivinarTipo_(pista), nombre || email.split('@')[0], ex_empresa_(email), email, tel ? "'" + tel : '', '', '', '', 0, '✉️ ' + tienda, new Date()];
    contactos[email] = { tipo: fila[1], nombre: fila[2], empresa: fila[3], tel: tel || '', nuevo: fila };
    nuevosC.push(fila);
    return email;
  };
  const registrar = function (clave, fecha, id, tipo, detalle, link) {
    if (!id || claves[clave]) return;
    claves[clave] = true;
    nuevasI.push([fecha, id, tipo, detalle, link, clave]);
  };

  // Gmail: hilos donde participa el correo de la tienda
  const q = '{to:' + tienda + ' cc:' + tienda + ' from:' + tienda + ' deliveredto:' + tienda + '} newer_than:' + dias + 'd';
  GmailApp.search(q, 0, 100).forEach(function (th) {
    const link = 'https://mail.google.com/mail/u/0/#all/' + th.getId();
    th.getMessages().forEach(function (m) {
      const fecha = m.getDate();
      if (fecha.getTime() < desde) return;
      const asunto = m.getSubject() || '(sin asunto)';
      const de = ex_direcciones_(m.getFrom());
      const deMi = de.some(function (d) { return d.email === yo; });
      const deTienda = de.some(function (d) { return d.email === tienda; });
      const cuerpo = String(m.getPlainBody() || '');
      const pista = asunto + ' ' + cuerpo.slice(0, 600);
      if (deMi) {
        // Tus respuestas: se suman al historial de quienes ya están en la base.
        ex_direcciones_(m.getTo() + ',' + m.getCc()).forEach(function (d) {
          registrar('m:' + m.getId() + ':' + d.email, fecha, asegurar(d.email, d.nombre, pista, false), '✉️ Correo enviado', asunto, link);
        });
        return;
      }
      let cab = (m.getTo() + ',' + m.getCc() + ',' + m.getFrom()).toLowerCase();
      try { cab += ',' + String(m.getHeader('Delivered-To') || '') + ',' + String(m.getHeader('X-Forwarded-To') || '') + ',' + String(m.getHeader('X-Forwarded-For') || ''); } catch (x) {}
      if (cab.toLowerCase().indexOf(tienda) < 0) return;
      const datos = ex_datosCorreo_(cuerpo);
      let personas = de;
      if (deTienda) {
        // Formulario web o reenvío manual: la persona real está en "Responder a" o en el texto del correo.
        const resp = ex_direcciones_(m.getReplyTo()).filter(function (d) { return d.email !== tienda; });
        personas = resp.length ? resp : (datos.email ? [{ email: datos.email, nombre: datos.nombre || '' }] : []);
      }
      personas.forEach(function (d) {
        const id = asegurar(d.email, d.nombre || datos.nombre, pista, true, datos.email === d.email || deTienda ? datos.telefono : '');
        registrar('m:' + m.getId() + ':' + d.email, fecha, id, '✉️ Correo recibido', asunto, link);
      });
    });
  });

  // Calendario: reuniones con contactos que ya están en la base
  const calId = props.getProperty('EX_CAL_ID'), ahora = new Date();
  CalendarApp.getAllCalendars().forEach(function (cal) {
    const id = cal.getId();
    if (id === calId || cal.isHidden() || /#holiday@|#contacts@|addressbook#/.test(id)) return;
    cal.getEvents(new Date(desde), ahora).forEach(function (e) {
      e.getGuestList().forEach(function (g) {
        const cid = asegurar(g.getEmail(), '', '', false);
        registrar('e:' + e.getId() + ':' + ex_ymd_(e.getStartTime(), tz) + ':' + cid, e.getStartTime(), cid, '📅 Reunión', e.getTitle(), '');
      });
    });
  });

  // Tareas completadas que nombran a un contacto (nombre y apellido, o empresa)
  const claveNombre = Object.keys(contactos).map(function (id) {
    const c = contactos[id];
    const k = [];
    if (c.nombre && String(c.nombre).indexOf(' ') > 0) k.push(ex_norm_(c.nombre));
    if (c.empresa && String(c.empresa).trim().length >= 3) k.push(ex_norm_(c.empresa).trim());
    return { id: id, k: k, ignorar: c.tipo === 'Ignorar' };
  }).filter(function (x) { return x.k.length && !x.ignorar; });
  const tv = ex_hoja_().getRange(EX_PRIMERA, 1, EX_ULTIMA - EX_PRIMERA + 1, 12).getValues();
  tv.forEach(function (r, i) {
    if (r[0] !== true || !r[1] || !(r[11] instanceof Date) || r[11].getTime() < desde) return;
    const t = ex_norm_(r[1]);
    claveNombre.forEach(function (x) {
      if (x.k.some(function (k) { return new RegExp('(^|[^a-z0-9])' + k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '([^a-z0-9]|$)').test(t); })) registrar('t:' + (EX_PRIMERA + i) + ':' + x.id, r[11], x.id, '✅ Tarea', r[1], '');
    });
  });

  telefonos.forEach(function (x) { b.cs.getRange(x[0], 6).setValue("'" + x[1]); });
  if (nuevosC.length) b.cs.getRange(b.cs.getLastRow() + 1, 1, nuevosC.length, EX_CAB_CONTACTOS.length).setValues(nuevosC);
  if (nuevasI.length) b.is.getRange(b.is.getLastRow() + 1, 1, nuevasI.length, EX_CAB_INTER.length).setValues(nuevasI);
  ex_recalcular_(b.cs, b.is);
  props.setProperty('EX_ESCANEO_TIENDA', new Date().toISOString());
  return { ok: true, nuevos: nuevosC.length, interacciones: nuevasI.length, dias: dias };
}

// Recalcula "Última interacción" e "Interacciones" de cada contacto.
function ex_recalcular_(cs, is) {
  const nc = cs.getLastRow() - 1;
  if (nc < 1) return;
  const ids = cs.getRange(2, 1, nc, 1).getValues();
  const agg = {}, ni = is.getLastRow() - 1;
  (ni > 0 ? is.getRange(2, 1, ni, 2).getValues() : []).forEach(function (r) {
    if (!(r[0] instanceof Date)) return;
    const a = agg[String(r[1])] = agg[String(r[1])] || { u: null, n: 0 };
    a.n++;
    if (!a.u || r[0] > a.u) a.u = r[0];
  });
  cs.getRange(2, 9, nc, 2).setValues(ids.map(function (r) { const a = agg[String(r[0])]; return a ? [a.u, a.n] : ['', 0]; }));
}

/* ---------- tareas automáticas (cada hora y cada 6 horas) ---------- */
function ex_instalarTriggers_() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (['ex_tareaHoraria', 'ex_tareaBase'].indexOf(t.getHandlerFunction()) >= 0) ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('ex_tareaHoraria').timeBased().everyHours(1).create();
  ScriptApp.newTrigger('ex_tareaBase').timeBased().everyHours(6).create();
}
function ex_conLock_(fn) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) return;
  try { fn(); } finally { lock.releaseLock(); }
}
function ex_tareaHoraria() { ex_conLock_(ex_sincCalendario_); }
function ex_tareaBase() { ex_conLock_(ex_escanearBase_); }

/* ---------- hábitos: mes nuevo ---------- */
// Guarda el resumen del mes que termina en "Historial hábitos" y deja la grilla lista para el mes actual.
function ex_mesHabitos_() {
  const ss = SpreadsheetApp.getActive(), sh = ss.getSheetByName(EX_HAB_HOJA);
  if (!sh) throw new Error('no encuentro la hoja "' + EX_HAB_HOJA + '"');
  const tz = ss.getSpreadsheetTimeZone();
  const mesYmd = ex_hoyYmd_(tz).slice(0, 8) + '01';
  const primero = ex_aFecha_(mesYmd, tz);
  const actual = sh.getRange('B3').getValue();
  const nombre = Utilities.formatDate(primero, tz, 'MMMM yyyy');
  if (actual instanceof Date && ex_ymd_(actual, tz).slice(0, 7) === mesYmd.slice(0, 7)) return { ok: true, cambiado: false, mes: nombre };
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
    .addItem('Actualizar recordatorios del calendario', 'ex_menuSinc')
    .addItem('Actualizar base de contactos', 'ex_menuBase')
    .addToUi();
}
function ex_menuMes() {
  const r = ex_mesHabitos_();
  SpreadsheetApp.getActive().toast(r.cambiado ? 'Listo: hábitos de ' + r.mes + ' (el mes anterior quedó en "' + EX_HAB_HISTORIAL + '")' : 'Ya estás en el mes actual');
}
function ex_menuSinc() {
  const r = ex_sincCalendario_();
  SpreadsheetApp.getActive().toast('Recordatorios: ' + r.creados + ' nuevos, ' + r.actualizados + ' actualizados, ' + r.borrados + ' borrados');
}
function ex_menuBase() {
  const r = ex_escanearBase_();
  SpreadsheetApp.getActive().toast('Base de contactos: ' + r.nuevos + ' contactos nuevos, ' + r.interacciones + ' interacciones');
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

/* ---------- Google Calendar y Gmail (sugerencias de tareas) ---------- */
function app_google_(p) {
  const tz = ex_tz_();
  const out = { ok: true, eventos: [], correos: [], avisos: [] };
  try { out.eventos = int_eventos_(tz); } catch (err) { out.avisos.push('calendario: ' + (err && err.message || err)); }
  try { out.correos = int_correos_(tz); } catch (err) { out.avisos.push('gmail: ' + (err && err.message || err)); }
  return out;
}

function int_eventos_(tz) {
  const ini = ex_aFecha_(ex_hoyYmd_(tz), tz);
  const fin = new Date(ini.getTime() + INT_DIAS_CALENDARIO * 86400000);
  const propio = PropertiesService.getScriptProperties().getProperty('EX_CAL_ID');
  const eventos = [];
  CalendarApp.getAllCalendars().forEach(function (cal) {
    const id = cal.getId();
    // El calendario de recordatorios son tus propias tareas: no se sugieren de vuelta.
    if (id === propio || cal.isHidden() || /#holiday@|#contacts@|addressbook#/.test(id)) return;
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
