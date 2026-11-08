# Centres d'intérêt : la librairie et le garage du homelab, côte à côte face à la plage et au ponton.
# Enseignes et diodes des serveurs ajoutées en direct par la scène.
import random

from lib import area_light, bake_export, box, cyl, mat, windows


def bookshop(cx):
    wall = mat("shop_wall", "#d98c7a", 0.8)
    trim = mat("shop_trim", "#2b2645", 0.6)
    cream = mat("shop_cream", "#fff0db", 0.7)
    roof = mat("shop_roof", "#5a5070", 0.7)
    glow = mat("shop_glow", "#000000", 0.5, emit="#ffa35a", power=0.9)
    shelf = mat("shelf", "#6b4a3f", 0.7)
    stripe_a = mat("stripe_a", "#2f8d74", 0.6)
    stripe_b = mat("stripe_b", "#fff4dc", 0.6)
    W, D, H = 5.0, 3.9, 2.9
    Y = 0.5
    F = Y - D / 2
    box("shop", (W, D, H), (cx, Y, H / 2 + 0.04), wall, 0.02)
    box("shop_cornice", (W + 0.16, D + 0.16, 0.14), (cx, Y, H + 0.1), cream, 0.015)
    box("shop_roof", (W - 0.3, D - 0.3, 0.12), (cx, Y, H + 0.23), roof, 0.01)
    windows("front", F, cx - W / 2 + 0.3, cx + W / 2 - 0.3, 1.72, H - 0.08, 4, 1, 0.56, 0.78, lit=0.6, seed=4)
    windows("left", cx - W / 2, F + 0.35, F + D - 0.35, 0.4, H - 0.08, 3, 2, 0.5, 0.78, lit=0.5, seed=9)
    # Vitrine pleine largeur, les livres sont la raison d'être du bâtiment
    box("shop_window_back", (W - 1.5, 0.03, 1.05), (cx - 0.5, F - 0.005, 0.86), glow, 0)
    rng = random.Random(12)
    colors = ["#ff7a59", "#ffd23c", "#7ec3ff", "#c3a6ff", "#8ef0c0", "#fff0db", "#ff9db8", "#3f5fa8"]
    for row, z in enumerate((0.42, 0.78, 1.12)):
        box(f"shelf_{row}", (W - 1.6, 0.1, 0.03), (cx - 0.5, F - 0.06, z - 0.02), shelf, 0)
        x = cx - 0.5 - (W - 1.7) / 2
        while x < cx - 0.5 + (W - 1.7) / 2:
            w = 0.04 + rng.random() * 0.05
            h = 0.2 + rng.random() * 0.1
            k = int(rng.random() * len(colors))
            c = mat(f"book_{k}", colors[k], 0.6)
            box(f"book_{row}_{x:.3f}", (w, 0.08, h), (x, F - 0.06, z + h / 2), c, 0)
            x += w + 0.006
    for x in (cx - W / 2 + 0.75, cx + 0.73):
        box(f"shop_mull_{x}", (0.06, 0.06, 1.1), (x, F - 0.03, 0.86), trim, 0)
    box("shop_head", (W - 1.4, 0.06, 0.06), (cx - 0.5, F - 0.03, 1.42), trim, 0)
    # Porte
    box("shop_door", (0.72, 0.03, 1.22), (cx + 1.62, F - 0.005, 0.67), glow, 0)
    box("shop_door_frame", (0.84, 0.05, 0.06), (cx + 1.62, F - 0.02, 1.3), trim, 0)
    # Store rayé
    for i in range(12):
        m = stripe_a if i % 2 == 0 else stripe_b
        box(f"stripe_{i}", (0.4, 0.72, 0.04), (cx - W / 2 + 0.2 + i * 0.41, F - 0.34, 1.52), m, 0).rotation_euler[0] = 0.28
    # Table de livres en vitrine sur le trottoir
    box("table", (0.9, 0.46, 0.04), (cx - 1.0, F - 0.72, 0.42), shelf, 0.006)
    for x in (-0.38, 0.38):
        box(f"table_leg_{x}", (0.04, 0.34, 0.38), (cx - 1.0 + x, F - 0.72, 0.22), trim, 0)
    for i, x in enumerate((-0.28, 0.0, 0.28)):
        box(f"pile_{i}", (0.22, 0.28, 0.09 + i * 0.03), (cx - 1.0 + x, F - 0.72, 0.49), mat(f"pile_{i}", colors[i * 2], 0.6), 0.004)


