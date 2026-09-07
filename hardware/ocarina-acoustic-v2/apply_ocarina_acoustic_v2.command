#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
WEB_MODEL_DIR="$REPO_ROOT/public/models"
WEB_MODEL_PATH="$WEB_MODEL_DIR/BM-OC-002.glb"

python3 "$SCRIPT_DIR/helmholtz_tuning_v2.py"

BLENDER_APP="/Applications/Blender.app/Contents/MacOS/Blender"
if [[ ! -x "$BLENDER_APP" ]]; then
  echo "No encontré Blender en /Applications/Blender.app"
  echo "Instálalo o ejecuta build_ocarina_acoustic_v2.py desde tu Blender."
  exit 1
fi

"$BLENDER_APP" --background --python "$SCRIPT_DIR/build_ocarina_acoustic_v2.py"
"$BLENDER_APP" "$SCRIPT_DIR/OCARINA_ACOUSTIC_V2.blend" --background --python "$SCRIPT_DIR/validate_ocarina_acoustic_v2.py"
"$BLENDER_APP" "$SCRIPT_DIR/OCARINA_ACOUSTIC_V2.blend" --background --python "$SCRIPT_DIR/render_cutaway_v2.py"

mkdir -p "$WEB_MODEL_DIR"
cp "$SCRIPT_DIR/OCARINA_ACOUSTIC_V2.glb" "$WEB_MODEL_PATH"

echo "V2 terminada dentro de: $SCRIPT_DIR"
echo "Modelo web publicado localmente en: $WEB_MODEL_PATH"
