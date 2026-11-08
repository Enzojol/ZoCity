# Gymzo : salle vitrée sur deux côtés, enseigne et néons ajoutés en direct par la scène.
from lib import area_light, bake_export, blob, box, cyl, mat, prism_x


def build(out, atlas):
    # Palette de maquette peinte au crépuscule : l'orange et le rose de Gymzo sont les seules couleurs vives
    wall = mat("wall", "#5b5068", 0.8)
    wall_light = mat("wall_light", "#7c6d90", 0.75)
    trim = mat("trim", "#26222f", 0.6)
    steel = mat("steel", "#e8e6f0", 0.4)
    roof = mat("roof", "#6a5d82", 0.7)
    roof_dark = mat("roof_dark", "#2d2739", 0.8)
    floor_rubber = mat("floor_rubber", "#4a3d4c", 0.7)
    paving = mat("paving", "#a79aaf", 0.9)
    paving_dark = mat("paving_dark", "#544c68", 0.75)
    bench = mat("bench", "#efe6da", 0.5)
    kit = mat("kit", "#2a2733", 0.6)
    plate_orange = mat("plate_orange", "#ff5a1f", 0.45)
    plate_pink = mat("plate_pink", "#ff2e7e", 0.45)
    mirror = mat("mirror", "#c7c9e0", 0.4)
    accent_wall = mat("accent_wall", "#e87048", 0.75)
    planter = mat("planter", "#cdbfb3", 0.8)
    leaf = mat("leaf", "#2f8d74", 0.75)
    leaf2 = mat("leaf2", "#4aab85", 0.75)
    ceiling_light = mat("ceiling_light", "#ffffff", 0.5, emit="#ffd9b0", power=14.0)
    wall_glow = mat("wall_glow", "#ffffff", 0.5, emit="#ff7a4c", power=1.3)

    W, D, H = 5.2, 4.2, 1.72  # emprise et hauteur libre
    FRONT = -D / 2  # -y : côté rue
    LEFT = -W / 2  # -x : l'autre côté vitré
    BY = 0.25  # le bâtiment est un peu en retrait sur son parvis

    # --- Parvis ------------------------------------------------------------------
    box("forecourt", (5.4, 0.95, 0.03), (0, -2.3, 0.015), paving_dark, 0.0)

    for s, x in ((-1, -2.45), (1, 2.45)):
        box(f"planter_{s}", (0.34, 0.34, 0.18), (x, -2.42, 0.1), planter, 0.02)
        for k, (dx, dy, r, m) in enumerate(((0, 0, 0.21, leaf), (0.08, 0.07, 0.14, leaf2), (-0.08, -0.05, 0.13, leaf2))):
            blob(f"shrub_{s}_{k}", r, (x + dx, -2.42 + dy, 0.32 + k * 0.05), m)

    # --- Enveloppe ---------------------------------------------------------------
    Z0 = 0.03
    box("floor", (W, D, 0.05), (0, BY, Z0 + 0.025), floor_rubber, 0)
    # Tapis sous chaque poste : casse le sol vu d'en haut
    for i, x in enumerate((-1.9, -0.95, 0, 0.95, 1.9)):
        box(f"mat_{i}", (0.74, 0.92, 0.008), (x, BY + 1.0, Z0 + 0.054), mat("mat_rubber", "#2c2733", 0.7), 0)
    # Mur du fond, avec son miroir et une bande orange
    box("back_wall", (W, 0.14, H), (0, BY + D / 2 - 0.07, Z0 + H / 2), wall, 0.01)
    box("mirror", (W - 0.5, 0.012, 0.92), (0, BY + D / 2 - 0.146, Z0 + 0.72), mirror, 0)
    box("accent", (W - 0.14, 0.012, 0.2), (0, BY + D / 2 - 0.146, Z0 + 1.42), wall_glow, 0)
    box("right_wall", (0.14, D, H), (W / 2 - 0.07, BY, Z0 + H / 2), wall, 0.01)
    box("right_accent", (0.012, D - 0.2, 0.74), (W / 2 - 0.146, BY, Z0 + 0.42), accent_wall, 0)

    # Bandeau qui porte l'enseigne, un peu en saillie sur le vitrage
    FY = BY + FRONT
    box("fascia_front", (W + 0.14, 0.2, 0.52), (0, FY + 0.02, Z0 + H + 0.26), wall_light, 0.02)
    box("fascia_left", (0.2, D, 0.52), (LEFT - 0.02, BY, Z0 + H + 0.26), wall_light, 0.02)
    box("fascia_right", (0.2, D, 0.52), (W / 2 + 0.0, BY, Z0 + H + 0.26), wall, 0.02)
    box("fascia_back", (W, 0.2, 0.52), (0, BY + D / 2, Z0 + H + 0.26), wall, 0.02)
    box("ceiling", (W, D, 0.04), (0, BY, Z0 + H + 0.02), roof_dark, 0)

    # Réglettes au plafond : elles éclairent l'intérieur pendant la cuisson
    for y in (-1.2, -0.2, 0.8, 1.6):
        box(f"strip_{y}", (W - 0.5, 0.06, 0.012), (0, BY + y, Z0 + H - 0.01), ceiling_light, 0)

    # Meneaux, traverse et encadrement de porte sur les deux côtés vitrés
    for i in range(7):
        x = LEFT + (W / 6) * i
        box(f"mull_f{i}", (0.036, 0.05, H), (x, FY, Z0 + H / 2), trim, 0.006)
    for i in range(1, 6):
        y = FY + (D / 5) * i
        box(f"mull_l{i}", (0.05, 0.036, H), (LEFT, y, Z0 + H / 2), trim, 0.006)
    box("transom_f", (W, 0.04, 0.03), (0, FY, Z0 + 1.32), trim, 0.004)
    box("transom_l", (0.04, D, 0.03), (LEFT, BY, Z0 + 1.32), trim, 0.004)
    box("sill_f", (W, 0.07, 0.05), (0, FY, Z0 + 0.025), trim, 0.006)
    box("sill_l", (0.07, D, 0.05), (LEFT, BY, Z0 + 0.025), trim, 0.006)

    # Auvent d'entrée
    box("canopy", (1.5, 0.62, 0.05), (-0.87, FY - 0.3, Z0 + 1.28), trim, 0.012)
    box("canopy_a", (0.03, 0.03, 1.28), (-1.56, FY - 0.57, Z0 + 0.64), trim, 0.004)
    box("canopy_b", (0.03, 0.03, 1.28), (-0.18, FY - 0.57, Z0 + 0.64), trim, 0.004)
    for side, dx in (("l", -1.08), ("r", -0.66)):
        for sx in (-1, 1):
            box(f"door_{side}_stile_{sx}", (0.03, 0.03, 1.2), (dx + sx * 0.195, FY - 0.03, Z0 + 0.62), trim, 0.004)
        box(f"door_{side}_top", (0.42, 0.03, 0.03), (dx, FY - 0.03, Z0 + 1.21), trim, 0.004)
        box(f"door_{side}_foot", (0.42, 0.03, 0.05), (dx, FY - 0.03, Z0 + 0.05), trim, 0.004)
        box(f"door_{side}_pull", (0.016, 0.03, 0.42), (dx + (0.14 if side == "l" else -0.14), FY - 0.05, Z0 + 0.6), steel, 0.004)

    # --- Équipement --------------------------------------------------------------


    def rack(x, y, zero):
        h = 1.05
        for dx in (-0.3, 0.3):
            for dy in (-0.26, 0.26):
                box(f"rack_{x}_{dx}_{dy}", (0.035, 0.035, h), (x + dx, y + dy, zero + h / 2), kit, 0.004)
        for dy in (-0.26, 0.26):
            box(f"rack_top_{x}_{dy}", (0.635, 0.035, 0.035), (x, y + dy, zero + h), kit, 0.004)
        cyl(f"bar_{x}", 0.012, 1.26, (x, y - 0.25, zero + 0.72), steel, "x", 10)
        for s in (-1, 1):
            for k, (r, c) in enumerate(((0.17, plate_orange if s < 0 else plate_pink), (0.13, kit))):
                cyl(f"plate_{x}_{s}_{k}", r, 0.035, (x + s * (0.5 + k * 0.04), y - 0.25, zero + 0.72), c, "x", 26, 0.004)


    def bench_unit(x, y, zero):
        box(f"bench_pad_{x}", (0.2, 0.62, 0.06), (x, y, zero + 0.2), bench, 0.015)
        box(f"bench_leg_a_{x}", (0.06, 0.06, 0.17), (x, y + 0.22, zero + 0.085), kit, 0.004)
        box(f"bench_leg_b_{x}", (0.06, 0.06, 0.17), (x, y - 0.22, zero + 0.085), kit, 0.004)


    def treadmill(x, y, zero):
        box(f"tread_{x}", (0.34, 0.76, 0.07), (x, y, zero + 0.05), kit, 0.012)
        box(f"tread_belt_{x}", (0.27, 0.66, 0.004), (x, y, zero + 0.087), mat("belt", "#333042", 0.85), 0)
        for s in (-1, 1):
            box(f"tread_arm_{x}_{s}", (0.024, 0.024, 0.56), (x + s * 0.15, y + 0.34, zero + 0.34), kit, 0.004)
        box(f"tread_screen_{x}", (0.22, 0.03, 0.11), (x, y + 0.36, zero + 0.66), mat("screen", "#1c2a3c", 0.5, emit="#49b6d6", power=0.5), 0.006)


    zero = Z0 + 0.05
    for x in (-1.9, -0.95, 0, 0.95, 1.9):
        rack(x, BY + 1.05, zero)
    for x in (-1.75, -0.65, 0.45, 1.55):
        bench_unit(x, BY + 0.05, zero)
    for x in (-1.9, -1.35, -0.8, 0.8, 1.35, 1.9):
        treadmill(x, BY - 1.15, zero)
    # Rack d'haltères le long du mur de droite
    box("db_rack", (0.28, 1.7, 0.42), (W / 2 - 0.3, BY + 0.1, zero + 0.21), kit, 0.008)
    for i in range(9):
        for j, z in enumerate((0.3, 0.43)):
            c = plate_orange if (i + j) % 2 else plate_pink
            cyl(f"db_{i}_{j}", 0.05, 0.18, (W / 2 - 0.3, BY - 0.62 + i * 0.18, zero + z), c, "x", 14)

    # --- Toit --------------------------------------------------------------------
    RT = Z0 + H + 0.52
    box("roof_deck", (W + 0.14, D + 0.14, 0.05), (0, BY, RT - 0.01), roof_dark, 0.01)
    # Sheds : leurs faces vitrées verticales brillent et attirent l'œil vu d'en haut
    teeth = 4
    tw = D / teeth
    for i in range(teeth):
        y0 = BY + FRONT + i * tw
        prism_x(f"tooth_{i}", [(y0 + 0.02, RT), (y0 + tw - 0.02, RT), (y0 + tw - 0.02, RT + 0.32)], LEFT + 0.14, W / 2 - 0.14, roof, 0.008)
        box(f"north_{i}", (W - 0.5, 0.012, 0.24), (0, y0 + tw - 0.012, RT + 0.14), ceiling_light, 0)
    # Équipements techniques
    box("hvac_a", (0.5, 0.34, 0.24), (1.75, BY - 1.3, RT + 0.47), mat("hvac", "#c9c4d6", 0.6), 0.02)
    box("hvac_b", (0.36, 0.34, 0.2), (1.18, BY - 1.3, RT + 0.45), mat("hvac", "#c9c4d6", 0.6), 0.02)
    cyl("vent", 0.09, 0.3, (-1.9, BY - 1.3, RT + 0.48), steel, "z", 18)

    # L'haltère sur ses socles, la signature du bâtiment
    DZ = RT + 1.05
    for x in (-0.82, 0.82):
        box(f"mount_{x}", (0.18, 0.34, 0.74), (x, BY, RT + 0.4), trim, 0.03)
    cyl("db_bar", 0.06, 3.0, (0, BY, DZ), steel, "x", 20)
    for s in (-1, 1):
        for k, (r, w, c) in enumerate(((0.46, 0.13, trim), (0.38, 0.12, trim), (0.29, 0.11, trim))):
            cyl(f"db_plate_{s}_{k}", r, w, (s * (1.16 - k * 0.135), BY, DZ), c, "x", 48, 0.012)
        cyl(f"db_cap_{s}", 0.075, 0.1, (s * 1.34, BY, DZ), steel, "x", 18, 0.01)

    for y in (-1.0, 1.0):
        area_light((0, BY + y, Z0 + H - 0.05), W - 0.6, 1.5, 15)
    bake_export("gym", out, atlas)
