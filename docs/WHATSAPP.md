# 💬🧠 WhatsApp Business + Agente de ventas IA · Organizador BlackLine

> **Estado actual (octubre 2026):** Kommo ya está desconectado. Telnyx lanzó la coexistencia el 7 de octubre, pero todavía no aparece en tu cuenta (el caso está en su soporte). **Mientras tanto, se conecta con Dualhook** (sección siguiente). Cuando Telnyx la active, se puede cambiar.

Con esta conexión, el organizador funciona como un **asistente de ventas que lee tu WhatsApp Business y lo organiza como lo harías tú**. **Nunca escribe a tus clientes.** Tú sigues respondiendo desde el teléfono como siempre.

**Con cada mensaje (al instante):**
- El cliente se crea o actualiza en **📇 Base**, con su nombre de WhatsApp y su teléfono.
- El mensaje queda en su **historial**, también lo que tú respondes desde la app del teléfono.
- Si pregunta por precio, stock, talla, cuotas, test ride o un modelo, se abre una **negociación nueva** en **🤝 Negocios**.

**Cada 10 minutos, el agente de IA (Claude) lee las conversaciones con mensajes nuevos:**
- **Resume** qué quiere la persona y en qué quedó la conversación.
- **Completa la ficha:** nombre real, tipo (cliente, proveedor…), etiquetas (modelo, talla, uso) y datos clave (presupuesto, plazo, objeciones, quién más decide).
- **Crea o avanza la negociación** según la conversación. Si cree que el cliente compró o que la venta se perdió, **no lo marca solo**: te lo deja como próxima acción para que lo confirmes.
- **Agenda como tareas lo conversado**, con recordatorio en tu calendario. Por ejemplo, de *"te mando la cotización mañana"* sale una tarea para mañana, y de *"paso el sábado a las 11"* sale un test ride el sábado a las 11:00.
- **Avisa si el cliente espera respuesta** y te deja una **idea de respuesta**. Con un toque abres WhatsApp con ese texto, y tú decides si lo envías.

**Lo que registras tú:** lo que pasa fuera de WhatsApp. Si el cliente compra en la tienda, abres su negociación y tocas **🏆 Ganada**.

---

## Cómo funciona

```
Cliente ──► WhatsApp Business (tu teléfono, sin cambios)
                  │  coexistencia (conexión oficial de Meta, vía Telnyx)
                  ▼
               Telnyx ──► Puente (Cloudflare Worker, gratis) ──► Tu Apps Script ──► Tu Sheet
                                                                      │
                                                     cada 10 min ──► Claude (agente IA)
                                                                      │
                                                                      ▼
                                                               App Organizador
```

## Costos aproximados

| Parte | Costo |
|---|---|
| Telnyx | ~US$0,004 por mensaje, sin mensualidad (≈ US$1–4 al mes en una tienda). Revisa el precio actual en telnyx.com. |
| Meta | Recibir mensajes y lo que envías desde la app del teléfono: gratis |
| Puente en Cloudflare | Gratis |
| Agente IA, **modo económico (por defecto): Claude Haiku 5.5** | ~US$0,001–0,003 por conversación analizada. Con unas 15 conversaciones activas al día es **menos de US$1–2 al mes**. El agente agrupa los mensajes de cada conversación, no los analiza uno por uno. |
| Agente IA con más capacidad: Claude Sonnet 5.5 u Opus 5.5 | Infieren mejor en conversaciones largas o ambiguas. Opus cuesta ~US$0,03–0,08 por conversación (≈ US$15–35 al mes). Se cambia con una línea (Paso 5). |

---

## Conectar con Dualhook (camino actual, 30 min)

Dualhook conecta tu número a la API oficial de Meta **sin sacarlo de la app WhatsApp Business** (coexistencia). Meta envía los mensajes **directo a tu puente**; Dualhook no los guarda. Cuesta **US$12 al mes** (1 número), con **14 días de prueba**; pide tarjeta. No cobra por mensaje.

**1 · Crear el puente en Cloudflare** (si no lo tienes; ver Paso 3 más abajo para el detalle)
1. dash.cloudflare.com → **Workers & Pages → Create → Create Worker** → nombre `organizador-wa` → **Deploy** → **Edit code** → pega [`whatsapp-puente/worker.js`](../whatsapp-puente/worker.js) → **Deploy**.
2. **Settings → Variables and Secrets** (usa **Secret** en las claves):

   | Nombre | Valor |
   |---|---|
   | `APPS_SCRIPT_URL` | tu link `/exec`, el mismo de la app |
   | `APP_TOKEN` | la clave del organizador |
   | `VERIFY_TOKEN` | una palabra que inventes (ej. `blackline-pv-2026`) |
   | `URL_KEY` | una clave larga al azar que inventes, solo letras y números (unos 30 caracteres) |

   **No pongas** `APP_SECRET` ni `TELNYX_PUBLIC_KEY`: con Dualhook la firma es de su app y no se puede validar; la seguridad la da `URL_KEY`.
