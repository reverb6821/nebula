#!/usr/bin/env bash
# Crea un AppImage di Nebula Dock dal binario Linux prodotto da `bun run build:prod`.
#
# Uso:  bun run build:appimage          (esegue prima build:prod)
#       scripts/build-appimage.sh       (usa i binari gia' presenti in dist/)
#
# Richiede appimagetool nel PATH; se manca lo scarica una volta in
# ${XDG_CACHE_HOME:-~/.cache}/nebula-dock/.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

APP_ID="com.nebula.dock"
APP_NAME="nebula-dock"
VERSION="$(sed -n 's/^ *"version": *"\([^"]*\)".*/\1/p' neutralino.config.json | head -n 1)"

case "$(uname -m)" in
  x86_64)  ARCH="x86_64";  NEU_ARCH="linux_x64" ;;
  aarch64) ARCH="aarch64"; NEU_ARCH="linux_arm64" ;;
  *) echo "Architettura non supportata: $(uname -m)" >&2; exit 1 ;;
esac

BINARY="dist/${APP_NAME}/${APP_NAME}-${NEU_ARCH}"
if [[ ! -x "$BINARY" ]]; then
  echo "Binario non trovato: $BINARY. Esegui prima: bun run build:prod" >&2
  exit 1
fi

# ─── AppDir ────────────────────────────────────────────────────────────────
APPDIR="dist/appimage/${APP_NAME}.AppDir"
rm -rf "$APPDIR"
mkdir -p "$APPDIR/usr/bin" "$APPDIR/usr/share/applications" "$APPDIR/usr/share/icons/hicolor/256x256/apps"

install -m 755 "$BINARY" "$APPDIR/usr/bin/${APP_NAME}"

# Icona quadrata 256x256 (il logo sorgente non e' quadrato).
ICON_SRC="client/public/logo.png"
ICON_DST="$APPDIR/usr/share/icons/hicolor/256x256/apps/${APP_NAME}.png"
if command -v magick >/dev/null 2>&1; then
  magick "$ICON_SRC" -resize 256x256 -background none -gravity center -extent 256x256 "$ICON_DST"
else
  cp "$ICON_SRC" "$ICON_DST"
fi
ln -sf "usr/share/icons/hicolor/256x256/apps/${APP_NAME}.png" "$APPDIR/${APP_NAME}.png"
ln -sf "${APP_NAME}.png" "$APPDIR/.DirIcon"

cat > "$APPDIR/usr/share/applications/${APP_NAME}.desktop" <<DESKTOP
[Desktop Entry]
Type=Application
Name=Nebula Dock
GenericName=System Monitor
Comment=Monitor system resources, processes, services and Docker
Exec=${APP_NAME} %U
Icon=${APP_NAME}
Terminal=false
Categories=System;Monitor;
Keywords=system;monitor;process;service;systemd;docker;
StartupNotify=true
X-AppImage-Version=${VERSION}
DESKTOP
ln -sf "usr/share/applications/${APP_NAME}.desktop" "$APPDIR/${APP_NAME}.desktop"

# Il contenuto dell'AppImage e' montato in sola lettura, ma Neutralino scrive
# log, .storage (impostazioni, preferiti) e .tmp nella cartella dell'app
# (NL_PATH). --path la sposta in una cartella dati dell'utente.
cat > "$APPDIR/AppRun" <<'APPRUN'
#!/bin/sh
HERE="$(dirname "$(readlink -f "$0")")"
DATA_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/nebula-dock"
mkdir -p "$DATA_DIR"
cd "$DATA_DIR" || exit 1
exec "$HERE/usr/bin/nebula-dock" --path="$DATA_DIR" "$@"
APPRUN
chmod 755 "$APPDIR/AppRun"

# ─── appimagetool ──────────────────────────────────────────────────────────
if command -v appimagetool >/dev/null 2>&1; then
  APPIMAGETOOL="appimagetool"
else
  CACHE_DIR="${XDG_CACHE_HOME:-$HOME/.cache}/nebula-dock"
  APPIMAGETOOL="$CACHE_DIR/appimagetool-${ARCH}.AppImage"
  if [[ ! -x "$APPIMAGETOOL" ]]; then
    mkdir -p "$CACHE_DIR"
    echo "Scarico appimagetool in $APPIMAGETOOL"
    curl -fL --retry 3 -o "$APPIMAGETOOL.part" \
      "https://github.com/AppImage/appimagetool/releases/download/continuous/appimagetool-${ARCH}.AppImage"
    chmod 755 "$APPIMAGETOOL.part"
    mv "$APPIMAGETOOL.part" "$APPIMAGETOOL"
  fi
fi

OUTPUT="dist/Nebula_Dock-${VERSION}-${ARCH}.AppImage"
rm -f "$OUTPUT"
# APPIMAGE_EXTRACT_AND_RUN: appimagetool funziona anche senza FUSE 2.
ARCH="$ARCH" APPIMAGE_EXTRACT_AND_RUN=1 "$APPIMAGETOOL" --no-appstream "$APPDIR" "$OUTPUT"
chmod 755 "$OUTPUT"
echo "AppImage creato: $OUTPUT"
