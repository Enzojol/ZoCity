# Immeubles de fond : une série courte partagée par tous les lots libres, sur un seul atlas.
# La scène les instancie et les teinte : les murs sont donc neutres et clairs.
import random

from lib import bake_export_split, box, mat, windows

FLOOR = 0.46
SPACING = 12.0
# Largeur, profondeur, étages. Le nombre d'étages sert à choisir l'immeuble selon le quartier.
VARIANTS = [
    (5.0, 4.8, 2),
    (4.6, 5.0, 3),
    (5.0, 4.4, 3),
    (4.8, 5.0, 4),
    (5.0, 4.6, 5),
    (4.6, 4.8, 6),
    (5.0, 5.0, 7),
    (4.4, 4.6, 9),
]


def building(i, w, d, floors):
    cx = i * SPACING
    wall = mat("wall", "#e6e0da", 0.82)
    slab = mat("slab", "#cfc8c6", 0.8)
    roof = mat("roof", "#a7a2b0", 0.85)
    unit = mat("unit", "#8f88a8", 0.7)
    shop = mat("shop", "#000000", 0.5, emit="#ffa35a", power=1.1)
    trim = mat("trim", "#3a3555", 0.6)
    rng = random.Random(100 + i)
    h = floors * FLOOR

    box(f"body_{i}", (w, d, h), (cx, 0, h / 2), wall, 0.015)
    box(f"parapet_{i}", (w + 0.06, d + 0.06, 0.07), (cx, 0, h + 0.02), slab, 0.008)
    box(f"roof_{i}", (w - 0.2, d - 0.2, 0.03), (cx, 0, h + 0.06), roof, 0)

    # Rez-de-chaussée commerçant sur les faces vues
    cols_x = max(3, round(w / 0.5))
    cols_y = max(3, round(d / 0.5))
    box(f"shop_f_{i}", (w - 0.5, 0.025, 0.3), (cx, -d / 2 - 0.012, 0.2), shop, 0)
    box(f"shop_l_{i}", (0.025, d - 0.5, 0.3), (cx - w / 2 - 0.012, 0, 0.2), shop, 0)
    box(f"fascia_f_{i}", (w - 0.4, 0.06, 0.05), (cx, -d / 2 - 0.03, 0.38), trim, 0)
    box(f"fascia_l_{i}", (0.06, d - 0.4, 0.05), (cx - w / 2 - 0.03, 0, 0.38), trim, 0)

    if floors > 1:
        z0, z1 = FLOOR, h
        rows = floors - 1
        windows("front", -d / 2, cx - w / 2 + 0.12, cx + w / 2 - 0.12, z0, z1, cols_x, rows, 0.27, 0.27, lit=0.2, seed=i * 3 + 1)
        windows("left", cx - w / 2, -d / 2 + 0.12, d / 2 - 0.12, z0, z1, cols_y, rows, 0.27, 0.27, lit=0.2, seed=i * 3 + 2)
        windows("right", cx + w / 2, -d / 2 + 0.12, d / 2 - 0.12, z0, z1, cols_y, rows, 0.27, 0.27, lit=0.1, seed=i * 3 + 3)

    for u in range(1 + i % 3):
        uw, ud, uh = 0.3 + rng.random() * 0.45, 0.3 + rng.random() * 0.45, 0.14 + rng.random() * 0.18
        ux = cx + (rng.random() - 0.5) * (w - uw - 0.6)
        uy = (rng.random() - 0.5) * (d - ud - 0.6)
        box(f"unit_{i}_{u}", (uw, ud, uh), (ux, uy, h + 0.075 + uh / 2), unit, 0.008)


def build(out, atlas):
    for i, (w, d, floors) in enumerate(VARIANTS):
        building(i, w, d, floors)
    bake_export_split("filler", out, atlas, SPACING, len(VARIANTS))
