# Portada del curso DDSI · K3003

Sitio estático de la cátedra de Diseño de Sistemas de Información (UTN FRBA), publicado con GitHub Pages en
`https://ddsutn-k3003.github.io/`. Las clases viven en otro repositorio (`ddsutn-k3003/clases`) y se publican bajo `/clases/`.

## Qué se edita y dónde

| Qué | Dónde |
|---|---|
| Fechas del cronograma | La planilla de Google (se lee sola al construir, todos los días). Copia de respaldo en `data/cronograma.csv` |
| Documentos principales y equipo | `data/curso.json` |
| Roadmap por bloques | `data/roadmap.json` (cada tema tiene un `match` que busca su fecha en el cronograma; el build avisa si algo no coincide) |
| TPA: etapas, consignas, rúbricas y material | `data/tpa.json` (las consignas y rúbricas van en `consignas`, por número de entrega: `"1"`, `"2"`, … `"final"`, `"diciembre"`) |
| Parciales: errores, autocorrección, tarjetas y parciales viejos | `data/parciales.json` |
| PDF u otros archivos propios | carpeta `public/` (se copia tal cual; por ejemplo `public/parciales/2026-primer-parcial.pdf` se abre en `/parciales/2026-primer-parcial.pdf`) |
| Apuntes teóricos | `data/apuntes.json` |
| Links de utilidad | `data/links.json` |
| Clases publicadas | Salen del repo `clases` (`/clases/classes.json`). Copia de respaldo en `data/classes.json` |

Un link vacío (`"url": ""`) se muestra como "a definir".

## Comandos

```
npm install
npm run sync     # trae el cronograma y las clases (si falla, se conserva la copia guardada)
npm run build    # genera dist/
npm run serve    # sirve dist/ en http://localhost:4190
```

Si el cronograma de un año nuevo está en otra pestaña de la planilla, usar `CRONOGRAMA_GID=<gid> npm run sync`.

## Cómo está armado

- Sin framework: `scripts/build.mjs` arma el HTML a partir de los datos de `data/`, y `src/` tiene los estilos y el JS.
- Las animaciones usan solo `transform` y `opacity`, y respetan `prefers-reduced-motion`.
- La mascota (Compi) está dibujada en SVG en `scripts/compi.mjs`; su comportamiento está en `src/main.js`.
- Los datos de alumnos (planilla de seguimiento) no se publican acá: la página solo enlaza a la planilla, que tiene acceso restringido.
