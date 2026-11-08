# Place centrale (ZoCity) : la maquette de la ville sur un socle, un diorama dans le diorama.
import math

from lib import bake_export, box, cyl, mat


def mini(x, y, w, d, h, wall, lit, floors):
    box(f"mini_{x}_{y}", (w, d, h), (x, y, 1.33 + h / 2), wall, 0.006)
    # Une bande allumée par étage suffit à cette échelle
    for k in range(floors):
        z = 1.33 + h * (k + 0.55) / floors
        box(f"mini_lit_{x}_{y}_{k}", (w * 0.72, 0.012, h / floors * 0.38), (x, y - d / 2 - 0.004, z), lit, 0)
        box(f"mini_lit_l_{x}_{y}_{k}", (0.012, d * 0.72, h / floors * 0.38), (x - w / 2 - 0.004, y, z), lit, 0)


def build(out, atlas):
    paving = mat("paving", "#d8c4bd", 0.85)
    ring = mat("ring", "#b49fa6", 0.85)
    base = mat("base", "#3a3158", 0.7)
    top = mat("top", "#8a7f99", 0.8)
    trim = mat("trim", "#fff0db", 0.7)
    wood = mat("wood", "#a57a5e", 0.8)
    iron = mat("iron", "#2c2940", 0.6)
    wall_a = mat("mini_a", "#d9b9ad", 0.8)
    wall_b = mat("mini_b", "#aab9c9", 0.8)
    wall_c = mat("mini_c", "#57618f", 0.6)
    gym = mat("mini_gym", "#3b3448", 0.6)
    neon = mat("mini_neon", "#000000", 0.5, emit="#ff6a2c", power=3)
    lit = mat("mini_lit", "#000000", 0.5, emit="#ffa95c", power=1.3)
    sea = mat("mini_sea", "#62c9c0", 0.5)
    sand = mat("mini_sand", "#f1cfa6", 0.8)
    school = mat("mini_school", "#b9614f", 0.7)

    cyl("plaza", 5.5, 0.05, (0, 0, 0.025), paving, "z", 72)
    cyl("plaza_ring", 4.0, 0.012, (0, 0, 0.055), ring, "z", 64)
    cyl("plaza_inner", 3.85, 0.012, (0, 0, 0.06), paving, "z", 64)

    # Socle
    box("step", (2.8, 2.8, 0.12), (0, 0, 0.12), trim, 0.012)
    box("pedestal", (2.3, 2.3, 1.05), (0, 0, 0.7), base, 0.02)
    box("deck", (2.36, 2.36, 0.08), (0, 0, 1.27), trim, 0.01)

    # Maquette : même plan que la vraie ville
    box("mini_sea", (1.05, 1.05, 0.03), (-0.55, -0.55, 1.325), sea, 0)
    box("mini_sand", (0.3, 1.05, 0.035), (-0.2, -0.55, 1.33), sand, 0)
    mini(0.62, 0.62, 0.34, 0.34, 1.08, wall_c, lit, 9)
    mini(0.62, 0.1, 0.34, 0.34, 0.34, wall_a, lit, 3)
    mini(0.1, 0.62, 0.34, 0.34, 0.42, wall_b, lit, 3)
    mini(0.12, 0.14, 0.3, 0.3, 0.22, wall_a, lit, 2)
    mini(-0.62, 0.62, 0.46, 0.24, 0.24, school, lit, 2)
    box("mini_spire", (0.07, 0.07, 0.32), (-0.62, 0.62, 1.73), school, 0)
    mini(0.62, -0.62, 0.34, 0.34, 0.2, wall_b, lit, 2)
    box("mini_gym", (0.36, 0.3, 0.14), (0.14, -0.62, 1.4), gym, 0)
    box("mini_gym_neon", (0.38, 0.012, 0.025), (0.14, -0.78, 1.45), neon, 0)

    # Bancs autour de la place
    for i in range(4):
        a = math.radians(45 + i * 90)
        x, y = math.cos(a) * 3.3, math.sin(a) * 3.3
        b = box(f"bench_{i}", (1.0, 0.26, 0.05), (x, y, 0.3), wood, 0.008)
        b.rotation_euler[2] = a + math.pi / 2
        for s in (-0.4, 0.4):
            lx, ly = x + math.cos(a + math.pi / 2) * s, y + math.sin(a + math.pi / 2) * s
            box(f"bench_leg_{i}_{s}", (0.05, 0.05, 0.26), (lx, ly, 0.17), iron, 0)

    bake_export("square", out, atlas)
