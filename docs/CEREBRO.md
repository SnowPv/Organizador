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
