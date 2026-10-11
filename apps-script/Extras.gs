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

const EX_VERSION = '2026-10-20';
const EX_NIVEL = 11;      // la app lo usa para saber qué funciones tiene este script
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
const EX_IGNORAR_RE = /no-?reply|no-?responder|notific|mailer|newsletter|bounce|news@|marketing@|alerts?@|calendar-|ofertas@|promo|mensajeria@|transferencias@|serviciodetransferencias|facturacion@|factura|boleta|cobranza|recordatorios@|dte|@.*(mailchimp|sendgrid|hubspot|shopifyemail|mercadopago|mercadolibre|facebookmail|instagram|linkedin|tiktok|google\.com|apple\.com|microsoft|amazon|paypal|bci\.cl|santander|bancochile|bancoestado|scotiabank|itau|bancofalabella|bancoripley|bice|security\.cl|transbank|webpay|flow\.cl|khipu|entel|movistar|claro\.cl|wom\.cl|vtr|sii\.cl|duemint|desis|bsale)/i;
// Negociaciones (pipeline de ventas).
const EX_HOJA_NEG = 'Negociaciones';
const EX_CAB_NEG = ['ID', 'Negociación', 'Contacto (ID)', 'Etapa', 'Valor ($)', 'Producto / interés', 'Creada', 'Cierre esperado', 'Próxima acción', 'Fecha próxima acción', 'Estado', 'Motivo de pérdida', 'Notas', 'Historial de etapas', 'Última actividad', 'Origen'];
const EX_CAMPOS_NEG = { titulo: 2, contacto: 3, valor: 5, producto: 6, cierre: 8, proxima: 9, fechaProx: 10, motivo: 12, notas: 13, origen: 16 };
// WhatsApp Business (mensajes que llegan desde el puente: Meta → Cloudflare Worker → este script).
const EX_HOJA_WA = 'WhatsApp';
const EX_CAB_WA = ['Fecha', 'Dirección', 'Teléfono', 'Nombre', 'Mensaje', 'Tipo', 'Contacto (ID)', 'ID mensaje'];
const EX_WA_INTENCION = /precio|valor|cuanto|cotiz|disponib|stock|talla|test|probar|cuota|comprar|venden|tienen|mantencion|reserv|levo|turbo|vado|bici|ebike|e-bike/;
const EX_WA_MODELOS = /(turbo\s*levo\s*sl|turbo\s*levo|levo\s*sl|levo|turbo\s*vado\s*sl|turbo\s*vado|vado|turbo\s*como|como\s*sl|turbo\s*creo|creo|kenevo|stumpjumper\s*evo|stumpjumper|epic\s*evo|epic|chisel|rockhopper|tarmac|roubaix|diverge|allez|status|enduro)/i;
// Agente de ventas con IA (Claude). La clave va en Configuración del proyecto → Propiedades del script:
// ANTHROPIC_API_KEY = tu clave de console.anthropic.com. Opcional: AGENTE_MODELO para usar otro modelo
// (por ejemplo claude-sonnet-5-5 o claude-opus-5-5, más capaces y más caros).
const EX_AG_MODELO = 'claude-haiku-5-5';
const EX_AG_ESPERA_MIN = 3;        // espera a que la conversación se calme antes de analizarla
const EX_AG_MAX_POR_RONDA = 6;     // conversaciones por ronda (cada 10 minutos)
const EX_HOJA_AG = 'Agente';
const EX_CAB_AG = ['Fecha', 'Contacto (ID)', 'Nombre', 'Resumen', 'Temperatura', 'Cambios aplicados', 'Idea de respuesta'];
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
  UrlFetchApp.fetch('https://api.anthropic.com/v1/models', { muteHttpExceptions: true });   // pide el permiso para conectarse a Claude
  Logger.log('Listo. Calendario de recordatorios: ' + cal.getName() + ' · correos sin leer: ' + sinLeer + ' · tareas automáticas programadas.');
}

// Cambia la cuenta de Google que usa el organizador: correos, calendario y recordatorios.
// Ejecútala estando conectado con la cuenta que quieres usar (por ejemplo, la de la tienda) y luego
// crea una implementación nueva (Implementar → Nueva implementación) con esa misma cuenta.
function usarEstaCuenta() {
  const props = PropertiesService.getScriptProperties(), cuenta = Session.getEffectiveUser().getEmail();
  props.deleteProperty('EX_CAL_ID');           // el calendario de recordatorios se crea en esta cuenta
  props.deleteProperty('EX_ESCANEO_TIENDA');   // la base vuelve a revisar los correos (ahora de esta cuenta)
  props.setProperty('EX_CUENTA', cuenta);      // las tareas automáticas de la cuenta anterior se apagan solas
  autorizarExtras();
  Logger.log('Listo: el organizador ahora usa ' + cuenta + '. Falta: Implementar → Nueva implementación → Aplicación web, y pegar el link nuevo en la app.');
}
// Si el organizador se pasó a otra cuenta, las tareas automáticas de esta cuenta se borran y no hacen nada.
function ex_cuentaVigente_() {
  const c = PropertiesService.getScriptProperties().getProperty('EX_CUENTA');
  if (!c || c === Session.getEffectiveUser().getEmail()) return true;
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (['ex_tareaHoraria', 'ex_tareaBase', 'ex_tareaAgente'].indexOf(t.getHandlerFunction()) >= 0) ScriptApp.deleteTrigger(t);
  });
  return false;
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
    case 'negocios':   return ex_leerNegocios_();
    case 'negocio':    return ex_guardarNegocio_(p.negocio || {});
    case 'negocioNota': return ex_notaNegocio_(p);
    case 'whatsapp':   return ex_whatsapp_(p);
    case 'agente':     return ex_agente_(p.id);
    case 'importarChat': return ex_importarChat_(p);
    case 'bsale':      return ex_bsale_(p);
    case 'asistente':  return ex_asistente_(p);
    case 'instagram':  return ex_instagram_(p);
    case 'contenido':  return ex_contenido_(p);
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
  const pr = PropertiesService.getScriptProperties();
  return { ok: true, version: EX_VERSION, nivel: EX_NIVEL, filas: filas, calendario: EX_CAL_NOMBRE, wa: pr.getProperty('EX_WA_ULTIMO') || '',
    bsale: { activo: !!pr.getProperty('BSALE_TOKEN'), sinc: pr.getProperty('EX_BSALE_SINC') || '' },
    instagram: { activo: !!pr.getProperty('IG_TOKEN'), usuario: pr.getProperty('IG_USUARIO') || '', sinc: pr.getProperty('EX_IG_SINC') || '' },
    agente: { activo: !!pr.getProperty('ANTHROPIC_API_KEY'), modelo: pr.getProperty('AGENTE_MODELO') || EX_AG_MODELO, ultimo: pr.getProperty('EX_AG_ULTIMO') || '' } };
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
  const inter = (ni > 0 ? b.is.getRange(2, 1, ni, 6).getValues() : []).filter(function (r) { return r[1]; })
    .map(function (r) { const neg = String(r[5]).match(/^d:([^:]+):/); return { fecha: f(r[0]), id: String(r[1]), tipo: r[2], detalle: r[3], link: r[4], neg: neg ? neg[1] : '' }; })
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
// Saca de la base los correos automáticos (bancos, pagos, redes sociales, facturas) que hayan entrado antes del filtro.
function ex_limpiarAutomaticos_(b) {
  const filas = ex_filasContactos_(b.cs);
  const quedan = filas.filter(function (r) { return r[0] && !(String(r[10]).indexOf('✉️') === 0 && EX_IGNORAR_RE.test(String(r[0]))); });
  if (quedan.length === filas.length) return 0;
  const ids = {}; quedan.forEach(function (r) { ids[String(r[0])] = true; });
  const ni = b.is.getLastRow() - 1;
  const inter = (ni > 0 ? b.is.getRange(2, 1, ni, EX_CAB_INTER.length).getValues() : []).filter(function (r) { return !String(r[1]).match(/@/) || ids[String(r[1])]; });
  b.cs.getRange(2, 1, filas.length, EX_CAB_CONTACTOS.length).clearContent();
  if (ni > 0) b.is.getRange(2, 1, ni, EX_CAB_INTER.length).clearContent();
  if (quedan.length) b.cs.getRange(2, 1, quedan.length, EX_CAB_CONTACTOS.length).setValues(quedan);
  if (inter.length) b.is.getRange(2, 1, inter.length, EX_CAB_INTER.length).setValues(inter);
  return filas.length - quedan.length;
}
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
  ex_limpiarAutomaticos_(b);
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

/* ---------- negociaciones ---------- */
function ex_hojaNeg_() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(EX_HOJA_NEG);
  if (!sh) { sh = ss.insertSheet(EX_HOJA_NEG); sh.appendRow(EX_CAB_NEG); sh.setFrozenRows(1); }
  return sh;
}

function ex_filasNeg_(sh) {
  const n = sh.getLastRow() - 1;
  return n > 0 ? sh.getRange(2, 1, n, EX_CAB_NEG.length).getValues() : [];
}

function ex_leerNegocios_() {
  const tz = ex_tz_(), f = function (d) { return d instanceof Date ? ex_ymd_(d, tz) : (d ? String(d) : ''); };
  const negocios = ex_filasNeg_(ex_hojaNeg_()).filter(function (r) { return r[0]; }).map(function (r) {
    return { id: String(r[0]), titulo: r[1], contacto: String(r[2] || ''), etapa: r[3] || 'Nuevo', valor: Number(r[4]) || 0, producto: r[5], creada: f(r[6]), cierre: f(r[7]), proxima: r[8], fechaProx: f(r[9]), estado: r[10] || 'Abierta', motivo: r[11], notas: r[12], historial: String(r[13] || ''), actividad: f(r[14]), origen: r[15] };
  });
  return { ok: true, negocios: negocios };
}

