# V7: estabilidad proporcional y Android offline

## Diagnóstico
La V6 buscaba una raíz del momento total para cada orientación. Si no encontraba una raíz antes del máximo, enviaba la torre al límite de 85°, incluso ante un momento residual pequeño. Una rótula ideal carece de rigidez, de modo que el equilibrio vertical puede ser inestable.

## Modelo estabilizado didáctico
En la posición vertical, M = |sum(r_tope × (m_i*g*u_i))|.
En modo proporcional, se añade un resorte angular VIRTUAL de rigidez k (0.18 N·m/rad por defecto) y θ = min(85°, |M|/k). A rigidez fija, duplicar el momento duplica la inclinación, antes del tope. No es una rótula ideal: no se debe confundir con la física de una torre real sin estabilizador.

El modo rótula ideal conserva el solucionador previo para comparación (puede llegar a 85° incluso ante momento mínimo si no aparece equilibrio estable). Los cambios de orientación se interpolan en el tiempo sin saltos.

La fórmula de m3 usa la altura efectiva entre la punta y las poleas, incluido el desfase de 1.2 cm.

## Pruebas: node --test tests/physics.test.mjs
- 3 masas simétricas: momento prácticamente cero.
- Añadir 0.1 g: inclinación menor a 1°.
- Respuesta lineal al momento antes de saturación.
- Desequilibrios espejo simétricos.
- Límite máximo de 85°.
- Entradas físicas inválidas rechazadas.

## Android
El subproyecto android/ usa Kotlin, WebViewAssetLoader y recursos WebGL locales. No solicita permiso INTERNET. La compilación requiere conexión por primera vez para resolver Gradle/AndroidX y descargar las dos bibliotecas 3D; el APK resultante funciona sin red.

## Pendiente
Confirmar el build de Gradle desde GitHub Actions y probar WebGL en hardware real.
