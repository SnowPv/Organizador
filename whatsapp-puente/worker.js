/**
 * Organizador BlackLine · Puente de WhatsApp (Cloudflare Worker, plan gratuito)
 *
 * Telnyx (o Meta) envía cada mensaje a este Worker; el Worker responde
 * de inmediato y reenvía el mensaje a tu Apps Script, que lo guarda en el Sheet.
 * Apps Script no puede recibir los avisos de Meta directamente (responde con una redirección),
 * por eso existe este puente.
 *
 * Variables a configurar en Cloudflare (Settings → Variables and Secrets):
 *   APPS_SCRIPT_URL  el link /exec de tu Apps Script
 *   APP_TOKEN        la clave del organizador (la misma que usas en la app)
 *   VERIFY_TOKEN     una palabra secreta que inventas y pegas también en Meta («Verify token»)
 *   TELNYX_PUBLIC_KEY  (recomendado con Telnyx) la «Public Key» de tu cuenta Telnyx: valida que el aviso viene de Telnyx
 *   APP_SECRET       (opcional, solo con Meta directo) el «App secret» de tu app de Meta
 *   URL_KEY          (opcional) si tu proveedor no firma los avisos: agrega ?k=ESTA_CLAVE al link del webhook
 */
export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);

    // Verificación inicial que hace Meta al registrar el webhook.
    if (req.method === 'GET') {
      if (url.searchParams.get('hub.mode') === 'subscribe') {
        return url.searchParams.get('hub.verify_token') === env.VERIFY_TOKEN
          ? new Response(url.searchParams.get('hub.challenge') || '', { status: 200 })
          : new Response('verify token incorrecto', { status: 403 });
      }
      return new Response('Organizador BlackLine: puente de WhatsApp activo ✓', { status: 200 });
    }
    if (req.method !== 'POST') return new Response('método no permitido', { status: 405 });

    const cuerpo = await req.text();
    if (env.APP_SECRET && !(await firmaValida(cuerpo, req.headers.get('x-hub-signature-256'), env.APP_SECRET))) {
      return new Response('firma inválida', { status: 401 });
    }
    if (env.TELNYX_PUBLIC_KEY && !(await firmaTelnyx(cuerpo, req.headers, env.TELNYX_PUBLIC_KEY))) {
      return new Response('firma de Telnyx inválida', { status: 401 });
    }
    if (env.URL_KEY && url.searchParams.get('k') !== env.URL_KEY) return new Response('clave inválida', { status: 401 });

    let payload;
    try { payload = JSON.parse(cuerpo); } catch (e) { return new Response('ok', { status: 200 }); }

    // Responder rápido a Meta y reenviar en segundo plano (con un reintento si el Sheet está ocupado).
    ctx.waitUntil(reenviar(env, payload));
    return new Response('ok', { status: 200 });
  }
};

async function reenviar(env, payload) {
  const cuerpo = JSON.stringify({ token: env.APP_TOKEN, action: 'extra', op: 'whatsapp', payload });
  for (let intento = 0; intento < 2; intento++) {
    try {
      const r = await fetch(env.APPS_SCRIPT_URL, { method: 'POST', body: cuerpo, redirect: 'follow' });
      const txt = await r.text();
      if (txt.includes('"ok":true')) return;
      console.log('Apps Script respondió:', txt.slice(0, 300));
    } catch (e) {
      console.log('Error al reenviar:', e.message);
    }
    await new Promise(res => setTimeout(res, 3000));
  }
}

async function firmaValida(cuerpo, cabecera, secreto) {
  if (!cabecera || !cabecera.startsWith('sha256=')) return false;
  const clave = await crypto.subtle.importKey('raw', new TextEncoder().encode(secreto), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const firma = await crypto.subtle.sign('HMAC', clave, new TextEncoder().encode(cuerpo));
  const hex = [...new Uint8Array(firma)].map(b => b.toString(16).padStart(2, '0')).join('');
  const esperada = cabecera.slice(7);
  if (hex.length !== esperada.length) return false;
  let dif = 0;
  for (let i = 0; i < hex.length; i++) dif |= hex.charCodeAt(i) ^ esperada.charCodeAt(i);
  return dif === 0;
}

// Telnyx firma cada aviso con Ed25519 sobre «timestamp|cuerpo» (cabeceras telnyx-signature-ed25519 y telnyx-timestamp).
async function firmaTelnyx(cuerpo, headers, clavePublica) {
  const firma = headers.get('telnyx-signature-ed25519'), ts = headers.get('telnyx-timestamp');
  if (!firma || !ts || Math.abs(Date.now() / 1000 - Number(ts)) > 300) return false;
  const b64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  const datos = new TextEncoder().encode(ts + '|' + cuerpo);
  for (const alg of [{ name: 'Ed25519' }, { name: 'NODE-ED25519', namedCurve: 'NODE-ED25519' }]) {
    try {
      const k = await crypto.subtle.importKey('raw', b64(clavePublica), alg, false, ['verify']);
      return await crypto.subtle.verify(alg.name === 'Ed25519' ? 'Ed25519' : alg, k, b64(firma), datos);
    } catch (e) { /* prueba el siguiente nombre del algoritmo */ }
  }
  return false;
}