// Crea o actualiza una negociación. Cada cambio de etapa queda en el historial y en el historial del contacto.
function ex_guardarNegocio_(n) {
  const sh = ex_hojaNeg_(), filas = ex_filasNeg_(sh), tz = ex_tz_(), hoy = ex_hoyYmd_(tz);
  const fecha = function (v) { return v ? ex_aFecha_(String(v), tz) : ''; };
  let i = n.id ? filas.findIndex(function (r) { return String(r[0]) === String(n.id); }) : -1;
  let r, antes = '';
  if (i >= 0) { r = filas[i].slice(); antes = String(r[3]); }
  else {
    r = EX_CAB_NEG.map(function () { return ''; });
    r[0] = 'N-' + Date.now().toString(36); r[3] = 'Nuevo'; r[6] = new Date(); r[10] = 'Abierta'; r[15] = '✍️ App';
  }
  Object.keys(EX_CAMPOS_NEG).forEach(function (k) {
    if (n[k] === undefined) return;
    const c = EX_CAMPOS_NEG[k] - 1;
    r[c] = (k === 'cierre' || k === 'fechaProx') ? fecha(n[k]) : k === 'valor' ? (Number(n[k]) || 0) : n[k];
  });
  const etapa = n.etapa || r[3] || 'Nuevo';
  if (i < 0 || etapa !== antes) {
    r[3] = etapa;
    r[13] = (r[13] ? r[13] + '|' : '') + hoy + ':' + etapa;
    r[10] = etapa === 'Ganada' ? 'Ganada' : etapa === 'Perdida' ? 'Perdida' : 'Abierta';
  }
  r[14] = new Date();
  if (i >= 0) sh.getRange(i + 2, 1, 1, EX_CAB_NEG.length).setValues([r]);
  else sh.appendRow(r);
  if (r[2] && (i < 0 || etapa !== antes)) {
    const b = ex_baseHojas_();
    const det = i < 0 ? 'Nueva negociación: ' + r[1] : r[1] + ': ' + antes + ' → ' + etapa + (etapa === 'Perdida' && r[11] ? ' (' + r[11] + ')' : '');
    b.is.appendRow([new Date(), String(r[2]), etapa === 'Ganada' ? '🏆 Venta ganada' : '🤝 Negociación', det, '', 'd:' + r[0] + ':' + Date.now()]);
    ex_recalcular_(b.cs, b.is);
  }
  return { ok: true, id: String(r[0]) };
}

// Registra una actividad (llamada, visita, nota…) en la negociación y en el historial del contacto.
function ex_notaNegocio_(p) {
  const sh = ex_hojaNeg_(), filas = ex_filasNeg_(sh), texto = String(p.texto || '').trim();
  const i = filas.findIndex(function (r) { return String(r[0]) === String(p.id); });
  if (i < 0 || !texto) throw new Error('no encuentro la negociación o falta el texto');
  sh.getRange(i + 2, 15).setValue(new Date());
  const b = ex_baseHojas_();
  b.is.appendRow([new Date(), String(filas[i][2] || ''), p.tipo || '📝 Actividad', texto, '', 'd:' + filas[i][0] + ':' + Date.now()]);
  if (filas[i][2]) ex_recalcular_(b.cs, b.is);
  return { ok: true };
}

/* ---------- WhatsApp Business ---------- */
function ex_hojaWa_() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(EX_HOJA_WA);
  if (!sh) { sh = ss.insertSheet(EX_HOJA_WA); sh.appendRow(EX_CAB_WA); sh.setFrozenRows(1); }
  return sh;
}

function ex_textoWa_(m) {
  if (m.text && m.text.body) return m.text.body;
  if (m.button && m.button.text) return m.button.text;
  if (m.interactive) { const r = m.interactive.button_reply || m.interactive.list_reply; if (r) return r.title; }
  const media = m[m.type] || {};
  if (media.caption) return media.caption;
  if (m.type === 'location' && m.location) return '📍 Ubicación ' + (m.location.name || '');
  return '[' + (m.type || 'mensaje') + ']';
}

// Recibe el aviso de Meta (formato estándar de la API de WhatsApp Cloud, también el historial y los mensajes
// que envías desde la app del teléfono) y lo reparte en: hoja WhatsApp, Contactos, Interacciones y Negociaciones.
// Normaliza un aviso de Telnyx (message.received / message.echo) al formato de mensaje de Meta.
function ex_desdeTelnyx_(pay, msgs, nombres) {
  const d = pay.data || {}, ev = String(d.event_type || ''), pl = d.payload || {}, body = pl.body || {};
  if (ev !== 'message.received' && ev !== 'message.echo') return;
  if (body.type === 'edit' || body.type === 'revoke' || body.type === 'reaction') return;
  const tel = function (x) { if (Array.isArray(x)) x = x[0]; return String((x && x.phone_number) || x || '').replace(/\D/g, ''); };
  const saliente = ev === 'message.echo' || pl.direction === 'outbound';
  const m = Object.assign({}, body, {
    id: body.foreign_id || pl.id || body.id,
    from: saliente ? tel(pl.from) : tel(pl.from),
    to: saliente ? tel(pl.to) : '',
    timestamp: body.timestamp || String(Math.floor(Date.parse(pl.received_at || d.occurred_at || new Date().toISOString()) / 1000)),
    type: body.type || (pl.text ? 'text' : '')
  });
  if (!m.text && pl.text) m.text = { body: pl.text };
  const nom = (pl.from && (pl.from.name || pl.from.profile_name)) || (body.contacts && body.contacts[0] && body.contacts[0].profile && body.contacts[0].profile.name);
  if (nom && !saliente) nombres[m.from] = nom;
  if (m.id && (m.from || m.to)) msgs.push({ m: m, saliente: saliente });
}

function ex_whatsapp_(p) {
  const pay = p.payload || {}, msgs = [], nombres = {};
  if (pay.data && pay.data.event_type) ex_desdeTelnyx_(pay, msgs, nombres);
  (pay.entry || []).forEach(function (en) {
    (en.changes || []).forEach(function (ch) {
      const v = ch.value || {}, campo = String(ch.field || '');
      const propio = String((v.metadata && v.metadata.display_phone_number) || '').replace(/\D/g, '');
      (v.contacts || []).forEach(function (c) { if (c.wa_id) nombres[String(c.wa_id)] = (c.profile && c.profile.name) || ''; });
      const add = function (m, saliente) { if (m && m.id && (m.from || m.to)) msgs.push({ m: m, saliente: saliente }); };
      (v.messages || []).forEach(function (m) { add(m, campo === 'smb_message_echoes' || (!!propio && String(m.from) === propio)); });
      (v.message_echoes || []).forEach(function (m) { add(m, true); });
      (v.history || []).forEach(function (h) { (h.threads || []).forEach(function (th) { (th.messages || []).forEach(function (m) { add(m, !!propio && String(m.from) === propio); }); }); });
    });
  });
  if (!msgs.length) return { ok: true, mensajes: 0 };
  const b = ex_baseHojas_(), wa = ex_hojaWa_(), neg = ex_hojaNeg_(), hoy = Date.now();
  const filasC = ex_filasContactos_(b.cs), contactos = {}, porTel = {};
  const ult9 = function (t) { return String(t || '').replace(/\D/g, '').slice(-9); };
  filasC.forEach(function (r, i) { if (!r[0]) return; contactos[String(r[0])] = { fila: i + 2, tipo: r[1], nombre: r[2], tel: String(r[5] || '') }; if (ult9(r[5]).length === 9) porTel[ult9(r[5])] = String(r[0]); });
  const ni = b.is.getLastRow() - 1, claves = {};
  (ni > 0 ? b.is.getRange(2, 6, ni, 1).getValues() : []).forEach(function (r) { claves[String(r[0])] = true; });
  const abiertas = {};
  ex_filasNeg_(neg).forEach(function (r, i) { if (r[0] && r[10] === 'Abierta' && r[2]) (abiertas[String(r[2])] = abiertas[String(r[2])] || []).push(i + 2); });
  const nuevosC = [], nuevasI = [], filasWa = [], telefonos = [], actividad = {}, leads = [];
  msgs.sort(function (x, y) { return Number(x.m.timestamp || 0) - Number(y.m.timestamp || 0); });
  msgs.forEach(function (x) {
    const m = x.m, clave = 'w:' + m.id;
    if (claves[clave]) return;
    claves[clave] = true;
    const tel = String(x.saliente ? (m.to || '') : (m.from || '')).replace(/\D/g, '');
    if (!tel) return;
    const fecha = new Date(Number(m.timestamp || 0) * 1000 || hoy), texto = ex_textoWa_(m);
    const nombreWa = nombres[tel] || '';
    let id = porTel[ult9(tel)];
    if (!id) {
      id = 'wa:+' + tel;
      if (!contactos[id]) {
        const intencion = EX_WA_INTENCION.test(ex_norm_(texto));
        const fila = [id, intencion ? 'Cliente' : 'Por clasificar', nombreWa || '+' + tel, '', '', "'+" + tel, '', '', '', 0, '💬 WhatsApp', new Date()];
        contactos[id] = { tipo: fila[1], nombre: fila[2], tel: '+' + tel, nuevo: true };
        nuevosC.push(fila);
      }
      porTel[ult9(tel)] = id;
    }
    const c = contactos[id];
    if (c.tipo === 'Ignorar') return;
    if (!c.nuevo && !ult9(c.tel) && c.fila) { telefonos.push([c.fila, '+' + tel]); c.tel = '+' + tel; }
    nuevasI.push([fecha, id, x.saliente ? '💬 WhatsApp enviado' : '💬 WhatsApp recibido', texto.slice(0, 300), 'https://wa.me/' + tel, clave]);
    filasWa.push([fecha, x.saliente ? 'Enviado' : 'Recibido', '+' + tel, c.nombre || nombreWa, texto.slice(0, 500), m.type || '', id, m.id]);
    if (abiertas[id]) abiertas[id].forEach(function (f) { if (!actividad[f] || fecha > actividad[f]) actividad[f] = fecha; });
    // Lead nuevo: mensaje reciente con intención de compra de alguien sin negociación abierta.
    if (!x.saliente && !abiertas[id] && hoy - fecha.getTime() < 30 * 86400000 && EX_WA_INTENCION.test(ex_norm_(texto))) {
      const mod = texto.match(EX_WA_MODELOS);
      leads.push({ titulo: (c.nombre || nombreWa || '+' + tel) + (mod ? ' – ' + mod[1].replace(/\s+/g, ' ').replace(/\b\w/g, function (l) { return l.toUpperCase(); }) : ' – WhatsApp'), contacto: id, producto: mod ? mod[1] : '', proxima: 'Responder por WhatsApp', fechaProx: ex_hoyYmd_(), origen: '💬 WhatsApp', notas: 'Primer mensaje: ' + texto.slice(0, 200) });
      abiertas[id] = [];
    }
  });
  if (nuevosC.length) b.cs.getRange(b.cs.getLastRow() + 1, 1, nuevosC.length, EX_CAB_CONTACTOS.length).setValues(nuevosC);
  telefonos.forEach(function (t) { b.cs.getRange(t[0], 6).setValue("'" + t[1]); });
  if (nuevasI.length) b.is.getRange(b.is.getLastRow() + 1, 1, nuevasI.length, EX_CAB_INTER.length).setValues(nuevasI);
  if (filasWa.length) wa.getRange(wa.getLastRow() + 1, 1, filasWa.length, EX_CAB_WA.length).setValues(filasWa);
  Object.keys(actividad).forEach(function (f) { neg.getRange(Number(f), 15).setValue(actividad[f]); });
  leads.forEach(function (l) { ex_guardarNegocio_(l); });
  ex_recalcular_(b.cs, b.is);
  const props = PropertiesService.getScriptProperties();
  props.setProperty('EX_WA_ULTIMO', new Date().toISOString());
  // El agente revisa estas conversaciones en su próxima ronda (cada 10 min), cuando la conversación se calme.
  const pend = JSON.parse(props.getProperty('EX_AG_PEND') || '{}');
  filasWa.forEach(function (f) { pend[f[6]] = Date.now(); });
  props.setProperty('EX_AG_PEND', JSON.stringify(pend));
  return { ok: true, mensajes: nuevasI.length, contactosNuevos: nuevosC.length, leads: leads.length };
}

