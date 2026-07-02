"""Generate presentation assets for Terrain-Generierung aus Noise Maps chapter."""

from __future__ import annotations

import math
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
from PIL import Image, ImageDraw, ImageFont

OUTPUT_DIR = Path("images")
OUTPUT_DIR.mkdir(exist_ok=True)

W, H = 1200, 520
#BG = (250, 250, 250)
BG = (54, 61, 70)
BLACK = (30, 30, 30)
GRAY = (64, 64, 64)
LIGHT = (235, 235, 235)
BLUE = (120, 170, 255)
GREEN = (120, 210, 140)
ORANGE = (255, 190, 120)
PURPLE = (190, 150, 255)
RED = (230, 120, 120)


def load_fonts():
    candidates = [
        "/System/Library/Fonts/Supplemental/Arial.ttf",
        "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/segoeui.ttf",
    ]
    for path in candidates:
        try:
            return (
                ImageFont.truetype(path, 20),
                ImageFont.truetype(path, 16),
                ImageFont.truetype(path, 12),
            )
        except OSError:
            continue
    default = ImageFont.load_default()
    return default, default, default


FONT, FONT_SMALL, FONT_TINY = load_fonts()


def draw_arrow(draw, x1, y1, x2, y2, color=BLACK, width=3):
    draw.line((x1, y1, x2, y2), fill=color, width=width)
    ang = math.atan2(y2 - y1, x2 - x1)
    s = 10
    a1 = ang + 2.6
    a2 = ang - 2.6
    p1 = (x2 + s * math.cos(a1), y2 + s * math.sin(a1))
    p2 = (x2 + s * math.cos(a2), y2 + s * math.sin(a2))
    draw.polygon([(x2, y2), p1, p2], fill=color)


def draw_box(draw, x, y, w, h, label, fill=LIGHT, sublabel=None):
    draw.rounded_rectangle((x, y, x + w, y + h), radius=10, outline=BLACK, width=3, fill=fill)
    tw = draw.textbbox((0, 0), label, font=FONT_SMALL)[2]
    draw.text((x + w / 2 - tw / 2, y + 14), label, fill=BLACK, font=FONT_SMALL)
    if sublabel:
        sw = draw.textbbox((0, 0), sublabel, font=FONT_TINY)[2]
        draw.text((x + w / 2 - sw / 2, y + 36), sublabel, fill=GRAY, font=FONT_TINY)


def generate_terrain_noise_to_geometry():
    img = Image.new("RGB", (W, 100), BG)
    draw = ImageDraw.Draw(img)

    boxes = [
        ("Seed", 40, BLUE),
        ("Noise Map\n(fBm)", 240, LIGHT),
        ("Interpretation", 440, ORANGE),
        ("Geometrie\n(Mesh / Voxel)", 640, GREEN),
        ("Rendering\n-Pipeline", 840, PURPLE),
        ("Terrain", 1040, GREEN),
    ]
    bw, bh = 130, 70
    y = 15
    for i, (label, x, color) in enumerate(boxes):
        lines = label.split("\n")
        draw_box(draw, x, y, bw, bh, lines[0], fill=color, sublabel=lines[1] if len(lines) > 1 else None)
        if i < len(boxes) - 1:
            draw_arrow(draw, x + bw + 5, y + bh / 2, boxes[i + 1][1] - 10, y + bh / 2)

    out = OUTPUT_DIR / "terrain_noise_to_geometry.png"
    img.save(out)
    print(f"Saved {out}")


def generate_cpu_sampling():
    cols, rows = 8, 8
    cell = 40
    border = 4

    width = cols * cell + border * 2
    height = rows * cell + border * 2

    img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    ax = border
    ay = border

    for j in range(rows):
        for i in range(cols):
            val = int(100 + 120 * (0.5 + 0.5 * math.sin(i + j * 0.5)))

            draw.rectangle(
                (
                    ax + i * cell,
                    ay + j * cell,
                    ax + (i + 1) * cell,
                    ay + (j + 1) * cell
                ),
                fill=(val, val, val),
                outline=BLACK
            )

    # ausgewählter Texel
    draw.rectangle(
        (
            ax + 3 * cell,
            ay + 4 * cell,
            ax + 4 * cell,
            ay + 5 * cell
        ),
        outline=ORANGE,
        width=4
    )

    # Samplepunkt
    px = border + 3.6 * cell
    py = border + 4.55 * cell
    draw.ellipse(
        (
            px - 6,
            py - 6,
            px + 6,
            py + 6
        ),
        fill=RED,
        outline=BLACK
    )

    out = OUTPUT_DIR / "cpu_sampling.png"
    img.save(out)
    print(f"Saved {out}")


