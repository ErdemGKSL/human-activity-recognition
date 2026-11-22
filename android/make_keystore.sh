#!/usr/bin/env bash
# Creates a throwaway release keystore in android/keystore/ (gitignored). Not for store uploads:
# anyone who loses it simply generates a new one and reinstalls the app.
set -euo pipefail
cd "$(dirname "$0")"
dir=keystore
if [[ -f "$dir/keystore.properties" && -f "$dir/release.jks" ]]; then
  echo "keystore exists: $dir/release.jks"
  exit 0
fi
mkdir -p "$dir"
chmod 700 "$dir"
pass="$(head -c 32 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c 24)"
rm -f "$dir/release.jks"
# PKCS12 stores use one password for store and key.
keytool -genkeypair -noprompt \
  -keystore "$dir/release.jks" -storetype PKCS12 \
  -alias har-demo -keyalg RSA -keysize 2048 -validity 10000 \
  -dname "CN=HAR Demo, OU=Course Project, O=Example, C=TR" \
  -storepass "$pass" -keypass "$pass" 2>&1 | grep -v '^Picked up' || true
umask 077
cat > "$dir/keystore.properties" <<PROPS
storeFile=release.jks
storePassword=$pass
keyAlias=har-demo
keyPassword=$pass
PROPS
echo "created $dir/release.jks (password in $dir/keystore.properties)"
