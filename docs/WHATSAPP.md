# 💬 Conectar WhatsApp Business al Organizador BlackLine

Con esta conexión, **cada mensaje de WhatsApp Business entra solo al organizador**:

- El cliente se crea o actualiza en **📇 Base**, con su nombre de WhatsApp y su teléfono.
- El mensaje queda en su **historial**, junto con lo que tú le respondes desde el teléfono.
- Si pregunta por **precio, stock, talla, cuotas, test ride o un modelo** (Levo, Vado, Stumpjumper…), se abre sola una **negociación nueva** en **🤝 Negocios**, con la próxima acción "Responder por WhatsApp".
- Si ya tenía una negociación abierta, esta se marca **con actividad**, y si te escribió y no respondes, el asistente te avisa.
- Lo que pasa fuera de WhatsApp lo sigues registrando tú. Por ejemplo, si el cliente compra en la tienda, abres su negociación y tocas **🏆 Ganada**.

**Tú sigues usando la app de WhatsApp Business en el teléfono como siempre.** Meta llama a esto *coexistencia*: el mismo número funciona en la app y en la conexión oficial al mismo tiempo.

---

## Cómo funciona

```
Cliente ──► WhatsApp Business (tu teléfono, sin cambios)
                  │  (coexistencia, conexión oficial de Meta)
                  ▼
        API de WhatsApp Cloud (Meta) ──► Puente (Cloudflare Worker, gratis)
                                              │
                                              ▼
                            Tu Apps Script ──► Tu Sheet (WhatsApp, Contactos,
                                               Interacciones, Negociaciones)
                                              │
                                              ▼
                                      App Organizador
```

El **puente** existe porque Apps Script no puede recibir directamente los avisos de Meta. El código del puente está en [`whatsapp-puente/worker.js`](../whatsapp-puente/worker.js).

## Costos

| Parte | Costo |
|---|---|
| Recibir mensajes y responder a quien te escribió (ventana de 24 h) | Gratis en Meta |
| Mensajes que **tú inicias** con plantillas (marketing, recordatorios) | Pagado, por mensaje (Meta) |
| Puente en Cloudflare Workers | Gratis (100.000 avisos al día) |
| Apps Script y Google Sheets | Gratis |
| Proveedor autorizado para la coexistencia (camino A) | Depende del proveedor, revisa su precio actual |

---

## Paso 0 · Requisitos (5 min)

1. **WhatsApp Business actualizado**, versión 2.24.17 o superior, en el teléfono de la tienda.
2. El número debe llevar **al menos 7 días de uso** en WhatsApp Business. No sirve un número de WhatsApp personal.
3. Una **cuenta de Meta Business** (business.facebook.com) para Blackline, con una **página de Facebook** de la que seas administrador.
4. En la sección **Verificación de la empresa** de Meta Business, verifica Blackline con el RUT y los documentos de la empresa. No siempre es obligatorio para empezar, pero evita límites.

## Paso 1 · Elegir cómo conectar tu número (coexistencia)

Meta solo permite conectar un número que ya usas en la app a través de su flujo *Embedded Signup* ("conectar cuenta existente de WhatsApp Business"), que ofrecen los **proveedores autorizados**.

**Camino A, recomendado: proveedor autorizado con coexistencia.**
- Elige un proveedor que ofrezca **coexistencia** y que permita configurar **tu propio webhook**, reenviando los avisos en el **formato estándar de Meta**. Por ejemplo: **360dialog**. Otros proveedores, como Telnyx u 8x8, también ofrecen coexistencia, pero pueden usar su propio formato de aviso; avísame si eliges uno de esos y adapto el puente.
- En su panel, elige **"Conectar número existente / WhatsApp Business app"**. Ingresa tu número, escanea el código desde el teléfono y **acepta compartir el historial de chats**. Así se importan también los chats de los últimos meses.
- En la configuración de **webhook** del proveedor, pega el link de tu puente (Paso 2).