def generate_gpu_sampling():
    cols, rows = 8, 8
    cell = 40
    border = 4

    width = cols * cell + border * 2
    height = rows * cell + border * 2

    img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    gx = border
    gy = border

    # Noise-Map
    for j in range(rows):
        for i in range(cols):
            val = int(
                100 + 120 * (
                    0.5 + 0.5 * math.sin(i + j * 0.5)
                )
            )

            draw.rectangle(
                (
                    gx + i * cell,
                    gy + j * cell,
                    gx + (i + 1) * cell,
                    gy + (j + 1) * cell
                ),
                fill=(val, val, val),
                outline=BLACK
            )

    # UV-Samplepunkt
    px = gx + 3.6 * cell
    py = gy + 4.55 * cell

    # Vier Texel der bilinearen Interpolation
    neighbors = [
        (3, 4),  # TL
        (4, 4),  # TR
        (3, 5),  # BL
        (4, 5),  # BR
    ]

    for tx, ty in neighbors:
        draw.rectangle(
            (
                gx + tx * cell,
                gy + ty * cell,
                gx + (tx + 1) * cell,
                gy + (ty + 1) * cell
            ),
            outline=BLUE,
            width=3
        )

    # Samplepunkt
    draw.ellipse(
        (
            px - 6,
            py - 6,
            px + 6,
            py + 6
        ),
        fill=RED,
        outline=BLACK
    )

    out = OUTPUT_DIR / "gpu_sampling.png"
    img.save(out)

    print(f"Saved {out}")


def generate_bilinear_interpolation_figure():
    cell = 160
    border = 4
    width = 2 * cell + 2 * border
    height = 2 * cell + 2 * border
    img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    gx = border
    gy = border

    texel_colors = [
        (108, 108, 108),   # TL
        (132, 132, 132),   # TR
        (118, 118, 118),   # BL
        (150, 150, 150)    # BR
    ]

    GRID = (0, 0, 0)
    BLUE = (110, 160, 255)
    RED = (255, 135, 135)
    LINE = (40, 90, 190)

    index = 0
    for y in range(2):
        for x in range(2):

            draw.rectangle(
                (
                    gx + x * cell,
                    gy + y * cell,
                    gx + (x + 1) * cell,
                    gy + (y + 1) * cell,
                ),
                fill=texel_colors[index],
                outline=GRID,
                width=2,
            )

            index += 1

    px = gx + 0.60 * cell
    py = gy + 0.55 * cell

    centers = [
        (gx + 0.5 * cell, gy + 0.5 * cell),   # TL
        (gx + 1.5 * cell, gy + 0.5 * cell),   # TR
        (gx + 0.5 * cell, gy + 1.5 * cell),   # BL
        (gx + 1.5 * cell, gy + 1.5 * cell),   # BR
    ]

    try:
        font = ImageFont.truetype(r"C:\Windows\Fonts\arial.ttf", 32)
    except:
        font = ImageFont.load_default()
        print("Couldn't load Font!")

    def draw_text_corner(x0, y0, x1, y1, text, corner, margin=10):
        if corner == "tl":
            x, y = x0 + margin, y0 + margin
            anchor = "lt"

        elif corner == "tr":
            x, y = x1 - margin, y0 + margin
            anchor = "rt"

        elif corner == "bl":
            x, y = x0 + margin, y1 - margin
            anchor = "lb"

        elif corner == "br":
            x, y = x1 - margin, y1 - margin
            anchor = "rb"
        else:
            raise ValueError("Not known postion was given!")

        draw.text(
            (x, y),
            text,
            fill="black",
            font=font,
            anchor=anchor
        )

    index = 0

    for j in range(2):
        for i in range(2):

            x0 = gx + i * cell
            y0 = gy + j * cell
            x1 = x0 + cell
            y1 = y0 + cell

            draw.rectangle(
                (x0, y0, x1, y1),
                fill=texel_colors[index],
                outline=GRID,
                width=2
            )

            # korrekte Beschriftung
            labels = [
                ["T00", "T10"],
                ["T01", "T11"]
            ]

            corners = [
                ["tl", "tr"],
                ["bl", "br"]
            ]

            draw_text_corner(
                x0, y0, x1, y1,
                labels[j][i],
                corners[j][i]
            )

            index += 1

    for cx, cy in centers:
        draw.line(
            (px, py, cx, cy),
            fill=LINE,
            width=2
        )

    CENTER_RADIUS = 6
    for cx, cy in centers:
        draw.ellipse(
            (
                cx - CENTER_RADIUS,
                cy - CENTER_RADIUS,
                cx + CENTER_RADIUS,
                cy + CENTER_RADIUS,
            ),
            fill=(255, 255, 255),
            outline=BLUE,
            width=3,
        )

    SAMPLE_RADIUS = 10
    draw.ellipse(
        (
            px - SAMPLE_RADIUS,
            py - SAMPLE_RADIUS,
            px + SAMPLE_RADIUS,
            py + SAMPLE_RADIUS,
        ),
        fill=RED,
        outline=GRID,
        width=2,
    )

    out = OUTPUT_DIR / "bilinear_interpolation.png"
    img.save(out)
    print(f"Saved {out}")


