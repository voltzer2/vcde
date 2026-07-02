const HEIGHT_CURVE_COLORS = {
  background: "#f8fafc",
  axis: "#57606a",
  grid: "#e6ebf0",
  curve: "#0969da",
  text: "#24292f",
  muted: "#57606a",
}

const PLOT_PADDING = {
  left: 70,
  right: 30,
  top: 30,
  bottom: 70,
}

function readHeightCurveParams() {
  return {
    baseHeight: Number(document.getElementById("height-curve-base").value),
    maximumHeight: Number(document.getElementById("height-curve-maximum").value),
    heightCurveExponent: Number(document.getElementById("height-curve-exponent").value),
    heightLevel: Number(document.getElementById("height-curve-level").value),
  }
}

function updateHeightCurveValueDisplays(params) {
  const displays = {
    "height-curve-base-value": params.baseHeight.toFixed(2),
    "height-curve-maximum-value": params.maximumHeight.toFixed(2),
    "height-curve-exponent-value": params.heightCurveExponent.toFixed(1),
    "height-curve-level-value": params.heightLevel.toFixed(2),
  }

  for (const [id, text] of Object.entries(displays)) {
    const element = document.getElementById(id)
    if (element) {
      element.textContent = text
    }
  }
}

function enforceHeightCurveConstraints(changedId) {
  const baseSlider = document.getElementById("height-curve-base")
  const maxSlider = document.getElementById("height-curve-maximum")
  if (!baseSlider || !maxSlider) {
    return
  }

  let baseHeight = Number(baseSlider.value)
  let maximumHeight = Number(maxSlider.value)
  const maxStep = Number(maxSlider.step) || 0.1

  if (maximumHeight <= baseHeight) {
    if (changedId === "height-curve-base") {
      maximumHeight = Math.min(Number(maxSlider.max), baseHeight + maxStep)
      maxSlider.value = String(maximumHeight)
      maxSlider.setAttribute("value", String(maximumHeight))
    } else {
      baseHeight = Math.max(Number(baseSlider.min), maximumHeight - maxStep)
      baseSlider.value = String(baseHeight)
      baseSlider.setAttribute("value", String(baseHeight))
    }
  }
}

function mapX(n, plotLeft, plotWidth) {
  return plotLeft + n * plotWidth
}

function mapY(y, yMin, yMax, plotTop, plotHeight) {
  const range = Math.max(yMax - yMin, 1e-4)
  return plotTop + plotHeight - ((y - yMin) / range) * plotHeight
}

function formatAxisValue(value) {
  if (Number.isInteger(value)) {
    return String(value)
  }

  return value.toFixed(1)
}

function renderHeightCurve() {
  const canvas = document.getElementById("height-curve-canvas")
  if (!canvas) {
    return
  }

  const params = readHeightCurveParams()
  updateHeightCurveValueDisplays(params)

  const ctx = canvas.getContext("2d")
  const width = canvas.width
  const height = canvas.height
  const plotLeft = PLOT_PADDING.left
  const plotTop = PLOT_PADDING.top
  const plotWidth = width - PLOT_PADDING.left - PLOT_PADDING.right
  const plotHeight = height - PLOT_PADDING.top - PLOT_PADDING.bottom
  const plotBottom = plotTop + plotHeight
  const plotRight = plotLeft + plotWidth
  const yMin = params.baseHeight
  const yMax = params.maximumHeight

  ctx.clearRect(0, 0, width, height)
  ctx.fillStyle = HEIGHT_CURVE_COLORS.background
  ctx.fillRect(0, 0, width, height)

  ctx.strokeStyle = HEIGHT_CURVE_COLORS.grid
  ctx.lineWidth = 1
  for (let i = 1; i < 4; i++) {
    const gridX = plotLeft + (plotWidth * i) / 4
    const gridY = plotTop + (plotHeight * i) / 4
    ctx.beginPath()
    ctx.moveTo(gridX, plotTop)
    ctx.lineTo(gridX, plotBottom)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(plotLeft, gridY)
    ctx.lineTo(plotRight, gridY)
    ctx.stroke()
  }

  ctx.strokeStyle = HEIGHT_CURVE_COLORS.axis
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(plotLeft, plotTop)
  ctx.lineTo(plotLeft, plotBottom)
  ctx.lineTo(plotRight, plotBottom)
  ctx.stroke()

  ctx.fillStyle = HEIGHT_CURVE_COLORS.muted
  ctx.font = "11px Segoe UI, sans-serif"
  ctx.textAlign = "right"
  ctx.textBaseline = "middle"
  ctx.fillText(formatAxisValue(yMin), plotLeft - 8, plotBottom)
  ctx.fillText(formatAxisValue(yMax), plotLeft - 8, plotTop)
  ctx.textAlign = "center"
  ctx.textBaseline = "top"
  ctx.fillText("0", plotLeft, plotBottom + 6)
  ctx.fillText("1", plotRight, plotBottom + 6)

  ctx.fillStyle = HEIGHT_CURVE_COLORS.text
  ctx.font = "13px Segoe UI, sans-serif"
  ctx.textAlign = "center"
  ctx.textBaseline = "top"
  ctx.fillText("normalisierter Noise-Wert v", plotLeft + plotWidth / 2, plotBottom + 18)

  ctx.save()
  ctx.translate(22, plotTop + plotHeight / 2)
  ctx.rotate(-Math.PI / 2)
  ctx.textAlign = "center"
  ctx.textBaseline = "top"
  ctx.fillText("Höhe H(v)", 0, 0)
  ctx.restore()

  ctx.strokeStyle = HEIGHT_CURVE_COLORS.curve
  ctx.lineWidth = 2.5
  ctx.lineCap = "round"
  ctx.lineJoin = "round"
  ctx.beginPath()

  const steps = 200
  for (let i = 0; i <= steps; i++) {
    const n = i / steps
    const y = sampleTerrainHeight(
      n,
      params.baseHeight,
      params.maximumHeight,
      params.heightCurveExponent,
      params.heightLevel
    )
    const x = mapX(n, plotLeft, plotWidth)
    const plotY = mapY(y, yMin, yMax, plotTop, plotHeight)

    if (i === 0) {
      ctx.moveTo(x, plotY)
    } else {
      ctx.lineTo(x, plotY)
    }
  }

  ctx.stroke()
}

function bindHeightCurveControls() {
  const sliderIds = [
    "height-curve-base",
    "height-curve-maximum",
    "height-curve-exponent",
    "height-curve-level",
  ]

  for (const id of sliderIds) {
    const slider = document.getElementById(id)
    if (!slider) {
      continue
    }

    slider.addEventListener("input", function () {
      enforceHeightCurveConstraints(id)
      renderHeightCurve()
    })
  }
}

document.addEventListener("DOMContentLoaded", function () {
  bindHeightCurveControls()
  renderHeightCurve()
})
