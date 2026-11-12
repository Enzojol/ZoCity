# Outils communs aux modèles de la ville : matériaux, volumes, lumière du crépuscule, bake, export.
#
# Repères : Blender est en Z vers le haut, et (x, y, z) ici donne (x, z, -y) dans la scène.
# -y est donc la façade sur rue et -x le second côté vu depuis l'arrivée.
# Un lot fait 5,6 unités de côté : la scène met tous les modèles à la même échelle.
import math
import os
import random

import bmesh
import bpy
import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree

_MATS = {}
_OBJECTS = []
_PANES = {}
_CELLS = []


def reset(samples):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    _MATS.clear()
    _OBJECTS.clear()
    _PANES.clear()
    _CELLS.clear()
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.samples = samples
    scene.cycles.use_denoising = False
    # Sans quoi Cycles s'arrête bien avant le nombre d'échantillons demandé, et le bruit reste sur les grands murs
    scene.cycles.use_adaptive_sampling = False
    scene.cycles.sample_clamp_indirect = 4.0
    scene.cycles.sample_clamp_direct = 10.0
    try:
        prefs = bpy.context.preferences.addons["cycles"].preferences
        prefs.compute_device_type = "METAL"
        prefs.get_devices()
        for d in prefs.devices:
            d.use = True
        scene.cycles.device = "GPU"
    except Exception as exc:  # repli sur le CPU : plus lent, même résultat
        print("GPU indisponible :", exc)


def srgb(hex_color):
    h = hex_color.lstrip("#")
    out = []
    for i in (0, 2, 4):
        c = int(h[i : i + 2], 16) / 255
        out.append(c / 12.92 if c < 0.04045 else ((c + 0.055) / 1.055) ** 2.4)
    return (*out, 1)


def mat(name, color, rough=0.75, emit=None, power=0.0):
    if name in _MATS:
        return _MATS[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = srgb(color)
    b.inputs["Roughness"].default_value = rough
    if emit:
        b.inputs["Emission Color"].default_value = srgb(emit)
        b.inputs["Emission Strength"].default_value = power
    _MATS[name] = m
    return m


def _finish(obj, material, bevel, angle=40):
    obj.data.materials.append(material)
    if bevel > 0:
        mod = obj.modifiers.new("bevel", "BEVEL")
        mod.width = bevel
        mod.segments = 2
        mod.limit_method = "ANGLE"
        mod.angle_limit = math.radians(angle)
    _OBJECTS.append(obj)
    return obj


def box(name, size, at, material, bevel=0.012):
    bpy.ops.mesh.primitive_cube_add(size=1, location=at)
    o = bpy.context.active_object
    o.name = name
    o.scale = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return _finish(o, material, bevel)


def cyl(name, radius, depth, at, material, axis="z", verts=24, bevel=0.0, radius2=None):
    rot = {"x": (0, math.pi / 2, 0), "y": (math.pi / 2, 0, 0), "z": (0, 0, 0)}[axis]
    if radius2 is None:
        bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=radius, depth=depth, location=at, rotation=rot)
    else:
        bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=radius, radius2=radius2, depth=depth, location=at, rotation=rot)
    o = bpy.context.active_object
    o.name = name
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)
    for p in o.data.polygons:
        p.use_smooth = len(p.vertices) == 4 and verts > 8
    return _finish(o, material, bevel)


