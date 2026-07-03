function mulberry32Value(a) {
  return function () {
    let t = a += 0x6D2B79F5
    t = Math.imul(t ^ t >>> 15, t | 1)
    t ^= t + Math.imul(t ^ t >>> 7, t | 61)
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

function fadeValue(t) {
  return t * t * (3 - 2 * t)
}

function lerpValue(a, b, t) {
  return a * (1 - t) + b * t
}

function buildValueGrid(gridWidth, gridHeight, rng) {
  const grid = []

  for (let y = 0; y < gridHeight; y++) {
    const row = []
    for (let x = 0; x < gridWidth; x++) {
      row.push(rng())
    }
    grid.push(row)
  }

  return grid
}

function sampleValueNoise(x, y, grid, cellSize) {
  const gx = x / cellSize
  const gy = y / cellSize

  const x0 = Math.floor(gx)
  const y0 = Math.floor(gy)
  const x1 = Math.min(x0 + 1, grid[0].length - 1)
  const y1 = Math.min(y0 + 1, grid.length - 1)

  const tx = fadeValue(gx - x0)
  const ty = fadeValue(gy - y0)

  const v00 = grid[y0][x0]
  const v10 = grid[y0][x1]
  const v01 = grid[y1][x0]
  const v11 = grid[y1][x1]

  const ix0 = lerpValue(v00, v10, tx)
  const ix1 = lerpValue(v01, v11, tx)

  return lerpValue(ix0, ix1, ty)
}

function renderValueNoise(seed) {
  const canvas = document.getElementById("noise-canvas-val")
  const info = document.getElementById("noise-info-val")
  const error = document.getElementById("noise-error-val")

  if (!canvas) {
    return
  }

  const ctx = canvas.getContext("2d")
  const width = canvas.width
  const height = canvas.height

  const cellSize = 32
  const gridWidth = Math.ceil(width / cellSize) + 1
  const gridHeight = Math.ceil(height / cellSize) + 1

  const rng = mulberry32Value(seed)
  const grid = buildValueGrid(gridWidth, gridHeight, rng)

  const imageData = ctx.createImageData(width, height)
  const data = imageData.data

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const value = sampleValueNoise(x, y, grid, cellSize)
      const gray = Math.floor(value * 255)

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
    info.textContent = `Seed: ${seed} | Größe: ${width} x ${height} Pixel`
  }
}

function parseValueSeed(value) {
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

document.addEventListener("DOMContentLoaded", function () {
  const input = document.getElementById("seed-input-val")
  const button = document.getElementById("generate-noise-val")
  const error = document.getElementById("noise-error-val")

  if (!input || !button) {
    return
  }

  function handleGenerate() {
      const seed = parseValueSeed(input.value)

      if (seed === null) {
        if (error) {
          error.textContent = "Bitte gib eine ganze numerische Zahl als Seed ein."
        }
        return
      }

      renderValueNoise(seed)
    }

  button.addEventListener("click", handleGenerate)

  input.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      handleGenerate()
    }
  })

  handleGenerate()
})