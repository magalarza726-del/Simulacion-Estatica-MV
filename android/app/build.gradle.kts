import java.net.URL

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.maverick.torremv"
    compileSdk = 35
    defaultConfig {
        applicationId = "com.maverick.torremv"
        minSdk = 26
        targetSdk = 34
        versionCode = 7
        versionName = "7.0"
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }
    sourceSets.getByName("main").assets.srcDir(layout.buildDirectory.dir("generated/offlineAssets"))
}

dependencies {
    implementation("androidx.webkit:webkit:1.12.1")
}

val prepareWebAssets by tasks.registering {
    group = "build"
    description = "Empaqueta la simulación y descarga las bibliotecas 3D SOLO durante la compilación"
    val webRoot = rootProject.projectDir.parentFile
    val webFiles = listOf("index.html", "styles.css", "app.js", "physics-model.js")
    inputs.files(webFiles.map { webRoot.resolve(it) })
    outputs.dir(layout.buildDirectory.dir("generated/offlineAssets"))
    doLast {
        val dest = layout.buildDirectory.dir("generated/offlineAssets").get().asFile
        dest.mkdirs()
        webFiles.forEach { name ->
            val source = webRoot.resolve(name)
            require(source.isFile) { "Archivo web ausente: ${source.path}. Abre android/ DENTRO del repositorio." }
            source.copyTo(dest.resolve(name), overwrite = true)
        }
        val appJs = dest.resolve("app.js")
        val threeCdn = "https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js"
        val cannonCdn = "https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.js"
        val sourceJs = appJs.readText(Charsets.UTF_8)
        require(sourceJs.contains(threeCdn) && sourceJs.contains(cannonCdn)) {
            "No se reconocen los imports CDN; comprueba la versión de app.js"
        }
        appJs.writeText(sourceJs.replace(threeCdn, "./vendor/three.module.js")
            .replace(cannonCdn, "./vendor/cannon-es.js"), Charsets.UTF_8)
        val vendor = dest.resolve("vendor").apply { mkdirs() }
        val libs = listOf(
            Triple(threeCdn, vendor.resolve("three.module.js"), 100_000L),
            Triple(cannonCdn, vendor.resolve("cannon-es.js"), 50_000L)
        )
        libs.forEach { (url, file, minSize) ->
            if (!file.isFile || file.length() < minSize) {
                val connection = URL(url).openConnection().apply {
                    connectTimeout = 30_000
                    readTimeout = 60_000
                }
                connection.getInputStream().use { input ->
                    file.outputStream().use { input.copyTo(it) }
                }
            }
            require(file.length() >= minSize) { "Biblioteca 3D no válida: $url" }
        }
        require(!appJs.readText().contains("https://cdn.jsdelivr.net")) { "Importación externa encontrada" }
    }
}

tasks.named("preBuild") { dependsOn(prepareWebAssets) }
