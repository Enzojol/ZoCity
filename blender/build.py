# Construit un modèle de la ville et cuit sa lumière dans un atlas.
#
#   Blender -b -P blender/build.py -- <modèle> <dossier de sortie> [échantillons] [taille d'atlas]
#
# scripts/bake-city.sh enchaîne tous les modèles et les compresse.
import importlib
import os
import sys

sys.path[:0] = [os.path.dirname(__file__), os.path.join(os.path.dirname(__file__), "models")]

argv = sys.argv[sys.argv.index("--") + 1 :]
name, out = argv[0], os.path.abspath(argv[1])
samples = int(argv[2]) if len(argv) > 2 else 256
atlas = int(argv[3]) if len(argv) > 3 else 1024

import lib  # noqa: E402

lib.reset(samples)
lib.dusk_lighting()
importlib.import_module(name).build(out, atlas)
