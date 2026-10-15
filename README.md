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


## V5 — radios, modelos y masa estructural
- r1, r2 y r3: slider + entrada numérica, 2.0 cm a 100.0 cm, paso 0.1 cm.
- 9 modelos de torre, todos convergen en un único nudo superior para los tres cables.
- Cada segmento/palito estructural pesa 1.0 g; la masa de la torre y su centro de masa se recalculan automáticamente.
- La solución analítica de m3/r3 no cambia: el peso de la torre no produce momento en la postura vertical.
- La dinámica de inclinación sí usa el peso estructural calculado y g=9.81 m/s².
- El límite de caída es el contacto geométrico con el disco de madera, no un ángulo fijo arbitrario.
- Las poleas están giradas 90° respecto a la versión anterior.


## V6 — masa independiente y límite de 85°
- Se eliminó por completo la relación `1 palito = 1 g`.
- La masa de la torre se selecciona manualmente entre 1.0 g y 1000.0 g mediante slider + celda numérica.
- Cambiar el modelo de torre no cambia su masa seleccionada.
- El indicador `Equilibrada` y la dinámica usan exactamente la misma tolerancia de equilibrio; una torre marcada como equilibrada vuelve y permanece vertical.
- La inclinación máxima está limitada a 85.0°.
- La respuesta continúa siendo sobreamortiguada, sin rebote.


## V7 — inclinación gradual y Android sin conexión

La versión V6 podía llevar la torre directamente a 85° ante un desequilibrio mínimo cuando su búsqueda de estabilidad no encontraba una raíz. En V7 se añade un **modo didáctico estabilizado** (predeterminado): el momento neto vertical de los tres cables determina la inclinación mediante `θ = min(85°, |M| / k)`, siendo `k = 0.18 N·m/rad` una **rigidez angular virtual ajustable**. Por ejemplo, con la configuración inicial, 0.1 g extra en un cable produce aproximadamente 0.05° en lugar de 85°. Se conserva por separado el modo **rótula ideal** para comparar los resultados.

**Importante:** la estabilización virtual no pertenece a una rótula ideal sin momento restaurador. La simulación proporcional sirve para analizar el desbalance y explorar la inclinación; no sustituye el análisis estructural completo de estabilidad. Ver [VERIFICACION_V7.md](VERIFICACION_V7.md).

### APK para Android

La carpeta [android/](android/) contiene el proyecto Kotlin para Android Studio. El flujo [Compilar APK Android offline](.github/workflows/build-android.yml) genera un APK debug instalable como artefacto **Torre-MV-Offline-APK** en GitHub Actions.

El primer build requiere conexión para obtener Gradle y las bibliotecas; el APK resultante contiene Three.js, cannon-es, HTML, CSS y JavaScript en recursos locales y **no solicita permiso de Internet**. Requiere Android 8.0+ y soporte WebGL en Android WebView.

Pruebas de regresión: `node --test tests/physics.test.mjs`. Para detalles de compilación, ver [android/README.md](android/README.md).
