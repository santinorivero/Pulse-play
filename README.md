# PULSE ARENA — actualización de juegos

Sitio estático HTML/CSS/JavaScript, sin dependencias externas.

## Archivos
- `index.html`: estructura y navegación.
- `styles.css`: diseño responsive y controles.
- `app.js`: lógica de los cinco minijuegos, resultados y guardado local.
- `assets/pulse.svg`: icono original del sitio.

## Minijuegos actualizados
- **Size Sense**: cinco comparaciones por desafío, control de escala proporcional con slider y botones, confirmación bloqueada, medida real/estimada, error proporcional, puntuación y dato contextual. La puntuación usa `100 × exp(-1,25 × |ln(estimación/real)|)`, por lo que el doble y la mitad del valor real dan la misma puntuación.
- **Time Lock**: duración objetivo visible antes de iniciar, cronometraje oculto con `performance.now()`, detener manualmente, resultados por ronda, dificultad fácil/difícil y selección de 1, 3, 5, 10 o cantidad personalizada (1–20). Cada ronda vale 0–10; el resultado general se normaliza a 0–100 para mantener compatibilidad con la tarjeta diaria existente.
- **Color Recall, Reflex Rush y Pattern Breaker** siguen incluidos y jugables. Se conservan el archivo, estadísticas y guardado local.

## Publicar en GitHub Pages
1. Descomprimí el ZIP.
2. En `https://github.com/santinorivero/pulse-play`, pestaña **Code**, reemplazá `index.html`, `styles.css` y `app.js` por los de esta carpeta.
3. Si `assets/` ya existe, verificá que incluya `pulse.svg`; si no, subí la carpeta `assets`.
4. Guardá los cambios con **Commit changes**.
5. Esperá la publicación de GitHub Pages y recargá la web con `Ctrl+F5` en PC. En móvil, recargá o abrí una pestaña privada si sigue apareciendo la versión anterior.

## Límites conocidos
- El progreso y los resultados se guardan en `localStorage` del dispositivo.
- Los desafíos diarios son deterministas por fecha y juego en este navegador; todavía no hay un servidor que garantice sincronización mundial ni valide resultados.
- Salas privadas, emparejamiento, clasificación global y partidas simultáneas requieren backend y siguen desconectados. No se muestran como partidas online reales.
- Las siluetas se representan con símbolos emoji del sistema para evitar usar imágenes de terceros sin licencia.
