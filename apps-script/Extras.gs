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

const EX_VERSION = '2026-11-30';
const EX_NIVEL = 31;      // la app lo usa para saber qué funciones tiene este script
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
    case 'chat':       return ex_chat_(p);
    case 'chats':      return ex_chats_(p);
    case 'comprasIA':  return ex_comprasIA_(p);
    case 'contactosLote': {
      const lk = LockService.getScriptLock();
      if (!lk.tryLock(30000)) throw new Error('El script está ocupado. Intenta en un minuto.');
      try { return ex_contactosLote_(p); } finally { lk.releaseLock(); }
    }
    case 'depurar': {
      const lk = LockService.getScriptLock();
      if (!lk.tryLock(30000)) throw new Error('El script está ocupado (llegando mensajes). Intenta en un minuto.');
      try { return ex_depurar_(p); } finally { lk.releaseLock(); }
    }
    case 'nota':       return ex_nota_(p);
    case 'escanear':   return ex_escanearBase_();
    case 'negocios':   return ex_leerNegocios_();
    case 'negocio':    return ex_guardarNegocio_(p.negocio || {});
    case 'negocioNota': return ex_notaNegocio_(p);
    case 'whatsapp': { // de a un aviso a la vez (el historial llega en muchas partes seguidas); si está ocupado, Meta reintenta
      const lk = LockService.getScriptLock();
      if (!lk.tryLock(20000)) return { ok: false, error: 'ocupado, reintentar' };
      try { return ex_whatsapp_(p); } finally { lk.releaseLock(); }
    }
    case 'agente':     return ex_agente_(p.id);
    case 'importarChat': return ex_importarChat_(p);
    case 'bsale':      return ex_bsale_(p);
    case 'asistente':  return ex_asistente_(p);
    case 'instagram':  return ex_instagram_(p);
    case 'contenido':  return ex_contenido_(p);
    case 'perfilar':   return ex_perfilarOp_(p);
    case 'perfilCorregir': return ex_corregirPerfil_(p);
    case 'oportunidad': return ex_oportunidad_(p);
    case 'leadsCanal': return ex_leadsCanal_(p);
    case 'igEstrategia': return ex_igEstrategia_(p);
    case 'marca':      return ex_marca_(p);
    case 'imagen':     return ex_imagen_(p);
    case 'piezas':     return ex_piezas_(p);
    case 'subirMedia': return ex_subirMedia_(p);
    case 'publicar':   return ex_publicarPieza_(p);
    case 'specialized': return ex_specialized_(p);
    case 'noticias':   return Object.assign({ ok: true }, ex_noticias_(!!p.forzar));
    case 'clima':      return { ok: true, clima: ex_clima_() };
    case 'avisos':     return ex_avisos_(p);
    case 'fuentes':    return ex_fuentes_(p);
    case 'copiloto':   return ex_copiloto_(p);
    case 'cerebro':    return ex_cerebro_(p);
    case 'global':     return ex_contextoGlobal_(p);
    case 'proveedores': return ex_proveedores_(p);
    case 'tareaIA':    return ex_tareaIA_(p);
    case 'bsaleVentas': return ex_bsaleVentas_(p);
    case 'eventoCrear': return ex_eventoCrear_(p);
    case 'eventos':    return { ok: true, eventos: int_eventosRango_(ex_tz_(), String(p.desde || ''), String(p.hasta || '')) };
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
  return { ok: true, version: EX_VERSION, nivel: EX_NIVEL, filas: filas, calendario: EX_CAL_NOMBRE, wa: pr.getProperty('EX_WA_ULTIMO') || '', waHist: JSON.parse(pr.getProperty('EX_WA_HIST') || 'null'),
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
    .sort(function (a, b2) { return b2.fecha.localeCompare(a.fecha); }).slice(0, 1500);
  let bs = null; try { bs = ex_bsaleResumen_(); } catch (e) {}
  return { ok: true, contactos: contactos, interacciones: inter, perfiles: ex_leerPerfiles_(), oportunidades: ex_leerOps_(), stock: bs };
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
    r[13] = (r[13] ? r[13] + '|' : '') + (/^\d{4}-\d{2}-\d{2}$/.test(String(n.fechaEtapa || '')) ? n.fechaEtapa : hoy) + ':' + etapa;
    r[10] = etapa === 'Ganada' ? 'Ganada' : etapa === 'Perdida' ? 'Perdida' : 'Abierta';
  }
  r[14] = new Date();
  if (i >= 0) sh.getRange(i + 2, 1, 1, EX_CAB_NEG.length).setValues([r]);
  else sh.appendRow(r);
  if (etapa === 'Ganada' && antes !== 'Ganada') { try { ex_postventa_(r, n.fechaEtapa); } catch (e) { console.log('postventa: ' + e.message); } }
  if (r[2] && (i < 0 || etapa !== antes)) {
    const b = ex_baseHojas_();
    const det = i < 0 ? 'Nueva negociación: ' + r[1] : r[1] + ': ' + antes + ' → ' + etapa + (etapa === 'Perdida' && r[11] ? ' (' + r[11] + ')' : '');
    b.is.appendRow([new Date(), String(r[2]), etapa === 'Ganada' ? '🏆 Venta ganada' : '🤝 Negociación', det, '', 'd:' + r[0] + ':' + Date.now()]);
    ex_recalcular_(b.cs, b.is);
  }
  return { ok: true, id: String(r[0]) };
}

// Postventa automática: al ganar una venta se agenda el seguimiento que fideliza al cliente.
// Solo crea los pasos cuya fecha aún no pasó, una sola vez por negociación. Se desactiva con la propiedad POSTVENTA = no.
function ex_postventa_(r, fechaVenta) {
  const props = PropertiesService.getScriptProperties();
  if (props.getProperty('POSTVENTA') === 'no' || typeof app_agregar_ !== 'function') return;
  const id = String(r[0]), hechas = JSON.parse(props.getProperty('EX_POSTVENTA') || '[]');
  if (hechas.indexOf(id) >= 0) return;
  const tz = ex_tz_(), hoy = ex_hoyYmd_(tz), base = /^\d{4}-\d{2}-\d{2}$/.test(String(fechaVenta || '')) ? fechaVenta : hoy;
  const mas = function (d) { return ex_ymd_(new Date(ex_aFecha_(base, tz).getTime() + d * 86400000 + 43200000), tz); };
  let nombre = 'cliente «' + String(r[1] || '').slice(0, 50) + '»';
  try { const c = ex_filasContactos_(ex_baseHojas_().cs).find(function (x) { return String(x[0]) === String(r[2]); }); if (c && c[2]) nombre = String(c[2]); } catch (e) {}
  const prod = String(r[5] || r[1] || 'su compra').slice(0, 60), ref = ' · 🏆 Postventa · ' + nombre + (r[2] ? ' [' + r[2] + ']' : '') + ' (' + id + ')';
  [[0, 'Entrega y ajuste a medida: ' + prod + ' – ' + nombre, 'Sí'],
   [2, 'Registrar la garantía en Specialized y la bici en la bitácora – ' + nombre, 'No'],
   [7, 'Llamar a ' + nombre + ': ¿cómo le va con ' + prod + '? Resolver dudas de uso', 'No'],
   [30, 'Invitar a ' + nombre + ' a la revisión gratuita de los 30 días (reapriete y ajuste)', 'No'],
   [45, 'Pedirle a ' + nombre + ' una foto o reseña de su experiencia (contenido para Redes, con permiso)', 'No']
  ].forEach(function (x) {
    const f = mas(x[0]); if (f < hoy) return;
    app_agregar_({ tarea: { tarea: x[1], area: 'Trabajo', categoria: 'Ventas', proyecto: '', limite: f, urgente: x[2], importante: 'Sí', tamano: 'Pequeña', notas: '⏰ 10:00' + ref, estado: 'Pendiente' } });
  });
  hechas.push(id); props.setProperty('EX_POSTVENTA', JSON.stringify(hechas.slice(-500)));
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

// Conversación completa de WhatsApp de un contacto (para la pestaña Chat de su ficha). Busca sus filas con
// TextFinder para no leer toda la hoja; devuelve hasta los últimos 1.500 mensajes, del más antiguo al más nuevo.
function ex_chat_(p) {
  const id = String(p.id || ''); if (!id) throw new Error('falta el contacto');
  const wa = ex_hojaWa_(), n = wa.getLastRow() - 1, tz = ex_tz_();
  if (n < 1) return { ok: true, mensajes: [] };
  const filas = wa.getRange(2, 7, n, 1).createTextFinder(id).matchEntireCell(true).findAll().map(function (r) { return r.getRow(); });
  const ancho = EX_CAB_WA.length, vistos = {};
  if (!filas.length) return { ok: true, mensajes: [] };
  // Se lee de una vez el tramo de la hoja donde están sus mensajes (mucho más rápido que fila por fila).
  const r0 = Math.min.apply(null, filas), r1 = Math.max.apply(null, filas), bloque = wa.getRange(r0, 1, r1 - r0 + 1, ancho).getValues();
  const L = filas.map(function (f) { return bloque[f - r0]; })
    .filter(function (r) { const k = String(r[7] || ''); if (k && vistos[k]) return false; vistos[k] = 1; return true; })
    .map(function (r) { return { f: r[0] instanceof Date ? Utilities.formatDate(r[0], tz, 'yyyy-MM-dd HH:mm') : String(r[0] || ''), yo: r[1] === 'Enviado', t: String(r[4] || ''), tipo: String(r[5] || '') }; })
    .sort(function (a, b) { return a.f < b.f ? -1 : a.f > b.f ? 1 : 0; });
  return { ok: true, total: L.length, mensajes: L.slice(-1500) };
}

// Lista de conversaciones (como la pantalla de chats de WhatsApp): último mensaje de cada contacto, más reciente arriba.
function ex_chats_(p) {
  const cache = CacheService.getScriptCache(), k = 'ex_chats_v1';
  if (!p.forzar) { const c = cache.get(k); if (c) return JSON.parse(c); }
  const wa = ex_hojaWa_(), n = wa.getLastRow() - 1, tz = ex_tz_(), ult = {};
  if (n > 0) {
    const v = wa.getRange(2, 1, n, 7).getValues();
    v.forEach(function (r) {
      const id = String(r[6] || ''); if (!id || /^\[(edit|errors|revoke|reaction|unsupported|system)\]$/.test(String(r[4]))) return;
      const t = r[0] instanceof Date ? r[0].getTime() : 0, u = ult[id] = ult[id] || { n: 0, t: -1 };
      u.n++; if (t >= u.t) { u.t = t; u.yo = r[1] === 'Enviado'; u.tx = String(r[4] || '').slice(0, 90); u.nom = String(r[3] || ''); u.tel = String(r[2] || ''); }
    });
  }
  const L = Object.keys(ult).map(function (id) { const u = ult[id]; return { id: id, f: u.t > 0 ? Utilities.formatDate(new Date(u.t), tz, 'yyyy-MM-dd HH:mm') : '', yo: !!u.yo, tx: u.tx, n: u.n, nom: u.nom, tel: u.tel }; })
    .sort(function (a, b) { return a.f < b.f ? 1 : a.f > b.f ? -1 : 0; });
  const out = { ok: true, chats: L.slice(0, 1500) };
  try { cache.put(k, JSON.stringify(out), 120); } catch (e) {}
  return out;
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

// Historial de chats (coexistencia): al conectar el número, si aceptas compartir el historial, Meta envía hasta
// 6 meses de conversaciones en partes (campo «history»). Se buscan en cualquier nivel del aviso, por si el proveedor
// (Telnyx) lo envuelve en su propio formato. También se leen los nombres de tus contactos («state_sync»).
// Eventos de WhatsApp que no son mensajes (ediciones, errores, reacciones…): no se guardan en el chat.
const EX_WA_RUIDO = /^(edit|errors|revoke|reaction|unsupported|system|request_welcome|ephemeral)$/;
function ex_waHistorial_(obj, propio, out, nombres, prof) {
  if (!obj || typeof obj !== 'object' || (prof || 0) > 8) return;
  if (Array.isArray(obj)) { obj.forEach(function (x) { ex_waHistorial_(x, propio, out, nombres, (prof || 0) + 1); }); return; }
  const md = obj.metadata && obj.metadata.display_phone_number ? String(obj.metadata.display_phone_number).replace(/\D/g, '') : propio;
  if (Array.isArray(obj.threads)) {
    if (obj.metadata && obj.metadata.progress != null) { out.progreso = Math.max(out.progreso || 0, +obj.metadata.progress || 0); if (obj.metadata.phase != null) out.fase = String(obj.metadata.phase); }
    obj.threads.forEach(function (th) {
      // El cliente se identifica por teléfono o, desde 2026, por su identificador de WhatsApp (BSUID, ej. «CL.1234…»).
      const ctx = th.context || {}, crudo = String(th.id || th.wa_id || ctx.user_id || ''), esUid = /^[A-Z]{2}\./.test(crudo);
      const cli = esUid ? '' : crudo.replace(/\D/g, ''), uid = esUid ? crudo : String(ctx.user_id || '');
      if (uid && ctx.username && !nombres[uid]) nombres[uid] = ctx.username;
      (th.messages || []).forEach(function (m) {
        if (EX_WA_RUIDO.test(String(m.type || ''))) return;
        const de = String(m.from || '').replace(/\D/g, '');
        const sal = m.from_user_id ? false : cli ? (de ? de !== cli : true) : (de ? !!md && de === md : true);
        const extra = sal ? { to: m.to || cli, to_user_id: m.to_user_id || uid } : { from: m.from || cli, from_user_id: m.from_user_id || uid };
        out.msgs.push({ m: Object.assign({}, m, extra), saliente: sal, historial: true });
      });
      if (cli || uid) out.chats[cli || uid] = 1;
    });
  }
  if (Array.isArray(obj.errors)) obj.errors.forEach(function (e) { if (+e.code === 2593109 || /history/i.test(String(e.title || e.message || ''))) out.rechazado = String(e.title || e.message || e.code); });
  if (Array.isArray(obj.state_sync)) obj.state_sync.forEach(function (x) { const c = x.contact || {}, t = String(c.phone_number || '').replace(/\D/g, ''); if (t && (c.full_name || c.first_name)) { nombres[t] = c.full_name || c.first_name; if (out.agenda) out.agenda[t] = nombres[t]; } });
  Object.keys(obj).forEach(function (k) { if (k !== 'threads' && k !== 'messages' && obj[k] && typeof obj[k] === 'object') ex_waHistorial_(obj[k], md, out, nombres, (prof || 0) + 1); });
}

// Agenda de WhatsApp Business (Meta la envía una vez al conectar, «smb_app_state_sync»): se guarda en la hoja
// «WA agenda» para poner nombre a los contactos que lleguen después, y se renombran los que solo tenían el número.
// ¿El contacto todavía no tiene nombre de verdad? (vacío, solo el número, el identificador de WhatsApp o un error de fórmula)
function ex_sinNombre_(nom) {
  nom = String(nom == null ? '' : nom).trim();
  return !nom || /^\+?[\d\s()-]+$/.test(nom) || /^WhatsApp [\w.]{1,8}$/.test(nom) || /^#(ERROR!|NAME\?|VALUE!)/.test(nom);
}
// Nombre propuesto por el agente: se descarta si es un número, «desconocido» o claramente no es un nombre.
function ex_nombreValido_(nom) {
  nom = String(nom || '').trim();
  return nom.length >= 2 && nom.length <= 60 && !ex_sinNombre_(nom) && !/^(desconocido|cliente|sin nombre|n\/a|no indica)$/i.test(nom) && /[a-záéíóúñ]/i.test(nom);
}

function ex_waAgenda_(nuevos) {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName('WA agenda');
  if (!sh) { sh = ss.insertSheet('WA agenda'); sh.appendRow(['Teléfono', 'Nombre', 'Actualizado']); sh.setFrozenRows(1); }
  const n = sh.getLastRow() - 1, filas = n > 0 ? sh.getRange(2, 1, n, 2).getValues() : [], pos = {}, mapa = {};
  filas.forEach(function (r, i) { const t = String(r[0]).replace(/\D/g, ''); if (t) { pos[t] = i + 2; mapa[t] = String(r[1] || ''); } });
  if (!nuevos) return mapa;
  const altas = [];
  Object.keys(nuevos).forEach(function (t) {
    if (!nuevos[t] || mapa[t] === nuevos[t]) return;
    if (pos[t]) sh.getRange(pos[t], 2, 1, 2).setValues([[nuevos[t], new Date()]]); else altas.push(["'" + t, nuevos[t], new Date()]);
    mapa[t] = nuevos[t];
  });
  if (altas.length) sh.getRange(sh.getLastRow() + 1, 1, altas.length, 3).setValues(altas);
  // Contactos que solo tenían el número como nombre.
  const b = ex_baseHojas_(), fc = ex_filasContactos_(b.cs), ult9 = function (t) { return String(t || '').replace(/\D/g, '').slice(-9); }, porU = {};
  Object.keys(nuevos).forEach(function (t) { if (t.length >= 9) porU[ult9(t)] = nuevos[t]; });
  let renombrados = 0;
  fc.forEach(function (r, i) {
    const nom = String(r[2] || ''), nu = porU[ult9(r[5])];
    if (nu && ex_sinNombre_(nom)) { b.cs.getRange(i + 2, 3).setValue(nu); renombrados++; }
  });
  return { agenda: Object.keys(nuevos).length, renombrados: renombrados };
}

function ex_whatsapp_(p) {
  const pay = p.payload || {}, msgs = [], nombres = {}, uidTel = {};
  if (pay.data && pay.data.event_type) ex_desdeTelnyx_(pay, msgs, nombres);
  const hist = { msgs: [], chats: {}, progreso: null, rechazado: '', agenda: {} };
  ex_waHistorial_(pay, '', hist, nombres, 0);
  const agendaRes = Object.keys(hist.agenda).length ? ex_waAgenda_(hist.agenda) : null;
  hist.msgs.forEach(function (x) { msgs.push(x); });
  const anotarHist = function (n, chats) {
    if (!hist.msgs.length && !hist.rechazado) return;
    const pr = PropertiesService.getScriptProperties(), H = JSON.parse(pr.getProperty('EX_WA_HIST') || '{}');
    H.mensajes = (H.mensajes || 0) + n; H.chats = (H.chats || 0) + chats;
    if (hist.progreso != null) { H.progreso = Math.max(hist.progreso, H.fase === hist.fase ? H.progreso || 0 : 0); H.fase = hist.fase || H.fase; H.fases = H.fases || {}; if (hist.fase != null) H.fases[hist.fase] = Math.max(H.fases[hist.fase] || 0, hist.progreso); }
    if (hist.rechazado) H.rechazado = hist.rechazado;
    H.ultimo = new Date().toISOString(); if (!H.desde) H.desde = H.ultimo;
    pr.setProperty('EX_WA_HIST', JSON.stringify(H));
  };
  (pay.entry || []).forEach(function (en) {
    (en.changes || []).forEach(function (ch) {
      const v = ch.value || {}, campo = String(ch.field || '');
      const propio = String((v.metadata && v.metadata.display_phone_number) || '').replace(/\D/g, '');
      (v.contacts || []).forEach(function (c) {
        const nom = (c.profile && (c.profile.name || c.profile.username)) || '';
        if (c.wa_id) nombres[String(c.wa_id)] = nom;
        if (c.user_id) { nombres[String(c.user_id)] = nom; if (c.wa_id) uidTel[String(c.user_id)] = String(c.wa_id).replace(/\D/g, ''); }
      });
      const add = function (m, saliente) { if (m && m.id && !EX_WA_RUIDO.test(String(m.type || '')) && (m.from || m.to || m.from_user_id || m.to_user_id)) msgs.push({ m: m, saliente: saliente }); };
      (v.messages || []).forEach(function (m) { add(m, campo === 'smb_message_echoes' || (!!propio && String(m.from) === propio)); });
      (v.message_echoes || []).forEach(function (m) { add(m, true); });
    });
  });
  if (!msgs.length){ anotarHist(0, 0); return agendaRes ? { ok: true, mensajes: 0, agenda: agendaRes.agenda, renombrados: agendaRes.renombrados } : { ok: true, mensajes: 0 }; }
  const agenda = ex_waAgenda_(null);
  const b = ex_baseHojas_(), wa = ex_hojaWa_(), neg = ex_hojaNeg_(), hoy = Date.now();
  const filasC = ex_filasContactos_(b.cs), contactos = {}, porTel = {};
  const ult9 = function (t) { return String(t || '').replace(/\D/g, '').slice(-9); };
  filasC.forEach(function (r, i) { if (!r[0]) return; contactos[String(r[0])] = { fila: i + 2, tipo: r[1], nombre: r[2], tel: String(r[5] || '') }; if (ult9(r[5]).length === 9) porTel[ult9(r[5])] = String(r[0]); });
  const ni = b.is.getLastRow() - 1, claves = {};
  (ni > 0 ? b.is.getRange(2, 6, ni, 1).getValues() : []).forEach(function (r) { claves[String(r[0])] = true; });
  const abiertas = {};
  ex_filasNeg_(neg).forEach(function (r, i) { if (r[0] && r[10] === 'Abierta' && r[2]) (abiertas[String(r[2])] = abiertas[String(r[2])] || []).push(i + 2); });
  const nuevosC = [], nuevasI = [], filasWa = [], telefonos = [], renombres = [], reactivar = [], actividad = {}, leads = [], histIds = {}, largos = {}; let histN = 0;
  msgs.sort(function (x, y) { return Number(x.m.timestamp || 0) - Number(y.m.timestamp || 0); });
  msgs.forEach(function (x) {
    const m = x.m, clave = 'w:' + m.id;
    if (claves[clave]) { const tx = ex_textoWa_(m); if (tx.length > 500) largos[m.id] = tx; return; }
    claves[clave] = true;
    // Teléfono del cliente; si Meta no lo envía (clientes con nombre de usuario), se usa su identificador (BSUID).
    const uid = String(x.saliente ? (m.to_user_id || '') : (m.from_user_id || ''));
    let tel = String(x.saliente ? (m.to || '') : (m.from || '')).replace(/\D/g, '');
    if (!tel && uid && uidTel[uid]) tel = uidTel[uid];
    if (!tel && !uid) return;
    const fecha = new Date(Number(m.timestamp || 0) * 1000 || hoy), texto = ex_textoWa_(m);
    const nombreWa = nombres[tel] || nombres[uid] || agenda[tel] || '';
    let id = tel ? porTel[ult9(tel)] : '';
    // Si ya existía por su identificador y ahora llega su teléfono, se completa el mismo contacto.
    if (!id && uid && contactos['wa:u:' + uid]) { id = 'wa:u:' + uid; if (tel) porTel[ult9(tel)] = id; }
    if (!id) {
      id = tel ? 'wa:+' + tel : 'wa:u:' + uid;
      if (!contactos[id]) {
        const intencion = EX_WA_INTENCION.test(ex_norm_(texto));
        const fila = [id, intencion ? 'Cliente' : 'Por clasificar', nombreWa || (tel ? '+' + tel : 'WhatsApp ' + uid.slice(-4)), '', '', tel ? "'+" + tel : '', '', '', '', 0, '💬 WhatsApp', new Date()];
        contactos[id] = { tipo: fila[1], nombre: fila[2], tel: tel ? '+' + tel : '', nuevo: true };
        nuevosC.push(fila);
      }
      if (tel) porTel[ult9(tel)] = id;
    }
    const c = contactos[id];
    if (c.tipo === 'Ignorar') return;
    // Un contacto archivado que vuelve a escribir (mensaje en vivo) vuelve a la base.
    if (c.tipo === 'Archivado' && !x.historial && !x.saliente && c.fila) { reactivar.push(c.fila); c.tipo = 'Por clasificar'; }
    // Nombre de la tarjeta de WhatsApp (perfil o agenda) para quien solo tenía el número.
    if (!c.nuevo && c.fila && nombreWa && ex_sinNombre_(c.nombre)) { renombres.push([c.fila, nombreWa]); c.nombre = nombreWa; }
    if (tel && !c.nuevo && !ult9(c.tel) && c.fila) { telefonos.push([c.fila, '+' + tel]); c.tel = '+' + tel; }
    nuevasI.push([fecha, id, x.saliente ? '💬 WhatsApp enviado' : '💬 WhatsApp recibido', texto.slice(0, 300), tel ? 'https://wa.me/' + tel : '', clave]);
    filasWa.push([fecha, x.saliente ? 'Enviado' : 'Recibido', tel ? '+' + tel : uid, c.nombre || nombreWa, texto.slice(0, 4000), m.type || '', id, m.id]);
    if (abiertas[id]) abiertas[id].forEach(function (f) { if (!actividad[f] || fecha > actividad[f]) actividad[f] = fecha; });
    // Lead nuevo: mensaje reciente con intención de compra de alguien sin negociación abierta.
    if (x.historial){ histIds[id] = c.nombre || nombreWa || id; histN++; return; }
    if (!x.saliente && !abiertas[id] && hoy - fecha.getTime() < 30 * 86400000 && EX_WA_INTENCION.test(ex_norm_(texto))) {
      const mod = texto.match(EX_WA_MODELOS);
      leads.push({ titulo: (c.nombre || nombreWa || (tel ? '+' + tel : 'WhatsApp')) + (mod ? ' – ' + mod[1].replace(/\s+/g, ' ').replace(/\b\w/g, function (l) { return l.toUpperCase(); }) : ' – WhatsApp'), contacto: id, producto: mod ? mod[1] : '', proxima: 'Responder por WhatsApp', fechaProx: ex_hoyYmd_(), origen: '💬 WhatsApp', notas: 'Primer mensaje: ' + texto.slice(0, 200) });
      abiertas[id] = [];
    }
  });
  if (nuevosC.length) b.cs.getRange(b.cs.getLastRow() + 1, 1, nuevosC.length, EX_CAB_CONTACTOS.length).setValues(nuevosC);
  telefonos.forEach(function (t) { b.cs.getRange(t[0], 6).setValue("'" + t[1]); });
  renombres.forEach(function (t) { b.cs.getRange(t[0], 3).setValue(t[1]); });
  reactivar.forEach(function (f) { b.cs.getRange(f, 2).setValue('Por clasificar'); });
  // Mensajes que antes se guardaron cortados (500 caracteres): se completan si vuelven a llegar enteros.
  Object.keys(largos).forEach(function (mid) {
    const cel = wa.getRange(2, 8, Math.max(1, wa.getLastRow() - 1), 1).createTextFinder(mid).matchEntireCell(true).findNext();
    if (cel) { const r = wa.getRange(cel.getRow(), 5); if (String(r.getValue()).length < largos[mid].length) r.setValue(largos[mid].slice(0, 4000)); }
  });
  if (nuevasI.length) b.is.getRange(b.is.getLastRow() + 1, 1, nuevasI.length, EX_CAB_INTER.length).setValues(nuevasI);
  if (filasWa.length) wa.getRange(wa.getLastRow() + 1, 1, filasWa.length, EX_CAB_WA.length).setValues(filasWa);
  Object.keys(actividad).forEach(function (f) { neg.getRange(Number(f), 15).setValue(actividad[f]); });
  leads.forEach(function (l) { ex_guardarNegocio_(l); });
  ex_recalcular_(b.cs, b.is);
  const props = PropertiesService.getScriptProperties();
  props.setProperty('EX_WA_ULTIMO', new Date().toISOString());
  try { CacheService.getScriptCache().remove('ex_chats_v1'); } catch (e) {}
  // El agente revisa estas conversaciones en su próxima ronda (cada 10 min), cuando la conversación se calme.
  const pend = JSON.parse(props.getProperty('EX_AG_PEND') || '{}');
  filasWa.forEach(function (f) { if (!histIds[f[6]]) pend[f[6]] = Date.now(); });
  props.setProperty('EX_AG_PEND', JSON.stringify(pend));
  // Chats del historial: el agente arma el perfil de cada contacto en modo masivo (sin tareas ni negocios antiguos).
  anotarHist(histN, Object.keys(histIds).length);
  if (props.getProperty('ANTHROPIC_API_KEY')) Object.keys(histIds).forEach(function (id) { try { ex_encolarPerfil_(id, histIds[id]); } catch (e) {} });
  return { ok: true, mensajes: nuevasI.length, contactosNuevos: nuevosC.length, leads: leads.length, historial: Object.keys(histIds).length };
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
  if (p.masivo) { ex_encolarPerfil_(id, nombre); return out; }
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
const EX_CAB_IG = ['Fecha', 'Seguidores', 'Siguiendo', 'Publicaciones', 'Alcance', 'Vistas', 'Interacciones', 'Cuentas que interactuaron', 'Toques en links', 'Guardados', 'Compartidos', 'Nuevos seguidores', 'Dejaron de seguir', 'Toques mensaje', 'Toques llamar', 'Toques cómo llegar'];
const EX_CAB_IGP = ['ID', 'Fecha', 'Tipo', 'Formato', 'Texto', 'Link', 'Me gusta', 'Comentarios', 'Guardados', 'Compartidos', 'Alcance', 'Vistas', 'Interacciones', 'Tiempo medio reel (s)', 'Actualizado', 'Nuevos seguidores', 'Visitas al perfil', 'Toques link bio', 'Toques mensaje', 'Saltos reel (%)', 'Respuestas'];
const EX_CAB_IGA = ['Fecha', 'Tipo', 'Clave', 'Valor'];
const EX_CAB_CONT = ['ID', 'Fecha', 'Formato', 'Tema', 'Idea / guion', 'Texto sugerido', 'Hashtags', 'Objetivo', 'Por qué ahora', 'Estado', 'Creado', 'Relacionado', 'Pilar', 'Hora', 'Llamado a la acción', 'Código', 'Publicación'];
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
// Valores por desglose (breakdown): { FOLLOWER: 3, NON_FOLLOWER: 1 } o { TEXT: 4, CALL: 1 }.
function ex_igDesglose_(j, metrica) {
  const m = ((j && j.data) || []).filter(function (x) { return x.name === metrica; })[0], out = {};
  ((m && m.total_value && m.total_value.breakdowns) || []).forEach(function (b) { (b.results || []).forEach(function (r) { out[String((r.dimension_values || [])[0])] = (out[String((r.dimension_values || [])[0])] || 0) + (+r.value || 0); }); });
  return out;
}
function ex_igCab_(sh, cab) { if (sh.getRange(1, cab.length).getValue() !== cab[cab.length - 1]) sh.getRange(1, 1, 1, cab.length).setValues([cab]).setFontWeight('bold'); }

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
  ex_igCab_(sh, EX_CAB_IG);
  // Métricas con desglose distinto van en consultas separadas (si se mezclan, Instagram responde error).
  const met = 'reach,views,total_interactions,accounts_engaged,profile_links_taps,saves,shares';
  const rango = function (d) { const s0 = Math.floor(d.getTime() / 1000); return '&period=day&metric_type=total_value&since=' + s0 + '&until=' + (s0 + 86400); };
  const res = ex_igVarias_(dias.map(function (d) { return '/me/insights?metric=' + met + rango(d); }), tok);
  const resF = ex_igVarias_(dias.map(function (d) { return '/me/insights?metric=follows_and_unfollows&breakdown=follow_type' + rango(d); }), tok);
  const resC = ex_igVarias_(dias.map(function (d) { return '/me/insights?metric=profile_links_taps&breakdown=contact_button_type' + rango(d); }), tok);
  dias.forEach(function (d, k) {
    const f = Utilities.formatDate(d, tz, 'yyyy-MM-dd'), j = res[k], ayer = k === dias.length - 1;
    const fu = ex_igDesglose_(resF[k], 'follows_and_unfollows'), ct = ex_igDesglose_(resC[k], 'profile_links_taps'), v = function (o, key) { return resF[k] || resC[k] ? (o[key] || 0) : ''; };
    const fila = [f, ayer ? yo.followers_count : '', ayer ? yo.follows_count : '', ayer ? yo.media_count : '', ex_igValor_(j, 'reach'), ex_igValor_(j, 'views'), ex_igValor_(j, 'total_interactions'), ex_igValor_(j, 'accounts_engaged'), ex_igValor_(j, 'profile_links_taps'),
      ex_igValor_(j, 'saves'), ex_igValor_(j, 'shares'), resF[k] ? (fu.FOLLOWER || 0) : '', resF[k] ? (fu.NON_FOLLOWER || 0) : '', resC[k] ? (ct.TEXT || 0) : '', resC[k] ? (ct.CALL || 0) : '', resC[k] ? (ct.DIRECTION || 0) : ''];
    while (fila.length < EX_CAB_IG.length) fila.push('');
    if (idx[f] != null) { const prev = filas[idx[f]]; for (let c = 1; c < fila.length; c++) if (fila[c] === '' && prev[c] !== '') fila[c] = prev[c]; filas[idx[f]] = fila; }
    else { idx[f] = filas.length; filas.push(fila); }
  });
  filas.sort(function (a, b) { return String(a[0] instanceof Date ? Utilities.formatDate(a[0], tz, 'yyyy-MM-dd') : a[0]).localeCompare(String(b[0] instanceof Date ? Utilities.formatDate(b[0], tz, 'yyyy-MM-dd') : b[0])); });
  if (filas.length) sh.getRange(2, 1, filas.length, EX_CAB_IG.length).setValues(filas.map(function (r) { return [r[0] instanceof Date ? Utilities.formatDate(r[0], tz, 'yyyy-MM-dd') : "'" + String(r[0]).replace(/^'/, '')].concat(r.slice(1)); }));
  // Publicaciones: las últimas 100 con sus métricas (una lista de métricas por tipo; si una falla, se reintenta con las básicas).
  let media = [], url = '/me/media?fields=id,caption,media_type,media_product_type,permalink,timestamp,like_count,comments_count&limit=50';
  for (let pag = 0; pag < 2 && url; pag++) { const j = ex_igGet_(url, tok); media = media.concat(j.data || []); url = j.paging && j.paging.next ? j.paging.next.replace(/^https:\/\/graph\.instagram\.com\/v[\d.]+/, '').replace(/[&?]access_token=[^&]*/, '') : ''; }
  media = media.slice(0, 100);
  const filasP = ex_igMediaFilas_(media, tok, tz);
  const sp = ex_hojaCab_('IG Publicaciones', EX_CAB_IGP); ex_igCab_(sp, EX_CAB_IGP);
  if (sp.getLastRow() > 1) sp.getRange(2, 1, sp.getLastRow() - 1, EX_CAB_IGP.length).clearContent();
  if (filasP.length) sp.getRange(2, 1, filasP.length, EX_CAB_IGP.length).setValues(filasP.map(function (r) { r[0] = "'" + r[0]; r[1] = "'" + r[1]; return r; }));
  try { ex_igSincHistorias_(tok); } catch (e) { console.log('Historias: ' + e.message); }
  if (Date.now() - new Date(pr.getProperty('EX_IG_AUD') || 0).getTime() > 6 * 86400000) { try { ex_igAudiencia_(tok); } catch (e) { console.log('Audiencia: ' + e.message); } }
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
  const num = function (v) { return v === '' || v == null ? '' : +v; };
  const dias = (n > 0 ? sh.getRange(Math.max(2, n - 88), 1, Math.min(n, 90), EX_CAB_IG.length).getValues() : []).map(function (r) { return { fecha: f(r[0]), seguidores: r[1], alcance: r[4], vistas: r[5], interacciones: r[6], cuentas: r[7], links: r[8], guardados: num(r[9]), compartidos: num(r[10]), nuevos: num(r[11]), bajas: num(r[12]), tMensaje: num(r[13]), tLlamar: num(r[14]), tLlegar: num(r[15]) }; });
  const fila = function (r) { return { id: String(r[0]).replace(/^'/, ''), fecha: r[1] instanceof Date ? Utilities.formatDate(r[1], tz, 'yyyy-MM-dd HH:mm') : String(r[1]).replace(/^'/, ''), tipo: r[2], formato: r[3], texto: r[4], link: r[5], likes: +r[6] || 0, comentarios: +r[7] || 0, guardados: +r[8] || 0, compartidos: +r[9] || 0, alcance: +r[10] || 0, vistas: +r[11] || 0, interacciones: +r[12] || 0, reelSeg: r[13], seguidos: num(r[15]), visitas: num(r[16]), bio: num(r[17]), mensaje: num(r[18]), saltos: num(r[19]), respuestas: num(r[20]) }; };
  const posts = (np > 0 ? sp.getRange(2, 1, np, EX_CAB_IGP.length).getValues() : []).map(fila);
  const shH = SpreadsheetApp.getActive().getSheetByName('IG Historias'), nh = shH ? shH.getLastRow() - 1 : 0;
  const historias = (nh > 0 ? shH.getRange(Math.max(2, nh - 198), 1, Math.min(nh, 200), EX_CAB_IGP.length).getValues() : []).map(fila);
  const shA = SpreadsheetApp.getActive().getSheetByName('IG Audiencia'), na = shA ? shA.getLastRow() - 1 : 0;
  const aud = na > 0 ? shA.getRange(2, 1, na, 4).getValues() : [];
  const audiencia = aud.length ? { fecha: aud[0][0] instanceof Date ? Utilities.formatDate(aud[0][0], tz, 'yyyy-MM-dd') : '', items: aud.map(function (r) { return { tipo: r[1], clave: String(r[2]), valor: +r[3] || 0 }; }) } : null;
  return { ok: true, activo: true, usuario: pr.getProperty('IG_USUARIO') || '', sinc: pr.getProperty('EX_IG_SINC') || '', dias: dias, posts: posts.concat(historias), audiencia: audiencia, resultado: sinc };
}
const EX_IG_MET = {
  FEED: ['reach,saved,shares,views,total_interactions,follows,profile_visits', 'reach,saved,shares,views,total_interactions'],
  REELS: ['reach,saved,shares,views,total_interactions,ig_reels_avg_watch_time,reels_skip_rate', 'reach,saved,shares,views,total_interactions,ig_reels_avg_watch_time'],
  STORY: ['reach,views,shares,total_interactions,replies,follows,profile_visits', 'reach,views,replies']
};
function ex_igMediaFilas_(media, tok, tz) {
  const tipo = function (m) { return EX_IG_MET[m.media_product_type] ? m.media_product_type : 'FEED'; };
  let ins = ex_igVarias_(media.map(function (m) { return '/' + m.id + '/insights?metric=' + EX_IG_MET[tipo(m)][0]; }), tok);
  const fallan = []; ins.forEach(function (j, k) { if (!j) fallan.push(k); });
  if (fallan.length) { const re = ex_igVarias_(fallan.map(function (k) { return '/' + media[k].id + '/insights?metric=' + EX_IG_MET[tipo(media[k])][1]; }), tok); fallan.forEach(function (k, i) { ins[k] = re[i]; }); }
  // Toques en el link de la bio y en "mensaje" desde cada publicación (feed e historias).
  const conAct = media.map(function (m, k) { return tipo(m) === 'REELS' ? -1 : k; }).filter(function (k) { return k >= 0; });
  const act = ex_igVarias_(conAct.map(function (k) { return '/' + media[k].id + '/insights?metric=profile_activity&breakdown=action_type'; }), tok), actDe = {};
  conAct.forEach(function (k, i) { actDe[k] = act[i] ? ex_igDesglose_(act[i], 'profile_activity') : null; });
  const ahora = new Date();
  return media.map(function (m, k) {
    const j = ins[k], wt = ex_igValor_(j, 'ig_reels_avg_watch_time'), a = actDe[k];
    return [m.id, Utilities.formatDate(new Date(m.timestamp), tz, 'yyyy-MM-dd HH:mm'), m.media_type || '', m.media_product_type || '', String(m.caption || '').slice(0, 500), m.permalink || '', m.like_count || 0, m.comments_count || 0,
      ex_igValor_(j, 'saved'), ex_igValor_(j, 'shares'), ex_igValor_(j, 'reach'), ex_igValor_(j, 'views'), ex_igValor_(j, 'total_interactions'), wt !== '' ? Math.round(wt / 100) / 10 : '', ahora,
      ex_igValor_(j, 'follows'), ex_igValor_(j, 'profile_visits'), a ? (a.BIO_LINK_CLICKED || 0) : '', a ? (a.TEXT || 0) : '', ex_igValor_(j, 'reels_skip_rate'), ex_igValor_(j, 'replies')];
  });
}
// Historias: duran 24 horas, así que se guardan en su propia hoja cada vez que corre la sincronización (cada 6 horas).
function ex_igSincHistorias_(tok) {
  tok = tok || ex_igToken_(); if (!tok) return 0;
  const tz = ex_tz_(), j = ex_igGet_('/me/stories?fields=id,media_type,media_product_type,permalink,timestamp,caption', tok), L = (j.data || []).map(function (m) { m.media_product_type = 'STORY'; return m; });
  if (!L.length) return 0;
  const filas = ex_igMediaFilas_(L, tok, tz), sh = ex_hojaCab_('IG Historias', EX_CAB_IGP); ex_igCab_(sh, EX_CAB_IGP);
  const n = sh.getLastRow() - 1, ids = n > 0 ? sh.getRange(2, 1, n, 1).getValues().map(function (r) { return String(r[0]).replace(/^'/, ''); }) : [];
  filas.forEach(function (r) { const i = ids.indexOf(String(r[0])), fila = r.slice(); fila[0] = "'" + fila[0]; fila[1] = "'" + fila[1]; if (i >= 0) sh.getRange(i + 2, 1, 1, fila.length).setValues([fila]); else { sh.appendRow(fila); ids.push(String(r[0])); } });
  return filas.length;
}
// Audiencia: ciudades, países, edades y género de los seguidores (una vez por semana; requiere 100+ seguidores).
function ex_igAudiencia_(tok) {
  const res = ex_igVarias_(['city', 'country', 'age', 'gender'].map(function (b) { return '/me/insights?metric=follower_demographics&period=lifetime&metric_type=total_value&timeframe=this_month&breakdown=' + b; }), tok);
  const hoy = new Date(), filas = [];
  ['city', 'country', 'age', 'gender'].forEach(function (b, i) { const d = ex_igDesglose_(res[i], 'follower_demographics'); Object.keys(d).sort(function (x, y) { return d[y] - d[x]; }).slice(0, 20).forEach(function (k) { filas.push([hoy, b, k, d[k]]); }); });
  PropertiesService.getScriptProperties().setProperty('EX_IG_AUD', hoy.toISOString());
  if (!filas.length) return 0;
  const sh = ex_hojaCab_('IG Audiencia', EX_CAB_IGA);
  if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, EX_CAB_IGA.length).clearContent();
  sh.getRange(2, 1, filas.length, EX_CAB_IGA.length).setValues(filas);
  return filas.length;
}

// Calendario de contenido (hoja "Contenido"): listar, guardar ideas, editarlas y cambiar su estado.
// Cada idea lleva pilar, hora, llamado a la acción y un código (IG-XXXX) para medir cuántos clientes llegan por ella a WhatsApp.
function ex_codigoIG_(tema, usados) {
  const base = ex_norm_(tema).toUpperCase().replace(/[^A-Z0-9 ]/g, ' ').split(/\s+/).filter(function (w) { return w.length >= 3 && !/^(PARA|CON|LOS|LAS|DEL|UNA|QUE|COMO|TU|SU)$/.test(w); }).slice(0, 2).join('').slice(0, 8) || 'POST';
  let k = 'IG-' + base, i = 2; while (usados[k]) k = 'IG-' + base.slice(0, 7) + (i++);
  usados[k] = 1; return k;
}
function ex_contenido_(p) {
  const tz = ex_tz_(), sh = ex_hojaCab_('Contenido', EX_CAB_CONT), C = EX_CAB_CONT.length;
  if (sh.getRange(1, C).getValue() !== EX_CAB_CONT[C - 1]) sh.getRange(1, 1, 1, C).setValues([EX_CAB_CONT]).setFontWeight('bold');
  const leer = function () { const n = sh.getLastRow() - 1; return n > 0 ? sh.getRange(2, 1, n, C).getValues() : []; };
  if (p.accion === 'guardar') {
    const usados = {}; leer().forEach(function (r) { if (r[15]) usados[String(r[15])] = 1; });
    const filas = (p.items || []).map(function (x, k) {
      return ['ct-' + Date.now() + '-' + k, "'" + String(x.fecha || ''), x.formato || '', x.tema || '', x.idea || '', x.texto || '', x.hashtags || '', x.objetivo || '', x.por_que || '', x.estado || 'Planificado', new Date(), x.relacionado || '',
        x.pilar || '', x.hora ? "'" + x.hora : '', x.cta || '', x.codigo || ex_codigoIG_(x.tema || x.idea || '', usados), x.post || ''];
    });
    if (filas.length) sh.getRange(sh.getLastRow() + 1, 1, filas.length, C).setValues(filas);
  } else if (p.accion === 'estado' || p.accion === 'editar') {
    const ids = leer(), i = ids.findIndex(function (r) { return String(r[0]) === String(p.id); });
    if (i >= 0) {
      const set = function (col, v) { sh.getRange(i + 2, col).setValue(v); };
      if (p.estado) set(10, p.estado);
      if (p.fecha) set(2, "'" + p.fecha);
      const c = p.campos || {};
      if (c.tema != null) set(4, c.tema); if (c.idea != null) set(5, c.idea); if (c.texto != null) set(6, c.texto); if (c.hashtags != null) set(7, c.hashtags);
      if (c.formato) set(3, c.formato); if (c.pilar != null) set(13, c.pilar); if (c.hora != null) set(14, c.hora ? "'" + c.hora : ''); if (c.cta != null) set(15, c.cta); if (p.post != null) set(17, p.post);
    }
  }
  const items = leer().filter(function (r) { return r[0]; }).map(function (r) {
    const f = function (v) { return v instanceof Date ? Utilities.formatDate(v, tz, 'yyyy-MM-dd') : String(v).replace(/^'/, ''); };
    return { id: String(r[0]), fecha: f(r[1]), formato: r[2], tema: r[3], idea: r[4], texto: r[5], hashtags: r[6], objetivo: r[7], por_que: r[8], estado: r[9], relacionado: String(r[11] || ''),
      pilar: String(r[12] || ''), hora: r[13] instanceof Date ? Utilities.formatDate(r[13], tz, 'HH:mm') : String(r[13] || '').replace(/^'/, ''), cta: String(r[14] || ''), codigo: String(r[15] || ''), post: String(r[16] || '') };
  });
  return { ok: true, items: items };
}
// Estrategia de Instagram guardada (diagnóstico de la IA y metas), para verla en el teléfono y en el PC.
function ex_igEstrategia_(p) {
  // Fila 2: estrategia de Instagram · fila 3: análisis del agente de Instagram · fila 4: análisis del agente de la base de clientes.
  const sh = ex_hojaCab_('IG Estrategia', ['Fecha', 'Contenido (JSON)']), fila = { estrategia: 2, insights: 3, insightsBase: 4 };
  const leer = function (r) { const v = sh.getLastRow() >= r ? sh.getRange(r, 1, 1, 2).getValues()[0] : null; let e = null; try { e = v && v[1] ? JSON.parse(v[1]) : null; } catch (err) {} return { e: e, fecha: v && v[0] instanceof Date ? v[0].toISOString() : '' }; };
  if (p.guardar) sh.getRange(fila[p.tipo] || 2, 1, 1, 2).setValues([[new Date(), JSON.stringify(p.guardar).slice(0, 45000)]]);
  const e = leer(2), i = leer(3), b = leer(4);
  return { ok: true, estrategia: e.e, fecha: e.fecha, insights: i.e, insightsFecha: i.fecha, insightsBase: b.e, insightsBaseFecha: b.fecha };
}
/* ---------- Estudio de contenido: marca, banco de imágenes, piezas (carruseles e historias), alojamiento y publicación ---------- */
// Propiedades del script: GITHUB_TOKEN (token con permiso de escritura solo en el repositorio de imágenes),
// MEDIA_REPO (opcional; por defecto SnowPv/Organizador-media), PEXELS_KEY (opcional, banco de fotos gratis).
const EX_CAB_PIEZAS = ['ID', 'Creado', 'Tipo', 'Estado', 'Título', 'Pilar', 'Texto', 'Hashtags', 'Diseño (JSON)', 'Programado', 'Imágenes', 'ID Instagram', 'Link', 'Error', 'Contenido'];
const EX_CARPETA_BANCO = 'Organizador · Banco de imágenes';

// Ejecútala una vez (▶) después de actualizar: da el permiso de Google Drive y crea la carpeta del banco de imágenes.
function autorizarEstudio() {
  const f = ex_carpetaBanco_();
  Logger.log('Listo ✓ · Sube tus fotos a esta carpeta de Drive (ponles nombres descriptivos, por ejemplo "levo-sendero-pichijuan.jpg"): ' + f.getUrl());
}
function ex_carpetaBanco_() {
  const pr = PropertiesService.getScriptProperties(), id = pr.getProperty('EX_BANCO_ID');
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) {} }
  const it = DriveApp.getFoldersByName(EX_CARPETA_BANCO), f = it.hasNext() ? it.next() : DriveApp.createFolder(EX_CARPETA_BANCO);
  pr.setProperty('EX_BANCO_ID', f.getId());
  return f;
}

// ---------- Archivo de fotos (hoja «Fotos») ----------
// Índice de todas las fotos del banco (las que subes desde el computador o el celular y las de tus carpetas de Drive),
// con una descripción hecha por la IA mirando cada foto. Así el Estudio encuentra «Levo en sendero con barro» aunque
// el archivo se llame IMG_4821.jpg, y la lista carga rápido aunque sean miles.
const EX_CAB_FOTOS = ['ID archivo', 'Carpeta', 'Nombre', 'Fecha', 'Descripción IA', 'Etiquetas', 'Origen', 'Clave', 'Carpeta ID'];
function ex_hojaFotos_() { return ex_hojaCab_('Fotos', EX_CAB_FOTOS); }
function ex_carpetaSubidas_() {
  const pr = PropertiesService.getScriptProperties(), id = pr.getProperty('EX_SUBIDAS_ID');
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) {} }
  const banco = ex_carpetaBanco_(), it = banco.getFoldersByName('Fotos subidas'), f = it.hasNext() ? it.next() : banco.createFolder('Fotos subidas');
  pr.setProperty('EX_SUBIDAS_ID', f.getId());
  return f;
}
// Recibe una foto (ya achicada a ~2048 px por la app) y la guarda en Drive + índice. Si ya existe (misma clave), no la repite.
function ex_subirFoto_(p) {
  const sh = ex_hojaFotos_(), clave = String(p.clave || '').slice(0, 300);
  if (clave && sh.getLastRow() > 1 && sh.getRange(2, 8, sh.getLastRow() - 1, 1).createTextFinder(clave).matchEntireCell(true).findNext()) return { ok: true, repetida: true };
  const datos = Utilities.base64Decode(String(p.data || '').replace(/^data:[^,]+,/, ''));
  if (!datos.length) throw new Error('foto vacía');
  const nombre = String(p.nombre || 'foto.jpg').replace(/\.(heic|heif|png|webp)$/i, '.jpg').slice(0, 120), ruta = String(p.ruta || '').slice(0, 200);
  const f = ex_carpetaSubidas_().createFile(Utilities.newBlob(datos, 'image/jpeg', nombre));
  if (ruta) { try { f.setDescription(ruta); } catch (e) {} }
  sh.appendRow([f.getId(), ruta, nombre, p.fecha ? new Date(p.fecha) : new Date(), '', '', 'subida', clave, ex_carpetaSubidas_().getId()]);
  return { ok: true, id: f.getId() };
}
// Agrega al índice las fotos nuevas de tus carpetas de Drive (banco y carpetas extra, con 2 niveles de subcarpetas).
function ex_fotosSync_(maxMs) {
  const t0 = Date.now(), sh = ex_hojaFotos_(), n = sh.getLastRow() - 1, ya = {};
  (n > 0 ? sh.getRange(2, 1, n, 1).getValues() : []).forEach(function (r) { ya[String(r[0])] = 1; });
  const sub = ex_carpetaSubidas_().getId(), filas = [];
  const recorrer = function (f, ruta, raiz, nivel) {
    if (Date.now() - t0 > maxMs || f.getId() === sub) return;
    const it = f.getFiles();
    while (it.hasNext() && Date.now() - t0 < maxMs) {
      const x = it.next(); if (ya[x.getId()] || !/^image\//.test(x.getMimeType()) || /^logo-marca/.test(x.getName())) continue;
      ya[x.getId()] = 1; filas.push([x.getId(), ruta, x.getName(), x.getDateCreated(), x.getDescription() && x.getDescription() !== ruta ? x.getDescription() : '', '', 'drive', '', raiz]);
    }
    if (nivel >= 2) return;
    const sf = f.getFolders(); while (sf.hasNext()) { const c = sf.next(); recorrer(c, (ruta ? ruta + ' / ' : '') + c.getName(), raiz, nivel + 1); }
  };
  try { const b = ex_carpetaBanco_(); recorrer(b, '', b.getId(), 0); } catch (e) {}
  ex_bancoCarpetas_().forEach(function (id) { try { const f = DriveApp.getFolderById(id); recorrer(f, f.getName(), id, 0); } catch (e) {} });
  if (filas.length) sh.getRange(sh.getLastRow() + 1, 1, filas.length, EX_CAB_FOTOS.length).setValues(filas);
  return filas.length;
}
// La IA mira las fotos sin descripción (de a 8, en miniatura) y escribe qué se ve. Modelo económico (Haiku).
const EX_FOTO_ESQUEMA = { type: 'object', additionalProperties: false, required: ['fotos'], properties: { fotos: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['i', 'descripcion', 'etiquetas'], properties: { i: { type: 'integer' }, descripcion: { type: 'string' }, etiquetas: { type: 'array', items: { type: 'string' } } } } } } };
function ex_describirFotos_(maxMs) {
  const pr = PropertiesService.getScriptProperties(), clave = pr.getProperty('ANTHROPIC_API_KEY'); if (!clave) return 0;
  const t0 = Date.now(), sh = ex_hojaFotos_(), n = sh.getLastRow() - 1; if (n < 1) return 0;
  const datos = sh.getRange(2, 1, n, 6).getValues(), pend = [];
  datos.forEach(function (r, k) { if (r[0] && !r[4]) pend.push(k); });
  let hechas = 0;
  for (let a = 0; a < pend.length && Date.now() - t0 < maxMs; a += 8) {
    const lote = pend.slice(a, a + 8), content = [{ type: 'text', text: 'Fotos de Blackline Puerto Varas (tienda Specialized de bicicletas, taller y salidas por los senderos del sur de Chile). Para cada foto escribe una descripción breve y concreta en español (qué se ve: bici y modelo si se reconoce, persona, lugar, acción, luz, si sirve para redes) y 3 a 8 etiquetas cortas.' }], idx = [];
    lote.forEach(function (k, j) {
      try {
        const b = UrlFetchApp.fetch('https://drive.google.com/thumbnail?id=' + encodeURIComponent(datos[k][0]) + '&sz=w512', { headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() } }).getBlob();
        content.push({ type: 'text', text: 'Foto i=' + j + (datos[k][1] ? ' · carpeta: ' + datos[k][1] : '') });
        content.push({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: Utilities.base64Encode(b.getBytes()) } });
        idx.push(j);
      } catch (e) { sh.getRange(k + 2, 5).setValue('(sin vista previa)'); }
    });
    if (!idx.length) continue;
    const r = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', { method: 'post', contentType: 'application/json', muteHttpExceptions: true, headers: { 'x-api-key': clave, 'anthropic-version': '2023-06-01' },
      payload: JSON.stringify({ model: pr.getProperty('FOTOS_MODELO') || 'claude-haiku-5-5', max_tokens: 2500, output_config: { format: { type: 'json_schema', schema: EX_FOTO_ESQUEMA } }, messages: [{ role: 'user', content: content }] }) });
    if (r.getResponseCode() !== 200) { console.log('Fotos IA: ' + r.getResponseCode() + ' ' + r.getContentText().slice(0, 200)); break; }
    const j = JSON.parse(r.getContentText()), txt = (j.content || []).filter(function (c) { return c.type === 'text'; }).map(function (c) { return c.text; }).join('');
    let res = []; try { res = JSON.parse(txt).fotos || []; } catch (e) {}
    res.forEach(function (x) {
      const k = lote[x.i]; if (k == null || !x.descripcion) return;
      sh.getRange(k + 2, 5, 1, 2).setValues([[String(x.descripcion).slice(0, 400), (x.etiquetas || []).slice(0, 8).join(', ')]]); hechas++;
      try { DriveApp.getFileById(datos[k][0]).setDescription(((datos[k][1] ? datos[k][1] + ' · ' : '') + x.descripcion).slice(0, 500)); } catch (e) {}
    });
  }
  return hechas;
}
function ex_fotosEstado_() {
  const sh = ex_hojaFotos_(), n = sh.getLastRow() - 1; if (n < 1) return { total: 0, pendientes: 0 };
  const v = sh.getRange(2, 5, n, 1).getValues(); return { total: n, pendientes: v.filter(function (r) { return !r[0]; }).length };
}

// Kit de marca (colores, tipografías, logo, tono y contexto del negocio), guardado en la hoja "Marca".
function ex_marca_(p) {
  const sh = ex_hojaCab_('Marca', ['Actualizado', 'Marca (JSON)']);
  if (p.guardar) sh.getRange(2, 1, 1, 2).setValues([[new Date(), JSON.stringify(p.guardar).slice(0, 45000)]]);
  if (p.logo) {   // logo en base64 → archivo en la carpeta del banco
    const b = Utilities.newBlob(Utilities.base64Decode(String(p.logo).replace(/^data:[^,]+,/, '')), p.tipoLogo || 'image/png', 'logo-marca.png');
    const f = ex_carpetaBanco_().createFile(b);
    const v = sh.getLastRow() >= 2 ? sh.getRange(2, 2).getValue() : '{}'; let m = {}; try { m = JSON.parse(v || '{}'); } catch (e) {}
    m.logo = f.getId(); sh.getRange(2, 1, 1, 2).setValues([[new Date(), JSON.stringify(m)]]);
  }
  const v = sh.getLastRow() >= 2 ? sh.getRange(2, 1, 1, 2).getValues()[0] : null; let m = null; try { m = v && v[1] ? JSON.parse(v[1]) : null; } catch (e) {}
  const pr = PropertiesService.getScriptProperties();
  return { ok: true, marca: m, alojamiento: !!pr.getProperty('GITHUB_TOKEN'), pexels: !!pr.getProperty('PEXELS_KEY'), banco: pr.getProperty('EX_BANCO_ID') ? 'https://drive.google.com/drive/folders/' + pr.getProperty('EX_BANCO_ID') : '' };
}

// Banco de imágenes: tus fotos de Instagram, la carpeta de Drive y Pexels. Las imágenes se entregan en base64
// para que la app pueda dibujarlas (el navegador no deja exportar imágenes de otros sitios).
function ex_imagen_(p) {
  const pr = PropertiesService.getScriptProperties();
  if (p.accion === 'subir') return ex_subirFoto_(p);
  if (p.accion === 'fotosEstado') { if (p.sinc) ex_fotosSync_(60000); return Object.assign({ ok: true }, ex_fotosEstado_()); }
  if (p.accion === 'listar' && ex_hojaFotos_().getLastRow() > 1) {   // desde el índice (rápido y con la descripción de la IA)
    const sh = ex_hojaFotos_(), filas = sh.getRange(2, 1, sh.getLastRow() - 1, EX_CAB_FOTOS.length).getValues(), tz = ex_tz_(), porC = {};
    const validas = {}; ex_bancoCarpetas_().forEach(function (id) { validas[id] = 1; }); try { validas[ex_carpetaBanco_().getId()] = 1; validas[ex_carpetaSubidas_().getId()] = 1; } catch (e) {}
    const out = filas.filter(function (r) { return r[0] && r[4] !== '(sin vista previa)' && (!r[8] || validas[r[8]]); }).slice(-5000).map(function (r) { porC[r[8]] = (porC[r[8]] || 0) + 1;
      return { fuente: 'drive', id: String(r[0]), nombre: [r[1], String(r[2]).replace(/\.[a-z0-9]+$/i, ''), r[4], r[5]].filter(String).join(' · ').slice(0, 400), fecha: r[3] instanceof Date ? Utilities.formatDate(r[3], tz, "yyyy-MM-dd") : '' }; }).reverse();
    const carpetas = ex_bancoCarpetas_().map(function (id) { try { return { id: id, nombre: DriveApp.getFolderById(id).getName(), fotos: porC[id] || 0 }; } catch (e) { return { id: id, nombre: '', error: 'sin acceso' }; } });
    return { ok: true, items: out, carpetas: carpetas, archivo: ex_fotosEstado_() };
  }
  if (p.accion === 'listar') {
    const out = [];
    try {
      const it = ex_carpetaBanco_().getFiles();
      while (it.hasNext() && out.length < 300) { const f = it.next(); if (/^image\//.test(f.getMimeType()) && !/^logo-marca/.test(f.getName())) out.push({ fuente: 'drive', id: f.getId(), nombre: f.getName().replace(/\.[a-z0-9]+$/i, ''), fecha: f.getDateCreated().toISOString() }); }
    } catch (e) { return { ok: true, items: [], error: 'Falta autorizar Google Drive: ejecuta autorizarEstudio en el editor.' }; }
    const carpetas = [];
    ex_bancoCarpetas_().forEach(function (id) { try { const f = DriveApp.getFolderById(id), antes = out.length; ex_fotosCarpeta_(f, f.getName(), out, 0); carpetas.push({ id: id, nombre: f.getName(), fotos: out.length - antes }); } catch (e) { carpetas.push({ id: id, nombre: '', error: 'sin acceso' }); } });
    return { ok: true, items: out, carpetas: carpetas };
  }
  if (p.accion === 'carpeta') {   // agregar o quitar una carpeta de Drive (link) al banco de fotos
    const id = ex_idCarpeta_(p.link || p.id); if (!id) throw new Error('No reconozco el link de la carpeta de Drive');
    let L = ex_bancoCarpetas_().filter(function (x) { return x !== id; });
    if (!p.quitar) { let f; try { f = DriveApp.getFolderById(id); } catch (e) { throw new Error('No tengo acceso a esa carpeta: compártela con la cuenta dueña del script'); } L.push(id); pr.setProperty('BANCO_CARPETAS', L.join(',')); let nuevas = 0; try { nuevas = ex_fotosSync_(60000); } catch (e) {} return { ok: true, nombre: f.getName(), nuevas: nuevas }; }
    pr.setProperty('BANCO_CARPETAS', L.join(',')); return { ok: true };
  }
  if (p.accion === 'spz') {   // fotos oficiales de producto (specialized.com/cl) para el modelo que se nombra
    return { ok: true, items: ex_spzBuscar_(String(p.q || ''), 4).filter(function (x) { return x.img; }).map(function (x) { return { fuente: 'spz', id: 'spz' + x.id, nombre: 'Foto oficial · ' + x.nombre, thumb: x.img.replace(/w=\d+&h=\d+/, 'w=400&h=400'), url: x.img.replace(/w=\d+&h=\d+/, 'w=1600&h=1600') }; }) };
  }
  if (p.accion === 'yt') {   // miniaturas de videos oficiales de Specialized
    return { ok: true, items: ex_biblioteca_(80).filter(function (b) { return b.tipo === 'video' && /^https:\/\/i\.ytimg\.com\//.test(b.img); }).map(function (b) { return { fuente: 'yt', id: 'yt' + b.link.split('v=')[1], nombre: b.fuente + ' · ' + b.titulo, thumb: b.img.replace('maxresdefault', 'hqdefault'), url: b.img, link: b.link }; }) };
  }
  if (p.accion === 'elegir') return ex_elegirFotos_(p);
  if (p.accion === 'biblioteca') { if (p.sinc) ex_bibliotecaSinc_(); return { ok: true, items: ex_biblioteca_(80) };
  }
  if (p.accion === 'buscar') {   // Pexels
    const k = pr.getProperty('PEXELS_KEY'); if (!k) return { ok: true, items: [], sinClave: true };
    const r = UrlFetchApp.fetch('https://api.pexels.com/v1/search?per_page=12&orientation=' + (p.orientacion || 'portrait') + '&query=' + encodeURIComponent(p.q || 'mountain bike'), { headers: { Authorization: k }, muteHttpExceptions: true });
    const j = JSON.parse(r.getContentText() || '{}');
    return { ok: true, items: (j.photos || []).map(function (x) { return { fuente: 'stock', id: String(x.id), nombre: x.alt || '', autor: x.photographer || '', thumb: x.src.medium, url: x.src.large2x || x.src.large }; }) };
  }
  if (p.accion === 'traer') {   // una o varias imágenes en base64 (máx. 12 por llamada)
    const tok = ex_igToken_();
    return { ok: true, items: (p.items || []).slice(0, 12).map(function (x) {
      try {
        let blob;
        if (x.fuente === 'drive') blob = UrlFetchApp.fetch('https://drive.google.com/thumbnail?id=' + encodeURIComponent(x.id) + '&sz=w' + (x.ancho || 1600), { headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() } }).getBlob();
        else if (x.fuente === 'ig') { const m = ex_igGet_('/' + x.id + '?fields=media_url,thumbnail_url,media_type', tok); blob = UrlFetchApp.fetch(m.media_type === 'VIDEO' ? m.thumbnail_url : m.media_url).getBlob(); }
        else if (x.fuente === 'stock' && /^https:\/\/images\.pexels\.com\//.test(x.url || '')) blob = UrlFetchApp.fetch(x.url.split('?')[0] + '?auto=compress&cs=tinysrgb&w=' + (x.ancho || 1600)).getBlob();
        else if (x.fuente === 'spz' && /^https:\/\/resources\.specialized\.com\//.test(x.url || '')) blob = UrlFetchApp.fetch(x.url).getBlob();
        else if (x.fuente === 'yt' && /^https:\/\/i\.ytimg\.com\//.test(x.url || '')) { const rr = UrlFetchApp.fetch(x.url, { muteHttpExceptions: true }); blob = rr.getResponseCode() === 200 ? rr.getBlob() : UrlFetchApp.fetch(x.url.replace('maxresdefault', 'hqdefault')).getBlob(); }
        else return { id: x.id, error: 'fuente no permitida' };
        return { id: x.id, fuente: x.fuente, data: 'data:' + (blob.getContentType() || 'image/jpeg') + ';base64,' + Utilities.base64Encode(blob.getBytes()) };
      } catch (e) { return { id: x.id, error: e.message }; }
    }) };
  }
  if (p.accion === 'propias') {   // miniaturas de tus publicaciones con foto (para elegir)
    const tok = ex_igToken_(); if (!tok) return { ok: true, items: [] };
    const j = ex_igGet_('/me/media?fields=id,caption,media_type,media_url,thumbnail_url,timestamp&limit=50', tok);
    return { ok: true, items: (j.data || []).filter(function (m) { return m.media_url || m.thumbnail_url; }).map(function (m) { return { fuente: 'ig', id: m.id, nombre: String(m.caption || '').split('\n')[0].slice(0, 120), thumb: m.media_type === 'VIDEO' ? m.thumbnail_url : m.media_url, fecha: m.timestamp }; }) };
  }
  throw new Error('acción desconocida');
}


/* ---------- Estudio 2: fotos atingentes y biblioteca de conocimiento ---------- */
// Carpetas de Drive extra para el banco de fotos (por ejemplo, una carpeta compartida desde la cuenta de la tienda).
function ex_bancoCarpetas_() { return String(PropertiesService.getScriptProperties().getProperty('BANCO_CARPETAS') || '').split(',').filter(Boolean); }
function ex_idCarpeta_(link) { const m = String(link || '').match(/folders\/([\w-]{10,})|^([\w-]{20,})$/); return m ? (m[1] || m[2]) : ''; }
// Lista las fotos de una carpeta y sus subcarpetas (hasta 2 niveles). El nombre incluye la ruta de carpetas: da contexto ("Levo 4 / sendero").
function ex_fotosCarpeta_(f, ruta, out, nivel) {
  const it = f.getFiles();
  while (it.hasNext() && out.length < 900) { const x = it.next(); if (/^image\//.test(x.getMimeType()) && !/^logo-marca/.test(x.getName())) out.push({ fuente: 'drive', id: x.getId(), nombre: (ruta ? ruta + ' / ' : '') + x.getName().replace(/\.[a-z0-9]+$/i, '') + (x.getDescription() ? ' · ' + x.getDescription() : ''), fecha: x.getDateCreated().toISOString() }); }
  if (nivel >= 2) return;
  const sub = f.getFolders();
  while (sub.hasNext() && out.length < 900) { const s = sub.next(); ex_fotosCarpeta_(s, (ruta ? ruta + ' / ' : '') + s.getName(), out, nivel + 1); }
}
const EX_EST_MTB = [
  'CONOCIMIENTO MTB (úsalo para que el contenido sea experto y correcto):',
  '- E-MTB Specialized: Turbo Levo 4 (motor Specialized 2.2, 111 Nm, batería 840 Wh, aluminio o carbono, 160/150 mm), Levo SL 2 (motor SL 1.2, 50 Nm, 320 Wh + range extender de 160 Wh, liviana, sensación natural), Kenevo SL 2 (enduro/park liviana), Turbo Vado y Vado SL (urbana y trekking), Turbo Como (urbana cómoda), Turbo Tero (aventura). La app Specialized (Mission Control/Specialized App) permite ajustar la asistencia (modos Eco, Trail, Turbo y Smart Control para llegar con batería al final de la ruta).',
  '- Autonomía de una e-bike: depende del modo de asistencia, el desnivel, el peso del ciclista, la presión de neumáticos, la temperatura (el frío baja la capacidad), la cadencia (pedalear más rápido y suave rinde más) y el estado de la batería. Cuidados: cargar entre 20 y 80 % para guardarla, no dejarla al sol ni bajo 0 °C, guardarla a media carga en invierno.',
  '- Mantención relevante para Puerto Varas (lluvia y barro): limpiar y lubricar la cadena después de rodar mojado (lubricante húmedo en invierno, seco o cerámico en verano), revisar pastillas de freno (se gastan rápido en barro), servicio de suspensión cada 50 a 100 horas (sellos y aceite), presión de neumáticos según peso y terreno, revisión de los 30 días para bicis nuevas (reapriete de pernos y ajuste de cambios).',
  '- Temas que más interesan a la comunidad MTB (Pinkbike, Vital MTB): comparativas y reviews honestas, setup de suspensión (sag, rebote), geometría y tallas, neumáticos y presiones, e-bike vs bici normal, rutas y senderos locales, mantención casera, carreras de enduro y downhill, tecnología nueva (motores, baterías, transmisiones inalámbricas SRAM AXS y Shimano Di2).',
  '- Senderos y lugares cercanos para contenido: cerro Pichijuán y Philippi (Puerto Varas), lago Llanquihue, volcán Osorno y Calbuco, Ensenada, Petrohué, Frutillar, Huilo Huilo.'
].join('\n');
const EX_EST_FOTOS = [
  'Eres el editor de fotografía de Blackline Puerto Varas (tienda Specialized). Eliges qué foto va en cada lámina de un carrusel o historia de Instagram. La calidad y la pertinencia importan más que llenar: es mejor dejar una lámina sin foto que poner una foto que no corresponde.',
  'Reglas estrictas:',
  '- Si la lámina habla de e-bikes (Levo, Kenevo, Vado, Como, batería, motor, autonomía, asistencia), la foto debe mostrar una e-bike reconocible (tubo inferior grueso con batería, motor en el pedalier). Nunca una bici sin motor.',
  '- Si habla de MTB, la foto debe ser de MTB (suspensión, neumáticos con taco, sendero). Nada de bicis de ruta, urbanas, de niños, BMX ni bicis antiguas, salvo que el tema sea exactamente ese.',
  '- Descarta fotos sin relación con ciclismo o con el tema (banderas, comida, personas posando sin bici, interiores sin bicis, textos, logos de otras marcas, memes).',
  '- Prefiere, en este orden: fotos propias de la tienda (Instagram o banco de Drive) que calcen; fotos oficiales de producto Specialized cuando se habla de un modelo; material oficial de Specialized University; y fotos de stock solo para paisajes o ambiente genérico.',
  '- Evita repetir la misma foto en dos láminas. La portada necesita la foto más potente.',
  '- Para cada lámina devuelve el id elegido y una nota de 0 a 10 (7 o más: calza bien; 5 a 6: sirve y es coherente con el tema aunque no sea exacta). Prefiere usar una foto de 5 o 6 antes que dejar la lámina sin foto: Gustavo no tiene tiempo de sacar fotos para cada pieza.',
  '- Solo si ninguna candidata llega a 5, devuelve id vacío. En pedido escribe una indicación concreta (qué bici, ángulo, lugar, luz, formato vertical) SOLO para la lámina más importante sin foto (normalmente la portada); en las demás deja pedido vacío: esas láminas se diseñarán sin foto.'
].join('\n');
const EX_EST_ESQUEMA = { type: 'object', additionalProperties: false, required: ['laminas'], properties: { laminas: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['i', 'id', 'nota', 'motivo', 'pedido'], properties: {
  i: { type: 'integer' }, id: { type: 'string' }, nota: { type: 'integer' }, motivo: { type: 'string' }, pedido: { type: 'string' } } } } } };
// Mira las fotos candidatas (con visión) y elige la mejor para cada lámina, o pide que se saque una.
function ex_elegirFotos_(p) {
  const pr = PropertiesService.getScriptProperties(), clave = pr.getProperty('ANTHROPIC_API_KEY'); if (!clave) throw new Error('falta ANTHROPIC_API_KEY');
  const modelo = pr.getProperty('ESTUDIO_MODELO') || 'claude-sonnet-5-5', tok = ex_igToken_(), C = (p.candidatos || []).slice(0, 36), content = [];
  content.push({ type: 'text', text: 'Pieza: ' + String(p.titulo || '') + '\nLáminas que necesitan foto:\n' + (p.laminas || []).map(function (l) { return '- Lámina ' + l.i + ' (' + l.layout + '): «' + String(l.titulo || '').slice(0, 120) + '» · foto buscada: ' + String(l.descripcion || '') + ' · palabras: ' + (l.palabras || []).join(', '); }).join('\n') + '\n\nCandidatas (cada imagen va precedida de su id y su fuente):' });
  let n = 0;
  C.forEach(function (x) {
    try {
      let blob;
      if (x.fuente === 'drive') blob = UrlFetchApp.fetch('https://drive.google.com/thumbnail?id=' + encodeURIComponent(x.id) + '&sz=w480', { headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() } }).getBlob();
      else if (x.fuente === 'ig') { const m = ex_igGet_('/' + x.id + '?fields=media_url,thumbnail_url,media_type', tok); blob = UrlFetchApp.fetch(m.media_type === 'VIDEO' ? m.thumbnail_url : m.media_url).getBlob(); }
      else if (x.fuente === 'stock' && /^https:\/\/images\.pexels\.com\//.test(x.url || '')) blob = UrlFetchApp.fetch(x.url.split('?')[0] + '?auto=compress&cs=tinysrgb&w=480').getBlob();
      else if (x.fuente === 'spz' && /^https:\/\/resources\.specialized\.com\//.test(x.url || '')) blob = UrlFetchApp.fetch(x.url.replace(/w=\d+&h=\d+/, 'w=480&h=480')).getBlob();
      else if (x.fuente === 'yt' && /^https:\/\/i\.ytimg\.com\//.test(x.url || '')) blob = UrlFetchApp.fetch(x.url.replace('maxresdefault', 'hqdefault')).getBlob();
      if (!blob || blob.getBytes().length > 3500000) return;
      const tipo = /png/.test(blob.getContentType()) ? 'image/png' : /webp/.test(blob.getContentType()) ? 'image/webp' : 'image/jpeg';
      content.push({ type: 'text', text: 'id=' + x.id + ' · fuente=' + x.fuente + (x.nombre ? ' · ' + String(x.nombre).slice(0, 100) : '') });
      content.push({ type: 'image', source: { type: 'base64', media_type: tipo, data: Utilities.base64Encode(blob.getBytes()) } });
      n++;
    } catch (e) {}
  });
  if (!n) return { ok: true, laminas: (p.laminas || []).map(function (l) { return { i: l.i, id: '', nota: 0, motivo: 'sin candidatas', pedido: 'Foto vertical para «' + (l.titulo || '') + '»: ' + (l.descripcion || '') }; }) };
  const cuerpo = { model: modelo, max_tokens: 4000, output_config: { effort: 'low', format: { type: 'json_schema', schema: EX_EST_ESQUEMA } }, system: EX_EST_FOTOS, messages: [{ role: 'user', content: content }] };
  const headers = { 'x-api-key': clave, 'anthropic-version': '2023-06-01' };
  if (!/haiku/.test(modelo)) { cuerpo.fallbacks = 'default'; headers['anthropic-beta'] = 'server-side-fallback-2026-07-01'; }
  const r = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', { method: 'post', contentType: 'application/json', muteHttpExceptions: true, payload: JSON.stringify(cuerpo), headers: headers });
  const j = JSON.parse(r.getContentText() || '{}');
  if (r.getResponseCode() !== 200) throw new Error('Claude respondió ' + r.getResponseCode() + ': ' + ((j.error && j.error.message) || '').slice(0, 200));
  const txt = (j.content || []).filter(function (c) { return c.type === 'text'; }).map(function (c) { return c.text; }).join('');
  return Object.assign({ ok: true, vistas: n }, JSON.parse(txt || '{"laminas":[]}'));
}

// Biblioteca: videos de Specialized University y noticias del mundo MTB, para que el contenido tenga fondo experto.
const EX_HOJA_BIB = 'Biblioteca', EX_CAB_BIB = ['Fecha', 'Fuente', 'Título', 'Resumen', 'Link', 'Imagen', 'Tipo', 'Visto'];
function ex_ytCanal_(handle) {
  const pr = PropertiesService.getScriptProperties(), k = 'YT_' + handle; let id = pr.getProperty(k);
  if (!id) { const h = UrlFetchApp.fetch('https://www.youtube.com/' + handle, { muteHttpExceptions: true, headers: { 'Accept-Language': 'es-CL,es;q=0.9' } }).getContentText(); const m = h.match(/"channelId":"(UC[\w-]{20,})"/) || h.match(/channel\/(UC[\w-]{20,})/); if (m) { id = m[1]; pr.setProperty(k, id); } }
  return id;
}
function ex_bibliotecaSinc_() {
  const sh = ex_hojaCab_(EX_HOJA_BIB, EX_CAB_BIB), n = sh.getLastRow() - 1, vistos = {};
  (n > 0 ? sh.getRange(2, 5, n, 1).getValues() : []).forEach(function (r) { vistos[String(r[0])] = 1; });
  const nuevos = [];
  ['@SpecializedUniversity', '@specialized'].forEach(function (h) {
    try {
      const id = ex_ytCanal_(h); if (!id) return;
      const x = XmlService.parse(UrlFetchApp.fetch('https://www.youtube.com/feeds/videos.xml?channel_id=' + id).getContentText()), root = x.getRootElement(), ns = root.getNamespace(), media = XmlService.getNamespace('media', 'http://search.yahoo.com/mrss/'), yt = XmlService.getNamespace('yt', 'http://www.youtube.com/xml/schemas/2015');
      root.getChildren('entry', ns).forEach(function (e) {
        const vid = e.getChildText('videoId', yt), link = 'https://www.youtube.com/watch?v=' + vid; if (vistos[link]) return;
        const g = e.getChild('group', media), desc = g ? String(g.getChildText('description', media) || '').replace(/\s+/g, ' ').slice(0, 900) : '';
        nuevos.push([new Date(e.getChildText('published', ns)), h === '@specialized' ? 'Specialized (YouTube)' : 'Specialized University', e.getChildText('title', ns), desc, link, 'https://i.ytimg.com/vi/' + vid + '/maxresdefault.jpg', 'video', new Date()]);
      });
    } catch (e) { console.log('Biblioteca ' + h + ': ' + e.message); }
  });
  try { (ex_noticias_(false).items || []).forEach(function (x) { if (!x.link || vistos[x.link]) return; nuevos.push([x.fecha ? new Date(x.fecha) : new Date(), x.fuente, x.titulo, String(x.por_que || x.resumen || '').slice(0, 600), x.link, x.img || '', x.tipo || 'noticia', new Date()]); }); } catch (e) {}
  if (nuevos.length) sh.getRange(sh.getLastRow() + 1, 1, nuevos.length, EX_CAB_BIB.length).setValues(nuevos);
  return nuevos.length;
}
function ex_biblioteca_(max) {
  const sh = SpreadsheetApp.getActive().getSheetByName(EX_HOJA_BIB); if (!sh || sh.getLastRow() < 2) return [];
  const tz = ex_tz_();
  return sh.getRange(2, 1, sh.getLastRow() - 1, EX_CAB_BIB.length).getValues().filter(function (r) { return r[2]; }).map(function (r) { return { fecha: r[0] instanceof Date ? ex_ymd_(r[0], tz) : '', fuente: String(r[1]), titulo: String(r[2]), resumen: String(r[3]), link: String(r[4]), img: String(r[5]), tipo: String(r[6]) }; })
    .sort(function (a, b) { return b.fecha.localeCompare(a.fecha); }).slice(0, max || 60);
}
function ex_bibliotecaContexto_() {
  try {
    const B = ex_biblioteca_(40); if (!B.length) return '';
    return 'BIBLIOTECA (videos oficiales de Specialized y noticias recientes del mundo MTB; úsalos como fondo y referencia, citando la fuente si corresponde):\n' + B.map(function (b) { return '- [' + b.fuente + ', ' + b.fecha + '] ' + b.titulo + (b.resumen ? ': ' + b.resumen.slice(0, 220) : ''); }).join('\n');
  } catch (e) { return ''; }
}

// Piezas: listar, guardar (nueva o editada), cambiar estado o programar.
function ex_piezas_(p) {
  const sh = ex_hojaCab_('Piezas', EX_CAB_PIEZAS), C = EX_CAB_PIEZAS.length, tz = ex_tz_();
  const leer = function () { const n = sh.getLastRow() - 1; return n > 0 ? sh.getRange(2, 1, n, C).getValues() : []; };
  if (p.guardar) {
    const x = p.guardar, filas = leer(), i = x.id ? filas.findIndex(function (r) { return String(r[0]) === String(x.id); }) : -1;
    const id = i >= 0 ? String(filas[i][0]) : 'pz-' + Date.now().toString(36);
    const fila = [id, i >= 0 ? filas[i][1] : new Date(), x.tipo || 'carrusel', x.estado || 'Borrador', x.titulo || '', x.pilar || '', x.caption || '', x.hashtags || '', JSON.stringify(x.diseno || {}).slice(0, 45000),
      x.programado ? Utilities.parseDate(String(x.programado).replace('T', ' '), tz, 'yyyy-MM-dd HH:mm') : '', (x.imagenes || []).join('\n'), i >= 0 ? filas[i][11] : '', i >= 0 ? filas[i][12] : '', '', x.contenido || (i >= 0 ? filas[i][14] : '')];
    if (i >= 0) sh.getRange(i + 2, 1, 1, C).setValues([fila]); else sh.appendRow(fila);
    p.id = id;
  }
  if (p.borrar) { const filas = leer(), i = filas.findIndex(function (r) { return String(r[0]) === String(p.borrar); }); if (i >= 0) sh.deleteRow(i + 2); }
  const items = leer().filter(function (r) { return r[0]; }).map(function (r) {
    let d = {}; try { d = JSON.parse(r[8] || '{}'); } catch (e) {}
    return { id: String(r[0]), creado: r[1] instanceof Date ? r[1].toISOString() : '', tipo: r[2], estado: r[3], titulo: r[4], pilar: r[5], caption: r[6], hashtags: r[7], diseno: d,
      programado: r[9] instanceof Date ? Utilities.formatDate(r[9], tz, "yyyy-MM-dd'T'HH:mm") : '', imagenes: String(r[10] || '').split('\n').filter(String), igId: String(r[11] || ''), link: String(r[12] || ''), error: String(r[13] || ''), contenido: String(r[14] || '') };
  }).reverse();
  return { ok: true, items: items, id: p.id || '' };
}

// Alojamiento: sube un JPEG al repositorio público de imágenes (GitHub) y devuelve el link directo que Instagram acepta.
function ex_subirMedia_(p) {
  const pr = PropertiesService.getScriptProperties(), tok = pr.getProperty('GITHUB_TOKEN');
  if (!tok) throw new Error('Falta GITHUB_TOKEN en las propiedades del script (alojamiento de imágenes).');
  const repo = pr.getProperty('MEDIA_REPO') || 'SnowPv/Organizador-media', tz = ex_tz_();
  const datos = String(p.data || '').replace(/^data:image\/jpeg;base64,/, '');
  if (!datos || datos.length > 11000000) throw new Error('imagen vacía o demasiado grande');
  const ruta = 'media/' + Utilities.formatDate(new Date(), tz, 'yyyy/MM') + '/' + String(p.nombre || ('img-' + Date.now())).replace(/[^a-z0-9._-]/gi, '-') + '.jpg';
  const r = UrlFetchApp.fetch('https://api.github.com/repos/' + repo + '/contents/' + ruta, { method: 'put', muteHttpExceptions: true, contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + tok, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' },
    payload: JSON.stringify({ message: 'Imagen ' + ruta, content: datos, branch: 'main' }) });
  const j = JSON.parse(r.getContentText() || '{}');
  if (r.getResponseCode() >= 300) throw new Error('GitHub respondió ' + r.getResponseCode() + ': ' + String(j.message || '').slice(0, 120));
  return { ok: true, url: 'https://raw.githubusercontent.com/' + repo + '/main/' + ruta };
}

// Publicación en Instagram (carrusel, imagen o historias). Si la pieza tiene fecha, la ronda horaria la publica sola.
function ex_igPost_(ruta, datos, tok) {
  const payload = Object.assign({ access_token: tok }, datos);
  const r = UrlFetchApp.fetch(EX_IG_API + ruta, { method: 'post', payload: payload, muteHttpExceptions: true });
  const j = JSON.parse(r.getContentText() || '{}');
  if (j.error) throw new Error('Instagram: ' + (j.error.error_user_msg || j.error.message || 'error') + (j.error.code ? ' (' + j.error.code + ')' : ''));
  return j;
}
function ex_igEsperar_(id, tok) {
  for (let k = 0; k < 20; k++) {
    const s = ex_igGet_('/' + id + '?fields=status_code', tok).status_code;
    if (s === 'FINISHED' || s === 'PUBLISHED') return true;
    if (s === 'ERROR' || s === 'EXPIRED') throw new Error('Instagram no pudo procesar la imagen (' + s + ')');
    Utilities.sleep(3000);
  }
  throw new Error('Instagram tardó demasiado en procesar la imagen');
}
function ex_contenedor_(datos, tok, uid) {
  let ultimo;
  for (let k = 0; k < 2; k++) {   // si recién se subió, a veces el link demora unos segundos en estar disponible
    try { const c = ex_igPost_('/' + uid + '/media', datos, tok); ex_igEsperar_(c.id, tok); return c.id; } catch (e) { ultimo = e; Utilities.sleep(5000); }
  }
  throw ultimo;
}
function ex_publicarPieza_(p) {
  const tok = ex_igToken_(); if (!tok) throw new Error('falta IG_TOKEN');
  const sh = ex_hojaCab_('Piezas', EX_CAB_PIEZAS), n = sh.getLastRow() - 1, filas = n > 0 ? sh.getRange(2, 1, n, EX_CAB_PIEZAS.length).getValues() : [];
  const i = filas.findIndex(function (r) { return String(r[0]) === String(p.id); }); if (i < 0) throw new Error('no encuentro la pieza');
  const f = filas[i], urls = String(f[10] || '').split('\n').filter(String), texto = String(f[6] || '') + (f[7] ? '\n\n' + f[7] : '');
  if (!urls.length) throw new Error('la pieza no tiene imágenes subidas');
  const uid = String(ex_igGet_('/me?fields=user_id', tok).user_id);
  try {
    let mediaId, link = '';
    if (String(f[2]) === 'historias') {
      urls.forEach(function (u) { const c = ex_contenedor_({ media_type: 'STORIES', image_url: u }, tok, uid); mediaId = ex_igPost_('/' + uid + '/media_publish', { creation_id: c }, tok).id; });
    } else if (urls.length === 1) {
      const c = ex_contenedor_({ image_url: urls[0], caption: texto }, tok, uid); mediaId = ex_igPost_('/' + uid + '/media_publish', { creation_id: c }, tok).id;
    } else {
      const hijos = urls.slice(0, 10).map(function (u) { return ex_contenedor_({ image_url: u, is_carousel_item: 'true' }, tok, uid); });
      const c = ex_contenedor_({ media_type: 'CAROUSEL', children: hijos.join(','), caption: texto }, tok, uid);
      mediaId = ex_igPost_('/' + uid + '/media_publish', { creation_id: c }, tok).id;
    }
    try { link = ex_igGet_('/' + mediaId + '?fields=permalink', tok).permalink || ''; } catch (e) {}
    sh.getRange(i + 2, 4).setValue('Publicado'); sh.getRange(i + 2, 12, 1, 3).setValues([["'" + mediaId, link, '']]);
    if (f[14]) { try { ex_contenido_({ accion: 'estado', id: String(f[14]), estado: 'Publicado', post: String(mediaId) }); } catch (e) {} }
    return { ok: true, id: String(mediaId), link: link };
  } catch (err) {
    let msg = err.message;
    if (/\(10\)|\(200\)|permission|permiso/i.test(msg)) msg += ' · Revisa que la app de Meta tenga el permiso instagram_business_content_publish y genera un token nuevo.';
    if (/media|download|URI|imagen/i.test(msg)) msg += ' · Revisa que el repositorio de imágenes sea público.';
    sh.getRange(i + 2, 4).setValue('Error'); sh.getRange(i + 2, 14).setValue(msg.slice(0, 400));
    throw new Error(msg);
  }
}
// Cada hora: publica las piezas programadas cuya hora ya llegó.
function ex_rondaPublicar_() {
  const sh = SpreadsheetApp.getActive().getSheetByName('Piezas'); if (!sh || !PropertiesService.getScriptProperties().getProperty('IG_TOKEN')) return;
  const n = sh.getLastRow() - 1; if (n < 1) return;
  const ahora = new Date();
  sh.getRange(2, 1, n, EX_CAB_PIEZAS.length).getValues().forEach(function (r) {
    if (r[3] === 'Programado' && r[9] instanceof Date && r[9] <= ahora) { try { ex_publicarPieza_({ id: String(r[0]) }); } catch (e) { console.log('Publicar ' + r[0] + ': ' + e.message); } }
  });
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
    'Recibes las métricas de la cuenta, lo que buscan los clientes en WhatsApp, los leads que llegan desde Instagram, la estrategia vigente, el stock que llegó, la agenda y las negociaciones. Arma el contenido de las próximas 2 semanas:',
    '- respeta la frecuencia de la estrategia (reels, carruseles y posts por semana) y pon cada publicación en los mejores horarios (día y hora HH:MM) según los datos de la cuenta;',
    '- reparte las ideas entre los pilares según la mezcla recomendada; usa exactamente uno de los pilares disponibles;',
    '- cada idea atada a algo real y actual: producto que llegó o en negociación sin contenido (prepara el reel para cuando llegue: unboxing, primera salida, entrega sin dar el nombre del cliente sin permiso), las preguntas que más se repiten en los chats (tallas, autonomía, cuotas, compra desde Argentina, mantención), eventos y salidas de la agenda, la temporada;',
    '- lo que Instagram premia: que la gente vea el video completo, le dé me gusta y lo envíe a un amigo. Escribe ganchos fuertes en los primeros 2 segundos, reels de 15 a 45 segundos salvo que el tema pida más, carruseles útiles que se guarden (consejos, comparativas, guías de talla) y contenido que den ganas de compartir (rutas de la zona, humor ciclista, etiqueta a un amigo);',
    '- para Reels y Carruseles escribe el guion completo en el campo guion: gancho, cada toma o lámina en una línea numerada (qué se graba o muestra y el texto en pantalla), audio sugerido y llamado a la acción final; para Historias, la secuencia de 3 a 5 historias con stickers (encuesta, pregunta, link a WhatsApp);',
    '- llamado a la acción (cta): WhatsApp para lo que genera consultas de venta o taller; Web para catálogo o contenido largo; Visita para test ride o eventos; Guardar o Compartir para contenido de valor. En el texto sugerido, si el cta es WhatsApp, termina con «Escríbenos al WhatsApp, link en la bio»;',
    '- en relacionado pon el producto o la negociación a la que se vincula (vacío si no aplica); no repitas ideas ya planificadas;',
    '- para cada una: fecha, hora, formato, pilar, tema corto, la idea en 2 a 4 frases, guion, texto sugerido (cercano, chileno), 3 a 6 hashtags (mezcla locales como #puertovaras #surdechile con los del tema), cta, objetivo y por qué ahora.',
    'No inventes precios ni promociones que no estén en los datos. Responde solo con el JSON pedido.'
  ].join('\n'),
  redes: [
    'Eres un estratega experto en Instagram para comercio local premium, especializado en tiendas de bicicletas y outdoor. Trabajas para Blackline Puerto Varas (Specialized, e-bikes, MTB, ruta, gravel, taller), cuyo objetivo es vender más: más conversaciones por WhatsApp, más visitas a blacklinechile.cl y a la tienda, y una comunidad fiel.',
    'Con los datos de la cuenta (formatos, horarios, temas, tasas, constancia, mejores y peores publicaciones, audiencia), lo que buscan los clientes en WhatsApp, los leads que llegan desde Instagram, el stock y la agenda, entrega:',
    '- resumen: 2 o 3 frases con lo más importante, con números;',
    '- diagnostico: 4 a 6 puntos (fortaleza, debilidad u oportunidad), cada uno con datos concretos de la cuenta;',
    '- frecuencia: reels, carruseles y posts por semana e historias al día, realista para una persona con poco tiempo (como referencia, 3 a 5 publicaciones semanales suelen duplicar el crecimiento frente a 1 o 2, y las historias diarias mantienen el canal directo), y el motivo;',
    '- horarios: 3 a 5 franjas (día y hora) basadas primero en los datos de la cuenta y, si hay pocos, en lo habitual para Chile (tarde-noche de miércoles a viernes, mañana del fin de semana);',
    '- pilares: mezcla de temas en porcentajes que sumen 100, usando estos pilares: Producto y stock, Taller y consejos, Comunidad y salidas, Clientes y entregas, Asesoría y experiencia, Lugar y estilo de vida; cada uno con su motivo;',
    '- acciones_leads: 4 a 6 acciones concretas para que Instagram genere conversaciones de WhatsApp y visitas a la web (botón de WhatsApp en el perfil, link con código en la bio y en las historias, llamados a la acción, respuestas automáticas por palabra clave, historias destacadas con preguntas frecuentes, contenido que responda lo que preguntan en los chats);',
    '- metas a 30 días con kpi (usa estos nombres: seguidores, alcance_28d, interaccion, publicaciones_semana, toques_links_28d, leads_instagram_28d), nombre legible, valor actual y meta realista.',
    'Lo que hoy más pesa en Instagram: tiempo de visualización, me gusta por alcance y envíos por alcance (que la gente lo comparta por mensaje). Usa los datos de la cuenta antes que reglas generales y no inventes cifras. Español de Chile, directo. Responde solo con el JSON pedido.'
  ].join('\n'),
  pieza: [
    'Eres el director creativo y diseñador de contenido de Instagram de Blackline Puerto Varas, tienda de bicicletas Specialized con taller en Puerto Varas, Chile. Creas carruseles e historias listos para publicar, que se dibujan con plantillas de la marca.',
    'Lo que sabes del negocio: el fuerte y principal motor de ventas son las e-bikes (Turbo Levo, Levo SL, Kenevo, Turbo Vado, Turbo Como, Creo): la tienda es experta y ahí pone más esfuerzo. Pero el catálogo Specialized es amplio (MTB trail y enduro, XC, ruta, gravel, urbano, niños, ropa, cascos, repuestos, taller) y hay clientes de todo tipo; se han vendido S-Works en todas las disciplinas. En Puerto Varas llueve mucho: en invierno las ventas bajan y desde primavera la demanda sube fuerte; en verano llegan turistas, muchos argentinos de Bariloche. Usa el contexto del negocio y la temporada que se te entregan.',
    'Reglas de contenido:',
    '- Atingente: cada pieza nace de algo real que se te entrega (lo que preguntan los clientes, lo que más se vende, stock que llegó, la temporada y el clima, eventos, negociaciones sin contenido). Dale prioridad a e-bikes (más o menos la mitad de las piezas) sin olvidar las otras disciplinas.',
    '- Carrusel: 5 a 8 láminas. La primera es un gancho fuerte (portada con foto); luego valor concreto (consejos, comparación, guía de talla, datos, mitos y realidades); la última invita a actuar (cta). Historias: 3 a 5, verticales, más directas; la última invita a escribir al WhatsApp.',
    '- Texto en láminas: títulos cortos (máximo 7 palabras), textos de máximo 30 palabras, listas de 3 a 5 ítems de máximo 8 palabras. Nada de párrafos largos. Español de Chile, cercano y experto, sin exageraciones ni promesas vacías.',
    '- Usa los layouts disponibles: portada (foto de fondo + título grande), texto (fondo de color + título + texto), lista (título + ítems numerados), comparativa (dos columnas con título A y B y filas en items con el formato "A | B"), dato (un número o cifra grande + texto, sobre foto), foto (foto protagonista con un título breve), cta (llamado a la acción final). En historias usa portada, texto, pregunta (una pregunta grande para responder por mensaje) y cta.',
    '- FOTOS CON LO QUE EXISTE: diseña la pieza alrededor de fotos que ya hay. Se te entrega el INVENTARIO DE FOTOS DE LA TIENDA (descripciones reales de su archivo); además existen fotos oficiales de Specialized de cada modelo y fotos de stock para paisajes. Elige escenas que aparezcan en el inventario o fotos oficiales del modelo; no inventes escenas que habría que salir a fotografiar. Máximo UNA lámina por pieza puede necesitar una foto nueva, y solo si es clave (márcala con fuente propia y descríbela muy concreta). Las demás láminas usan fotos disponibles o layouts sin foto (texto, lista, comparativa, dato con fondo de color): una buena lámina de texto es mejor que esperar una foto.',
    '- STOCK: si se entrega STOCK EN BSALE HOY, los productos protagonistas deben tener stock (o decirse «a pedido»). Nunca armes una pieza sobre un modelo sin stock como si estuviera disponible.',
    '- Para cada lámina con foto describe con precisión qué foto buscar: tipo de bici (e-MTB con motor y batería visibles, MTB, gravel, ruta, urbana), modelo si corresponde, escena (sendero, taller, lago, volcán, detalle de componente), acción y luz; palabras clave en español e inglés; y la fuente preferida: propia (fotos de la tienda en su Instagram o su banco de Drive: clientes, taller, salidas), producto (foto oficial de Specialized del modelo nombrado), video (material oficial de Specialized University) o stock (solo paisajes o ambiente genérico). Usa foto solo donde aporte: en láminas de datos o listas puede ir sin foto. Nunca pidas fotos de personas específicas.',
    '- Calidad profesional: cada pieza enseña algo útil y verdadero (datos reales del producto, consejos de taller probados, la realidad del clima local), con un gancho que haga detenerse, y está pensada para que la gente la guarde y la comparta. Apóyate en el CONOCIMIENTO MTB y la BIBLIOTECA que se te entregan; no inventes especificaciones.',
    '- Nunca inventes precios, promociones ni stock que no estén en los datos. Si hay stock en los datos puedes mencionarlo.',
    '- caption: texto de la publicación (gancho en la primera línea, valor, llamado a la acción; si el cta es WhatsApp termina con «Escríbenos al WhatsApp, link en la bio»). hashtags: 5 a 10, mezcla locales (#puertovaras #surdechile #lagollanquihue) y del tema. alt: descripción breve para accesibilidad.',
    'Si se entrega una PIEZA ACTUAL con CAMBIOS PEDIDOS, devuelve la pieza completa corregida respetando lo que no se pidió cambiar. Responde solo con el JSON pedido.'
  ].join('\n'),
  insights: [
    'Eres el analista de crecimiento de Blackline Puerto Varas (tienda de bicicletas Specialized con taller, en Puerto Varas, Chile). Tu trabajo: leer los datos que te entrega la app, detectar patrones, anticipar lo que va a pasar y decir qué hacer para crecer en ventas.',
    'Recibes datos calculados por la app (no los recalcules ni inventes otros): series semanales, tendencias, proyecciones simples, comparaciones entre grupos y totales. El ÁREA te dice si analizas Instagram o la base de clientes.',
    'Entrega:',
    '- resumen: 1 o 2 frases con la lectura más importante, con números;',
    '- predicciones: 2 a 4 anticipaciones para las próximas 2 a 8 semanas (por ejemplo seguidores o conversaciones esperadas si sigue la tendencia, qué tipo de publicación o cliente rendirá más, riesgos como baja de respuesta o clientes que se enfrían), cada una con el dato en que se basa y una confianza honesta (alta solo si hay muchos datos y una tendencia clara);',
    '- recomendaciones: 3 a 6 acciones concretas, en orden de impacto, cada una con el dato que la respalda (cópialo de los datos), el impacto esperado y el esfuerzo;',
    '- alertas: 0 a 3 cosas que requieren atención ya (caídas, clientes esperando, oportunidades que se pierden).',
    'Si hay pocos datos, dilo y recomienda cómo conseguirlos. Español de Chile, directo, sin relleno. Responde solo con el JSON pedido.'
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
      fecha: { type: 'string' }, hora: { type: 'string' }, formato: { type: 'string', enum: ['Reel', 'Carrusel', 'Historia', 'Post'] }, pilar: { type: 'string', enum: ['Producto y stock', 'Taller y consejos', 'Comunidad y salidas', 'Clientes y entregas', 'Asesoría y experiencia', 'Lugar y estilo de vida'] }, tema: { type: 'string' }, idea: { type: 'string' }, guion: { type: 'string' }, relacionado: { type: 'string' }, texto: { type: 'string' }, hashtags: { type: 'string' },
      cta: { type: 'string', enum: ['WhatsApp', 'Web', 'Visita', 'Guardar', 'Compartir'] }, objetivo: { type: 'string', enum: ['Ventas', 'Comunidad', 'Alcance', 'Educación', 'Postventa'] }, por_que: { type: 'string' } } } } } },
  pieza: { type: 'object', additionalProperties: false, required: ['titulo', 'tipo', 'pilar', 'objetivo', 'por_que', 'slides', 'caption', 'hashtags', 'cta', 'alt'], properties: {
    titulo: { type: 'string' }, tipo: { type: 'string', enum: ['carrusel', 'historias'] },
    pilar: { type: 'string', enum: ['Producto y stock', 'Taller y consejos', 'Comunidad y salidas', 'Clientes y entregas', 'Asesoría y experiencia', 'Lugar y estilo de vida'] },
    objetivo: { type: 'string', enum: ['Ventas', 'Comunidad', 'Alcance', 'Educación', 'Postventa'] }, por_que: { type: 'string' },
    slides: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['layout', 'kicker', 'titulo', 'texto', 'items', 'numero', 'foto'], properties: {
      layout: { type: 'string', enum: ['portada', 'texto', 'lista', 'comparativa', 'dato', 'foto', 'pregunta', 'cta'] }, kicker: { type: 'string' }, titulo: { type: 'string' }, texto: { type: 'string' },
      items: { type: 'array', items: { type: 'string' } }, numero: { type: 'string' },
      foto: { type: 'object', additionalProperties: false, required: ['usar', 'descripcion', 'palabras', 'fuente'], properties: { usar: { type: 'boolean' }, descripcion: { type: 'string' }, palabras: { type: 'array', items: { type: 'string' } }, fuente: { type: 'string', enum: ['propia', 'stock'] } } } } } },
    caption: { type: 'string' }, hashtags: { type: 'string' }, cta: { type: 'string', enum: ['WhatsApp', 'Web', 'Visita', 'Guardar', 'Compartir'] }, alt: { type: 'string' } } },
  insights: { type: 'object', additionalProperties: false, required: ['resumen', 'predicciones', 'recomendaciones', 'alertas'], properties: {
    resumen: { type: 'string' },
    predicciones: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['titulo', 'detalle', 'horizonte', 'base', 'confianza'], properties: { titulo: { type: 'string' }, detalle: { type: 'string' }, horizonte: { type: 'string' }, base: { type: 'string' }, confianza: { type: 'string', enum: ['alta', 'media', 'baja'] } } } },
    recomendaciones: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['titulo', 'detalle', 'dato', 'impacto', 'esfuerzo'], properties: { titulo: { type: 'string' }, detalle: { type: 'string' }, dato: { type: 'string' }, impacto: { type: 'string', enum: ['alto', 'medio', 'bajo'] }, esfuerzo: { type: 'string', enum: ['bajo', 'medio', 'alto'] } } } },
    alertas: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['titulo', 'detalle'], properties: { titulo: { type: 'string' }, detalle: { type: 'string' } } } } } },
  redes: { type: 'object', additionalProperties: false, required: ['resumen', 'diagnostico', 'frecuencia', 'horarios', 'pilares', 'acciones_leads', 'metas'], properties: {
    resumen: { type: 'string' },
    diagnostico: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['tipo', 'titulo', 'detalle'], properties: { tipo: { type: 'string', enum: ['fortaleza', 'debilidad', 'oportunidad'] }, titulo: { type: 'string' }, detalle: { type: 'string' } } } },
    frecuencia: { type: 'object', additionalProperties: false, required: ['reels_semana', 'carruseles_semana', 'posts_semana', 'historias_dia', 'motivo'], properties: { reels_semana: { type: 'integer' }, carruseles_semana: { type: 'integer' }, posts_semana: { type: 'integer' }, historias_dia: { type: 'integer' }, motivo: { type: 'string' } } },
    horarios: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['dia', 'hora', 'motivo'], properties: { dia: { type: 'string' }, hora: { type: 'string' }, motivo: { type: 'string' } } } },
    pilares: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['pilar', 'porcentaje', 'motivo'], properties: { pilar: { type: 'string' }, porcentaje: { type: 'integer' }, motivo: { type: 'string' } } } },
    acciones_leads: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['accion', 'detalle'], properties: { accion: { type: 'string' }, detalle: { type: 'string' } } } },
    metas: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['kpi', 'nombre', 'actual', 'meta'], properties: { kpi: { type: 'string' }, nombre: { type: 'string' }, actual: { type: 'number' }, meta: { type: 'number' } } } } } },
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
// Lo que hay en la tienda hoy (bicis y productos con stock en Bsale, agrupados por modelo), para que el contenido
// muestre lo que se puede vender y no pida fotos de productos que no están.
function ex_stockDestacado_() {
  if (!ex_bsaleToken_()) return '';
  try {
    const sh = SpreadsheetApp.getActive().getSheetByName(EX_HOJA_BSTOCK); if (!sh || sh.getLastRow() < 2) return '';
    const st = {}; sh.getRange(2, 1, sh.getLastRow() - 1, 2).getValues().forEach(function (r) { if (+r[1] > 0) st[String(r[0])] = +r[1]; });
    const por = {};
    ex_bsaleCatalogo_().forEach(function (v) { const n = st[v.id]; if (!n) return; const g = por[v.prod] = por[v.prod] || { nombre: v.producto, u: 0, var: [] }; g.u += n; if (v.variante && g.var.length < 6) g.var.push(v.variante); });
    const bici = /levo|kenevo|vado|como|creo|tero|turbo|stumpjumper|status|enduro|epic|chisel|rockhopper|fuse|tarmac|roubaix|aethos|allez|diverge|crux|sirrus|riprock|jett|hotrock|s-works/i;
    const L = Object.keys(por).map(function (k) { return por[k]; }).sort(function (a, b) { return (bici.test(b.nombre) - bici.test(a.nombre)) || b.u - a.u; }).slice(0, 45);
    return L.length ? 'STOCK EN BSALE HOY (lo que se puede mostrar y vender; las bicis primero):\n' + L.map(function (g) { return '- ' + g.nombre + ': ' + g.u + ' u' + (g.var.length ? ' (' + g.var.join(', ') + ')' : ''); }).join('\n') : '';
  } catch (e) { return ''; }
}
// Inventario de fotos con descripción (hoja «Fotos»), resumido para que el director creativo diseñe con lo que existe.
function ex_inventarioFotos_(max) {
  try {
    const sh = SpreadsheetApp.getActive().getSheetByName('Fotos'); if (!sh || sh.getLastRow() < 2) return '';
    const v = sh.getRange(2, 1, sh.getLastRow() - 1, 6).getValues().filter(function (r) { return r[4] && r[4] !== '(sin vista previa)'; });
    if (!v.length) return '';
    const L = v.slice(-Math.min(v.length, max || 160)).map(function (r) { return '- ' + String(r[4]).slice(0, 110) + (r[5] ? ' [' + String(r[5]).slice(0, 60) + ']' : ''); });
    return 'INVENTARIO DE FOTOS DE LA TIENDA (' + v.length + ' fotos descritas; muestra):\n' + L.join('\n');
  } catch (e) { return ''; }
}

function ex_asistente_(p) {
  const modo = ['semana', 'contenido', 'tareas', 'redes', 'insights', 'pieza'].indexOf(p.modo) >= 0 ? p.modo : 'dia';
  const ctx = String(p.contexto || '').slice(0, 40000);
  if (!ctx) throw new Error('sin contexto');
  let extra = (modo === 'pieza' || modo === 'contenido' || modo === 'redes') ? '\n\n' + EX_EST_MTB + '\n\n' + ex_bibliotecaContexto_() : '';
  if (modo === 'pieza' || modo === 'contenido') extra += '\n\n' + [ex_stockDestacado_(), modo === 'pieza' ? ex_inventarioFotos_(160) : ''].filter(String).join('\n\n');
  return { ok: true, modo: modo, r: ex_llamarClaude_(ctx + extra, EX_AS_SISTEMA[modo], EX_AS_ESQUEMA[modo]) };
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
  '   NOMBRE DEL CONTACTO (contacto.nombre): el nombre de la persona (nombre y, si aparece, apellido). Búscalo en este orden: cómo se presenta («soy Pedro», «habla Carla»), cómo firma, cómo responde si el encargado le pregunta su nombre, o cómo la saluda el encargado («Hola Pedro»). Si el CONTACTO ya trae un nombre real, devuélvelo igual. Si no hay ninguna pista, deja el texto vacío: nunca uses el número, un apodo de usuario ni inventes.',
  '9. Armar el PERFIL del contacto como lo haría un vendedor experto de bicicletas (ver reglas abajo).',
  '10. Proponer hasta 3 RECOMENDACIONES futuras para venderle más (no son tareas): avisar cuando llegue algo que pidió y no había, mantención a los 6 meses de su compra, revisar batería antes de que venza la garantía (2 años), ofrecer upgrade o parte de pago si su bici tiene 3 o más años, reactivar un interés antiguo, invitar a una salida o clínica si es principiante. Cada una con fecha sugerida (AAAA-MM-DD) y el producto relacionado.',
  '',
  'Reglas del perfil:',
  '- relacion: lead (consulta, aún no compra), cliente (ya compró o hizo un servicio), recurrente (compró o vino varias veces), solo_taller (solo mantención o reparación), club_institucion, proveedor, marca (representante de una marca), personal (conversación privada del encargado), spam, desconocido.',
  '- experiencia: principiante, intermedio, avanzado, competidor o desconocido (por cómo habla, sus rutas, carreras, la bici que tiene).',
  '- gama según el modelo o presupuesto: entrada (< $1,5 M), media ($1,5 a 4 M), alta ($4 a 8 M), premium (> $8 M o S-Works); desconocido si no hay pistas.',
  '- disciplinas solo si se dicen o se deducen claro del modelo: Levo y Kenevo → emtb; Vado y Como → ebike_urbana; Tarmac, Roubaix, Allez, Aethos → ruta; Diverge, Crux → gravel; Epic, Chisel → xc; Stumpjumper → trail; Enduro, Status, Demo → enduro o dh_park.',
  '- bicis: solo las del contacto (no las de terceros que menciona), con año y talla si aparecen; compro_en_tienda sí solo si consta que la compró en Blackline.',
  '- compras: solo lo que la conversación muestra que compró, pagó o retiró en la tienda, con fecha aproximada (AAAA-MM-DD o AAAA-MM).',
  '- intencion: lo principal que busca hoy; fuerza_intencion: alta (pregunta precio o stock de algo concreto, quiere reservar, probar, pagar o cuotas), media (compara, pide información de un modelo), baja (curiosidad general), ninguna.',
  '- evidencia: copia textual corta (máximo 120 caracteres) del mensaje del cliente que mejor muestra su intención o perfil. confianza: baja si la conversación es corta, ambigua o no sabes con seguridad.',
  '- Si un dato no aparece usa desconocido, texto vacío, 0 o lista vacía. Nunca inventes.',
  '',
  'Si la conversación es antigua o fue importada, crea tareas solo para compromisos que sigan pendientes: si la fecha ya pasó y no hay señales de que se cumplió, agéndala para hoy; si ya se cumplió, no la crees.',
  'Si se entrega STOCK EN BSALE, úsalo: di en el resumen si lo que pide está disponible (modelo y talla), menciona la disponibilidad real en la idea de respuesta y en la próxima acción, y si no hay stock de lo pedido sugiere la alternativa disponible más parecida o encargarla. Nunca prometas stock que no aparece.',
  'Reglas: no inventes datos que no estén en la conversación; si un dato no aparece, deja el texto vacío. No repitas tareas que ya existen en la lista de tareas abiertas que se te entrega. Escribe todo en español de Chile. Responde solo con el JSON pedido.'
].join('\n');

const EX_AG_ESQUEMA = {
  type: 'object', additionalProperties: false,
  required: ['resumen', 'temperatura', 'contacto', 'negociacion', 'tareas', 'proxima_accion', 'esperando_respuesta', 'idea_respuesta', 'perfil', 'recomendaciones'],
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
    idea_respuesta: { type: 'string' },
    perfil: {
      type: 'object', additionalProperties: false,
      required: ['relacion', 'experiencia', 'gama', 'disciplinas', 'bicis', 'talla', 'altura_cm', 'presupuesto_clp', 'pago', 'intencion', 'fuerza_intencion', 'plazo', 'intereses', 'sensibilidad_precio', 'factores', 'objeciones', 'pref_contacto', 'compras', 'ultimo_servicio', 'evidencia', 'confianza'],
      properties: {
        relacion: { type: 'string', enum: ['lead', 'cliente', 'recurrente', 'solo_taller', 'club_institucion', 'proveedor', 'marca', 'personal', 'spam', 'desconocido'] },
        experiencia: { type: 'string', enum: ['principiante', 'intermedio', 'avanzado', 'competidor', 'desconocido'] },
        gama: { type: 'string', enum: ['entrada', 'media', 'alta', 'premium', 'desconocido'] },
        disciplinas: { type: 'array', items: { type: 'string', enum: ['emtb', 'enduro', 'trail', 'xc', 'dh_park', 'ruta', 'gravel', 'ebike_urbana', 'urbano', 'infantil', 'cicloturismo'] } },
        bicis: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['modelo', 'anio', 'talla', 'compro_en_tienda'], properties: { modelo: { type: 'string' }, anio: { type: 'string' }, talla: { type: 'string' }, compro_en_tienda: { type: 'string', enum: ['si', 'no', 'desconocido'] } } } },
        talla: { type: 'string' },
        altura_cm: { type: 'integer' },
        presupuesto_clp: { type: 'integer' },
        pago: { type: 'string', enum: ['cuotas', 'contado', 'parte_de_pago', 'desconocido'] },
        intencion: { type: 'string', enum: ['compra_bici', 'upgrade_componentes', 'repuesto_accesorio', 'servicio_taller', 'garantia', 'solo_info', 'venta_usada', 'ninguna'] },
        fuerza_intencion: { type: 'string', enum: ['alta', 'media', 'baja', 'ninguna'] },
        plazo: { type: 'string', enum: ['inmediato', '1_3_meses', 'mas_3_meses', 'sin_plazo'] },
        intereses: { type: 'array', items: { type: 'string' } },
        sensibilidad_precio: { type: 'string', enum: ['baja', 'media', 'alta', 'desconocida'] },
        factores: { type: 'array', items: { type: 'string', enum: ['marca', 'bateria_autonomia', 'peso', 'stock_inmediato', 'garantia', 'financiamiento', 'recomendacion', 'postventa', 'precio', 'diseno'] } },
        objeciones: { type: 'array', items: { type: 'string', enum: ['precio', 'sin_stock', 'talla', 'espera_importacion', 'duda_ebike', 'pareja_familia', 'competencia', 'otra'] } },
        pref_contacto: { type: 'string', enum: ['texto', 'audio', 'llamada', 'presencial', 'desconocido'] },
        compras: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['producto', 'fecha'], properties: { producto: { type: 'string' }, fecha: { type: 'string' } } } },
        ultimo_servicio: { type: 'string' },
        evidencia: { type: 'string' },
        confianza: { type: 'string', enum: ['alta', 'media', 'baja'] }
      }
    },
    recomendaciones: {
      type: 'array',
      items: { type: 'object', additionalProperties: false, required: ['tipo', 'texto', 'fecha', 'producto'], properties: { tipo: { type: 'string', enum: ['avisar_stock', 'mantencion', 'bateria', 'upgrade', 'reactivar', 'seguimiento', 'postventa', 'invitacion', 'otro'] }, texto: { type: 'string' }, fecha: { type: 'string' }, producto: { type: 'string' } } }
    }
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
    system: [{ type: 'text', text: (sistema || EX_AG_SISTEMA) + '\n\n' + EX_POLITICA, cache_control: { type: 'ephemeral' } }],
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
function ex_contextoAgente_(id, opt) {
  opt = opt || {};
  const tz = ex_tz_(), b = ex_baseHojas_();
  const c = ex_filasContactos_(b.cs).filter(function (r) { return String(r[0]) === id; })[0];
  if (!c) throw new Error('no encuentro el contacto ' + id);
  const fmt = function (d) { return d instanceof Date ? Utilities.formatDate(d, tz, 'yyyy-MM-dd HH:mm') : String(d || ''); };
  const wa = ex_hojaWa_(), nw = wa.getLastRow() - 1;
  const filasWa = (nw > 0 ? wa.getRange(2, 1, nw, EX_CAB_WA.length).getValues() : []).filter(function (r) { return String(r[6]) === id; })
    .sort(function (x, y) { return x[0] - y[0]; });
  const linea = function (r) { return '[' + fmt(r[0]) + '] ' + (r[1] === 'Enviado' ? 'TIENDA' : 'CLIENTE') + ': ' + String(r[4]).slice(0, 400); };
  // Historia larga: el comienzo (quién es, qué compró) y lo más reciente.
  const chat = filasWa.length > 200 ? filasWa.slice(0, 40).map(linea).concat(['… (' + (filasWa.length - 200) + ' mensajes omitidos) …'], filasWa.slice(-160).map(linea)) : filasWa.map(linea);
  const ni = b.is.getLastRow() - 1;
  const otras = (ni > 0 ? b.is.getRange(2, 1, ni, 4).getValues() : []).filter(function (r) { return String(r[1]) === id && !/whatsapp|agente/i.test(r[2]); })
    .sort(function (x, y) { return x[0] - y[0]; }).slice(-15).map(function (r) { return '[' + fmt(r[0]) + '] ' + r[2] + ': ' + r[3]; });
  const neg = ex_filasNeg_(ex_hojaNeg_()).filter(function (r) { return String(r[2]) === id && r[10] === 'Abierta'; })[0];
  const tareas = ex_hoja_().getRange(EX_PRIMERA, 1, EX_ULTIMA - EX_PRIMERA + 1, 15).getValues()
    .filter(function (r) { return r[1] && r[0] !== true && String(r[14]).indexOf(id) >= 0; }).map(function (r) { return '- ' + r[1] + (r[9] instanceof Date ? ' (' + ex_ymd_(r[9], tz) + ')' : ''); });
  const contexto = [
    'Hoy es ' + Utilities.formatDate(new Date(), tz, "EEEE yyyy-MM-dd HH:mm") + ' (hora de Chile).',
    opt.pipeline ? 'MODO DEPURACIÓN: este contacto está guardado en el teléfono y tuvo una conversación de ida y vuelta. Si se habló de comprar un producto o un servicio del taller, crea la negociación aunque la conversación sea antigua (si ya compró o desistió, deja la etapa más avanzada que corresponda y explícalo en el resumen). Si no se habló de comprar nada, negociación «ninguna». No crees tareas.' : opt.masivo ? 'MODO HISTORIAL: este chat se importó como historial junto a muchos otros. No crees tareas. Negociación solo si hay intención real y el cliente escribió en los últimos ' + EX_PERF_DIAS_NEG + ' días.' : '',
    '', 'CONTACTO: ' + JSON.stringify({ nombre: c[2], tipo: c[1], empresa: c[3], email: c[4], telefono: String(c[5] || ''), etiquetas: c[6], notas: c[7] }),
    '', 'NEGOCIACIÓN ABIERTA: ' + (neg ? JSON.stringify({ titulo: neg[1], etapa: neg[3], valor: neg[4], producto: neg[5], proxima_accion: neg[8], notas: neg[12] }) : 'ninguna'),
    '', 'TAREAS ABIERTAS CON ESTE CONTACTO:', tareas.length ? tareas.join('\n') : '(ninguna)',
    '', 'OTRAS INTERACCIONES:', otras.length ? otras.join('\n') : '(ninguna)',
    '', 'CONVERSACIÓN DE WHATSAPP (más antigua primero):', chat.length ? chat.join('\n') : '(sin mensajes)'
  ].join('\n');
  const stock = ex_bsaleParaAgente_(chat.slice(-60).join(' ') + ' ' + (neg ? neg[5] : '') + ' ' + c[6]);
  return { contexto: stock ? contexto + '\n\nSTOCK EN BSALE (consultado ahora, productos que se mencionan):\n' + stock : contexto, c: c, neg: neg, filasWa: filasWa, chatTexto: filasWa.filter(function (r) { return r[1] !== 'Enviado'; }).map(function (r) { return r[4]; }).join(' ') };
}

// Analiza la conversación de un contacto y aplica los cambios al CRM (desde la app: ya corre con el Sheet tomado).
function ex_agente_(id) {
  id = String(id || '');
  const ctx = ex_contextoAgente_(id);
  return ex_aplicarAgente_(id, ctx, ex_llamarClaude_(ctx.contexto));
}

function ex_aplicarAgente_(id, ctx, a, opt) {
  opt = opt || {};
  const tz = ex_tz_();
  const b = ex_baseHojas_(), filas = ex_filasContactos_(b.cs), i = filas.findIndex(function (r) { return String(r[0]) === id; });
  const cambios = [], c = filas[i], ac = a.contacto || {};
  // Contacto: completa lo que falta, sin pisar lo que tú ya definiste.
  if (ex_nombreValido_(ac.nombre) && ex_sinNombre_(c[2])) { b.cs.getRange(i + 2, 3).setValue(String(ac.nombre).trim()); cambios.push('nombre: ' + String(ac.nombre).trim()); }
  if (ac.tipo && ac.tipo !== 'Por clasificar' && (c[1] === 'Por clasificar' || !c[1])) { b.cs.getRange(i + 2, 2).setValue(ac.tipo); cambios.push('tipo: ' + ac.tipo); }
  if (ac.email && !c[4]) { b.cs.getRange(i + 2, 5).setValue(ac.email.toLowerCase()); cambios.push('correo'); }
  const tags = String(c[6] || '').split(',').map(function (t) { return t.trim(); }).filter(String);
  (ac.etiquetas || []).forEach(function (t) { if (t && !tags.some(function (x) { return ex_norm_(x) === ex_norm_(t); })) tags.push(t); });
  if (tags.join(', ') !== String(c[6] || '')) { b.cs.getRange(i + 2, 7).setValue(tags.slice(0, 12).join(', ')); cambios.push('etiquetas'); }
  if (ac.datos_clave && !c[7]) b.cs.getRange(i + 2, 8).setValue('🧠 ' + ac.datos_clave);
  // Perfil: lo extraído por la IA + métricas de los mensajes + puntajes. Lo que tú corregiste no se pisa.
  const met = ex_metricasWa_(ctx.filasWa || []), pf = a.perfil || {};
  ex_verificarEvidencia_(pf, ctx.chatTexto || '');
  const prev = ex_leerPerfiles_()[id] || {}, conf = prev.confirmado || {};
  Object.keys(conf).forEach(function (k) { if (prev.p && prev.p[k] !== undefined) pf[k] = prev.p[k]; });
  const sc = ex_puntuar_(pf, met);
  ex_guardarPerfil_(id, ac.nombre || c[2], pf, met, sc, a, '✓ Listo', conf);
  a._perfil = { ciclo: sc.ciclo, clase: sc.clase, prob: sc.prob, gama: pf.gama, experiencia: pf.experiencia, disciplinas: pf.disciplinas || [], confianza: pf.confianza, relacion: pf.relacion };
  a._masivo = !!opt.masivo; a._met = met;
  if (ac.tipo === 'Ignorar' && c[1] === 'Por clasificar') return ex_registrarAgente_(id, c, a, cambios.concat('marcado Ignorar'));
  // Negociación
  const n = a.negociacion || {}, etapas = ['Nuevo', 'Contactado', 'Prueba / visita', 'Cotización', 'Negociación'];
  let negId = ctx.neg ? String(ctx.neg[0]) : '';
  // Regla de negociaciones: solo con intención real de compra o servicio y si el cliente escribió en los últimos 60 días.
  const intencionVenta = ['compra_bici', 'upgrade_componentes', 'servicio_taller', 'repuesto_accesorio'].indexOf(pf.intencion) >= 0;
  const abrir = opt.pipeline ? ['proveedor', 'marca', 'personal', 'spam'].indexOf(pf.relacion) < 0 && (n.accion === 'crear' || intencionVenta)
    : met.diasCliente <= EX_PERF_DIAS_NEG && ['proveedor', 'marca', 'personal', 'spam'].indexOf(pf.relacion) < 0 && (intencionVenta || !a.perfil) && (sc.prob >= 35 || pf.fuerza_intencion === 'alta' || (!opt.masivo && n.accion === 'crear'));
  if (opt.pipeline && abrir && n.accion !== 'crear') { n.accion = 'crear'; n.etapa = 'Contactado'; }
  if (opt.pipeline && (n.etapa === 'Ganada' || n.etapa === 'Perdida')) { a.proxima_accion = { texto: '🧠 Confirmar: ¿' + (n.etapa === 'Ganada' ? 'compró? → marcar Ganada' : 'se perdió? → marcar Perdida'), fecha: ex_hoyYmd_(tz) }; n.etapa = 'Negociación'; }
  if (!ctx.neg && n.accion === 'crear' && !abrir) cambios.push('negociación no abierta (' + (met.diasCliente > EX_PERF_DIAS_NEG ? 'conversación de hace más de ' + EX_PERF_DIAS_NEG + ' días' : 'poca intención de compra') + ')');
  // En historial, si los puntajes muestran una venta probable aunque la IA no lo propuso, igual se abre (en "Contactado").
  if (!ctx.neg && abrir && n.accion !== 'crear' && opt.masivo && sc.prob >= 50) { n.accion = 'crear'; if (etapas.indexOf(n.etapa) < 0) n.etapa = 'Contactado'; }
  if (!ctx.neg && abrir && n.accion === 'crear' && etapas.indexOf(n.etapa) >= 0) {
    a._negAbierta = true;
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
  // Depuración: si no se habló de comprar nada (y no es proveedor ni del equipo), el contacto se archiva.
  if (opt.pipeline && !negId && ['Proveedor', 'Institución', 'Equipo'].indexOf(String(ac.tipo || c[1])) < 0) {
    b.cs.getRange(i + 2, 2).setValue('Archivado'); cambios.push('archivado: sin conversación de compra');
    ex_logDepuracion_([[id, ac.nombre || c[2], 'sin conversación de compra (agente)', c[1], new Date()]]);
  }
  // Recordatorios de lo conversado (sin repetir los que ya creó ni duplicar tareas pendientes parecidas).
  const props = PropertiesService.getScriptProperties(), hechas = JSON.parse(props.getProperty('EX_AG_TAREAS') || '[]');
  const pend = ex_hoja_().getRange(EX_PRIMERA, 1, EX_ULTIMA - EX_PRIMERA + 1, 15).getValues().filter(function (r) { return r[1] && r[0] !== true; }).map(function (r) { return { t: String(r[1]), n: String(r[14] || '') }; });
  (opt.masivo ? [] : (a.tareas || [])).slice(0, 4).forEach(function (t) {
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
  if (a.esperando_respuesta && a.idea_respuesta && !(a._masivo && a._met && a._met.diasCliente > EX_PERF_DIAS_IDEA) && !(a._perfil && /personal|spam/.test(a._perfil.relacion))) b.is.appendRow([new Date(), id, '🧠 Idea de respuesta', a.idea_respuesta, '', 'ai:' + id + ':r' + Date.now()]);
  ex_hojaAg_().appendRow([new Date(), id, (a.contacto && a.contacto.nombre) || c[2], a.resumen, a.temperatura, cambios.join(' · '), a.esperando_respuesta ? a.idea_respuesta : '']);
  ex_recalcular_(b.cs, b.is);
  PropertiesService.getScriptProperties().setProperty('EX_AG_ULTIMO', new Date().toISOString());
  return { ok: true, id: id, nombre: (a.contacto && a.contacto.nombre) || c[2], tipo: (a.contacto && a.contacto.tipo) || c[1], resumen: a.resumen, temperatura: a.temperatura, cambios: cambios, esperando: a.esperando_respuesta, idea: a.idea_respuesta, perfil: a._perfil || null, negocio: !!a._negAbierta };
}

/* ---------- Perfiles de clientes: el agente ordena la base por ti ---------- */
// Una fila por contacto en la hoja "Perfiles": lo que el agente entendió (experiencia, gama, disciplinas, bicis, intención…)
// más métricas calculadas de los mensajes (frecuencia, recencia, respuesta) y puntajes (probabilidad de venta, potencial).
const EX_HOJA_PERF = 'Perfiles';
const EX_CAB_PERF = ['ID', 'Estado', 'Nombre', 'Ciclo', 'Clase', 'Prob. venta', 'Potencial', 'Relación', 'Experiencia', 'Gama', 'Disciplinas', 'Bicicletas', 'Talla / altura', 'Presupuesto', 'Intención', 'Plazo', 'Intereses', 'Sensibilidad precio', 'Objeciones', 'Compras', 'Consultas 12m', 'Frecuencia', 'Mensajes', 'Primer contacto', 'Último del cliente', 'Respuesta tienda (min)', 'Resumen', 'Confianza', 'Actualizado', 'Datos'];
const EX_PERF_DIAS_NEG = 60;        // solo se abren negociaciones si el cliente escribió en los últimos 60 días
const EX_PERF_DIAS_IDEA = 14;       // en importación masiva, idea de respuesta solo si escribió en los últimos 14 días
const EX_HOJA_OPS = 'Oportunidades';
const EX_CAB_OPS = ['Clave', 'Estado', 'Hasta', 'Contacto', 'Detalle', 'Fecha'];

function ex_hojaPerf_() { return ex_hojaCab_(EX_HOJA_PERF, EX_CAB_PERF); }
function ex_filasPerf_(sh) { const n = sh.getLastRow() - 1; return n > 0 ? sh.getRange(2, 1, n, EX_CAB_PERF.length).getValues() : []; }

// Métricas de la conversación, calculadas de las fechas (no las adivina la IA).
function ex_metricasWa_(filas) {
  const ahora = new Date(), dia = 86400000, met = { mensajes: filas.length, recibidos: 0, enviados: 0, primera: '', ultimaCliente: '', ultima: '', diasCliente: 9999, sesiones12: 0, sesiones: 0, respuestaMin: null, sinRespuesta: 0 };
  if (!filas.length) return met;
  const tz = ex_tz_(), resp = [];
  let prev = null, pendiente = null;
  filas.forEach(function (r) {
    const f = r[0] instanceof Date ? r[0] : null; if (!f) return;
    const cli = r[1] !== 'Enviado';
    if (cli) met.recibidos++; else met.enviados++;
    if (!prev || f - prev > 3 * dia) { met.sesiones++; if (ahora - f < 365 * dia) met.sesiones12++; if (pendiente) met.sinRespuesta++; pendiente = null; }
    if (cli) { if (!pendiente) pendiente = f; met.ultimaCliente = f; }
    else if (pendiente) { resp.push((f - pendiente) / 60000); pendiente = null; }
    prev = f;
  });
  const primera = filas[0][0], ultima = filas[filas.length - 1][0];
  met.primera = primera instanceof Date ? ex_ymd_(primera, tz) : '';
  met.ultima = ultima instanceof Date ? ex_ymd_(ultima, tz) : '';
  if (met.ultimaCliente) { met.diasCliente = Math.floor((ahora - met.ultimaCliente) / dia); met.ultimaCliente = ex_ymd_(met.ultimaCliente, tz); }
  if (resp.length) { resp.sort(function (a, b) { return a - b; }); met.respuestaMin = Math.round(resp[Math.floor(resp.length / 2)]); }
  met.esperando = !!pendiente;
  met.origen = ex_origenLead_(filas);
  return met;
}

// ¿De dónde llegó el cliente? Busca el código de los links de Instagram o la web ("ref IG-LEVO10") o una mención
// ("te vi en Instagram", "vi el reel", "en su página") en los primeros mensajes del cliente de cada conversación.
const EX_RE_REF = /\b(IG|WEB|HIS|BIO)-([A-Z0-9]{2,14})\b/i;
const EX_RE_IG = /instagram|\binsta\b|\big\b|vi (tu|su|el|la|un|una) (post|reel|publicaci|historia|video)|por (las|tus|sus) historias/i;
const EX_RE_WEB = /blacklinechile\.cl|(tu|su|la) (pagina|página|web)\b|en la web|sitio web/i;
function ex_origenLead_(filas) {
  const tz = ex_tz_(), out = [];
  let prev = null, enSesion = 0;
  filas.forEach(function (r) {
    const f = r[0] instanceof Date ? r[0] : null; if (!f) return;
    if (!prev || f - prev > 3 * 86400000) enSesion = 0;
    prev = f;
    if (r[1] === 'Enviado') return;
    enSesion++;
    if (enSesion > 3) return;
    const tx = String(r[4] || ''), m = tx.match(EX_RE_REF);
    const canal = m ? ({ IG: 'instagram', HIS: 'instagram', BIO: 'instagram', WEB: 'web' })[m[1].toUpperCase()] : EX_RE_IG.test(tx) ? 'instagram' : EX_RE_WEB.test(tx) ? 'web' : '';
    if (canal) out.push({ canal: canal, ref: m ? (m[1] + '-' + m[2]).toUpperCase() : '', fecha: ex_ymd_(f, tz) });
  });
  return out.length ? { primero: out[0], todos: out.slice(-8) } : null;
}

// Todos los contactos que llegaron desde Instagram o la web (lee los chats guardados; se guarda 20 min en caché).
function ex_leadsCanal_(p) {
  const cache = CacheService.getScriptCache();
  if (!p || !p.forzar) { const c = cache.get('leadsCanal2'); if (c) return JSON.parse(c); }
  const wa = ex_hojaWa_(), n = wa.getLastRow() - 1, por = {}, tz = ex_tz_();
  (n > 0 ? wa.getRange(2, 1, n, 7).getValues() : []).forEach(function (r) { const id = String(r[6] || ''); if (id && r[0] instanceof Date) (por[id] = por[id] || []).push(r); });
  const leads = [], ahora = Date.now(), dia = 86400000;
  // Estadísticas de los chats: conversaciones nuevas por semana, cuándo escriben los clientes y tu tiempo de respuesta.
  const semNuevas = {}, semConv = {}, heat = {}, resp = {}, lunes = function (d) { const x = new Date(d.getTime()); const w = (x.getDay() + 6) % 7; x.setDate(x.getDate() - w); return ex_ymd_(x, tz); };
  let esperan = 0;
  Object.keys(por).forEach(function (id) {
    const L = por[id].sort(function (a, b) { return a[0] - b[0]; }), o = ex_origenLead_(L);
    if (o) leads.push({ id: id, canal: o.primero.canal, ref: o.primero.ref, fecha: o.primero.fecha, todos: o.todos });
    const primero = L.filter(function (r) { return r[1] !== 'Enviado'; })[0];
    if (primero && ahora - primero[0] < 182 * dia) { const k = lunes(primero[0]); semNuevas[k] = (semNuevas[k] || 0) + 1; }
    let prev = null, pend = null;
    L.forEach(function (r) {
      const f = r[0], cli = r[1] !== 'Enviado';
      if (!prev || f - prev > 3 * dia) { if (cli && ahora - f < 182 * dia) { const k = lunes(f); semConv[k] = (semConv[k] || 0) + 1; } pend = null; }
      if (cli) { if (ahora - f < 182 * dia) { const hk = f.getDay() + ':' + f.getHours(); heat[hk] = (heat[hk] || 0) + 1; } if (!pend) pend = f; }
      else if (pend) { const k = lunes(pend); (resp[k] = resp[k] || []).push((f - pend) / 60000); pend = null; }
      prev = f;
    });
    const ult = L[L.length - 1]; if (ult && ult[1] !== 'Enviado' && ahora - ult[0] < 30 * dia) esperan++;
  });
  const med = function (a) { a = a.slice().sort(function (x, y) { return x - y; }); return a.length ? Math.round(a[Math.floor(a.length / 2)]) : null; };
  const respSem = {}; Object.keys(resp).forEach(function (k) { respSem[k] = { mediana: med(resp[k]), n: resp[k].length, en1h: Math.round(resp[k].filter(function (x) { return x <= 60; }).length / resp[k].length * 100) }; });
  const out = { ok: true, leads: leads, stats: { nuevas: semNuevas, conversaciones: semConv, heat: heat, respuesta: respSem, esperan: esperan, contactos: Object.keys(por).length }, calculado: new Date().toISOString() };
  try { cache.put('leadsCanal2', JSON.stringify(out), 1200); } catch (e) {}
  return out;
}

// Puntajes explicables (reglas de vendedor), sobre lo que extrajo la IA y las métricas.
function ex_puntuar_(p, met) {
  p = p || {}; const cli = ['proveedor', 'marca', 'personal', 'spam'].indexOf(p.relacion) < 0;
  let prob = { alta: 45, media: 25, baja: 10 }[p.fuerza_intencion] || 0;
  if (['compra_bici', 'upgrade_componentes'].indexOf(p.intencion) >= 0) prob += 5;
  prob += { inmediato: 15, '1_3_meses': 5 }[p.plazo] || 0;
  prob += Math.min(15, (p.talla ? 5 : 0) + (p.altura_cm ? 5 : 0) + (p.presupuesto_clp ? 5 : 0));
  if (p.relacion === 'recurrente' || (p.bicis || []).some(function (b) { return b.compro_en_tienda === 'si'; })) prob += 10;
  const d = met.diasCliente;
  prob += d <= 7 ? 10 : d <= 30 ? 0 : d <= 60 ? -10 : -25;
  if ((p.objeciones || []).some(function (o) { return o === 'precio' || o === 'competencia'; })) prob -= 5;
  prob = cli ? Math.max(0, Math.min(100, prob)) : 0;
  let pts = { premium: 3, alta: 3, media: 1 }[p.gama] || 0;
  if ((p.disciplinas || []).indexOf('emtb') >= 0) pts += 2;
  if ((p.bicis || []).length >= 2) pts += 1;
  if (p.intencion === 'servicio_taller' || p.relacion === 'solo_taller' || p.ultimo_servicio) pts += 1;
  if ((p.compras || []).length) pts += 1;
  if (p.relacion === 'recurrente' || met.sesiones12 >= 3) pts += 2;
  if (!cli) pts = 0;
  const clase = !cli ? '–' : pts >= 5 ? 'A' : pts >= 3 ? 'B' : 'C';
  // Ciclo de vida
  const compras = (p.compras || []).map(function (c) { return String(c.fecha || ''); }).filter(function (f) { return /^\d{4}-\d{2}/.test(f); }).sort();
  const ultCompra = compras.length ? Math.floor((Date.now() - new Date(compras[compras.length - 1].slice(0, 10) + (compras[compras.length - 1].length === 7 ? '-15' : '')).getTime()) / 86400000) : null;
  const esCliente = (p.compras || []).length || ['cliente', 'recurrente', 'solo_taller'].indexOf(p.relacion) >= 0;
  let ciclo;
  if (['proveedor', 'marca'].indexOf(p.relacion) >= 0) ciclo = 'proveedor';
  else if (['personal', 'spam'].indexOf(p.relacion) >= 0) ciclo = 'sin_relacion';
  else if (p.relacion === 'club_institucion') ciclo = d <= 180 ? 'institucion' : 'en_riesgo';
  else if (esCliente) ciclo = ultCompra != null && ultCompra <= 90 ? 'cliente_nuevo' : d <= 180 ? 'cliente_activo' : d <= 540 ? 'en_riesgo' : 'perdido';
  else ciclo = prob >= 35 && d <= EX_PERF_DIAS_NEG ? 'oportunidad' : d <= EX_PERF_DIAS_NEG ? 'lead_activo' : 'lead_frio';
  const frecuencia = met.sesiones12 >= 4 ? 'frecuente' : met.sesiones12 >= 2 ? 'ocasional' : met.sesiones12 === 1 ? 'una vez' : 'sin consultas 12m';
  return { prob: prob, potencial: Math.min(100, pts * 12), clase: clase, ciclo: ciclo, frecuencia: frecuencia };
}

// ¿La cita de evidencia está realmente en el chat? Si no, baja la confianza (evita datos inventados).
function ex_verificarEvidencia_(p, chatTexto) {
  if (!p) return;
  const ev = ex_norm_(p.evidencia || '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!ev) { if (p.confianza === 'alta') p.confianza = 'media'; return; }
  const tx = ex_norm_(chatTexto).replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ');
  const trozo = ev.split(' ').slice(0, 6).join(' ');
  if (trozo.length >= 8 && tx.indexOf(trozo) < 0) { p.confianza = 'baja'; p.evidencia_no_verificada = true; }
}

function ex_guardarPerfil_(id, nombre, p, met, sc, a, estado, conf) {
  const sh = ex_hojaPerf_(), filas = ex_filasPerf_(sh), i = filas.findIndex(function (r) { return String(r[0]) === id; });
  const L = function (x) { return (x || []).filter(String).join(', '); };
  const datos = { p: p || {}, m: met || {}, s: sc || {}, r: (a && a.recomendaciones) || [], resumen: (a && a.resumen) || '', t: new Date().toISOString(), confirmado: conf || {} };
  const fila = [id, estado || '✓ Listo', nombre, sc.ciclo || '', sc.clase || '', sc.prob, sc.potencial, p.relacion || '', p.experiencia || '', p.gama || '', L(p.disciplinas),
    (p.bicis || []).map(function (b) { return [b.modelo, b.anio, b.talla].filter(String).join(' '); }).join(' · '), [p.talla, p.altura_cm ? p.altura_cm + ' cm' : ''].filter(String).join(' · '),
    p.presupuesto_clp || '', [p.intencion, p.fuerza_intencion].filter(String).join(' · '), p.plazo || '', L(p.intereses), p.sensibilidad_precio || '', L(p.objeciones),
    (p.compras || []).map(function (c) { return c.producto + (c.fecha ? ' (' + c.fecha + ')' : ''); }).join(' · '), met.sesiones12, sc.frecuencia, met.mensajes, met.primera, met.ultimaCliente,
    met.respuestaMin == null ? '' : met.respuestaMin, (a && a.resumen) || '', p.confianza || '', new Date(), JSON.stringify(datos).slice(0, 45000)];
  if (i >= 0) sh.getRange(i + 2, 1, 1, fila.length).setValues([fila]); else sh.appendRow(fila);
}

// Pone en cola de análisis (la ronda automática los procesa aunque la app esté cerrada).
// ---------- Depuración de la base de WhatsApp ----------
// Deja solo a quien está guardado en tu teléfono y tuvo una conversación de ida y vuelta; el agente revisa esos chats
// y los que hablaron de comprar entran al Pipeline. El resto se archiva (no se borra: si vuelve a escribir, reaparece).
// Nunca toca: proveedores, instituciones, equipo, contactos de correo, quien tiene una negociación abierta ni chats de los últimos 30 días.
function ex_logDepuracion_(filas) {
  if (!filas.length) return;
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName('Depuración');
  if (!sh) { sh = ss.insertSheet('Depuración'); sh.appendRow(['Contacto (ID)', 'Nombre', 'Motivo', 'Tipo anterior', 'Fecha']); sh.setFrozenRows(1); }
  sh.getRange(sh.getLastRow() + 1, 1, filas.length, 5).setValues(filas);
}
// Acciones en lote sobre contactos (desde la lista o la ficha): archivar, desarchivar, cambiar tipo, etiquetar, eliminar.
function ex_contactosLote_(p) {
  const ids = {}; (p.ids || []).forEach(function (x) { ids[String(x)] = 1; });
  const acc = String(p.accion || ''), valor = String(p.valor || '').trim(), b = ex_baseHojas_(), filas = ex_filasContactos_(b.cs), log = [];
  let prev = {};
  if (acc === 'desarchivar') {
    const sh = SpreadsheetApp.getActive().getSheetByName('Depuración');
    if (sh && sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, 4).getValues().forEach(function (r) { if (r[3] && r[3] !== 'Archivado') prev[String(r[0])] = r[3]; });
  }
  let n = 0;
  if (acc === 'eliminar') {
    const borrar = [];
    filas.forEach(function (r, i) { if (ids[String(r[0])]) borrar.push(i + 2); });
    borrar.sort(function (a, c) { return c - a; }).forEach(function (f) { b.cs.deleteRow(f); n++; });
    return { ok: true, n: n };
  }
  filas.forEach(function (r, i) {
    const id = String(r[0]); if (!ids[id]) return;
    if (acc === 'archivar') { if (r[1] !== 'Archivado') { b.cs.getRange(i + 2, 2).setValue('Archivado'); log.push([id, r[2], 'archivado a mano', r[1], new Date()]); n++; } }
    else if (acc === 'desarchivar') { if (r[1] === 'Archivado') { b.cs.getRange(i + 2, 2).setValue(prev[id] || 'Por clasificar'); n++; } }
    else if (acc === 'tipo') { if (valor) { b.cs.getRange(i + 2, 2).setValue(valor); n++; } }
    else if (acc === 'etiqueta' || acc === 'quitarEtiqueta') {
      const tags = String(r[6] || '').split(',').map(function (t) { return t.trim(); }).filter(String), k = tags.map(function (t) { return t.toLowerCase(); }).indexOf(valor.toLowerCase());
      if (acc === 'etiqueta' && valor && k < 0) tags.push(valor); else if (acc === 'quitarEtiqueta' && k >= 0) tags.splice(k, 1); else return;
      b.cs.getRange(i + 2, 7).setValue(tags.join(', ')); n++;
    }
  });
  ex_logDepuracion_(log);
  return { ok: true, n: n };
}

function ex_depurar_(p) {
  const b = ex_baseHojas_(), filas = ex_filasContactos_(b.cs), wa = ex_hojaWa_(), n = wa.getLastRow() - 1, ahora = Date.now();
  if (p.restaurar) {
    const sh = SpreadsheetApp.getActive().getSheetByName('Depuración'), prev = {};
    if (sh && sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, 4).getValues().forEach(function (r) { if (!prev[r[0]]) prev[String(r[0])] = r[3] || 'Por clasificar'; });
    let k = 0; filas.forEach(function (r, i) { if (r[1] === 'Archivado' && prev[String(r[0])]) { b.cs.getRange(i + 2, 2).setValue(prev[String(r[0])] === 'Archivado' ? 'Por clasificar' : prev[String(r[0])]); k++; } });
    return { ok: true, restaurados: k };
  }
  const agenda = ex_waAgenda_(null), ag9 = {}; Object.keys(agenda).forEach(function (t) { ag9[t.slice(-9)] = 1; });
  const usarAgenda = Object.keys(agenda).length >= 20, ult9 = function (t) { return String(t || '').replace(/\D/g, '').slice(-9); };
  const st = {};
  if (n > 0) {
    const ab = wa.getRange(2, 1, n, 2).getValues(), ids = wa.getRange(2, 7, n, 1).getValues();
    ids.forEach(function (x, k) {
      const id = String(x[0] || ''); if (!id) return;
      const t = ab[k][0] instanceof Date ? ab[k][0].getTime() : 0, s = st[id] = st[id] || { i: 0, o: 0, fo: 0, li: 0, ul: 0 };
      if (ab[k][1] === 'Enviado') { s.o++; if (!s.fo || t < s.fo) s.fo = t; } else { s.i++; if (t > s.li) s.li = t; }
      if (t > s.ul) s.ul = t;
    });
  }
  const abiertas = {}; ex_filasNeg_(ex_hojaNeg_()).forEach(function (r) { if (r[10] === 'Abierta' && r[2]) abiertas[String(r[2])] = 1; });
  const archivar = [], pipeline = [], cuenta = { sin_conversacion: 0, solo_consulto: 0, no_guardado: 0, un_solo_lado: 0 }, protegidos = { recientes: 0, negocio_abierto: 0, otros: 0 };
  filas.forEach(function (r, i) {
    const id = String(r[0] || ''), s = st[id]; if (!id || !s) return;
    const tipo = String(r[1] || '');
    if (['Ignorar', 'Archivado'].indexOf(tipo) >= 0) return;
    if (['Proveedor', 'Institución', 'Equipo'].indexOf(tipo) >= 0 || r[4]) { protegidos.otros++; return; }
    if (abiertas[id]) { protegidos.negocio_abierto++; return; }
    if (ahora - s.ul < 30 * 86400000) { protegidos.recientes++; return; }
    const guardado = usarAgenda ? !!ag9[ult9(r[5])] : !ex_sinNombre_(r[2]), ambos = s.i > 0 && s.o > 0, replico = ambos && s.li > s.fo;
    const motivo = !guardado && !ambos ? 'sin_conversacion' : ambos && !replico ? 'solo_consulto' : !guardado ? 'no_guardado' : !ambos ? 'un_solo_lado' : '';
    const fila = { id: id, nombre: String(r[2] || r[5] || id), fila: i + 2, tipo: tipo, motivo: motivo, msgs: s.i + s.o };
    if (motivo) { cuenta[motivo]++; archivar.push(fila); } else pipeline.push(fila);
  });
  const MOT = { sin_conversacion: 'no está guardado y no hubo conversación', solo_consulto: 'consultó, se le respondió y no volvió a escribir', no_guardado: 'no está guardado en el teléfono', un_solo_lado: 'conversación de un solo lado' };
  if (!p.aplicar) return { ok: true, simulacion: true, agenda: usarAgenda, archivar: archivar.length, pipeline: pipeline.length, cuenta: cuenta, protegidos: protegidos,
    ejemplos: { archivar: archivar.slice(0, 40).map(function (x) { return { nombre: x.nombre, motivo: MOT[x.motivo] }; }), pipeline: pipeline.slice(0, 40).map(function (x) { return { nombre: x.nombre, msgs: x.msgs }; }) } };
  archivar.forEach(function (x) { b.cs.getRange(x.fila, 2).setValue('Archivado'); });
  ex_logDepuracion_(archivar.map(function (x) { return [x.id, x.nombre, MOT[x.motivo], x.tipo, new Date()]; }));
  pipeline.forEach(function (x) { ex_encolarPerfil_(x.id, x.nombre, true); });
  // Los archivados salen de la cola del agente (no se gasta en analizarlos).
  const arch = {}; archivar.forEach(function (x) { arch[x.id] = 1; });
  const shp = ex_hojaPerf_(); ex_filasPerf_(shp).forEach(function (r, k) { if (arch[String(r[0])] && /Pendiente/.test(String(r[1]))) shp.getRange(k + 2, 2).setValue('🗄️ Archivado'); });
  return { ok: true, archivados: archivar.length, enCola: pipeline.length };
}

function ex_encolarPerfil_(id, nombre, pipeline) {
  const sh = ex_hojaPerf_(), filas = ex_filasPerf_(sh), i = filas.findIndex(function (r) { return String(r[0]) === id; }), est = pipeline ? '⏳ Pendiente (pipeline)' : '⏳ Pendiente';
  if (i >= 0) sh.getRange(i + 2, 2).setValue(est);
  else sh.appendRow([id, est, /^[+=@-]/.test(String(nombre)) ? "'" + nombre : nombre]);
}
function ex_pendientesPerf_() { return ex_filasPerf_(ex_hojaPerf_()).filter(function (r) { return /Pendiente/.test(String(r[1])); }).map(function (r) { return String(r[0]); }); }

// Analiza un contacto en modo historial y devuelve un resumen corto para el panel de progreso.
function ex_perfilar_(id, masivo) {
  const ctx = ex_contextoAgente_(id, { masivo: masivo });
  const a = ex_llamarClaude_(ctx.contexto);
  const r = ex_aplicarAgente_(id, ctx, a, { masivo: masivo });
  return r;
}
function ex_perfilarOp_(p) {
  if (p.encolar) {
    const b = ex_baseHojas_(), nom = {}; ex_filasContactos_(b.cs).forEach(function (r) { nom[String(r[0])] = r[2]; });
    (p.encolar || []).slice(0, 2000).forEach(function (id) { if (nom[id] !== undefined) ex_encolarPerfil_(String(id), nom[id]); });
    return { ok: true, pendientes: ex_pendientesPerf_() };
  }
  if (p.ids) return { ok: true, pendientes: ex_pendientesPerf_().length };
  const id = String(p.id || ''); if (!id) throw new Error('falta el contacto');
  try { return ex_perfilar_(id, p.masivo !== false); }
  catch (err) {
    const sh = ex_hojaPerf_(), filas = ex_filasPerf_(sh), i = filas.findIndex(function (r) { return String(r[0]) === id; });
    if (i >= 0 && /Pendiente/.test(String(filas[i][1]))) sh.getRange(i + 2, 2).setValue(/401|ANTHROPIC/.test(err.message) ? '⏳ Pendiente' : '⚠️ Error: ' + err.message.slice(0, 80));
    throw err;
  }
}

// Ronda automática: sigue con los pendientes mientras haya tiempo (unos 4 minutos por ejecución).
function ex_rondaPerfiles_() {
  if (!PropertiesService.getScriptProperties().getProperty('ANTHROPIC_API_KEY')) return;
  const t0 = Date.now(), ids = ex_pendientesPerf_(), pipe = {};
  ex_filasPerf_(ex_hojaPerf_()).forEach(function (r) { if (/pipeline/.test(String(r[1]))) pipe[String(r[0])] = true; });
  for (let k = 0; k < ids.length && Date.now() - t0 < 240000; k++) {
    try { const o = { masivo: true, pipeline: !!pipe[ids[k]] }, ctx = ex_contextoAgente_(ids[k], o), a = ex_llamarClaude_(ctx.contexto); ex_conLock_(function () { ex_aplicarAgente_(ids[k], ex_contextoAgente_(ids[k], o), a, o); }); }
    catch (err) { console.log('Perfil ' + ids[k] + ': ' + err.message); if (/401|credit|429/.test(err.message)) return; try { ex_perfilarError_(ids[k], err); } catch (e) {} }
  }
}
function ex_perfilarError_(id, err) { const sh = ex_hojaPerf_(), filas = ex_filasPerf_(sh), i = filas.findIndex(function (r) { return String(r[0]) === id; }); if (i >= 0) sh.getRange(i + 2, 2).setValue('⚠️ Error: ' + String(err.message).slice(0, 80)); }

function ex_leerPerfiles_() {
  const out = {};
  ex_filasPerf_(ex_hojaPerf_()).forEach(function (r) {
    if (!r[0]) return;
    let d = {}; try { d = JSON.parse(r[29] || '{}'); } catch (e) {}
    out[String(r[0])] = { estado: String(r[1] || ''), ciclo: r[3], clase: r[4], prob: Number(r[5]) || 0, potencial: Number(r[6]) || 0, p: d.p || {}, m: d.m || {}, r: d.r || [], resumen: d.resumen || '', act: d.t || '', confirmado: d.confirmado || {} };
  });
  return out;
}
// Corrección manual de un campo del perfil (queda como "confirmado" y el agente no lo vuelve a pisar).
function ex_corregirPerfil_(p) {
  const sh = ex_hojaPerf_(), filas = ex_filasPerf_(sh), i = filas.findIndex(function (r) { return String(r[0]) === String(p.id); });
  if (i < 0) throw new Error('ese contacto aún no tiene perfil');
  let d = {}; try { d = JSON.parse(filas[i][29] || '{}'); } catch (e) {}
  d.p = d.p || {}; d.confirmado = d.confirmado || {};
  Object.keys(p.campos || {}).forEach(function (k) { d.p[k] = p.campos[k]; d.confirmado[k] = true; });
  const sc = ex_puntuar_(d.p, d.m || {}); d.s = sc;
  ex_guardarPerfil_(String(p.id), filas[i][2], d.p, d.m || {}, sc, { resumen: d.resumen, recomendaciones: d.r }, '✓ Listo', d.confirmado);
  return { ok: true, perfil: ex_leerPerfiles_()[String(p.id)] };
}

// Estado de las oportunidades de contacto (hecha, descartada o pospuesta), compartido entre teléfono y PC.
function ex_oportunidad_(p) {
  const sh = ex_hojaCab_(EX_HOJA_OPS, EX_CAB_OPS), n = sh.getLastRow() - 1;
  if (p.clave) {
    const filas = n > 0 ? sh.getRange(2, 1, n, 1).getValues() : [], i = filas.findIndex(function (r) { return String(r[0]) === String(p.clave); });
    const fila = [String(p.clave), String(p.estado || 'hecha'), p.hasta ? ex_aFecha_(String(p.hasta), ex_tz_()) : '', String(p.contacto || ''), String(p.detalle || '').slice(0, 300), new Date()];
    if (i >= 0) sh.getRange(i + 2, 1, 1, fila.length).setValues([fila]); else sh.appendRow(fila);
    if (p.contacto && p.estado === 'hecha') { const b = ex_baseHojas_(); b.is.appendRow([new Date(), String(p.contacto), '💡 Oportunidad', String(p.detalle || 'Contactado').slice(0, 300), '', 'op:' + Date.now()]); ex_recalcular_(b.cs, b.is); }
  }
  return { ok: true, estados: ex_leerOps_() };
}
function ex_leerOps_() {
  const sh = SpreadsheetApp.getActive().getSheetByName(EX_HOJA_OPS); if (!sh) return {};
  const n = sh.getLastRow() - 1, tz = ex_tz_(), out = {};
  (n > 0 ? sh.getRange(2, 1, n, 6).getValues() : []).forEach(function (r) { if (r[0]) out[String(r[0])] = { e: String(r[1]), h: r[2] instanceof Date ? ex_ymd_(r[2], tz) : '', f: r[5] instanceof Date ? ex_ymd_(r[5], tz) : '', c: String(r[3]) }; });
  return out;
}

/* ---------- Bsale: arribos y stock crítico (una vez al día) ---------- */
const EX_HOJA_BSTOCK = 'Bsale stock';
const EX_CAB_BSTOCK = ['ID variante', 'Stock', 'Actualizado', 'Llegó', 'Crítico'];
function ex_bsaleSincStock_() {
  if (!ex_bsaleToken_()) return 0;
  const tot = {};
  ex_bsaleTodo_('/stocks.json').forEach(function (s) { const id = String(s.variant && s.variant.id); if (id) tot[id] = (tot[id] || 0) + (+s.quantityAvailable || 0); });
  const sh = ex_hojaCab_(EX_HOJA_BSTOCK, EX_CAB_BSTOCK), n = sh.getLastRow() - 1, ant = {};
  (n > 0 ? sh.getRange(2, 1, n, 5).getValues() : []).forEach(function (r) { ant[String(r[0])] = r; });
  const hoy = new Date(), filas = Object.keys(tot).map(function (id) {
    const a = ant[id], s = tot[id], prev = a ? +a[1] || 0 : null;
    const llego = prev !== null && prev <= 0 && s > 0 ? hoy : (a ? a[3] : '');
    const critico = prev !== null && prev > 2 && s > 0 && s <= 2 ? hoy : (s > 2 ? '' : (a ? a[4] : ''));
    return [id, s, hoy, llego, critico];
  });
  if (n > 0) sh.getRange(2, 1, n, 5).clearContent();
  if (filas.length) sh.getRange(2, 1, filas.length, 5).setValues(filas);
  return filas.length;
}
// Para la app: productos con stock (y los que llegaron o quedan pocos), para cruzar con los intereses de los clientes.
function ex_bsaleResumen_() {
  if (!ex_bsaleToken_()) return null;
  const sh = SpreadsheetApp.getActive().getSheetByName(EX_HOJA_BSTOCK); if (!sh) return { items: [] };
  const n = sh.getLastRow() - 1, tz = ex_tz_(), st = {};
  (n > 0 ? sh.getRange(2, 1, n, 5).getValues() : []).forEach(function (r) { st[String(r[0])] = r; });
  const items = [];
  ex_bsaleCatalogo_Leer_().forEach(function (v) {
    const r = st[v.id]; if (!r || !(+r[1] > 0)) return;
    items.push({ p: v.producto, v: v.variante, s: +r[1], l: r[3] instanceof Date ? ex_ymd_(r[3], tz) : '', c: r[4] instanceof Date ? ex_ymd_(r[4], tz) : '' });
  });
  return { items: items.slice(0, 4000) };
}


/* ---------- Bsale: ventas, clientes y rotación ---------- */
// Copia las ventas de Bsale (boletas, facturas y notas de crédito, una fila por producto vendido) a la hoja "Bsale ventas".
// La primera vez trae los últimos 12 meses por partes (unos minutos por ronda); después solo lo nuevo, cada hora.
const EX_HOJA_BSV = 'Bsale ventas';
const EX_CAB_BSV = ['Fecha', 'Documento ID', 'Tipo', 'Número', 'Cliente ID', 'Cliente', 'Email', 'Teléfono', 'RUT', 'Variante ID', 'Producto', 'Variante', 'SKU', 'Cantidad', 'Total', 'Neto'];
function ex_bsaleVentasSinc_(maxMs) {
  if (!ex_bsaleToken_()) return { ok: true, activo: false };
  const pr = PropertiesService.getScriptProperties(), t0 = Date.now(), lim = maxMs || 240000;
  let st = JSON.parse(pr.getProperty('EX_BSV_ESTADO') || 'null');
  const ahora = Math.floor(Date.now() / 1000);
  if (!st) st = { desde: ahora - 365 * 86400, hasta: ahora, offset: 0, total: null };
  if (st.listo) { if (ahora - st.hasta < 3000) return { ok: true, nuevos: 0, al_dia: true }; st = { desde: st.hasta - 2 * 86400, hasta: ahora, offset: 0, total: null }; }
  const sh = ex_hojaCab_(EX_HOJA_BSV, EX_CAB_BSV), n = sh.getLastRow() - 1, vistos = {};
  (n > 0 ? sh.getRange(2, 2, n, 1).getValues() : []).forEach(function (r) { vistos[String(r[0])] = 1; });
  const cat = {}; try { ex_bsaleCatalogo_Leer_().forEach(function (v) { cat[v.id] = v; }); } catch (e) {}
  let nuevos = 0;
  const base = '/documents.json?expand=' + encodeURIComponent('[details,client,document_type]') + '&emissiondaterange=' + encodeURIComponent('[' + st.desde + ',' + st.hasta + ']');
  while (Date.now() - t0 < lim) {
    const rutas = []; for (let k = 0; k < 4; k++) rutas.push(base + '&limit=50&offset=' + (st.offset + k * 50));
    const pags = ex_bsaleVarias_(rutas), filas = [];
    if (pags.some(function (j) { return !j; })) break;   // si una página falla, se reintenta en la próxima ronda sin saltarse nada
    let fin = false;
    pags.forEach(function (j) {
      const items = (j && j.items) || []; if (j && j.count != null) st.total = +j.count;
      if (items.length < 50) fin = true;
      items.forEach(function (d) {
        const id = String(d.id); if (vistos[id] || +d.state === 1) return; vistos[id] = 1;
        const tipo = (d.document_type && d.document_type.name) || '', nc = d.document_type && (+d.document_type.isCreditNote === 1 || /cr[eé]dito/i.test(tipo)), sg = nc ? -1 : 1;
        const c = d.client || {}, cn = [c.firstName, c.lastName].filter(Boolean).join(' ') || c.company || '';
        const fecha = new Date((+d.emissionDate || 0) * 1000);
        const det = (d.details && d.details.items) || [];
        if (!det.length) { filas.push([fecha, id, tipo, d.number || '', c.id || '', cn, c.email || '', String(c.phone || ''), c.code || '', '', '(sin detalle)', '', '', 0, sg * (+d.totalAmount || 0), sg * (+d.netAmount || 0)]); return; }
        det.forEach(function (it) {
          const vid = String((it.variant && it.variant.id) || ''), v = cat[vid] || {};
          filas.push([fecha, id, tipo, d.number || '', c.id || '', cn, c.email || '', String(c.phone || ''), c.code || '', vid, v.producto || (it.variant && it.variant.description) || it.description || '', v.variante || '', v.sku || (it.variant && it.variant.code) || '', sg * (+it.quantity || 0), sg * (+it.totalAmount || 0), sg * (+it.netAmount || 0)]);
        });
      });
    });
    if (filas.length) { sh.getRange(sh.getLastRow() + 1, 1, filas.length, EX_CAB_BSV.length).setValues(filas); nuevos += filas.length; }
    st.offset += 200;
    if (fin || (st.total != null && st.offset >= st.total)) { st.listo = true; break; }
  }
  pr.setProperty('EX_BSV_ESTADO', JSON.stringify(st));
  if (nuevos) CacheService.getScriptCache().remove('bsv_res');
  return { ok: true, nuevos: nuevos, listo: !!st.listo, avance: st.total ? Math.min(100, Math.round(st.offset / st.total * 100)) : null };
}
// Ejecútala a mano (▶) para traer el historial de una vez; si no alcanza, sigue sola cada hora.
function sincronizarVentasBsale() { const r = ex_bsaleVentasSinc_(330000); Logger.log(JSON.stringify(r)); }
function ex_bsvFilas_() {
  const sh = SpreadsheetApp.getActive().getSheetByName(EX_HOJA_BSV); if (!sh || sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, EX_CAB_BSV.length).getValues().filter(function (r) { return r[0] instanceof Date; });
}
// Resumen para la app y los agentes: ventas por mes, períodos, top productos, rotación y productos quietos, mejores clientes.
function ex_bsaleVentasResumen_() {
  const cache = CacheService.getScriptCache(), c0 = cache.get('bsv_res'); if (c0) return JSON.parse(c0);
  const F = ex_bsvFilas_(), tz = ex_tz_(), hoy = ex_hoyYmd_(tz), ms = function (d) { return Date.parse(hoy) - d * 86400000; };
  if (!F.length) return { ok: true, activo: !!ex_bsaleToken_(), vacio: true, estado: JSON.parse(PropertiesService.getScriptProperties().getProperty('EX_BSV_ESTADO') || 'null') };
  const meses = {}, docsMes = {}, prod = {}, cli = {}, dias = {}, ult = {};
  F.forEach(function (r) {
    const f = ex_ymd_(r[0], tz), m = f.slice(0, 7), t = +r[14] || 0, q = +r[13] || 0, doc = String(r[1]), t0 = r[0].getTime();
    meses[m] = (meses[m] || 0) + t; (docsMes[m] = docsMes[m] || {})[doc] = 1; dias[f] = (dias[f] || 0) + t;
    const pk = String(r[10] || '(sin producto)');
    const p = prod[pk] = prod[pk] || { producto: pk, u30: 0, m30: 0, u90: 0, m90: 0, u365: 0, m365: 0, vids: {} };
    if (r[9]) p.vids[String(r[9])] = 1;
    if (t0 >= ms(30)) { p.u30 += q; p.m30 += t; } if (t0 >= ms(90)) { p.u90 += q; p.m90 += t; } p.u365 += q; p.m365 += t;
    if (r[9]) ult[String(r[9])] = Math.max(ult[String(r[9])] || 0, t0);
    const ck = String(r[6] || r[7] || r[8] || r[4] || '').toLowerCase(); if (ck && r[5]) { const c = cli[ck] = cli[ck] || { nombre: r[5], email: r[6], telefono: String(r[7] || ''), rut: r[8], total: 0, docs: {}, ultima: '' }; c.total += t; c.docs[doc] = 1; if (f > c.ultima) c.ultima = f; }
  });
  const mk = Object.keys(meses).sort().slice(-13), mesAct = hoy.slice(0, 7), mesAnt = mk.filter(function (k) { return k < mesAct; }).pop() || '';
  const anioAnt = String(+mesAct.slice(0, 4) - 1) + mesAct.slice(4);
  const sumDias = function (a, b) { let s = 0; Object.keys(dias).forEach(function (d) { if (d >= a && d <= b) s += dias[d]; }); return s; };
  const lunes = (function () { const d = new Date(Date.parse(hoy)); const w = (d.getUTCDay() + 6) % 7; return ex_ymd_(new Date(Date.parse(hoy) - w * 86400000 + 43200000), tz); })();
  // rotación: stock actual (hoja Bsale stock) vs ventas de 90 días
  const stock = {}; try { const sh = SpreadsheetApp.getActive().getSheetByName(EX_HOJA_BSTOCK); if (sh && sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, 2).getValues().forEach(function (r) { stock[String(r[0])] = +r[1] || 0; }); } catch (e) {}
  const cat = {}; try { ex_bsaleCatalogo_Leer_().forEach(function (v) { cat[v.id] = v; }); } catch (e) {}
  const porProd = {}; Object.keys(stock).forEach(function (vid) { const v = cat[vid]; if (!v || stock[vid] <= 0) return; const k = v.producto; (porProd[k] = porProd[k] || { producto: k, stock: 0, vids: [] }); porProd[k].stock += stock[vid]; porProd[k].vids.push(vid); });
  const rot = Object.keys(porProd).map(function (k) { const s = porProd[k], p = prod[k] || { u90: 0, m90: 0 }, diario = p.u90 / 90, u = Math.max.apply(null, s.vids.map(function (v) { return ult[v] || 0; }).concat([0]));
    return { producto: k, stock: s.stock, vendidas90: p.u90, cobertura_dias: diario > 0 ? Math.round(s.stock / diario) : null, ultima_venta: u ? ex_ymd_(new Date(u), tz) : '' }; });
  const res = { ok: true, activo: true, filas: F.length, desde: ex_ymd_(F[0][0], tz), hasta: ex_ymd_(F[F.length - 1][0], tz),
    meses: mk.map(function (k) { const d = Object.keys(docsMes[k] || {}).length; return { mes: k, total: Math.round(meses[k]), docs: d, ticket: d ? Math.round(meses[k] / d) : 0 }; }),
    hoy: Math.round(dias[hoy] || 0), semana: Math.round(sumDias(lunes, hoy)), mes: Math.round(meses[mesAct] || 0), mes_anterior: Math.round(meses[mesAnt] || 0), mismo_mes_anio_anterior: Math.round(meses[anioAnt] || 0),
    mes_anterior_a_la_fecha: Math.round(sumDias(mesAnt + '-01', mesAnt + '-' + hoy.slice(8))),
    top30: Object.keys(prod).map(function (k) { return prod[k]; }).filter(function (p) { return p.m30 > 0; }).sort(function (a, b) { return b.m30 - a.m30; }).slice(0, 15).map(function (p) { return { producto: p.producto, unidades: p.u30, monto: Math.round(p.m30) }; }),
    top90u: Object.keys(prod).map(function (k) { return prod[k]; }).filter(function (p) { return p.u90 > 0; }).sort(function (a, b) { return b.u90 - a.u90; }).slice(0, 15).map(function (p) { return { producto: p.producto, unidades: p.u90, monto: Math.round(p.m90) }; }),
    reponer: rot.filter(function (x) { return x.cobertura_dias != null && x.cobertura_dias <= 30; }).sort(function (a, b) { return a.cobertura_dias - b.cobertura_dias; }).slice(0, 15),
    quietos: rot.filter(function (x) { return !x.vendidas90; }).sort(function (a, b) { return b.stock - a.stock; }).slice(0, 20),
    clientes: Object.keys(cli).map(function (k) { const c = cli[k]; return { nombre: c.nombre, email: c.email, telefono: c.telefono, total: Math.round(c.total), compras: Object.keys(c.docs).length, ultima: c.ultima }; }).sort(function (a, b) { return b.total - a.total; }).slice(0, 15),
    estado: JSON.parse(PropertiesService.getScriptProperties().getProperty('EX_BSV_ESTADO') || 'null') };
  try { cache.put('bsv_res', JSON.stringify(res), 1800); } catch (e) {}
  return res;
}
// Compras de un cliente (por email, teléfono, RUT o nombre), para su ficha y para los agentes.
function ex_bsaleCompras_(q) {
  const tel = String(q.telefono || '').replace(/\D/g, '').slice(-8), email = String(q.email || '').toLowerCase().trim(), rut = String(q.rut || '').replace(/[^0-9kK]/g, '').toLowerCase(), nom = ex_norm_(q.nombre || '').trim(), tz = ex_tz_();
  if (!tel && !email && !rut && nom.length < 5) return [];
  const docs = {};
  ex_bsvFilas_().forEach(function (r) {
    const ok = (email && String(r[6]).toLowerCase() === email) || (tel.length === 8 && String(r[7]).replace(/\D/g, '').slice(-8) === tel) || (rut && String(r[8]).replace(/[^0-9kK]/g, '').toLowerCase() === rut) || (!email && !tel && !rut && nom && ex_norm_(r[5]) === nom);
    if (!ok) return;
    const d = docs[r[1]] = docs[r[1]] || { fecha: ex_ymd_(r[0], tz), tipo: String(r[2]), numero: r[3], total: 0, items: [] };
    d.total += +r[14] || 0; if (r[10]) d.items.push((+r[13] || 0) + '× ' + r[10] + (r[11] ? ' (' + r[11] + ')' : ''));
  });
  return Object.keys(docs).map(function (k) { return docs[k]; }).sort(function (a, b) { return b.fecha.localeCompare(a.fecha); }).slice(0, 40);
}
function ex_bsaleVentas_(p) {
  if (!ex_bsaleToken_()) return { ok: true, activo: false };
  if (p.sinc) ex_bsaleVentasSinc_(200000);
  if (p.cliente) return { ok: true, activo: true, compras: ex_bsaleCompras_(p.cliente) };
  return ex_bsaleVentasResumen_();
}
// Texto para el Copiloto, el agente de tareas y el Cerebro.
function ex_bsaleVentasTexto_(consulta, dias) {
  const r = ex_bsaleVentasResumen_(); if (!r.activo) return 'Bsale aún no está conectado.'; if (r.vacio) return 'Las ventas de Bsale todavía se están copiando (primera sincronización).';
  if (consulta) {
    const tk = ex_norm_(consulta).split(/[^a-z0-9]+/).filter(function (w) { return w.length >= 3; }), lim = Date.now() - (dias || 90) * 86400000, por = {};
    ex_bsvFilas_().forEach(function (x) { if (x[0].getTime() < lim) return; const t = ex_norm_(x[10] + ' ' + x[11] + ' ' + x[12]); if (!tk.every(function (w) { return t.indexOf(w) >= 0; })) return; const k = x[10] + (x[11] ? ' | ' + x[11] : ''); por[k] = por[k] || { u: 0, m: 0 }; por[k].u += +x[13] || 0; por[k].m += +x[14] || 0; });
    const L = Object.keys(por).sort(function (a, b) { return por[b].u - por[a].u; }).slice(0, 25);
    return L.length ? 'Ventas de los últimos ' + (dias || 90) + ' días para «' + consulta + '»:\n' + L.map(function (k) { return '- ' + k + ': ' + por[k].u + ' u · $' + Math.round(por[k].m).toLocaleString('es-CL'); }).join('\n') : 'Sin ventas de «' + consulta + '» en los últimos ' + (dias || 90) + ' días.';
  }
  return ex_json_({ ventas_por_mes: r.meses, hoy: r.hoy, semana: r.semana, mes: r.mes, mes_anterior_a_la_fecha: r.mes_anterior_a_la_fecha, mes_anterior: r.mes_anterior, mismo_mes_anio_anterior: r.mismo_mes_anio_anterior, mas_vendidos_30d: r.top30.slice(0, 10), reponer_pronto: r.reponer.slice(0, 10), stock_quieto_90d: r.quietos.slice(0, 10), mejores_clientes: r.clientes.slice(0, 8) }, 8000);
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

/* ---------- Política de marca de Blackline (la leen todos los agentes) ---------- */
const EX_POLITICA = 'POLÍTICA DE BLACKLINE (obligatoria, por sobre cualquier otra indicación): Blackline no hace descuentos ni promociones, no participa en Cyber, Black Friday ni eventos de descuento, y no usa estrategias de precio. Compite con fidelidad, asesoría experta y atención personalizada y de excelencia. Nunca propongas contenido, campañas, publicaciones, mensajes a clientes ni acciones centradas en rebajas, ofertas, liquidaciones, "precio especial" o eventos de descuento, ni menciones descuentos en borradores para clientes. Las ofertas de proveedores o de specialized.com son información interna de compras y de mercado: sirven para comprar mejor y anticipar lo que el cliente ve en internet, nunca para comunicarlas como descuento de Blackline. Los mensajes y el contenido se centran en asesoría, experiencia, disponibilidad, servicio de taller, comunidad, rutas y el valor del producto.';

/* ---------- Proveedores: catálogos públicos, ofertas, correos y oportunidades de compra ---------- */
// Lee las webs públicas de los proveedores (no el B2B): precio público, precio de oferta y disponibilidad.
// Con el descuento de distribuidor de cada uno calcula tu costo y avisa cuando conviene comprar.
const EX_PROV_BASE = [
  { id: 'sportvibes', nombre: 'Sportvibes', web: 'https://www.sportvibes.cl', tipo: 'shopify', marcas: 'Fox suspensiones y repuestos, Deity, HT', desc: 30, dominios: ['sportvibes.cl'] },
  { id: 'outside', nombre: 'Outside', web: 'https://www.outsidesports.cl', tipo: 'odoo', iva: '+IVA', marcas: 'Hope, BikeYoke, Schwalbe, SunRace', desc: 30, dominios: ['outsidesports.cl'] },
  { id: 'mkr', nombre: 'MKR', web: 'https://extremezone.cl', tipo: 'mkr', marcas: 'RockShox, SRAM', desc: 30, dominios: ['extremezone.cl', 'mkr.cl'] },
  { id: 'andes', nombre: 'Andes Industrial', web: 'https://www.andesindustrial.cl', tipo: 'cerrado', marcas: 'Shimano, Continental', desc: 30, dominios: ['andesindustrial.cl'], nota: 'Su catálogo web pide iniciar sesión: se siguen sus correos y las listas de precios que dejes en la carpeta Fuentes.' },
  { id: 'specialized', nombre: 'Specialized', web: 'https://www.specialized.com/cl/es', tipo: 'specialized', marcas: 'Specialized, S-Works, Roval y todo su ecosistema', desc: 30, dominios: ['specialized.com'] },
  { id: 'garmin', nombre: 'Garmin', web: 'https://garminstore.cl', tipo: 'shopify', marcas: 'Garmin, Tacx', desc: 20, dominios: ['garmin.com', 'garminstore.cl'], nota: 'Margen bajo (~20 %): conviene comprar productos nuevos o vigentes cuando estén en promoción y venderlos a precio normal cuando termine.' },
  { id: 'trail', nombre: 'Trail', web: 'https://trailstore.cl', tipo: 'shopify', marcas: 'Fox ropa e indumentaria', desc: 30, dominios: ['trailsports.cl', 'trailstore.cl'], vendor: 'fox', excluir: 'moto|motocross|\\bmx\\b|atv|enduro moto|off ?road' }
];
const EX_MKR_TERMINOS = ['sram', 'rockshox', 'eagle', 'transmission', 'gx', 'x0', 'xx', 'nx', 'sx', 'apex', 'rival', 'force', 'red axs', 'cassette', 'cadena', 'plato', 'desviador', 'shifter', 'pod', 'maven', 'code', 'level', 'db8', 'motive', 'pastillas', 'rotor', 'centerline', 'pike', 'lyrik', 'zeb', 'sid', 'psylo', 'domain', 'judy', 'recon', 'boxxer', 'deluxe', 'super deluxe', 'vivid', 'reverb', 'service kit', 'dub', 'roam', 'kit mantencion', 'powermeter', 'quarq'];
const EX_HOJA_PROVC = 'Proveedores catálogo', EX_HOJA_PROVM = 'Proveedores movimientos';
const EX_CAB_PROVC = ['Proveedor', 'ID', 'SKU', 'Producto', 'Marca', 'Categoría', 'Precio web', 'Precio normal', 'IVA', 'URL', 'Imagen', 'Disponible', 'Visto desde', 'Visto', 'En oferta desde', 'Revisado'];
const EX_CAB_PROVM = ['Fecha', 'Proveedor', 'ID', 'Producto', 'Tipo', 'Antes', 'Después'];
let _exProvCat = null;
function ex_proveedoresConf_() {
  const g = JSON.parse(PropertiesService.getScriptProperties().getProperty('PROVEEDORES') || '{}');
  return EX_PROV_BASE.map(function (p) { return Object.assign({}, p, g[p.id] || {}); });
}
function ex_get_(url) { return UrlFetchApp.fetch(url, { muteHttpExceptions: true, followRedirects: true, headers: { 'Accept-Language': 'es-CL,es;q=0.9' } }); }
// Shopify publica el catálogo en /products.json: precio, precio comparado (= normal cuando hay oferta), SKU y disponibilidad.
function ex_provShopify_(p) {
  const out = [], ex = p.excluir ? new RegExp(p.excluir, 'i') : null;
  for (let pg = 1; pg <= 30; pg++) {
    const r = ex_get_(p.web + '/products.json?limit=250&page=' + pg);
    if (r.getResponseCode() !== 200) { if (pg === 1) throw new Error('respondió ' + r.getResponseCode()); break; }
    const L = (JSON.parse(r.getContentText()).products) || []; if (!L.length) break;
    L.forEach(function (x) {
      if (p.vendor && String(x.vendor || '').toLowerCase().indexOf(p.vendor) < 0) return;
      if (ex && ex.test([x.title, x.product_type, (x.tags || []).join(' ')].join(' '))) return;
      const V = x.variants || [], disp = V.filter(function (v) { return v.available; });
      const pr = V.map(function (v) { return +v.price || 0; }).filter(Boolean), min = pr.length ? Math.min.apply(null, pr) : 0;
      const vmin = V.filter(function (v) { return +v.price === min; })[0] || V[0] || {}, cmp = +vmin.compare_at_price || 0;
      out.push({ id: String(x.id), sku: String(vmin.sku || ''), nombre: String(x.title || ''), marca: String(x.vendor || ''), cat: String(x.product_type || ''), precio: min, normal: cmp > min ? cmp : min, iva: 'incluido', url: p.web + '/products/' + x.handle, img: x.images && x.images[0] ? x.images[0].src : '', disp: disp.length ? 'Sí (' + disp.length + '/' + V.length + ')' : 'No', creado: String(x.created_at || '').slice(0, 10) });
    });
    if (L.length < 250) break;
  }
  return out;
}
// Odoo (Outside): páginas de la tienda con 200 productos; los precios se muestran + IVA.
function ex_provOdoo_(p) {
  const out = [], vistos = {};
  for (let pg = 1; pg <= 20; pg++) {
    const r = ex_get_(p.web + (pg === 1 ? '/shop?ppg=200' : '/shop/page/' + pg + '?ppg=200'));
    if (r.getResponseCode() !== 200) { if (pg === 1) throw new Error('respondió ' + r.getResponseCode()); break; }
    const partes = r.getContentText().split('class="oe_product_cart').slice(1); let nuevos = 0;
    partes.forEach(function (c) {
      const href = /href="(\/shop\/[^"#?]+)/.exec(c), nom = /itemprop="name"[^>]*content="([^"]*)"/.exec(c) || /itemprop="name"[^>]*>([^<]+)</.exec(c);
      if (!href || vistos[href[1]]) return; vistos[href[1]] = 1; nuevos++;
      const precio = +((/itemprop="price"[^>]*>([\d.]+)</.exec(c) || [])[1] || 0);
      const base = /(?:base_price|list_price)[^>]*>[^<]*<span class="oe_currency_value">([\d.,]+)</.exec(c), normal = base ? +base[1].replace(/\./g, '').replace(',', '.') : 0;
      const alt = /alt="\[([^\]]+)\]/.exec(c), img = /<img src="([^"]+)"/.exec(c);
      const n = String(nom ? nom[1] : '').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&#34;|&quot;/g, '"').trim();
      out.push({ id: href[1].split('-').pop(), sku: alt ? alt[1] : '', nombre: n, marca: n.split(/\s+/)[0] || '', cat: '', precio: precio, normal: normal > precio ? normal : precio, iva: '+IVA', url: p.web + href[1], img: img ? p.web + img[1].replace(/&amp;/g, '&') : '', disp: /a-submit|Carro de compras/.test(c) ? 'Sí' : 'Consultar', creado: '' });
    });
    if (partes.length < 200 || !nuevos) break;
  }
  return out;
}
// MKR (Extremezone): su buscador entrega los productos; el detalle (precio normal, oferta y stock) se revisa por turnos.
function ex_provMkr_(p) {
  const api = 'https://api.extremezone.cl/api/search/', vistos = {}, out = [];
  const rs = [];
  for (let i = 0; i < EX_MKR_TERMINOS.length; i += 8) Array.prototype.push.apply(rs, UrlFetchApp.fetchAll(EX_MKR_TERMINOS.slice(i, i + 8).map(function (t) { return { url: api + encodeURIComponent(t), muteHttpExceptions: true }; })));
  rs.forEach(function (r) {
    if (r.getResponseCode() !== 200) return;
    let L = []; try { L = JSON.parse(r.getContentText()).products || []; } catch (e) {}
    L.forEach(function (x) {
      if (vistos[x.id] || !/sram|rockshox|quarq|zipp|time/i.test(String(x.brand || ''))) return; vistos[x.id] = 1;
      const sku = String(x.mkr_skus || '').split(',')[0], precio = +String(x.price_range || '').replace(/[^\d]/g, '') || 0;
      out.push({ id: String(x.ficha_code || x.id), sku: sku, nombre: String(x.model || ''), marca: String(x.brand || ''), cat: '', precio: precio, normal: precio, iva: 'incluido', url: 'https://extremezone.cl' + String(x.url || ''), img: x.photo ? 'https://api.extremezone.cl' + x.photo : '', disp: '', creado: '', mkr: true });
    });
  });
  if (!out.length) throw new Error('el buscador de MKR no entregó productos');
  return out;
}
function ex_provDetalleMkr_(max) {
  const sh = SpreadsheetApp.getActive().getSheetByName(EX_HOJA_PROVC); if (!sh || sh.getLastRow() < 2) return 0;
  const n = sh.getLastRow() - 1, F = sh.getRange(2, 1, n, EX_CAB_PROVC.length).getValues(), ahora = Date.now();
  const toca = F.map(function (r, i) { return { r: r, i: i }; }).filter(function (x) { return x.r[0] === 'mkr' && x.r[2] && !(x.r[15] instanceof Date && ahora - x.r[15].getTime() < 24 * 3600000); }).slice(0, max || 60);
  if (!toca.length) return 0;
  const mov = [];
  for (let k = 0; k < toca.length; k += 10) {
    const g = toca.slice(k, k + 10), rs = UrlFetchApp.fetchAll(g.map(function (x) { return { url: 'https://api.extremezone.cl/api/detail_payment/' + encodeURIComponent(x.r[2]), muteHttpExceptions: true }; }));
    rs.forEach(function (resp, j) {
      const x = g[j], r = x.r; r[15] = new Date();
      let d = null; try { d = JSON.parse(resp.getContentText()).product; } catch (e) {}
      if (!d) return;
      const normal = +d.precio2 || +r[7], oferta = d.precio_oferta ? +d.precio_oferta : (+d.descto ? Math.round(normal * (1 - d.descto / 100)) : normal), stock = (+d.stock || 0) + (+d.stock_vitacura || 0) + (+d.stock_laserena || 0) + (+d.stock_valdivia || 0) + (+d.stock_mallsport || 0) + (+d.stock_auxiliar || 0);
      const antes = +r[6] < +r[7];
      r[6] = oferta; r[7] = normal; r[11] = stock ? 'Sí (' + stock + ')' : 'No';
      if (oferta < normal && !antes) { r[14] = new Date(); mov.push([new Date(), 'mkr', r[1], r[3], 'oferta', normal, oferta]); }
      if (oferta >= normal && antes) { r[14] = ''; mov.push([new Date(), 'mkr', r[1], r[3], 'fin oferta', '', normal]); }
    });
  }
  toca.forEach(function (x) { F[x.i] = x.r; });
  sh.getRange(2, 1, n, EX_CAB_PROVC.length).setValues(F); _exProvCat = null;
  ex_provGuardarMov_(mov);
  return toca.length;
}
function ex_provGuardarMov_(filas) {
  if (!filas.length) return;
  const sh = ex_hojaCab_(EX_HOJA_PROVM, EX_CAB_PROVM);
  sh.getRange(sh.getLastRow() + 1, 1, filas.length, EX_CAB_PROVM.length).setValues(filas);
  if (sh.getLastRow() > 8000) sh.deleteRows(2, sh.getLastRow() - 7000);
}
function ex_provSinc_(id) {
  const p = ex_proveedoresConf_().filter(function (x) { return x.id === id; })[0]; if (!p) throw new Error('proveedor desconocido');
  const pr = PropertiesService.getScriptProperties(), est = JSON.parse(pr.getProperty('PROV_SINC') || '{}');
  if (p.tipo === 'cerrado' || p.tipo === 'specialized') { est[id] = { fecha: new Date().toISOString(), productos: 0, nota: p.tipo === 'specialized' ? 'Se lee en el módulo Specialized' : 'Catálogo con inicio de sesión' }; pr.setProperty('PROV_SINC', JSON.stringify(est)); return est[id]; }
  let items;
  try { items = p.tipo === 'shopify' ? ex_provShopify_(p) : p.tipo === 'odoo' ? ex_provOdoo_(p) : ex_provMkr_(p); }
  catch (e) { est[id] = Object.assign({}, est[id] || {}, { error: e.message, intento: new Date().toISOString() }); pr.setProperty('PROV_SINC', JSON.stringify(est)); throw e; }
  const sh = ex_hojaCab_(EX_HOJA_PROVC, EX_CAB_PROVC), n = sh.getLastRow() - 1, todas = n > 0 ? sh.getRange(2, 1, n, EX_CAB_PROVC.length).getValues() : [];
  const otras = todas.filter(function (r) { return r[0] !== id; }), prev = {}; todas.forEach(function (r) { if (r[0] === id) prev[String(r[1])] = r; });
  const primera = !Object.keys(prev).length, ahora = new Date(), hoy = ex_hoyYmd_(), mov = [], filas = [];
  items.forEach(function (x) {
    const a = prev[x.id], enOf = x.precio && x.precio < x.normal;
    const fila = [id, x.id, x.sku, x.nombre, x.marca, x.cat, x.precio, x.normal, x.iva, x.url, x.img, x.disp, x.creado || hoy, hoy, enOf ? ahora : '', a ? a[15] : ''];
    if (a) {
      fila[12] = a[12] instanceof Date ? ex_ymd_(a[12]) : (a[12] || fila[12]);
      if (x.mkr) { fila[6] = a[6] || x.precio; fila[7] = a[7] || x.normal; fila[11] = a[11]; fila[14] = a[14]; }
      else {
        const antes = +a[6] < +a[7];
        if (enOf && antes) fila[14] = a[14] || ahora;
        if (enOf && !antes) mov.push([ahora, id, x.id, x.nombre, 'oferta', x.normal, x.precio]);
        if (!enOf && antes) mov.push([ahora, id, x.id, x.nombre, 'fin oferta', a[6], x.precio]);
        if (+a[7] && +x.normal !== +a[7]) mov.push([ahora, id, x.id, x.nombre, 'precio', a[7], x.normal]);
      }
    } else if (!primera) mov.push([ahora, id, x.id, x.nombre, 'nuevo', '', x.precio]);
    filas.push(fila);
  });
  const todo = otras.concat(filas);
  if (n > 0) sh.getRange(2, 1, n, EX_CAB_PROVC.length).clearContent();
  if (todo.length) sh.getRange(2, 1, todo.length, EX_CAB_PROVC.length).setValues(todo);
  _exProvCat = null; ex_provGuardarMov_(mov);
  est[id] = { fecha: ahora.toISOString(), productos: items.length, ofertas: items.filter(function (x) { return x.precio < x.normal; }).length, cambios: mov.length };
  pr.setProperty('PROV_SINC', JSON.stringify(est));
  return est[id];
}
// Cada hora: actualiza el proveedor con la lectura más antigua (uno por vez) y revisa precios de MKR por turnos.
function ex_rondaProveedores_() {
  const est = JSON.parse(PropertiesService.getScriptProperties().getProperty('PROV_SINC') || '{}');
  const due = ex_proveedoresConf_().filter(function (p) { return /shopify|odoo|mkr/.test(p.tipo); })
    .map(function (p) { const e = est[p.id] || {}; return { p: p, t: Date.parse(e.fecha || e.intento || 0) || 0 }; })
    .filter(function (x) { return Date.now() - x.t > 20 * 3600000; }).sort(function (a, b) { return a.t - b.t; })[0];
  if (due) { try { ex_provSinc_(due.p.id); } catch (e) { console.log('Proveedor ' + due.p.id + ': ' + e.message); } }
  else ex_provDetalleMkr_(60);
}
function ex_provCatalogo_() {
  if (_exProvCat) return _exProvCat;
  const sh = SpreadsheetApp.getActive().getSheetByName(EX_HOJA_PROVC); if (!sh || sh.getLastRow() < 2) return (_exProvCat = []);
  const tz = ex_tz_(), f = function (d) { return d instanceof Date ? ex_ymd_(d, tz) : String(d || ''); };
  return (_exProvCat = sh.getRange(2, 1, sh.getLastRow() - 1, EX_CAB_PROVC.length).getValues().filter(function (r) { return r[0]; }).map(function (r) {
    return { prov: String(r[0]), id: String(r[1]), sku: String(r[2]), nombre: String(r[3]), marca: String(r[4]), cat: String(r[5]), precio: +r[6] || 0, normal: +r[7] || 0, iva: String(r[8]), url: String(r[9]), img: String(r[10]), disp: String(r[11]), desde: f(r[12]), visto: f(r[13]), ofertaDesde: f(r[14]) };
  }));
}
function ex_provBuscar_(q, max) {
  const C = ex_provCatalogo_(), tk = ex_norm_(q).split(/[^a-z0-9.-]+/).filter(function (w) { return w.length >= 2; }); if (!tk.length) return [];
  const conf = {}; ex_proveedoresConf_().forEach(function (p) { conf[p.id] = p; });
  const res = C.map(function (x) {
    const t = ' ' + ex_norm_(x.nombre + ' ' + x.marca + ' ' + x.cat + ' ' + x.sku).replace(/[^a-z0-9.-]+/g, ' ') + ' ';
    const p = tk.filter(function (w) { return t.indexOf(' ' + w) >= 0 || (w.length > 4 && t.indexOf(w) >= 0); }).length;
    return { x: x, p: p };
  }).filter(function (o) { return o.p >= (tk.length <= 3 ? tk.length : Math.ceil(tk.length * 0.75)); }).sort(function (a, b) { return b.p - a.p || (/^(horquilla|amortiguador|freno|rueda|bicicleta|cartucho)/i.test(b.x.nombre) - /^(horquilla|amortiguador|freno|rueda|bicicleta|cartucho)/i.test(a.x.nombre)) || a.x.nombre.length - b.x.nombre.length; }).slice(0, max || 20).map(function (o) { return ex_provCosto_(o.x, conf[o.x.prov]); });
  // Specialized se busca en su propio catálogo
  try { ex_spzBuscar_(q, 5).forEach(function (s) { res.push(ex_provCosto_({ prov: 'specialized', id: s.id, sku: '', nombre: s.nombre, marca: 'Specialized', cat: s.disciplina, precio: s.oferta || s.precio, normal: s.precio, iva: 'incluido', url: s.url, img: s.img, disp: s.stock == null ? '' : s.stock ? 'Sí (' + s.stock + ' en Chile)' : 'No', desde: s.desde, ofertaDesde: '' }, conf.specialized)); }); } catch (e) {}
  return res;
}
// Costo con el descuento de distribuidor. Si hay oferta, el descuento se aplica sobre el precio de oferta.
function ex_provCosto_(x, p) {
  const d = ((p && +p.desc) || 30) / 100, costo = Math.round(x.precio * (1 - d)), costoNormal = Math.round(x.normal * (1 - d));
  return Object.assign({}, x, { proveedor: p ? p.nombre : x.prov, desc: Math.round(d * 100), costo: costo, costoNormal: costoNormal, margenOferta: x.normal ? Math.round((1 - costo / x.normal) * 100) : null, ahorro: costoNormal - costo });
}
// Oportunidades de compra: productos en oferta en la web del proveedor que convienen para vender a precio normal.
function ex_provOportunidades_(max) {
  const C = ex_provCatalogo_(), conf = {}, hoy = ex_hoyYmd_(); ex_proveedoresConf_().forEach(function (p) { conf[p.id] = p; });
  let bsale = ''; try { if (ex_bsaleToken_()) bsale = ' ' + ex_bsaleCatalogo_().map(function (v) { return ex_norm_(v.producto); }).join(' ') + ' '; } catch (e) {}
  let ints = ''; try { ints = ex_perfilesLista_().map(function (pf) { return ex_norm_(((pf.p && pf.p.intereses) || []).join(' ')); }).join(' | '); } catch (e) {}
  const dias = function (s) { return s ? Math.round((Date.parse(hoy) - Date.parse(s.slice(0, 10))) / 86400000) : 999; };
  // Fuera precios de prueba ($1.000) o rebajas de más de 70 %, que suelen ser errores o repuestos sueltos.
  const L = C.filter(function (x) { return x.precio >= 5000 && x.normal > x.precio * 1.03 && x.precio >= x.normal * 0.3; }).map(function (x) {
    const o = ex_provCosto_(x, conf[x.prov]), ws = ex_norm_(x.nombre).split(/[^a-z0-9]+/).filter(function (w) { return w.length >= 4 && !/^(negro|black|blanco|white|talla|unisex|hombre|mujer|bicicleta)$/.test(w); }).slice(0, 4);
    const vende = bsale && ws.length && ws.filter(function (w) { return bsale.indexOf(' ' + w) >= 0; }).length >= Math.min(2, ws.length);
    const piden = ints && ws.some(function (w) { return ints.indexOf(w) >= 0; });
    const nuevo = dias(x.desde) <= 150, extra = o.margenOferta - o.desc;
    o.vende = !!vende; o.piden = !!piden; o.nuevo = nuevo; o.diasOferta = x.ofertaDesde ? dias(x.ofertaDesde) : null; o.extra = extra;
    o.puntaje = extra * (1 + (vende ? 1 : 0) + (piden ? 0.8 : 0) + (nuevo ? 0.6 : 0) + (x.prov === 'garmin' ? 0.5 : 0)) + Math.min(10, o.ahorro / 20000) - (/No/.test(x.disp) ? 30 : 0);
    return o;
  }).filter(function (o) { return o.extra >= 5; }).sort(function (a, b) { return b.puntaje - a.puntaje; });
  return L.slice(0, max || 60);
}
const EX_RE_PROMO = /promo|oferta|descuento|dcto|liquidaci|precio especial|black ?friday|cyber|sale\b|rebaja|outlet|lanzamiento|nuevo|novedad|preventa|llegada|arribo|stock|disponib|lista de precio/i;
function ex_provCorreos_(forzar) {
  const cache = CacheService.getScriptCache(), c = !forzar && cache.get('provCorreos');
  if (c) return JSON.parse(c);
  const P = ex_proveedoresConf_(), tz = ex_tz_(), out = [];
  const dom = {}; P.forEach(function (p) { (p.dominios || []).forEach(function (d) { dom[d] = p; }); });
  const q = 'from:(' + Object.keys(dom).join(' OR ') + ') newer_than:30d';
  try {
    GmailApp.search(q, 0, 60).forEach(function (th) {
      const m = th.getMessages().pop(), de = String(m.getFrom()), d = (/@([a-z0-9.-]+)/i.exec(de) || [])[1] || '';
      const p = dom[Object.keys(dom).filter(function (k) { return d.toLowerCase().indexOf(k) >= 0; })[0]];
      const asunto = th.getFirstMessageSubject() || '', cuerpo = String(m.getPlainBody() || '').replace(/\s+/g, ' ');
      out.push({ proveedor: p ? p.nombre : d, id: p ? p.id : '', asunto: asunto, fecha: Utilities.formatDate(m.getDate(), tz, 'yyyy-MM-dd'), resumen: cuerpo.slice(0, 220), promo: EX_RE_PROMO.test(asunto + ' ' + cuerpo.slice(0, 600)), link: 'https://mail.google.com/mail/u/0/#all/' + th.getId() });
    });
  } catch (e) { return { error: e.message, items: [] }; }
  const r = { items: out, fecha: new Date().toISOString() };
  try { cache.put('provCorreos', JSON.stringify(r).slice(0, 95000), 6 * 3600); } catch (e) {}
  return r;
}
function ex_provMovimientos_(dias) {
  const sh = SpreadsheetApp.getActive().getSheetByName(EX_HOJA_PROVM); if (!sh || sh.getLastRow() < 2) return [];
  const desde = Date.now() - (dias || 14) * 86400000, tz = ex_tz_(), n = Math.min(2000, sh.getLastRow() - 1);
  return sh.getRange(sh.getLastRow() - n + 1, 1, n, EX_CAB_PROVM.length).getValues().filter(function (r) { return r[0] instanceof Date && r[0].getTime() >= desde; })
    .map(function (r) { return { fecha: Utilities.formatDate(r[0], tz, 'yyyy-MM-dd'), prov: String(r[1]), id: String(r[2]), producto: String(r[3]), tipo: String(r[4]), antes: +r[5] || 0, despues: +r[6] || 0 }; }).reverse();
}
function ex_proveedores_(p) {
  const a = p.accion || 'resumen', pr = PropertiesService.getScriptProperties();
  if (a === 'guardar') {
    const g = JSON.parse(pr.getProperty('PROVEEDORES') || '{}'), x = p.proveedor || {};
    if (!EX_PROV_BASE.some(function (b) { return b.id === x.id; })) throw new Error('proveedor desconocido');
    g[x.id] = Object.assign(g[x.id] || {}, { desc: Math.max(0, Math.min(70, +x.desc || 0)), marcas: String(x.marcas || '').slice(0, 200), notas: String(x.notas || '').slice(0, 500), dominios: String(x.dominios || '').split(/[\s,;]+/).filter(String).slice(0, 6) });
    pr.setProperty('PROVEEDORES', JSON.stringify(g));
  }
  if (a === 'sinc') { const r = ex_provSinc_(String(p.id)); if (p.id === 'mkr') ex_provDetalleMkr_(80); return Object.assign({ ok: true }, r); }
  if (a === 'buscar') return { ok: true, items: ex_provBuscar_(String(p.q || ''), 25) };
  const est = JSON.parse(pr.getProperty('PROV_SINC') || '{}'), C = ex_provCatalogo_(), por = {};
  C.forEach(function (x) { const s = por[x.prov] = por[x.prov] || { productos: 0, ofertas: 0 }; s.productos++; if (x.normal > x.precio) s.ofertas++; });
  let contactos = []; try { contactos = (ex_leerBase_().contactos || []).filter(function (c) { return c.tipo === 'Proveedor'; }); } catch (e) {}
  const lista = ex_proveedoresConf_().map(function (x) {
    const s = por[x.id] || { productos: 0, ofertas: 0 };
    if (x.tipo === 'specialized') { try { const z = ex_spzResumen_(); s.productos = z.productos || 0; s.ofertas = (z.ofertas || []).length; } catch (e) {} }
    return Object.assign({}, x, s, { sinc: est[x.id] || null, contactos: contactos.filter(function (c) { return (x.dominios || []).some(function (d) { return String(c.email || '').toLowerCase().indexOf(d) >= 0; }); }).map(function (c) { return { id: c.id, nombre: c.nombre, email: c.email }; }) });
  });
  return { ok: true, proveedores: lista, oportunidades: ex_provOportunidades_(60), correos: ex_provCorreos_(!!p.forzar), movimientos: ex_provMovimientos_(14).slice(0, 80), total: C.length };
}

/* ---------- Specialized Chile (web pública): catálogo, stock por talla, lanzamientos, productos calientes ---------- */
// Lee specialized.com/cl igual que un navegador: solo mira, no compra nada. El stock es el de la bodega de
// Specialized Chile que muestra la web; cuando baja, alguien compró (en la web o una tienda lo pidió).
const EX_SPZ = 'https://www.specialized.com';
const EX_SPZ_CATS = [
  ['/cl/es/shop/bicicletas/bicicletas-electricas', 'E-bikes'],
  ['/cl/es/shop/bicicletas/bicicletas-de-montana', 'Montaña'],
  ['/cl/es/shop/bicicletas/bicicletas-de-ruta', 'Ruta'],
  ['/cl/es/shop/bicicletas/bicis-de-gravel', 'Gravel'],
  ['/cl/es/shop/bicicletas/bicicletas-de-ciudad', 'Ciudad'],
  ['/cl/es/shop/bicicletas/bicicletas-para-ninos', 'Niños'],
  ['/cl/es/shop/equipamiento-para-ciclismo/accesorios/cascos-para-bici', 'Cascos'],
  ['/cl/es/shop/ropa-de-ciclismo/zapatillas-de-ciclismo', 'Zapatillas'],
  ['/cl/es/shop/equipamiento-para-ciclismo/accesorios/accesorios-para-bicis-electricas', 'Accesorios e-bike'],
  ['/cl/es/shop/ropa-de-ciclismo', 'Ropa'],
  ['/cl/es/shop/equipamiento-para-ciclismo', 'Equipamiento'],
  ['/cl/es/shop/ofertas', 'Ofertas']
];
const EX_SPZ_BICIS = ['E-bikes', 'Montaña', 'Ruta', 'Gravel', 'Ciudad', 'Niños'];
const EX_HOJA_SPZ = 'Specialized', EX_HOJA_SPZS = 'Specialized stock', EX_HOJA_SPZM = 'Specialized movimientos';
const EX_CAB_SPZ = ['ID', 'Producto', 'Familia', 'Año', 'Categoría', 'Disciplina', 'Precio', 'Precio oferta', 'Etiqueta', 'Colores', 'Color más nuevo', 'URL', 'Imagen', 'Visto desde', 'Visto', 'Stock total', 'Stock revisado', 'Bajas 14 días', 'Tallas con stock', 'Datos'];
const EX_CAB_SPZS = ['SKU', 'ID', 'Producto', 'Color', 'Talla', 'Stock', 'Estado', 'Precio', 'Precio oferta', 'Revisado'];
const EX_CAB_SPZM = ['Fecha', 'Tipo', 'SKU', 'ID', 'Producto', 'Color', 'Talla', 'Cambio', 'Stock / precio'];
const EX_SPZ_POR_RONDA = 24;   // fichas de producto revisadas por hora (stock por talla)

// Los datos vienen dentro de la página (Next.js): se juntan los trozos y se extrae el JSON que interesa.
function ex_rsc_(html) {
  const re = /self\.__next_f\.push\(\[1,"((?:[^"\\]|\\.)*)"\]\)/g, out = []; let m;
  while ((m = re.exec(html))) { try { out.push(JSON.parse('"' + m[1] + '"')); } catch (e) {} }
  return out.join('');
}
function ex_jsonEn_(txt, desde) {
  if (desde < 0 || (txt[desde] !== '[' && txt[desde] !== '{')) return null;
  let d = 0, s = false, esc = false;
  for (let i = desde; i < txt.length; i++) {
    const c = txt[i];
    if (s) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === '"') s = false; continue; }
    if (c === '"') s = true;
    else if (c === '[' || c === '{') d++;
    else if (c === ']' || c === '}') { d--; if (d === 0) { try { return JSON.parse(txt.slice(desde, i + 1)); } catch (e) { return null; } } }
  }
  return null;
}
function ex_spzPedir_(rutas) {
  const out = [];
  for (let i = 0; i < rutas.length; i += 6) {
    const rs = UrlFetchApp.fetchAll(rutas.slice(i, i + 6).map(function (r) { return { url: EX_SPZ + r, muteHttpExceptions: true, followRedirects: true, headers: { 'Accept-Language': 'es-CL,es;q=0.9' } }; }));
    rs.forEach(function (r) { out.push(r.getResponseCode() === 200 ? r.getContentText() : { error: r.getResponseCode() }); });
  }
  return out;
}
function ex_spzItem_(x, cat) {
  const sw = x.swatchesJSON || [], pr = sw.map(function (s) { return s.colorPrices || {}; });
  const precios = pr.map(function (p) { return +p.minPrice || 0; }).filter(Boolean), ofertas = pr.map(function (p) { return +p.minDiscountPrice || 0; }).filter(Boolean);
  const lista = String((x.productData && x.productData.list) || '').split('|').filter(String);
  return {
    id: String(x.uid), nombre: String(x.name || ''), familia: lista.length ? lista[lista.length - 1] : '', anio: String(x.modelYear || ''),
    categoria: lista.slice(0, -1).join(' › '), disciplina: cat, precio: precios.length ? Math.min.apply(null, precios) : '',
    oferta: ofertas.length ? Math.min.apply(null, ofertas) : '', etiqueta: [x.primaryBadge].concat(x.secondaryBadges || []).filter(Boolean).join(', '),
    colores: sw.length, nuevo: sw.map(function (s) { return String(s.onlinefrom || '').slice(0, 10); }).sort().pop() || '',
    url: EX_SPZ + String(x.url || ''), img: String(x.imageUrl || ''), bici: !!x.isBike
  };
}
function ex_spzMov_(filas, tipo, sku, id, prod, color, talla, cambio, valor) {
  filas.push([new Date(), tipo, sku || '', id || '', prod || '', color || '', talla || '', cambio, valor]);
}
function ex_spzGuardarMov_(filas) {
  if (!filas.length) return;
  const sh = ex_hojaCab_(EX_HOJA_SPZM, EX_CAB_SPZM);
  sh.getRange(sh.getLastRow() + 1, 1, filas.length, EX_CAB_SPZM.length).setValues(filas);
  const n = sh.getLastRow() - 1;
  if (n > 6000) sh.deleteRows(2, n - 5000);   // se guardan los últimos ~5.000 movimientos
}

// Catálogo completo (una vez al día): precios, ofertas, etiquetas (nuevo, más vendido, galardonado) y colores.
function ex_spzSinc_() {
  const pr = PropertiesService.getScriptProperties(), html = ex_spzPedir_(EX_SPZ_CATS.map(function (c) { return c[0]; }));
  const vistos = {}, orden = [], errores = [];
  html.forEach(function (h, k) {
    const cat = EX_SPZ_CATS[k][1];
    if (typeof h !== 'string') { errores.push(cat + ' (' + h.error + ')'); return; }
    const t = ex_rsc_(h), L = ex_jsonEn_(t, t.indexOf('"results":[') + 10);
    if (!L) { errores.push(cat + ' (sin datos)'); return; }
    L.forEach(function (x) {
      const it = ex_spzItem_(x, cat);
      if (vistos[it.id]) { if (it.oferta && !vistos[it.id].oferta) vistos[it.id].oferta = it.oferta; return; }
      vistos[it.id] = it; orden.push(it.id);
    });
  });
  if (!orden.length) throw new Error('Specialized no entregó productos: ' + errores.join(', '));
  const sh = ex_hojaCab_(EX_HOJA_SPZ, EX_CAB_SPZ), n = sh.getLastRow() - 1;
  const filas = n > 0 ? sh.getRange(2, 1, n, EX_CAB_SPZ.length).getValues() : [], idx = {}, primera = !filas.length;
  filas.forEach(function (r, i) { idx[String(r[0])] = i; });
  const hoy = ex_hoyYmd_(), mov = [], nuevos = [];
  orden.forEach(function (id) {
    const it = vistos[id], i = idx[id], ant = i === undefined ? null : filas[i];
    const fila = [id, it.nombre, it.familia, it.anio, it.categoria, it.disciplina, it.precio, it.oferta, it.etiqueta, it.colores, it.nuevo, it.url, it.img, hoy, hoy, '', '', '', '', JSON.stringify({ bici: it.bici })];
    if (ant) {
      fila[13] = ant[13] instanceof Date ? ex_ymd_(ant[13]) : (ant[13] || hoy);
      if (EX_SPZ_BICIS.indexOf(ant[5]) >= 0 && EX_SPZ_BICIS.indexOf(it.disciplina) < 0) fila[5] = ant[5];
      for (let k = 15; k <= 18; k++) fila[k] = ant[k];
      if (+it.oferta && !+ant[7]) ex_spzMov_(mov, 'oferta', '', id, it.nombre, '', '', +it.oferta - (+it.precio || 0), it.oferta);
      else if (!+it.oferta && +ant[7]) ex_spzMov_(mov, 'fin oferta', '', id, it.nombre, '', '', 0, it.precio);
      else if (+it.precio && +ant[6] && +it.precio !== +ant[6]) ex_spzMov_(mov, 'precio', '', id, it.nombre, '', '', +it.precio - +ant[6], it.precio);
      if (it.nuevo && String(ant[10] instanceof Date ? ex_ymd_(ant[10]) : ant[10]) < it.nuevo) ex_spzMov_(mov, 'color nuevo', '', id, it.nombre, '', '', 0, it.nuevo);
      filas[i] = fila;
    } else {
      filas.push(fila); nuevos.push(it.nombre);
      if (!primera) ex_spzMov_(mov, 'nuevo', '', id, it.nombre, '', '', 0, it.precio);
    }
  });
  sh.getRange(2, 1, filas.length, EX_CAB_SPZ.length).setValues(filas); _exSpzCat = null;
  ex_spzGuardarMov_(mov);
  let home = [];
  try { home = ex_spzHome_(); } catch (e) { errores.push('portada: ' + e.message); }
  pr.setProperty('SPZ_SINC', JSON.stringify({ fecha: new Date().toISOString(), productos: orden.length, errores: errores, nuevos: primera ? [] : nuevos.slice(0, 30), lanzamientos: home }));
  return { ok: true, productos: orden.length, errores: errores };
}

// Portada: campañas y lanzamientos destacados.
function ex_spzHome_() {
  const h = ex_spzPedir_(['/cl/es'])[0];
  if (typeof h !== 'string') throw new Error('respondió ' + h.error);
  const tit = []; let m; const re = /<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/g;
  while ((m = re.exec(h))) { const t = m[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").trim(); if (t && t.length < 90) tit.push(t); }
  const i = tit.indexOf('Lanzamientos'), fin = tit.indexOf('Comprar Bicicletas');
  const lanz = (i >= 0 ? tit.slice(i + 1, fin > i ? fin : i + 16) : tit.slice(0, 14)).filter(function (t, k, a) { return t !== 'Lanzamientos' && a.indexOf(t) === k; });
  return [tit[0]].concat(lanz).filter(function (t, k, a) { return t && a.indexOf(t) === k && !/^(soporte|recursos|acerca de|newsletter|compra online)$/i.test(t); }).slice(0, 16);
}

// Ficha de producto: stock por color y talla (con SKU) desde la web de Specialized Chile.
function ex_spzFichaHtml_(id, h) {
  const t = ex_rsc_(h), dyn = ex_jsonEn_(t, t.indexOf('"dynamicData":{') + 14) || {};
  const m = new RegExp('"colors":\\[\\{"code":"\\d+-' + id + '","display').exec(t);
  const colores = m ? (ex_jsonEn_(t, m.index + 9) || []) : [], info = {};
  colores.forEach(function (c) {
    (c.sizes || []).forEach(function (s) {
      ((s.skus && s.skus.values) || []).forEach(function (v) {
        const p = v.prices || {};
        info[v.sku] = { color: String(c.displayName || c.colorName || ''), talla: String(v.size || s.name || ''), precio: p.regular ? p.regular.raw : '', oferta: p.special ? p.special.raw : '' };
      });
    });
  });
  if (!Object.keys(info).length) { const re = /"size":"([^"]+)","sku":"([\w-]+)"/g; let x; while ((x = re.exec(t))) if (!info[x[2]]) info[x[2]] = { color: '', talla: x[1], precio: '', oferta: '' }; }
  const out = [];
  (dyn.colors || []).forEach(function (c) {
    (c.sizes || []).forEach(function (s) {
      const st = s.stock || {}, i = info[s.sku] || {};
      out.push({ sku: String(s.sku), color: i.color || '', talla: i.talla || '', stock: +st.stockLevel || 0, redondeado: !!st.isValueRounded, estado: String(s.availability || st.stockLevelStatus || ''), entrante: !!s.inboundInventory, precio: i.precio, oferta: i.oferta });
    });
  });
  return out;
}

// Revisa fichas por turno: las e-bikes cada ~3 horas, el resto de las bicis cada ~12 horas.
function ex_spzRondaStock_(max, soloIds) {
  const sh = ex_hojaCab_(EX_HOJA_SPZ, EX_CAB_SPZ), n = sh.getLastRow() - 1;
  if (n < 1) return { ok: true, revisados: 0 };
  const cat = sh.getRange(2, 1, n, EX_CAB_SPZ.length).getValues(), ahora = Date.now();
  const toca = cat.map(function (r, i) {
    const bici = EX_SPZ_BICIS.indexOf(r[5]) >= 0 || /"bici":true/.test(String(r[19]));
    if (soloIds) return soloIds.indexOf(String(r[0])) >= 0 ? { i: i, atraso: 1 } : null;
    if (!bici) return null;
    const rev = r[16] instanceof Date ? r[16].getTime() : 0, cada = (r[5] === 'E-bikes' ? 3 : 12) * 3600000;
    return ahora - rev >= cada ? { i: i, atraso: (ahora - rev) / cada } : null;
  }).filter(Boolean).sort(function (a, b) { return b.atraso - a.atraso; }).slice(0, max || EX_SPZ_POR_RONDA);
  if (!toca.length) return { ok: true, revisados: 0 };
  const html = ex_spzPedir_(toca.map(function (x) { return '/cl/es/p/' + cat[x.i][0]; }));
  const shs = ex_hojaCab_(EX_HOJA_SPZS, EX_CAB_SPZS), ns = shs.getLastRow() - 1;
  const stock = ns > 0 ? shs.getRange(2, 1, ns, EX_CAB_SPZS.length).getValues() : [], porSku = {};
  stock.forEach(function (r, i) { porSku[String(r[0])] = i; });
  const mov = [], fichas = {};
  toca.forEach(function (x, k) {
    const r = cat[x.i], id = String(r[0]), h = html[k];
    if (typeof h !== 'string') return;
    const tallas = ex_spzFichaHtml_(id, h); if (!tallas.length) return;
    fichas[id] = tallas;
    let total = 0; const con = [];
    tallas.forEach(function (t) {
      total += t.stock; if (t.stock > 0) con.push(t.talla + (t.color ? ' ' + t.color.split(/[\/,]/)[0].trim() : '') + ' (' + t.stock + (t.redondeado ? '+' : '') + ')');
      const fila = [t.sku, id, r[1], t.color, t.talla, t.stock, t.estado + (t.entrante ? ' · en tránsito' : ''), t.precio, t.oferta, new Date()];
      const j = porSku[t.sku];
      if (j === undefined) { porSku[t.sku] = stock.length; stock.push(fila); return; }
      const ant = stock[j], prev = ant[5] === '' ? null : +ant[5];
      if (prev !== null && !(t.redondeado && /\+/.test(String(ant[6])))) {
        if (t.stock < prev) ex_spzMov_(mov, 'venta', t.sku, id, r[1], t.color, t.talla, t.stock - prev, t.stock);
        else if (t.stock > prev) ex_spzMov_(mov, 'reposición', t.sku, id, r[1], t.color, t.talla, t.stock - prev, t.stock);
      }
      if (t.redondeado) fila[6] += ' +';
      stock[j] = fila;
    });
    r[15] = total; r[16] = new Date(); r[18] = con.join(', ');
  });
  if (stock.length) shs.getRange(2, 1, stock.length, EX_CAB_SPZS.length).setValues(stock);
  ex_spzGuardarMov_(mov);
  // Bajas de los últimos 14 días por producto: la señal de "lo que se está vendiendo" en Chile.
  const bajas = ex_spzBajas_(14);
  cat.forEach(function (r) { r[17] = bajas[String(r[0])] || ''; });
  _exSpzCat = null;
  sh.getRange(2, 16, cat.length, 4).setValues(cat.map(function (r) { return [r[15], r[16], r[17], r[18]]; }));
  return { ok: true, revisados: Object.keys(fichas).length, movimientos: mov.length, fichas: fichas };
}
function ex_spzBajas_(dias) {
  const sh = SpreadsheetApp.getActive().getSheetByName(EX_HOJA_SPZM); if (!sh || sh.getLastRow() < 2) return {};
  const desde = Date.now() - dias * 86400000, out = {};
  sh.getRange(2, 1, sh.getLastRow() - 1, 8).getValues().forEach(function (r) {
    if (r[1] === 'venta' && r[0] instanceof Date && r[0].getTime() >= desde) out[String(r[3])] = (out[String(r[3])] || 0) - (+r[7] || 0);
  });
  return out;
}
function ex_spzCatalogo_() {
  if (_exSpzCat) return _exSpzCat;
  const sh = SpreadsheetApp.getActive().getSheetByName(EX_HOJA_SPZ); if (!sh || sh.getLastRow() < 2) return [];
  const tz = ex_tz_(), f = function (d) { return d instanceof Date ? ex_ymd_(d, tz) : String(d || ''); };
  return (_exSpzCat = sh.getRange(2, 1, sh.getLastRow() - 1, EX_CAB_SPZ.length).getValues().filter(function (r) { return r[0]; }).map(function (r) {
    return { id: String(r[0]), nombre: String(r[1]), familia: String(r[2]), anio: String(r[3]), categoria: String(r[4]), disciplina: String(r[5]), precio: +r[6] || 0, oferta: +r[7] || 0, etiqueta: String(r[8]), colores: +r[9] || 0, colorNuevo: f(r[10]), url: String(r[11]), img: String(r[12]), desde: f(r[13]), visto: f(r[14]), stock: r[15] === '' ? null : +r[15], revisado: r[16] instanceof Date ? r[16].toISOString() : '', bajas14: +r[17] || 0, tallas: String(r[18] || '') };
  }));
}
function ex_spzMovimientos_(dias) {
  const sh = SpreadsheetApp.getActive().getSheetByName(EX_HOJA_SPZM); if (!sh || sh.getLastRow() < 2) return [];
  const desde = Date.now() - (dias || 14) * 86400000, tz = ex_tz_();
  return sh.getRange(Math.max(2, sh.getLastRow() - 1500), 1, Math.min(1500, sh.getLastRow() - 1), EX_CAB_SPZM.length).getValues()
    .filter(function (r) { return r[0] instanceof Date && r[0].getTime() >= desde; })
    .map(function (r) { return { fecha: Utilities.formatDate(r[0], tz, 'yyyy-MM-dd HH:mm'), tipo: r[1], sku: String(r[2]), id: String(r[3]), producto: String(r[4]), color: String(r[5]), talla: String(r[6]), cambio: +r[7] || 0, valor: r[8] }; }).reverse();
}
// Resumen para la app y los agentes: lo caliente, ofertas, novedades, poco stock y lanzamientos.
function ex_spzResumen_() {
  const pr = PropertiesService.getScriptProperties(), sinc = JSON.parse(pr.getProperty('SPZ_SINC') || 'null');
  const C = ex_spzCatalogo_(); if (!C.length) return { activo: false, sinc: sinc };
  const hoy = ex_hoyYmd_(), dias = function (s) { return s ? Math.round((Date.parse(hoy) - Date.parse(s.slice(0, 10))) / 86400000) : 999; };
  const bici = function (x) { return EX_SPZ_BICIS.indexOf(x.disciplina) >= 0; };
  const unico = function (L) { const v = {}; return L.filter(function (x) { if (v[x.nombre]) return false; v[x.nombre] = 1; return true; }); };
  const corto = function (x) { return { id: x.id, nombre: x.nombre, familia: x.familia, disciplina: x.disciplina, precio: x.precio, oferta: x.oferta, stock: x.stock, tallas: x.tallas, bajas14: x.bajas14, etiqueta: x.etiqueta, url: x.url, img: x.img, colorNuevo: x.colorNuevo, desde: x.desde }; };
  return {
    activo: true, sinc: sinc, productos: C.length, bicis: C.filter(bici).length,
    calientes: unico(C.filter(function (x) { return x.bajas14 > 0; }).sort(function (a, b) { return b.bajas14 - a.bajas14; })).slice(0, 15).map(corto),
    masVendidos: unico(C.filter(function (x) { return /bestseller/.test(x.etiqueta); })).slice(0, 15).map(corto),
    ofertas: unico(C.filter(function (x) { return x.oferta && x.precio; }).sort(function (a, b) { return (bici(b) - bici(a)) || ((b.disciplina === 'E-bikes') - (a.disciplina === 'E-bikes')) || ((1 - b.oferta / b.precio) - (1 - a.oferta / a.precio)); })).slice(0, 20).map(corto),
    nuevos: unico(C.filter(function (x) { return /new/.test(x.etiqueta) || dias(x.desde) <= 21 || dias(x.colorNuevo) <= 30; }).sort(function (a, b) { return (b.colorNuevo || '').localeCompare(a.colorNuevo || ''); })).slice(0, 15).map(corto),
    pocoStock: unico(C.filter(function (x) { return bici(x) && x.stock !== null && x.stock > 0 && x.stock <= 3; }).sort(function (a, b) { return (b.disciplina === 'E-bikes') - (a.disciplina === 'E-bikes') || a.stock - b.stock; })).slice(0, 15).map(corto),
    agotadas: C.filter(function (x) { return bici(x) && x.stock === 0; }).length,
    movimientos: ex_spzMovimientos_(7).slice(0, 40),
    lanzamientos: (sinc && sinc.lanzamientos) || []
  };
}
// Búsqueda por nombre, familia o SKU (ej.: "levo s4", "95227-6001", "kenevo sl comp").
function ex_spzBuscar_(q, max) {
  const C = ex_spzCatalogo_(), qq = ex_norm_(q).trim(); if (!qq) return [];
  const sku = qq.match(/\b\d{5}-\d{2,6}\b/);
  let ids = null;
  if (sku) {
    const sh = SpreadsheetApp.getActive().getSheetByName(EX_HOJA_SPZS);
    if (sh && sh.getLastRow() > 1) ids = sh.getRange(2, 1, sh.getLastRow() - 1, 2).getValues().filter(function (r) { return String(r[0]).indexOf(sku[0]) === 0 || sku[0].indexOf(String(r[0]).slice(0, 8)) === 0; }).map(function (r) { return String(r[1]); });
  }
  const tk = qq.replace(/\b\d{5}-\d{2,6}\b/, '').split(/[^a-z0-9]+/).filter(function (w) { return w.length >= 2; });
  // Cada palabra pesa según qué tan rara es en el catálogo: "kenevo" pesa mucho más que "comp" o "sl".
  // Specialized no escribe "Carbon" en los modelos de carbono (solo "Alloy" en los de aluminio): se agrega para poder buscarlo.
  const textos = C.map(function (x) { const t = ex_norm_(x.nombre + ' ' + x.familia + ' ' + x.disciplina + ' ' + x.categoria + ' ' + x.anio + ' ' + x.tallas); return ' ' + (t + (/alloy|aluminio/.test(t) ? ' aluminio' : ' carbon carbono')).replace(/[^a-z0-9]+/g, ' ') + ' '; });
  const peso = {}; tk.forEach(function (w) { const df = textos.filter(function (t) { return t.indexOf(' ' + w) >= 0; }).length; peso[w] = df ? Math.log(1 + C.length / df) : 0; });
  const total = tk.reduce(function (s, w) { return s + peso[w]; }, 0);
  const puntaje = function (min) { return C.map(function (x, i) {
    if (ids && ids.indexOf(x.id) >= 0) return { x: x, p: 100 };
    const p = tk.reduce(function (s, w) { return s + (textos[i].indexOf(' ' + w) >= 0 ? peso[w] : 0); }, 0);
    // Palabras del modelo que no pediste (ej. "EVO", "SL", "Alloy") bajan el puntaje: así gana el modelo exacto.
    const extra = ex_norm_(x.nombre).split(/[^a-z0-9]+/).filter(function (w) { return w.length >= 2 && tk.indexOf(w) < 0 && !/^(turbo|specialized|carbon)$/.test(w) && !/^\d+$/.test(w); }).length;
    return { x: x, p: total && p >= total * min ? p + (x.disciplina === 'E-bikes' ? 0.3 : 0) - extra * 0.4 - x.nombre.length / 1000 : 0 };
  }).filter(function (o) { return o.p > 0; }); };
  let res = puntaje(0.7); if (!res.length) res = puntaje(0.5);
  return res.sort(function (a, b) { return b.p - a.p; }).slice(0, max || 10).map(function (o) { return o.x; });
}
function ex_spzTallas_(id) {
  const sh = SpreadsheetApp.getActive().getSheetByName(EX_HOJA_SPZS); if (!sh || sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, EX_CAB_SPZS.length).getValues().filter(function (r) { return String(r[1]) === id; })
    .map(function (r) { return { sku: String(r[0]), color: String(r[3]), talla: String(r[4]), stock: +r[5] || 0, estado: String(r[6]), precio: +r[7] || 0, oferta: +r[8] || 0 }; });
}
function ex_specialized_(p) {
  const a = p.accion || 'resumen';
  if (a === 'resumen') return Object.assign({ ok: true }, ex_spzResumen_());
  if (a === 'buscar') return { ok: true, items: ex_spzBuscar_(p.q, 12).map(function (x) { return Object.assign(x, { detalle: ex_spzTallas_(x.id) }); }) };
  if (a === 'ficha') { const r = ex_spzRondaStock_(1, [String(p.id)]); return { ok: true, tallas: (r.fichas && r.fichas[String(p.id)]) || ex_spzTallas_(String(p.id)), producto: ex_spzCatalogo_().filter(function (x) { return x.id === String(p.id); })[0] || null }; }
  if (a === 'sinc') { const s = ex_spzSinc_(); const r = ex_spzRondaStock_(EX_SPZ_POR_RONDA); return { ok: true, productos: s.productos, revisados: r.revisados, errores: s.errores }; }
  return { ok: false, error: 'acción desconocida' };
}
function ex_spzRonda_() {
  const s = JSON.parse(PropertiesService.getScriptProperties().getProperty('SPZ_SINC') || 'null');
  if (!s || Date.now() - Date.parse(s.fecha) > 20 * 3600000) ex_spzSinc_();
  ex_spzRondaStock_(EX_SPZ_POR_RONDA);
}

/* ---------- clima de Puerto Varas (Open-Meteo, gratis y sin clave) ---------- */
const EX_CLIMA_LAT = -41.3195, EX_CLIMA_LON = -72.9854;
function ex_clima_() {
  const cache = CacheService.getScriptCache(), c = cache.get('clima');
  if (c) return JSON.parse(c);
  const pr = PropertiesService.getScriptProperties(), lat = pr.getProperty('CLIMA_LAT') || EX_CLIMA_LAT, lon = pr.getProperty('CLIMA_LON') || EX_CLIMA_LON;
  const url = 'https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lon +
    '&current=temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_gusts_10m' +
    '&hourly=temperature_2m,precipitation_probability,precipitation,weather_code,wind_speed_10m' +
    '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max,sunrise,sunset' +
    '&timezone=America%2FSantiago&forecast_days=7';
  const r = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  if (r.getResponseCode() !== 200) throw new Error('Open-Meteo respondió ' + r.getResponseCode());
  const j = JSON.parse(r.getContentText());
  try { cache.put('clima', JSON.stringify(j), 3600); } catch (e) {}
  return j;
}
const EX_WMO = { 0: 'despejado', 1: 'mayormente despejado', 2: 'parcial nublado', 3: 'nublado', 45: 'niebla', 48: 'niebla', 51: 'llovizna', 53: 'llovizna', 55: 'llovizna intensa', 61: 'lluvia débil', 63: 'lluvia', 65: 'lluvia fuerte', 66: 'lluvia helada', 67: 'lluvia helada', 71: 'nieve', 73: 'nieve', 75: 'nieve fuerte', 80: 'chubascos', 81: 'chubascos', 82: 'chubascos fuertes', 95: 'tormenta', 96: 'tormenta con granizo', 99: 'tormenta con granizo' };
function ex_climaTexto_(j) {
  if (!j || !j.daily) return 'sin datos de clima';
  const d = j.daily, c = j.current || {}, out = ['Ahora: ' + Math.round(c.temperature_2m) + '°C, ' + (EX_WMO[c.weather_code] || '') + ', viento ' + Math.round(c.wind_speed_10m) + ' km/h.'];
  d.time.forEach(function (t, i) {
    out.push(t + ': ' + (EX_WMO[d.weather_code[i]] || '') + ', ' + Math.round(d.temperature_2m_min[i]) + '–' + Math.round(d.temperature_2m_max[i]) + '°C, lluvia ' + (d.precipitation_probability_max[i] || 0) + '% (' + (Math.round(d.precipitation_sum[i] * 10) / 10) + ' mm), viento máx ' + Math.round(d.wind_speed_10m_max[i]) + ' km/h');
  });
  return out.join('\n');
}

/* ---------- noticias del mundo bike: Pinkbike, Vital MTB, Specialized y ciclismo en Chile ---------- */
const EX_NOT_FUENTES = [
  ['Pinkbike', 'https://www.pinkbike.com/pinkbike_xml_feed.php'],
  ['Vital MTB', 'https://feeds.feedburner.com/vitalmtb'],
  ['Specialized en la prensa', 'https://news.google.com/rss/search?q=%22Specialized%22+(bike+OR+bicicleta+OR+e-bike+OR+Levo+OR+Tarmac)+when:14d&hl=es-419&gl=CL&ceid=CL:es-419'],
  ['Ciclismo en Chile', 'https://news.google.com/rss/search?q=(mountain+bike+OR+ciclismo+OR+e-bike)+(Chile+OR+%22Puerto+Varas%22+OR+Llanquihue)+when:14d&hl=es-419&gl=CL&ceid=CL:es-419']
];
function ex_rssItems_(xml, fuente) {
  const items = [], re = /<item[\s>]([\s\S]*?)<\/item>/g; let m;
  const tag = function (s, t) { const x = new RegExp('<' + t + '[^>]*>([\\s\\S]*?)<\\/' + t + '>').exec(s); return x ? x[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim() : ''; };
  const limpio = function (s) { return s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/<[^>]+>/g, ' ').replace(/&#0?39;|&#x27;/g, "'").replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim(); };
  while ((m = re.exec(xml)) && items.length < 25) {
    const s = m[1], desc = tag(s, 'description'), img = /<img[^>]+src="([^"]+)"/.exec(desc.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"'));
    const fecha = Date.parse(tag(s, 'pubDate'));
    items.push({ fuente: fuente, titulo: limpio(tag(s, 'title')), link: limpio(tag(s, 'link')), fecha: isNaN(fecha) ? '' : new Date(fecha).toISOString(), resumen: limpio(desc).slice(0, 240), img: img ? img[1] : '' });
  }
  return items;
}
const EX_NOT_SISTEMA = 'Eres el editor de noticias de una tienda Specialized en Puerto Varas, Chile (Blackline). Su fuerte son las e-bikes (Turbo Levo, Levo SL, Kenevo, Vado, Como, Creo) y también venden MTB, ruta, gravel, urbano, niños, ropa y accesorios; tienen taller. De la lista de titulares, elige como máximo 6 que de verdad le sirvan al encargado de la tienda para vender, asesorar o crear contenido: lanzamientos y novedades de Specialized (prioridad máxima), e-bikes, tendencias que los clientes van a preguntar, competencia directa (Trek, Santa Cruz, Orbea, Giant, Scott, Canyon) cuando afecte la venta, retiros de productos o problemas de seguridad, cambios de precios o abastecimiento, y grandes carreras o atletas Specialized que sirvan para contenido. Descarta lo trivial, chismes, videos sin novedad y notas locales sin relación. Traduce el título al español de Chile (corto y claro) y explica en una frase por qué le importa a la tienda. No inventes nada que no esté en el titular o el resumen.';
const EX_NOT_ESQUEMA = { type: 'object', additionalProperties: false, required: ['destacadas'], properties: { destacadas: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['i', 'titulo', 'por_que', 'tipo', 'relevancia'], properties: {
  i: { type: 'integer' }, titulo: { type: 'string' }, por_que: { type: 'string' },
  tipo: { type: 'string', enum: ['lanzamiento', 'specialized', 'ebike', 'tendencia', 'competencia', 'seguridad', 'industria', 'carrera', 'local'] }, relevancia: { type: 'integer', enum: [1, 2, 3] } } } } } };
function ex_noticias_(forzar) {
  const pr = PropertiesService.getScriptProperties(), guardado = JSON.parse(pr.getProperty('NOTICIAS') || 'null');
  if (!forzar && guardado && Date.now() - Date.parse(guardado.fecha) < 6 * 3600000) return guardado;
  const rs = UrlFetchApp.fetchAll(EX_NOT_FUENTES.map(function (f) { return { url: f[1], muteHttpExceptions: true, followRedirects: true }; }));
  let todos = [];
  rs.forEach(function (r, k) { if (r.getResponseCode() === 200) todos = todos.concat(ex_rssItems_(r.getContentText(), EX_NOT_FUENTES[k][0]).slice(0, k < 2 ? 20 : 12)); });
  const vistos = {};
  todos = todos.filter(function (x) { const k = ex_norm_(x.titulo).slice(0, 60); if (!x.titulo || vistos[k] || /\/forums?\//.test(x.link)) return false; vistos[k] = 1; return true; })
    .sort(function (a, b) { return (b.fecha || '').localeCompare(a.fecha || ''); }).slice(0, 60);
  let items = [];
  if (pr.getProperty('ANTHROPIC_API_KEY') && todos.length) {
    try {
      const r = ex_llamarClaude_(todos.map(function (x, i) { return i + '. [' + x.fuente + ', ' + (x.fecha || '').slice(0, 10) + '] ' + x.titulo + ' — ' + x.resumen.slice(0, 160); }).join('\n'), EX_NOT_SISTEMA, EX_NOT_ESQUEMA);
      items = (r.destacadas || []).filter(function (d) { return todos[d.i]; }).map(function (d) { return Object.assign({}, todos[d.i], { original: todos[d.i].titulo, titulo: d.titulo, por_que: d.por_que, tipo: d.tipo, relevancia: d.relevancia }); });
    } catch (e) { console.log('Noticias IA: ' + e.message); }
  }
  if (!items.length) items = todos.filter(function (x) { return /specialized|levo|kenevo|vado|e-?bike|emtb|launch|lanz/i.test(x.titulo + ' ' + x.resumen); }).concat(todos).filter(function (x, i, a) { return a.indexOf(x) === i; }).slice(0, 6);
  const out = { fecha: new Date().toISOString(), items: items, total: todos.length };
  pr.setProperty('NOTICIAS', JSON.stringify(out).slice(0, 8500));
  return out;
}

/* ---------- avisos internos de la tienda (los ve todo el equipo al abrir la app) ---------- */
const EX_HOJA_AVISOS = 'Avisos';
const EX_CAB_AVISOS = ['ID', 'Creado', 'Título', 'Detalle', 'Desde', 'Hasta', 'Importancia', 'Origen', 'Estado', 'Fecha del evento'];
function ex_avisos_(p) {
  const sh = ex_hojaCab_(EX_HOJA_AVISOS, EX_CAB_AVISOS), tz = ex_tz_(), f = function (d) { return d instanceof Date ? ex_ymd_(d, tz) : String(d || ''); };
  const leer = function () { const n = sh.getLastRow() - 1; return n > 0 ? sh.getRange(2, 1, n, EX_CAB_AVISOS.length).getValues() : []; };
  if (p.guardar) {
    const a = p.guardar, filas = leer(), i = a.id ? filas.findIndex(function (r) { return String(r[0]) === a.id; }) : -1;
    const fila = [a.id || 'AV-' + Date.now().toString(36), i >= 0 ? filas[i][1] : new Date(), String(a.titulo || '').slice(0, 140), String(a.detalle || '').slice(0, 2000), a.desde || ex_hoyYmd_(tz), a.hasta || '', a.importancia || 'normal', a.origen || 'Manual', a.estado || 'Activo', a.fecha || ''];
    if (!fila[2]) throw new Error('falta el título');
    if (i >= 0) sh.getRange(i + 2, 1, 1, fila.length).setValues([fila]); else sh.appendRow(fila);
  }
  if (p.archivar) { const filas = leer(), i = filas.findIndex(function (r) { return String(r[0]) === p.archivar; }); if (i >= 0) sh.getRange(i + 2, 9).setValue('Archivado'); }
  const hoy = ex_hoyYmd_(tz);
  const items = leer().filter(function (r) { return r[0]; }).map(function (r) {
    return { id: String(r[0]), creado: r[1] instanceof Date ? r[1].toISOString() : '', titulo: String(r[2]), detalle: String(r[3]), desde: f(r[4]), hasta: f(r[5]), importancia: String(r[6] || 'normal'), origen: String(r[7] || 'Manual'), estado: String(r[8] || 'Activo'), fecha: f(r[9]) };
  }).filter(function (a) { return p.todos || (a.estado !== 'Archivado' && (!a.hasta || a.hasta >= hoy)); }).reverse();
  return { ok: true, items: items.slice(0, 80) };
}
function ex_avisoAuto_(titulo, detalle, importancia, fecha, hasta) {
  const act = ex_avisos_({}).items;
  if (act.some(function (a) { return ex_parecido_(a.titulo, titulo) > 0.55; })) return false;
  ex_avisos_({ guardar: { titulo: titulo, detalle: detalle, importancia: importancia || 'normal', origen: 'Cerebro', fecha: fecha || '', hasta: hasta || fecha || ex_ymd_(new Date(Date.now() + 3 * 86400000)) } });
  return true;
}

/* ---------- otras fuentes: tus planillas de Google y los archivos de la carpeta "Fuentes" ---------- */
// Pega el link de cualquier Google Sheet tuyo (lista de precios, B2B exportado, metas, proveedores…) o deja
// archivos CSV / Google Sheets en la carpeta de Drive "Organizador · Fuentes": los agentes los consultan solo para leer.
const EX_CARPETA_FUENTES = 'Organizador · Fuentes';
function ex_carpetaFuentes_(crear) {
  const pr = PropertiesService.getScriptProperties(), id = pr.getProperty('EX_FUENTES_ID');
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) {} }
  if (!crear) return null;
  const it = DriveApp.getFoldersByName(EX_CARPETA_FUENTES), f = it.hasNext() ? it.next() : DriveApp.createFolder(EX_CARPETA_FUENTES);
  pr.setProperty('EX_FUENTES_ID', f.getId());
  return f;
}
function ex_fuentesLista_() {
  const pr = PropertiesService.getScriptProperties(), L = JSON.parse(pr.getProperty('FUENTES') || '[]');
  const carpeta = ex_carpetaFuentes_(false);
  if (carpeta) {
    const files = carpeta.getFiles();
    while (files.hasNext()) {
      const f = files.next(), mt = f.getMimeType();
      if (mt !== MimeType.GOOGLE_SHEETS && mt !== MimeType.CSV && !/\.csv$/i.test(f.getName())) continue;
      if (!L.some(function (x) { return x.id === f.getId(); })) L.push({ id: f.getId(), nombre: f.getName().replace(/\.csv$/i, ''), tipo: mt === MimeType.GOOGLE_SHEETS ? 'sheet' : 'csv', carpeta: true, actualizado: f.getLastUpdated().toISOString(), descripcion: '' });
    }
  }
  return L;
}
function ex_fuenteTabla_(f, maxFilas) {
  if (f.tipo === 'csv') {
    const b = DriveApp.getFileById(f.id).getBlob(); let s = b.getDataAsString('UTF-8');
    if (s.indexOf('�') >= 0) s = b.getDataAsString('ISO-8859-1');
    const sep = (s.split('\n')[0].match(/;/g) || []).length > (s.split('\n')[0].match(/,/g) || []).length ? ';' : ',';
    return [{ hoja: f.nombre, filas: Utilities.parseCsv(s, sep).slice(0, maxFilas) }];
  }
  return SpreadsheetApp.openById(f.id).getSheets().slice(0, 6).map(function (sh) {
    const n = Math.min(sh.getLastRow(), maxFilas), c = Math.min(sh.getLastColumn(), 30);
    return { hoja: sh.getName(), filas: n && c ? sh.getRange(1, 1, n, c).getDisplayValues() : [], total: sh.getLastRow() };
  });
}
function ex_fuenteBuscar_(q, max) {
  const tk = ex_norm_(q).split(/[^a-z0-9-]+/).filter(function (w) { return w.length >= 2; }); if (!tk.length) return [];
  const out = [];
  ex_fuentesLista_().forEach(function (f) {
    try {
      ex_fuenteTabla_(f, 4000).forEach(function (t) {
        const cab = t.filas[0] || [];
        t.filas.slice(1).forEach(function (r, i) {
          const s = ex_norm_(r.join(' ')), p = tk.reduce(function (a, w) { return a + (s.indexOf(w) >= 0 ? 1 : 0); }, 0);
          if (p >= Math.max(1, Math.ceil(tk.length * 0.6))) { const o = {}; cab.forEach(function (h, k) { if (r[k] !== '' && r[k] != null) o[String(h || 'col' + (k + 1))] = r[k]; }); out.push({ p: p, fuente: f.nombre, hoja: t.hoja, fila: i + 2, datos: o }); }
        });
      });
    } catch (e) { out.push({ p: 0, fuente: f.nombre, error: e.message }); }
  });
  return out.sort(function (a, b) { return b.p - a.p; }).slice(0, max || 20);
}
function ex_fuentes_(p) {
  const pr = PropertiesService.getScriptProperties(), L = JSON.parse(pr.getProperty('FUENTES') || '[]');
  if (p.agregar) {
    const m = /\/d\/([a-zA-Z0-9_-]{20,})/.exec(p.agregar.url || '') || /^([a-zA-Z0-9_-]{25,})$/.exec(p.agregar.url || '');
    if (!m) throw new Error('No reconozco el link. Copia el link completo de la planilla de Google.');
    const ss = SpreadsheetApp.openById(m[1]);
    if (!L.some(function (x) { return x.id === m[1]; })) L.push({ id: m[1], nombre: p.agregar.nombre || ss.getName(), tipo: 'sheet', descripcion: String(p.agregar.descripcion || '').slice(0, 300), agregado: new Date().toISOString() });
    pr.setProperty('FUENTES', JSON.stringify(L));
  }
  if (p.quitar) pr.setProperty('FUENTES', JSON.stringify(L.filter(function (x) { return x.id !== p.quitar; })));
  if (p.describir) { L.forEach(function (x) { if (x.id === p.describir.id) x.descripcion = String(p.describir.descripcion || '').slice(0, 300); }); pr.setProperty('FUENTES', JSON.stringify(L)); }
  if (p.ver) { const f = ex_fuentesLista_().filter(function (x) { return x.id === p.ver; })[0]; if (!f) throw new Error('fuente no encontrada'); return { ok: true, fuente: f, tablas: ex_fuenteTabla_(f, 25) }; }
  if (p.buscar) return { ok: true, items: ex_fuenteBuscar_(p.buscar, 25) };
  const carpeta = ex_carpetaFuentes_(false);
  return { ok: true, items: ex_fuentesLista_(), carpeta: carpeta ? carpeta.getUrl() : '' };
}
function ex_fuentesResumen_() {
  return ex_fuentesLista_().slice(0, 8).map(function (f) {
    try { const t = ex_fuenteTabla_(f, 6); return f.nombre + (f.descripcion ? ' (' + f.descripcion + ')' : '') + ': ' + t.map(function (x) { return x.hoja + ' [' + (x.total || x.filas.length) + ' filas] columnas: ' + (x.filas[0] || []).filter(String).join(', '); }).join(' | '); }
    catch (e) { return f.nombre + ': no se pudo leer (' + e.message + ')'; }
  }).join('\n');
}

/* ---------- datos compartidos para el Cerebro y el Copiloto ---------- */
let _exPerfLista = null, _exSpzCat = null;   // memoria dentro de una misma ejecución
function ex_perfilesLista_() {
  if (_exPerfLista) return _exPerfLista;
  const P = ex_leerPerfiles_(), nombres = {};
  try { (ex_leerBase_().contactos || []).forEach(function (c) { nombres[c.id] = c.nombre; }); } catch (e) {}
  _exPerfLista = Object.keys(P).filter(function (id) { return P[id].ciclo; }).map(function (id) { return Object.assign({ id: id, nombre: nombres[id] || id }, P[id]); });
  return _exPerfLista;
}
function ex_tareasAbiertas_() {
  const sh = ex_hoja_(), tz = ex_tz_(), n = EX_ULTIMA - EX_PRIMERA + 1, v = sh.getRange(EX_PRIMERA, 1, n, 15).getValues(), out = [];
  v.forEach(function (r) {
    if (!String(r[1] || '').trim() || r[0] === true) return;
    out.push({ tarea: String(r[1]), area: String(r[2] || ''), categoria: String(r[3] || ''), proyecto: String(r[4] || ''), cuadrante: String(r[7] || '').charAt(0), limite: r[9] instanceof Date ? ex_ymd_(r[9], tz) : '', estado: String(r[10] || ''), notas: String(r[14] || '').slice(0, 160) });
  });
  return out;
}
function ex_waEsperando_(dias) {
  const sh = SpreadsheetApp.getActive().getSheetByName(EX_HOJA_WA); if (!sh || sh.getLastRow() < 2) return [];
  const desde = Date.now() - (dias || 7) * 86400000, n = Math.min(4000, sh.getLastRow() - 1), ult = {};
  sh.getRange(sh.getLastRow() - n + 1, 1, n, 7).getValues().forEach(function (r) {
    const f = r[0] instanceof Date ? r[0] : new Date(r[0]); if (isNaN(f) || f.getTime() < desde) return;
    const id = String(r[6] || r[2]); if (ult[id] && ult[id].fecha > f) return;
    ult[id] = { id: id, nombre: String(r[3] || ''), entrante: String(r[1]) === 'Recibido', fecha: f, mensaje: String(r[4] || '').slice(0, 140) };
  });
  return Object.keys(ult).map(function (k) { return ult[k]; }).filter(function (x) { return x.entrante; }).sort(function (a, b) { return a.fecha - b.fecha; })
    .map(function (x) { return { id: x.id, nombre: x.nombre, hace_h: Math.round((Date.now() - x.fecha) / 3600000), mensaje: x.mensaje }; });
}
function ex_contactosRapidos_(q, max) {
  const b = ex_leerBase_(), tk = ex_norm_(q).split(/[^a-z0-9+]+/).filter(function (w) { return w.length >= 2; });
  let perf = {}; try { perf = ex_leerPerfiles_(); } catch (e) {}
  return (b.contactos || []).map(function (c) {
    const t = ex_norm_([c.nombre, c.empresa, c.email, c.telefono, c.etiquetas, c.notas, perf[c.id] ? JSON.stringify(perf[c.id].p || {}).slice(0, 600) : ''].join(' '));
    return { c: c, p: tk.reduce(function (a, w) { return a + (t.indexOf(w) >= 0 ? 1 : 0); }, 0) };
  }).filter(function (o) { return o.p >= Math.max(1, Math.ceil(tk.length * 0.6)); }).sort(function (a, b) { return b.p - a.p; }).slice(0, max || 8).map(function (o) {
    const c = o.c, pf = perf[c.id];
    return { id: c.id, nombre: c.nombre, tipo: c.tipo, telefono: c.telefono, email: c.email, intereses: c.etiquetas, ultima: c.ultima, perfil: pf ? { ciclo: pf.ciclo, clase: pf.clase, prob: pf.prob, resumen: pf.resumen, intereses: pf.p && pf.p.intereses, talla: pf.p && pf.p.talla, presupuesto: pf.p && pf.p.presupuesto_clp, disciplinas: pf.p && pf.p.disciplinas } : null,
      ultimas: (b.interacciones || []).filter(function (i) { return i.id === c.id; }).slice(0, 5).map(function (i) { return i.fecha + ' ' + i.tipo + ': ' + String(i.detalle || '').slice(0, 160); }) };
  });
}
// Clientes con interés declarado en un producto (perfiles y etiquetas), para cruzar con stock y ofertas.
function ex_interesados_(texto, max) {
  const tk = ex_norm_(texto).split(/[^a-z0-9]+/).filter(function (w) { return w.length >= 3 && !/^(comp|expert|pro|sport|base|alloy|carbon|s-works|sworks|turbo|bike|bicicleta)$/.test(w); });
  if (!tk.length) return [];
  const out = [];
  try {
    ex_perfilesLista_().forEach(function (p) {
      const s = ex_norm_(((p.p && p.p.intereses) || []).join(' ') + ' ' + (p.resumen || ''));
      if (tk.every(function (w) { return s.indexOf(w) >= 0; })) out.push({ id: p.id, nombre: p.nombre, ciclo: p.ciclo, clase: p.clase, prob: p.prob, talla: p.p && p.p.talla });
    });
  } catch (e) {}
  return out.sort(function (a, b) { return (b.prob || 0) - (a.prob || 0); }).slice(0, max || 10);
}

/* ---------- Copiloto: un agente que consulta todas las fuentes y propone acciones ---------- */
const EX_COP_SISTEMA = [
  'Eres el Copiloto de Blackline Puerto Varas, tienda Specialized en Puerto Varas, Chile (lluvioso; temporada alta de primavera a verano; muchos turistas argentinos en verano). Su fuerte son las e-bikes (Turbo Levo, Levo SL, Kenevo, Vado, Como, Creo) y también venden MTB, ruta, gravel, urbano, niños, ropa, accesorios y taller. Han vendido S-Works en todas las disciplinas. Hablas con Gustavo, el encargado: psicólogo laboral, vendedor experto, muy analítico. Tutéalo, en español de Chile, directo y concreto.',
  'Tu trabajo: responder rápido y bien usando las herramientas. Consulta los datos antes de afirmar algo (stock, precios, clientes, negociaciones, clima). Cruza fuentes: por ejemplo, si preguntan por un producto mira la web de Specialized (precio, oferta, stock por talla en Chile), el stock de la tienda (Bsale) y qué clientes lo quieren. Si una herramienta no tiene datos (por ejemplo Bsale aún no conectado), dilo en una frase y sigue con lo que sí hay.',
  'Specialized: los modelos sin «Alloy» en el nombre son de carbono (ej.: «Turbo Levo 4 Comp» es la Comp Carbon). Para stock por color y talla usa buscar_producto y, si vas a prometer algo, confírmalo con ficha_specialized_en_vivo; responde con una lista por color y talla. Reglas: nunca inventes precios, stock ni datos de clientes. El stock de Specialized es el de su bodega en Chile según la web (sirve para saber si se puede pedir); el de Bsale es el de la tienda. No puedes comprar, pedir, enviar mensajes ni modificar nada por tu cuenta: cuando convenga actuar, usa proponer_accion (tareas, avisos, abrir chat de WhatsApp con un borrador, crear negociación, diseñar una pieza, idea de contenido, abrir ficha de producto) y Gustavo decide con un toque.',
  'Correcciones y registros: Gustavo también te pide cambiar datos («corrige la negociación de X», «esa venta ya terminó», «registra una garantía»). Busca primero el registro (ver_negociaciones con filtro todas, buscar_clientes) y propone los cambios con proponer_cambio_negocio, proponer_nota_contacto y proponer_accion (crear_tarea con fecha y detalle de los pasos). Propón todas las acciones que el caso necesita, en una sola respuesta, y explica en una frase qué cambiará cada una. Si la app muestra algo mal pero el dato está bien guardado, dilo.',
  'Ventas reales: con ventas_tienda y compras_cliente tienes las ventas de Bsale (por mes, por producto, rotación y stock quieto) y el historial de compras de cada cliente. Úsalas para responder cuánto se vende, qué reponer y qué compró un cliente.',
  'Compras: tienes los catálogos públicos de los proveedores (Sportvibes: Fox suspensiones, Deity, HT; Outside: Hope, BikeYoke, Schwalbe, SunRace; MKR: RockShox y SRAM; Andes: Shimano y Continental; Specialized; Garmin y Tacx; Trail: ropa Fox) con precio público, precio de oferta y el costo de Blackline con su descuento de distribuidor (Garmin ~20 %, el resto ~30 %). Úsalos para responder qué se puede conseguir, a qué costo y cuándo conviene comprar (comprar en la oferta del proveedor y vender a precio normal). Eso es información interna: no se comunica como descuento.',
  EX_POLITICA,
  'Formato de la respuesta: breve y escaneable. Empieza con la respuesta directa en 1–2 frases. Luego, si sirve, viñetas cortas con datos concretos (precio, tallas, stock, fechas). Usa **negrita** solo para lo clave. Sin títulos grandes ni tablas. Para borradores de mensajes a clientes, escríbelos listos para copiar, cálidos y cortos, con emojis moderados.'
].join('\n\n');
const EX_COP_TOOLS = [
  { name: 'buscar_producto', description: 'Busca un producto por nombre, familia, talla o SKU (ej. "levo sl s4", "kenevo sl comp", "95227-6001", "casco ambush"). Devuelve la web de Specialized Chile (precio, oferta, etiqueta, stock por talla y color en la bodega de Chile, bajas recientes), el stock de la tienda en Bsale y los clientes interesados.', input_schema: { type: 'object', properties: { consulta: { type: 'string' } }, required: ['consulta'] } },
  { name: 'ficha_specialized_en_vivo', description: 'Vuelve a leer ahora la ficha de un producto en specialized.com/cl (stock por talla y color al minuto). Úsala cuando necesites confirmar stock exacto antes de prometer algo. Requiere el id del producto que entrega buscar_producto.', input_schema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
  { name: 'novedades_specialized', description: 'Lo que está pasando en specialized.com/cl: productos más vendidos en Chile (bajas de stock de los últimos 14 días), etiquetados como más vendidos, ofertas activas, novedades y colores nuevos, bicis con poco stock, lanzamientos y campañas de la portada.', input_schema: { type: 'object', properties: {} } },
  { name: 'buscar_clientes', description: 'Busca clientes o contactos por nombre, teléfono, email, producto de interés o característica (ej. "Juan", "levo talla L", "gravel principiante"). Devuelve perfil (ciclo, probabilidad, intereses, talla, presupuesto) y últimas interacciones.', input_schema: { type: 'object', properties: { consulta: { type: 'string' } }, required: ['consulta'] } },
  { name: 'clientes_interesados', description: 'Lista los clientes que han mostrado interés en un producto o familia (ej. "Kenevo SL", "Vado"). Útil para avisar llegadas, ofertas o poco stock.', input_schema: { type: 'object', properties: { producto: { type: 'string' } }, required: ['producto'] } },
  { name: 'whatsapp_esperando', description: 'Clientes que escribieron por WhatsApp y esperan respuesta (últimos días), con el último mensaje.', input_schema: { type: 'object', properties: {} } },
  { name: 'ver_negociaciones', description: 'Negociaciones de venta abiertas (o todas) con etapa, valor, próxima acción y última actividad. Filtro opcional por texto.', input_schema: { type: 'object', properties: { filtro: { type: 'string', enum: ['abiertas', 'estancadas', 'ganadas_30d', 'perdidas_30d', 'ganadas', 'todas'] }, consulta: { type: 'string' } } } },
  { name: 'ver_tareas', description: 'Tareas pendientes del organizador. Filtro: hoy, vencidas, semana o todas; texto opcional.', input_schema: { type: 'object', properties: { filtro: { type: 'string', enum: ['hoy', 'vencidas', 'semana', 'todas'] }, consulta: { type: 'string' } } } },
  { name: 'ver_agenda', description: 'Eventos de Google Calendar de los próximos días (reuniones, salidas, test rides, capacitaciones).', input_schema: { type: 'object', properties: { dias: { type: 'integer' } } } },
  { name: 'ver_clima', description: 'Pronóstico de Puerto Varas: ahora y los próximos 7 días (lluvia, temperatura, viento). Útil para salidas, test rides, eventos y contenido.', input_schema: { type: 'object', properties: {} } },
  { name: 'ver_noticias', description: 'Noticias del mundo bike seleccionadas (Pinkbike, Vital MTB, Specialized en la prensa, ciclismo en Chile).', input_schema: { type: 'object', properties: {} } },
  { name: 'stock_tienda', description: 'Stock de la tienda en Bsale para un producto (nombre, SKU o código).', input_schema: { type: 'object', properties: { consulta: { type: 'string' } }, required: ['consulta'] } },
  { name: 'ventas_tienda', description: 'Ventas reales de la tienda según Bsale. Sin consulta: ventas por mes, hoy, semana y mes (con comparación), lo más vendido, lo que hay que reponer pronto (cobertura de stock), el stock quieto y los mejores clientes. Con consulta (ej. "muc-off", "casco", "levo"): unidades y monto vendidos de esos productos en los últimos N días.', input_schema: { type: 'object', properties: { consulta: { type: 'string' }, dias: { type: 'integer' } } } },
  { name: 'compras_cliente', description: 'Historial de compras de un cliente en Bsale (boletas y facturas con productos), buscando por email, teléfono, RUT o nombre exacto.', input_schema: { type: 'object', properties: { email: { type: 'string' }, telefono: { type: 'string' }, rut: { type: 'string' }, nombre: { type: 'string' } } } },
  { name: 'buscar_en_planillas', description: 'Busca en las planillas y archivos que Gustavo conectó como fuentes (listas de precios, exportaciones del B2B, metas, proveedores, etc.).', input_schema: { type: 'object', properties: { consulta: { type: 'string' } }, required: ['consulta'] } },
  { name: 'ver_instagram', description: 'Resumen de Instagram: alcance y seguidores recientes, últimas publicaciones y su rendimiento, contenido planificado y piezas del estudio.', input_schema: { type: 'object', properties: {} } },
  { name: 'ver_avisos', description: 'Avisos internos activos de la tienda (lo que viene, cosas importantes).', input_schema: { type: 'object', properties: {} } },
  { name: 'buscar_en_proveedores', description: 'Busca un producto en los catálogos públicos de los proveedores (y Specialized): precio público, precio de oferta, disponibilidad y costo para Blackline con su descuento. Útil cuando un cliente pide algo que no está en la tienda (ej. "fox 36 grip x2", "hope tech 4", "garmin edge 1050", "schwalbe magic mary 29").', input_schema: { type: 'object', properties: { consulta: { type: 'string' } }, required: ['consulta'] } },
  { name: 'oportunidades_compra', description: 'Productos en oferta en la web de los proveedores que conviene comprar ahora para vender a precio normal: margen extra, si la tienda los vende, si los piden clientes y cuántos días lleva la oferta.', input_schema: { type: 'object', properties: {} } },
  { name: 'correos_proveedores', description: 'Correos recientes de los proveedores (promociones, lanzamientos, llegadas, listas de precios).', input_schema: { type: 'object', properties: {} } },
  { name: 'proponer_cambio_negocio', description: 'Propone corregir o actualizar una negociación existente (etapa, valor, próxima acción, motivo de pérdida) y/o agregarle una nota. Gustavo la aprueba con un toque. Busca antes el id con ver_negociaciones (filtro "todas" si no está abierta). Para sacar del pipeline una venta que ya terminó, usa etapa "Ganada" (o "Perdida") con la fecha real en fecha_etapa.', input_schema: { type: 'object', properties: {
    id: { type: 'string', description: 'ID de la negociación (N-...)' }, titulo: { type: 'string', description: 'Texto del botón, ej. «Marcar como ganada (29/09)»' },
    etapa: { type: 'string', enum: ['Nuevo', 'Contactado', 'Prueba / visita', 'Cotización', 'Negociación', 'Ganada', 'Perdida'] }, fecha_etapa: { type: 'string', description: 'yyyy-MM-dd en que ocurrió el cambio de etapa, si no fue hoy' },
    valor: { type: 'integer' }, proxima: { type: 'string', description: 'Próxima acción (vacío para quitarla)' }, fecha_proxima: { type: 'string' }, motivo: { type: 'string', description: 'Motivo de pérdida' },
    nota: { type: 'string', description: 'Nota que queda en el historial de la negociación y del cliente' } }, required: ['id', 'titulo'] } },
  { name: 'proponer_nota_contacto', description: 'Propone registrar una nota en la ficha de un cliente o contacto (reclamos, garantías, acuerdos, datos nuevos). Gustavo la aprueba con un toque.', input_schema: { type: 'object', properties: { id: { type: 'string' }, titulo: { type: 'string' }, texto: { type: 'string' } }, required: ['id', 'titulo', 'texto'] } },
  { name: 'proponer_accion', description: 'Propone una acción para que Gustavo la apruebe con un toque. No ejecuta nada por sí sola. Úsala cuando haya un siguiente paso claro.', input_schema: { type: 'object', properties: {
    tipo: { type: 'string', enum: ['crear_tarea', 'crear_aviso', 'whatsapp', 'crear_negocio', 'disenar_pieza', 'idea_contenido', 'abrir_producto', 'abrir_contacto'] },
    titulo: { type: 'string', description: 'Texto del botón o título de la tarea, aviso, negociación o idea' },
    detalle: { type: 'string', description: 'Detalle: notas de la tarea, texto del aviso, borrador del mensaje de WhatsApp, tema de la pieza' },
    fecha: { type: 'string', description: 'yyyy-MM-dd si aplica' },
    ref: { type: 'string', description: 'ID del contacto, producto o negociación relacionada, o teléfono' } }, required: ['tipo', 'titulo'] } }
];
function ex_json_(o, max) { const s = JSON.stringify(o); return s.length > (max || 7000) ? s.slice(0, max || 7000) + '…' : s; }
function ex_copHerramienta_(nombre, inp, estado) {
  const tz = ex_tz_(), hoy = ex_hoyYmd_(tz);
  switch (nombre) {
    case 'buscar_producto': {
      const spz = ex_spzBuscar_(inp.consulta, 6).map(function (x) { return { id: x.id, nombre: x.nombre, disciplina: x.disciplina, precio: x.precio, oferta: x.oferta || null, etiqueta: x.etiqueta, stock_chile: x.stock, tallas_con_stock: x.tallas, bajas_14d: x.bajas14, revisado: x.revisado, url: x.url, detalle: ex_spzTallas_(x.id).slice(0, 30) }; });
      let bsale = 'Bsale aún no está conectado';
      if (ex_bsaleToken_()) { try { bsale = ex_bsaleParaAgente_(inp.consulta) || 'sin coincidencias en Bsale'; } catch (e) { bsale = 'error Bsale: ' + e.message; } }
      return ex_json_({ specialized: spz.length ? spz : 'sin coincidencias en el catálogo de Specialized (o aún no se sincroniza)', tienda_bsale: bsale, interesados: ex_interesados_(inp.consulta, 8) }, 9000);
    }
    case 'ficha_specialized_en_vivo': { const r = ex_specialized_({ accion: 'ficha', id: inp.id }); return ex_json_(r, 8000); }
    case 'novedades_specialized': { const r = ex_spzResumen_(); ['calientes', 'masVendidos', 'ofertas', 'nuevos', 'pocoStock'].forEach(function (k) { if (r[k]) r[k] = r[k].slice(0, 8).map(function (x) { return { nombre: x.nombre, disciplina: x.disciplina, precio: x.precio, oferta: x.oferta || null, stock: x.stock, tallas: x.tallas, bajas14: x.bajas14, id: x.id }; }); }); if (r.movimientos) r.movimientos = r.movimientos.slice(0, 15); return ex_json_(r, 9000); }
    case 'buscar_clientes': return ex_json_(ex_contactosRapidos_(inp.consulta, 6), 8000);
    case 'clientes_interesados': return ex_json_(ex_interesados_(inp.producto, 15));
    case 'whatsapp_esperando': return ex_json_(ex_waEsperando_(7).slice(0, 20));
    case 'ver_negociaciones': {
      let L = ex_leerNegocios_().negocios; const f = inp.filtro || 'abiertas', d = function (s) { return s ? Math.round((Date.parse(hoy) - Date.parse(s)) / 86400000) : 999; };
      if (f === 'abiertas') L = L.filter(function (n) { return n.estado === 'Abierta'; });
      if (f === 'estancadas') L = L.filter(function (n) { return n.estado === 'Abierta' && d(n.actividad) > 7; });
      if (f === 'ganadas_30d') L = L.filter(function (n) { return n.estado === 'Ganada' && d(n.actividad) <= 30; });
      if (f === 'perdidas_30d') L = L.filter(function (n) { return n.estado === 'Perdida' && d(n.actividad) <= 30; });
      if (f === 'ganadas') L = L.filter(function (n) { return n.estado === 'Ganada'; });
      if (inp.consulta) { const q = ex_norm_(inp.consulta); L = L.filter(function (n) { return ex_norm_(n.titulo + ' ' + n.producto + ' ' + n.notas + ' ' + n.contacto).indexOf(q) >= 0; }); }
      return ex_json_(L.slice(0, 25).map(function (n) { return { id: n.id, titulo: n.titulo, contacto: n.contacto, etapa: n.etapa, estado: n.estado, historial: n.historial, valor: n.valor, producto: n.producto, proxima: n.proxima, fechaProx: n.fechaProx, actividad: n.actividad, notas: String(n.notas || '').slice(0, 160) }; }));
    }
    case 'ver_tareas': {
      let L = ex_tareasAbiertas_(); const f = inp.filtro || 'hoy', fin = ex_ymd_(new Date(Date.now() + 7 * 86400000), tz);
      if (f === 'hoy') L = L.filter(function (t) { return t.limite && t.limite <= hoy; });
      if (f === 'vencidas') L = L.filter(function (t) { return t.limite && t.limite < hoy; });
      if (f === 'semana') L = L.filter(function (t) { return t.limite && t.limite <= fin; });
      if (inp.consulta) { const q = ex_norm_(inp.consulta); L = L.filter(function (t) { return ex_norm_(t.tarea + ' ' + t.notas + ' ' + t.proyecto).indexOf(q) >= 0; }); }
      return ex_json_(L.slice(0, 40));
    }
    case 'ver_agenda': { const n = Math.min(14, inp.dias || 7), lim = ex_ymd_(new Date(Date.now() + n * 86400000), tz); return ex_json_(int_eventos_(tz).filter(function (e) { return e.fecha <= lim; }).map(function (e) { return { fecha: e.fecha, inicio: e.inicio, fin: e.fin, titulo: e.titulo, lugar: e.lugar }; })); }
    case 'ver_clima': return ex_climaTexto_(ex_clima_());
    case 'ver_noticias': return ex_json_(ex_noticias_(false).items.map(function (x) { return { titulo: x.titulo, por_que: x.por_que, fuente: x.fuente, fecha: (x.fecha || '').slice(0, 10), link: x.link }; }));
    case 'stock_tienda': if (!ex_bsaleToken_()) return 'Bsale aún no está conectado: no hay stock de la tienda disponible.'; return String(ex_bsaleParaAgente_(inp.consulta) || 'sin coincidencias en Bsale');
    case 'ventas_tienda': if (!ex_bsaleToken_()) return 'Bsale aún no está conectado.'; return ex_bsaleVentasTexto_(inp.consulta, inp.dias);
    case 'compras_cliente': { if (!ex_bsaleToken_()) return 'Bsale aún no está conectado.'; const L = ex_bsaleCompras_(inp); return L.length ? ex_json_(L, 7000) : 'Sin compras en Bsale para ese cliente (revisa email, teléfono o RUT).'; }
    case 'buscar_en_planillas': { const L = ex_fuentesLista_(); if (!L.length) return 'No hay planillas conectadas como fuentes todavía.'; return ex_json_(ex_fuenteBuscar_(inp.consulta, 15), 9000); }
    case 'ver_instagram': {
      const o = {}; try { const ig = ex_instagram_({}); o.dias = (ig.dias || []).slice(-14).map(function (d) { return [d.fecha, d.seguidores, d.alcance, d.interacciones].join(' · '); }); o.ultimas = (ig.posts || []).filter(function (x) { return x.formato !== 'STORY'; }).sort(function (a, b) { return String(b.fecha).localeCompare(String(a.fecha)); }).slice(0, 8).map(function (x) { return { fecha: x.fecha, formato: x.formato, texto: String(x.texto || '').slice(0, 90), alcance: x.alcance, guardados: x.guardados }; }); } catch (e) { o.instagram = 'sin datos: ' + e.message; }
      try { o.plan = (ex_contenido_({}).items || []).filter(function (x) { return x.fecha >= hoy && x.estado !== 'Publicado'; }).slice(0, 10).map(function (x) { return x.fecha + ' ' + x.formato + ': ' + x.tema; }); } catch (e) {}
      try { o.piezas = (ex_piezas_({}).items || []).slice(0, 8).map(function (x) { return x.estado + ': ' + x.titulo; }); } catch (e) {}
      return ex_json_(o, 7000);
    }
    case 'ver_avisos': return ex_json_(ex_avisos_({}).items.map(function (a) { return { titulo: a.titulo, detalle: a.detalle, fecha: a.fecha, importancia: a.importancia }; }));
    case 'buscar_en_proveedores': return ex_json_(ex_provBuscar_(inp.consulta, 12).map(function (x) { return { proveedor: x.proveedor, producto: x.nombre, marca: x.marca, sku: x.sku, precio_web: x.precio, precio_normal: x.normal, iva: x.iva, disponible: x.disp, costo_blackline: x.costo, desc: x.desc + '%', url: x.url }; }), 9000);
    case 'oportunidades_compra': return ex_json_(ex_provOportunidades_(15).map(function (o) { return { proveedor: o.proveedor, producto: o.nombre, precio_normal: o.normal, precio_oferta: o.precio, costo_en_oferta: o.costo, margen_vendiendo_a_precio_normal: o.margenOferta + '%', margen_habitual: o.desc + '%', dias_en_oferta: o.diasOferta, la_vende_la_tienda: o.vende, la_piden_clientes: o.piden, nuevo: o.nuevo, url: o.url }; }), 9000);
    case 'correos_proveedores': return ex_json_((ex_provCorreos_(false).items || []).slice(0, 20));
    case 'proponer_cambio_negocio': {
      const cambios = {}; ['etapa', 'valor', 'proxima', 'motivo'].forEach(function (k) { if (inp[k] !== undefined && inp[k] !== null) cambios[k] = inp[k]; });
      if (inp.fecha_etapa) cambios.fechaEtapa = inp.fecha_etapa; if (inp.fecha_proxima !== undefined) cambios.fechaProx = inp.fecha_proxima;
      if (cambios.etapa === 'Ganada' || cambios.etapa === 'Perdida') { if (cambios.proxima === undefined) cambios.proxima = ''; if (cambios.fechaProx === undefined) cambios.fechaProx = ''; }
      estado.acciones.push({ tipo: 'editar_negocio', titulo: String(inp.titulo || 'Actualizar negociación').slice(0, 160), ref: String(inp.id || ''), cambios: cambios, detalle: String(inp.nota || '').slice(0, 1500) });
      return 'Cambio propuesto. Gustavo lo verá como botón para aprobar.';
    }
    case 'proponer_nota_contacto': estado.acciones.push({ tipo: 'nota_contacto', titulo: String(inp.titulo || 'Guardar nota').slice(0, 160), ref: String(inp.id || ''), detalle: String(inp.texto || '').slice(0, 1500) }); return 'Nota propuesta. Gustavo la verá como botón.';
    case 'proponer_accion': estado.acciones.push({ tipo: inp.tipo, titulo: String(inp.titulo || '').slice(0, 160), detalle: String(inp.detalle || '').slice(0, 1500), fecha: inp.fecha || '', ref: inp.ref || '' }); return 'Acción propuesta. Gustavo la verá como botón.';
  }
  throw new Error('herramienta desconocida: ' + nombre);
}
function ex_claudeMensajes_(cuerpo) {
  const clave = PropertiesService.getScriptProperties().getProperty('ANTHROPIC_API_KEY');
  if (!clave) throw new Error('falta ANTHROPIC_API_KEY en las propiedades del script');
  const r = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', { method: 'post', contentType: 'application/json', muteHttpExceptions: true, payload: JSON.stringify(cuerpo), headers: { 'x-api-key': clave, 'anthropic-version': '2023-06-01' } });
  const j = JSON.parse(r.getContentText() || '{}');
  if (r.getResponseCode() !== 200) throw new Error('Claude respondió ' + r.getResponseCode() + ': ' + ((j.error && j.error.message) || '').slice(0, 200));
  return j;
}
function ex_copiloto_(p) {
  const pr = PropertiesService.getScriptProperties(), modelo = pr.getProperty('COPILOTO_MODELO') || pr.getProperty('AGENTE_MODELO') || EX_AG_MODELO, tz = ex_tz_();
  const hist = (p.mensajes || []).slice(-12).filter(function (m) { return m && m.texto; });
  if (!hist.length || hist[hist.length - 1].rol !== 'yo') throw new Error('falta la pregunta');
  const ahora = Utilities.formatDate(new Date(), tz, "EEEE d 'de' MMMM yyyy, HH:mm");
  const messages = hist.map(function (m, i) {
    let t = String(m.texto).slice(0, 4000);
    if (i === hist.length - 1) t = '[' + ahora + (p.pestana ? ' · Gustavo está en la pestaña ' + p.pestana : '') + (p.contexto ? ' · En pantalla: ' + String(p.contexto).slice(0, 1500) : '') + ']\n' + t;
    return { role: m.rol === 'yo' ? 'user' : 'assistant', content: t };
  });
  while (messages.length && messages[0].role !== 'user') messages.shift();
  const estado = { acciones: [], usadas: {} };
  const tools = EX_COP_TOOLS.map(function (t, i) { return i === EX_COP_TOOLS.length - 1 ? Object.assign({}, t, { cache_control: { type: 'ephemeral' } }) : t; });
  let texto = '';
  for (let paso = 0; paso < 7; paso++) {
    const j = ex_claudeMensajes_({ model: modelo, max_tokens: 6000, output_config: { effort: /haiku/.test(modelo) ? 'medium' : 'low' }, system: [{ type: 'text', text: EX_COP_SISTEMA, cache_control: { type: 'ephemeral' } }], tools: tools, messages: messages });
    if (j.stop_reason === 'refusal') { texto = 'No puedo ayudar con eso.'; break; }
    messages.push({ role: 'assistant', content: j.content });
    texto = (j.content || []).filter(function (c) { return c.type === 'text'; }).map(function (c) { return c.text; }).join('\n').trim() || texto;
    if (j.stop_reason !== 'tool_use') break;
    const res = (j.content || []).filter(function (c) { return c.type === 'tool_use'; }).map(function (tu) {
      estado.usadas[tu.name] = 1;
      try { return { type: 'tool_result', tool_use_id: tu.id, content: String(ex_copHerramienta_(tu.name, tu.input || {}, estado)) }; }
      catch (e) { return { type: 'tool_result', tool_use_id: tu.id, content: 'Error: ' + e.message, is_error: true }; }
    });
    messages.push({ role: 'user', content: res });
  }
  return { ok: true, texto: texto || 'No encontré una respuesta. Prueba preguntando de otra forma.', acciones: estado.acciones.slice(0, 6), fuentes: Object.keys(estado.usadas) };
}

/* ---------- Agente de tareas: piensa la tarea antes de guardarla ---------- */
// Recibe lo que Gustavo dictó o escribió y lo convierte en una tarea completa, como él la habría pensado:
// fecha y hora, pasos, proveedor (lo busca o deja la ficha lista), cantidades según el stock, mejores opciones y mensaje para pedir.
// Nunca crea nada por su cuenta: devuelve una propuesta y la app la muestra para aprobar o corregir.
const EX_TAR_MODELO = 'claude-haiku-5-5';   // se cambia con la propiedad TAREAS_MODELO
const EX_TAR_SISTEMA = [
  'Eres el asistente de operaciones de Blackline Puerto Varas, tienda Specialized en Puerto Varas, Chile (lluvioso; temporada alta de primavera a verano, con muchos turistas en verano). Venden bicicletas (fuerte en e-bikes), ropa, accesorios, repuestos, lubricantes y servicio de taller. Gustavo es el encargado: tiene 2 vendedores (uno apoya marketing, otro el orden físico y el stock) y 2 mecánicos.',
  'Tu trabajo: Gustavo te dicta o escribe una tarea en bruto (a veces con errores del dictado por voz). Antes de guardarla, piénsala como la habría pensado él al ponerse a hacerla, y déjale todo listo para solo aprobar:',
  '1) Entiende qué quiere de verdad y corrige lo que el dictado escribió mal. Las marcas y nombres dictados suelen venir deformados: busca la marca real del rubro bike (ej.: «Makov», «Mak of» o «Muk off» = Muc-Off; «Fino» = Finish Line; «Rocsoks» = RockShox). Si corriges algo, anótalo en correcciones.',
  '2) Título claro y accionable (verbo + qué + con quién), fecha límite realista y hora si conviene, área, categoría y prioridad (urgente/importante). Si el pedido depende de la temporada (ej.: verano = más uso de lubricantes secos y de cerámica, más mantenciones), dilo.',
  '3) Pasos concretos (subtareas) en el orden en que se hacen.',
  '4) Si hay un proveedor o persona involucrada, búscalo: primero con buscar_proveedor (contactos y proveedores configurados) y luego con buscar_correos (Gmail: facturas, cotizaciones, pedidos anteriores, firmas con teléfono). Si lo encuentras, devuelve su id. Si no, deja la ficha lista para crearlo con lo que sepas (nombre, empresa, qué marcas trae, teléfono o correo si aparecen) y marca qué falta.',
  '5) Si es un pedido o compra: revisa el stock de la tienda (stock_tienda) y lo que se ha vendido de esos productos (ventas_tienda con el nombre o la marca, por ejemplo 90 días; si Bsale no está conectado, dilo), pedidos y correos anteriores, y los catálogos de proveedores (buscar_en_proveedores). Sugiere qué productos y cuántas unidades pedir, con el motivo (stock actual, temporada, rotación). Si no hay datos de ventas, estima con criterio de tienda y dilo. Incluye la línea de productos adecuada (tipos, formatos y tamaños) y, si sirve, busca en internet (web_search) la línea vigente de la marca, formatos y distribuidor en Chile. No inventes precios: si no los encuentras, deja el campo vacío.',
  '6) Deja listo el mensaje para el proveedor (WhatsApp o correo): cordial, corto y concreto, con el detalle del pedido. Si falta un dato clave para pedir (ej.: cuenta aún no abierta), propón el paso para resolverlo como subtarea.',
  '7) Si conviene un bloque en el calendario (llamada, visita, reunión, retiro), propón el evento.',
  'Reglas: usa las herramientas antes de afirmar algo (máximo unas 8 consultas en total; no repitas búsquedas iguales). No inventes contactos, teléfonos, stock ni precios. Español de Chile, directo. Si no es una compra (ej.: «llamar a Pedro»), no fuerces pedido ni opciones: deja esos campos vacíos. Cuando termines, llama SIEMPRE a entregar_plan con todo; es tu única forma de responder.',
  EX_POLITICA
].join('\n\n');
const EX_TAR_PLAN = { type: 'object', additionalProperties: false, required: ['resumen', 'correcciones', 'tarea', 'evento', 'proveedor', 'pedido', 'opciones', 'preguntas'], properties: {
  resumen: { type: 'string', description: 'Cómo lo pensaste, en 2 a 4 frases para Gustavo' },
  correcciones: { type: 'array', items: { type: 'string' }, description: 'Lo que corregiste del dictado (ej.: «Makov» → Muc-Off)' },
  tarea: { type: 'object', additionalProperties: false, required: ['titulo', 'notas', 'limite', 'hora', 'area', 'categoria', 'urgente', 'importante', 'tamano', 'subtareas'], properties: {
    titulo: { type: 'string' }, notas: { type: 'string', description: 'Contexto útil en 1 a 3 líneas (no repitas el pedido ni las opciones)' },
    limite: { type: 'string', description: 'yyyy-MM-dd o vacío' }, hora: { type: 'string', description: 'HH:mm o vacío' },
    area: { type: 'string' }, categoria: { type: 'string' }, urgente: { type: 'boolean' }, importante: { type: 'boolean' },
    tamano: { type: 'string', enum: ['Pequeña', 'Mediana', 'Grande'] }, subtareas: { type: 'array', items: { type: 'string' } } } },
  evento: { type: 'object', additionalProperties: false, required: ['crear', 'titulo', 'fecha', 'inicio', 'fin', 'motivo'], properties: {
    crear: { type: 'boolean' }, titulo: { type: 'string' }, fecha: { type: 'string', description: 'yyyy-MM-dd' }, inicio: { type: 'string', description: 'HH:mm' }, fin: { type: 'string', description: 'HH:mm' }, motivo: { type: 'string' } } },
  proveedor: { type: 'object', additionalProperties: false, required: ['estado', 'id', 'nombre', 'empresa', 'telefono', 'email', 'marcas', 'notas', 'falta'], properties: {
    estado: { type: 'string', enum: ['encontrado', 'nuevo', 'no_aplica'] }, id: { type: 'string', description: 'id del contacto si se encontró' },
    nombre: { type: 'string' }, empresa: { type: 'string' }, telefono: { type: 'string' }, email: { type: 'string' }, marcas: { type: 'string' },
    notas: { type: 'string', description: 'Qué se sabe: condiciones, cuenta, cómo se le pide' }, falta: { type: 'string', description: 'Datos que faltan para la ficha o para poder pedir' } } },
  pedido: { type: 'object', additionalProperties: false, required: ['aplica', 'items', 'criterio', 'mensaje'], properties: {
    aplica: { type: 'boolean' },
    items: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['producto', 'formato', 'cantidad', 'stock_tienda', 'precio_ref', 'motivo'], properties: {
      producto: { type: 'string' }, formato: { type: 'string', description: 'Tamaño o presentación (ej.: 120 ml)' }, cantidad: { type: 'integer' },
      stock_tienda: { type: 'string', description: 'Stock actual en la tienda o «sin dato»' }, precio_ref: { type: 'string', description: 'Precio o costo de referencia con su fuente, o vacío' }, motivo: { type: 'string' } } } },
    criterio: { type: 'string', description: 'Cómo calculaste las cantidades' },
    mensaje: { type: 'string', description: 'Borrador para enviar al proveedor' } } },
  opciones: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['nombre', 'detalle', 'fuente', 'url'], properties: {
    nombre: { type: 'string' }, detalle: { type: 'string', description: 'Para qué sirve y por qué conviene' }, fuente: { type: 'string' }, url: { type: 'string' } } } },
  preguntas: { type: 'array', items: { type: 'string' }, description: 'Lo que Gustavo debe confirmar (máx. 3)' }
} };
const EX_TAR_TOOLS_PROPIAS = [
  { name: 'buscar_proveedor', description: 'Busca un proveedor o contacto por nombre, empresa o marca que trae (ej. "Bianchi", "Muc-Off"). Revisa los contactos guardados y los proveedores configurados en Compras.', input_schema: { type: 'object', properties: { consulta: { type: 'string' } }, required: ['consulta'] } },
  { name: 'buscar_correos', description: 'Busca en el Gmail de la tienda (últimos 2 años): pedidos, facturas, cotizaciones y firmas con teléfono. Usa palabras simples (ej. "bianchi", "muc-off pedido", "lubricante factura").', input_schema: { type: 'object', properties: { consulta: { type: 'string' } }, required: ['consulta'] } },
  { name: 'entregar_plan', description: 'Entrega el plan final de la tarea. Llámala una sola vez, al final.', strict: true, input_schema: EX_TAR_PLAN }
];
const EX_TAR_DE_COP = ['stock_tienda', 'ventas_tienda', 'compras_cliente', 'buscar_en_proveedores', 'buscar_en_planillas', 'ver_agenda', 'ver_tareas', 'correos_proveedores', 'buscar_producto', 'ver_clima', 'ver_negociaciones', 'buscar_clientes'];
function ex_tarHerramienta_(nombre, inp, estado) {
  if (nombre === 'buscar_proveedor') {
    const q = ex_norm_(inp.consulta), tk = q.split(/[^a-z0-9]+/).filter(function (w) { return w.length >= 3; });
    const conf = ex_proveedoresConf_().filter(function (p) { const s = ex_norm_(p.nombre + ' ' + p.marcas + ' ' + (p.dominios || []).join(' ')); return tk.some(function (w) { return s.indexOf(w) >= 0; }); })
      .map(function (p) { return { proveedor_configurado: p.nombre, web: p.web, marcas: p.marcas, descuento: p.desc + '%', dominios: p.dominios, notas: p.nota || '' }; });
    const ctos = ex_contactosRapidos_(inp.consulta, 6).map(function (c) { return { id: c.id, nombre: c.nombre, tipo: c.tipo, telefono: c.telefono, email: c.email, etiquetas: c.intereses, ultima: c.ultima, ultimas: c.ultimas }; });
    return ex_json_({ contactos: ctos.length ? ctos : 'ningún contacto coincide', proveedores_configurados: conf.length ? conf : 'ninguno coincide' }, 6000);
  }
  if (nombre === 'buscar_correos') {
    const tz = ex_tz_();
    const hilos = GmailApp.search(String(inp.consulta || '') + ' newer_than:2y', 0, 8);
    if (!hilos.length) return 'Sin correos que coincidan.';
    return ex_json_(hilos.map(function (th) {
      const ms = th.getMessages(), m = ms[ms.length - 1];
      return { fecha: Utilities.formatDate(m.getDate(), tz, 'yyyy-MM-dd'), de: m.getFrom(), para: m.getTo(), asunto: th.getFirstMessageSubject(), texto: String(m.getPlainBody() || '').replace(/\s+/g, ' ').slice(0, 700) };
    }), 8000);
  }
  return ex_copHerramienta_(nombre, inp, estado);
}
function ex_tareaIA_(p) {
  const pr = PropertiesService.getScriptProperties(), tz = ex_tz_(), modelo = pr.getProperty('TAREAS_MODELO') || EX_TAR_MODELO, haiku = /haiku/.test(modelo);
  const texto = String(p.texto || '').trim(); if (!texto) throw new Error('falta el texto de la tarea');
  const ahora = Utilities.formatDate(new Date(), tz, "EEEE d 'de' MMMM yyyy, HH:mm");
  const cfg = p.config || {};
  const pedido = 'Hoy es ' + ahora + ' (' + ex_hoyYmd_(tz) + ').\n' +
    'Áreas válidas: ' + (cfg.areas || ['Trabajo', 'Personal']).join(', ') + '.\n' +
    'Categorías válidas (área): ' + (cfg.categorias || []).map(function (c) { return c.nombre + ' (' + c.area + ')'; }).join(', ') + '.\n' +
    (p.notas ? 'Notas que ya tenía la tarea: ' + String(p.notas).slice(0, 800) + '\n' : '') +
    'Lo que dictó o escribió Gustavo:\n«' + texto.slice(0, 2000) + '»';
  const propias = EX_TAR_TOOLS_PROPIAS, deCop = EX_COP_TOOLS.filter(function (t) { return EX_TAR_DE_COP.indexOf(t.name) >= 0; });
  let tools = deCop.concat(propias.slice(0, 2)).concat([Object.assign({}, propias[2], { cache_control: { type: 'ephemeral' } })]);
  const web = { type: haiku ? 'web_search_20250305' : 'web_search_20260209', name: 'web_search', max_uses: 3, user_location: { type: 'approximate', country: 'CL', city: 'Puerto Varas', timezone: 'America/Santiago' } };
  let conWeb = pr.getProperty('TAREAS_WEB') !== 'no';
  const messages = [{ role: 'user', content: pedido }], estado = { acciones: [], usadas: {} };
  const clave = pr.getProperty('ANTHROPIC_API_KEY'); if (!clave) throw new Error('falta ANTHROPIC_API_KEY en las propiedades del script');
  const llamar = function () {
    const cuerpo = { model: modelo, max_tokens: 16000, output_config: { effort: 'medium' }, system: [{ type: 'text', text: EX_TAR_SISTEMA, cache_control: { type: 'ephemeral' } }], tools: conWeb ? [web].concat(tools) : tools, messages: messages };
    const headers = { 'x-api-key': clave, 'anthropic-version': '2023-06-01' };
    if (!haiku) { cuerpo.fallbacks = 'default'; headers['anthropic-beta'] = 'server-side-fallback-2026-07-01'; }
    const r = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', { method: 'post', contentType: 'application/json', muteHttpExceptions: true, payload: JSON.stringify(cuerpo), headers: headers });
    const j = JSON.parse(r.getContentText() || '{}');
    if (r.getResponseCode() !== 200) {
      const msg = (j.error && j.error.message) || '';
      // Si la búsqueda web no está habilitada en la organización, se sigue sin ella.
      if (conWeb && /web_search|web search/i.test(msg)) { conWeb = false; return llamar(); }
      throw new Error('Claude respondió ' + r.getResponseCode() + ': ' + msg.slice(0, 200));
    }
    return j;
  };
  let plan = null, fuentes = {};
  for (let paso = 0; paso < 10 && !plan; paso++) {
    const j = llamar();
    if (j.stop_reason === 'refusal') throw new Error('el modelo no pudo procesar esta tarea');
    messages.push({ role: 'assistant', content: j.content });
    (j.content || []).forEach(function (c) { if (c.type === 'server_tool_use') fuentes.web_search = 1; });
    if (j.stop_reason === 'pause_turn') continue;
    const usos = (j.content || []).filter(function (c) { return c.type === 'tool_use'; });
    if (!usos.length) { messages.push({ role: 'user', content: 'Entrega ahora el plan llamando a entregar_plan.' }); continue; }
    const res = usos.map(function (tu) {
      if (tu.name === 'entregar_plan') { plan = tu.input; return { type: 'tool_result', tool_use_id: tu.id, content: 'Recibido.' }; }
      fuentes[tu.name] = 1;
      try { return { type: 'tool_result', tool_use_id: tu.id, content: String(ex_tarHerramienta_(tu.name, tu.input || {}, estado)) }; }
      catch (e) { return { type: 'tool_result', tool_use_id: tu.id, content: 'Error: ' + e.message, is_error: true }; }
    });
    if (!plan) messages.push({ role: 'user', content: paso >= 7 ? res.concat([{ type: 'text', text: 'Ya tienes suficiente: entrega el plan con entregar_plan.' }]) : res });
  }
  if (!plan) throw new Error('el agente no alcanzó a terminar; inténtalo de nuevo');
  return { ok: true, plan: plan, fuentes: Object.keys(fuentes), modelo: modelo };
}
/* ---------- Buscador inteligente de Compras ---------- */
// Interpreta lo que escribes (aunque sea vago: «lubricante para barro», «pastillas para Levo 4», «casco enduro talla M»),
// busca con varias consultas en los catálogos de todos los proveedores y Specialized, cruza con el stock y las ventas de
// la tienda y con los clientes que lo pidieron, y entrega recomendaciones ordenadas.
const EX_COM_SISTEMA = [
  'Eres el comprador experto de Blackline Puerto Varas (tienda Specialized con taller en Puerto Varas, Chile). Gustavo escribe en el buscador de Compras lo que necesita, a veces vago o con errores. Tu trabajo: entender qué busca de verdad, buscar en todos los catálogos y recomendar qué conviene comprar y a quién.',
  'Cómo trabajar:',
  '1) Interpreta la búsqueda: producto, compatibilidad (modelo de bici, estándar, medida, talla), uso (barro, lluvia, enduro, ruta) y temporada en Puerto Varas. Si es ambigua, cubre las interpretaciones más probables.',
  '2) Busca con buscar_en_proveedores usando VARIAS consultas: sinónimos en español e inglés, marcas que lo fabrican, SKU o nombres comerciales (por ejemplo: «pastillas» → brake pads, Shimano, SRAM, Galfer; «lubricante barro» → wet lube, Muc-Off, Finish Line). Para productos Specialized usa buscar_producto o ficha_specialized_en_vivo.',
  '3) Cruza con la tienda: stock_tienda (si ya hay stock no conviene comprar mucho), ventas_tienda (rotación de los últimos 90 días), clientes_interesados (quién lo pidió: demanda real) y oportunidades_compra / correos_proveedores (promociones vigentes).',
  '4) Recomienda 3 a 8 opciones ordenadas por conveniencia: compatibilidad, disponibilidad, costo para Blackline (costo_blackline cuando exista; si no, precio web menos el descuento del proveedor), margen y rotación. Di cuántas unidades sugieres pedir y por qué.',
  'Reglas: usa solo datos que devuelvan las herramientas; no inventes precios, stock ni SKUs. Si algo no aparece en ningún catálogo, dilo y sugiere a qué proveedor preguntar. Precios en pesos chilenos. Política de marca: la tienda no vende con descuentos ni Cyber; las promociones de proveedores sirven para comprar mejor y vender a precio normal. Español de Chile, directo. Cuando termines, llama a entregar_busqueda.'
].join('\n');
const EX_COM_FINAL = { name: 'entregar_busqueda', description: 'Entrega el resultado final de la búsqueda.', strict: true, input_schema: { type: 'object', additionalProperties: false, required: ['interpretacion', 'recomendaciones', 'no_encontrado', 'siguiente_paso'], properties: {
  interpretacion: { type: 'string', description: 'Qué entendiste que busca, en una frase' },
  recomendaciones: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['producto', 'proveedor', 'precio_web', 'costo', 'disponible', 'url', 'motivo', 'prioridad', 'stock_tienda', 'unidades_sugeridas'], properties: {
    producto: { type: 'string' }, proveedor: { type: 'string' }, precio_web: { type: 'number' }, costo: { type: 'number', description: 'Costo estimado para Blackline; 0 si no se sabe' },
    disponible: { type: 'string' }, url: { type: 'string' }, motivo: { type: 'string', description: 'Por qué conviene (compatibilidad, margen, rotación, clientes que lo piden)' },
    prioridad: { type: 'string', enum: ['alta', 'media', 'baja'] }, stock_tienda: { type: 'string', description: 'Lo que hay hoy en la tienda de este producto o similar' }, unidades_sugeridas: { type: 'integer' } } } },
  no_encontrado: { type: 'string', description: 'Lo que no apareció en ningún catálogo y a quién preguntar; vacío si todo apareció' },
  siguiente_paso: { type: 'string', description: 'La acción concreta que recomiendas (por ejemplo, armar pedido a Outside con X e Y)' } } } };
const EX_COM_TOOLS = ['buscar_en_proveedores', 'buscar_producto', 'ficha_specialized_en_vivo', 'stock_tienda', 'ventas_tienda', 'clientes_interesados', 'oportunidades_compra', 'correos_proveedores'];
function ex_comprasIA_(p) {
  const pr = PropertiesService.getScriptProperties(), clave = pr.getProperty('ANTHROPIC_API_KEY'); if (!clave) throw new Error('falta ANTHROPIC_API_KEY en las propiedades del script');
  const q = String(p.q || '').trim(); if (!q) throw new Error('escribe qué buscas');
  const modelo = pr.getProperty('COMPRAS_MODELO') || 'claude-haiku-5-5', haiku = /haiku/.test(modelo);   // económico; se cambia con COMPRAS_MODELO
  const tools = EX_COP_TOOLS.filter(function (t) { return EX_COM_TOOLS.indexOf(t.name) >= 0; }).concat([Object.assign({}, EX_COM_FINAL, { cache_control: { type: 'ephemeral' } })]);
  const conf = ex_proveedoresConf_().map(function (x) { return x.nombre + ' (' + x.marcas + ', descuento ' + x.desc + '%' + (x.iva ? ', precios ' + x.iva : '') + ')'; }).join('; ');
  const messages = [{ role: 'user', content: 'Hoy es ' + ex_hoyYmd_(ex_tz_()) + '. Proveedores configurados: ' + conf + '.\nBúsqueda de Gustavo: «' + q.slice(0, 500) + '»' }], estado = { acciones: [], usadas: {} };
  let res = null; const fuentes = {};
  for (let paso = 0; paso < 9 && !res; paso++) {
    const cuerpo = { model: modelo, max_tokens: 12000, output_config: { effort: 'medium' }, system: [{ type: 'text', text: EX_COM_SISTEMA, cache_control: { type: 'ephemeral' } }], tools: tools, messages: messages };
    const headers = { 'x-api-key': clave, 'anthropic-version': '2023-06-01' };
    if (!haiku) { cuerpo.fallbacks = 'default'; headers['anthropic-beta'] = 'server-side-fallback-2026-07-01'; }
    const r = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', { method: 'post', contentType: 'application/json', muteHttpExceptions: true, payload: JSON.stringify(cuerpo), headers: headers });
    const j = JSON.parse(r.getContentText() || '{}');
    if (r.getResponseCode() !== 200) throw new Error('Claude respondió ' + r.getResponseCode() + ': ' + ((j.error && j.error.message) || '').slice(0, 200));
    messages.push({ role: 'assistant', content: j.content });
    if (j.stop_reason === 'pause_turn') continue;
    const usos = (j.content || []).filter(function (c) { return c.type === 'tool_use'; });
    if (!usos.length) { messages.push({ role: 'user', content: 'Entrega el resultado con entregar_busqueda.' }); continue; }
    const out = usos.map(function (tu) {
      if (tu.name === 'entregar_busqueda') { res = tu.input; return { type: 'tool_result', tool_use_id: tu.id, content: 'Recibido.' }; }
      fuentes[tu.name] = (fuentes[tu.name] || 0) + 1;
      try { return { type: 'tool_result', tool_use_id: tu.id, content: String(ex_copHerramienta_(tu.name, tu.input || {}, estado)) }; }
      catch (e) { return { type: 'tool_result', tool_use_id: tu.id, content: 'Error: ' + e.message, is_error: true }; }
    });
    if (!res) messages.push({ role: 'user', content: paso >= 6 ? out.concat([{ type: 'text', text: 'Ya tienes suficiente: entrega el resultado con entregar_busqueda.' }]) : out });
  }
  if (!res) throw new Error('el agente no alcanzó a terminar; inténtalo de nuevo');
  return { ok: true, r: res, fuentes: fuentes, modelo: modelo };
}

// Crea un evento en el calendario principal (lo usa el agente de tareas cuando Gustavo lo aprueba).
function ex_eventoCrear_(p) {
  const tz = ex_tz_(), e = p.evento || {};
  if (!/^\d{4}-\d{2}-\d{2}$/.test(e.fecha || '')) throw new Error('fecha inválida');
  const cal = CalendarApp.getDefaultCalendar(), titulo = String(e.titulo || 'Evento').slice(0, 200), desc = String(e.detalle || 'Creado desde el Organizador BlackLine').slice(0, 4000);
  let ev;
  if (/^\d{2}:\d{2}$/.test(e.inicio || '')) {
    const ini = ex_aFecha_(e.fecha, tz, e.inicio), fin = /^\d{2}:\d{2}$/.test(e.fin || '') && e.fin > e.inicio ? ex_aFecha_(e.fecha, tz, e.fin) : new Date(ini.getTime() + 30 * 60000);
    ev = cal.createEvent(titulo, ini, fin, { description: desc });
  } else ev = cal.createAllDayEvent(titulo, ex_aFecha_(e.fecha, tz), { description: desc });
  return { ok: true, id: ev.getId() };
}

/* ---------- Cerebro: cada mañana cruza todas las fuentes y arma el plan del día ---------- */
const EX_HOJA_CEREBRO = 'Cerebro';
const EX_CER_SISTEMA = [
  'Eres el jefe de operaciones virtual de Blackline Puerto Varas (tienda Specialized en Puerto Varas, Chile). Cada mañana lees TODAS las fuentes (tareas, agenda, negociaciones, clientes y WhatsApp, stock de la tienda, web de Specialized Chile, Instagram y contenido, clima, noticias, avisos internos y planillas) y le armas a Gustavo, el encargado, el plan del día: lo que él organizaría en su cabeza, pero hecho por ti, para que solo ejecute.',
  'Contexto del negocio: el fuerte son las e-bikes (Turbo Levo, Levo SL, Kenevo, Vado, Como, Creo) y también MTB, ruta, gravel, urbano, niños, ropa, accesorios y taller; han vendido S-Works en todas las disciplinas. Puerto Varas es muy lluvioso: en invierno se vende menos y desde primavera la demanda sube fuerte; en verano llegan turistas, muchos argentinos. El equipo: Gustavo, 2 vendedores (uno apoya marketing, otro organización física y stock) y 2 mecánicos.',
  'Lo más valioso son los CRUCES entre fuentes, concretos y accionables. Ejemplos: un cliente quiere un producto que en la web de Specialized tiene poco stock → escribirle hoy por disponibilidad (nunca por precio); un proveedor tiene en oferta un producto vigente que la tienda vende → comprarlo ahora para venderlo a precio normal; llueve el día de una salida o test ride → moverlo o confirmar; un producto se está vendiendo rápido en Chile y lo tenemos → contenido y empuje; una negociación sin actividad hace días y su próxima acción venció → retomarla; un lanzamiento de Specialized que los clientes van a preguntar → prepararse y publicar; un día soleado de fin de semana → salida con clientes o contenido en ruta.',
  'Reglas: usa solo datos que estén en el contexto, no inventes. Prioriza por impacto en ventas y urgencia. Sé específico: nombres, productos, tallas, fechas, montos. Máximo 6 prioridades, 6 cruces y 4 alertas. Si una fuente no tiene datos, ignórala sin mencionarla. Español de Chile, directo, frases cortas. Propón avisos internos solo para cosas que el equipo deba saber (eventos, llegadas, cambios de horario, campañas), no para tareas personales.'
].join('\n\n');
const EX_CER_ACCION = { type: 'object', additionalProperties: false, required: ['tipo', 'ref', 'texto'], properties: {
  tipo: { type: 'string', enum: ['ninguna', 'whatsapp', 'abrir_negocio', 'abrir_contacto', 'abrir_tarea', 'crear_tarea', 'disenar_pieza', 'abrir_producto', 'abrir_pestana'] },
  ref: { type: 'string', description: 'ID de contacto, negociación, producto o nombre de pestaña; vacío si no aplica' },
  texto: { type: 'string', description: 'Borrador de mensaje, título de tarea o tema de la pieza; vacío si no aplica' } } };
const EX_CER_ESQUEMA = { type: 'object', additionalProperties: false, required: ['titular', 'resumen', 'foco', 'prioridades', 'cruces', 'alertas', 'contenido', 'clima', 'avisos'], properties: {
  titular: { type: 'string', description: 'Una frase que resume el día (máx. 90 caracteres)' },
  resumen: { type: 'string', description: '2–3 frases con lo más importante del día' },
  foco: { type: 'array', items: { type: 'string' }, description: 'Las 3 cosas que, si se hacen hoy, hacen que el día valga la pena' },
  prioridades: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['titulo', 'por_que', 'area', 'urgencia', 'minutos', 'accion'], properties: {
    titulo: { type: 'string' }, por_que: { type: 'string' }, area: { type: 'string', enum: ['ventas', 'clientes', 'marketing', 'taller', 'equipo', 'stock', 'admin', 'personal'] },
    urgencia: { type: 'string', enum: ['alta', 'media', 'baja'] }, minutos: { type: 'integer' }, accion: EX_CER_ACCION } } },
  cruces: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['titulo', 'detalle', 'fuentes', 'accion'], properties: {
    titulo: { type: 'string' }, detalle: { type: 'string' }, fuentes: { type: 'array', items: { type: 'string', enum: ['tareas', 'agenda', 'negocios', 'clientes', 'whatsapp', 'bsale', 'specialized', 'instagram', 'clima', 'noticias', 'avisos', 'planillas'] } }, accion: EX_CER_ACCION } } },
  alertas: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['titulo', 'detalle', 'nivel'], properties: { titulo: { type: 'string' }, detalle: { type: 'string' }, nivel: { type: 'string', enum: ['info', 'atencion', 'urgente'] } } } },
  contenido: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['tema', 'formato', 'por_que'], properties: { tema: { type: 'string' }, formato: { type: 'string', enum: ['Carrusel', 'Historias', 'Reel', 'Post'] }, por_que: { type: 'string' } } } },
  clima: { type: 'string', description: 'Cómo el clima de hoy y los próximos días afecta ventas, salidas, test rides, eventos o contenido (1–2 frases)' },
  avisos: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['titulo', 'detalle', 'fecha', 'importancia'], properties: { titulo: { type: 'string' }, detalle: { type: 'string' }, fecha: { type: 'string', description: 'yyyy-MM-dd o vacío' }, importancia: { type: 'string', enum: ['normal', 'importante', 'urgente'] } } } }
} };
function ex_cerebroContexto_(extra) {
  const tz = ex_tz_(), hoy = ex_hoyYmd_(tz), partes = [], sec = function (t, f) { try { const s = f(); if (s) partes.push('## ' + t + '\n' + s); } catch (e) { console.log('Cerebro ' + t + ': ' + e.message); } };
  partes.push('Hoy es ' + Utilities.formatDate(new Date(), tz, "EEEE d 'de' MMMM yyyy") + ' (' + hoy + ').');
  sec('Clima Puerto Varas', function () { return ex_climaTexto_(ex_clima_()); });
  sec('Agenda (7 días)', function () { const lim = ex_ymd_(new Date(Date.now() + 7 * 86400000), tz); return int_eventos_(tz).filter(function (e) { return e.fecha <= lim; }).map(function (e) { return e.fecha + ' ' + (e.inicio || 'todo el día') + ' · ' + e.titulo + (e.lugar ? ' @ ' + e.lugar : ''); }).join('\n'); });
  sec('Tareas pendientes', function () { const L = ex_tareasAbiertas_().filter(function (t) { return t.limite && t.limite <= ex_ymd_(new Date(Date.now() + 5 * 86400000), tz); }).sort(function (a, b) { return a.limite.localeCompare(b.limite); }); return L.slice(0, 40).map(function (t) { return (t.limite < hoy ? 'VENCIDA ' : '') + t.limite + ' · ' + t.tarea + ' [' + t.categoria + (t.estado ? ', ' + t.estado : '') + ']'; }).join('\n'); });
  sec('Negociaciones abiertas', function () { return ex_leerNegocios_().negocios.filter(function (n) { return n.estado === 'Abierta'; }).slice(0, 30).map(function (n) { return n.id + ' · ' + n.titulo + ' · ' + n.etapa + ' · $' + n.valor + ' · contacto ' + n.contacto + ' · próxima: ' + (n.proxima || '—') + ' ' + (n.fechaProx || '') + ' · última actividad ' + (n.actividad || '—'); }).join('\n'); });
  sec('WhatsApp: esperan respuesta', function () { return ex_waEsperando_(5).slice(0, 15).map(function (w) { return w.id + ' · ' + w.nombre + ' · hace ' + w.hace_h + ' h: "' + w.mensaje + '"'; }).join('\n'); });
  sec('Clientes con mayor probabilidad (perfiles)', function () { return ex_perfilesLista_().filter(function (p) { return p.prob >= 40 && /oportunidad|lead_activo|cliente_nuevo/.test(p.ciclo || ''); }).sort(function (a, b) { return b.prob - a.prob; }).slice(0, 15).map(function (p) { return p.id + ' · ' + p.nombre + ' · ' + p.ciclo + ' · ' + p.prob + '% · intereses: ' + ((p.p && p.p.intereses) || []).join(', ') + (p.p && p.p.talla ? ' · talla ' + p.p.talla : ''); }).join('\n'); });
  sec('Ventas de la tienda (Bsale)', function () { if (!ex_bsaleToken_()) return ''; const r = ex_bsaleVentasResumen_(); if (!r.activo || r.vacio) return ''; return 'Hoy $' + r.hoy + ' · semana $' + r.semana + ' · mes $' + r.mes + ' (mes anterior a la misma fecha $' + r.mes_anterior_a_la_fecha + ', mismo mes del año pasado $' + r.mismo_mes_anio_anterior + ').\nMás vendido 30 días: ' + r.top30.slice(0, 8).map(function (x) { return x.producto + ' (' + x.unidades + ' u)'; }).join('; ') + '\nReponer pronto (cobertura ≤ 30 días): ' + r.reponer.slice(0, 8).map(function (x) { return x.producto + ' (' + x.stock + ' u, ' + x.cobertura_dias + ' días)'; }).join('; ') + '\nStock quieto (sin ventas en 90 días): ' + r.quietos.slice(0, 8).map(function (x) { return x.producto + ' (' + x.stock + ' u)'; }).join('; '); });
  sec('Stock de la tienda (Bsale): arribos y crítico', function () { const b = ex_bsaleResumen_(); if (!b) return ''; const L = b.items.filter(function (x) { return x.l || x.c; }).slice(0, 30); return L.map(function (x) { return x.p + ' ' + x.v + ': ' + x.s + (x.l ? ' (llegó ' + x.l + ')' : '') + (x.c ? ' (crítico ' + x.c + ')' : ''); }).join('\n'); });
  sec('Specialized Chile (web)', function () {
    const r = ex_spzResumen_(); if (!r.activo) return '';
    const f = function (x) { return x.nombre + (x.oferta ? ' OFERTA $' + x.oferta + ' (antes $' + x.precio + ')' : ' $' + x.precio) + (x.stock !== null && x.stock !== undefined ? ' · stock Chile ' + x.stock : '') + (x.bajas14 ? ' · ' + x.bajas14 + ' vendidas en 14 días' : ''); };
    return ['Más vendidos en Chile (bajas de stock 14 días): ' + r.calientes.slice(0, 8).map(f).join('; '), 'Ofertas: ' + r.ofertas.slice(0, 8).map(f).join('; '), 'Novedades: ' + r.nuevos.slice(0, 6).map(f).join('; '), 'Poco stock en Chile: ' + r.pocoStock.slice(0, 8).map(function (x) { return x.nombre + ' (' + x.tallas + ')'; }).join('; '), 'Lanzamientos y campañas en la portada: ' + r.lanzamientos.join(', ')].join('\n');
  });
  sec('Interesados en productos con oferta o poco stock', function () {
    const r = ex_spzResumen_(); if (!r.activo) return '';
    const out = [];
    r.ofertas.slice(0, 10).concat(r.pocoStock.slice(0, 10)).forEach(function (x) { const I = ex_interesados_(x.familia || x.nombre, 5); if (I.length) out.push(x.nombre + ' → ' + I.map(function (i) { return i.nombre + ' (' + i.id + (i.talla ? ', talla ' + i.talla : '') + ')'; }).join(', ')); });
    return out.join('\n');
  });
  sec('Compras: oportunidades en proveedores (interno, no se comunica a clientes)', function () { return ex_provOportunidades_(8).map(function (o) { return o.proveedor + ' · ' + o.nombre + ': oferta $' + o.precio + ' (normal $' + o.normal + ') → margen ' + o.margenOferta + '% vs ' + o.desc + '% habitual' + (o.vende ? ' · la tienda lo vende' : '') + (o.piden ? ' · lo piden clientes' : '') + (o.diasOferta != null ? ' · lleva ' + o.diasOferta + ' días' : ''); }).join('\n'); });
  sec('Correos de proveedores (14 días)', function () { const h = ex_ymd_(new Date(Date.now() - 14 * 86400000)); return (ex_provCorreos_(false).items || []).filter(function (c) { return c.fecha >= h; }).slice(0, 10).map(function (c) { return c.fecha + ' · ' + c.proveedor + ': ' + c.asunto; }).join('\n'); });
  sec('Instagram y contenido', function () { return ex_copHerramienta_('ver_instagram', {}, { acciones: [] }); });
  sec('Noticias', function () { return ex_noticias_(false).items.map(function (x) { return '[' + x.fuente + '] ' + x.titulo + (x.por_que ? ' — ' + x.por_que : ''); }).join('\n'); });
  sec('Avisos internos activos', function () { return ex_avisos_({}).items.map(function (a) { return (a.fecha || a.desde) + ' · ' + a.titulo + ': ' + a.detalle.slice(0, 160); }).join('\n'); });
  sec('Planillas conectadas', ex_fuentesResumen_);
  if (extra) partes.push('## Desde la app\n' + String(extra).slice(0, 6000));
  return partes.join('\n\n');
}
function ex_cerebro_(p) {
  p = p || {};
  const sh = ex_hojaCab_(EX_HOJA_CEREBRO, ['Fecha', 'Generado', 'Plan (JSON)']), tz = ex_tz_(), hoy = ex_hoyYmd_(tz);
  const leer = function () { const n = sh.getLastRow() - 1; if (n < 1) return null; const r = sh.getRange(sh.getLastRow(), 1, 1, 3).getValues()[0]; try { return { fecha: r[0] instanceof Date ? ex_ymd_(r[0], tz) : String(r[0]), generado: r[1] instanceof Date ? r[1].toISOString() : String(r[1]), plan: JSON.parse(r[2]) }; } catch (e) { return null; } };
  const ult = leer();
  if (!p.forzar && ult && ult.fecha === hoy) return Object.assign({ ok: true }, ult);
  if (!p.forzar && !p.generar) return Object.assign({ ok: true, pendiente: true }, ult || {});
  const plan = ex_llamarClaude_(ex_cerebroContexto_(p.contexto), EX_CER_SISTEMA, EX_CER_ESQUEMA);
  sh.appendRow([hoy, new Date(), JSON.stringify(plan)]);
  if (sh.getLastRow() > 120) sh.deleteRows(2, sh.getLastRow() - 100);
  (plan.avisos || []).slice(0, 3).forEach(function (a) { try { ex_avisoAuto_(a.titulo, a.detalle, a.importancia, a.fecha); } catch (e) {} });
  return { ok: true, fecha: hoy, generado: new Date().toISOString(), plan: plan };
}
// Cada hora: a partir de las 7:00 genera el plan del día una vez (si hay clave de Claude).
function ex_rondaCerebro_() {
  const pr = PropertiesService.getScriptProperties(), tz = ex_tz_(), hoy = ex_hoyYmd_(tz), hora = +Utilities.formatDate(new Date(), tz, 'H');
  if (!pr.getProperty('ANTHROPIC_API_KEY') || hora < 7 || pr.getProperty('EX_CEREBRO_DIA') === hoy) return;
  pr.setProperty('EX_CEREBRO_DIA', hoy);
  ex_cerebro_({ generar: true });
}
function ex_contextoGlobal_(p) {
  // Para la app: todo lo externo en una sola llamada (clima, Specialized, noticias, avisos, fuentes y el plan del día).
  const out = { ok: true };
  try { out.clima = ex_clima_(); } catch (e) { out.climaError = e.message; }
  try { out.specialized = ex_spzResumen_(); } catch (e) { out.specializedError = e.message; }
  try { out.noticias = ex_noticias_(false); } catch (e) { out.noticiasError = e.message; }
  try { out.avisos = ex_avisos_({}).items; } catch (e) { out.avisos = []; }
  try { out.compras = { oportunidades: ex_provOportunidades_(10), correosPromo: (ex_provCorreos_(false).items || []).filter(function (c) { return c.promo; }).slice(0, 6) }; } catch (e) {}
  try { out.fuentes = ex_fuentesLista_().map(function (f) { return { id: f.id, nombre: f.nombre, tipo: f.tipo, carpeta: !!f.carpeta, descripcion: f.descripcion || '' }; }); } catch (e) { out.fuentes = []; }
  try { const c = ex_cerebro_({}); out.cerebro = c.plan ? c : null; } catch (e) { out.cerebroError = e.message; }
  return out;
}

// Ejecútala una vez después de pegar esta versión: crea las hojas y carpetas nuevas, pide los permisos
// (Drive y otras planillas) y hace la primera lectura de Specialized y de las noticias.
function autorizarCerebro() {
  // Si falta el permiso de Drive, sigue con lo demás y avisa (solo la carpeta "Fuentes" necesita Drive).
  let drive = true;
  try { ex_carpetaFuentes_(true); try { ex_carpetaBanco_(); } catch (e) {} }
  catch (e) { drive = false; console.log('⚠️ Falta el permiso de Google Drive: vuelve a ejecutar y, en la pantalla de Google, marca «Seleccionar todo» (incluida la casilla de Google Drive). Lo demás sigue funcionando.'); }
  ex_hojaCab_(EX_HOJA_AVISOS, EX_CAB_AVISOS);
  try { SpreadsheetApp.openById(SpreadsheetApp.getActive().getId()); } catch (e) { console.log('⚠️ Falta el permiso para leer otras planillas (sirve para conectar tus planillas como fuentes).'); }
  try { const r = ex_spzSinc_(); console.log('Specialized: ' + r.productos + ' productos' + (r.errores.length ? ' · avisos: ' + r.errores.join(', ') : '')); const s = ex_spzRondaStock_(12); console.log('Stock por talla revisado en ' + s.revisados + ' bicis.'); } catch (e) { console.log('Specialized: ' + e.message); }
  ['garmin', 'sportvibes'].forEach(function (id) { try { const r = ex_provSinc_(id); console.log('Proveedor ' + id + ': ' + r.productos + ' productos, ' + r.ofertas + ' en oferta'); } catch (e) { console.log('Proveedor ' + id + ': ' + e.message); } });
  try { const n = ex_noticias_(true); console.log('Noticias: ' + n.items.length + ' destacadas de ' + n.total); } catch (e) { console.log('Noticias: ' + e.message); }
  try { console.log('Clima: ' + ex_climaTexto_(ex_clima_()).split('\n')[0]); } catch (e) { console.log('Clima: ' + e.message); }
  if (drive) { try { console.log('Carpeta de fuentes: ' + ex_carpetaFuentes_(false).getUrl()); } catch (e) {} }
  ex_instalarTriggers_();
  console.log('Listo. Ahora: Implementar → Administrar implementaciones → ✏️ → Nueva versión.');
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
function ex_tareaHoraria() {
  if (!ex_cuentaVigente_()) return;
  ex_conLock_(ex_sincCalendario_);
  try { ex_rondaPublicar_(); } catch (e) { console.log('Publicar: ' + e.message); }
  try { ex_spzRonda_(); } catch (e) { console.log('Specialized: ' + e.message); }
  try { ex_rondaProveedores_(); } catch (e) { console.log('Proveedores: ' + e.message); }
  try { ex_rondaCerebro_(); } catch (e) { console.log('Cerebro: ' + e.message); }
  try { ex_fotosSync_(90000); } catch (e) { console.log('Fotos: ' + e.message); }
  if (ex_bsaleToken_()) { try { ex_bsaleVentasSinc_(150000); } catch (e) { console.log('Bsale ventas: ' + e.message); } }
  try { const pr = PropertiesService.getScriptProperties(), u = +pr.getProperty('EX_BIB_SINC') || 0; if (Date.now() - u > 12 * 3600000) { pr.setProperty('EX_BIB_SINC', String(Date.now())); ex_bibliotecaSinc_(); } } catch (e) { console.log('Biblioteca: ' + e.message); }
}
function ex_tareaBase() {
  if (!ex_cuentaVigente_()) return;
  ex_conLock_(ex_escanearBase_);
  if (ex_bsaleToken_()) { try { ex_bsaleCatalogo_(); ex_bsaleSincStock_(); } catch (e) { console.log('Bsale: ' + e.message); } }   // catálogo y stock (arribos, stock crítico)
  const pr = PropertiesService.getScriptProperties();
  if (pr.getProperty('IG_TOKEN')) {
    if (String(pr.getProperty('EX_IG_SINC') || '').slice(0, 10) !== new Date().toISOString().slice(0, 10)) { try { ex_igSinc_(); } catch (e) { console.log('Instagram: ' + e.message); } }
    else { try { ex_igSincHistorias_(); } catch (e) { console.log('Historias: ' + e.message); } }   // las historias duran 24 h: se revisan cada 6 h
  }
}
function ex_tareaAgente() {
  if (!ex_cuentaVigente_()) return;
  ex_rondaAgente_(); ex_rondaPerfiles_();
  try { ex_describirFotos_(90000); } catch (e) { console.log('Fotos IA: ' + e.message); }
}

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

// Eventos entre dos fechas (yyyy-MM-dd), para el calendario del mes y del año. Máximo 400 días.
function int_eventosRango_(tz, desde, hasta) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(desde) || !/^\d{4}-\d{2}-\d{2}$/.test(hasta)) throw new Error('fechas inválidas');
  const ini = ex_aFecha_(desde, tz), fin = new Date(Math.min(ex_aFecha_(hasta, tz).getTime() + 86400000, ini.getTime() + 400 * 86400000));
  const propio = PropertiesService.getScriptProperties().getProperty('EX_CAL_ID'), out = [];
  CalendarApp.getAllCalendars().forEach(function (cal) {
    const id = cal.getId();
    if (id === propio || cal.isHidden() || /#holiday@|#contacts@|addressbook#/.test(id)) return;
    cal.getEvents(ini, fin).forEach(function (e) {
      try { if (e.getMyStatus() === CalendarApp.GuestStatus.NO) return; } catch (x) {}
      const td = e.isAllDayEvent(), a = e.getStartTime(), b = e.getEndTime();
      out.push({ titulo: e.getTitle() || '(sin título)', fecha: Utilities.formatDate(a, tz, 'yyyy-MM-dd'), fechaFin: Utilities.formatDate(new Date(b.getTime() - (td ? 1 : 0)), tz, 'yyyy-MM-dd'), inicio: td ? '' : Utilities.formatDate(a, tz, 'HH:mm'), fin: td ? '' : Utilities.formatDate(b, tz, 'HH:mm'), todoElDia: td, lugar: e.getLocation() || '', calendario: cal.getName(), color: cal.getColor() || '' });
    });
  });
  out.sort(function (x, y) { return (x.fecha + (x.inicio || '00:00')).localeCompare(y.fecha + (y.inicio || '00:00')); });
  return out.slice(0, 1500);
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
