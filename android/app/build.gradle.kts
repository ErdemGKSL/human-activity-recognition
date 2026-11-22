import java.util.Properties

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

// Throwaway release key, produced by ../make_keystore.sh (gitignored). The password file is
// read at configuration time so no secret lives in the build script.
val keystoreDir = rootProject.file("keystore")
val keystoreProps = Properties().apply {
    val f = File(keystoreDir, "keystore.properties")
    if (f.exists()) f.inputStream().use { load(it) }
}

android {
    namespace = "com.example.hardemo"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.example.hardemo"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "0.1.0"
    }

    signingConfigs {
        if (keystoreProps.getProperty("storeFile") != null) {
            create("release") {
                storeFile = File(keystoreDir, keystoreProps.getProperty("storeFile"))
                storePassword = keystoreProps.getProperty("storePassword")
                keyAlias = keystoreProps.getProperty("keyAlias")
                keyPassword = keystoreProps.getProperty("keyPassword")
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            signingConfig = signingConfigs.findByName("release")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    // model.json is already JSON text; keep it uncompressed so AssetManager can stream it cheaply.
    androidResources {
        noCompress += "json"
    }
    testOptions {
        unitTests.all { it.systemProperty("har.model", file("src/main/assets/model.json").absolutePath) }
    }
}

dependencies {
    // android.jar ships org.json only as stubs for JVM unit tests; the real one is needed there.
    testImplementation("org.json:json:20240303")
    testImplementation("junit:junit:4.13.2")
}