/* ---------- importar un chat exportado desde WhatsApp ---------- */
// p.contacto = { id?, nombre, telefono }  ·  p.mensajes = [{ fecha: 'yyyy-MM-ddTHH:mm', saliente, texto }]  ·  p.analizar
function ex_importarChat_(p) {
  const tz = ex_tz_(), b = ex_baseHojas_(), wa = ex_hojaWa_(), pc = p.contacto || {};
  const tel = String(pc.telefono || '').replace(/\D/g, ''), ult9 = function (t) { return String(t || '').replace(/\D/g, '').slice(-9); };
  const filas = ex_filasContactos_(b.cs);
  let id = String(pc.id || '');
  if (!id && tel.length >= 8) { const f = filas.filter(function (r) { return ult9(r[5]) === ult9(tel); })[0]; if (f) id = String(f[0]); }
  if (!id) {
    id = tel.length >= 8 ? 'wa:+' + (tel.length === 9 ? '56' + tel : tel) : 'c-' + Date.now();
    const nom = String(pc.nombre || id), seguro = /^[+=@-]/.test(nom) ? "'" + nom : nom;
    if (!filas.some(function (r) { return String(r[0]) === id; })) b.cs.appendRow([id, 'Por clasificar', seguro, '', '', tel ? "'+" + (tel.length === 9 ? '56' + tel : tel) : '', '', '', '', 0, '📥 Chat importado', new Date()]);
  } else if (tel.length >= 8) {
    const i = filas.findIndex(function (r) { return String(r[0]) === id; });
    if (i >= 0 && !ult9(filas[i][5])) b.cs.getRange(i + 2, 6).setValue("'+" + (tel.length === 9 ? '56' + tel : tel));
  }
  let nw = wa.getLastRow() - 1;
  // Un chat exportado trae toda la historia: los mensajes importados antes de este contacto se reemplazan.
  if (nw > 0) {
    const previos = wa.getRange(2, 6, nw, 2).getValues();
    for (let k = previos.length - 1; k >= 0; k--) if (String(previos[k][1]) === id && previos[k][0] === 'importado') wa.deleteRow(k + 2);
    nw = wa.getLastRow() - 1;
  }
  const ya = {};
  (nw > 0 ? wa.getRange(2, 8, nw, 1).getValues() : []).forEach(function (r) { ya[String(r[0])] = true; });
  const nombre = pc.nombre || id, nuevas = [];
  (p.mensajes || []).slice(-800).forEach(function (m) {
    if (!m || !m.texto || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(m.fecha)) return;
    const clave = 'imp:' + ex_firma_(id + '|' + m.fecha + '|' + (m.saliente ? 1 : 0) + '|' + m.texto);
    if (ya[clave]) return;
    ya[clave] = true;
    nuevas.push([Utilities.parseDate(m.fecha.replace('T', ' '), tz, 'yyyy-MM-dd HH:mm'), m.saliente ? 'Enviado' : 'Recibido', tel ? '+' + tel : '', nombre, String(m.texto).slice(0, 1000), 'importado', id, clave]);
  });
  if (nuevas.length) {
    wa.getRange(wa.getLastRow() + 1, 1, nuevas.length, EX_CAB_WA.length).setValues(nuevas);
    b.is.appendRow([new Date(), id, '📥 Chat importado', nuevas.length + ' mensajes de WhatsApp (' + Utilities.formatDate(nuevas[0][0], tz, 'dd/MM/yyyy') + ' a ' + Utilities.formatDate(nuevas[nuevas.length - 1][0], tz, 'dd/MM/yyyy') + ')', '', 'imp:' + id + ':' + Date.now()]);
    ex_recalcular_(b.cs, b.is);
  }
  const out = { ok: true, id: id, importados: nuevas.length, repetidos: (p.mensajes || []).length - nuevas.length };
  if (p.analizar && PropertiesService.getScriptProperties().getProperty('ANTHROPIC_API_KEY')) {
    try { out.agente = ex_agente_(id); } catch (err) { out.errorAgente = err.message; }
  }
  return out;
}

