# 📦 Conexión con Bsale · Organizador BlackLine

Con esta conexión, la app consulta **stock por sucursal y precio de venta** directo en Bsale:

- **En cada negociación** aparece «📦 Stock en Bsale», con el producto ya escrito: tocas 🔎 y ves si hay talla y en qué sucursal.
- **En Negocios** el botón **📦 Stock** sirve para buscar cualquier producto, por modelo, talla, color o SKU.
- **El agente de IA**, cuando lee un chat, revisa en Bsale los productos que pide el cliente. Así su resumen, la próxima acción y la idea de respuesta dicen si hay stock real. Si no hay de lo que pidió, sugiere la alternativa disponible más parecida o encargarla. Nunca promete stock que no existe.

La app **solo lee** de Bsale: no crea ventas, documentos ni cambia stock.

## Paso 1 · Obtener tu token de Bsale (5 min)

El token es la clave que permite leer tu Bsale. Puede verlo el **administrador de la cuenta Bsale**.

1. Entra a Bsale con un usuario administrador.
2. Busca la sección **Configuración → API / Integraciones / Token de acceso**. El nombre exacto varía según la versión. Si no la encuentras, pídelo a soporte de Bsale («necesito el access token de la API para una integración de solo lectura»).
3. Copia el token. **No lo compartas con nadie, tampoco en el chat.**

## Paso 2 · Guardarlo en Apps Script (2 min)

1. En tu Sheet: **Extensiones → Apps Script** (con la cuenta de la tienda).
2. **⚙️ Configuración del proyecto → Propiedades del script → Agregar propiedad**:
   - `BSALE_TOKEN` = tu token.
   - *(Opcional)* `BSALE_LISTA` = el número de la lista de precios que quieres usar. Si no la pones, se usa la primera lista activa.
3. Guarda.

## Paso 3 · Actualizar el script (5 min)

1. Abre Extras.gs, presiona **Ctrl+A**, pega el código nuevo de [`apps-script/Extras.gs`](../apps-script/Extras.gs) y guarda.
2. En el menú de funciones, elige **probarBsale** → **▶ Ejecutar**. En el registro debe aparecer «Bsale conectado ✓ · N variantes en el catálogo».
3. **Implementar → Administrar implementaciones → ✏️ → Nueva versión → Implementar.**

## Cómo funciona

- El script copia tu catálogo (productos y variantes activas) a una hoja nueva llamada **Bsale**, para buscar rápido. Se actualiza solo una vez al día, o a mano desde **⚙️ → 📦 Bsale → Actualizar catálogo**.
- El **stock y el precio** se consultan en vivo cada vez que buscas.
- **Disponible** = stock menos lo reservado en documentos pendientes.

## Si algo falla

- **«Bsale rechazó el token (401)»**: el token está mal copiado o no tiene permisos. Revisa `BSALE_TOKEN`.
- **No encuentra un producto**: prueba con menos palabras, o con el SKU o el código de barras. Si es un producto nuevo, toca «Actualizar catálogo».
- **Precio vacío**: revisa `BSALE_LISTA` (debe ser el número de una lista de precios activa).
