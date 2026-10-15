# Torre MV – Android offline

Abre esta carpeta android/ en Android Studio, manteniéndola dentro del repositorio (index.html, app.js, styles.css y physics-model.js están en la carpeta superior). Pulsa Build > Build APK(s).

El primer build requiere conexión para descargar Gradle, AndroidX y bibliotecas JS 3D. El APK resultante no requiere Internet: Three.js 0.169.0, cannon-es 0.20.0 y HTML/CSS/JS se integran como assets locales. El manifiesto no solicita permiso INTERNET.

También puedes compilar en GitHub > Actions > Compilar APK Android offline. Abre una ejecución exitosa y descarga el artefacto Torre-MV-Offline-APK (dentro encontrarás app-debug.apk). Es un APK de depuración instalable, no una versión firmada para Play Store.

Requisitos: Android 8.0 o superior y Android WebView compatible con WebGL. No se ha probado aún en un equipo físico.
