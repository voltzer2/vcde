const HEIGHT_LEVEL_EPSILON = 1e-4

function clampHeightLevel(heightLevel) {
  return Math.min(1 - HEIGHT_LEVEL_EPSILON, Math.max(HEIGHT_LEVEL_EPSILON, heightLevel))
}

function clampNormalizedValue(value) {
  return Math.max(0, Math.min(1, value))
}

function heightFunctionSigmoidFraction(normalizedValue, heightCurveExponent, heightLevel) {
  const v = clampNormalizedValue(normalizedValue)
  const k = Math.max(HEIGHT_LEVEL_EPSILON, heightCurveExponent)
  const level = clampHeightLevel(heightLevel)

  if (v <= 0) {
    return 0
  }

  if (v >= 1) {
    return 1
  }

  const vk = Math.pow(v, k)
  const oneMinusVk = Math.pow(1 - v, k)
  const levelRatio = (1 - level) / level
  const denominator = vk + levelRatio * oneMinusVk

  if (denominator <= 0) {
    return v >= 0.5 ? 1 : 0
  }

  return vk / denominator
}

function heightFunction(
  normalizedValue,
  baseHeight,
  maximumHeight,
  heightCurveExponent,
  heightLevel
) {
  const safeBase = Math.max(0, baseHeight)
  const safeMax = Math.max(safeBase + HEIGHT_LEVEL_EPSILON, maximumHeight)
  const fraction = heightFunctionSigmoidFraction(
    normalizedValue,
    heightCurveExponent,
    heightLevel
  )

  return safeBase + (safeMax - safeBase) * fraction
}
