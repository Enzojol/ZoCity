# Immeubles de fond : une série partagée par tous les lots libres, sur un seul atlas.
# La scène les instancie et les teinte : les murs sont donc neutres et clairs.
# Chaque modèle a sa silhouette et son toit, pour que deux voisins ne se ressemblent pas vus d'en haut,
# et une copie symétrique (voir lib.bake_export_split) double la série sans rien cuire de plus.
import random

import bmesh
from lib import bake_export_split, blob, box, cyl, frustum, mat, pane, prism_x, prism_y, windows

FLOOR = 0.46
SPACING = 12.0
# Étages de chaque modèle, dans l'ordre de DESIGNS. Le nombre d'étages sert à choisir l'immeuble selon le quartier.
FLOORS = [2, 2, 3, 3, 4, 4, 5, 6, 7, 9]

# Fenêtres : largeur, hauteur, pas entre deux fenêtres, et si elles portent meneau et store
STYLES = {
    "punched": (0.27, 0.27, 0.55, False),
    "tall": (0.17, 0.33, 0.42, False),
    "ribbon": (0.5, 0.2, 0.56, False),
    "big": (0.36, 0.3, 0.78, True),
}


def drop_faces(obj, test):
    """Retire d'un volume les faces cachées sous un toit : elles prendraient de la place dans l'atlas pour rien."""
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bm.normal_update()
    bmesh.ops.delete(bm, geom=[f for f in bm.faces if test(f.normal)], context="FACES")
    bm.to_mesh(obj.data)
    bm.free()


class M:
    """Matériaux partagés par toute la série."""

    def __init__(self):
        self.wall = mat("wall", "#e6e0da", 0.82)
        self.base = mat("base", "#c4bab6", 0.85)
        self.slab = mat("slab", "#cfc8c6", 0.8)
        self.roof = mat("roof", "#a7a2b0", 0.85)
        self.tiles = mat("tiles", "#9a8c98", 0.8)
        self.unit = mat("unit", "#8f88a8", 0.7)
        self.shop = mat("shop", "#000000", 0.5, emit="#ffa35a", power=1.1)
        self.trim = mat("trim", "#3a3555", 0.6)
        self.door = mat("door", "#5a4f6e", 0.6)
        self.tank = mat("tank", "#a98a72", 0.8)
        self.green = mat("green", "#6d9a6a", 0.85)
        self.green2 = mat("green2", "#88b07a", 0.85)
        self.solar = mat("solar", "#3c4a7a", 0.35)
        self.sign = mat("sign", "#000000", 0.5, emit="#ffe0c2", power=0.9)


