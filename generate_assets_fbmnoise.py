import math
import os
import random

import matplotlib.pyplot as plt


def fade(t):
    return t * t * t * (t * (t * 6 - 15) + 10)


def lerp(a, b, t):
    return a * (1 - t) + b * t


def build_1d_gradients(seed, count):
    rng = random.Random(seed)
    return [rng.choice([-1.0, 1.0]) for _ in range(count)]


def sample_1d_gradient_noise(x, gradients):
    x0 = math.floor(x)
    x1 = min(x0 + 1, len(gradients) - 1)
    t = x - x0
    s = fade(t)

    # In 1D sind die Gradientenrichtungen -1 oder +1.
    # Die Dot Products sind Gradient * Abstand zum Sample-Punkt.
    d0 = gradients[x0] * (x - x0)
    d1 = gradients[x1] * (x - x1)

    return lerp(d0, d1, s)


seed = 12345
base_frequency = 1.0
octaves = 4
lacunarity = 2.0
gain = 0.5
amplitude_sum = sum(gain**i for i in range(octaves))

x_values = [i / 499 for i in range(500)]
domain_length = 4.0

octave_data = []
fbm_values = [0.0 for _ in x_values]

for i in range(octaves):
    frequency = base_frequency * (lacunarity**i)
    amplitude = gain**i
    gradient_count = math.ceil(domain_length * frequency) + 2
    gradients = build_1d_gradients(seed + i, gradient_count)

    raw_values = []
    weighted_values = []

    for idx, x in enumerate(x_values):
        noise_x = x * domain_length * frequency
        raw = sample_1d_gradient_noise(noise_x, gradients)
        weighted = raw * amplitude
        raw_values.append(raw)
        weighted_values.append(weighted)
        fbm_values[idx] += weighted

    octave_data.append(
        {
            "index": i,
            "frequency": frequency,
            "amplitude": amplitude,
            "raw_values": raw_values,
            "weighted_values": weighted_values,
        }
    )

fbm_values = [value / amplitude_sum for value in fbm_values]

sample_index = 235
sample_x = x_values[sample_index]
sample_terms = [
    data["weighted_values"][sample_index]
    for data in octave_data
]
sample_total = sum(sample_terms)
sample_fbm = sample_total / amplitude_sum

fig = plt.figure(figsize=(14, 8))
grid = fig.add_gridspec(3, 2, width_ratios=[1.45, 1], height_ratios=[1, 1, 1])

octave_axes = [
    fig.add_subplot(grid[0, 0]),
    fig.add_subplot(grid[1, 0]),
]
sum_ax = fig.add_subplot(grid[2, 0])
bar_ax = fig.add_subplot(grid[0, 1])
formula_ax = fig.add_subplot(grid[1:, 1])

colors = ["#2563eb", "#16a34a", "#dc2626", "#7c3aed"]

# Einzelne Octaves: steigende Frequenz, sinkende Amplitude
for axis_index, ax in enumerate(octave_axes):
    start = axis_index * 2
    for local_index, data in enumerate(octave_data[start:start + 2]):
        color = colors[data["index"]]
        label = (
            f"Octave {data['index']}: "
            f"f={data['frequency']:.1f}, A={data['amplitude']:.2f}"
        )
        ax.plot(
            x_values,
            data["weighted_values"],
            color=color,
            linewidth=2,
            label=label,
        )
    ax.axhline(0, color="#9ca3af", linewidth=1)
    ax.axvline(sample_x, color="#111827", linestyle="--", linewidth=1)
    ax.set_ylim(-0.55, 0.55)
    ax.set_ylabel("A_i * n(x * f_i)")
    ax.grid(True, alpha=0.25)
    ax.legend(loc="upper right", fontsize=9)

octave_axes[0].set_title("Pro Octave: 1-D Perlin-Noise Interpolation mit jeweils anderen Gradienten")
octave_axes[1].set_xlabel("x")

