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

_MATS = {}
_OBJECTS = []
_PANES = {}


def reset(samples):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    _MATS.clear()
    _OBJECTS.clear()
    _PANES.clear()
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.samples = samples
    scene.cycles.use_denoising = False
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


def pane(material, size, at):
    """Petit volume sans biseau, regroupé par matériau : une façade en compte des centaines."""
    _PANES.setdefault(material.name, (material, []))[1].append((size, at))


def _flush_panes():
    for name, (material, items) in _PANES.items():
        me = bpy.data.meshes.new(f"panes_{name}")
        bm = bmesh.new()
        for (sx, sy, sz), (x, y, z) in items:
            vs = [bm.verts.new((x + i * sx / 2, y + j * sy / 2, z + k * sz / 2)) for i in (-1, 1) for j in (-1, 1) for k in (-1, 1)]
            for f in ((0, 1, 3, 2), (4, 6, 7, 5), (0, 4, 5, 1), (2, 3, 7, 6), (0, 2, 6, 4), (1, 5, 7, 3)):
                bm.faces.new([vs[i] for i in f])
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        bm.to_mesh(me)
        bm.free()
        o = bpy.data.objects.new(f"panes_{name}", me)
        bpy.context.collection.objects.link(o)
        _finish(o, material, 0)
    _PANES.clear()


def windows(face, plane, u0, u1, z0, z1, cols, rows, width, height, lit=0.25, seed=1, glass="#232a55"):
    """
    Grille de fenêtres sur une façade. face : front (-y), back (+y), left (-x), right (+x).
    plane est la coordonnée du mur, u parcourt la façade, et lit la part de fenêtres allumées.
    """
    rng = random.Random(seed)
    dark = mat("glass_dark", glass, 0.4)
    warm = mat("glass_warm", "#000000", 0.5, emit="#ffa95c", power=1.15)
    cool = mat("glass_cool", "#000000", 0.5, emit="#8fb8ff", power=0.8)
    blind = mat("glass_blind", "#000000", 0.5, emit="#e8824a", power=0.55)
    frame = mat("glass_frame", "#2b2645", 0.6)
    # Assez grandes pour être vues de près : un meneau, et un store baissé sur les fenêtres allumées
    detailed = width >= 0.34
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
                if face in ("front", "back"):
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


def _join_and_unwrap(margin):
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
    print("TRIANGLES", sum(len(p.vertices) - 2 for p in obj.data.polygons))
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=margin)
    bpy.ops.uv.select_all(action="SELECT")
    bpy.ops.uv.average_islands_scale()
    bpy.ops.uv.pack_islands(margin=margin)
    bpy.ops.object.mode_set(mode="OBJECT")
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


def bake_export_split(name, out, atlas, spacing, count, margin=0.003):
    """
    Pour une série de bâtiments posés côte à côte le long de x : un seul atlas, un mesh par bâtiment,
    chacun recentré sur son origine et nommé {name}_{i}.
    """
    obj = _join_and_unwrap(margin)
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
    _export(parts, name, out)