def volume(m, tag, cx, x0, x1, y0, y1, z0, z1, style, seed, shop=False, lit=0.2, cap=True, bands=False, sides=("front", "left", "back", "right")):
    """Un volume d'immeuble : murs, fenêtres sur les faces voulues, acrotère. Les x sont relatifs à cx."""
    X0, X1 = cx + x0, cx + x1
    body = box(f"{tag}_body", (x1 - x0, y1 - y0, z1 - z0), (cx + (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), m.wall, 0)
    # Le dessus du volume porte la couleur du toit : pas de dalle posée dessus, dont le dessous gaspillerait l'atlas
    body.data.materials.append(m.roof)
    for p in body.data.polygons:
        if p.normal.z > 0.9:
            p.material_index = 1
    if cap:
        ring(m, tag, X0, X1, y0, y1, z1, 0.07, 0.12)
    else:
        drop_faces(body, lambda n: n.z > 0.9)
    start = z0
    if shop:
        start = z0 + FLOOR
        for face in ("front", "left"):
            if face not in sides:
                continue
            if face == "front":
                pane(m.shop, (x1 - x0 - 0.5, 0, 0.3), (cx + (x0 + x1) / 2, y0 - 0.004, z0 + 0.2), "front")
                box(f"{tag}_fascia_f", (x1 - x0 - 0.4, 0.06, 0), (cx + (x0 + x1) / 2, y0 - 0.03, z0 + 0.38), m.trim, 0)
            else:
                pane(m.shop, (0, y1 - y0 - 0.5, 0.3), (X0 - 0.004, (y0 + y1) / 2, z0 + 0.2), "left")
                box(f"{tag}_fascia_l", (0.06, y1 - y0 - 0.4, 0), (X0 - 0.03, (y0 + y1) / 2, z0 + 0.38), m.trim, 0)
        if "back" in sides:
            pane(m.door, (0.32, 0, 0.36), (cx + (x0 + x1) / 2 + 0.6, y1 + 0.004, z0 + 0.18), "back")
        if "right" in sides:
            pane(m.door, (0, 0.32, 0.36), (X1 + 0.004, (y0 + y1) / 2 - 0.5, z0 + 0.18), "right")
    rows = round((z1 - start) / FLOOR)
    if rows <= 0:
        return
    w, h, step, detail = STYLES[style]
    top = start + rows * FLOOR
    for k, face in enumerate(("front", "left", "back", "right")):
        if face not in sides:
            continue
        along = (x0, x1) if face in ("front", "back") else (y0, y1)
        length = along[1] - along[0]
        cols = max(2, round((length - 0.2) / step))
        u0, u1 = along[0] + 0.12, along[1] - 0.12
        if face in ("front", "back"):
            u0, u1 = u0 + cx, u1 + cx
        if style == "ribbon":
            w = (u1 - u0) / cols - 0.05
        plane = {"front": y0, "back": y1, "left": X0, "right": X1}[face]
        windows(face, plane, u0, u1, start, top, cols, rows, w, h, lit=lit if k < 2 else lit * 0.6, seed=seed * 7 + k, flat=True, detail=detail)
    if bands:
        # Un cordon par plancher : un rythme horizontal que les autres modèles n'ont pas
        for r in range(1, rows):
            ring(m, f"{tag}_band_{r}", X0, X1, y0, y1, start + r * FLOOR - 0.03, 0.025, 0.035)


def ring(m, tag, x0, x1, y0, y1, z, width, height):
    """Quatre bandes autour d'un volume, un peu en saillie : acrotère ou cordon."""
    o = 0.03
    zc = z + height / 2
    pane(m.slab, (x1 - x0 + 2 * o, width + o, height), ((x0 + x1) / 2, y0 + (width - o) / 2, zc))
    pane(m.slab, (x1 - x0 + 2 * o, width + o, height), ((x0 + x1) / 2, y1 - (width - o) / 2, zc))
    pane(m.slab, (width + o, y1 - y0 - 2 * width, height), (x0 + (width - o) / 2, (y0 + y1) / 2, zc))
    pane(m.slab, (width + o, y1 - y0 - 2 * width, height), (x1 - (width - o) / 2, (y0 + y1) / 2, zc))


def gable(m, tag, cx, x0, x1, y0, y1, z, rise, along="x", over=0.12):
    """
    Toit à deux pentes plein, avec débord et sous-face : son dessous, posé sur le volume, disparaît à la cuisson.
    Les pignons prennent la couleur des murs. La ligne de faîtage suit x ou y.
    """
    a0, a1 = (y0, y1) if along == "x" else (cx + x0, cx + x1)
    mid = (a0 + a1) / 2
    drop = over * rise / ((a1 - a0) / 2)
    profile = [(a0 - over, z - drop), (a0, z), (a1, z), (a1 + over, z - drop), (a1 + over, z - drop + 0.06), (mid, z + rise + 0.06), (a0 - over, z - drop + 0.06)]
    if along == "x":
        o = prism_x(f"{tag}_gable", profile, cx + x0, cx + x1, m.tiles, 0)
    else:
        o = prism_y(f"{tag}_gable", profile, y0, y1, m.tiles, 0)
    drop_faces(o, lambda n: n.z < -0.99)
    o.data.materials.append(m.wall)
    end = 0 if along == "x" else 1
    for p in o.data.polygons:
        if abs(p.normal[end]) > 0.99:
            p.material_index = 1


def water_tank(m, tag, x, y, z):
    """Réservoir sur pieds : la silhouette de toit qu'on reconnaît de loin."""
    for i, (dx, dy) in enumerate(((-0.2, -0.2), (0.2, -0.2), (0.2, 0.2), (-0.2, 0.2))):
        pane(m.trim, (0.04, 0.04, 0.3), (x + dx, y + dy, z + 0.15))
    box(f"{tag}_tank_deck", (0.56, 0.56, 0), (x, y, z + 0.32), m.trim, 0)
    cyl(f"{tag}_tank", 0.27, 0.46, (x, y, z + 0.57), m.tank, "z", 14)
    cyl(f"{tag}_tank_cap", 0.3, 0.17, (x, y, z + 0.88), m.trim, "z", 14, radius2=0.03)


def stair_core(m, tag, x, y, z, w=0.7, d=0.8, h=0.46):
    box(f"{tag}_core", (w, d, h), (x, y, z + h / 2), m.wall, 0)
    box(f"{tag}_core_cap", (w + 0.06, d + 0.06, 0), (x, y, z + h + 0.02), m.slab, 0)
    pane(m.door, (0.22, 0, 0.32), (x, y - d / 2 - 0.004, z + 0.16), "front")


def ac_units(m, tag, x, y, z, n, seed):
    rng = random.Random(seed)
    for i in range(n):
        ux, uy = x + i * 0.42, y + (rng.random() - 0.5) * 0.3
        box(f"{tag}_ac_{i}", (0.32, 0.26, 0.18), (ux, uy, z + 0.09), m.unit, 0)
        cyl(f"{tag}_fan_{i}", 0.08, 0.02, (ux, uy, z + 0.19), m.trim, "z", 10)


def planters(m, tag, x0, x1, y, z, seed, axis="x"):
    """Bacs plantés le long d'un bord de toit : le vert se voit de loin, même teinté."""
    rng = random.Random(seed)
    n = max(1, round((x1 - x0) / 0.7))
    for i in range(n):
        u = x0 + (i + 0.5) * (x1 - x0) / n
        px, py = (u, y) if axis == "x" else (y, u)
        box(f"{tag}_planter_{i}", (0.46 if axis == "x" else 0.26, 0.26 if axis == "x" else 0.46, 0.14), (px, py, z + 0.07), m.base, 0)
        for k in range(2):
            r = 0.13 + rng.random() * 0.07
            off = (k - 0.5) * 0.18
            blob(f"{tag}_leaf_{i}_{k}", r, (px + (off if axis == "x" else 0), py + (0 if axis == "x" else off), z + 0.14 + r * 0.6), m.green if k else m.green2)


def pergola(m, tag, x0, x1, y0, y1, z, h=0.42):
    for i, (px, py) in enumerate(((x0, y0), (x1, y0), (x1, y1), (x0, y1))):
        pane(m.trim, (0.05, 0.05, h), (px, py, z + h / 2))
    n = max(3, round((x1 - x0) / 0.18))
    for i in range(n):
        pane(m.tank, (0.04, y1 - y0 + 0.12, 0.04), (x0 + i * (x1 - x0) / (n - 1), (y0 + y1) / 2, z + h + 0.02))


def railing(m, tag, x0, x1, y0, y1, z):
    """Garde-corps fin autour d'une terrasse."""
    for i, (a, b, c, d) in enumerate(((x0, x1, y0, y0), (x0, x1, y1, y1), (x0, x0, y0, y1), (x1, x1, y0, y1))):
        pane(m.trim, (max(b - a, 0.025), max(d - c, 0.025), 0.025), ((a + b) / 2, (c + d) / 2, z + 0.22))
    for i in range(int((x1 - x0) / 0.5) + 1):
        pane(m.trim, (0.02, 0.02, 0.22), (x0 + i * 0.5, y0, z + 0.11))
    for i in range(int((y1 - y0) / 0.5) + 1):
        pane(m.trim, (0.02, 0.02, 0.22), (x0, y0 + i * 0.5, z + 0.11))


def solar(m, tag, x0, x1, y0, y1, z):
    rows = max(1, round((y1 - y0) / 0.55))
    for r in range(rows):
        y = y0 + (r + 0.5) * (y1 - y0) / rows
        o = box(f"{tag}_solar_{r}", (x1 - x0, 0.4, 0), ((x0 + x1) / 2, y, z + 0.14), m.solar, 0)
        o.rotation_euler[0] = 0.45
        pane(m.trim, (x1 - x0 - 0.1, 0.04, 0.12), ((x0 + x1) / 2, y + 0.1, z + 0.06))


def antenna(m, tag, x, y, z, h=0.9):
    cyl(f"{tag}_mast", 0.02, h, (x, y, z + h / 2), m.trim, "z", 6)
    for i in range(3):
        pane(m.trim, (0.32 - i * 0.08, 0.02, 0.02), (x, y, z + h * (0.55 + i * 0.15)))


def billboard(m, tag, x, y, z, w=1.3, h=0.55):
    """Panneau lumineux sans texte, tourné vers la rue."""
    for dx in (-w / 2 + 0.15, w / 2 - 0.15):
        pane(m.trim, (0.05, 0.05, 0.35), (x + dx, y, z + 0.175))
    box(f"{tag}_board", (w + 0.06, 0.06, h + 0.06), (x, y, z + 0.35 + h / 2), m.trim, 0)
    pane(m.sign, (w, 0, h), (x, y - 0.034, z + 0.35 + h / 2), "front")


def awning(m, tag, cx, x0, x1, y, z):
    o = box(f"{tag}_awning", (x1 - x0, 0.36, 0.03), (cx + (x0 + x1) / 2, y - 0.16, z), m.base, 0)
    o.rotation_euler[0] = 0.4


def chimney(m, tag, x, y, z, h=0.45):
    box(f"{tag}_chimney", (0.2, 0.26, h), (x, y, z + h / 2), m.base, 0)
    box(f"{tag}_chimney_cap", (0.26, 0.32, 0), (x, y, z + h + 0.02), m.slab, 0)


# Chaque modèle reçoit (matériaux, centre en x) et se tient dans un lot : à peu près -2,5 à 2,5 sur x et y.


def corner_house(m, cx):
    """Maison de coin à pignon, commerce au rez-de-chaussée."""
    t = "d0"
    volume(m, t, cx, -2.3, 2.3, -2.1, 2.1, 0, 2 * FLOOR, "tall", 1, shop=True, cap=False)
    gable(m, t, cx, -2.3, 2.3, -2.1, 2.1, 2 * FLOOR, 0.8, "x")
    awning(m, t, cx, -1.8, 1.8, -2.1, 0.5)
    chimney(m, t, cx + 1.4, 0.9, 2 * FLOOR + 0.3, 0.55)
    chimney(m, t, cx - 1.2, -0.7, 2 * FLOOR + 0.25, 0.5)


def garden_roof(m, cx):
    """Bas et large, toit-jardin et pergola."""
    t = "d1"
    z = 2 * FLOOR
    volume(m, t, cx, -2.5, 2.5, -2.3, 2.3, 0, z, "ribbon", 2, shop=True)
    planters(m, t, cx - 2.1, cx + 1.0, -1.95, z, 11)
    planters(m, t, -1.4, 1.2, cx - 2.15, z, 12, axis="y")
    pergola(m, t, cx + 0.4, cx + 2.0, 0.4, 1.8, z)
    stair_core(m, t, cx - 1.3, 1.4, z, 0.6, 0.7, 0.4)


def row_houses(m, cx):
    """Trois maisons de ville accolées, chacune son toit et sa hauteur."""
    t = "d2"
    volume(m, t + "a", cx, -2.4, -0.8, -2.2, 2.2, 0, 3 * FLOOR, "tall", 3, shop=True, sides=("front", "left", "back"))
    volume(m, t + "b", cx, -0.82, 0.82, -2.1, 2.1, 0, 3 * FLOOR - 0.12, "punched", 4, cap=False, sides=("front", "back"))
    gable(m, t + "b", cx, -0.82, 0.82, -2.1, 2.1, 3 * FLOOR - 0.12, 0.55, "y", 0.08)
    volume(m, t + "c", cx, 0.8, 2.4, -2.2, 2.2, 0, 2 * FLOOR, "big", 5, shop=True, sides=("front", "back", "right"))
    railing(m, t + "c", cx + 0.9, cx + 2.3, -2.1, 2.1, 2 * FLOOR)
    planters(m, t + "c", -1.6, 1.4, cx + 2.15, 2 * FLOOR, 13, axis="y")
    chimney(m, t + "a", cx - 1.9, 1.5, 3 * FLOOR, 0.35)


def mansard(m, cx):
    """Deux étages et un comble à la Mansart, lucarnes sur les deux faces vues."""
    t = "d3"
    z = 2 * FLOOR
    volume(m, t, cx, -2.4, 2.4, -2.3, 2.3, 0, z, "tall", 6, shop=True, cap=False, bands=True)
    ring(m, f"{t}_cornice", cx - 2.4, cx + 2.4, -2.3, 2.3, z, 0.08, 0.07)
    drop_faces(frustum(f"{t}_roof", cx - 2.4, cx + 2.4, -2.3, 2.3, z + 0.07, 0.4, 0.52, m.tiles), lambda n: n.z < -0.99)
    box(f"{t}_roof_top", (3.9, 3.7, 0), (cx, 0, z + 0.615), m.roof, 0)
    for i, u in enumerate((-1.3, 0, 1.3)):
        box(f"{t}_dormer_f{i}", (0.36, 0.34, 0.34), (cx + u, -2.07, z + 0.27), m.wall, 0)
        pane(m.shop if i == 1 else m.trim, (0.2, 0, 0.2), (cx + u, -2.245, z + 0.26), "front")
        box(f"{t}_dormer_l{i}", (0.34, 0.36, 0.34), (cx - 2.17, u * 1.2, z + 0.27), m.wall, 0)
        pane(m.trim if i == 1 else m.shop, (0, 0.2, 0.2), (cx - 2.345, u * 1.2, z + 0.26), "left")
    chimney(m, t, cx + 1.0, 1.0, z + 0.62, 0.35)
    awning(m, t, cx, -1.0, 1.0, -2.3, 0.5)


def l_block(m, cx):
    """Plan en L : une aile haute sur rue, une aile basse à toit-terrasse derrière."""
    t = "d4"
    volume(m, t + "a", cx, -2.4, 2.4, -2.3, -0.2, 0, 4 * FLOOR, "punched", 7, shop=True, bands=True)
    volume(m, t + "b", cx, -2.4, 0.4, -0.4, 2.3, 0, 2 * FLOOR, "big", 8, sides=("left", "back", "right"))
    pergola(m, t, cx - 2.0, cx - 0.6, 0.6, 1.9, 2 * FLOOR)
    planters(m, t, cx - 2.0, cx + 0.1, 0.05, 2 * FLOOR, 14)
    water_tank(m, t, cx + 1.4, -1.2, 4 * FLOOR)
    ac_units(m, t, cx - 1.8, -1.3, 4 * FLOOR, 3, 15)


def penthouse(m, cx):
    """Trois étages pleins et un attique en retrait, terrasse sur les deux faces vues."""
    t = "d5"
    z = 3 * FLOOR
    volume(m, t + "a", cx, -2.5, 2.5, -2.3, 2.3, 0, z, "punched", 9, shop=True)
    volume(m, t + "b", cx, -1.3, 2.3, -1.1, 2.1, z, z + FLOOR, "ribbon", 10, lit=0.45)
    railing(m, t, cx - 2.4, cx + 2.4, -2.2, 2.2, z)
    planters(m, t, cx - 2.2, cx - 0.2, -1.95, z, 16)
    ac_units(m, t, cx - 0.6, 0.8, z + FLOOR, 3, 17)
    box(f"{t}_blade", (0.06, 0.32, 0.7), (cx - 2.56, -1.9, 0.95), m.trim, 0)
    pane(m.sign, (0, 0.24, 0.6), (cx - 2.594, -1.9, 0.95), "left")


def bay_block(m, cx):
    """Bow-windows en saillie sur la rue, réservoir sur pieds."""
    t = "d6"
    z = 5 * FLOOR
    volume(m, t, cx, -2.3, 2.3, -2.4, 2.4, 0, z, "big", 11, shop=True)
    for i, u in enumerate((-1.2, 1.2)):
        box(f"{t}_bay_{i}", (0.95, 0.26, z - FLOOR - 0.1), (cx + u, -2.53, FLOOR + (z - FLOOR - 0.1) / 2 + 0.05), m.base, 0)
        windows("front", -2.66, cx + u - 0.4, cx + u + 0.4, FLOOR + 0.05, z - 0.05, 2, 4, 0.3, 0.28, lit=0.3, seed=60 + i, flat=True, detail=False)
    water_tank(m, t, cx + 1.3, 1.2, z)
    stair_core(m, t, cx - 1.2, 1.2, z)
    antenna(m, t, cx - 1.6, -1.5, z, 0.6)


def stepped(m, cx):
    """En gradins : un socle large et deux étages en retrait, panneaux solaires sur la terrasse."""
    t = "d7"
    z = 4 * FLOOR
    volume(m, t + "a", cx, -2.5, 2.5, -2.3, 2.3, 0, z, "ribbon", 12, shop=True)
    volume(m, t + "b", cx, -1.6, 1.8, -1.2, 1.9, z, z + 2 * FLOOR, "ribbon", 13)
    solar(m, t, cx - 2.2, cx - 0.2, -2.05, -1.35, z)
    solar(m, t, cx - 2.25, cx - 1.75, -1.1, 1.9, z)
    antenna(m, t, cx + 1.2, 1.4, z + 2 * FLOOR, 1.1)
    ac_units(m, t, cx - 1.0, 0.0, z + 2 * FLOOR, 2, 18)


def slim_tower(m, cx):
    """Mince et haut, balcons d'angle, panneau lumineux sans texte sur le toit."""
    t = "d8"
    z = 7 * FLOOR
    volume(m, t, cx, -2.0, 2.0, -2.1, 2.1, 0, z, "tall", 14, shop=True)
    for f in range(2, 7):
        zf = f * FLOOR + 0.02
        box(f"{t}_balcony_{f}", (1.2, 0.4, 0), (cx - 1.4, -2.3, zf), m.slab, 0)
        pane(m.trim, (1.2, 0.02, 0.025), (cx - 1.4, -2.49, zf + 0.2))
        pane(m.trim, (0.02, 0.4, 0.025), (cx - 2.0, -2.3, zf + 0.2))
    billboard(m, t, cx + 0.3, -0.9, z)
    stair_core(m, t, cx - 1.0, 1.1, z, 0.8, 0.9, 0.5)


def crown(m, cx):
    """Le plus haut : une couronne en retrait, réservoir et locaux techniques."""
    t = "d9"
    z = 7 * FLOOR
    volume(m, t + "a", cx, -2.2, 2.2, -2.3, 2.3, 0, z, "punched", 15, shop=True, bands=True)
    volume(m, t + "b", cx, -1.5, 1.5, -1.6, 1.6, z, z + 2 * FLOOR, "tall", 16, lit=0.3)
    ac_units(m, t, cx - 1.9, -2.0, z, 4, 19)
    water_tank(m, t, cx + 0.5, 0.5, z + 2 * FLOOR)
    stair_core(m, t, cx - 0.7, -0.4, z + 2 * FLOOR, 0.6, 0.7, 0.4)


DESIGNS = [corner_house, garden_roof, row_houses, mansard, l_block, penthouse, bay_block, stepped, slim_tower, crown]


def build(out, atlas):
    m = M()
    for i, design in enumerate(DESIGNS):
        design(m, i * SPACING)
    # Vitres, enseignes et petites pièces de couleur unie (garde-corps, acrotères, climatiseurs) : elles se partagent
    # quelques pixels de l'atlas, l'ombre portée vient de la scène. Les murs et les toits gardent toute la place.
    shared = ("glass_dark", "glass_warm", "glass_cool", "glass_blind", "glass_frame", "shop", "door", "sign", "trim", "slab", "unit", "solar")
    bake_export_split("filler", out, atlas, SPACING, len(DESIGNS), drop_hidden=True, mirrored=True, shared=shared)
