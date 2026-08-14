# Laboratorio 3D de equilibrio de una torre — GitHub Pages

Versión estática sin proceso de compilación. Usa **Three.js** para la escena y **cannon-es** para la dinámica de cuerpo rígido con rótula.

## Publicar
1. Sube `index.html`, `styles.css` y `app.js` a la raíz de un repositorio.
2. GitHub → Settings → Pages → Deploy from a branch → `main` / root.
3. Abre la URL de GitHub Pages.

## Qué implementa
- Base circular de radio físico 20 cm, con plano polar y marcas de 10°.
- Gravedad real `g = 9.81 m/s²`.
- Rótula física mediante `PointToPointConstraint`: transmite fuerza, no momento.
- 3 cables, poleas P1/P2/P3 y masas colgantes visibles.
- Sliders en tiempo real para m1, m2, m3 y los tres vectores de posición (radio + ángulo).
- Altura de torre 10–100 cm y tres modelos visuales.
- Botón de cálculo de equilibrio: conserva el radio actual de r3 y calcula su dirección + m3.
- Vectores r1, r2, r3 dibujados sobre la base.
- DCL con componentes x y z de T1/T2/T3 y reacción, y el peso únicamente en j.
- 3 modos de cámara: horizontal, vertical y libre; zoom +/−.
- 4 reinicios: torre, poleas, masas y todo.

## Nota física
Al cambiar sliders no se pulsa “actualizar”: geometría, fuerzas, resultados y dibujo cambian de inmediato. La inclinación de la torre sí evoluciona dinámicamente (no salta), porque la escena integra las ecuaciones de movimiento. El peso se aplica por la gravedad del motor físico. Las tensiones se modelan como cuerdas ideales con magnitud `T = m g`; la dirección se recalcula en cada cuadro desde la punta de la torre hacia cada polea. La rótula mantiene conectado el pie de la torre al centro de la base.

Para que el botón pueda determinar una solución única cuando m3 y r3 son editables, se conserva el **radio actual** de r3 y se calcula su ángulo y la masa m3 necesarios para anular el momento en la posición vertical.


## V4 — entradas numéricas
- m1, m2 y m3: 0.5 g a 1000.0 g, paso de 0.1 g.
- Cada masa puede ajustarse con slider o escribirse directamente.
- Los ángulos de P1, P2 y P3 pueden ajustarse con slider o escribirse con paso de 0.1°.
- Todos los cambios siguen siendo en tiempo real; no hay botón de actualización.