3. Tu link de webhook queda así: `https://organizador-wa.<tu-cuenta>.workers.dev/<URL_KEY>`. Ábrelo: debe decir **"puente de WhatsApp activo ✓"**.

**2 · Actualizar el script:** pega el Extras.gs nuevo (versión 2026-11-19 o posterior) y crea una **Nueva versión** de la implementación.

**3 · Conectar en Dualhook**
1. Crea la cuenta en **dualhook.com** y elige el plan **Developer**.
2. **Antes de abrir la ventana de Meta**, Dualhook te pide el **Webhook URL** y el **Verify token**: pega el link del paso 1.3 y el mismo `VERIFY_TOKEN`.
3. En la ventana de Meta, elige el portafolio **- BlackLine -** (después es difícil cambiarlo) y la opción de **conectar tu app WhatsApp Business existente**. **Nunca** elijas verificar un número nuevo por SMS: eso saca el número de la app.
4. En el celular, abre el mensaje de Meta en WhatsApp Business → **Conectar** → confirma.
5. Cuando pregunte, elige **compartir el historial** (hasta 6 meses). Deja WhatsApp Business abierto un rato mientras Meta lo prepara (hasta 24 h).

**4 · Revisar:** en la app, **Ajustes → 💬 Historial de WhatsApp** muestra el avance. En Dualhook, la pestaña **Debug** de la conexión muestra si los avisos llegan a tu puente. En Cloudflare, **Worker → Logs**.

**Para tener en cuenta**
- Abre WhatsApp Business en el teléfono **al menos cada 13 días**; si no, Meta puede cortar la coexistencia (Dualhook avisa antes). No desinstales la app.
- Las listas de difusión quedan solo de lectura y WhatsApp Web se desvincula (se vuelve a vincular).
- Clientes con nombre de usuario de WhatsApp pueden llegar **sin teléfono** (Meta usa un identificador tipo `CL.123…`). La app los guarda igual y los une al contacto cuando aparezca su número.
- **Cambiar a Telnyx más adelante:** en el celular, **Ajustes → Cuenta → Plataforma de WhatsApp Business → Dualhook → Desconectar**; luego cancela Dualhook y conecta con Telnyx. En el puente cambias `URL_KEY` por `TELNYX_PUBLIC_KEY`. El historial ya importado queda en tu planilla.

## Paso 1 · Requisitos (5 min)

- **WhatsApp Business actualizado**, versión 2.24.17 o superior, usado **al menos 7 días** con este número.
- Una **cuenta de Meta Business** (business.facebook.com) para Blackline, con su **página de Facebook**.
- El historial antiguo **no** llega por Telnyx. Para las negociaciones en curso, **importa esos chats a mano** (ver *Importar chats antiguos*, más abajo).
- Ojo con lo que cambia en la app del teléfono:
  - Las **listas de difusión** quedan solo de lectura.
  - Se desactivan los mensajes temporales, los de "ver una vez" y la ubicación en tiempo real.
  - WhatsApp Web se desvincula y hay que volver a conectarlo.

## Paso 2 · Conectar tu número en Telnyx (20 min)

1. Crea una cuenta en **telnyx.com**, verifica tu identidad y **recarga saldo**. Telnyx funciona con prepago.
2. En el portal, entra a **Messaging → WhatsApp** y elige conectar un número de la **app de WhatsApp Business** (coexistencia). Se abre el registro de Meta.
3. Inicia sesión con Facebook, elige la cuenta **Meta Business de Blackline** y la opción **"Conectar una cuenta existente de WhatsApp Business"**. Ingresa tu número y confirma desde el teléfono con el código o el QR que aparece en la app.
4. Telnyx te asigna un **Messaging Profile**. Lo usas en el Paso 4.

Los nombres exactos de los menús de Telnyx pueden variar. Si algo no calza, mándame un pantallazo.

## Paso 3 · Crear el puente en Cloudflare (10 min)

1. Crea una cuenta gratis en **dash.cloudflare.com**.
2. **Workers & Pages → Create → Create Worker** → nombre `organizador-wa` → **Deploy**.
3. **Edit code**: borra todo, pega [`whatsapp-puente/worker.js`](../whatsapp-puente/worker.js) → **Deploy**.
4. **Settings → Variables and Secrets**. Agrega estas variables, usando **Secret** para las claves:

   | Nombre | Valor |
   |---|---|
   | `APPS_SCRIPT_URL` | tu link `/exec`, el mismo de la app |
   | `APP_TOKEN` | la clave del organizador |
   | `TELNYX_PUBLIC_KEY` | en Telnyx: **Account Settings → Keys & Credentials → Public Key** |

