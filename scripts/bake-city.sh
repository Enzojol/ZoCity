#!/usr/bin/env bash
# Reconstruit les modèles de la ville et les compresse dans public/city.
#   scripts/bake-city.sh            tous les modèles
#   scripts/bake-city.sh gym tower  seulement ceux-là
set -euo pipefail

BLENDER="${BLENDER:-/Applications/Blender.app/Contents/MacOS/Blender}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RAW="$(mktemp -d)"
trap 'rm -rf "$RAW"' EXIT

# modèle:taille d'atlas[:échantillons]. Les bâtiments vus de près ont droit à plus de détail que le fond.
# Les immeubles de fond ont de grands murs unis, où le bruit de la cuisson se voit : plus d'échantillons.
ALL="gym:2048 tower:2048 school:2048 workshop:1536 post:1536 interests:2048 square:2048 filler:2048:1024"
WANTED="${*:-}"

for entry in $ALL; do
  IFS=: read -r name atlas samples <<<"$entry"
  samples="${samples:-256}"
  if [ -n "$WANTED" ] && ! grep -qw "$name" <<<"$WANTED"; then continue; fi
  echo "== $name ($atlas px, $samples échantillons)"
  "$BLENDER" -b -P "$ROOT/blender/build.py" -- "$name" "$RAW" "$samples" "$atlas" 2>&1 | grep -E "TRIANGLES|EXPORTED|Traceback|Error" || true
  [ -f "$RAW/$name.glb" ] || { echo "échec : $name" >&2; exit 1; }
  npx gltf-transform webp "$RAW/$name.glb" "$RAW/$name.webp.glb" --quality 82 >/dev/null
  npx gltf-transform meshopt "$RAW/$name.webp.glb" "$ROOT/public/city/$name.glb" >/dev/null
  ls -la "$ROOT/public/city/$name.glb" | awk '{print "   ", $5, "octets"}'
done
du -sh "$ROOT/public/city"