/* ---------- Bsale: catálogo, stock y precios ---------- */
// Configuración (Propiedades del script): BSALE_TOKEN (obligatorio), BSALE_LISTA (id de la lista de precios, opcional),
// BSALE_URL (opcional; por defecto la API de Chile).
const EX_HOJA_BSALE = 'Bsale';
const EX_CAB_BSALE = ['ID variante', 'ID producto', 'Producto', 'Variante', 'SKU', 'Código de barras'];
function ex_bsaleToken_() { return PropertiesService.getScriptProperties().getProperty('BSALE_TOKEN') || ''; }
function ex_bsaleUrl_(ruta) { return (PropertiesService.getScriptProperties().getProperty('BSALE_URL') || 'https://api.bsale.io/v1') + ruta; }
function ex_bsalePeticion_(ruta) { return { url: ex_bsaleUrl_(ruta), headers: { access_token: ex_bsaleToken_() }, muteHttpExceptions: true }; }
function ex_bsaleGet_(ruta) {
  const r = UrlFetchApp.fetch(ex_bsaleUrl_(ruta), ex_bsalePeticion_(ruta));
  if (r.getResponseCode() === 401) throw new Error('Bsale rechazó el token (401): revisa BSALE_TOKEN');
  if (r.getResponseCode() !== 200) throw new Error('Bsale respondió ' + r.getResponseCode());
  return JSON.parse(r.getContentText());
}
// Varias consultas a la vez (en grupos de 20); devuelve null en las que fallan.
function ex_bsaleVarias_(rutas) {
  const out = [];
  for (let i = 0; i < rutas.length; i += 20) {
    UrlFetchApp.fetchAll(rutas.slice(i, i + 20).map(ex_bsalePeticion_)).forEach(function (r) {
      try { out.push(r.getResponseCode() === 200 ? JSON.parse(r.getContentText()) : null); } catch (e) { out.push(null); }
    });
  }
  return out;
}
// Todas las páginas de una lista de Bsale (50 por página).
function ex_bsaleTodo_(ruta) {
  const sep = ruta.indexOf('?') >= 0 ? '&' : '?', primera = ex_bsaleGet_(ruta + sep + 'limit=50&offset=0');
  const items = (primera.items || []).slice(), total = Math.min(+primera.count || 0, 20000), rutas = [];
  for (let off = 50; off < total; off += 50) rutas.push(ruta + sep + 'limit=50&offset=' + off);
  ex_bsaleVarias_(rutas).forEach(function (j) { if (j && j.items) Array.prototype.push.apply(items, j.items); });
  return items;
}
function ex_hojaBsale_() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(EX_HOJA_BSALE);
  if (!sh) { sh = ss.insertSheet(EX_HOJA_BSALE); sh.getRange(1, 1, 1, EX_CAB_BSALE.length).setValues([EX_CAB_BSALE]).setFontWeight('bold'); sh.setFrozenRows(1); }
  return sh;
}
// Copia el catálogo de Bsale (productos y variantes activas) a la hoja "Bsale" para buscar rápido.
function ex_bsaleSincCatalogo_() {
  if (!ex_bsaleToken_()) throw new Error('falta BSALE_TOKEN en las propiedades del script');
  const nombres = {};
  ex_bsaleTodo_('/products.json?state=0').forEach(function (p) { nombres[String(p.id)] = p.name; });
  const filas = ex_bsaleTodo_('/variants.json?state=0').filter(function (v) { return v.product && nombres[String(v.product.id)]; }).map(function (v) {
    return [String(v.id), String(v.product.id), nombres[String(v.product.id)], v.description || '', "'" + (v.code || ''), "'" + (v.barCode || '')];
  });
  const sh = ex_hojaBsale_();
  if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, EX_CAB_BSALE.length).clearContent();
  if (filas.length) sh.getRange(2, 1, filas.length, EX_CAB_BSALE.length).setValues(filas);
  PropertiesService.getScriptProperties().setProperty('EX_BSALE_SINC', new Date().toISOString());
  return filas.length;
}
function ex_bsaleCatalogo_() {
  const sh = ex_hojaBsale_(), n = sh.getLastRow() - 1, props = PropertiesService.getScriptProperties();
  const viejo = Date.now() - new Date(props.getProperty('EX_BSALE_SINC') || 0).getTime() > 24 * 3600000;
  if (n <= 0 || viejo) { ex_bsaleSincCatalogo_(); return ex_bsaleCatalogo_Leer_(); }
  return ex_bsaleCatalogo_Leer_();
}
function ex_bsaleCatalogo_Leer_() {
  const sh = ex_hojaBsale_(), n = sh.getLastRow() - 1;
  return (n > 0 ? sh.getRange(2, 1, n, EX_CAB_BSALE.length).getValues() : []).map(function (r) {
    return { id: String(r[0]), prod: String(r[1]), producto: String(r[2]), variante: String(r[3]), sku: String(r[4]), barra: String(r[5]) };
  });
}
// Búsqueda por texto ("levo comp m", un SKU o un código de barras): primero las variantes que calzan con más palabras.
function ex_bsaleBuscar_(q, max) {
  const cat = ex_bsaleCatalogo_(), palabras = ex_norm_(q).split(/[^a-z0-9]+/).filter(Boolean);
  if (!palabras.length) return [];
  const exacto = cat.filter(function (v) { return v.sku && ex_norm_(v.sku) === ex_norm_(q).trim() || v.barra && v.barra === String(q).trim(); });
  if (exacto.length) return exacto.slice(0, max || 12);
  const puntaje = cat.map(function (v) {
    const tx = ' ' + ex_norm_(v.producto + ' ' + v.variante + ' ' + v.sku).replace(/[^a-z0-9]+/g, ' ') + ' ';
    let pts = 0;
    palabras.forEach(function (w) { if (w.length <= 2 || /^\d+$/.test(w) ? tx.indexOf(' ' + w + ' ') >= 0 : tx.indexOf(w) >= 0) pts++; });
    return { v: v, pts: pts };
  }).filter(function (x) { return x.pts > 0; });
  const mejor = puntaje.reduce(function (m, x) { return Math.max(m, x.pts); }, 0);
  return puntaje.filter(function (x) { return x.pts === mejor; }).sort(function (a, b) { return a.v.producto.localeCompare(b.v.producto); }).slice(0, max || 12).map(function (x) { return x.v; });
}
// Stock por sucursal y precio (con IVA) en vivo para una lista de variantes.
function ex_bsaleStock_(variantes) {
  if (!variantes.length) return [];
  const props = PropertiesService.getScriptProperties(), cache = CacheService.getScriptCache();
  let suc = JSON.parse(cache.get('bsale_suc') || 'null');
  if (!suc) { suc = {}; try { ex_bsaleTodo_('/offices.json').forEach(function (o) { suc[String(o.id)] = o.name; }); cache.put('bsale_suc', JSON.stringify(suc), 21600); } catch (e) {} }
  let lista = props.getProperty('BSALE_LISTA');
  if (!lista) { try { const l = ex_bsaleGet_('/price_lists.json?state=0&limit=1'); lista = l.items && l.items[0] ? String(l.items[0].id) : ''; if (lista) props.setProperty('BSALE_LISTA', lista); } catch (e) {} }
  const stocks = ex_bsaleVarias_(variantes.map(function (v) { return '/stocks.json?variantid=' + v.id + '&limit=50'; }));
  const precios = lista ? ex_bsaleVarias_(variantes.map(function (v) { return '/price_lists/' + lista + '/details.json?variantid=' + v.id; })) : [];
  return variantes.map(function (v, i) {
    const S = (stocks[i] && stocks[i].items) || [], pr = precios[i] && precios[i].items && precios[i].items[0];
    const sucursales = S.map(function (x) { return { nombre: suc[String(x.office && x.office.id)] || ('Sucursal ' + (x.office && x.office.id)), disp: +x.quantityAvailable || 0 }; });
    return { id: v.id, producto: v.producto, variante: v.variante, sku: v.sku, precio: pr ? Math.round(+pr.variantValueWithTaxes || 0) : null,
      total: sucursales.reduce(function (s, x) { return s + x.disp; }, 0), sucursales: sucursales };
  });
}
// Ejecútala una vez después de guardar BSALE_TOKEN: copia el catálogo y muestra cuántas variantes encontró.
function probarBsale() {
  const n = ex_bsaleSincCatalogo_();
  const ej = ex_bsaleStock_(ex_bsaleCatalogo_Leer_().slice(0, 1))[0];
  Logger.log('Bsale conectado ✓ · ' + n + ' variantes en el catálogo' + (ej ? ' · ejemplo: ' + ej.producto + ' ' + ej.variante + ' → disponible ' + ej.total + (ej.precio ? ', $' + ej.precio : '') : ''));
}
function ex_bsale_(p) {
  if (!ex_bsaleToken_()) return { ok: true, activo: false };
  if (p.sinc) return { ok: true, activo: true, catalogo: ex_bsaleSincCatalogo_() };
  const v = ex_bsaleBuscar_(String(p.q || ''), Math.min(+p.max || 12, 25));
  return { ok: true, activo: true, items: ex_bsaleStock_(v), sinc: PropertiesService.getScriptProperties().getProperty('EX_BSALE_SINC') || '' };
}
// Para el agente: productos del catálogo que se nombran en la conversación (por las palabras más distintivas de cada nombre).
function ex_bsaleParaAgente_(texto) {
  if (!ex_bsaleToken_()) return '';
  try {
    const cat = ex_bsaleCatalogo_(), tx = ' ' + ex_norm_(texto).replace(/[^a-z0-9]+/g, ' ') + ' ';
    const porProd = {}, df = {};
    cat.forEach(function (v) { (porProd[v.prod] = porProd[v.prod] || []).push(v); });
    const prods = Object.keys(porProd);
    const palabrasDe = {};
    prods.forEach(function (id) {
      const ws = {}; ex_norm_(porProd[id][0].producto).split(/[^a-z0-9]+/).forEach(function (w) { if (w.length >= 3 && !/^\d+$/.test(w)) ws[w] = 1; });
      palabrasDe[id] = Object.keys(ws); palabrasDe[id].forEach(function (w) { df[w] = (df[w] || 0) + 1; });
    });
    const N = prods.length || 1;
    const top = prods.map(function (id) {
      let pts = 0, n = 0;
      palabrasDe[id].forEach(function (w) { if (df[w] <= Math.max(2, N * 0.15) && tx.indexOf(' ' + w + ' ') >= 0) { pts += Math.log(N / df[w]); n++; } });
      return { id: id, pts: pts * n };
    }).filter(function (x) { return x.pts > 0; }).sort(function (a, b) { return b.pts - a.pts; }).slice(0, 4);
    if (!top.length) return '';
    const vars = []; top.forEach(function (x) { Array.prototype.push.apply(vars, porProd[x.id].slice(0, 8)); });
    const st = ex_bsaleStock_(vars.slice(0, 24));
    return st.map(function (s) {
      return '- ' + s.producto + (s.variante ? ' | ' + s.variante : '') + (s.sku ? ' | SKU ' + s.sku : '') + ' | disponible: ' + s.total +
        (s.sucursales.length > 1 ? ' (' + s.sucursales.map(function (x) { return x.nombre + ' ' + x.disp; }).join(', ') + ')' : '') + (s.precio ? ' | precio $' + s.precio.toLocaleString('es-CL') : '');
    }).join('\n');
  } catch (e) { return '(no se pudo consultar Bsale: ' + e.message + ')'; }
}

