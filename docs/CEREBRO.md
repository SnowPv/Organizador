# El Cerebro: cómo conversan todas las fuentes

El Cerebro es la capa que conecta todo el organizador. Lee todas tus fuentes y las cruza entre sí. Con eso arma tu día para que tú solo ejecutes.

## Qué hace

| Pieza | Qué hace | Dónde la ves |
|---|---|---|
| **Plan del agente** | Cada mañana, desde las 7:00, cruza todas las fuentes. Te deja 3 focos, las prioridades con su acción en un toque, los cruces entre fuentes, las alertas, ideas de contenido y cómo afecta el clima. Puedes regenerarlo cuando quieras. | Inicio (arriba) y Hoy |
| **Radar** | Detecta cruces concretos entre fuentes (ver los ejemplos abajo). | Inicio y Hoy |
| **Copiloto** | Un chat que consulta todas las fuentes con herramientas: Specialized, Bsale, clientes, negociaciones, tareas, agenda, clima, noticias, Instagram y tus planillas. Responde con datos y deja las acciones listas en botones: escribir por WhatsApp, crear una tarea o un aviso, diseñar una pieza. Nunca actúa solo. | Botón ✨ Copiloto en todas las pestañas, o tecla `/` (o Ctrl+K) |
| **Ficha 360 de producto** | Busca por modelo, talla o SKU. Muestra precio, oferta y stock por talla y color en Specialized Chile, el stock de tu tienda, los clientes interesados (con el mensaje listo) y un botón para diseñar contenido. | Inicio → Producto, el Radar o el Copiloto |
| **Clima** | Pronóstico de Puerto Varas: ahora, por hora y a 7 días. Muestra el mejor bloque seco para salir. Marca con 💧 los eventos al aire libre si va a llover. | Inicio, Hoy (en la línea del día) y el detalle al tocar el clima |
| **Avisos de la tienda** | Avisos para el equipo: llegadas, eventos, cambios. Aparecen al abrir la app. El agente también crea avisos solo. | Al abrir la app, Inicio y Hoy |
| **Noticias** | Pinkbike, Vital MTB, Specialized en la prensa y ciclismo en Chile. El agente las filtra y explica por qué te importan. | Inicio y Hoy (un espacio chico) |

**Ejemplos de cruces que detecta el Radar:**
- Un cliente quiere un modelo que entró en oferta.
- Quedan pocas unidades de un modelo en Chile y alguien lo pidió en su talla.
- Llueve el día de un test ride.
- Un fin de semana seco es bueno para una salida.
- Algo se vende rápido en Chile y lo tienes en tienda.
- Hay una oferta que te sirve para cerrar una negociación.
- Salió una noticia de seguridad.

## Specialized Chile (specialized.com/cl)

La app lee la web pública de Specialized igual que un navegador. Solo mira: no compra ni pide nada.

- **Catálogo** (una vez al día): unas 380 referencias entre bicis, cascos, zapatillas, ropa, accesorios y ofertas. Incluye precio, precio de oferta, colores (y cuándo salió un color nuevo) y etiquetas: *nuevo*, *más vendido* y *galardonado*.
- **Stock por talla y color**, con SKU: revisa cada ficha de bici, las e-bikes cada ~3 horas y el resto cada ~12 horas. Es el stock de la bodega de Specialized Chile que muestra la web, y sirve para saber si se puede pedir.
- **Lo que se vende en Chile**: cada vez que el stock de una talla baja, queda registrado. Con eso la app calcula qué se vendió en los últimos 14 días en todo el país.
- **Lanzamientos y campañas** de la portada.

Todo queda en tu planilla, en las hojas `Specialized`, `Specialized stock` y `Specialized movimientos`.

## El B2B de Specialized

El B2B es un portal privado con tu usuario. La app no entra con tu clave ni la guarda, por dos razones:
- un robot con tu usuario puede bloquear la cuenta o romper las condiciones del portal;
- el portal no tiene una conexión oficial para esto.

La forma segura y que funciona hoy:
1. Desde el B2B, exporta lo que necesites consultar (disponibilidad, lista de precios) en Excel o CSV.
2. Déjalo en la carpeta de Drive **Organizador · Fuentes**. Si es Excel, ábrelo y usa *Archivo → Guardar como Hojas de cálculo de Google*.
3. Listo: el Copiloto y el plan del día lo leen solos, solo para consultar, y lo cruzan con Specialized, Bsale y tus clientes.

Pregúntale también a tu representante de Specialized si el B2B tiene una exportación automática o una API para tiendas. Si la hay, se conecta igual que Bsale.

