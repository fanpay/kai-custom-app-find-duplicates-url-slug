# Kontent.ai Duplicate Slug Finder

Aplicación custom embebible (Vite + TypeScript) para detectar páginas (`system.type=page`) que comparten el mismo slug (`url_slug` o `slug`) a través de múltiples idiomas (por defecto: `de`, `en`, `zh`).

## Características
- Búsqueda de un slug específico (múltiples fuentes Delivery + Management API*)
- Detección de slugs duplicados “reales” (mismo slug perteneciendo a distintos content items, no sólo variantes idiomáticas)
- Agrupación y resumen por item mostrando variantes de idioma
- Paginación automática (maneja >1000 items por idioma)
- UI ligera sin frameworks pesados
- Cabeceras de seguridad para despliegue en Netlify (CSP, etc.)

(*Management API sólo si se configura la API key.)

## Requisitos de entorno
Configura variables (por ejemplo en Netlify / entorno build):
- `VITE_KONTENT_PROJECT_ID`
- `VITE_KONTENT_DELIVERY_API_KEY` (opcional si proyecto público)
- `VITE_KONTENT_MANAGEMENT_API_KEY` (opcional)
- `VITE_KONTENT_PREVIEW_API_KEY` (opcional)

## Scripts
- `npm run dev` – modo desarrollo Vite
- `npm run build` – compila TypeScript y genera build de producción
- `npm run preview` – vista previa local del build
- `npm run format` – chequeo (lint + formato) con Biome sin escribir cambios
- `npm run format:fix` – aplica fixes automáticos (formato + algunas reglas)

## Formato y Lint (Biome solo)
Se eliminó Prettier para evitar duplicidad. Biome cubre:
- Formateo consistente de código
- Reglas de lint (calidad + estilo)
- Auto-fixes

Ejemplos:
```
npm run format       # Ver qué cambiaría
npm run format:fix   # Aplicar cambios
```

Si deseas ignorar rutas crea/ajusta un `biome.json` (ya presente) y usa `"files"` / `"ignore"`.

## Flujo de detección de duplicados
1. Se consultan items `page` por cada idioma configurado.
2. Se filtran sólo los que tienen `url_slug` o `slug`.
3. Se agrupan por valor de slug.
4. Se descartan grupos donde sólo existe un content item (aunque tenga múltiples variantes de idioma).
5. Cada grupo restante representa un “duplicado real”: mismo slug usado en distintos content items.

## Estructura de tipos relevante
- `DuplicateGroup` (interno) agrupa items y sus variantes de idioma.
- `DuplicateResult.duplicates` expone arreglo compatible (`DuplicateItem[]`) para UI.

## Despliegue en Netlify
1. Haz build: `npm run build`
2. Publica carpeta `dist/`.
3. Asegura variables de entorno configuradas en Netlify UI.
4. (Opcional) Ajusta headers de seguridad en `netlify.toml` si se amplían orígenes permitidos.

## Próximos pasos sugeridos
- Unificar modelo público e interno (`DuplicateGroup`) si ya no se requiere compatibilidad con la forma antigua
- Añadir tests ligeros para la lógica de agrupación
- Agregar toggle de idiomas dinámico en la UI

---
Mantén el código limpio ejecutando regularmente:
```
npm run format:fix
```
Esto asegura cero errores de lint y formato consistente.