/* ---------- Instagram (API oficial de Meta, gratis): métricas diarias y publicaciones ---------- */
// Configuración (Propiedades del script): IG_TOKEN = token de larga duración de "API setup with Instagram login".
// El script lo renueva solo cada 30 días (dura 60). Los datos quedan en las hojas "Instagram" e "IG Publicaciones".
const EX_IG_API = 'https://graph.instagram.com/v25.0';
const EX_CAB_IG = ['Fecha', 'Seguidores', 'Siguiendo', 'Publicaciones', 'Alcance', 'Vistas', 'Interacciones', 'Cuentas que interactuaron', 'Toques en links'];
const EX_CAB_IGP = ['ID', 'Fecha', 'Tipo', 'Formato', 'Texto', 'Link', 'Me gusta', 'Comentarios', 'Guardados', 'Compartidos', 'Alcance', 'Vistas', 'Interacciones', 'Tiempo medio reel (s)', 'Actualizado'];
const EX_CAB_CONT = ['ID', 'Fecha', 'Formato', 'Tema', 'Idea / guion', 'Texto sugerido', 'Hashtags', 'Objetivo', 'Por qué ahora', 'Estado', 'Creado', 'Relacionado'];
function ex_igToken_() {
  const pr = PropertiesService.getScriptProperties(), t = pr.getProperty('IG_TOKEN');
  if (!t) return '';
  const ult = new Date(pr.getProperty('IG_TOKEN_RENOVADO') || 0).getTime();
  if (Date.now() - ult > 30 * 86400000) {
    try {
      const r = UrlFetchApp.fetch('https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=' + encodeURIComponent(t), { muteHttpExceptions: true });
      const j = JSON.parse(r.getContentText() || '{}');
      if (j.access_token) { pr.setProperty('IG_TOKEN', j.access_token); pr.setProperty('IG_TOKEN_RENOVADO', new Date().toISOString()); return j.access_token; }
    } catch (e) {}
  }
  return t;
}
function ex_igUrl_(ruta, tok) { return EX_IG_API + ruta + (ruta.indexOf('?') >= 0 ? '&' : '?') + 'access_token=' + encodeURIComponent(tok); }
function ex_igGet_(ruta, tok) {
  const r = UrlFetchApp.fetch(ex_igUrl_(ruta, tok), { muteHttpExceptions: true }), j = JSON.parse(r.getContentText() || '{}');
  if (j.error) throw new Error('Instagram: ' + (j.error.message || 'error') + (j.error.code ? ' (' + j.error.code + ')' : ''));
  return j;
}
function ex_igVarias_(rutas, tok) {
  const out = [];
  for (let i = 0; i < rutas.length; i += 20) UrlFetchApp.fetchAll(rutas.slice(i, i + 20).map(function (r) { return { url: ex_igUrl_(r, tok), muteHttpExceptions: true }; })).forEach(function (x) {
    try { const j = JSON.parse(x.getContentText() || '{}'); out.push(j.error ? null : j); } catch (e) { out.push(null); }
  });
  return out;
}
function ex_hojaCab_(nombre, cab) {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(nombre);
  if (!sh) { sh = ss.insertSheet(nombre); sh.getRange(1, 1, 1, cab.length).setValues([cab]).setFontWeight('bold'); sh.setFrozenRows(1); }
  return sh;
}
function ex_igValor_(j, metrica) {
  const m = ((j && j.data) || []).filter(function (x) { return x.name === metrica; })[0];
  if (!m) return '';
  if (m.total_value) return m.total_value.value;
  return m.values && m.values[0] ? m.values[0].value : '';
}
// Copia a la hoja las métricas de la cuenta (por día) y las últimas publicaciones con sus métricas.
function ex_igSinc_() {
  const tok = ex_igToken_(); if (!tok) throw new Error('falta IG_TOKEN en las propiedades del script');
  const tz = ex_tz_(), pr = PropertiesService.getScriptProperties();
  const yo = ex_igGet_('/me?fields=user_id,username,followers_count,follows_count,media_count', tok);
  pr.setProperty('IG_USUARIO', yo.username || '');
  // Días: ayer (y los últimos 30 la primera vez), una consulta por día.
  const sh = ex_hojaCab_('Instagram', EX_CAB_IG), n = sh.getLastRow() - 1;
  const filas = n > 0 ? sh.getRange(2, 1, n, EX_CAB_IG.length).getValues() : [];
  const idx = {}; filas.forEach(function (r, i) { idx[r[0] instanceof Date ? Utilities.formatDate(r[0], tz, 'yyyy-MM-dd') : String(r[0]).replace(/^'/, '')] = i; });
  const hoy0 = ex_aFecha_(ex_hoyYmd_(tz), tz).getTime(), dias = [];
  for (let k = n > 0 ? 3 : 30; k >= 1; k--) dias.push(new Date(hoy0 - k * 86400000));
  const met = 'reach,views,total_interactions,accounts_engaged,profile_links_taps';
  const res = ex_igVarias_(dias.map(function (d) { const s0 = Math.floor(d.getTime() / 1000); return '/me/insights?metric=' + met + '&period=day&metric_type=total_value&since=' + s0 + '&until=' + (s0 + 86400); }), tok);
  dias.forEach(function (d, k) {
    const f = Utilities.formatDate(d, tz, 'yyyy-MM-dd'), j = res[k], ayer = k === dias.length - 1;
    const fila = [f, ayer ? yo.followers_count : '', ayer ? yo.follows_count : '', ayer ? yo.media_count : '', ex_igValor_(j, 'reach'), ex_igValor_(j, 'views'), ex_igValor_(j, 'total_interactions'), ex_igValor_(j, 'accounts_engaged'), ex_igValor_(j, 'profile_links_taps')];
    if (idx[f] != null) { const prev = filas[idx[f]]; for (let c = 1; c < fila.length; c++) if (fila[c] === '' && prev[c] !== '') fila[c] = prev[c]; filas[idx[f]] = fila; }
    else { idx[f] = filas.length; filas.push(fila); }
  });
  filas.sort(function (a, b) { return String(a[0] instanceof Date ? Utilities.formatDate(a[0], tz, 'yyyy-MM-dd') : a[0]).localeCompare(String(b[0] instanceof Date ? Utilities.formatDate(b[0], tz, 'yyyy-MM-dd') : b[0])); });
  if (filas.length) sh.getRange(2, 1, filas.length, EX_CAB_IG.length).setValues(filas.map(function (r) { return [r[0] instanceof Date ? Utilities.formatDate(r[0], tz, 'yyyy-MM-dd') : "'" + String(r[0]).replace(/^'/, '')].concat(r.slice(1)); }));
  // Publicaciones: las últimas 60 con sus métricas.
  let media = [], url = '/me/media?fields=id,caption,media_type,media_product_type,permalink,timestamp,like_count,comments_count&limit=50';
  for (let pag = 0; pag < 2 && url; pag++) { const j = ex_igGet_(url, tok); media = media.concat(j.data || []); url = j.paging && j.paging.next ? j.paging.next.replace(/^https:\/\/graph\.instagram\.com\/v[\d.]+/, '').replace(/[&?]access_token=[^&]*/, '') : ''; }
  media = media.slice(0, 60);
  const ins = ex_igVarias_(media.map(function (m) { return '/' + m.id + '/insights?metric=' + (m.media_product_type === 'REELS' ? 'reach,saved,shares,views,total_interactions,ig_reels_avg_watch_time' : 'reach,saved,shares,views,total_interactions'); }), tok);
  const ahora = new Date(), filasP = media.map(function (m, k) {
    const j = ins[k], wt = ex_igValor_(j, 'ig_reels_avg_watch_time');
    return [m.id, Utilities.formatDate(new Date(m.timestamp), tz, 'yyyy-MM-dd HH:mm'), m.media_type || '', m.media_product_type || '', String(m.caption || '').slice(0, 500), m.permalink || '', m.like_count || 0, m.comments_count || 0,
      ex_igValor_(j, 'saved'), ex_igValor_(j, 'shares'), ex_igValor_(j, 'reach'), ex_igValor_(j, 'views'), ex_igValor_(j, 'total_interactions'), wt !== '' ? Math.round(wt / 100) / 10 : '', ahora];
  });
  const sp = ex_hojaCab_('IG Publicaciones', EX_CAB_IGP);
  if (sp.getLastRow() > 1) sp.getRange(2, 1, sp.getLastRow() - 1, EX_CAB_IGP.length).clearContent();
  if (filasP.length) sp.getRange(2, 1, filasP.length, EX_CAB_IGP.length).setValues(filasP.map(function (r) { r[0] = "'" + r[0]; r[1] = "'" + r[1]; return r; }));
  pr.setProperty('EX_IG_SINC', new Date().toISOString());
  return { usuario: yo.username, seguidores: yo.followers_count, publicaciones: filasP.length, dias: dias.length };
}
function ex_instagram_(p) {
  const pr = PropertiesService.getScriptProperties();
  if (!pr.getProperty('IG_TOKEN')) return { ok: true, activo: false };
  let sinc = null;
  if (p.sinc) sinc = ex_igSinc_();
  const tz = ex_tz_(), sh = ex_hojaCab_('Instagram', EX_CAB_IG), n = sh.getLastRow() - 1, sp = ex_hojaCab_('IG Publicaciones', EX_CAB_IGP), np = sp.getLastRow() - 1;
  const f = function (v) { return v instanceof Date ? Utilities.formatDate(v, tz, 'yyyy-MM-dd') : String(v).replace(/^'/, ''); };
  const dias = (n > 0 ? sh.getRange(Math.max(2, n - 88), 1, Math.min(n, 90), EX_CAB_IG.length).getValues() : []).map(function (r) { return { fecha: f(r[0]), seguidores: r[1], alcance: r[4], vistas: r[5], interacciones: r[6], cuentas: r[7], links: r[8] }; });
  const posts = (np > 0 ? sp.getRange(2, 1, np, EX_CAB_IGP.length).getValues() : []).map(function (r) { return { id: String(r[0]).replace(/^'/, ''), fecha: r[1] instanceof Date ? Utilities.formatDate(r[1], tz, 'yyyy-MM-dd HH:mm') : String(r[1]).replace(/^'/, ''), tipo: r[2], formato: r[3], texto: r[4], link: r[5], likes: +r[6] || 0, comentarios: +r[7] || 0, guardados: +r[8] || 0, compartidos: +r[9] || 0, alcance: +r[10] || 0, vistas: +r[11] || 0, interacciones: +r[12] || 0, reelSeg: r[13] }; });
  return { ok: true, activo: true, usuario: pr.getProperty('IG_USUARIO') || '', sinc: pr.getProperty('EX_IG_SINC') || '', dias: dias, posts: posts, resultado: sinc };
}
// Calendario de contenido (hoja "Contenido"): listar, guardar ideas y cambiar su estado.
function ex_contenido_(p) {
  const tz = ex_tz_(), sh = ex_hojaCab_('Contenido', EX_CAB_CONT);
  if (sh.getRange(1, EX_CAB_CONT.length).getValue() !== EX_CAB_CONT[EX_CAB_CONT.length - 1]) sh.getRange(1, 1, 1, EX_CAB_CONT.length).setValues([EX_CAB_CONT]).setFontWeight('bold');
  if (p.accion === 'guardar') {
    const filas = (p.items || []).map(function (x, k) { return ['ct-' + Date.now() + '-' + k, "'" + String(x.fecha || ''), x.formato || '', x.tema || '', x.idea || '', x.texto || '', x.hashtags || '', x.objetivo || '', x.por_que || '', x.estado || 'Planificado', new Date(), x.relacionado || '']; });
    if (filas.length) sh.getRange(sh.getLastRow() + 1, 1, filas.length, EX_CAB_CONT.length).setValues(filas);
  } else if (p.accion === 'estado') {
    const n = sh.getLastRow() - 1, ids = n > 0 ? sh.getRange(2, 1, n, 1).getValues() : [];
    const i = ids.findIndex(function (r) { return String(r[0]) === String(p.id); });
    if (i >= 0) { sh.getRange(i + 2, 10).setValue(p.estado); if (p.fecha) sh.getRange(i + 2, 2).setValue("'" + p.fecha); }
  }
  const n = sh.getLastRow() - 1;
  const items = (n > 0 ? sh.getRange(2, 1, n, EX_CAB_CONT.length).getValues() : []).filter(function (r) { return r[0]; }).map(function (r) {
    return { id: String(r[0]), fecha: r[1] instanceof Date ? Utilities.formatDate(r[1], tz, 'yyyy-MM-dd') : String(r[1]).replace(/^'/, ''), formato: r[2], tema: r[3], idea: r[4], texto: r[5], hashtags: r[6], objetivo: r[7], por_que: r[8], estado: r[9], relacionado: String(r[11] || '') };
  });
  return { ok: true, items: items };
}
// Ejecútala una vez después de guardar IG_TOKEN: trae los datos y muestra el resultado.
function probarInstagram() {
  PropertiesService.getScriptProperties().setProperty('IG_TOKEN_RENOVADO', new Date().toISOString());
  const r = ex_igSinc_();
  Logger.log('Instagram conectado ✓ · @' + r.usuario + ' · ' + r.seguidores + ' seguidores · ' + r.publicaciones + ' publicaciones · ' + r.dias + ' días de métricas');
}

/* ---------- asistente de IA para planificar el día y la semana ---------- */
// La app arma el contexto (tareas, agenda, negociaciones) y el asistente devuelve un plan concreto. No cambia nada solo.
const EX_AS_SISTEMA = {
  dia: [
    'Eres el asistente de productividad del encargado de Blackline Puerto Varas, tienda de bicicletas Specialized con taller. Atiende ventas, equipo (2 vendedores y 2 mecánicos), marketing, compras y clientes.',
    'Con sus tareas pendientes, su agenda de hoy y sus negociaciones, arma un plan realista para HOY:',
    '- bloques en orden, con hora sugerida (respeta los eventos del calendario y deja espacio para atender la tienda), máximo 7 bloques; agrupa tareas chicas parecidas en un solo bloque;',
    '- primero lo vencido importante, los clientes que esperan respuesta y lo que mueve ventas; las tareas grandes en la mañana;',
    '- si hay más trabajo que tiempo, propone qué mover a otro día (tareas no urgentes) y por qué;',
    '- un consejo breve y concreto para el día.',
    'Usa los nombres exactos de las tareas cuando las nombres. Español de Chile, directo y amable. Responde solo con el JSON pedido.'
  ].join('\n'),
  contenido: [
    'Eres el estratega de contenido de Instagram de Blackline Puerto Varas, tienda de bicicletas Specialized (e-bikes Turbo Levo, Vado, Kenevo; MTB, ruta y gravel), repuestos y taller, en Puerto Varas, Chile (lago Llanquihue, volcanes, senderos como Pichijuán; muchos clientes argentinos de Bariloche y Villa La Angostura).',
    'Con lo que pasa en la tienda (agenda, proyectos, productos que más piden los clientes, ventas recientes, tareas de marketing) y las métricas de Instagram (qué formatos y días funcionan mejor), arma un calendario de contenido para las próximas 2 semanas:',
    '- 3 o 4 publicaciones por semana, mezclando Reels (prioridad si funcionan mejor), carruseles, historias y posts;',
    '- cada idea atada a algo real y actual de la tienda (un evento, un producto con demanda, una entrega, el taller, la temporada, un test ride), nunca genérica;',
    '- prioriza: (1) productos que se encargaron o están en negociación y que NO tienen contenido en Instagram: prepara el reel para cuando lleguen (unboxing, primera salida, entrega al cliente si corresponde, sin dar su nombre sin permiso); (2) las preguntas que más se repiten en los chats (tallas, cuotas, compra desde Argentina, mantención) como reels o carruseles educativos; (3) eventos y salidas de la agenda;',
    '- para Reels y Carruseles escribe el guion completo en el campo guion: el gancho de los primeros 3 segundos, luego cada toma o lámina en una línea numerada (qué se graba o muestra y el texto en pantalla), la música o audio sugerido y el llamado a la acción final; para Historias, la secuencia de 3 a 5 historias con stickers (encuesta, pregunta, link a WhatsApp);',
    '- en relacionado pon el producto o la negociación a la que se vincula la idea (vacío si no aplica);',
    '- elige el día según los días que mejor funcionan; no repitas ideas ya planificadas;',
    '- para cada una: formato, tema corto, la idea o guion en 2 a 4 frases (qué se graba o muestra), un texto sugerido para la publicación (tono cercano, chileno, con llamado a la acción como escribir por WhatsApp o pasar a probarla), 3 a 6 hashtags, el objetivo y por qué ahora.',
    'No inventes precios ni promociones que no estén en los datos. Responde solo con el JSON pedido.'
  ].join('\n'),
  tareas: [
    'Eres el asistente de productividad del encargado de Blackline Puerto Varas (tienda de bicicletas Specialized con taller).',
    'Revisa sus tareas pendientes junto con lo que pasa en la tienda (negociaciones y sus próximos pasos, lo que entendió el agente de los chats de WhatsApp, clientes esperando respuesta, agenda, proyectos y contenido planificado) y:',
    '- sugiere solo las tareas que FALTAN (máximo 8), concretas y accionables, con fecha realista y el motivo; no sugieras nada que ya esté cubierto por una tarea pendiente, aunque esté escrita distinto;',
    '- detecta tareas pendientes duplicadas o que se superponen (por ejemplo dos seguimientos al mismo cliente por lo mismo) y di cuál mantener y cuáles quitar, copiando los textos exactos;',
    '- en fuente indica de dónde sale cada sugerencia (Negociación, Chat, Agenda, Proyecto, Contenido u Otro).',
    'Español de Chile, directo. Responde solo con el JSON pedido.'
  ].join('\n'),
  semana: [
    'Eres el asistente de productividad y ventas del encargado de Blackline Puerto Varas (tienda de bicicletas Specialized con taller).',
    'Con los datos de su semana (tareas hechas y pendientes, negociaciones, reflexión anterior) prepara su revisión semanal:',
    '- un resumen de cómo le fue en 2 o 3 frases, con números;',
    '- logros concretos (máximo 4);',
    '- las 3 prioridades más importantes para la próxima semana, cada una con el porqué (piensa en ventas, clientes esperando, negocios estancados y tareas vencidas);',
    '- riesgos o temas que se están quedando atrás (máximo 3).',
    'No inventes datos. Español de Chile, directo. Responde solo con el JSON pedido.'
  ].join('\n')
};
const EX_AS_ESQUEMA = {
  dia: { type: 'object', additionalProperties: false, required: ['resumen', 'bloques', 'mover', 'consejo'], properties: {
    resumen: { type: 'string' },
    bloques: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['hora', 'accion', 'motivo'], properties: { hora: { type: 'string' }, accion: { type: 'string' }, motivo: { type: 'string' } } } },
    mover: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['tarea', 'cuando', 'motivo'], properties: { tarea: { type: 'string' }, cuando: { type: 'string', enum: ['mañana', 'esta semana', 'próxima semana'] }, motivo: { type: 'string' } } } },
    consejo: { type: 'string' } } },
  contenido: { type: 'object', additionalProperties: false, required: ['resumen', 'ideas'], properties: {
    resumen: { type: 'string' },
    ideas: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['fecha', 'formato', 'tema', 'idea', 'guion', 'relacionado', 'texto', 'hashtags', 'objetivo', 'por_que'], properties: {
      fecha: { type: 'string' }, formato: { type: 'string', enum: ['Reel', 'Carrusel', 'Historia', 'Post'] }, tema: { type: 'string' }, idea: { type: 'string' }, guion: { type: 'string' }, relacionado: { type: 'string' }, texto: { type: 'string' }, hashtags: { type: 'string' },
      objetivo: { type: 'string', enum: ['Ventas', 'Comunidad', 'Alcance', 'Educación', 'Postventa'] }, por_que: { type: 'string' } } } } } },
  tareas: { type: 'object', additionalProperties: false, required: ['resumen', 'sugerencias', 'duplicadas'], properties: {
    resumen: { type: 'string' },
    sugerencias: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['tarea', 'fecha', 'prioridad', 'motivo', 'fuente'], properties: { tarea: { type: 'string' }, fecha: { type: 'string' }, prioridad: { type: 'string', enum: ['Alta', 'Media', 'Baja'] }, motivo: { type: 'string' }, fuente: { type: 'string', enum: ['Negociación', 'Chat', 'Agenda', 'Proyecto', 'Contenido', 'Otro'] } } } },
    duplicadas: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['mantener', 'quitar', 'motivo'], properties: { mantener: { type: 'string' }, quitar: { type: 'array', items: { type: 'string' } }, motivo: { type: 'string' } } } } } },
  semana: { type: 'object', additionalProperties: false, required: ['resumen', 'logros', 'prioridades', 'riesgos'], properties: {
    resumen: { type: 'string' },
    logros: { type: 'array', items: { type: 'string' } },
    prioridades: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['titulo', 'por_que'], properties: { titulo: { type: 'string' }, por_que: { type: 'string' } } } },
    riesgos: { type: 'array', items: { type: 'string' } } } }
};
// Parecido entre dos textos de tareas (0 a 1), por palabras significativas en común.
function ex_parecido_(a, b) {
  const vac = { para: 1, con: 1, por: 1, que: 1, del: 1, los: 1, las: 1, una: 1, uno: 1, sus: 1, como: 1, este: 1, esta: 1, sobre: 1, entre: 1, hacer: 1, pendiente: 1 };
  const tk = function (s) { const o = {}; ex_norm_(s).replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).forEach(function (w) { if (w.length > 2 && !vac[w]) o[w] = 1; }); return Object.keys(o); };
  const A = tk(a), B = tk(b); if (!A.length || !B.length) return 0;
  const comunes = A.filter(function (w) { return B.indexOf(w) >= 0; }).length;
  return Math.max(comunes / (A.length + B.length - comunes), comunes >= 3 ? comunes / Math.min(A.length, B.length) * 0.9 : 0);
}
function ex_asistente_(p) {
  const modo = ['semana', 'contenido', 'tareas'].indexOf(p.modo) >= 0 ? p.modo : 'dia';
  const ctx = String(p.contexto || '').slice(0, 40000);
  if (!ctx) throw new Error('sin contexto');
  return { ok: true, modo: modo, r: ex_llamarClaude_(ctx, EX_AS_SISTEMA[modo], EX_AS_ESQUEMA[modo]) };
}

