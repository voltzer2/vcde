function mulberry32Perlin(a) {
  return function () {
    let t = a += 0x6D2B79F5
    t = Math.imul(t ^ t >>> 15, t | 1)
    t ^= t + Math.imul(t ^ t >>> 7, t | 61)
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

function fadePerlin(t) {
  return t * t * t * (t * (t * 6 - 15) + 10)
}

function lerpPerlin(a, b, t) {
  return a * (1 - t) + b * t
}

function randomGradient(rng) {
  const angle = rng() * Math.PI * 2
  return {
    x: Math.cos(angle),
    y: Math.sin(angle)
  }
}

function buildGradientGrid(gridWidth, gridHeight, rng) {
  const grid = []

  for (let y = 0; y < gridHeight; y++) {
    const row = []
    for (let x = 0; x < gridWidth; x++) {
      row.push(randomGradient(rng))
    }
    grid.push(row)
  }

  return grid
}

function dotGridGradient(ix, iy, x, y, grid) {
  const gradient = grid[iy][ix]

  const dx = x - ix
  const dy = y - iy

  return dx * gradient.x + dy * gradient.y
}

function samplePerlinNoise(x, y, grid, frequency) {
  const gx = x * frequency
  const gy = y * frequency

  const x0 = Math.floor(gx)
  const y0 = Math.floor(gy)
  const x1 = Math.min(x0 + 1, grid[0].length - 1)
  const y1 = Math.min(y0 + 1, grid.length - 1)

  const sx = fadePerlin(gx - x0)
  const sy = fadePerlin(gy - y0)

  const n00 = dotGridGradient(x0, y0, gx, gy, grid)
  const n10 = dotGridGradient(x1, y0, gx, gy, grid)
  const n01 = dotGridGradient(x0, y1, gx, gy, grid)
  const n11 = dotGridGradient(x1, y1, gx, gy, grid)

  const ix0 = lerpPerlin(n00, n10, sx)
  const ix1 = lerpPerlin(n01, n11, sx)
  const value = lerpPerlin(ix0, ix1, sy)

  return value
}

function renderPerlinNoise(seed, frequency) {
  const canvas = document.getElementById("noise-canvas-per")
  const info = document.getElementById("noise-info-per")
  const error = document.getElementById("noise-error-per")

  if (!canvas) {
    return
  }

  const ctx = canvas.getContext("2d")
  const width = canvas.width
  const height = canvas.height

  const gridWidth = Math.ceil(width * frequency) + 2
  const gridHeight = Math.ceil(height * frequency) + 2

  const rng = mulberry32Perlin(seed)
  const grid = buildGradientGrid(gridWidth, gridHeight, rng)

  const imageData = ctx.createImageData(width, height)
  const data = imageData.data

  let minValue = Infinity
  let maxValue = -Infinity
  const values = new Array(width * height)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const value = samplePerlinNoise(x, y, grid, frequency)
      values[y * width + x] = value

      if (value < minValue) {
        minValue = value
      }

      if (value > maxValue) {
        maxValue = value
      }
    }
  }

  const range = maxValue - minValue || 1

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const value = values[y * width + x]
      const normalized = (value - minValue) / range
      const gray = Math.floor(normalized * 255)

      const idx = (y * width + x) * 4
      data[idx] = gray
      data[idx + 1] = gray
      data[idx + 2] = gray
      data[idx + 3] = 255
    }
  }

  ctx.putImageData(imageData, 0, 0)

  if (error) {
    error.textContent = ""
  }

  if (info) {
    info.textContent = `Seed: ${seed} | Frequenz: ${frequency} | Größe: ${width} x ${height} Pixel`
  }
}

function parsePerlinSeed(value) {
  if (value === "" || value === null || value === undefined) {
    return null
  }

  const seed = Number(value)

  if (!Number.isInteger(seed)) {
    return null
  }

  if (!Number.isFinite(seed)) {
    return null
  }

  return seed >>> 0
}

function parseFrequency(value) {
  if (value === "" || value === null || value === undefined) {
    return null
  }

  const frequency = Number(value)

  if (!Number.isFinite(frequency)) {
    return null
  }

  if (frequency <= 0) {
    return null
  }

  return frequency
}

document.addEventListener("DOMContentLoaded", function () {
  const seedInput = document.getElementById("seed-input-per")
  const frequencyInput = document.getElementById("frequency-input-per")
  const button = document.getElementById("generate-noise-per")
  const error = document.getElementById("noise-error-per")

  if (!seedInput || !frequencyInput || !button) {
    return
  }

  function handleGenerate() {
      const seed = parsePerlinSeed(seedInput.value)
      const frequency = parseFrequency(frequencyInput.value)

      if (seed === null) {
        if (error) {
          error.textContent = "Bitte gib eine ganze numerische Zahl als Seed ein."
        }
        return
      }

      if (frequency === null) {
        if (error) {
          error.textContent = "Bitte gib eine positive numerische Frequenz ein."
        }
        return
      }

      renderPerlinNoise(seed, frequency)
    }

  button.addEventListener("click", handleGenerate)

  seedInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      handleGenerate()
    }
  })

  frequencyInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      handleGenerate()
    }
  })

  handleGenerate()
})