# fBm-Summe
sum_ax.plot(x_values, fbm_values, color="#111827", linewidth=2.5, label="normalisierte fBm-Summe")
sum_ax.axhline(0, color="#9ca3af", linewidth=1)
sum_ax.axvline(sample_x, color="#111827", linestyle="--", linewidth=1)
sum_ax.scatter([sample_x], [sample_fbm], color="#dc2626", zorder=5)
sum_ax.text(sample_x + 0.02, sample_fbm - 0.15, f"fBm = {sample_fbm:.3f}", color="#dc2626")
sum_ax.set_title("Resultat: gewichtete Summe / Amplitudensumme")
sum_ax.set_xlabel("x")
sum_ax.set_ylabel("fBm(x)")
sum_ax.set_ylim(-0.55, 0.55)
sum_ax.grid(True, alpha=0.25)
sum_ax.legend(loc="upper right")

# Frequenz und Amplitude als Balken
indices = [data["index"] for data in octave_data]
frequencies = [data["frequency"] for data in octave_data]
amplitudes = [data["amplitude"] for data in octave_data]
bar_width = 0.36
bar_ax.bar([i - bar_width / 2 for i in indices], frequencies, width=bar_width, color="#2563eb", label="Frequenz f_i")
bar_ax.bar([i + bar_width / 2 for i in indices], amplitudes, width=bar_width, color="#dc2626", label="Amplitude A_i")
bar_ax.set_title("Parameter pro Octave")
bar_ax.set_xlabel("Octave i")
bar_ax.set_xticks(indices)
bar_ax.grid(True, axis="y", alpha=0.25)
bar_ax.legend()

for data in octave_data:
    i = data["index"]
    bar_ax.text(i - bar_width / 2, data["frequency"] + 0.08, f"{data['frequency']:.1f}", ha="center", fontsize=9)
    bar_ax.text(i + bar_width / 2, data["amplitude"] + 0.08, f"{data['amplitude']:.2f}", ha="center", fontsize=9)

# Formel und Beispielrechnung
formula_ax.axis("off")
term_lines = []
for data, term in zip(octave_data, sample_terms):
    raw = data["raw_values"][sample_index]
    scaled_x = sample_x * domain_length * data["frequency"]
    term_lines.append(
        f"i={data['index']}: "
        f"x_i=x*f_i={scaled_x:.2f}, "
        f"n(x_i)={raw:.3f}, "
        f"A_i={data['amplitude']:.3f} -> A_i*n={term:.3f}"
    )

formula_text = (
    "Formel und Beispielrechnung\n\n"
    r"$\mathbf{f_i = f_0 \cdot \lambda^i \qquad A_i = A_0 \cdot g^i}$"
    "\n\n"
    f"Beispielparameter: f0={base_frequency:.1f}, "
    f"A0=1.0, lambda={lacunarity:.1f}, gain={gain:.1f}, N={octaves}\n\n"
    r"$\mathbf{\operatorname{fBm}(x) = "
    r"\frac{\sum A_i \cdot n(x \cdot f_i)}{\sum A_i}}$"
    "\n\n"
    "n(x * f_i) bedeutet: Der Perlin-Noise wird an einer skalierten\n"
    "Position ausgewertet. Höheres f_i läuft schneller\n"
    "durch das Noise-Feld und erzeugt kleinere Details.\n\n"
    r"$\mathbf{Beispiel\ bei\ x\ =\ " + f"{sample_x:.3f}" + r":}$"
    +"\n"
    + "\n".join(term_lines)
    + "\n\n"
    f"Summe gewichteter Octaves = {sample_total:.3f}\n"
    f"Amplitudensumme = 1 + 0.5 + 0.25 + 0.125 = {amplitude_sum:.3f}\n"
    r"$\mathbf{fBm\ =\ " + f"{sample_total:.3f}" + r"\ /\ " + f"{amplitude_sum:.3f}" + r"\ =\ " + f"{sample_fbm:.3f}" + r"}$"
)
formula_ax.text(
    0,
    1,
    formula_text,
    va="top",
    ha="left",
    fontsize=10.4,
    linespacing=1.42,
    bbox={
        "boxstyle": "round,pad=0.7",
        "facecolor": "#f8fafc",
        "edgecolor": "#d1d5db",
    },
)

#fig.suptitle("Fractal Brownian Motion: mehrere Noise-Octaves werden gewichtet aufsummiert", fontsize=15)
plt.tight_layout()

os.makedirs("images", exist_ok=True)
plt.savefig("images/fbmnoise_explanation.png", dpi=200, bbox_inches="tight")
plt.show()
