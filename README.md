# NextPro Plumbing & Maintenance — V3

V3 modifica este proyecto estático existente. Conserva las rutas originales y el logo limpio. No requiere un framework ni backend.

## Ver la web

Desde esta misma carpeta:

```sh
npm start
```

Abrir http://localhost:8080/index.html?lang=en
Plumbing: http://localhost:8080/services/plumbing.html?lang=en
Español: http://localhost:8080/es/index.html?lang=es

También puede ejecutar `python3 -m http.server 8080 --bind 127.0.0.1` sin npm.

## Contenido y build

`build_v3.py` contiene los textos EN/ES y genera 20 páginas HTML completas, sitemap.xml y robots.txt. `css/v2.css` y `js/app.js` son los archivos existentes actualizados para V3. Editar textos en el generador para no perder cambios al regenerar.

```sh
npm run build
```

Requiere Python 3. Los archivos HTML generados funcionan en un hosting estático; Python y Node no son necesarios en producción.

## Dominio / SEO

El dominio público no estaba confirmado. `v3-config.json` usa `http://localhost:8080` para revisión local. Antes de publicar, sustituir `site_url` por el dominio HTTPS definitivo y ejecutar el build. Esto actualiza canonical, hreflang EN/ES/x-default, Open Graph, JSON-LD y sitemap. No publicar los metadatos con localhost.

## Idiomas y contacto

English es el idioma inicial. Español tiene HTML real en `es/`. El selector conserva el ancla, guarda la preferencia en localStorage y lleva el idioma entre páginas. Si el almacenamiento está bloqueado, las rutas mantienen el idioma. Los datos de un formulario sin enviar se conservan temporalmente en sessionStorage únicamente al cambiar de idioma.

WhatsApp y teléfono: +1 239-333-7935. El formulario valida campos y prepara un mensaje; el cliente lo revisa y envía en WhatsApp. No hay backend de correo ni confirmación ficticia de envío.

## Fotos

Fotografías locales WebP, lazy loading debajo del hero, texto alternativo traducido, logo optimizado. La página Plumbing contiene 11 fotografías de servicio distintas, más un hero diferente. `images/sources.json` registra las fuentes. Son fotos ilustrativas de categorías, no proyectos ni empleados verificados de NextPro.

## QA

```sh
npm install
npm test
```

El script utiliza Chrome instalado en `/Applications/Google Chrome.app`. Verifica 20 páginas EN/ES a 390, 430, 820, 1280 y 1440 px, enlaces/anclas, imágenes locales, metadatos, consola, teléfono, WhatsApp, menú, idioma y formulario. Intercepta la apertura del formulario para no enviar mensajes reales. El servidor local debe estar iniciado. Resultados: `qa-results.json`.

Para publicar, subir únicamente HTML, `es/`, `services/`, `css/`, `js/`, imágenes usadas, favicon.ico, robots.txt y sitemap.xml. Excluir herramientas de build/QA, node_modules y capturas de revisión.

## Building Maintenance — actualización

Se amplió la página existente `services/maintenance.html` y su versión `es/services/maintenance.html`; no se cambiaron rutas ni se creó otro proyecto. `building_maintenance.py` contiene las ocho categorías, el proceso en cuatro pasos, prevención, públicos, frecuencias de acuerdos y formulario de evaluación.

La navegación mantiene Plumbing y Building Maintenance juntos y visibles también en móvil. Inicio presenta ambas divisiones; Plumbing conserva su página completa. El formulario de edificios solicita diez datos (unidades opcionales), valida teléfono/correo y prepara un mensaje de WhatsApp traducido. El borrador conserva sus valores al cambiar de idioma.

QA específico: `npm run test:maintenance`. Requiere el servidor local activo. `qa-footer-before.json` conserva medidas anteriores y `qa-maintenance-results.json` contiene medidas finales, resultados de formulario e imágenes. El footer conserva sus cuatro columnas y enlaces con menor altura.

Archivos de implementación modificados: build_v3.py, css/v2.css, js/app.js, package.json, README.md, images/sources.json, qa-v3.cjs; nuevo módulo building_maintenance.py y prueba qa-maintenance.cjs. El build actualiza las veinte páginas HTML compartidas, sitemap.xml y robots.txt. Se añadieron fotografías WebP de inspección, edificios, puertas, áreas técnicas y pasillos.