5. Abre el link del Worker (`https://organizador-wa.<tu-cuenta>.workers.dev`). Debe decir **"puente de WhatsApp activo ✓"**.

## Paso 4 · Webhook en Telnyx (2 min)

En **Messaging → Messaging Profiles → (tu perfil) → Inbound / Webhook URL**, pega el link del Worker y guarda.

## Paso 5 · Activar el agente de IA (10 min)

1. Crea una cuenta en **console.anthropic.com** y, en **Billing**, carga crédito. Puedes poner un límite de gasto mensual en **Limits**.
2. En **API Keys → Create Key**, copia la clave (empieza con `sk-ant-`). **No la compartas con nadie, tampoco en este chat.**
3. En Apps Script: **⚙️ Configuración del proyecto → Propiedades del script → Agregar propiedad**:
   - `ANTHROPIC_API_KEY` = tu clave.
   - *(Opcional, más capacidad)* `AGENTE_MODELO` = `claude-sonnet-5-5` o `claude-opus-5-5`. Sin esta propiedad, el agente usa Claude Haiku 5.5, el modo económico.
4. **Actualiza el script Extras:** abre Extras.gs, presiona **Ctrl+A**, pega el código nuevo y guarda.
5. Ejecuta **autorizarExtras** y acepta los permisos, incluido el de "conectarse a servicios externos". Esto programa al agente cada 10 minutos.
6. **Implementar → Administrar implementaciones → ✏️ → Nueva versión → Implementar**.

## Paso 6 · Probar

Desde otro teléfono, escribe al WhatsApp de la tienda: *"Hola, ¿tienen la Turbo Vado talla M? Mido 1,78 y la quiero para ir al trabajo"*. Respóndele desde la app: *"¡Sí! Pasa el sábado a las 11 a probarla"*.

- **Al instante:** el contacto aparece en 📇 Base y la negociación en 🤝 Negocios.
- **En unos 15 minutos:** el agente completa la ficha (Turbo Vado, ciudad, 1,78 m), mueve la negociación a "Prueba / visita" y crea la tarea del test ride para el sábado a las 11:00. En la ficha del contacto verás "🧠 Lo que entendió el agente".
- **Para no esperar:** en la ficha del contacto toca **🧠 Analizar ahora**.

---

## Importar todos tus chats (importación masiva)

Con esta importación, el agente ordena toda tu base de una vez. Lee cada conversación y arma el perfil de cada contacto:
- **Quién es:** prospecto, cliente, recurrente, solo taller, club, proveedor o personal.
- **Cómo anda en bici:** experiencia, gama y disciplinas.
- **Qué tiene y qué busca:** bicis que tiene, talla, presupuesto, intereses y objeciones.
- **Su historial:** compras.
- **Métricas calculadas de los mensajes:** frecuencia de consulta, días desde su último mensaje y tu tiempo de respuesta.
- **Puntajes:** probabilidad de venta (0 a 100) y potencial (A, B o C).

**Reglas para no llenar la app de cosas inútiles:**
- **No crea tareas.**
- **Abre negociaciones solo con una opción real de venta** y si el cliente escribió en los **últimos 60 días**.
- **Lo antiguo queda como oportunidad** para el momento justo. Las verás en Contactos → *A quién escribir* y en Hoy → paso 3:
  - llegó a Bsale lo que pidió, o quedan pocas unidades;
  - mantención a los 6 meses de su compra;
  - batería antes de que venza la garantía de 2 años;
  - upgrade o parte de pago;
  - reactivar a un cliente valioso.
- **Lo que corriges a mano en la ficha (pestaña Perfil) no se vuelve a pisar.** Los perfiles dudosos quedan en la lista *Por revisar*.

**Cómo exportar muchos chats:** WhatsApp exporta de a un chat.
1. En cada chat: **⋮ → Más → Exportar chat → Sin archivos → Guardar en Drive**. Guárdalos todos en la **misma carpeta**.
2. En el PC, abre esa carpeta en Drive y descárgala completa. Drive baja un .zip con todos los chats adentro.
3. En la app: **Contactos → Importar chats** y elige ese .zip (o todos los archivos sueltos a la vez).
4. Revisa el resumen, confirma quién eres tú y toca **Importar y analizar**.

La app sube los chats y el agente los analiza de a 3 a la vez. Si cierras la app, el servidor sigue solo, unos 25 chats cada 10 minutos.

**Costo:** lo cobra Anthropic (la API de Claude) desde el crédito que cargaste en console.anthropic.com. Con Claude Haiku 5.5 (el modo por defecto) es del orden de US$0,002 por chat: unos US$1 por cada 500 chats.

