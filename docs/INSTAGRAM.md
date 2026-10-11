# 📸 Instagram en el Organizador (API oficial de Meta, gratis)

El script de tu Sheet consulta Instagram **solo, una vez al día**, y guarda los datos en tres hojas:

| Hoja | Qué guarda |
|---|---|
| **Instagram** | Una fila por día: seguidores, alcance, vistas, interacciones, cuentas que interactuaron y toques en links |
| **IG Publicaciones** | Tus últimas 60 publicaciones: tipo, texto, link, me gusta, comentarios, guardados, compartidos, alcance, vistas, interacciones y tiempo medio de los reels |
| **Contenido** | Tu calendario de contenido: fecha, formato, tema, idea o guion, texto sugerido, hashtags, objetivo y estado |

En la app, la pestaña **Redes** muestra las métricas, qué formatos y días funcionan mejor, tus mejores publicaciones y el calendario. El botón **Calendario de contenido** le pide al asistente de IA las próximas 2 semanas de publicaciones. Para eso usa lo que pasa en la tienda: agenda, proyectos, lo que más preguntan los clientes, negociaciones, ventas recientes, tareas de marketing y tus métricas. Inicio también muestra una tarjeta de Instagram.

Como todo queda en tu Google Sheet, Claude también puede leerlo y analizarlo con el conector de Google Sheets.

## Qué hace la pestaña Redes

- **Resumen:**
  - Seguidores (nuevos y bajas), alcance, interacción, toques en links y clientes que llegaron desde Instagram.
  - Recomendaciones calculadas con tus datos.
  - Constancia semanal contra tu meta.
  - Rendimiento por formato: alcance, interacción, guardados y envíos por cada 1.000 personas alcanzadas.
  - Mapa de calor de día y hora para publicar, temas (pilares) y mejores publicaciones.
- **Contenido:**
  - Calendario semanal con estados (Idea → Planificado → Grabado → Publicado) y banco de ideas.
  - Cada idea trae su código (IG-XXXX) y su link a WhatsApp.
  - Cuando publicas, la app la cruza con la publicación real y muestra cómo le fue.
- **Audiencia:**
  - Qué modelos y servicios piden tus clientes en WhatsApp contra cuánto los muestras en Instagram ("falta contenido").
  - Ciudades, países, edades y género de tus seguidores.
- **Leads:**
  - Embudo de Instagram a ventas: alcance → interacciones → toques en links → conversaciones de WhatsApp → negociaciones.
  - Qué publicación o link trajo cada cliente.
  - Generador de links con código para la bio, las historias y la web (con UTM para Google Analytics).
- **Estrategia (IA):**
  - Diagnóstico de la cuenta.
  - Frecuencia por formato, horarios y mezcla de temas.
  - Acciones para conseguir más clientes por WhatsApp y la web.
  - Metas a 30 días con avance.
  - El calendario con IA sigue esta estrategia.

El script guarda las historias cada 6 horas, porque Instagram las borra a las 24 horas. La audiencia se actualiza una vez por semana: Instagram la entrega desde los 100 seguidores.

**Para medir clientes desde Instagram:**
- Usa los links con código.
- Configura el botón de contacto de WhatsApp en tu perfil.
- Termina cada publicación con un llamado a la acción.

La app reconoce el código en el chat y también frases como "te vi en Instagram".

## Requisitos

- La cuenta de Instagram de la tienda debe ser **profesional (Empresa o Creador)**. Para revisarlo: Instagram → Configuración → *Tipo de cuenta y herramientas* → *Cambiar a cuenta profesional*.
- Un usuario de Facebook, para entrar a developers.facebook.com. No hace falta una página de Facebook.

## Paso 1 · Crear la app en Meta (10 min)

1. Entra a **developers.facebook.com** → **Mis apps** → **Crear app**.
2. Elige el caso de uso de **Instagram** ("Administrar mensajes y contenido en Instagram" o similar). Ponle de nombre `Organizador Blackline`.
3. En la app, entra a **Instagram → Configuración de la API con inicio de sesión de Instagram** (*API setup with Instagram login*).
4. En **"Generar tokens de acceso"** toca **Agregar cuenta** y entra con el Instagram de la tienda. Acepta los permisos de **perfil e insights**.
   - Si te pide que la cuenta sea **evaluadora**: en la app de Meta ve a **Roles de la app → Roles → Evaluadores de Instagram**, agrega la cuenta de la tienda y acepta la invitación en Instagram (Configuración → *Apps y sitios web* → *Invitaciones de evaluador*).
5. Toca **Generar token** y cópialo. Es un token de larga duración (60 días) y el script lo renueva solo cada 30 días.
   **No lo compartas con nadie, tampoco en el chat.**

La app puede quedarse en **modo desarrollo**: para leer tu propia cuenta no hace falta publicarla ni pasar la revisión de Meta.

## Paso 2 · Guardar el token en Apps Script (2 min)

Hazlo con la cuenta de la tienda, en Apps Script → **⚙️ Configuración del proyecto → Propiedades del script → Agregar propiedad**:
- `IG_TOKEN` = el token que copiaste.

## Paso 3 · Actualizar el script (5 min)

1. Abre Extras.gs, presiona **Ctrl+A**, pega el código nuevo de [`apps-script/Extras.gs`](../apps-script/Extras.gs) y guarda.
2. Elige la función **probarInstagram** → **▶ Ejecutar**. En el registro debe aparecer: «Instagram conectado ✓ · @tu_cuenta · N seguidores…». La primera vez trae los últimos 30 días.
3. **Implementar → Administrar implementaciones → ✏️ → Nueva versión → Implementar.**