/* ---------- agente de ventas con IA ---------- */
const EX_AG_SISTEMA = [
  'Eres el asistente de ventas de Blackline Puerto Varas, tienda de bicicletas Specialized (e-bikes como Turbo Levo, Turbo Vado, Turbo Como, Kenevo; MTB como Stumpjumper, Epic, Chisel; ruta y gravel como Tarmac, Roubaix, Diverge), repuestos, accesorios y taller de mantención en Puerto Varas, Chile.',
  'Trabajas para el encargado de la tienda. Lees las conversaciones de WhatsApp Business (y otras interacciones) con un contacto y organizas el CRM como lo haría un vendedor experto y ordenado. No escribes a clientes: solo analizas y organizas.',
  '',
  'Tu trabajo con cada conversación:',
  '1. Resumir en 1 a 3 frases qué quiere la persona y en qué quedó la conversación.',
  '2. Clasificar el contacto: Cliente (quiere comprar, mantener o reparar), Proveedor (vende a la tienda: marcas, distribuidores, servicios), Institución, Equipo (gente de la tienda), Otro, Ignorar (spam, publicidad o conversación personal sin relación con la tienda) o Por clasificar si no está claro.',
  '3. Extraer datos útiles para vender: nombre real si lo dice, correo, modelo o producto de interés, talla o altura, uso (enduro, trail, ruta, ciudad), presupuesto, plazo, forma de pago, objeciones, quién más decide, competencia que menciona.',
  '4. Decidir la negociación: crear una si hay intención real de compra o servicio y no existe una abierta; actualizar la existente; o ninguna. Etapas en orden: Nuevo, Contactado, Prueba / visita, Cotización, Negociación. Usa Ganada o Perdida solo si la conversación lo dice explícitamente (ya compró, ya pagó; o compró en otro lado, no le interesa). Estima el valor en pesos chilenos solo si se mencionó un precio o un modelo concreto; si no, 0.',
  '5. Detectar compromisos y crear recordatorios: lo que el encargado prometió (te aviso, te mando la cotización, te confirmo stock) y lo que acordó el cliente (paso el sábado, lo pienso y te digo el lunes). Cada uno con fecha concreta resuelta desde la fecha de hoy que se te entrega; si no hay fecha clara, usa el día hábil siguiente.',
  '6. Definir la próxima acción más efectiva para avanzar la venta, con fecha.',
  '7. Indicar si el cliente está esperando respuesta del encargado (su último mensaje no tiene respuesta).',
  '8. Proponer una idea breve de respuesta (tono cercano, chileno, profesional) solo si el cliente espera respuesta; si no, deja el texto vacío.',
  '',
  'Si la conversación es antigua o fue importada, crea tareas solo para compromisos que sigan pendientes: si la fecha ya pasó y no hay señales de que se cumplió, agéndala para hoy; si ya se cumplió, no la crees.',
  'Si se entrega STOCK EN BSALE, úsalo: di en el resumen si lo que pide está disponible (modelo y talla), menciona la disponibilidad real en la idea de respuesta y en la próxima acción, y si no hay stock de lo pedido sugiere la alternativa disponible más parecida o encargarla. Nunca prometas stock que no aparece.',
  'Reglas: no inventes datos que no estén en la conversación; si un dato no aparece, deja el texto vacío. No repitas tareas que ya existen en la lista de tareas abiertas que se te entrega. Escribe todo en español de Chile. Responde solo con el JSON pedido.'
].join('\n');

