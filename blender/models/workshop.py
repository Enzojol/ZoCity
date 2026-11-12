# Atelier (Compétences) : grande porte ouverte sur l'établi, enseigne ajoutée en direct par la scène.
import random

from lib import area_light, bake_export, blob, box, cyl, mat, point_light, prism_x, prism_y, windows


def build(out, atlas):
    brick = mat("brick", "#b86a56", 0.85)
    trim = mat("trim", "#2c2640", 0.6)
    roof = mat("roof", "#54506e", 0.7)
    skylight = mat("skylight", "#000000", 0.5, emit="#ffc98a", power=1.0)
    floor = mat("floor", "#8a766c", 0.8)
    inner = mat("inner", "#9a7468", 0.8)
    wood = mat("wood", "#c79763", 0.7)
    steel = mat("steel", "#b9b8cc", 0.45)
    paving = mat("paving", "#6d6480", 0.8)
    crate = mat("crate", "#b98a5c", 0.8)
    crate2 = mat("crate2", "#7fc9c4", 0.7)
    tools = [mat("tool_a", "#ff7a59", 0.5), mat("tool_b", "#ffd23c", 0.5), mat("tool_c", "#7ec3ff", 0.5), mat("tool_d", "#c3a6ff", 0.5), mat("tool_e", "#8ef0c0", 0.5)]

    box("parvis", (5.5, 5.5, 0.04), (0, 0, 0.02), paving, 0)
    W, D, H = 5.0, 4.0, 2.3
    Y = 0.5
    F, B = Y - D / 2, Y + D / 2
    L, R = -W / 2, W / 2
    t = 0.14
    DW, DH = 2.6, 1.85

    box("floor", (W, D, 0.05), (0, Y, 0.065), floor, 0)
    box("back", (W, t, H), (0, B - t / 2, H / 2 + 0.04), inner, 0.01)
    # Les murs s'arrêtent derrière la façade : deux faces confondues noircissent à la cuisson
    box("left", (t, D - t, H), (L + t / 2, Y + t / 2, H / 2 + 0.04), brick, 0.015)
    box("right", (t, D - t, H), (R - t / 2, Y + t / 2, H / 2 + 0.04), brick, 0.015)
    # Façade percée de la grande porte
    side = (W - DW) / 2
    box("front_l", (side, t, H), (L + side / 2, F + t / 2, H / 2 + 0.04), brick, 0.015)
    box("front_r", (side, t, H), (R - side / 2, F + t / 2, H / 2 + 0.04), brick, 0.015)
    box("front_top", (DW, t, H - DH), (0, F + t / 2, (H + DH) / 2 + 0.04), brick, 0.015)
    box("lintel", (DW + 0.16, 0.2, 0.14), (0, F - 0.02, DH + 0.1), trim, 0.012)
    for x in (-DW / 2 - 0.05, DW / 2 + 0.05):
        box(f"jamb_{x}", (0.1, 0.2, DH), (x, F - 0.02, DH / 2 + 0.04), trim, 0.008)
    windows("left", L, F + 0.4, B - 0.4, 0.75, H - 0.15, 3, 1, 0.72, 1.1, lit=0.9, seed=5, glass="#2a2f5e")

    # Toit à deux pentes et verrières
    prism_x("roof_truss", [(F - 0.14, H + 0.04), (B + 0.14, H + 0.04), (Y, H + 1.0)], L - 0.1, R + 0.1, roof)
    for i, x in enumerate((-1.5, 0, 1.5)):
        box(f"skylight_{i}", (0.9, 0.9, 0.05), (x, F + 0.82, H + 0.5), skylight, 0.005).rotation_euler[0] = -0.44
    cyl("chimney", 0.18, 1.3, (1.7, B - 0.7, H + 1.0), trim, "z", 14)
    cyl("chimney_cap", 0.23, 0.08, (1.7, B - 0.7, H + 1.66), steel, "z", 14)

    # Intérieur, vu de face par la grande porte : un atelier clair et chaud, des silhouettes nettes.
    # La scène assombrit encore ce qui est à l'ombre du soleil, d'où des enduits clairs et une lumière franche.
    plaster = mat("plaster", "#f0d9b5", 0.85)
    wainscot = mat("wainscot", "#a8714a", 0.75)
    beam = mat("beam", "#8a5a3c", 0.7)
    board = mat("board", "#2d4f5c", 0.75)
    shade = mat("shade", "#2f6b5a", 0.45)
    bulb = mat("bulb", "#000000", 0.5, emit="#ffd49a", power=12.0)
    red = mat("red", "#d9473a", 0.5)
    can = mat("can", "#e8e2d6", 0.5)

    IL, IR, IB, IF = L + t, R - t, B - t, F + t
    Z0, ZC = 0.09, H + 0.04
    # Doublages un peu enfoncés dans les murs : aucune face confondue, et l'extérieur ne change pas
    box("lining_back", (IR - IL, 0.03, ZC - Z0 + 0.02), (0, IB + 0.005, (Z0 + ZC) / 2 - 0.01), plaster, 0)
    for x, sgn in ((IL, 1), (IR, -1)):
        box(f"lining_{sgn}", (0.03, IB - IF, ZC - Z0 + 0.02), (x - sgn * 0.005, (IB + IF) / 2, (Z0 + ZC) / 2 - 0.01), plaster, 0)
        box(f"wainscot_{sgn}", (0.03, IB - IF - 0.06, 0.62), (x + sgn * 0.02, (IB + IF) / 2, Z0 + 0.31), wainscot, 0)
    box("wainscot_back", (IR - IL - 0.06, 0.03, 0.62), (0, IB - 0.02, Z0 + 0.31), wainscot, 0)
    box("ceiling", (IR - IL, IB - IF, 0.03), (0, (IB + IF) / 2, ZC - 0.005), plaster, 0)
    for i, y in enumerate((-0.6, 0.5, 1.6)):
        box(f"beam_{i}", (IR - IL - 0.02, 0.12, 0.16), (0, y, ZC - 0.09), beam, 0)

    # Établi : plateau épais, étagère basse chargée, étau au bout
    BY = Y + 0.7
    box("bench_top", (2.4, 0.7, 0.09), (0, BY, 0.71), wood, 0.012)
    for a, x in enumerate((-1.1, 1.1)):
        for b, y in enumerate((BY - 0.28, BY + 0.28)):
            box(f"bench_leg_{a}{b}", (0.08, 0.08, 0.6), (x, y, 0.37), trim, 0)
    box("bench_shelf", (2.3, 0.6, 0.04), (0, BY, 0.24), wood, 0)
    for i, (x, w, h, m) in enumerate(((-0.8, 0.42, 0.26, crate), (-0.3, 0.3, 0.2, crate2), (0.45, 0.5, 0.24, crate), (0.85, 0.22, 0.3, tools[2]))):
        box(f"under_{i}", (w, 0.4, h), (x, BY + 0.05, 0.26 + h / 2), m, 0)
    top = 0.755
    box("vise_body", (0.16, 0.22, 0.12), (1.0, BY - 0.2, top + 0.06), steel, 0)
    box("vise_jaw", (0.16, 0.05, 0.16), (1.0, BY - 0.33, top + 0.08), trim, 0)
    cyl("vise_screw", 0.015, 0.3, (1.0, BY - 0.45, top + 0.06), steel, "y", 8)

    # Enclume au centre : les étincelles de la scène partent de sa table
    box("anvil_foot", (0.2, 0.15, 0.06), (0.15, BY, top + 0.03), trim, 0.006)
    box("anvil_waist", (0.1, 0.09, 0.07), (0.15, BY, top + 0.095), trim, 0.004)
    box("anvil_face", (0.3, 0.14, 0.06), (0.15, BY, top + 0.16), trim, 0.008)
    cyl("anvil_horn", 0.065, 0.18, (-0.09, BY, top + 0.16), trim, "x", 12, radius2=0.012)
    box("hammer_handle", (0.3, 0.035, 0.035), (0.48, BY - 0.12, top + 0.02), wood, 0)
    box("hammer_head", (0.05, 0.12, 0.05), (0.34, BY - 0.12, top + 0.03), steel, 0)
    # Caisse à outils rouge et nichoir en cours de montage
    box("toolbox", (0.42, 0.22, 0.2), (-0.7, BY + 0.05, top + 0.1), red, 0.012)
    box("toolbox_grip", (0.3, 0.03, 0.06), (-0.7, BY + 0.05, top + 0.23), trim, 0)
    box("birdhouse", (0.2, 0.2, 0.22), (0.72, BY + 0.1, top + 0.11), crate, 0)
    prism_x("birdhouse_roof", [(BY - 0.04, top + 0.22), (BY + 0.24, top + 0.22), (BY + 0.1, top + 0.33)], 0.6, 0.84, tools[0])
    cyl("birdhouse_hole", 0.04, 0.02, (0.72, BY - 0.005, top + 0.13), trim, "y", 12)

    # Mur à outils : panneau sombre, outils clairs et colorés, une couleur par famille de compétences
    PY = IB - 0.04
    box("pegboard", (3.6, 0.03, 1.0), (0, PY, 1.38), board, 0)
    box("pegboard_frame", (3.7, 0.025, 1.1), (0, PY + 0.01, 1.38), wood, 0)
    ty = PY - 0.03
    rng = random.Random(4)
    for i, x in enumerate((-1.55, -0.55, 0.45, 1.4)):
        c = tools[i % len(tools)]
        box(f"hammer_{i}_h", (0.045, 0.03, 0.42), (x, ty, 1.3), c, 0)
        box(f"hammer_{i}_k", (0.2, 0.05, 0.07), (x, ty, 1.53), steel, 0)
    for i, x in enumerate((-1.25, -0.25, 0.75)):
        box(f"wrench_{i}", (0.05, 0.025, 0.42 - i * 0.06), (x, ty, 1.32), steel, 0)
        cyl(f"wrench_{i}_ring", 0.06, 0.025, (x, ty, 1.55 - i * 0.03), steel, "y", 14)
    for i in range(5):
        x = -1.05 + i * 0.085
        c = tools[(i + 2) % len(tools)]
        box(f"driver_{i}_h", (0.05, 0.035, 0.12), (x, ty, 1.6), c, 0)
        box(f"driver_{i}_s", (0.015, 0.02, 0.2 + rng.random() * 0.1), (x, ty, 1.43), steel, 0)
    # Scie couchée sous les tournevis : lame trapèze et poignée
    prism_y("saw_blade", [(-1.1, 0.94), (-1.1, 1.07), (-0.5, 1.03), (-0.5, 0.99)], ty - 0.01, ty + 0.01, steel, 0)
    box("saw_grip", (0.16, 0.035, 0.15), (-1.18, ty, 1.0), tools[0], 0.012)
    box("square_a", (0.4, 0.02, 0.04), (1.15, ty, 1.12), tools[1], 0)
    box("square_b", (0.04, 0.02, 0.5), (0.97, ty, 1.35), tools[1], 0)
    cyl("tape", 0.07, 0.05, (1.15, ty, 1.6), tools[3], "y", 16)
    # Étagère haute : pots et bidons
    box("shelf", (3.4, 0.24, 0.04), (0, IB - 0.12, 2.0), wood, 0)
    for i in range(9):
        x = -1.5 + i * 0.37 + rng.random() * 0.08
        r = 0.06 + rng.random() * 0.04
        h = 0.14 + rng.random() * 0.12
        m = (can, tools[i % len(tools)], crate2)[i % 3]
        cyl(f"jar_{i}", r, h, (x, IB - 0.12, 2.02 + h / 2), m, "z", 12)

    # À droite : étagères garnies vers le fond, plan d'atelier punaisé près de la porte
    paper = mat("paper", "#4f86c6", 0.8)
    ink = mat("ink", "#eef4ff", 0.8)
    rng2 = random.Random(9)
    for i, z in enumerate((0.62, 1.07, 1.52)):
        box(f"shelf_r_{i}", (0.34, 1.15, 0.04), (IR - 0.17, 1.72, z), wood, 0)
        for k, y in enumerate((1.25, 2.2)):
            box(f"bracket_{i}_{k}", (0.3, 0.04, 0.08), (IR - 0.15, y, z - 0.06), trim, 0)
        y = 1.17
        while y < 2.1:
            w = 0.16 + rng2.random() * 0.16
            h = 0.12 + rng2.random() * 0.18
            if rng2.random() < 0.45:
                cyl(f"pot_{i}_{y:.2f}".replace(".", "p"), w / 2, h, (IR - 0.17, y + w / 2, z + 0.02 + h / 2), (can, tools[i + 1], crate2)[rng2.randrange(3)], "z", 12)
            else:
                box(f"bin_{i}_{y:.2f}".replace(".", "p"), (0.26, w, h), (IR - 0.17, y + w / 2, z + 0.02 + h / 2), tools[rng2.randrange(len(tools))], 0)
            y += w + 0.04
    PL = 0.4
    box("plan", (0.02, 1.2, 0.78), (IR - 0.01, PL, 1.38), paper, 0)
    for k, (y, z, w, h) in enumerate(((0, 1.72, 1.1, 0.012), (0, 1.04, 1.1, 0.012), (-0.55, 1.38, 0.012, 0.68), (0.55, 1.38, 0.012, 0.68),
                                       (-0.15, 1.3, 0.5, 0.01), (-0.15, 1.5, 0.5, 0.01), (-0.4, 1.4, 0.01, 0.2), (0.1, 1.4, 0.01, 0.2))):
        box(f"plan_line_{k}", (0.012, w, h), (IR - 0.022, PL + y, z), ink, 0)
    cyl("plan_gear", 0.13, 0.012, (IR - 0.022, PL + 0.35, 1.38), ink, "x", 16)
    cyl("plan_gear_in", 0.1, 0.014, (IR - 0.024, PL + 0.35, 1.38), paper, "x", 16)
    DX, DY = 1.75, 1.95
    box("press_base", (0.4, 0.34, 0.06), (DX, DY, Z0 + 0.03), trim, 0)
    cyl("press_column", 0.04, 1.3, (DX, DY + 0.08, Z0 + 0.7), steel, "z", 12)
    box("press_table", (0.3, 0.26, 0.04), (DX, DY - 0.04, 0.75), trim, 0)
    box("press_head", (0.24, 0.42, 0.24), (DX, DY - 0.04, 1.3), tools[2], 0.02)
    cyl("press_motor", 0.09, 0.2, (DX, DY + 0.16, 1.48), steel, "z", 14)
    cyl("press_chuck", 0.03, 0.16, (DX, DY - 0.12, 1.12), steel, "z", 10)

    # À gauche : servante rouge à tiroirs, tabouret
    box("chest", (0.6, 0.45, 0.85), (-1.85, IB - 0.3, Z0 + 0.43), red, 0.015)
    for k in range(5):
        box(f"chest_grip_{k}", (0.4, 0.03, 0.025), (-1.85, IB - 0.54, Z0 + 0.15 + k * 0.16), steel, 0)
    cyl("stool_seat", 0.17, 0.05, (-0.45, Y + 0.05, 0.62), tools[4], "z", 16)
    cyl("stool_leg", 0.04, 0.5, (-0.45, Y + 0.05, 0.35), trim, "z", 8)
    cyl("stool_foot", 0.15, 0.03, (-0.45, Y + 0.05, Z0 + 0.02), trim, "z", 16)

    # Suspensions au-dessus de l'établi : la source de lumière qu'on voit depuis la rue
    for i, x in enumerate((-0.85, 0.15, 1.1)):
        zl = 1.68
        box(f"cord_{i}", (0.012, 0.012, ZC - zl - 0.08), (x, BY, (ZC + zl + 0.08) / 2), trim, 0)
        cyl(f"shade_{i}", 0.2, 0.14, (x, BY, zl), shade, "z", 20, radius2=0.05)
        blob(f"bulb_{i}", 0.06, (x, BY, zl - 0.07), bulb)
        point_light((x, BY, zl - 0.1), 22)

    # Devant la porte : caisses et tonneaux
    for i, (x, y, s, m) in enumerate(((-2.1, -1.95, 0.46, crate), (-1.62, -2.1, 0.34, crate2), (-2.05, -1.95, 0.3, crate2))):
        z = 0.04 + s / 2 + (0.46 if i == 2 else 0)
        box(f"crate_{i}", (s, s, s), (x, y, z), m, 0.015)
    for i, x in enumerate((2.0, 2.4)):
        cyl(f"barrel_{i}", 0.17, 0.46, (x, -1.95, 0.27), steel if i else tools[0], "z", 16)

    area_light((0, Y + 0.3, H - 0.1), 3.6, 2.6, 90, "#ffd0a0")
    bake_export("workshop", out, atlas)
