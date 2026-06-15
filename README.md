
# Security+ SY0-701 Study App

Built from the attached study notes and 100-question final exam.

## Features
- React web app
- 100-question timed exam simulator
- 20-question randomized practice mode
- Instant feedback and explanations
- Weak-area tracking in local storage
- Flashcards
- PDF-to-question converter starter in `tools/pdf-to-questions.js`
- Capacitor configuration for Android APK builds
- GitHub Actions workflow to compile and download a debug APK

## Run locally
```bash
npm install
npm run dev
```

## Build web app
```bash
npm run build
npm run preview
```

## Build Android APK locally
Requires Android Studio/Android SDK + Java 17.
```bash
npm install
npm run android:init
npm run android:apk
```
APK output:
```text
android/app/build/outputs/apk/debug/app-debug.apk
```

## Build APK in GitHub Actions
1. Push this folder to GitHub.
2. Open Actions > Build Android APK.
3. Run workflow.
4. Download artifact: `SecurityPlus701-debug-apk`.

## Question bank
The curated bank is in:
```text
src/data/questions.json
```
Total questions: 100
