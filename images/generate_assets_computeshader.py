from PIL import Image, ImageDraw, ImageFont
import math

W, H = 1200, 520
BG = (250, 250, 250)
BLACK = (30, 30, 30)
GRAY = (120, 120, 120)
LIGHT = (235, 235, 235)
BLUE = (120, 170, 255)
GREEN = (120, 210, 140)
ORANGE = (255, 190, 120)
RED = (230, 120, 120)

try:
    FONT = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 20)
    FONT_SMALL = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 16)
    FONT_TINY = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 11)
except:
    FONT = ImageFont.load_default()
    FONT_SMALL = ImageFont.load_default()
    FONT_TINY = ImageFont.load_default()

frames = []

blocks_x = 3
blocks_y = 2
threads_x = 4
threads_y = 3
noise_w = 12
noise_h = 8

total_threads = blocks_x * blocks_y * threads_x * threads_y
total_noise = noise_w * noise_h

def draw_arrow(draw, x1, y1, x2, y2, color=BLACK, width=3):
    draw.line((x1, y1, x2, y2), fill=color, width=width)
    ang = math.atan2(y2 - y1, x2 - x1)
    s = 10
    a1 = ang + 2.6
    a2 = ang - 2.6
    p1 = (x2 + s * math.cos(a1), y2 + s * math.sin(a1))
    p2 = (x2 + s * math.cos(a2), y2 + s * math.sin(a2))
    draw.polygon([(x2, y2), p1, p2], fill=color)

def terrain_height(ix):
    return int(330 + 35 * math.sin(ix * 0.45) + 20 * math.sin(ix * 0.95))

for step in range(total_noise + 24):
    img = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(img)

    # Titel
    draw.text((30, 20), "Compute Shader für unsere Terrain-Generierung", fill=BLACK, font=FONT)

    # Linkes Grid
    left_x, left_y = 30, 70
    grid_w, grid_h = 350, 260
    draw.rectangle((left_x, left_y, left_x + grid_w, left_y + grid_h), outline=BLACK, width=2)
    draw.text((left_x + 70, left_y + 15), "Compute Shader Grid", fill=BLACK, font=FONT_SMALL)

    block_w = 90
    block_h = 90
    bx_gap = 20
    by_gap = 20

    active_index = min(step, total_noise - 1)
    active_block = active_index // (threads_x * threads_y)
    active_thread = active_index % (threads_x * threads_y)
    abx = active_block % blocks_x
    aby = active_block // blocks_x
    atx = active_thread % threads_x
    aty = active_thread // threads_x

    bcount = 0
    for by in range(blocks_y):
        for bx in range(blocks_x):
            x0 = left_x + 15 + bx * (block_w + bx_gap)
            y0 = left_y + 55 + by * (block_h + by_gap)
            fill = LIGHT
            if bcount < active_block:
                fill = BLUE
            elif bcount == active_block:
                fill = ORANGE
            draw.rectangle((x0, y0, x0 + block_w, y0 + block_h), outline=BLACK, width=2, fill=fill)
            draw.text((x0 + 10, y0 + 6), f"Block({by},{bx})", fill=BLACK, font=FONT_TINY)

            for ty in range(threads_y):
                for tx in range(threads_x):
                    cx = x0 + 18 + tx * 16
                    cy = y0 + 30 + ty * 16
                    col = BLACK
                    if bcount == active_block and tx == atx and ty == aty:
                        col = RED
                    draw.line((cx, cy, cx, cy + 10), fill=col, width=2)
                    draw.line((cx, cy + 10, cx - 3, cy + 6), fill=col, width=2)
                    draw.line((cx, cy + 10, cx + 3, cy + 6), fill=col, width=2)
            bcount += 1

    # Vergrößerter Block
    zoom_x, zoom_y = 520, 60
    zoom_w, zoom_h = 310, 210
    draw.rectangle((zoom_x, zoom_y, zoom_x + zoom_w, zoom_y + zoom_h), outline=BLACK, width=2)
    draw.text((zoom_x + 85, zoom_y + 10), f"Block({aby},{abx})", fill=BLACK, font=FONT_SMALL)

    cell_w = 70
    cell_h = 55
    for ty in range(threads_y):
        for tx in range(threads_x):
            x0 = zoom_x + 15 + tx * cell_w
            y0 = zoom_y + 35 + ty * cell_h
            fill = (255, 255, 255)
            if tx == atx and ty == aty and step < total_noise:
                fill = ORANGE
            elif step >= total_noise:
                fill = BLUE
            draw.rectangle((x0, y0, x0 + cell_w, y0 + cell_h), outline=BLACK, width=1, fill=fill)
            draw.text((x0 + 8, y0 + 6), f"Thread({ty},{tx})", fill=BLACK, font=FONT_TINY)

    draw.line((380, 150, 520, 150), fill=GRAY, width=2)
    draw.line((380, 150, 520, 60), fill=GRAY, width=2)
    draw.line((380, 150, 520, 270), fill=GRAY, width=2)

    # Noise Map
    noise_x, noise_y = 860, 70
    cell = 24
    draw.text((noise_x, noise_y - 30), "Noise Map auf der GPU", fill=BLACK, font=FONT_SMALL)
    for j in range(noise_h):
        for i in range(noise_w):
            idx = j * noise_w + i
            x0 = noise_x + i * cell
            y0 = noise_y + j * cell
            if idx < step:
                val = int(80 + 150 * (0.5 + 0.5 * math.sin(i * 0.6 + j * 0.8)))
                fill = (val, val, val)
            else:
                fill = (245, 245, 245)
            draw.rectangle((x0, y0, x0 + cell, y0 + cell), outline=BLACK, width=1, fill=fill)

    # Pipeline unten
    py = 360
    boxes = [
        ("Compute Shader", 60, BLUE),
        ("Heightmap", 320, GREEN),
        ("Vertex Shader", 540, ORANGE),
        ("Fragment Shader", 780, ORANGE),
        ("Terrain", 1010, GREEN),
    ]

    for label, x, color in boxes:
        draw.rounded_rectangle((x, py, x + 140, py + 55), radius=10, outline=BLACK, width=2, fill=color)
        tw = draw.textbbox((0, 0), label, font=FONT_SMALL)[2]
        draw.text((x + 70 - tw / 2, py + 16), label, fill=BLACK, font=FONT_SMALL)

    for i in range(len(boxes) - 1):
        x1 = boxes[i][1] + 140
        x2 = boxes[i + 1][1]
        draw_arrow(draw, x1 + 5, py + 28, x2 - 10, py + 28)


    # Terrain Silhouette
    terrain_left = 1010
    points = []
    for i in range(150):
        x = terrain_left + i
        y = terrain_height(i)
        points.append((x, y))
    poly = [(terrain_left, 430)] + points + [(terrain_left + 149, 430)]
    draw.polygon(poly, fill=(160, 200, 140), outline=BLACK)

    frames.append(img)

# GIF speichern
frames[0].save(
    "images/compute_shader_terrain.gif",
    save_all=True,
    append_images=frames[1:],
    duration=120,
    loop=0
)

print("GIF gespeichert als compute_shader_terrain.gif")