## Tus otras planillas

En Inicio → **Fuentes**, pega el link de cualquier Google Sheet tuyo: metas, proveedores, lista de precios, la planilla que aún no compartes. Agrega una línea de qué contiene. El Copiloto la busca cuando le preguntas, y el plan del día la tiene en cuenta.

## Instalación (una vez, unos 5 minutos)

1. Abre el [código nuevo de Extras.gs](https://raw.githubusercontent.com/SnowPv/Organizador/main/apps-script/Extras.gs). Selecciónalo todo, pégalo en `Extras.gs` (reemplazando todo) y guarda 💾.
2. Arriba elige **`autorizarCerebro`** y presiona ▶ Ejecutar. Acepta los permisos (Drive y planillas). La función:
   - crea la carpeta **Organizador · Fuentes** y la hoja **Avisos**;
   - lee Specialized y las noticias por primera vez;
   - reinstala las tareas automáticas.

   Tarda cerca de un minuto. En el registro aparece cuántos productos encontró.
3. Ve a **Implementar → Administrar implementaciones → ✏️ → Versión: Nueva versión → Implementar**.

**Notas sobre el modelo y el costo:**
- El Copiloto usa el mismo modelo que el agente (`AGENTE_MODELO`, por defecto el económico).
- Si quieres un Copiloto más fino, agrega la propiedad `COPILOTO_MODELO` con otro modelo, por ejemplo `claude-sonnet-5-5`.
- Con el modelo económico, cada pregunta y cada plan diario cuesta una fracción de centavo de dólar.

## Inicio y Calendario

- **Inicio**, de arriba hacia abajo:
  1. Una franja corta con el plan del agente y el clima.
  2. Los KPI con minigráficos: tareas, pipeline, ventas del mes, clientes, Instagram y semana.
  3. Los paneles de cada área.
  4. El Radar.
  5. Al final, la zona **Complementario** (clima, Specialized, noticias y avisos), con otro fondo. Se oculta con un toque cuando quieres foco.
- **Calendario** (antes "Semana") tiene tres vistas:
  - **Semana**: la revisión semanal de siempre.
  - **Mes**: calendario con eventos, tareas, ventas, publicaciones y clima. Toca un día para ver el detalle.
  - **Año**: mapa de calor de tareas y gráficos por mes.

  Mes y Año comparan con el período anterior: tareas, ventas, tasa de cierre, negociaciones, clientes nuevos, conversaciones, tiempo de respuesta, Instagram y publicaciones.

## Compras y proveedores

La pestaña **Compras** lee las webs públicas de los proveedores (no el B2B) y calcula tu costo con el descuento de distribuidor de cada uno.

| Proveedor | Web | Qué se lee |
|---|---|---|
| Sportvibes (Fox suspensiones, Deity, HT) | sportvibes.cl | Catálogo completo con precio normal y de promoción |
| Outside (Hope, BikeYoke, Schwalbe, SunRace) | outsidesports.cl | Catálogo completo (precios + IVA) |
| MKR (RockShox, SRAM) | extremezone.cl | Productos, precio normal, oferta y stock por sucursal, por turnos |
| Andes (Shimano, Continental) | andesindustrial.cl | Su catálogo pide iniciar sesión: correos y listas de precios en la carpeta Fuentes |
| Specialized | specialized.com/cl | Módulo Specialized (stock por talla) |
| Garmin (Garmin, Tacx) | garminstore.cl | Catálogo completo con promociones |
| Trail (ropa Fox) | trailstore.cl | Catálogo Fox de ciclismo (sin moto) |

- **Lectura:** un proveedor por hora, cada uno una vez al día.
- **Cambios de precio:** se registran cuando empieza o termina una promoción, cuando cambia un precio y cuando aparece un producto nuevo.
- **Oportunidades de compra:** productos en promoción que conviene comprar para vender a precio normal.
  - El costo aplica tu descuento sobre el precio de promoción.
  - Se priorizan los productos que vendes, los que piden tus clientes y los vigentes. Garmin tiene prioridad extra porque su margen es bajo.
- **Correos de proveedores:** Gmail filtrado por los dominios de cada uno, con las promociones y novedades marcadas.
- **Configurar:** en cada proveedor puedes editar tu descuento (por defecto Garmin 20 % y el resto 30 %), las marcas, los dominios de correo y notas.
- **Copiloto:** busca en todos los catálogos ("¿quién tiene una Fox 36 Grip X2 y a qué costo?").
- **Plan del día:** recibe las mejores oportunidades y los correos de promociones.

## Política de marca

Blackline no hace descuentos, no los promociona y no participa en Cyber ni Black Friday: compite con fidelidad y atención personalizada.
- Todos los agentes tienen esta política como regla obligatoria: el de ventas, el de contenido, el Cerebro, el Copiloto y las noticias.
- Las rebajas de proveedores o de specialized.com son solo información interna para comprar mejor y anticipar lo que el cliente ve en internet.
- El pilar de contenido "Promociones" se reemplazó por **"Asesoría y experiencia"**.

## Resumen en cada pestaña

Cada pestaña (Hoy, Tareas, Calendario, Compras, Negocios, Proyectos, Contactos y Redes) parte con un **resumen**:
- una frase con lo más importante ahora;
- 4 tarjetas con gráficos (tortas, anillos y barras); cada una explica qué significa el número;
- las tarjetas con › abren la parte de la pestaña que corresponde.

El botón **Ocultar** lo deja en una línea, y la app recuerda la elección por pestaña. En el celular las tarjetas se deslizan hacia el lado.

**Tareas** muestra las tareas como tarjetas: borde azul para Trabajo, violeta para Personal, la fecha en color y 🔥 en las urgentes. En el escritorio, las vencidas van a la izquierda; lo de hoy y los próximos 3 días, a la derecha. En **Inicio**, el Pipeline volvió a ser una torta por etapa.

## Agente de tareas

Cuando dictas o escribes una tarea, el agente la piensa antes de guardarla, como la habrías pensado tú:
- **Corrige el dictado.** Por ejemplo, «Makov» → Muc-Off.
- **Arma la tarea.** Pone título, fecha, hora, área, categoría, prioridad y los pasos en orden.
- **Busca al proveedor** en tus contactos, en los proveedores de Compras y en Gmail (cotizaciones, facturas, firmas con teléfono). Si no lo encuentra, deja la ficha lista para crearla y te dice qué falta.
- **Si es un pedido**, revisa el stock de Bsale, los catálogos de proveedores y, si está habilitado, internet. Con eso sugiere productos, formatos y cantidades con su motivo, y deja el mensaje para el proveedor listo para WhatsApp.
- **Propone un evento** en el calendario si conviene (una llamada o una visita).

Nada se crea hasta que tocas **✓ Crear todo**. Antes puedes corregir cualquier campo y las cantidades.

**Cómo usarlo:**
- En **Nueva tarea**, toca **✨ Pensar con el agente**. Si dictas algo de 7 palabras o más, se activa solo.
- En una tarea ya guardada, toca **✨ Repensar con el agente**: la tarea original se reemplaza por la nueva.

**Configuración (opcional, en las Propiedades del script):**
- `TAREAS_MODELO`: el modelo que usa el agente. Por defecto `claude-opus-5-5`, el más inteligente, a unos centavos de dólar por tarea. Con `claude-haiku-5-5` cuesta mucho menos, pero piensa menos.
- `TAREAS_WEB` = `no`: desactiva la búsqueda en internet. Si la búsqueda web no está habilitada en tu cuenta de Anthropic, el agente sigue sin ella.

## ¿Botón + o Copiloto?

- **＋ (Nueva tarea):** algo que hay que hacer. El agente de tareas la piensa y la arma completa.
- **✨ Copiloto:** preguntas («¿cuántas Levo quedan en L?») y órdenes para cambiar datos:
  - «corrige la negociación de X»;
  - «esa venta ya terminó hace semanas, sácala del pipeline»;
  - «registra una garantía de Y».

  El Copiloto busca el registro y te muestra cada cambio (antes → después) para que lo apruebes con un toque. Puede:
  - cambiar la etapa de una negociación, con la fecha real del cierre;
  - ajustar el valor o la próxima acción;
  - agregar notas a la negociación o a la ficha del cliente;
  - crear tareas.

Si escribes una orden de este tipo en ＋, la app te ofrece mandarla al Copiloto.

## Postventa automática

Cuando una negociación pasa a **Ganada** (desde la app, el pipeline o el Copiloto), el script agenda el seguimiento que fideliza al cliente:

| Cuándo | Tarea |
|---|---|
| El día de la venta | Entrega y ajuste a medida |
| Día 2 | Registrar la garantía en Specialized y la bici en la bitácora |
| Día 7 | Llamar al cliente: cómo le va y dudas de uso |
| Día 30 | Invitarlo a la revisión gratuita (reapriete y ajuste) |
| Día 45 | Pedirle una foto o reseña para Redes, con su permiso |

- Si registras una venta antigua (con su fecha real), solo crea los pasos que aún no pasaron.
- Las tareas quedan a las 10:00 y aparecen en Hoy y en el Calendario.
- Se crean una sola vez por negociación.
- Se desactiva con la propiedad `POSTVENTA` = `no`.

## Campañas 1 a 1

En **Contactos → 📣 Campañas** eliges un objetivo:
- mantención de temporada;
- reactivar clientes;
- seguimiento de interesados;
- invitación a salida o test ride;
- foto o reseña.

La app arma la lista con tus perfiles y negocios, y un mensaje personal para cada cliente (con su nombre, su bici o su interés). Lo revisas, lo envías por WhatsApp con un toque y queda registrado en la ficha. La barra muestra el avance. Los mensajes siguen la política de la marca: asesoría y experiencia, nunca descuentos.

## Estudio: fotos atingentes

- **El agente mira las fotos antes de usarlas.** Para cada lámina reúne candidatas de estas fuentes:
  - tu Instagram;
  - el banco de Drive y tus carpetas extra;
  - las fotos oficiales de producto de specialized.com/cl;
  - las miniaturas de los videos de Specialized University;
  - Pexels, solo para paisajes.

  Las revisa con visión y les pone nota del 0 al 10. Descarta lo que no corresponde: bicis sin motor cuando se habla de e-bikes, bicis de niños o de ruta en temas de MTB, y fotos sin relación con el ciclismo (banderas, por ejemplo).
- **Si ninguna llega a 7, la lámina queda sin foto** y en «📸 Fotos que te pido» aparece qué sacar: bici, ángulo, lugar y luz. Con un toque se crea la tarea.
- **Carpetas de fotos:** en Redes → Estudio → «Carpetas de fotos» pegas el link de cualquier carpeta de Drive. Para usar las fotos de la cuenta de la tienda, comparte la carpeta con la cuenta dueña del script. El agente lee también las subcarpetas y usa sus nombres como contexto.
- **Biblioteca:** cada 12 horas se guardan en la hoja `Biblioteca` los videos nuevos de Specialized University y de Specialized (título, descripción y link), junto con las noticias de Pinkbike y Vital MTB. El agente de contenido los usa como base experta, sumados a un bloque de conocimiento técnico de MTB y e-MTB.
- **Configuración opcional:** la propiedad `ESTUDIO_MODELO` cambia el modelo que elige las fotos. Por defecto es `claude-opus-5-5`.
- **Versión:** en ⚙️ Ajustes → Versiones ves la versión de la app y la del script, y si falta actualizar.

## Ventas reales (Bsale)

Con `BSALE_TOKEN` en las propiedades del script, cada hora se copian las ventas de Bsale a la hoja `Bsale ventas`: boletas, facturas y notas de crédito (estas restan), con una fila por producto vendido. La primera vez trae los últimos 12 meses por partes. Para traerlos de una vez, ejecuta `sincronizarVentasBsale`.

Dónde se ve:
- **Compras → 📊 Ventas y rotación:**
  - ventas de hoy, la semana y el mes, comparadas con el mes anterior a la misma fecha y con el mismo mes del año pasado;
  - ticket promedio y ventas por mes (12 meses);
  - lo más vendido en 30 días;
  - **reponer pronto**: el stock alcanza para 30 días o menos según el ritmo de venta; con «＋ Pedido» el agente arma el pedido;
  - **stock quieto**: productos con stock y sin ventas en 90 días;
  - mejores clientes de los últimos 12 meses.
- **Inicio:** «Ventas del mes» usa las ventas reales de Bsale.
- **Ficha de cada cliente:** «🧾 Compras en tienda». Busca las compras por correo, teléfono o RUT.
- **Agentes:**
  - el Copiloto tiene `ventas_tienda` y `compras_cliente`;
  - el agente de tareas calcula los pedidos con las ventas reales;
  - el plan del día incluye ventas, qué reponer y el stock quieto.

## Nombres de los contactos de WhatsApp

Cuando un contacto llega solo con su número, el nombre se completa solo, en este orden:
1. **Tarjeta de WhatsApp:** el nombre de su perfil o el de tu agenda del teléfono (Meta la envía una vez al conectar; queda en la hoja «WA agenda»).
2. **El chat:** el agente lo busca en la conversación (cómo se presenta, cómo firma, lo que responde si le preguntas el nombre o cómo lo saludas tú).
3. **Contactos → 📇 Contactos sin guardar:** los que no tienen ninguna pista. Ahí escribes el nombre, se lo preguntas por WhatsApp con un toque (cuando responda, el agente lo guarda) o pides al agente que revise esos chats de nuevo.

Nunca se pisa un nombre que ya existe: solo se completan los que están vacíos o son un número.

## Chat en la ficha del contacto

En **Contactos**, al abrir un contacto, la pestaña **💬 Chat** (entre Resumen y Perfil) muestra toda la conversación de WhatsApp guardada: mensajes en vivo, el historial que compartió Meta y los chats importados. Debajo puedes clasificar al contacto con un toque (Cliente, Proveedor, Institución, Equipo, Otro o Ignorar).

## Depurar contactos de WhatsApp

**Contactos → Lista → 🧹 Depurar.** Primero muestra qué haría, sin cambiar nada. Al confirmar:
- **Se archivan:** quienes no están guardados en tu teléfono, los que no tuvieron conversación, los de conversación de un solo lado y los que consultaron, se les respondió y no volvieron a escribir.
- **El agente revisa** a los que están guardados y tuvieron una conversación de ida y vuelta: si se habló de comprar un producto o un servicio, abre la negociación en el Pipeline (aunque sea antigua; si ya compró, te pide confirmarlo); si no, los archiva.
- **No se tocan:** chats de los últimos 30 días, quien tiene una negociación abierta, proveedores, instituciones, equipo y contactos de correo.

Archivar no borra: quedan en el filtro «🗄️ Archivados» (hoja «Depuración» con el motivo) y vuelven solos si escriben de nuevo. «Restaurar archivados» lo deshace.

## Archivo de fotos

**Redes → Estudio → 📥 Subir fotos.** Elige una carpeta completa (por ejemplo, tu Google Fotos descargado, con subcarpetas) o fotos sueltas desde el iPhone. La app achica cada foto a 2048 px, la guarda en tu Drive (carpeta «Fotos subidas» del banco) y la anota en la hoja «Fotos». Si se corta, vuelve a elegir la misma carpeta: las ya subidas se saltan. Al terminar puedes borrar la copia de tu computador.

Cada 10 minutos la IA (Claude Haiku, ~US$0,0005 por foto) mira las fotos sin descripción y escribe qué se ve y sus etiquetas. Con eso el Estudio encuentra «Levo en sendero con barro» aunque el archivo se llame IMG_4821.jpg. Las carpetas de Drive que agregues en «Carpetas de fotos» se suman al archivo cada hora (y al agregarlas).

## Pestaña Chats

**Contactos → 💬 Chats** muestra todas las conversaciones de WhatsApp como en el teléfono: la más reciente arriba, con el último mensaje y la hora. Al tocar una se abre la conversación completa (en el computador, al lado; en el celular, a pantalla completa con «‹» para volver), con botones para abrir WhatsApp, ver la ficha y clasificar al contacto. Hay buscador por nombre, número o texto del mensaje, y un botón para ver también los archivados.

## Selección múltiple y acciones rápidas en Contactos

- **Lista:** cada contacto tiene una casilla a la izquierda (y una arriba para marcar todos los del filtro). Con contactos marcados aparece una barra: Archivar, Desarchivar, Etiquetar, Mover a grupo (tipo) y Eliminar. Los botones 🗄️ Archivar y ↩️ Desarchivar también están junto a 🧹 Depurar. Todo corre en segundo plano.
- **Ficha:** sobre «Próximo paso» hay botones pequeños: 💬 Ver chat, 🏷️ Etiquetar, 🗂️ Grupo, 🗄️ Archivar/↩️ Desarchivar, 🧠 Analizar y 🗑 Eliminar. Las flechas ‹ › arriba pasan al contacto anterior o siguiente (orden alfabético de la lista que estás viendo).
- **Depurar** se revisa en segundo plano: puedes cerrar la ventana y te avisa cuando está.
- **Chats:** botón «⏳ Sin responder» (el cliente escribió último) y punto verde en los que te escribieron en la última semana; desde la conversación puedes crear negocio o tarea, o pedir al agente que la analice. Desde una negociación, «💬 Ver chat».

## Agente comprador (Compras)

El buscador de Compras interpreta lo que escribes («pastillas para Levo 4», «lubricante para barro»), busca con varias consultas en los catálogos de todos los proveedores y de Specialized, cruza con tu stock, la rotación en Bsale, los clientes que lo pidieron y las promociones vigentes, y recomienda qué comprar, a quién y cuántas unidades. Cada recomendación tiene «＋ Tarea de pedido». La búsqueda simple aparece al tiro debajo. En «Ventas y rotación → Reponer pronto», el botón «🧠 Proveedores» lanza esta búsqueda.

## Estudio: menos fotos pedidas

El director creativo recibe el inventario de tu archivo de fotos (con la descripción de la IA) y el stock real de Bsale. Diseña con lo que existe: tus fotos, las oficiales de Specialized y stock para paisajes; acepta fotos coherentes aunque no sean exactas (nota 5 o más) y pide como máximo una foto por pieza. Las láminas sin foto se diseñan como texto, lista o dato.

## Venta perdida (cierre por pérdida)

Un solo lugar para avisar que una negociación se cayó: **❌ Perdida** en la negociación (también al arrastrarla en el pipeline, en el repaso rápido, en la ficha del contacto, en el panel de Chats y cuando el Copiloto propone marcarla perdida). Al confirmar:

- **Tareas**: se listan las pendientes de esa venta (las que llevan su código N-…, el `[id]` del contacto o su nombre) y se cancelan las marcadas. No toca la postventa de compras anteriores ni tareas de otra negociación.
- **Calendario**: el script busca los próximos 180 días de eventos que nombran al cliente (nombre y apellido, empresa o teléfono) y borra los marcados. Los que se repiten o son de calendarios ajenos se avisan para borrarlos a mano. Los recordatorios de tareas se van solos al borrar la tarea.
- **Agente**: se apaga la «idea de respuesta» y el cliente sale de «Esperan respuesta». Durante 180 días el agente no reabre la venta ni crea tareas salvo que el cliente vuelva a escribir después de la pérdida (entonces sí es una oportunidad nueva).
- **Cliente**: etiqueta «Venta perdida» y nota «❌ Venta perdida» en su historial con el resumen.
- **Reintento**: se sugiere según el motivo (Sin stock 1 mes, No respondió/Postergó 3, Precio/Otro 6, Compró en otro lado 12) y deja la tarea «♻️ Retomar a …» y la próxima acción en la negociación.
- **Tableros**: tasa de cierre, motivos de pérdida y pronóstico se recalculan solos con el estado «Perdida».

Ops del script (nivel 32): `eventosContacto` y `perderNegocio`.

## Etapas después del pago (seguimiento, entrega y postventa)

Una venta se da por **ganada cuando el cliente paga**, pero muchas veces hay que pedir la bici o armarla antes de entregarla. Por eso el pipeline sigue después del pago:

- **🏆 Ganada · seguimiento**: pagó y falta entregar. Al marcar Ganada la app pregunta la fecha de pago y si ya se la llevó. Si no, pide la entrega estimada y crea la tarea «📦 Entrega a … (pedir, armar y avisar)» y el próximo paso «📦 Coordinar la entrega».
- **✅ Entregada**: se la llevó. Desde la fecha real de entrega se agenda la postventa: registrar la garantía (día 1), llamada a los 7 días, revisión gratuita de los 30 días y foto o reseña a los 45.
- **🤝 Postventa**: a la semana de la entrega pasa sola (revisión diaria del script). Se ve en el pipeline hasta 90 días después de la venta.

Las tres cuentan como venta ganada en los tableros, con la **fecha del pago** (no la de entrega). Pasar directo a Entregada desde una etapa abierta registra también la fecha de ganada.

El agente ya no abre una negociación nueva cuando un cliente con una venta ganada en los últimos 120 días escribe por el saldo, el pedido, la entrega o la garantía: actualiza el próximo paso de esa venta. Si pide otro producto distinto, sí abre una nueva. En la pestaña Datos de cada negociación hay un botón para eliminar duplicados.

Las negociaciones abiertas que ya duplicaban una venta ganada (mismo cliente, o el mismo nombre guardado dos veces con casi el mismo producto) se unen solas: al abrir la app (una vez por sesión) y en la revisión periódica del script. Queda la nota «🔗 Negociación unida» en el historial del cliente.

Ops del script (nivel 33–34): `negocioBorrar`, `unirDuplicados`; `negocio` acepta `entrega` y `fechaGanada`.

## Inicio (diseño v2, pensado para 1920×1080)

En pantallas de computador (≥1600 px de ancho y ≥760 de alto) el tablero ocupa exactamente el alto disponible, en dos filas, sin bajar:
1. Ventas del mes (50 %) · Avisos post-it (20 %) · Pipeline (30 %).
2. Tareas de hoy · Agenda · Requieren atención · Instagram · Contactos.
Debajo, como complemento, las noticias en tarjetas con imagen de portada (del feed o de la imagen og:image de la nota).

- **Ventas**: solo lo boleteado, igual que «Ventas del mes» en Bsale: boletas y facturas menos notas de crédito. No suman notas de venta, cotizaciones, guías de despacho, pedidos web ni servicio técnico (`ex_bsvEsVenta_`).
- **Clima**: el widget de la franja del plan usa el pronóstico de yr.no (api.met.no): temperatura, máx/mín, lluvia en mm, viento, las próximas horas y mañana. Tocarlo abre el detalle.
- El Copiloto en computador está en el encabezado (botón «Copiloto»), sin botón flotante.

## Inicio (diseño v1)

El Inicio es un tablero tipo «bento» con módulos de distinto tamaño y forma:

- **Ventas del mes** (tarjeta principal, oscura): total del mes desde Bsale, comparación con el mes anterior a la misma fecha, barra de avance contra la meta (o contra el mes anterior completo si no hay meta) con la marca del ritmo necesario, gráfico acumulado día a día contra el mes anterior, y hoy/semana/proyección. La meta se fija tocando «Fijar meta» (se guarda en el script, propiedad `EX_META_VENTAS`, op `metaVentas`). Sin Bsale usa las negociaciones ganadas.
- **Avisos de la tienda** como post-it amarillo, siempre a la vista.
- Tareas de hoy (anillo + constancia de 2 semanas), Agenda (línea de tiempo y próximos días), Requieren atención, Pipeline (embudo por etapa), Contactos e Instagram.
- Complementario: clima y noticias.

Se quitaron del Inicio: sugerencias del asistente, mis próximas tareas, el radar y Specialized Chile (siguen en Hoy, Tareas y Compras).

## Conexiones y automatizaciones (nivel 37, app v51)

- **Buscador global** (Ctrl+K o ⌕ en el encabezado): contactos, negocios, tareas, avisos y secciones; Enter abre; la última opción le pasa la búsqueda al Copiloto.
- **Tareas ↔ Negocios ↔ Contactos**: las tareas que vienen de una negociación o un cliente muestran chips «🤝 negocio» / «👤 cliente» que los abren.
- **Agenda ↔ Contactos**: los eventos que nombran a un cliente abren su ficha.
- **Pipeline del Inicio**: torta por etapa; cada etapa abre Negocios filtrado por esa etapa (chip «Etapa: … ✕»).
- **Ventas → Compras**: «Ver ventas y rotación ›» en la tarjeta de ventas.
- **Bsale → Pipeline (automático)**: si quien compró (boleta o factura de los últimos 4 días) tiene una negociación abierta, el próximo paso pasa a «🧾 Compró en Bsale (…): ¿marcar Ganada?» y la compra queda en su historial. No se marca sola.
- Clima de yr.no también en Hoy. Estilo de tarjetas unificado en todas las pestañas.


## Diseño nuevo (propuesta, app v53) — se cambia en ⚙️ Ajustes → Diseño de la interfaz

Solo cambia la interfaz; los datos y funciones son los mismos. Con «Clásico» se vuelve al diseño anterior.
- Barra lateral agrupada: Día a día (Inicio, Hoy, Tareas, Calendario) · Ventas (Negocios, Contactos, Compras) · Marca (Redes, Proyectos).
- Bajo el título de cada pestaña, una línea que explica para qué sirve.
- Resumen de cada pestaña: una línea de aviso + 4 tarjetas con la misma anatomía (etiqueta · cifra · comparación · gráfico · pie). Las explicaciones están en la «i».
- Negocios: Pipeline abierto (barra por etapa, pronóstico, ticket, estancados) · Ganado este mes (barras por mes, % vs mes anterior, ciclo de venta) · Tasa de cierre 90 días (ganadas/perdidas, motivo de pérdida más común) · Requieren atención (monto en juego y los 3 más urgentes). Tablero de columnas más limpio.
- Contactos y Redes: el análisis detallado queda plegado («Mostrar ▾»), se recuerda abierto/cerrado.

## Un solo Cerebro con skills (nivel 39 · app v56)

Antes cada «agente» (Copiloto, agente de ventas, agente de tareas, comprador, fotos, estudio, plan del día, noticias, asistente) llamaba a Claude por su cuenta, con su propio modelo. Ahora todo pasa por **una sola puerta**: `ex_ia_(skill, cuerpo)` en `apps-script/Extras.gs`.

- **Catálogo `EX_SKILLS`** (9 skills): conversar, plan_dia, seguimiento, tareas, compras, contenido, noticias, fotos, director_arte. Cada skill tiene nombre, para qué sirve, cuándo se activa (automática o manual), dónde aparece en la app y su nivel (rápido = Haiku 5.5, experto = Sonnet 5.5).
- **La puerta** pone la política de marca, elige el modelo según la skill, reintenta si Claude está saturado (429/5xx), usa el respaldo automático en modelos no Haiku y **anota el consumo** por skill y día (`EX_USO_yyyy-MM-dd`, 35 días), en US$ según los precios de la API.
- **Modelos**: `CEREBRO_MODELO` (rápido) y `CEREBRO_EXPERTO` reemplazan a las propiedades sueltas. Las antiguas (`TAREAS_MODELO`, `COPILOTO_MODELO`, etc.) siguen teniendo prioridad si existen; la pestaña Cerebro muestra qué modelo usa cada skill.
- **Control**: las skills automáticas se pueden pausar (`EX_SKILLS_PAUSA`) y hay un tope diario en US$ para lo automático (`CEREBRO_TOPE_USD`); lo que pide el usuario siempre funciona.
- **Chat con carga progresiva**: el chat del Cerebro ve un índice corto de skills y, cuando el pedido calza, llama a `leer_skill` para cargar las instrucciones completas (tareas, compras, seguimiento, plan_dia, contenido, redes, semana) y las sigue con sus herramientas. No paga esas instrucciones en cada mensaje.
- **App**: nueva pestaña **Cerebro** (Inteligencia) con las skills, su consumo de 30 días, interruptores de pausa y tope; «Copiloto» pasa a llamarse **Cerebro**; **Guía de la app** (botón **?**, se muestra sola la primera vez en cada equipo) para que cualquiera del equipo entienda la app en un minuto.
- Operaciones nuevas: `skills` (estado y consumo) y `skillsConf` (`{pausa:[ids], tope:US$}`).

## Usuarios: Admin y Piso de venta (nivel 40 · app v57)

- **Cuentas**: Admin (todo, igual que antes) y Piso de venta. Se crean en ⚙️ Ajustes → Usuarios. Mientras no existan, la app funciona como siempre.
- **Servidor** (`app_extra_` en Extras.gs, puerta de entrada que llama WebApp): contraseñas con hash SHA-256 iterado y sal (`EX_USUARIOS`), sesión firmada HMAC-SHA256 (`EX_SES_SECRETO`) con versión por cuenta (cambiar la clave cierra sus sesiones), duración 30 días Admin / 14 días Piso, bloqueo de 10 min tras 6 intentos fallidos.
- **Permisos del Piso de venta** (lista blanca `EX_OPS_PISO`): sin ventas de Bsale de la tienda, metas, proveedores/costos, compras con IA, planillas de precios, gasto del Cerebro, ni acciones masivas (depurar, lotes, unir duplicados, importar). Sí: tareas, calendario, contactos y chats, negocios, redes, avisos (solo lectura), stock, Specialized y el chat del Cerebro sin las herramientas de cifras (`EX_TOOLS_SOLO_ADMIN`). De `global` se quitan compras, plan del Cerebro y fuentes; de `google`, los correos.
- **App**: pantalla de ingreso; el Piso de venta parte en **Hoy** (sin Inicio, Compras ni Cerebro) con un panel propio: 4 pasos para empezar, avisos, calendario del mes, rutina diaria (editable por dispositivo), clientes que esperan, seguimientos por etapa (sin montos), tareas, próximos 7 días, redes y contactos. Las tareas del área «Personal» no se muestran. Guía propia para el equipo. El Admin puede ver el Hoy del Piso desde Ajustes → Usuarios.
- **Si se olvida la clave Admin**: Apps Script → Configuración del proyecto → Propiedades del script → borrar `EX_USUARIOS` y volver a crearlas desde la app.
- **Límite conocido**: las acciones propias de WebApp (leer/guardar tareas) solo piden el link y la clave del dispositivo, no la sesión. Las tareas no tienen datos financieros.

## Diseño con menos texto (app v58)

- **Tareas → Tablero** (vista por defecto en el diseño nuevo): columnas Atrasadas · Hoy · Mañana · Esta semana · Después · Sin fecha. Tarjetas compactas con ícono de color por categoría (`CAT_ESTILO`), días de atraso, hora, subtareas, urgencia y avatar del cliente o negociación vinculada. Acciones de un toque: ✓ hecha, ↷ mañana / ↶ hoy (con Deshacer), ▶ foco. Arrastrar una tarjeta a otra columna la reprograma. «＋» en cada columna crea la tarea con esa fecha. Tecla **N** = nueva tarea.
- Una franja de una línea reemplaza los 4 recuadros de resumen de Tareas: avance de hoy, racha, carga de los próximos 7 días (cada barra abre el día) y pestañas.
- Contactos: los avisos largos pasan a una fila de indicadores compactos; los 8 indicadores quedan en una sola fila en pantallas grandes. Resúmenes por pestaña más bajos.
