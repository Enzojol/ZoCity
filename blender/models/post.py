# Bureau de poste (Contact) : mât d'antenne sur le toit, enseigne et ondes ajoutées en direct par la scène.
from lib import area_light, bake_export, box, cyl, mat, windows


def build(out, atlas):
    wall = mat("wall", "#6fb5b4", 0.8)
    stone = mat("stone", "#f4e7d6", 0.7)
    trim = mat("trim", "#23304d", 0.6)
    roof = mat("roof", "#4a5578", 0.7)
    steel = mat("steel", "#d6d3e6", 0.4)
    awning = mat("awning", "#ffd23c", 0.6)
    awning2 = mat("awning2", "#fff4dc", 0.6)
    door = mat("door", "#000000", 0.5, emit="#ffa96a", power=1.0)
    paving = mat("paving", "#6d6480", 0.8)
    box_red = mat("mailbox", "#ff6a4a", 0.45)
    letter = mat("letter", "#fff6ec", 0.7)

    box("parvis", (5.5, 5.5, 0.04), (0, 0, 0.02), paving, 0)
    W, D, H = 5.0, 4.0, 2.75
    Y = 0.45
    F = Y - D / 2
    L = -W / 2
    box("body", (W, D, H), (0, Y, H / 2 + 0.04), wall, 0.02)
    box("plinth", (W + 0.06, D + 0.06, 0.32), (0, Y, 0.2), stone, 0.012)
    box("band", (W + 0.05, D + 0.05, 0.07), (0, Y, 1.5), stone, 0.008)
    box("cornice", (W + 0.2, D + 0.2, 0.16), (0, Y, H + 0.12), stone, 0.02)
    box("roof", (W - 0.3, D - 0.3, 0.1), (0, Y, H + 0.25), roof, 0.01)

    # Rez-de-chaussée : porte centrale, deux baies
    box("door", (1.0, 0.03, 1.08), (0, F - 0.005, 0.86), door, 0)
    box("door_frame", (1.16, 0.05, 0.08), (0, F - 0.02, 1.42), trim, 0.006)
    for x in (-0.54, 0.54):
        box(f"door_jamb_{x}", (0.07, 0.05, 1.1), (x, F - 0.02, 0.87), trim, 0.004)
    box("door_mid", (0.04, 0.05, 1.08), (0, F - 0.025, 0.86), trim, 0)
    for x in (-1.75, 1.75):
        box(f"bay_{x}", (1.05, 0.03, 0.95), (x, F - 0.005, 0.86), door, 0)
        box(f"bay_mid_{x}", (0.04, 0.05, 0.95), (x, F - 0.02, 0.86), trim, 0)
        box(f"bay_sill_{x}", (1.2, 0.09, 0.06), (x, F - 0.03, 0.36), stone, 0.006)
    # Derrière les baies, les casiers de tri : des silhouettes qui donnent de la profondeur à la lumière
    parcel = mat("parcel", "#8a5a44", 0.8)
    parcel2 = mat("parcel2", "#5a4258", 0.8)
    shelf = mat("shelf", "#2f2a44", 0.7)
    for x in (-1.75, 1.75):
        for row, z in enumerate((0.62, 0.98)):
            box(f"bay_shelf_{x}_{row}", (0.96, 0.05, 0.03), (x, F - 0.03, z), shelf, 0)
            for k in range(5):
                w, h = 0.12 + (k * 37 % 5) * 0.012, 0.1 + (k * 53 % 7) * 0.014
                box(f"bay_parcel_{x}_{row}_{k}", (w, 0.04, h), (x - 0.38 + k * 0.19, F - 0.03, z + 0.015 + h / 2), parcel if (k + row) % 2 else parcel2, 0)
    box("door_bar", (0.86, 0.04, 0.03), (0, F - 0.03, 0.86), trim, 0)
    windows("left", L, F + 0.4, F + D - 0.4, 0.42, 1.4, 3, 1, 0.66, 0.78, lit=0.8, seed=8)
    # Étage
    windows("front", F, L + 0.25, -L - 0.25, 1.62, H - 0.08, 5, 1, 0.5, 0.74, lit=0.45, seed=15)
    windows("left", L, F + 0.4, F + D - 0.4, 1.62, H - 0.08, 3, 1, 0.5, 0.74, lit=0.4, seed=19)
    windows("right", -L, F + 0.4, F + D - 0.4, 0.42, H - 0.08, 3, 2, 0.5, 0.7, lit=0.25, seed=21)

    # Marquise rayée
    for i in range(8):
        m = awning if i % 2 == 0 else awning2
        x = -1.4 + i * 0.4
        box(f"awning_{i}", (0.4, 0.62, 0.05), (x, F - 0.28, 1.5), m, 0).rotation_euler[0] = 0.26

    # Boîte aux lettres et enveloppes
    cyl("mailbox", 0.2, 0.62, (1.55, -2.35, 0.36), box_red, "z", 18)
    cyl("mailbox_top", 0.2, 0.2, (1.55, -2.35, 0.67), box_red, "x", 18)
    box("mailbox_slot", (0.2, 0.02, 0.04), (1.55, -2.56, 0.56), trim, 0)
    box("letter", (0.26, 0.012, 0.18), (1.55, -2.565, 0.42), letter, 0)

    # Mât d'antenne en treillis et parabole
    MX, MY, MB = 1.3, Y + 0.6, H + 0.28
    MH = 3.6
    for dx, dy in ((-0.13, -0.13), (0.13, -0.13), (-0.13, 0.13), (0.13, 0.13)):
        cyl(f"mast_{dx}_{dy}", 0.018, MH, (MX + dx * 0.6, MY + dy * 0.6, MB + MH / 2), steel, "z", 6)
    for i in range(8):
        box(f"rung_{i}", (0.2, 0.2, 0.02), (MX, MY, MB + 0.25 + i * 0.44), steel, 0)
    cyl("dish", 0.42, 0.2, (-1.2, Y + 0.3, H + 0.72), steel, "y", 22, radius2=0.1)
    cyl("dish_post", 0.04, 0.42, (-1.2, Y + 0.45, H + 0.47), trim, "z", 8)

    area_light((0, F - 0.9, 1.25), 3.4, 0.6, 5, "#ffc98c")
    bake_export("post", out, atlas)
