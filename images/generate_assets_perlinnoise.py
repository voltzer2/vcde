import math
import os

import matplotlib.pyplot as plt


def fade_perlin(t):
    return t * t * t * (t * (t * 6 - 15) + 10)


def lerp(a, b, t):
    return a * (1 - t) + b * t


def dot(gradient, distance):
    return gradient[0] * distance[0] + gradient[1] * distance[1]


def unit_vector(degrees):
    radians = math.radians(degrees)
    return math.cos(radians), math.sin(radians)


# Beispielpunkt innerhalb einer Perlin-Gitterzelle
p = (0.35, 0.62)

# Vier Zellenecken und beispielhafte Gradientenvektoren
corners = {
    "00": {"position": (0, 0), "gradient": unit_vector(35)},
    "10": {"position": (1, 0), "gradient": unit_vector(145)},
    "01": {"position": (0, 1), "gradient": unit_vector(-50)},
    "11": {"position": (1, 1), "gradient": unit_vector(230)},
}

for corner in corners.values():
    px, py = p
    cx, cy = corner["position"]
    corner["distance"] = (px - cx, py - cy)
    corner["dot"] = dot(corner["gradient"], corner["distance"])

tx = p[0]
ty = p[1]
sx = fade_perlin(tx)
sy = fade_perlin(ty)

d00 = corners["00"]["dot"]
d10 = corners["10"]["dot"]
d01 = corners["01"]["dot"]
d11 = corners["11"]["dot"]

ix0 = lerp(d00, d10, sx)
ix1 = lerp(d01, d11, sx)
noise_value = lerp(ix0, ix1, sy)
normalized_value = (noise_value + 1) / 2

fig = plt.figure(figsize=(14, 6.4))
grid = fig.add_gridspec(1, 3, width_ratios=[1.1, 0.9, 1.35])
cell_ax = fig.add_subplot(grid[0, 0])
fade_ax = fig.add_subplot(grid[0, 1])
text_ax = fig.add_subplot(grid[0, 2])

# Gitterzelle mit Gradientenvektoren und Beispielpunkt
cell_ax.set_title("Ein Noise-Punkt in einer Perlin-Zelle")
cell_ax.set_aspect("equal")
cell_ax.set_xlim(-0.25, 1.25)
cell_ax.set_ylim(-0.25, 1.25)
cell_ax.set_xticks([0, 1])
cell_ax.set_yticks([0, 1])
cell_ax.grid(True, alpha=0.25)
cell_ax.plot([0, 1, 1, 0, 0], [0, 0, 1, 1, 0], color="#111827", linewidth=1.5)

cell_ax.scatter([p[0]], [p[1]], color="#dc2626", zorder=6)
cell_ax.text(p[0] + 0.04, p[1] + 0.04, "p = (0.35, 0.62)", color="#dc2626")

for label, corner in corners.items():
    cx, cy = corner["position"]
    gx, gy = corner["gradient"]
    dx, dy = corner["distance"]
    d = corner["dot"]

    cell_ax.scatter([cx], [cy], color="#111827", zorder=5)
    cell_ax.text(cx - 0.08, cy - 0.09, f"p{label}", fontsize=10)

    cell_ax.arrow(
        cx,
        cy,
        gx * 0.22,
        gy * 0.22,
        width=0.008,
        head_width=0.04,
        length_includes_head=True,
        color="#2563eb",
    )
    cell_ax.plot([cx, cx + dx], [cy, cy + dy], color="#6b7280", linestyle="--", linewidth=1)
    # cell_ax.text(
    #     cx + 0.08,
    #     cy + 0.08,
    #     f"d{label} = g{label} · (p - p{label})\n= {d:.2f}",
    #     color="#7c2d12",
    #     fontsize=8.5,
    #     bbox={
    #         "boxstyle": "round,pad=0.2",
    #         "facecolor": "#fff7ed",
    #         "edgecolor": "#fed7aa",
    #         "alpha": 0.92,
    #     },
    # )

cell_ax.text(0.03, 1.13, "blau: Gradient g_ij", color="#2563eb", fontsize=10)
cell_ax.text(0.03, 1.03, "grau: Abstand p - p_ij", color="#6b7280", fontsize=10)

