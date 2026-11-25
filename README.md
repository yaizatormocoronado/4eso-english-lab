# 4ESO English Lab

Web de inglés para 4º ESO (In Order Words): presentaciones de gramática, práctica de vocabulario, ejercicios en tres niveles y fichas en PDF para las 8 unidades.

- **Web publicada:** https://yaizatormocoronado.github.io/4eso-english-lab/
- `site/` – la web (es lo que se publica en GitHub Pages, rama `gh-pages`).
- `src/content/` – contenido de cada unidad (vocabulario, gramática, ejercicios).
- `src/build.py` – genera `site/js/data.js` y los PDF de `site/downloads/`.
- `registro/` – script de Google Sheets e instrucciones para registrar la actividad del alumnado.

## Actualizar la web

Después de cambiar algo en `site/`:

```bash
git add -A && git commit -m "Actualizar web" && git push && git subtree push --prefix site origin gh-pages
```