const EX_AG_ESQUEMA = {
  type: 'object', additionalProperties: false,
  required: ['resumen', 'temperatura', 'contacto', 'negociacion', 'tareas', 'proxima_accion', 'esperando_respuesta', 'idea_respuesta'],
  properties: {
    resumen: { type: 'string' },
    temperatura: { type: 'string', enum: ['caliente', 'tibio', 'frio', 'sin_intencion'] },
    contacto: {
      type: 'object', additionalProperties: false, required: ['nombre', 'tipo', 'email', 'etiquetas', 'datos_clave'],
      properties: {
        nombre: { type: 'string' },
        tipo: { type: 'string', enum: ['Cliente', 'Proveedor', 'Institución', 'Equipo', 'Otro', 'Por clasificar', 'Ignorar'] },
        email: { type: 'string' },
        etiquetas: { type: 'array', items: { type: 'string' } },
        datos_clave: { type: 'string' }
      }
    },
    negociacion: {
      type: 'object', additionalProperties: false, required: ['accion', 'titulo', 'producto', 'valor_estimado', 'etapa', 'motivo_perdida'],
      properties: {
        accion: { type: 'string', enum: ['crear', 'actualizar', 'ninguna'] },
        titulo: { type: 'string' },
        producto: { type: 'string' },
        valor_estimado: { type: 'integer' },
        etapa: { type: 'string', enum: ['Nuevo', 'Contactado', 'Prueba / visita', 'Cotización', 'Negociación', 'Ganada', 'Perdida'] },
        motivo_perdida: { type: 'string' }
      }
    },
    tareas: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false, required: ['texto', 'fecha', 'hora', 'urgente'],
        properties: { texto: { type: 'string' }, fecha: { type: 'string' }, hora: { type: 'string' }, urgente: { type: 'boolean' } }
      }
    },
    proxima_accion: { type: 'object', additionalProperties: false, required: ['texto', 'fecha'], properties: { texto: { type: 'string' }, fecha: { type: 'string' } } },
    esperando_respuesta: { type: 'boolean' },
    idea_respuesta: { type: 'string' }
  }
};

function ex_hojaAg_() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(EX_HOJA_AG);
  if (!sh) { sh = ss.insertSheet(EX_HOJA_AG); sh.appendRow(EX_CAB_AG); sh.setFrozenRows(1); }
  return sh;
}

// Llama a Claude con la conversación y devuelve el análisis (JSON validado por esquema).
function ex_llamarClaude_(contexto, sistema, esquema) {
  const props = PropertiesService.getScriptProperties();
  const clave = props.getProperty('ANTHROPIC_API_KEY');
  if (!clave) throw new Error('falta ANTHROPIC_API_KEY en las propiedades del script');
  const modelo = props.getProperty('AGENTE_MODELO') || EX_AG_MODELO, haiku = /haiku/.test(modelo);
  const cuerpo = {
    model: modelo,
    max_tokens: 8000,
    // Haiku: esfuerzo bajo (lo más barato). Opus/Sonnet: esfuerzo medio y respaldo automático si el modelo rechaza.
    output_config: { effort: haiku ? 'low' : 'medium', format: { type: 'json_schema', schema: esquema || EX_AG_ESQUEMA } },
    system: [{ type: 'text', text: sistema || EX_AG_SISTEMA, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: contexto }]
  };
  const headers = { 'x-api-key': clave, 'anthropic-version': '2023-06-01' };
  if (!haiku) { cuerpo.fallbacks = 'default'; headers['anthropic-beta'] = 'server-side-fallback-2026-07-01'; }
  const r = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true, payload: JSON.stringify(cuerpo), headers: headers
  });
  const j = JSON.parse(r.getContentText() || '{}');
  if (r.getResponseCode() !== 200) throw new Error('Claude respondió ' + r.getResponseCode() + ': ' + ((j.error && j.error.message) || '').slice(0, 200));
  if (j.stop_reason === 'refusal') throw new Error('Claude no analizó esta conversación');
  const txt = (j.content || []).filter(function (c) { return c.type === 'text'; }).map(function (c) { return c.text; }).join('');
  return JSON.parse(txt);
}

// Arma el contexto (perfil, negociación abierta, tareas abiertas y la conversación) para un contacto.
function ex_contextoAgente_(id) {
  const tz = ex_tz_(), b = ex_baseHojas_();
  const c = ex_filasContactos_(b.cs).filter(function (r) { return String(r[0]) === id; })[0];
  if (!c) throw new Error('no encuentro el contacto ' + id);
  const fmt = function (d) { return d instanceof Date ? Utilities.formatDate(d, tz, 'yyyy-MM-dd HH:mm') : String(d || ''); };
  const wa = ex_hojaWa_(), nw = wa.getLastRow() - 1;
  const chat = (nw > 0 ? wa.getRange(2, 1, nw, EX_CAB_WA.length).getValues() : []).filter(function (r) { return String(r[6]) === id; })
    .sort(function (x, y) { return x[0] - y[0]; }).slice(-150)
    .map(function (r) { return '[' + fmt(r[0]) + '] ' + (r[1] === 'Enviado' ? 'TIENDA' : 'CLIENTE') + ': ' + String(r[4]).slice(0, 400); });
  const ni = b.is.getLastRow() - 1;
  const otras = (ni > 0 ? b.is.getRange(2, 1, ni, 4).getValues() : []).filter(function (r) { return String(r[1]) === id && !/whatsapp|agente/i.test(r[2]); })
    .sort(function (x, y) { return x[0] - y[0]; }).slice(-15).map(function (r) { return '[' + fmt(r[0]) + '] ' + r[2] + ': ' + r[3]; });
  const neg = ex_filasNeg_(ex_hojaNeg_()).filter(function (r) { return String(r[2]) === id && r[10] === 'Abierta'; })[0];
  const tareas = ex_hoja_().getRange(EX_PRIMERA, 1, EX_ULTIMA - EX_PRIMERA + 1, 15).getValues()
    .filter(function (r) { return r[1] && r[0] !== true && String(r[14]).indexOf(id) >= 0; }).map(function (r) { return '- ' + r[1] + (r[9] instanceof Date ? ' (' + ex_ymd_(r[9], tz) + ')' : ''); });
  const contexto = [
    'Hoy es ' + Utilities.formatDate(new Date(), tz, "EEEE yyyy-MM-dd HH:mm") + ' (hora de Chile).',
    '', 'CONTACTO: ' + JSON.stringify({ nombre: c[2], tipo: c[1], empresa: c[3], email: c[4], telefono: String(c[5] || ''), etiquetas: c[6], notas: c[7] }),
    '', 'NEGOCIACIÓN ABIERTA: ' + (neg ? JSON.stringify({ titulo: neg[1], etapa: neg[3], valor: neg[4], producto: neg[5], proxima_accion: neg[8], notas: neg[12] }) : 'ninguna'),
    '', 'TAREAS ABIERTAS CON ESTE CONTACTO:', tareas.length ? tareas.join('\n') : '(ninguna)',
    '', 'OTRAS INTERACCIONES:', otras.length ? otras.join('\n') : '(ninguna)',
    '', 'CONVERSACIÓN DE WHATSAPP (más antigua primero):', chat.length ? chat.join('\n') : '(sin mensajes)'
  ].join('\n');
  const stock = ex_bsaleParaAgente_(chat.slice(-60).join(' ') + ' ' + (neg ? neg[5] : '') + ' ' + c[6]);
  return { contexto: stock ? contexto + '\n\nSTOCK EN BSALE (consultado ahora, productos que se mencionan):\n' + stock : contexto, c: c, neg: neg };
}

// Analiza la conversación de un contacto y aplica los cambios al CRM (desde la app: ya corre con el Sheet tomado).
function ex_agente_(id) {
  id = String(id || '');
  const ctx = ex_contextoAgente_(id);
  return ex_aplicarAgente_(id, ctx, ex_llamarClaude_(ctx.contexto));
}

