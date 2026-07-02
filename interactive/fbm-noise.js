function mulberry32Fbm(a) {
  return function () {
    let t = a += 0x6D2B79F5
    t = Math.imul(t ^ t >>> 15, t | 1)
    t ^= t + Math.imul(t ^ t >>> 7, t | 61)
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

function fadeFbm(t) {
  return t * t * t * (t * (t * 6 - 15) + 10)
}

function lerpFbm(a, b, t) {
  return a * (1 - t) + b * t
}

function randomGradientFbm(rng) {
  const angle = rng() * Math.PI * 2
  return {
    x: Math.cos(angle),
    y: Math.sin(angle)
  }
}

function buildGradientGridFbm(gridWidth, gridHeight, rng) {
  const grid = []

  for (let y = 0; y < gridHeight; y++) {
    const row = []
    for (let x = 0; x < gridWidth; x++) {
      row.push(randomGradientFbm(rng))
    }
    grid.push(row)
  }

  return grid
}

function dotGridGradientFbm(ix, iy, x, y, grid) {
  const gradient = grid[iy][ix]

  const dx = x - ix
  const dy = y - iy

  return dx * gradient.x + dy * gradient.y
}

function samplePerlinNoiseFbm(x, y, grid, frequency) {
  const gx = x * frequency
  const gy = y * frequency

  const x0 = Math.floor(gx)
  const y0 = Math.floor(gy)
  const x1 = Math.min(x0 + 1, grid[0].length - 1)
  const y1 = Math.min(y0 + 1, grid.length - 1)

  const sx = fadeFbm(gx - x0)
  const sy = fadeFbm(gy - y0)

  const n00 = dotGridGradientFbm(x0, y0, gx, gy, grid)
  const n10 = dotGridGradientFbm(x1, y0, gx, gy, grid)
  const n01 = dotGridGradientFbm(x0, y1, gx, gy, grid)
  const n11 = dotGridGradientFbm(x1, y1, gx, gy, grid)

  const ix0 = lerpFbm(n00, n10, sx)
  const ix1 = lerpFbm(n01, n11, sx)

  return lerpFbm(ix0, ix1, sy)
}

function buildOctaveGridsFbm(seed, octaves, width, height, baseFrequency, lacunarity) {
  const octaveGrids = []

  for (let i = 0; i < octaves; i++) {
    const octaveFrequency = baseFrequency * Math.pow(lacunarity, i)
    const gridWidth = Math.ceil(width * octaveFrequency) + 2
    const gridHeight = Math.ceil(height * octaveFrequency) + 2
    const rng = mulberry32Fbm((seed + i) >>> 0)
    const grid = buildGradientGridFbm(gridWidth, gridHeight, rng)

    octaveGrids.push({
      grid,
      frequency: octaveFrequency
    })
  }

  return octaveGrids
}

function sampleFbmNoise(x, y, octaveGrids, gain) {
  let total = 0
  let amplitude = 1
  let amplitudeSum = 0

  for (let i = 0; i < octaveGrids.length; i++) {
    const octave = octaveGrids[i]
    const value = samplePerlinNoiseFbm(x, y, octave.grid, octave.frequency)

    total += value * amplitude
    amplitudeSum += amplitude
    amplitude *= gain
  }

  if (amplitudeSum === 0) {
    return 0
  }

  return total / amplitudeSum
}

function renderFbmNoise(seed, frequency, octaves, lacunarity, gain) {
  const canvas = document.getElementById("noise-canvas-fbm")
  const info = document.getElementById("noise-info-fbm")
  const error = document.getElementById("noise-error-fbm")

  if (!canvas) {
    return
  }

  const ctx = canvas.getContext("2d")
  const width = canvas.width
  const height = canvas.height

  const octaveGrids = buildOctaveGridsFbm(
    seed,
    octaves,
    width,
    height,
    frequency,
    lacunarity
  )

  const imageData = ctx.createImageData(width, height)
  const data = imageData.data

  let minValue = Infinity
  let maxValue = -Infinity
  const values = new Array(width * height)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const value = sampleFbmNoise(x, y, octaveGrids, gain)
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
  const normalizedValues = new Array(width * height)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const value = values[y * width + x]
      const normalized = (value - minValue) / range
      normalizedValues[y * width + x] = normalized

      const gray = Math.floor(normalized * 255)
      const idx = (y * width + x) * 4

      data[idx] = gray
      data[idx + 1] = gray
      data[idx + 2] = gray
      data[idx + 3] = 255
    }
  }

  ctx.putImageData(imageData, 0, 0)

  window.generatedNoiseMaps = window.generatedNoiseMaps || {}
  window.generatedNoiseMaps.fbm = {
    seed,
    frequency,
    octaves,
    lacunarity,
    gain,
    width,
    height,
    rawValues: values,
    normalizedValues,
    octaveGrids
  }

  if (error) {
    error.textContent = ""
  }

  if (info) {
    info.textContent = `Seed: ${seed} | Frequenz: ${frequency} | Octaves: ${octaves} | Lacunarity: ${lacunarity} | Gain: ${gain} | Größe: ${width} x ${height} Pixel`
  }
}