**Camino B: directo con Meta, sin proveedor.** Es gratis, pero más técnico. Tendrías que registrarte como proveedor tecnológico y configurar Embedded Signup tú mismo. Lo vemos juntos si prefieres este camino.

**Camino C: número nuevo solo para la API.** Es lo más simple técnicamente, pero ese número **no se puede usar en la app** del teléfono. No lo recomiendo para tu caso.

## Paso 2 · Crear el puente en Cloudflare (10 min)

1. Crea una cuenta gratis en **dash.cloudflare.com**.
2. **Workers & Pages → Create → Create Worker** → nómbralo `organizador-wa` → **Deploy**.
3. **Edit code**: borra todo, pega el contenido de [`whatsapp-puente/worker.js`](../whatsapp-puente/worker.js) → **Deploy**.
4. **Settings → Variables and Secrets → Add**. Crea estas variables, usando **Secret** para las claves:

   | Nombre | Valor |
   |---|---|
   | `APPS_SCRIPT_URL` | tu link `/exec` (el mismo de la app) |
   | `APP_TOKEN` | la clave del organizador |
   | `VERIFY_TOKEN` | una palabra secreta que inventes, por ejemplo `levo-pichijuan-2026` |
   | `APP_SECRET` | *(opcional)* el "App secret" de la app de Meta, si usas el camino B |
   | `URL_KEY` | *(opcional)* si tu proveedor no firma los avisos: inventa una clave y agrega `?k=ESA_CLAVE` al link del webhook |

5. Abre el link del Worker (`https://organizador-wa.<tu-cuenta>.workers.dev`) en el navegador. Debe decir **"puente de WhatsApp activo ✓"**.

## Paso 3 · Conectar el webhook (5 min)

En el panel de tu proveedor, o en Meta: **App → WhatsApp → Configuración → Webhook**.

- **Callback URL:** el link del Worker.
- **Verify token:** el mismo `VERIFY_TOKEN` del Paso 2.
- **Campos a suscribir:** `messages`, `smb_message_echoes` (lo que respondes desde el teléfono), `history` (chats antiguos) y `smb_app_state_sync`.

## Paso 4 · Actualizar el script

En la app aparece **"⬆️ Nueva versión del script"**. Desde el PC son 3 pasos:

1. Abre Extras.gs, presiona **Ctrl+A** y pega el código nuevo con **Ctrl+V**.
2. Ejecuta **autorizarExtras**.
3. **Implementar → Nueva versión**.

## Paso 5 · Probar

Desde otro teléfono, escribe al WhatsApp de la tienda: *"Hola, ¿cuánto vale la Turbo Levo talla M?"*. En menos de un minuto:

- En el Sheet aparece una fila en la hoja **WhatsApp**.
- En **📇 Base** aparece el contacto como **Cliente**.
- En **🤝 Negocios** aparece "*Nombre – Turbo Levo*" en la etapa **Nuevo**, con la próxima acción "Responder por WhatsApp".
- En **⚙️ Ajustes** se lee "WhatsApp Business: Conectado ✓".

---

## Solución de problemas

- **Meta dice que no pudo verificar el webhook.** Revisa que `VERIFY_TOKEN` sea idéntico en los dos lados y que el link del Worker abra bien.
- **El mensaje no aparece en el Sheet.** En Cloudflare: Worker → **Logs**. Si dice `auth`, la clave `APP_TOKEN` no coincide. Si dice `op desconocida`, falta actualizar el script (Paso 4).
- **Aparecen contactos que no son clientes.** En su ficha, marca el tipo **🚫 Ignorar** y no se vuelven a crear.
- **Quiero cambiar qué palabras abren una negociación.** Están en `EX_WA_INTENCION`, al inicio de `apps-script/Extras.gs`.

## Privacidad

Los mensajes quedan solo en **tu** Google Sheet. El puente no guarda nada: recibe y reenvía. No uses esta conexión para enviar mensajes masivos sin permiso del cliente, porque las reglas de Meta lo prohíben y pueden bloquear el número.
