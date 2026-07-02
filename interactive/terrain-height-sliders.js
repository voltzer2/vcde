function formatTerrainSliderValue(input, value) {
  const step = Number(input.step) || 1
  if (step < 1) {
    return value.toFixed(2)
  }

  if (step < 0.11) {
    return value.toFixed(1)
  }

  return String(Math.round(value))
}

function syncRangeInputValue(input, value) {
  const normalized = String(value)
  if (input.value !== normalized) {
    input.value = normalized
  }
  input.setAttribute("value", normalized)
}

function updateSliderValueDisplay(input) {
  if (!input) {
    return
  }

  const valueId = input.id.replace("-input", "-value")
  const valueDisplay = document.getElementById(valueId)
  if (valueDisplay) {
    valueDisplay.textContent = formatTerrainSliderValue(input, Number(input.value))
  }
}

function enforceTerrainHeightConstraints(baseInput, maxInput, changedId) {
  if (!baseInput || !maxInput) {
    return
  }

  let baseHeight = Number(baseInput.value)
  let maximumHeight = Number(maxInput.value)
  const maxStep = Number(maxInput.step) || 1

  if (maximumHeight <= baseHeight) {
    if (changedId === baseInput.id) {
      maximumHeight = Math.min(Number(maxInput.max), baseHeight + maxStep)
      syncRangeInputValue(maxInput, maximumHeight)
    } else {
      baseHeight = Math.max(Number(baseInput.min), maximumHeight - maxStep)
      syncRangeInputValue(baseInput, baseHeight)
    }
  }
}

function bindTerrainHeightSliderGroup(prefix) {
  const baseInput = document.getElementById(`${prefix}-base-height-input`)
  const maxInput = document.getElementById(`${prefix}-maximum-height-input`)
  const curveInput = document.getElementById(`${prefix}-height-curve-input`)
  const levelInput = document.getElementById(`${prefix}-height-level-input`)

  const inputs = [baseInput, maxInput, curveInput, levelInput].filter(Boolean)

  for (const input of inputs) {
    const updateDisplay = () => {
      if (baseInput && maxInput) {
        enforceTerrainHeightConstraints(baseInput, maxInput, input.id)
        updateSliderValueDisplay(baseInput)
        updateSliderValueDisplay(maxInput)
      }

      updateSliderValueDisplay(input)
    }

    input.addEventListener("input", updateDisplay)
    updateDisplay()
  }
}

function bindWaterLevelSlider(prefix) {
  const waterInput = document.getElementById(`${prefix}-water-level-input`)
  if (!waterInput) {
    return
  }

  const updateDisplay = () => updateSliderValueDisplay(waterInput)

  waterInput.addEventListener("input", updateDisplay)
  updateDisplay()
}

document.addEventListener("DOMContentLoaded", function () {
  bindTerrainHeightSliderGroup("terrain")
  bindTerrainHeightSliderGroup("voxel")
  bindTerrainHeightSliderGroup("vertex-shader")
  bindTerrainHeightSliderGroup("day-night-shader")

  bindWaterLevelSlider("terrain")
  bindWaterLevelSlider("voxel")
  bindWaterLevelSlider("vertex-shader")
  bindWaterLevelSlider("day-night-shader")
})