function parseFbmSeed(value) {
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

function parseFbmFrequency(value) {
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

function parseFbmOctaves(value) {
  if (value === "" || value === null || value === undefined) {
    return null
  }

  const octaves = Number(value)

  if (!Number.isInteger(octaves)) {
    return null
  }

  if (!Number.isFinite(octaves)) {
    return null
  }

  if (octaves < 1) {
    return null
  }

  return octaves
}

function parseFbmLacunarity(value) {
  if (value === "" || value === null || value === undefined) {
    return null
  }

  const lacunarity = Number(value)

  if (!Number.isFinite(lacunarity)) {
    return null
  }

  if (lacunarity <= 0) {
    return null
  }

  return lacunarity
}

function parseFbmGain(value) {
  if (value === "" || value === null || value === undefined) {
    return null
  }

  const gain = Number(value)

  if (!Number.isFinite(gain)) {
    return null
  }

  if (gain <= 0) {
    return null
  }

  return gain
}

document.addEventListener("DOMContentLoaded", function () {
  const seedInput = document.getElementById("seed-input-fbm")
  const frequencyInput = document.getElementById("frequency-input-fbm")
  const octavesInput = document.getElementById("octaves-input-fbm")
  const lacunarityInput = document.getElementById("lacunarity-input-fbm")
  const gainInput = document.getElementById("gain-input-fbm")
  const button = document.getElementById("generate-noise-fbm")
  const error = document.getElementById("noise-error-fbm")

  if (
    !seedInput ||
    !frequencyInput ||
    !octavesInput ||
    !lacunarityInput ||
    !gainInput ||
    !button
  ) {
    return
  }

  function handleGenerateFbm() {
    const seed = parseFbmSeed(seedInput.value)
    const frequency = parseFbmFrequency(frequencyInput.value)
    const octaves = parseFbmOctaves(octavesInput.value)
    const lacunarity = parseFbmLacunarity(lacunarityInput.value)
    const gain = parseFbmGain(gainInput.value)

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

    if (octaves === null) {
      if (error) {
        error.textContent = "Bitte gib eine positive ganze Zahl für Octaves ein."
      }
      return
    }

    if (lacunarity === null) {
      if (error) {
        error.textContent = "Bitte gib eine positive numerische Lacunarity ein."
      }
      return
    }

    if (gain === null) {
      if (error) {
        error.textContent = "Bitte gib einen positiven numerischen Gain ein."
      }
      return
    }

    renderFbmNoise(seed, frequency, octaves, lacunarity, gain)
  }

  button.addEventListener("click", handleGenerateFbm)

  seedInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      handleGenerateFbm()
    }
  })

  frequencyInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      handleGenerateFbm()
    }
  })

  octavesInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      handleGenerateFbm()
    }
  })

  lacunarityInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      handleGenerateFbm()
    }
  })

  gainInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      handleGenerateFbm()
    }
  })

  handleGenerateFbm()
})