function ex_aplicarAgente_(id, ctx, a) {
  const tz = ex_tz_();
  const b = ex_baseHojas_(), filas = ex_filasContactos_(b.cs), i = filas.findIndex(function (r) { return String(r[0]) === id; });
  const cambios = [], c = filas[i], ac = a.contacto || {};
  // Contacto: completa lo que falta, sin pisar lo que tú ya definiste.
  if (ac.nombre && (/^\+?[\d\s()-]+$/.test(String(c[2])) || /^#(ERROR!|NAME\?|VALUE!)/.test(String(c[2])) || !c[2])) { b.cs.getRange(i + 2, 3).setValue(ac.nombre); cambios.push('nombre: ' + ac.nombre); }
  if (ac.tipo && ac.tipo !== 'Por clasificar' && (c[1] === 'Por clasificar' || !c[1])) { b.cs.getRange(i + 2, 2).setValue(ac.tipo); cambios.push('tipo: ' + ac.tipo); }
  if (ac.email && !c[4]) { b.cs.getRange(i + 2, 5).setValue(ac.email.toLowerCase()); cambios.push('correo'); }
  const tags = String(c[6] || '').split(',').map(function (t) { return t.trim(); }).filter(String);
  (ac.etiquetas || []).forEach(function (t) { if (t && !tags.some(function (x) { return ex_norm_(x) === ex_norm_(t); })) tags.push(t); });
  if (tags.join(', ') !== String(c[6] || '')) { b.cs.getRange(i + 2, 7).setValue(tags.slice(0, 12).join(', ')); cambios.push('etiquetas'); }
  if (ac.datos_clave && !c[7]) b.cs.getRange(i + 2, 8).setValue('🧠 ' + ac.datos_clave);
  if (ac.tipo === 'Ignorar' && c[1] === 'Por clasificar') return ex_registrarAgente_(id, c, a, cambios.concat('marcado Ignorar'));
  // Negociación
  const n = a.negociacion || {}, etapas = ['Nuevo', 'Contactado', 'Prueba / visita', 'Cotización', 'Negociación'];
  let negId = ctx.neg ? String(ctx.neg[0]) : '';
  if (!ctx.neg && n.accion === 'crear' && etapas.indexOf(n.etapa) >= 0) {
    negId = ex_guardarNegocio_({ titulo: n.titulo || (ac.nombre || c[2]) + (n.producto ? ' – ' + n.producto : ''), contacto: id, etapa: n.etapa, producto: n.producto, valor: n.valor_estimado || 0, origen: '🧠 Agente WhatsApp', proxima: (a.proxima_accion || {}).texto || '', fechaProx: (a.proxima_accion || {}).fecha || '', cierre: ex_diaYmd_(ex_proxima_(ex_dia_(ex_hoyYmd_(tz)), 'Quincenal')) }).id;
    cambios.push('negociación nueva: ' + n.etapa);
  } else if (ctx.neg && n.accion !== 'ninguna') {
    const upd = { id: negId };
    if (n.producto && !ctx.neg[5]) upd.producto = n.producto;
    if (/^\+?\d[\d\s]+( –|$)/.test(String(ctx.neg[1])) && (ac.nombre || n.titulo)) upd.titulo = n.titulo || ac.nombre + (n.producto ? ' – ' + n.producto : '');
    if (n.valor_estimado > 0 && !Number(ctx.neg[4])) upd.valor = n.valor_estimado;
    if (etapas.indexOf(n.etapa) > etapas.indexOf(String(ctx.neg[3]))) { upd.etapa = n.etapa; cambios.push('etapa → ' + n.etapa); }
    if (a.proxima_accion && a.proxima_accion.texto) { upd.proxima = a.proxima_accion.texto; upd.fechaProx = a.proxima_accion.fecha || ''; }
    // Ganada o perdida: lo confirmas tú (el agente solo lo sugiere como próxima acción).
    if (n.etapa === 'Ganada' || n.etapa === 'Perdida') { upd.proxima = '🧠 Confirmar: ¿' + (n.etapa === 'Ganada' ? 'compró? → marcar Ganada' : 'se perdió? (' + (n.motivo_perdida || 'sin motivo') + ') → marcar Perdida'); upd.fechaProx = ex_hoyYmd_(tz); cambios.push('sugiere ' + n.etapa); }
    if (Object.keys(upd).length > 1) ex_guardarNegocio_(upd);
  }
  // Recordatorios de lo conversado (sin repetir los que ya creó ni duplicar tareas pendientes parecidas).
  const props = PropertiesService.getScriptProperties(), hechas = JSON.parse(props.getProperty('EX_AG_TAREAS') || '[]');
  const pend = ex_hoja_().getRange(EX_PRIMERA, 1, EX_ULTIMA - EX_PRIMERA + 1, 15).getValues().filter(function (r) { return r[1] && r[0] !== true; }).map(function (r) { return { t: String(r[1]), n: String(r[14] || '') }; });
  (a.tareas || []).slice(0, 4).forEach(function (t) {
    if (!t.texto) return;
    const k = ex_firma_(id + '|' + ex_norm_(t.texto) + '|' + t.fecha);
    if (hechas.indexOf(k) >= 0) return;
    if (pend.some(function (x) { const s2 = ex_parecido_(x.t, t.texto); return s2 >= 0.75 || (s2 >= 0.45 && x.n.indexOf(id) >= 0); })) { hechas.push(k); cambios.push('tarea omitida (ya existe una parecida): ' + t.texto); return; }
    pend.push({ t: t.texto, n: id });
    hechas.push(k);
    app_agregar_({ tarea: { tarea: t.texto, area: 'Trabajo', categoria: 'Ventas', proyecto: '', limite: /^\d{4}-\d{2}-\d{2}$/.test(t.fecha) ? t.fecha : ex_hoyYmd_(tz), urgente: t.urgente ? 'Sí' : 'No', importante: 'Sí', tamano: 'Pequeña', notas: (t.hora ? '⏰ ' + t.hora + ' · ' : '') + '🧠 WhatsApp · ' + (ac.nombre || c[2]) + ' [' + id + ']' + (negId ? ' (' + negId + ')' : ''), estado: 'Pendiente' } });
    cambios.push('tarea: ' + t.texto);
  });
  props.setProperty('EX_AG_TAREAS', JSON.stringify(hechas.slice(-400)));
  return ex_registrarAgente_(id, c, a, cambios);
}

function ex_registrarAgente_(id, c, a, cambios) {
  const b = ex_baseHojas_();
  b.is.appendRow([new Date(), id, '🧠 Agente', a.resumen + (a.contacto && a.contacto.datos_clave ? ' · ' + a.contacto.datos_clave : ''), '', 'ai:' + id + ':' + Date.now()]);
  if (a.esperando_respuesta && a.idea_respuesta) b.is.appendRow([new Date(), id, '🧠 Idea de respuesta', a.idea_respuesta, '', 'ai:' + id + ':r' + Date.now()]);
  ex_hojaAg_().appendRow([new Date(), id, (a.contacto && a.contacto.nombre) || c[2], a.resumen, a.temperatura, cambios.join(' · '), a.esperando_respuesta ? a.idea_respuesta : '']);
  ex_recalcular_(b.cs, b.is);
  PropertiesService.getScriptProperties().setProperty('EX_AG_ULTIMO', new Date().toISOString());
  return { ok: true, resumen: a.resumen, temperatura: a.temperatura, cambios: cambios, esperando: a.esperando_respuesta, idea: a.idea_respuesta };
}

// Ronda automática (cada 10 min): analiza las conversaciones con mensajes nuevos que ya se calmaron.
function ex_rondaAgente_() {
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('ANTHROPIC_API_KEY')) return;
  const pend = JSON.parse(props.getProperty('EX_AG_PEND') || '{}'), listos = Object.keys(pend).filter(function (id) { return Date.now() - pend[id] > EX_AG_ESPERA_MIN * 60000; }).slice(0, EX_AG_MAX_POR_RONDA);
  const hechos = {};
  listos.forEach(function (id) {
    try {
      // La llamada a Claude va sin tomar el Sheet; solo se toma para guardar los cambios.
      const a = ex_llamarClaude_(ex_contextoAgente_(id).contexto);
      ex_conLock_(function () { ex_aplicarAgente_(id, ex_contextoAgente_(id), a); hechos[id] = pend[id]; });
    } catch (err) { console.log('Agente ' + id + ': ' + err.message); hechos[id] = pend[id]; }
  });
  // Se relee la lista: si llegaron mensajes nuevos mientras tanto, esa conversación queda para la próxima ronda.
  ex_conLock_(function () {
    const ahora = JSON.parse(props.getProperty('EX_AG_PEND') || '{}');
    Object.keys(hechos).forEach(function (id) { if (ahora[id] === hechos[id]) delete ahora[id]; });
    props.setProperty('EX_AG_PEND', JSON.stringify(ahora));
  });
}

/* ---------- tareas automáticas (cada hora y cada 6 horas) ---------- */
function ex_instalarTriggers_() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (['ex_tareaHoraria', 'ex_tareaBase', 'ex_tareaAgente'].indexOf(t.getHandlerFunction()) >= 0) ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('ex_tareaAgente').timeBased().everyMinutes(10).create();
  ScriptApp.newTrigger('ex_tareaHoraria').timeBased().everyHours(1).create();
  ScriptApp.newTrigger('ex_tareaBase').timeBased().everyHours(6).create();
}
function ex_conLock_(fn) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) return;
  try { fn(); } finally { lock.releaseLock(); }
}
function ex_tareaHoraria() { if (ex_cuentaVigente_()) ex_conLock_(ex_sincCalendario_); }
function ex_tareaBase() {
  if (!ex_cuentaVigente_()) return;
  ex_conLock_(ex_escanearBase_);
  if (ex_bsaleToken_()) { try { ex_bsaleCatalogo_(); } catch (e) { console.log('Bsale: ' + e.message); } }   // renueva el catálogo una vez al día
  const pr = PropertiesService.getScriptProperties();
  if (pr.getProperty('IG_TOKEN') && String(pr.getProperty('EX_IG_SINC') || '').slice(0, 10) !== new Date().toISOString().slice(0, 10)) { try { ex_igSinc_(); } catch (e) { console.log('Instagram: ' + e.message); } }
}
function ex_tareaAgente() { if (ex_cuentaVigente_()) ex_rondaAgente_(); }

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
        // Último día del evento (los de día completo terminan a las 00:00 del día siguiente).
        fechaFin: Utilities.formatDate(new Date(termino.getTime() - (todoElDia ? 1 : 0)), tz, 'yyyy-MM-dd'),
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
