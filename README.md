# PawnForge Android project

This is a native Android Studio project (Kotlin-free Java + Android WebView shell with bundled editor assets). It installs as an Android app and has its own app label/launcher entry. The editor assets are packaged locally; editing does not need a web server.

## Build an APK
1. Download and extract this ZIP on a PC or open the project in Android Studio.
2. Install Android SDK Platform 35 and Android Gradle Plugin support when prompted.
3. Open the `PawnForgeAndroid` folder as a project and wait for Gradle sync.
4. Select **Build > Build APK(s)**.
5. Android Studio will show the generated APK path, usually `app/build/outputs/apk/debug/app-debug.apk`.

This environment did not build or sign an APK. This is the Android Studio source project to build into an APK.

## Current capabilities
- Android app shell and launcher activity
- Local bundled Pawn editor UI
- Syntax coloring, line numbers, file tabs
- Open local source files through Android file picker
- Save `.pwn` / `.inc` using Android's system Save dialog
- Compiler console and configurable remote compiler endpoint
- Saves editor state in WebView local storage

## Compiler status
A real Pawn compiler engine is not bundled in this starter. To create `.amx` files, configure a trusted HTTPS backend in the editor's Compiler settings. That backend must run a compatible Pawn compiler with the required SA-MP/open.mp include files and return compiler output plus an AMX download URL or Base64 AMX data.

Do not expose a public endpoint that runs arbitrary shell commands. Use authentication, rate limiting, sandboxing, timeouts, and safe filename handling.
