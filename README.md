# Gruppe 4: Tobias Gschnell, Julian Peterhansl, Andrei Radulescu
## Prozedurale Grafik-Generierung - Vom Seed zur Terrain-Landschaft

## Arbeitsbeiträge Website (Jeweils komplett):
### Julian Peterhansl
1 Einführung
2 Hintergrund
3 Interaktive prozedurale Terrain-Generierung
3.1 Relevante Noise-Verfahren für Terrain-Generierung
3.1.1 - 3.1.3 Value-, Perin-, FBM-Noise

### Tobias Gschnell
3.2 Terrain-Generierung aus Noise Maps
3.2.1 Einleitung
3.2.2 Von der Noise-Map zur Höhe
3.2.3 Verfahren auf der CPU
3.2.4 Verfahren auf der GPU
3.2.5 Zusammenfassung der Verfahren

### Andrei Radulescu
3.3 Terrain Texturierung mit Texture Maps und Texture Algorithmen
3.4 Rolle des Fragment-Shaders in der Terrain-Texturierung
3.5 Visuelle Darstellung der Terrain Texturierung
4 Fazit
5 Ausblick


## Enthaltene Dateien

- `_quarto.yml` Projektkonfiguration für die Website
- `index.qmd` Startseite mit der von dir vorgegebenen Feinstruktur
- `styles.css` sehr einfache Basisstyles
- Ordner `images` mit referenzierten Bildern, `interactive` mit den Demo-Funktionen (und deren Loadern)
- Ordner `Abgabe_praesentation_Gruppe4` mit der Powerpoint-Präsentation
- Python-Skripts zur Erzeugung von verwendeten Grafiken:
    - `generate_assets_computeshader.py`
    - `generate_assets_fbmnoise.py`
    - `generate_assets_perlinnoise.py`
    - `generate_assets_terrain.py`
    - `generate_assets_valuenoise.py`
    - `generate_assets.py`


## Voraussetzungen zum Bauen und Starten der Website

| Abhängigkeit                                                        | Zweck                                        |
| ------------------------------------------------------------------- | -------------------------------------------- |
| [Quarto](https://quarto.org/docs/get-started/) (getestet mit 1.9.x) | Rendern und lokale Vorschau der Website      |
| Browser der **WebGL** unterstützt                                   | Anzeige der Seite mit interaktiven Elementen |

### Internetverbindung (beim Anzeigen der Seite)

Eine aktive Internetverbindung ist **für die interaktiven Demos und Formeln erforderlich**, da externe Ressourcen per CDN geladen werden:

- **Babylon.js** (`cdn.babylonjs.com`) — Interaktiven Elementen
- **MathJax** (`cdn.jsdelivr.net`) — Darstellung der mathematischen Formeln

###  Neu-Erzeugen von Grafiken

Zum Ausführen von python_skrips:

- Python 3.10+
- Python-Pakete: `numpy`, `matplotlib`, `Pillow`

Installation der Pakete (pip):

```bash
pip install numpy matplotlib pillow
```

Installation der Pakete (uv):

```bash
uv sync
```

Grafiken neu erzeugen:

```bash
python <Name des Sktips>
```

Die Ausgabe landet im Ordner `images/`.


## Projekt lokal starten

Im Projektordner ausführen:

```bash
quarto preview
```

## Website bauen

```bash
quarto render
```

## Bildquellen

In **Kapitel 3.2** (`index.qmd`) werden ausschließlich **12 Bilddateien** verwendet. Sie stammen entweder aus dem Skript `generate_assets_terrain.py` oder sind **eigene Screenshots** der interaktiven Demonstrationen auf der Website.

In **Kapitel 1, 2, 3 und 5** (`index.qmd`) werden externe Bildinhalte eingepflegt aus
- https://dl.acm.org/doi/10.1145/325334.325247
- https://scispace.com/pdf/the-algorithmic-beauty-of-plants-4f9yunhil9.pdf
- https://vectrx.substack.com/p/wave-function-collapse
- https://github.com/dandrino/terrain-erosion-3-ways
- https://www.mdpi.com/2079-9292/12/10/2229?utm_source=researchgate.net&utm_medium=article
- https://en.wikipedia.org/wiki/White_noise#/media/File:White-noise-mv255-240x180.png
- https://learnopengl.com/Guest-Articles/2021/Tessellation/Tessellation

Alle übrigen Grafiken stammen entweder aus dem Skripten  `images/generate_assets_***.py` oder sind **eigene Screenshots** der interaktiven Demonstrationen auf der Website.