# Fade-Funktion: t wird vor der Interpolation geglättet
t_values = [i / 299 for i in range(300)]
s_values = [fade_perlin(t) for t in t_values]
fade_ax.set_title("Quintic Fade")
fade_ax.plot(t_values, t_values, label="t", color="#6b7280", linewidth=2)
fade_ax.plot(t_values, s_values, label="s(t)", color="#dc2626", linewidth=2.5)
fade_ax.scatter([tx, ty], [sx, sy], color=["#2563eb", "#16a34a"], zorder=5)
fade_ax.vlines([tx, ty], [0, 0], [sx, sy], colors=["#2563eb", "#16a34a"], linestyles="--")
fade_ax.text(tx + 0.03, sx - 0.08, f"sx = {sx:.3f}", color="#2563eb", fontsize=10)
fade_ax.text(ty + 0.03, sy + 0.03, f"sy = {sy:.3f}", color="#16a34a", fontsize=10)
fade_ax.set_xlabel("t")
fade_ax.set_ylabel("s(t)")
fade_ax.set_xlim(0, 1)
fade_ax.set_ylim(0, 1)
fade_ax.grid(True, alpha=0.3)
fade_ax.legend(loc="upper left")

# Formel- und Beispielrechnung
text_ax.axis("off")
dot_lines = []
for label in ("00", "10", "01", "11"):
    corner = corners[label]
    gx, gy = corner["gradient"]
    dx, dy = corner["distance"]
    d = corner["dot"]
    dot_lines.append(
        f"d{label} = ({gx:.2f}, {gy:.2f}) · ({dx:.2f}, {dy:.2f})"
        f" = {gx:.2f}*{dx:.2f} + {gy:.2f}*{dy:.2f} = {d:.3f}"
    )

formula_text = (
    f"Formeln und Beispielrechnung für Beispielpunkt: p = ({p[0]:.2f}, {p[1]:.2f})\n\n"
    r"$\mathbf{d_{ij} = g_{ij} \cdot (p - p_{ij})}$"
    "\n\n"
    "d00, d10, d01 und d11 entstehen durch Skalarprodukte aus den \n"
    "pesudozufälligen Gradientenvektoren g_ij und Abstandsvektoren p - p_ij.\n\n"
    + "\n".join(dot_lines)
    + "\n\n"
    r"$\mathbf{s(t) = 6t^5 - 15t^4 + 10t^3}$"
    "\n\n"
    f"sx = s({tx:.2f}) = {sx:.3f}\n"
    f"sy = s({ty:.2f}) = {sy:.3f}\n\n"
    r"$\mathbf{Interpolieren an Ober- und Unterkante\ in\ x-Richtung:}$"
    "\n"
    r"$i_{x0} = \operatorname{lerp}(d_{00}, d_{10}, s_x)$"
    f"\n= lerp({d00:.3f}, {d10:.3f}, {sx:.3f}) = {ix0:.3f}\n"
    r"$i_{x1} = \operatorname{lerp}(d_{01}, d_{11}, s_x)$"
    f"\n= lerp({d01:.3f}, {d11:.3f}, {sx:.3f}) = {ix1:.3f}\n\n"
    r"$\mathbf{Interpolieren zwischen den obigen Werten\ in\ y-Richtung:}$"
    "\n"
    r"$n(x,y) = \operatorname{lerp}(i_{x0}, i_{x1}, s_y)$"
    f"\n= lerp({ix0:.3f}, {ix1:.3f}, {sy:.3f})"
    f"\n= {noise_value:.3f}\n\n"
    f"Wert wird auf 0...1 normalisiert: ({noise_value:.3f} + 1) / 2 = {normalized_value:.3f}\n"
)
text_ax.text(
    0,
    1,
    formula_text,
    va="top",
    ha="left",
    fontsize=10.5,
    linespacing=1.42,
    bbox={
        "boxstyle": "round,pad=0.7",
        "facecolor": "#f8fafc",
        "edgecolor": "#d1d5db",
    },
)

#fig.suptitle("Perlin Noise: Gradienten, Skalarprodukte, Fade und Interpolation", fontsize=15)
plt.tight_layout()

os.makedirs("images", exist_ok=True)
plt.savefig("images/perlinnoise_explanation.png", dpi=200, bbox_inches="tight")
plt.show()
