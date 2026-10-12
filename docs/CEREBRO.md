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
