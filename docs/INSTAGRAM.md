# 📸 Instagram en el Organizador (API oficial de Meta, gratis)

El script de tu Sheet consulta Instagram **solo, una vez al día**, y guarda los datos en tres hojas:

| Hoja | Qué guarda |
|---|---|
| **Instagram** | Una fila por día: seguidores, alcance, vistas, interacciones, cuentas que interactuaron y toques en links |
| **IG Publicaciones** | Tus últimas 60 publicaciones: tipo, texto, link, me gusta, comentarios, guardados, compartidos, alcance, vistas, interacciones y tiempo medio de los reels |
| **Contenido** | Tu calendario de contenido: fecha, formato, tema, idea o guion, texto sugerido, hashtags, objetivo y estado |

En la app, la pestaña **Redes** muestra las métricas, qué formatos y días funcionan mejor, tus mejores publicaciones y el calendario. El botón **Calendario de contenido** le pide al asistente de IA las próximas 2 semanas de publicaciones. Para eso usa lo que pasa en la tienda: agenda, proyectos, lo que más preguntan los clientes, negociaciones, ventas recientes, tareas de marketing y tus métricas. Inicio también muestra una tarjeta de Instagram.

Como todo queda en tu Google Sheet, Claude también puede leerlo y analizarlo con el conector de Google Sheets.

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
