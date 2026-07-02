import matplotlib.pyplot as plt

# Zwei benachbarte Zufallswerte an Gitterpunkten
a = 0.25
b = 0.85
example_t = 0.35

# Normierte Position zwischen a und b
t = [i / 299 for i in range(300)]

# Lineare Interpolation
v_linear = [(1 - x) * a + x * b for x in t]

# Geglättetes t
s = [x**2 * (3 - 2 * x) for x in t]

# Interpolation mit geglättetem t
v_smooth = [(1 - x) * a + x * b for x in s]

example_s = example_t**2 * (3 - 2 * example_t)
example_linear = (1 - example_t) * a + example_t * b
example_smooth = (1 - example_s) * a + example_s * b

fig, (ax, text_ax) = plt.subplots(
    1,
    2,
    figsize=(12, 5.2),
    gridspec_kw={"width_ratios": [1.35, 1]},
)

ax.plot(t, v_linear, label="linear: v(t)", linewidth=2.5, color="#2563eb")
ax.plot(t, v_smooth, label="geglättet: v(s(t))", linewidth=2.5, color="#dc2626")

ax.scatter([0, 1], [a, b], color="black", zorder=5)
ax.text(0.06, a - 0.07, "a = 0.25", ha="center", fontsize=11)
ax.text(0.92, b + 0.04, "b = 0.85", ha="center", fontsize=11)

ax.scatter([example_t], [example_linear], color="#2563eb", zorder=6)
ax.scatter([example_t], [example_smooth], color="#dc2626", zorder=6)
ax.vlines(
    example_t,
    ymin=0,
    ymax=max(example_linear, example_smooth),
    color="#6b7280",
    linestyle="--",
    linewidth=1.2,
)
ax.text(
    example_t + 0.025,
    0.06,
    f"t = {example_t:.2f}",
    color="#374151",
    fontsize=10,
)

ax.annotate(
    f"v(t) = {example_linear:.2f}",
    xy=(example_t, example_linear),
    xytext=(example_t - 0.08, example_linear + 0.12),
    arrowprops={"arrowstyle": "->", "color": "#2563eb"},
    color="#2563eb",
    fontsize=10,
)
ax.annotate(
    f"v(s(t)) = {example_smooth:.2f}",
    xy=(example_t, example_smooth),
    xytext=(example_t + 0.08, example_smooth - 0.08),
    arrowprops={"arrowstyle": "->", "color": "#dc2626"},
    color="#dc2626",
    fontsize=10,
)

ax.set_title("1D Value Noise: Wirkung von linearer und geglätteter Interpolation")
ax.set_xlabel("t: normierte Position zwischen zwei Gitterpunkten")
ax.set_ylabel("interpolierter Wert")
ax.set_xlim(-0.03, 1.03)
ax.set_ylim(0, 1)
ax.grid(True, alpha=0.3)
ax.legend(loc="upper left")

text_ax.axis("off")
formula_text = (
    "Formeln und Beispielrechnung\n\n"
    r"$\mathbf{v(t) = (1 - t)\cdot a + t\cdot b}$"
    "\n\n"
    "Beispiel mit a = 0.25, b = 0.85, t = 0.35:\n"
    "\n"
    r"$v(0.35) = (1 - 0.35)\cdot 0.25 + 0.35\cdot 0.85$"
    f"\n= {example_linear:.3f}\n\n"
    
    r"$\mathbf{s(t) = t^2(3 - 2t)}$"
    "\n\n"
    r"$s(0.35) = 0.35^2(3 - 2\cdot 0.35)$"
    f"\n= {example_s:.3f}\n\n"
    r"$\mathbf{Einsetzen\ von\ s(t)\ statt\ t:}$"
    "\n"
    r"$v(s) = (1 - s)\cdot a + s\cdot b$"
    "\n"
    f"= (1 - {example_s:.3f}) * 0.25 + {example_s:.3f} * 0.85\n"
    f"= {example_smooth:.3f}\n\n"
    "Die geglättete Kurve startet und endet flacher.\n"
    "Dadurch wirken Übergänge an Gitterpunkten weniger abrupt."
)
text_ax.text(
    0,
    1,
    formula_text,
    va="top",
    ha="left",
    fontsize=11,
    linespacing=1.45,
    bbox={
        "boxstyle": "round,pad=0.7",
        "facecolor": "#f8fafc",
        "edgecolor": "#d1d5db",
    },
)

plt.tight_layout()
plt.savefig("value_noise_interpolation_1d.png", dpi=200, bbox_inches="tight")
plt.show()