def generate_flow_diagram(steps, filename, width=900, bw=130):
    img = Image.new("RGBA", (width, 100), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    bh = 70
    y = 15
    gap = 45
    total_w = len(steps) * bw + (len(steps) - 1) * gap
    start_x = (width - total_w) / 2
    colors = [LIGHT, BLUE, ORANGE, GREEN, PURPLE, GREEN]
    for i, step in enumerate(steps):
        x = start_x + i * (bw + gap)
        draw_box(draw, x, y, bw, bh, step, fill=colors[i % len(colors)])
        if i < len(steps) - 1:
            draw_arrow(draw, x + bw + 3, y + bh / 2, x + bw + gap - 3, y + bh / 2)
    out = OUTPUT_DIR / filename
    img.save(out)
    print(f"Saved {out}")


def generate_heightmap_flow():
    generate_flow_diagram(
        [
            "Noise-Map",
            "Höhenwert h(x,z)\n    bestimmen",
            "Flaches Mesh\n    erzeugen",
            "Vertexhöhen\n  anpassen",
            "  Fertige\nOberfläche"
        ],
        "heightmap_flow.png",
    )


def generate_voxel_columns_flow():
    generate_flow_diagram(
        [
            "Noise-Map",
            "Höhenwert h(x,z)\n    bestimmen",
            "Voxelhöhe\nbestimmen",
            "Voxel-Säule\n  erzeugen",
            "Fertiges Terrain"
        ],
        "voxel_columns_flow.png",
    )


def generate_vertex_displacement_pipeline():
    generate_flow_diagram(
        [
            "Noise-Map",
            "  Heightmap-\nTextur erzeugen",
            "Basismesh\n erzeugen",
            " Daten an die\nGPU übertragen",
            " Vertex-Shader\nmit Displacement",
            "  Fertige\nOberfläche"
        ],
        "vertex_displacement_pipeline.png",
        1100
    )


def generate_voxel_density_pipeline():
    generate_flow_diagram(
        [
            "3D-Noise",
            "Dichtewert ρ(x,y,z)\n      bestimmen",
            "Dichtefeld\n erzeugen",
            " Isofläche\nextrahieren",
            "Fertiges Terrain"
        ],
        "voxel_density_pipeline.png",
        900,
        140
    )


def generate_s_curve_image(H_min=0, H_max=40, p=2.0, steps=300):
    x = np.linspace(0.0, 1.0, steps)

    # Height Curve
    n = np.clip(x, 0.0, 1.0)

    # S-Kurve statt Power-Kurve
    y_norm = n * n * (3.0 - 2.0 * n)

    y = H_min + (H_max - H_min) * y_norm

    fig, ax = plt.subplots(figsize=(6, 4))

    # Background (HEX direkt besser!)
    fig.patch.set_facecolor("#363D46")
    ax.set_facecolor("#363D46")

    # Curve
    ax.plot(x, y, color="white", linewidth=2)

    # Axes styling
    for spine in ["bottom", "left"]:
        ax.spines[spine].set_color("white")
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)

    ax.tick_params(axis="x", colors="white")
    ax.tick_params(axis="y", colors="white")

    # Labels
    ax.set_xlabel(r"Noise Value $v \in [0; 1]$", color="white")
    ax.set_ylabel(r"Height $y \in [H_{min}; H_{max}]$", color="white")

    if H_max != H_min:
        ax.set_yticks([H_min, H_max])
        ax.set_yticklabels(["$H_{min}$", "$H_{max}$"], color="white")
    else:
        ax.set_yticks([0, 1])
        ax.set_yticklabels(["0", "1"], color="white")

    ax.set_xticks([0, 1])
    ax.set_xticklabels(["0", "1"], color="white")

    # Grid
    ax.grid(True, color="#666666", linestyle="--", linewidth=0.6, alpha=0.5)
    ax.set_xlim(0, 1)

    if H_max == H_min:
        ax.set_ylim(0, 1)
    else:
        ax.set_ylim(H_min, H_max)

    ax.set_title("Mögliche Höhenfunktion", color="white")

    out = OUTPUT_DIR / "s_curve_height_function.png"
    plt.savefig(out, dpi=150, bbox_inches="tight", facecolor="#363D46")
    plt.close(fig)

    print(f"Saved {out}")


