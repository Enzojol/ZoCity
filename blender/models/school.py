# École (Formation) : tient sur deux lots, reconnaissable à son toit rouge et à son clocher.
# Le cadran et ses aiguilles sont ajoutés en direct par la scène.
import math

from lib import area_light, bake_export, box, cyl, mat, prism_x, prism_y, windows


def build(out, atlas):
    wall = mat("wall", "#f2c4a2", 0.8)
    stone = mat("stone", "#fff0db", 0.7)
    roof = mat("roof", "#b9614f", 0.75)
    roof2 = mat("roof2", "#c56a55", 0.75)
    spire = mat("spire", "#67b0a4", 0.5)
    paving = mat("paving", "#6d6a86", 0.8)
    door = mat("door", "#000000", 0.5, emit="#ffa35a", power=0.9)
    court = mat("court", "#c7674f", 0.9)
    line = mat("line", "#fff3e2", 0.8)
    pole = mat("pole", "#e4e2ee", 0.4)
    flag = mat("flag", "#ffd23c", 0.7)

    box("parvis", (11.4, 5.5, 0.04), (0, 0, 0.02), paving, 0)

    # Corps principal, en retrait pour laisser la place à la cour
    W, D, H = 10.6, 2.6, 2.3
    Y = 1.2
    box("wing", (W, D, H), (0, Y, H / 2 + 0.04), wall, 0.015)
    front = Y - D / 2
    for side, u0, u1 in (("l", -W / 2 + 0.2, -1.95), ("r", 1.95, W / 2 - 0.2)):
        windows("front", front, u0, u1, 0.18, H - 0.05, 5, 2, 0.34, 0.62, lit=0.55, seed=3 if side == "l" else 7)
    windows("left", -W / 2, Y - D / 2 + 0.2, Y + D / 2 - 0.2, 0.18, H - 0.05, 2, 2, 0.34, 0.62, lit=0.5, seed=13)
    windows("right", W / 2, Y - D / 2 + 0.2, Y + D / 2 - 0.2, 0.18, H - 0.05, 2, 2, 0.34, 0.62, lit=0.3, seed=17)
    box("string", (W + 0.1, D + 0.1, 0.07), (0, Y, H + 0.04), stone, 0.01)
    prism_x("roof", [(Y - D / 2 - 0.12, H + 0.07), (Y + D / 2 + 0.12, H + 0.07), (Y, H + 1.15)], -W / 2 - 0.12, W / 2 + 0.12, roof)

    # Avant-corps de l'entrée, pignon vers la rue
    EW, EY = 3.5, front - 0.95
    box("entrance", (EW, 2.1, 2.9), (0, EY + 0.05, 1.49), wall, 0.015)
    windows("front", EY - 1.0, -EW / 2 + 0.2, EW / 2 - 0.2, 1.55, 2.85, 4, 1, 0.34, 0.6, lit=0.65, seed=29)
    box("entrance_band", (EW + 0.1, 2.2, 0.08), (0, EY + 0.05, 2.97), stone, 0.01)
    prism_y("gable", [(-EW / 2 - 0.12, 3.01), (EW / 2 + 0.12, 3.01), (0, 3.95)], EY - 1.06, EY + 1.14, roof2)
    prism_y("gable_face", [(-EW / 2 + 0.06, 3.03), (EW / 2 - 0.06, 3.03), (0, 3.86)], EY - 1.08, EY - 1.06, stone, 0)

    # Portique : colonnes, fronton plat, marches
    box("door", (0.86, 0.03, 1.2), (0, EY - 1.0, 0.68), door, 0)
    for x in (-1.3, -0.68, 0.68, 1.3):
        cyl(f"column_{x}", 0.09, 1.5, (x, EY - 1.42, 0.86), stone, "z", 14)
    box("entablature", (3.3, 0.74, 0.16), (0, EY - 1.32, 1.68), stone, 0.012)
    for s in range(3):
        box(f"step_{s}", (3.5 + (2 - s) * 0.26, 0.5 + (2 - s) * 0.22, 0.04), (0, EY - 1.36 - (2 - s) * 0.1, 0.06 + s * 0.04), stone, 0)

    # Clocher, derrière le pignon
    box("belfry", (1.05, 1.05, 2.5), (0, Y - 0.1, 4.15), wall, 0.012)
    box("belfry_band", (1.17, 1.17, 0.09), (0, Y - 0.1, 5.42), stone, 0.01)
    cyl("spire", 0.82, 1.0, (0, Y - 0.1, 5.96), spire, "z", 4, radius2=0.0).rotation_euler[2] = math.pi / 4
    cyl("spire_tip", 0.015, 0.34, (0, Y - 0.1, 6.6), pole, "z", 6)

    # Cour : terrain et drapeau
    box("court_a", (2.6, 1.5, 0.012), (-3.5, -1.2, 0.046), court, 0)
    box("court_b", (2.6, 1.5, 0.012), (3.5, -1.2, 0.046), court, 0)
    box("court_line", (0.03, 1.5, 0.006), (-3.5, -1.2, 0.055), line, 0)
    box("court_line_b", (0.03, 1.5, 0.006), (3.5, -1.2, 0.055), line, 0)
    cyl("flag_pole", 0.018, 2.1, (-1.95, -2.25, 1.09), pole, "z", 6)
    box("flag", (0.5, 0.012, 0.3), (-1.68, -2.25, 1.96), flag, 0)

    area_light((0, EY - 1.3, 1.5), 2.4, 0.5, 6, "#ffb066")
    bake_export("school", out, atlas)
