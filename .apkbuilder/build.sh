#!/usr/bin/env bash
set -euo pipefail
CFG=.apkbuilder/config.json
APP_NAME=$(jq -r .appName "$CFG")
APP_ID=$(jq -r .appId "$CFG")
VER_NAME=$(jq -r .versionName "$CFG")
VER_CODE=$(jq -r .versionCode "$CFG")
BG=$(jq -r .iconBg "$CFG")
MODE=$(jq -r .mode "$CFG")
ROOT="$(pwd)"
mkdir -p output

copy_icons() {
  local res="$1" name="$2"
  [ -d "$ROOT/.apkbuilder/icons" ] || return 0
  for d in "$ROOT"/.apkbuilder/icons/mipmap-*; do
    local dn; dn=$(basename "$d")
    mkdir -p "$res/$dn"
    rm -f "$res/$dn/$name.webp" "$res/$dn/${name}_round.webp" "$res/$dn/${name}_foreground.webp"
    cp "$d/ic_launcher.png" "$res/$dn/$name.png"
    cp "$d/ic_launcher_round.png" "$res/$dn/${name}_round.png"
    cp "$d/ic_launcher_foreground.png" "$res/$dn/${name}_foreground.png"
  done
}

if [ "$MODE" = "web" ]; then
  cd "$ROOT/project"
  WEB="."
  if [ -f package.json ] && jq -e '.scripts.build' package.json >/dev/null 2>&1; then
    npm install --no-audit --no-fund
    npm run build
    for d in dist build out www public; do
      if [ -f "$d/index.html" ]; then WEB="$d"; break; fi
    done
  elif [ ! -f index.html ]; then
    f=$(find . -name index.html -not -path "*/node_modules/*" | head -n 1 || true)
    if [ -n "$f" ]; then WEB=$(dirname "$f"); fi
  fi
  [ -f "$WEB/index.html" ] || { echo "index.html not found"; exit 1; }
  WEBABS="$(cd "$WEB" && pwd)"
  mkdir -p /tmp/cap/www
  (cd "$WEBABS" && tar cf - --exclude=./node_modules .) | (cd /tmp/cap/www && tar xf -)
  cd /tmp/cap
  npm init -y >/dev/null
  npm install --no-audit --no-fund @capacitor/core@6 @capacitor/cli@6 @capacitor/android@6
  jq -n --arg id "$APP_ID" --arg name "$APP_NAME" '{appId:$id,appName:$name,webDir:"www"}' > capacitor.config.json
  npx cap add android
  npx cap sync android
  RES=android/app/src/main/res
  if [ -d "$ROOT/.apkbuilder/icons" ]; then
    copy_icons "$RES" ic_launcher
    mkdir -p "$RES/mipmap-anydpi-v26" "$RES/values"
    cat > "$RES/mipmap-anydpi-v26/ic_launcher.xml" <<'EOF'
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
  <background android:drawable="@color/ic_launcher_background"/>
  <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
EOF
    cp "$RES/mipmap-anydpi-v26/ic_launcher.xml" "$RES/mipmap-anydpi-v26/ic_launcher_round.xml"
    printf '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n  <color name="ic_launcher_background">%s</color>\n</resources>\n' "$BG" > "$RES/values/ic_launcher_background.xml"
  fi
  sed -i "s/versionCode [0-9]*/versionCode $VER_CODE/; s/versionName \"[^\"]*\"/versionName \"$VER_NAME\"/" android/app/build.gradle
  cd android
  chmod +x gradlew
  ./gradlew assembleDebug --no-daemon
  cp app/build/outputs/apk/debug/*.apk "$ROOT/output/app.apk"
else
  cd "$ROOT/project"
  S=$(find . -maxdepth 3 \( -name settings.gradle -o -name settings.gradle.kts \) | head -n 1 || true)
  [ -n "$S" ] || { echo "settings.gradle not found"; exit 1; }
  cd "$(dirname "$S")"
  if [ -d "$ROOT/.apkbuilder/icons" ]; then
    M=$(find . -path "*/src/main/AndroidManifest.xml" -not -path "*/build/*" | head -n 1 || true)
    if [ -n "$M" ]; then
      RES="$(dirname "$M")/res"
      ICON=$(grep -o 'android:icon="@mipmap/[A-Za-z0-9_]*"' "$M" | head -n 1 | sed 's/.*@mipmap\///; s/"//' || true)
      [ -n "$ICON" ] || ICON=ic_launcher
      copy_icons "$RES" "$ICON"
      rm -f "$RES"/mipmap-anydpi*/"$ICON".xml "$RES"/mipmap-anydpi*/"${ICON}_round".xml
      if ! grep -q 'android:icon=' "$M"; then
        sed -i 's/<application/<application android:icon="@mipmap\/'"$ICON"'" android:roundIcon="@mipmap\/'"$ICON"'_round"/' "$M"
      fi
    fi
  fi
  if [ -f ./gradlew ]; then chmod +x ./gradlew; G=./gradlew; else G=gradle; fi
  $G assembleDebug --no-daemon
  APK=$(find . -path "*/build/outputs/apk/debug/*.apk" | head -n 1 || true)
  [ -n "$APK" ] || { echo "APK not found"; exit 1; }
  cp "$APK" "$ROOT/output/app.apk"
fi
ls -la "$ROOT/output"