**Privacidad:** el 1 de diciembre de 2026 entra en vigor la Ley 21.719 de datos personales. Guarda solo lo necesario, borra los datos de quien lo pida y pide permiso antes de enviar promociones por WhatsApp.

## Historial automático de 6 meses (coexistencia)

Al conectar tu número en Telnyx en modo **coexistencia** (sigues usando la app WhatsApp Business del teléfono), Meta te pregunta en el teléfono si quieres **compartir el historial de chats**. Si aceptas, Meta envía hasta **6 meses** de conversaciones por el mismo webhook, por partes, durante las horas siguientes. No hay que exportar nada a mano.

**Qué hace la app (Extras.gs nivel 24 o superior):**
- Guarda cada mensaje del historial en la ficha del contacto, con su dirección (cliente o tienda).
- Crea los contactos que no existían, con el nombre que trae WhatsApp.
- **No crea negociaciones ni tareas** por mensajes antiguos.
- Encola cada contacto para el **perfilado masivo** (las mismas reglas de la importación masiva de arriba).
- Ignora los envíos repetidos: si Meta manda dos veces lo mismo, no se duplica.

**Dónde ver el avance:** Ajustes → **💬 Historial de WhatsApp**: mensajes y chats recibidos, porcentaje de avance y fecha del último envío. Si dijiste que no en el teléfono, ahí aparece el aviso de que se rechazó compartir.

**Importante:**
- Hay que aceptar **«Compartir historial»** en el teléfono en el momento de conectar el número. Si lo rechazas, para repetirlo hay que desconectar y volver a conectar el número.
- Depende de que Telnyx reenvíe el evento de historial al webhook. Si después de unas horas el contador sigue en 0, usa la importación masiva por exportación (sección anterior) y consulta al soporte de Telnyx por los eventos «history» de coexistencia.

## Importar chats antiguos (negociaciones en curso)

El agente lee todo lo que está guardado de cada cliente: los chats importados más los mensajes nuevos que lleguen por Telnyx. Para sumar una conversación anterior a la conexión:

**Desde el teléfono (lo más rápido):**
1. En WhatsApp Business, abre el chat → **⋮ → Más → Exportar chat → Sin archivos**.
2. En la lista para compartir, elige **Organizador**. La app tiene que estar instalada.
3. La app muestra cuántos mensajes encontró. Confirma **quién eres tú** en el chat y elige el cliente (o crea uno nuevo con su teléfono), luego toca **Importar**.
4. Si el agente está activo, analiza el chat en el momento: completa la ficha, crea o actualiza la negociación y agenda los compromisos que siguen pendientes.

**Desde el PC:** envíate el archivo `.txt` exportado (por ejemplo por correo) y, en la app, entra a **📇 Base → 📥 Importar chat de WhatsApp** o al botón **📥 Importar chat** de la ficha del cliente.

Si importas el mismo chat de nuevo más adelante, solo se agregan los mensajes nuevos. Cuando el cliente vuelva a escribir por WhatsApp, su mensaje se une al mismo contacto gracias al teléfono.

---

## Solución de problemas

- **No llegan mensajes al Sheet.** Revisa en Cloudflare: Worker → **Logs**.
  - `firma de Telnyx inválida`: revisa `TELNYX_PUBLIC_KEY`.
  - `auth`: la clave `APP_TOKEN` no coincide.
  - `op desconocida`: actualiza el script (Paso 5).
- **El agente no analiza.** En Apps Script → **Ejecuciones**, busca `ex_tareaAgente`. Si dice `falta ANTHROPIC_API_KEY`, revisa el Paso 5. Si dice `Claude respondió 401`, la clave es inválida. Si dice `429` o `credit`, falta crédito en la consola de Anthropic.
- **Un contacto no es cliente.** En su ficha, márcalo **🚫 Ignorar**. El agente también marca solo el spam y las conversaciones personales.
- **Quiero cambiar el comportamiento del agente.** Sus instrucciones están en `EX_AG_SISTEMA`, en `apps-script/Extras.gs`.

## Privacidad

- Los mensajes quedan en **tu** Google Sheet. El puente no guarda nada.
- Para analizarlas, las conversaciones se envían a la API de Anthropic. Según los términos comerciales de Anthropic, los datos de la API no se usan para entrenar modelos.
- Te recomiendo mencionar en la política de privacidad de blacklinechile.cl que usas herramientas para gestionar las consultas de clientes.
- El agente **no envía mensajes**. Las ideas de respuesta solo las envías tú.

## Alternativa sin proveedor (Meta directo)

Es gratis en plataforma, pero requiere que Blackline se registre como "Tech Provider" en Meta, con verificación, videos y revisión. El puente y el script ya aceptan el formato de Meta (`VERIFY_TOKEN` y `APP_SECRET` en el Worker), por si algún día cambias de camino.
