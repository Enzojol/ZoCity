# Immeuble d'affaires (Expériences) : tient sur un seul lot, domine par la hauteur.
import math

from lib import area_light, bake_export, box, cyl, mat, windows

FLOOR = 0.46


def shaft(name, width, z0, z1, wall, cols, seed):
    box(name, (width, width, z1 - z0), (0, 0, (z0 + z1) / 2), wall, 0.02)
    rows = round((z1 - z0) / FLOOR)
    half = width / 2
    inset = 0.1
    for i, (face, plane) in enumerate((("front", -half), ("left", -half), ("right", half))):
        windows(face, plane, -half + inset, half - inset, z0 + 0.05, z1 - 0.05, cols, rows, 0.27, 0.3, lit=0.3, seed=seed + i, glass="#1d2763")


def build(out, atlas):
    stone = mat("stone", "#d9cfe0", 0.6)
    wall = mat("wall", "#57618f", 0.55)
    wall_up = mat("wall_up", "#67709e", 0.55)
    trim = mat("trim", "#26223a", 0.6)
    gold = mat("gold", "#efe0c9", 0.4)
    steel = mat("steel", "#d6d3e6", 0.4)
    lobby = mat("lobby", "#000000", 0.5, emit="#ffa35a", power=1.1)
    paving = mat("paving", "#6a6186", 0.75)

    box("parvis", (5.5, 5.5, 0.04), (0, 0, 0.02), paving, 0)
    # Socle et hall vitré, éclairé de l'intérieur
    box("podium", (4.9, 4.9, 1.45), (0, 0, 0.77), stone, 0.03)
    box("lobby_front", (3.7, 0.03, 0.82), (0, -2.46, 0.5), lobby, 0)
    box("lobby_left", (0.03, 3.7, 0.82), (-2.46, 0, 0.5), lobby, 0)
    for i in range(7):
        u = -1.85 + i * 3.7 / 6
        box(f"mull_f{i}", (0.05, 0.05, 0.86), (u, -2.48, 0.5), trim, 0)
        box(f"mull_l{i}", (0.05, 0.05, 0.86), (-2.48, u, 0.5), trim, 0)
    box("canopy", (2.1, 0.75, 0.07), (0, -2.8, 1.02), trim, 0.012)
    for x in (-0.95, 0.95):
        box(f"canopy_post_{x}", (0.05, 0.05, 0.98), (x, -3.08, 0.5), trim, 0)
    box("cornice", (5.0, 5.0, 0.08), (0, 0, 1.5), gold, 0.01)

    # Fût en gradins : les étages font la même hauteur que ceux des immeubles voisins
    shaft("shaft_low", 3.8, 1.54, 8.44, wall, 8, 11)
    box("step_a", (3.95, 3.95, 0.08), (0, 0, 8.48), gold, 0.01)
    shaft("shaft_mid", 2.9, 8.52, 10.82, wall_up, 6, 23)
    box("step_b", (3.05, 3.05, 0.08), (0, 0, 10.86), gold, 0.01)
    shaft("shaft_top", 2.0, 10.9, 12.28, wall_up, 4, 37)

    # Couronne et antenne
    cyl("crown", 1.42, 0.62, (0, 0, 12.59), gold, "z", 4, radius2=0.34).rotation_euler[2] = math.pi / 4
    cyl("mast", 0.04, 1.5, (0, 0, 13.6), steel, "z", 8, radius2=0.012)

    area_light((0, -1.6, 1.1), 3.4, 1.6, 8, "#ffc27a")
    bake_export("tower", out, atlas)