def frustum(name, x0, x1, y0, y1, z0, inset, h, material, bevel=0.0):
    """Tronc de pyramide sur un rectangle : un toit à la Mansart, une toiture en croupe."""
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    low = [bm.verts.new(v) for v in ((x0, y0, z0), (x1, y0, z0), (x1, y1, z0), (x0, y1, z0))]
    high = [bm.verts.new(v) for v in ((x0 + inset, y0 + inset, z0 + h), (x1 - inset, y0 + inset, z0 + h), (x1 - inset, y1 - inset, z0 + h), (x0 + inset, y1 - inset, z0 + h))]
    bm.faces.new(low[::-1])
    bm.faces.new(high)
    for i in range(4):
        j = (i + 1) % 4
        bm.faces.new((low[i], low[j], high[j], high[i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(o)
    return _finish(o, material, bevel)


def blob(name, radius, at, material):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=radius, location=at)
    o = bpy.context.active_object
    o.name = name
    for p in o.data.polygons:
        p.use_smooth = True
    return _finish(o, material, 0)


def prism_x(name, profile, x_min, x_max, material, bevel=0.01):
    """Extrude un polygone (y, z) le long de x : un toit à deux pentes, par exemple."""
    return _extrude(name, [(x_min, y, z) for y, z in profile], [(x_max, y, z) for y, z in profile], material, bevel)


def prism_y(name, profile, y_min, y_max, material, bevel=0.01):
    """Extrude un polygone (x, z) le long de y."""
    return _extrude(name, [(x, y_min, z) for x, z in profile], [(x, y_max, z) for x, z in profile], material, bevel)


def _extrude(name, first, second, material, bevel):
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    a = [bm.verts.new(v) for v in first]
    b = [bm.verts.new(v) for v in second]
    bm.faces.new(a[::-1])
    bm.faces.new(b)
    n = len(a)
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new((a[i], a[j], b[j], b[i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(o)
    return _finish(o, material, bevel)


_FACING = {"front": Vector((0, -1, 0)), "back": Vector((0, 1, 0)), "left": Vector((-1, 0, 0)), "right": Vector((1, 0, 0))}


def pane(material, size, at, facing=None):
    """
    Petit volume sans biseau, regroupé par matériau : une façade en compte des centaines.
    Avec facing, une seule face tournée vers l'extérieur : de loin l'épaisseur ne se voit pas, et l'atlas y gagne.
    """
    _PANES.setdefault(material.name, (material, []))[1].append((size, at, facing))


def _flush_panes():
    for name, (material, items) in _PANES.items():
        me = bpy.data.meshes.new(f"panes_{name}")
        bm = bmesh.new()
        boxes = []
        for (sx, sy, sz), (x, y, z), facing in items:
            if facing:
                n = _FACING[facing]
                if n.x:
                    vs = [(x, y - sy / 2, z - sz / 2), (x, y + sy / 2, z - sz / 2), (x, y + sy / 2, z + sz / 2), (x, y - sy / 2, z + sz / 2)]
                else:
                    vs = [(x - sx / 2, y, z - sz / 2), (x + sx / 2, y, z - sz / 2), (x + sx / 2, y, z + sz / 2), (x - sx / 2, y, z + sz / 2)]
                vs = [Vector(v) for v in vs]
                if (vs[1] - vs[0]).cross(vs[2] - vs[1]).dot(n) < 0:
                    vs.reverse()
                bm.faces.new([bm.verts.new(v) for v in vs])
                continue
            vs = [bm.verts.new((x + i * sx / 2, y + j * sy / 2, z + k * sz / 2)) for i in (-1, 1) for j in (-1, 1) for k in (-1, 1)]
            for f in ((0, 1, 3, 2), (4, 6, 7, 5), (0, 4, 5, 1), (2, 3, 7, 6), (0, 2, 6, 4), (1, 5, 7, 3)):
                boxes.append(bm.faces.new([vs[i] for i in f]))
        if boxes:
            bmesh.ops.recalc_face_normals(bm, faces=boxes)
        bm.to_mesh(me)
        bm.free()
        o = bpy.data.objects.new(f"panes_{name}", me)
        bpy.context.collection.objects.link(o)
        _finish(o, material, 0)
    _PANES.clear()


def windows(face, plane, u0, u1, z0, z1, cols, rows, width, height, lit=0.25, seed=1, glass="#232a55", flat=False, detail=None):
    """
    Grille de fenêtres sur une façade. face : front (-y), back (+y), left (-x), right (+x).
    plane est la coordonnée du mur, u parcourt la façade, et lit la part de fenêtres allumées.
    flat pose des vitres d'une seule face, pour les immeubles vus de loin.
    """
    rng = random.Random(seed)
    dark = mat("glass_dark", glass, 0.4)
    warm = mat("glass_warm", "#000000", 0.5, emit="#ffa95c", power=1.15)
    cool = mat("glass_cool", "#000000", 0.5, emit="#8fb8ff", power=0.8)
    blind = mat("glass_blind", "#000000", 0.5, emit="#e8824a", power=0.55)
    frame = mat("glass_frame", "#2b2645", 0.6)
    # Assez grandes pour être vues de près : un meneau, et un store baissé sur les fenêtres allumées
    detailed = width >= 0.34 if detail is None else detail
    depth = 0.02
    sign = {"front": -1, "back": 1, "left": -1, "right": 1}[face]
    du = (u1 - u0) / cols
    dz = (z1 - z0) / rows
    for r in range(rows):
        for c in range(cols):
            u = u0 + du * (c + 0.5)
            z = z0 + dz * (r + 0.5)
            roll = rng.random()
            m = dark if roll >= lit else (warm if roll < lit * 0.8 else cool)
            parts = [(m, width, height, 0.0, depth)]
            if detailed:
                parts.append((frame, 0.028, height, 0.0, depth * 1.8))
                if m is not dark:
                    drop = height * (0.18 + rng.random() * 0.22)
                    parts.append((blind, width, drop, (height - drop) / 2, depth * 1.4))
            for material, pw, ph, dz_part, pd in parts:
                if flat:
                    off = plane + sign * (0.003 + pd * 0.3)
                    if face in ("front", "back"):
                        pane(material, (pw, 0, ph), (u, off, z + dz_part), face)
                    else:
                        pane(material, (0, pw, ph), (off, u, z + dz_part), face)
                elif face in ("front", "back"):
                    pane(material, (pw, pd, ph), (u, plane + sign * pd / 2, z + dz_part))
                else:
                    pane(material, (pd, pw, ph), (plane + sign * pd / 2, u, z + dz_part))


def dusk_lighting():
    """Le même ciel et le même soleil que la scène, pour que tous les bâtiments partagent leur lumière."""
    scene = bpy.context.scene
    world = bpy.data.worlds.new("dusk")
    scene.world = world
    world.use_nodes = True
    nt = world.node_tree
    bg = nt.nodes["Background"]
    tex = nt.nodes.new("ShaderNodeTexCoord")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].position = 0.45
    ramp.color_ramp.elements[0].color = srgb("#6f4a8c")
    ramp.color_ramp.elements[1].position = 0.75
    ramp.color_ramp.elements[1].color = srgb("#6d6fc4")
    mapr = nt.nodes.new("ShaderNodeMapRange")
    mapr.inputs["From Min"].default_value = -1
    mapr.inputs["From Max"].default_value = 1
    nt.links.new(tex.outputs["Generated"], sep.inputs[0])
    nt.links.new(sep.outputs["Z"], mapr.inputs["Value"])
    nt.links.new(mapr.outputs["Result"], ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], bg.inputs["Color"])
    bg.inputs["Strength"].default_value = 0.85
    # Direction de la scène (x, y, z) = (-0.66, 0.52, 0.54), soit (x, -z, y) ici
    bpy.ops.object.light_add(type="SUN", location=(0, 0, 10))
    sun = bpy.context.active_object
    sun.data.color = srgb("#ffa86e")[:3]
    sun.data.energy = 3.4
    sun.data.angle = math.radians(5)
    sun.rotation_mode = "QUATERNION"
    sun.rotation_quaternion = Vector((-0.66, -0.54, 0.52)).normalized().to_track_quat("Z", "Y")


def area_light(at, size, size_y, energy, color="#ffc9a0"):
    bpy.ops.object.light_add(type="AREA", location=at)
    a = bpy.context.active_object
    a.data.shape = "RECTANGLE"
    a.data.size = size
    a.data.size_y = size_y
    a.data.color = srgb(color)[:3]
    a.data.energy = energy


def point_light(at, energy, color="#ffb070", radius=0.05):
    bpy.ops.object.light_add(type="POINT", location=at)
    p = bpy.context.active_object
    p.data.color = srgb(color)[:3]
    p.data.energy = energy
    p.data.shadow_soft_size = radius


def _drop_hidden(obj):
    """Retire les dessous posés sur une autre surface ou sur le sol : personne ne les voit, ils prendraient de la place dans l'atlas."""
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bm.normal_update()
    bm.verts.index_update()
    tops = [[v.index for v in f.verts] for f in bm.faces if f.normal.z > 0.99]
    tree = BVHTree.FromPolygons([v.co.copy() for v in bm.verts], tops)
    drop = []
    ground = obj.matrix_world.inverted() @ Vector((0, 0, 0.02))
    for f in bm.faces:
        if f.normal.z > -0.99:
            continue
        c = f.calc_center_median()
        if c.z < ground.z or tree.ray_cast(c + Vector((0, 0, 0.003)), Vector((0, 0, -1)), 0.01)[0] is not None:
            drop.append(f)
    bmesh.ops.delete(bm, geom=drop, context="FACES")
    bm.to_mesh(obj.data)
    bm.free()
    print("DROPPED", len(drop))


def _tree(obj):
    return BVHTree.FromPolygons([v.co.copy() for v in obj.data.vertices], [list(p.vertices) for p in obj.data.polygons])


def _buried(tree, p):
    """Une face dont le devant est dans un autre volume : sa cuisson est noire, elle ne doit pas se partager une case."""
    n = p.normal
    hit = tree.ray_cast(p.center + n * 0.002, n, 10.0)
    return hit[0] is not None and hit[1].dot(n) > 0


def _share_uvs(obj, shared, keep, atlas_scale=0.985):
    """
    Les vitres et les petites pièces de couleur unie se partagent quelques pixels de l'atlas : une case par matériau
    et par orientation. Le reste de l'atlas, réduit d'un rien, laisse en haut la bande où se rangent ces cases.
    Sur une façade, des centaines de petits îlots et leurs marges libèrent ainsi la place pour les murs.
    """
    names = [m.name for m in obj.data.materials]
    uv = obj.data.uv_layers.active.data
    cells = {}
    step, size = 0.016, 0.008
    for p in obj.data.polygons:
        if keep[p.index]:
            for li in p.loop_indices:
                uv[li].uv = uv[li].uv * atlas_scale
            continue
        key = (p.material_index, tuple(round(c) for c in p.normal))
        k = cells.setdefault(key, len(cells))
        u0, v0 = 0.006 + (k % 60) * step, 0.99 - (k // 60) * step
        if k == len(_CELLS):
            _CELLS.append((u0, v0, size))
        for li, (du, dv) in zip(p.loop_indices, ((0, 0), (1, 0), (1, 1), (0, 1))):
            uv[li].uv = (u0 + du * size, v0 + dv * size)
    print("SHARED CELLS", len(cells))


def _join_and_unwrap(margin, drop_hidden=False, shared=None):
    _flush_panes()
    bpy.ops.object.select_all(action="DESELECT")
    for o in _OBJECTS:
        o.select_set(True)
    for o in _OBJECTS:
        bpy.context.view_layer.objects.active = o
        for m in list(o.modifiers):
            bpy.ops.object.modifier_apply(modifier=m.name)
    bpy.context.view_layer.objects.active = _OBJECTS[0]
    bpy.ops.object.join()
    obj = bpy.context.active_object
    if drop_hidden:
        _drop_hidden(obj)
    print("TRIANGLES", sum(len(p.vertices) - 2 for p in obj.data.polygons))
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=margin)
    if shared:
        # Seules les faces gardant leur propre îlot entrent dans le rangement
        bpy.ops.object.mode_set(mode="OBJECT")
        names = [m.name for m in obj.data.materials]
        tree = _tree(obj)
        keep = [names[p.material_index] not in shared or len(p.vertices) != 4 or _buried(tree, p) for p in obj.data.polygons]
        bpy.ops.object.mode_set(mode="EDIT")
        # Le rangement prend tous les îlots visibles, sélectionnés ou non : on cache les autres
        bm = bmesh.from_edit_mesh(obj.data)
        bm.faces.ensure_lookup_table()
        for f in bm.faces:
            f.hide_set(not keep[f.index])
            f.select_set(keep[f.index])
        bmesh.update_edit_mesh(obj.data)
    bpy.ops.uv.select_all(action="SELECT")
    bpy.ops.uv.average_islands_scale()
    bpy.ops.uv.pack_islands(margin=margin, margin_method="FRACTION")
    if shared:
        bpy.ops.mesh.reveal(select=False)
    bpy.ops.object.mode_set(mode="OBJECT")
    if shared:
        _share_uvs(obj, shared, keep)
    return obj


def _bake_atlas(obj, name, out, atlas):
    img = bpy.data.images.new(f"{name}_light", atlas, atlas, alpha=False, float_buffer=True)
    for m in obj.data.materials:
        n = m.node_tree.nodes.new("ShaderNodeTexImage")
        n.image = img
        m.node_tree.nodes.active = n
    scene = bpy.context.scene
    scene.cycles.bake_type = "COMBINED"
    scene.render.bake.margin = 4
    scene.render.bake.use_selected_to_active = False
    scene.render.bake.use_pass_glossy = False
    scene.render.bake.use_pass_transmission = False
    bpy.ops.object.bake(type="COMBINED")
    print("BAKED")
    # La page affiche cette texture sans éclairage : elle doit être prête à l'écran.
    raw = np.empty(atlas * atlas * 4, dtype=np.float32)
    img.pixels.foreach_get(raw)
    rgb = raw.reshape(-1, 4)[:, :3]
    # Une case partagée prend sa couleur moyenne : sinon le bruit d'une seule fenêtre s'étire sur toute une vitrine
    grid = rgb.reshape(atlas, atlas, 3).copy()
    for u0, v0, size in _CELLS:
        x0, y0, n = round(u0 * atlas), round(v0 * atlas), round(size * atlas)
        grid[y0 - 4 : y0 + n + 4, x0 - 4 : x0 + n + 4] = grid[y0 + 1 : y0 + n - 1, x0 + 1 : x0 + n - 1].reshape(-1, 3).mean(axis=0)
    rgb = grid.reshape(-1, 3)
    rgb = rgb * (1 + rgb / 16.0) / (1 + rgb)  # épaule douce : les parties émissives ne saturent pas à plat
    rgb = np.clip(rgb * 1.45, 0, 1)
    enc = np.where(rgb < 0.0031308, rgb * 12.92, 1.055 * np.power(rgb, 1 / 2.4) - 0.055)
    pixels = np.ones((atlas * atlas, 4), dtype=np.float32)
    pixels[:, :3] = enc
    ldr = bpy.data.images.new(f"{name}_atlas", atlas, atlas, alpha=False)
    ldr.pixels.foreach_set(pixels.ravel())
    ldr.update()
    ldr.filepath_raw = os.path.join(out, f"{name}_atlas.png")
    ldr.file_format = "PNG"
    ldr.save()
    final = bpy.data.materials.new(f"{name}_baked")
    final.use_nodes = True
    b = final.node_tree.nodes["Principled BSDF"]
    t = final.node_tree.nodes.new("ShaderNodeTexImage")
    t.image = ldr
    final.node_tree.links.new(t.outputs["Color"], b.inputs["Base Color"])
    return final


def _export(objects, name, out):
    bpy.ops.object.select_all(action="DESELECT")
    for o in objects:
        o.select_set(True)
    path = os.path.join(out, f"{name}.glb")
    bpy.ops.export_scene.gltf(
        filepath=path,
        use_selection=True,
        export_format="GLB",
        export_yup=True,
        export_apply=True,
        export_image_format="JPEG",
        export_jpeg_quality=92,
    )
    os.remove(os.path.join(out, f"{name}_atlas.png"))
    print("EXPORTED", name, os.path.getsize(path))


def bake_export(name, out, atlas, margin=0.003):
    obj = _join_and_unwrap(margin)
    final = _bake_atlas(obj, name, out, atlas)
    obj.data.materials.clear()
    obj.data.materials.append(final)
    for p in obj.data.polygons:
        p.material_index = 0
    obj.name = name
    _export([obj], name, out)


def _mirror_diagonal(part, name):
    """
    Copie symétrique par rapport à la diagonale x = y : la façade sur rue et le côté gauche échangent leur place.
    Ce sont les deux faces au soleil, la lumière cuite reste donc juste, et l'atlas est partagé.
    """
    m = part.copy()
    m.data = part.data.copy()
    m.name = m.data.name = name
    bpy.context.collection.objects.link(m)
    bm = bmesh.new()
    bm.from_mesh(m.data)
    for v in bm.verts:
        v.co.x, v.co.y = v.co.y, v.co.x
    bmesh.ops.reverse_faces(bm, faces=bm.faces, flip_multires=False)
    bm.to_mesh(m.data)
    bm.free()
    return m


def bake_export_split(name, out, atlas, spacing, count, margin=0.003, drop_hidden=False, mirrored=False, shared=None):
    """
    Pour une série de bâtiments posés côte à côte le long de x : un seul atlas, un mesh par bâtiment,
    chacun recentré sur son origine et nommé {name}_{i}. mirrored ajoute {name}_{count + i}, symétrique de {name}_{i}.
    shared nomme les matériaux posés en vitres d'une seule face, qui se partagent l'atlas (voir _share_uvs).
    """
    obj = _join_and_unwrap(margin, drop_hidden, shared)
    final = _bake_atlas(obj, name, out, atlas)
    obj.data.materials.clear()
    obj.data.materials.append(final)
    for p in obj.data.polygons:
        p.material_index = 0
    parts = []
    for i in range(count):
        part = obj.copy()
        part.data = obj.data.copy()
        part.name = part.data.name = f"{name}_{i}"
        bpy.context.collection.objects.link(part)
        bm = bmesh.new()
        bm.from_mesh(part.data)
        cx = i * spacing
        outside = [f for f in bm.faces if abs(f.calc_center_median().x - cx) > spacing / 2]
        bmesh.ops.delete(bm, geom=outside, context="FACES")
        for v in bm.verts:
            v.co.x -= cx
        bm.to_mesh(part.data)
        bm.free()
        parts.append(part)
    bpy.data.objects.remove(obj)
    if mirrored:
        parts += [_mirror_diagonal(p, f"{name}_{count + i}") for i, p in enumerate(parts)]
    _export(parts, name, out)