def garage(cx):
    wall = mat("garage_wall", "#8791ad", 0.8)
    trim = mat("garage_trim", "#232039", 0.6)
    floor = mat("garage_floor", "#5a5668", 0.8)
    inner = mat("garage_inner", "#5a5878", 0.85)
    roof = mat("garage_roof", "#4c4a66", 0.7)
    rack = mat("rack", "#191725", 0.5)
    door = mat("roller", "#b9bdd0", 0.55)
    panel = mat("solar", "#1b2c5e", 0.3)
    frame = mat("solar_frame", "#cfd2e0", 0.4)
    W, D, H = 5.0, 3.9, 2.05
    Y = 0.5
    F, B = Y - D / 2, Y + D / 2
    L, R = cx - W / 2, cx + W / 2
    t = 0.14
    DW, DH = 3.2, 1.65
    box("gar_floor", (W, D, 0.05), (cx, Y, 0.065), floor, 0)
    box("gar_back", (W, t, H), (cx, B - t / 2, H / 2 + 0.04), inner, 0.01)
    box("gar_left", (t, D - t, H), (L + t / 2, Y + t / 2, H / 2 + 0.04), wall, 0.015)
    box("gar_right", (t, D - t, H), (R - t / 2, Y + t / 2, H / 2 + 0.04), wall, 0.015)
    side = (W - DW) / 2
    box("gar_front_l", (side, t, H), (L + side / 2, F + t / 2, H / 2 + 0.04), wall, 0.015)
    box("gar_front_r", (side, t, H), (R - side / 2, F + t / 2, H / 2 + 0.04), wall, 0.015)
    box("gar_front_top", (DW, t, H - DH), (cx, F + t / 2, (H + DH) / 2 + 0.04), wall, 0.015)
    box("gar_ceiling", (W, D, 0.06), (cx, Y, H + 0.06), trim, 0)
    box("gar_cornice", (W + 0.14, D + 0.14, 0.1), (cx, Y, H + 0.13), trim, 0.012)
    # Porte relevée à moitié, lames visibles
    for i in range(4):
        box(f"roller_{i}", (DW, 0.04, 0.1), (cx, F + 0.03, DH - 0.02 - i * 0.11), door, 0)
    # Baies de serveurs : les diodes sont animées par la scène
    for i, x in enumerate((-1.0, 0.0, 1.0)):
        box(f"server_{i}", (0.72, 0.6, 1.28), (cx + x, B - 0.62, 0.72), rack, 0.012)
        for k in range(5):
            box(f"unit_{i}_{k}", (0.6, 0.012, 0.15), (cx + x, B - 0.93, 0.3 + k * 0.215), mat("unit", "#34324a", 0.5), 0)
    box("desk", (1.1, 0.5, 0.05), (cx - 1.55, Y - 0.3, 0.62), mat("desk", "#c79763", 0.7), 0.008)
    box("screen", (0.46, 0.03, 0.3), (cx - 1.55, Y - 0.2, 0.82), mat("screen", "#16324a", 0.5, emit="#49b6d6", power=0.8), 0)
    box("desk_leg", (0.05, 0.4, 0.56), (cx - 1.1, Y - 0.3, 0.34), trim, 0)
    # Toit : panneaux solaires et antenne
    for i in range(3):
        for j in range(2):
            box(f"solar_{i}_{j}", (1.1, 0.74, 0.03), (cx - 1.25 + i * 1.25, Y - 0.55 + j * 1.0, H + 0.38), panel, 0).rotation_euler[0] = -0.3
            box(f"solar_frame_{i}_{j}", (1.16, 0.8, 0.018), (cx - 1.25 + i * 1.25, Y - 0.55 + j * 1.0, H + 0.36), frame, 0).rotation_euler[0] = -0.3
    cyl("gar_antenna", 0.018, 1.0, (R - 0.3, B - 0.35, H + 0.68), frame, "z", 6)


def build(out, atlas):
    box("parvis", (11.4, 5.5, 0.04), (0, 0, 0.02), mat("paving", "#6d6480", 0.8), 0)
    bookshop(-2.9)
    garage(2.9)
    area_light((-3.3, -1.9, 1.1), 3.6, 0.6, 6, "#ffc27a")
    area_light((2.9, 0.6, 1.9), 3.6, 2.8, 26, "#b4d0ff")
    bake_export("interests", out, atlas)
