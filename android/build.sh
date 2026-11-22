#!/usr/bin/env bash
# Usage: android/build.sh [model.json]
# Copies the model into assets (if given), makes the throwaway keystore if missing, runs the
# unit tests (Kotlin GRU vs. the model's PyTorch test_vectors) and builds the signed release APK
# into android/dist/har-demo.apk.
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
if [[ $# -ge 1 ]]; then
  src="$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"
  python3 -c 'import json,sys; d=json.load(open(sys.argv[1])); assert d["format"]=="har-gru-v1", d["format"]' "$src"
  cp "$src" "$here/app/src/main/assets/model.json"
  echo "model: $src"
fi
cd "$here"
if [[ ! -f local.properties ]]; then
  sdk="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-$HOME/android-sdk}}"
  echo "sdk.dir=$sdk" > local.properties
fi
./make_keystore.sh
./gradlew --no-daemon -q testDebugUnitTest assembleRelease
mkdir -p dist
cp app/build/outputs/apk/release/app-release.apk dist/har-demo.apk
sdk="$(sed -n 's/^sdk.dir=//p' local.properties)"
"$sdk/build-tools/34.0.0/apksigner" verify dist/har-demo.apk
echo "signed APK: $here/dist/har-demo.apk ($(du -h dist/har-demo.apk | cut -f1))"