Después de esto se actualiza solo cada día. También puedes tocar **↻ Actualizar ahora** en la pestaña Redes.

## Notas

- **Plazos:** Instagram puede demorar hasta 48 horas en consolidar las métricas, y las del día se guardan al día siguiente.
- **Cuentas chicas:** con menos de 100 seguidores, Instagram no entrega algunas métricas.
- **Carruseles:** Instagram no entrega métricas de cada foto, solo del carrusel completo.
- **Si dice «token inválido» o «expirado»:** genera uno nuevo (Paso 1.5) y reemplaza `IG_TOKEN`.
- **Permisos:** el script solo **lee**, nunca publica nada en tu Instagram.

## Estudio de contenido

En **Redes → Estudio** el agente diseña carruseles e historias con la marca de la tienda. Tú los revisas, pides cambios y publicas con un toque.

**Qué tiene en cuenta el agente:**
- La temporada en Puerto Varas: en primavera arranca la temporada alta y en invierno las ventas son más lentas por la lluvia.
- Lo que preguntan los clientes por WhatsApp.
- Lo que más se vende y el stock de Bsale.
- La estrategia y el calendario de contenido.
- El foco en e-bikes, sin dejar de lado las otras disciplinas. El porcentaje lo ajustas en el kit de marca.

**Cómo funciona:**
1. **Crear con IA.** Elige carrusel o historias. Si quieres, escribe un tema o elige una idea del calendario.
2. **Revisar.** Puedes:
   - editar el texto de cada lámina;
   - cambiar el diseño;
   - cambiar la foto: de tu Instagram, de tu banco de Drive o de Pexels;
   - reordenar, duplicar o eliminar láminas.
3. **Pedir cambios al agente.** Por ejemplo: "más corto", "enfócalo en la Levo SL" o "agrega una lámina de tallas".
4. **Publicar.** Tienes tres opciones:
   - **Publicar ahora.**
   - **Programar:** se publica sola a la hora elegida, con un margen de hasta una hora.
   - **Compartir / descargar:** abre Instagram en el teléfono con las imágenes y copia el texto.

Las historias se publican sin stickers, porque la API de Instagram no los permite. Si quieres un sticker de link o una encuesta, usa "Compartir" y agrégalo en Instagram.

### Configuración (una sola vez, unos 15 min)

**1. Actualizar el script y dar permiso a Drive**
1. Pega el `Extras.gs` nuevo y guarda.
2. En el menú de funciones, elige `autorizarEstudio` y presiona ▶ Ejecutar.
3. Acepta el permiso de Google Drive.
4. El registro muestra el link de la carpeta **Organizador · Banco de imágenes**.

**2. Subir fotos reales al banco**

Sube fotos a esa carpeta con nombres que describan lo que se ve. Ejemplos:
- `levo-sendero-pichijuan.jpg`
- `taller-mantencion-horquilla.jpg`
- `vado-lago-llanquihue.jpg`

El agente elige las fotos según el nombre. Por eso, mientras más descriptivo sea el nombre, mejor será la elección. También usa las fotos de tus publicaciones de Instagram.

**3. Alojamiento de imágenes (para publicar con un toque)**

Instagram solo publica imágenes que estén en un link público y directo. Los links de Google Drive no sirven. Por eso, la app las guarda en un repositorio público de GitHub.
1. Entra a [github.com/new](https://github.com/new) con la cuenta SnowPv.
2. En nombre escribe `Organizador-media`, elige **Public** y marca **Add a README file**. Luego presiona **Create repository**.
3. Entra a [github.com/settings/personal-access-tokens/new](https://github.com/settings/personal-access-tokens/new) y completa:
   - **Token name:** `Organizador media`.
   - **Expiration:** el máximo que permita. Anota la fecha para renovarlo.
   - **Repository access:** *Only select repositories*, y elige `Organizador-media`.
   - **Permissions → Repository permissions → Contents:** *Read and write*.
4. Presiona **Generate token** y copia el token.
5. Pégalo en Apps Script: ⚙️ Configuración del proyecto → Propiedades del script → Agregar propiedad.
   - Nombre: `GITHUB_TOKEN`.
   - Valor: el token.

   No lo pegues en ningún otro lugar, tampoco en un chat.

Las imágenes publicadas quedan visibles para cualquiera que tenga el link. Esto no es un problema, porque igual se publican en Instagram.

**4. (Opcional) Banco de fotos gratis Pexels**
1. Crea una cuenta en [pexels.com/api](https://www.pexels.com/api/) y pide una clave (es gratis).
2. Guárdala como propiedad del script `PEXELS_KEY`.

El agente la usa solo cuando no encuentra una foto propia que calce.

**5. Nueva versión**

Ve a Implementar → Administrar implementaciones → ✏️ → Versión: **Nueva versión** → Implementar.

**6. Kit de marca**

En la app, entra a Redes → Estudio → **Kit de marca** y configura:
- los colores; con el botón "Detectar colores de mi Instagram" la app propone colores;
- las tipografías;
- el logo, en PNG con fondo transparente;
- el tono;
- el contexto del negocio.

La vista previa muestra cómo quedan las láminas.

**Si la publicación falla con un error de permisos:** en developers.facebook.com → tu app → Casos de uso → Personalizar, confirma que esté el permiso **instagram_business_content_publish**. Después genera el token de nuevo y reemplaza `IG_TOKEN`.
