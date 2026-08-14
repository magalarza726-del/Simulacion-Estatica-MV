# Laboratorio 3D — Torre en equilibrio

Aplicación estática para GitHub Pages.

## Uso
1. Sube `index.html`, `styles.css` y `app.js` a la raíz de un repositorio.
2. En GitHub: Settings → Pages → Deploy from a branch → `main` / root.
3. Abre la URL de GitHub Pages.

## Modelo
- Altura de la torre: 0.34 m.
- Gravedad: 9.81 m/s².
- La rótula está en el origen.
- `r1` y `r2` son vectores polares en el plano de la base (radio + ángulo).
- Para que `m3` y `r3` sean únicos, la polea 3 se restringe al radio experimental fijo de 0.08 m.
- La simulación dinámica representa la torre como cuerpo rígido articulado en una rótula; las tensiones se modelan cuasiestáticamente como `T = mg`.

## Modos de cámara
- Horizontal: arrastre rota solo en azimut.
- Vertical: arrastre rota solo en elevación.
- Libre: arrastre rota en ambos ejes.