def generate_voxel_density_slice():
    cols = 16
    rows = 12
    cell = 40
    border = 10

    VOXEL_FILL = (255, 255, 255)
    AIR_FILL = BLUE

    width = cols * cell + border * 2
    height = rows * cell + border * 2

    img = Image.new("RGB", (width, height), BG)
    draw = ImageDraw.Draw(img)

    # Diskrete Terrainoberfläche
    terrain_heights = [
        7, 7, 6, 6,
        5, 5, 4, 4,
        4, 4, 5, 5,
        6, 6, 7, 7
    ]

    # Höhlenparameter
    cave_cx = 8.0
    cave_cy = 7.5

    cave_rx = 4.0
    cave_ry = 2.5

    for y in range(rows):
        for x in range(cols):

            # Säule aus Blöcken erzeugen
            is_solid = y >= terrain_heights[x]

            # Höhle aus dem Volumen ausschneiden
            dx = (x + 0.5 - cave_cx) / cave_rx
            dy = (y + 0.5 - cave_cy) / cave_ry

            inside_cave = dx * dx + dy * dy <= 1.0

            if inside_cave:
                is_solid = False

            fill = VOXEL_FILL if is_solid else AIR_FILL

            x0 = border + x * cell
            y0 = border + y * cell
            x1 = x0 + cell
            y1 = y0 + cell

            draw.rectangle(
                (x0, y0, x1, y1),
                fill=fill,
                outline=BLACK
            )

    out = OUTPUT_DIR / "voxel_density_slice.png"
    img.save(out)

    print(f"Saved {out}")


def _column_surface_row(col: float, cols: int, rows: int) -> float:
    t = col / max(cols - 1, 1)
    h_norm = 0.28 + 0.22 * math.sin(t * math.pi * 1.15)
    h_norm += 0.12 * math.sin(t * math.pi * 2.4 + 0.6)
    h_norm = max(0.0, min(1.0, h_norm))
    return h_norm * (rows - 1)


def generate_marching_cubes():
    cols = 12
    rows = 10
    cell = 34
    margin = cell // 2

    VOXEL_FILL = (255, 255, 255, 255)
    AIR_FILL = (*BLUE, 255)
    ISO_LINE = (0, 0, 128, 255)

    width = cols * cell + cell
    height = rows * cell + cell

    img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    origin_x = margin
    origin_y = margin

    column_heights = [_column_surface_row(x, cols, rows) for x in range(cols)]

    for x in range(cols):
        surface_row = column_heights[x]
        for y in range(rows):
            is_solid = y >= surface_row
            fill = VOXEL_FILL if is_solid else AIR_FILL

            x0 = origin_x + x * cell
            y0 = origin_y + y * cell
            x1 = x0 + cell
            y1 = y0 + cell

            draw.rectangle((x0, y0, x1, y1), fill=fill, outline=(*BLACK, 255), width=1)

    # Isosurface spans the grid width only (not the transparent margin).
    grid_left = origin_x
    grid_right = origin_x + cols * cell
    iso_samples = 240
    iso_points: list[tuple[float, float]] = []
    for i in range(iso_samples + 1):
        px = grid_left + i / iso_samples * (grid_right - grid_left)
        x_frac = (px - origin_x) / cell - 0.5
        col_left = int(math.floor(x_frac))
        col_right = col_left + 1
        blend = x_frac - col_left
        if col_left < 0:
            surface_row = column_heights[0]
        elif col_right >= cols:
            surface_row = column_heights[-1]
        else:
            surface_row = (
                (1.0 - blend) * column_heights[col_left]
                + blend * column_heights[col_right]
            )
        py = origin_y + surface_row * cell
        iso_points.append((px, py))

    draw.line(iso_points, fill=ISO_LINE, width=4, joint="curve")

    try:
        label_font = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 34)
    except OSError:
        label_font = FONT

    grid_cx = origin_x + cols * cell / 2
    avg_surface_y = origin_y + sum(column_heights) / cols * cell
    grid_bottom = origin_y + rows * cell
    luft_cy = (origin_y + avg_surface_y) / 2 - 10
    fest_cy = (avg_surface_y + grid_bottom) / 2 - 10

    draw.text(
        (grid_cx, luft_cy),
        "Luft",
        fill=(*BLACK, 255),
        font=label_font,
        anchor="mm",
    )
    draw.text(
        (grid_cx, fest_cy),
        "Fest",
        fill=(*BLACK, 255),
        font=label_font,
        anchor="mm",
    )

    out = OUTPUT_DIR / "marching_cubes.png"
    img.save(out)
    print(f"Saved {out}")


def main():
    generate_terrain_noise_to_geometry()
    generate_cpu_sampling()
    generate_gpu_sampling()
    generate_bilinear_interpolation_figure()
    generate_heightmap_flow()
    generate_voxel_columns_flow()
    generate_vertex_displacement_pipeline()
    generate_voxel_density_pipeline()
    generate_s_curve_image()
    generate_voxel_density_slice()
    generate_marching_cubes()
    print("All terrain generation assets generated.")


if __name__ == "__main__":
    main()
