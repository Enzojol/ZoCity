# Atelier (Compétences) : grande porte ouverte sur l'établi, enseigne ajoutée en direct par la scène.
import random

from lib import area_light, bake_export, box, cyl, mat, prism_x, windows


def build(out, atlas):
    brick = mat("brick", "#b86a56", 0.85)
    trim = mat("trim", "#2c2640", 0.6)
    roof = mat("roof", "#54506e", 0.7)
    skylight = mat("skylight", "#000000", 0.5, emit="#ffc98a", power=1.0)
    floor = mat("floor", "#4b4254", 0.8)
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

    # Intérieur : établi central et panneau d'outils, une couleur par famille de compétences
    box("bench_top", (2.4, 0.7, 0.07), (0, Y + 0.7, 0.72), wood, 0.012)
    for x in (-1.1, 1.1):
        for y in (0.42, 0.98):
            box(f"bench_leg_{x}_{y}", (0.07, 0.07, 0.64), (x, Y + y, 0.38), trim, 0.004)
    box("pegboard", (3.8, 0.03, 1.1), (0, B - t - 0.02, 1.35), wood, 0)
    rng = random.Random(4)
    for i in range(14):
        c = tools[i % len(tools)]
        x = -1.7 + i * 0.262
        h = 0.3 + rng.random() * 0.4
        box(f"tool_{i}", (0.09, 0.03, h), (x, B - t - 0.05, 1.45 + rng.random() * 0.2 - 0.1), c, 0)
    for i, x in enumerate((-0.8, -0.2, 0.5)):
        box(f"on_bench_{i}", (0.34, 0.26, 0.2 + i * 0.05), (x, Y + 0.7, 0.86), tools[i], 0.012)
    cyl("lathe", 0.17, 0.7, (1.75, Y + 0.3, 0.36), steel, "z", 18)
    box("lathe_head", (0.6, 0.6, 0.18), (1.75, Y + 0.3, 0.8), trim, 0.015)

    # Devant la porte : caisses et tonneaux
    for i, (x, y, s, m) in enumerate(((-2.1, -1.95, 0.46, crate), (-1.62, -2.1, 0.34, crate2), (-2.05, -1.95, 0.3, crate2))):
        z = 0.04 + s / 2 + (0.46 if i == 2 else 0)
        box(f"crate_{i}", (s, s, s), (x, y, z), m, 0.015)
    for i, x in enumerate((2.0, 2.4)):
        cyl(f"barrel_{i}", 0.17, 0.46, (x, -1.95, 0.27), steel if i else tools[0], "z", 16)

    area_light((0, Y + 0.3, H - 0.1), 3.6, 2.6, 40, "#ffd0a0")
    bake_export("workshop", out, atlas)
