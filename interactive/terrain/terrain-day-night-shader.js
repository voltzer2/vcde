import { getShader } from "../utils/shader-factory.js"
import { ShaderTypes } from "../utils/shader-factory.js"

// Globale Datatable
window.terrainDayNightShaderStore = createTerrainStore()
registerTerrain("dayNightShader", window.terrainDayNightShaderStore)

// Global Babylon Variablen
let dayNightEngine = null
let dayNightScene = null
let dayNightCamera = null
let dayNightCanvas = null

let dayNightMesh = null
let dayNightWaterMesh = null
let dayNightHeightTexture = null

// TIME SYSTEM
let timeOfDay = 0
let startTime = performance.now()

// TOGGLE: DAY/NIGHT SYSTEM
let enableDayNightCycle = false

// TOGGLE: DAY/NIGHT SHADER ACTIVE
let dayNightShaderActive = false

// DAY/NIGHT SPEED: base and multiplier
const BASE_DAY_NIGHT_SPEED = 0.00010
let dayNightSpeedMultiplier = 1.0
let dayNightSpeed = BASE_DAY_NIGHT_SPEED * dayNightSpeedMultiplier


BABYLON.Effect.ShadersStore["terrainDayNightVertexShader"] = getShader(ShaderTypes.DISPLACEMENT)
BABYLON.Effect.ShadersStore["terrainDayNightFragmentShader"] = getShader(ShaderTypes.MIN)
// BABYLON.Effect.ShadersStore["terrainDayNightFragmentShader"] = getShader(ShaderTypes.EXAMPLE)

window.toggleDayNightShader = function () {
  dayNightShaderActive = !dayNightShaderActive

  if (dayNightShaderActive) {
    BABYLON.Effect.ShadersStore["terrainDayNightFragmentShader"] = getShader(ShaderTypes.DAYNIGHT)
  } else {
    BABYLON.Effect.ShadersStore["terrainDayNightFragmentShader"] = getShader(ShaderTypes.MIN)
  }

  if (dayNightMesh) {
    try {
      const options = {
        resolution: getDayNightResolutionValue(document.getElementById("day-night-shader-resolution-input")?.value ?? 128),
        baseHeight: Number(document.getElementById("day-night-shader-base-height-input")?.value ?? 0),
        maximumHeight: Number(document.getElementById("day-night-shader-maximum-height-input")?.value ?? 40),
        waterLevel: Number(document.getElementById("day-night-shader-water-level-input")?.value ?? 15),
        heightLevel: Number(document.getElementById("day-night-shader-height-level-input")?.value ?? 0.5),
        heightCurveExponent: Number(document.getElementById("day-night-shader-height-curve-input")?.value ?? 1.5),
        wireframe: document.getElementById("day-night-shader-wireframe-input")?.checked ?? false
      }

      buildDayNightTerrain(options)
    } catch (e) {
      console.warn("toggleDayNightShader: failed to rebuild terrain:", e)
    }
  }

  return dayNightShaderActive
}

window.isDayNightShaderActive = function () {
  return !!dayNightShaderActive
}

window.toggleDayNightCycle = function () {
  enableDayNightCycle = !enableDayNightCycle
  return enableDayNightCycle
}

window.isDayNightCycleEnabled = function () {
  return !!enableDayNightCycle
}

// Speed control
window.setDayNightSpeedMultiplier = function (multiplier) {
  const now = performance.now()
  const oldSpeed = dayNightSpeed
  const clamped = Math.max(0, Number(multiplier) || 0)

  // compute current phase
  let currentPhase = timeOfDay
  if (oldSpeed > 0) {
    currentPhase = ((now - startTime) * oldSpeed) % 1.0
  }

  dayNightSpeedMultiplier = clamped
  dayNightSpeed = BASE_DAY_NIGHT_SPEED * dayNightSpeedMultiplier

  // preserve phase: adjust startTime so that timeOfDay stays approximately the same
  if (dayNightSpeed > 0) {
    startTime = now - (currentPhase / dayNightSpeed)
  } else {
    // when speed is zero, freeze time; set startTime to now so future calculations don't advance
    startTime = now
    // keep timeOfDay as currentPhase
    timeOfDay = currentPhase
  }

  return dayNightSpeedMultiplier
}

window.getDayNightSpeedMultiplier = function () {
  return dayNightSpeedMultiplier
}

// Initialize scene
function initializeDayNightScene() {
  const result = createBabylonScene({
    canvasId: "day-night-shader-canvas",
    cameraName: "day-night-shader-camera",
    radius: WorldConfig.cameraRadius
  })

  if (!result) return

  dayNightCanvas = result.canvas
  dayNightEngine = result.engine
  dayNightScene = result.scene
  dayNightCamera = result.camera


  // RENDER LOOP
  dayNightEngine.runRenderLoop(() => {
    if (!dayNightScene) return

    const now = performance.now()

    // time always advances (use current speed)
    timeOfDay = ((now - startTime) * dayNightSpeed) % 1.0

    let lightDir

    // DAY/NIGHT TOGGLE LOGIC
    if (enableDayNightCycle) {

      const angle = timeOfDay * Math.PI * 2.0

      lightDir = new BABYLON.Vector3(
        Math.cos(angle),
        Math.sin(angle),
        -0.3
      ).normalize()

    } else {

      // STATIC LIGHT MODE
      lightDir = new BABYLON.Vector3(-0.5, -1.0, -0.3).normalize()
    }

    // SEND TO SHADER
    if (dayNightMesh?.material) {

      dayNightMesh.material.setVector3("lightDirection", lightDir)

      dayNightMesh.material.setFloat(
        "timeOfDay",
        enableDayNightCycle ? timeOfDay : 0.5
      )
    }

    dayNightScene.render()
  })
}


// Resolution helper
function getDayNightResolutionValue(value) {
  const parsed = Number(value)

  if (parsed === 64) return 64
  if (parsed === 128) return 128
  if (parsed === 256) return 256
  return 128
}


// Cleanup
function disposeDayNightMeshes() {
  if (dayNightMesh) {
    dayNightMesh.dispose()
    dayNightMesh = null
  }

  if (dayNightWaterMesh) {
    dayNightWaterMesh.dispose()
    dayNightWaterMesh = null
  }

  if (dayNightHeightTexture) {
    dayNightHeightTexture.dispose()
    dayNightHeightTexture = null
  }
}


// Water plane
function buildDayNightWaterPlane(size, waterLevel) {
  dayNightWaterMesh = BABYLON.MeshBuilder.CreateGround(
    "day-night-shader-water",
    {
      width: size,
      height: size,
      subdivisions: 1
    },
    dayNightScene
  )

  dayNightWaterMesh.position.y = waterLevel
  dayNightWaterMesh.material = createWaterMaterial(dayNightScene)
}


// Create the heightmap texture from the fBm Noise-Map (Upload to the GPU)
function createDayNightHeightTextureFromNoise(noiseData) {
  const width = noiseData.width
  const height = noiseData.height
  const values = noiseData.normalizedValues
  const data = new Uint8Array(width * height * 4)

  for (let i = 0; i < width * height; i++) {
    const gray = Math.round((values[i] ?? 0) * 255)
    const idx = i * 4

    data[idx] = gray
    data[idx + 1] = gray
    data[idx + 2] = gray
    data[idx + 3] = 255
  }

  return new BABYLON.RawTexture(
    data,
    width,
    height,
    BABYLON.Engine.TEXTUREFORMAT_RGBA,
    dayNightScene,
    false, // generateMipMaps
    false, // generateMipMaps
    BABYLON.Texture.BILINEAR_SAMPLINGMODE  // smooth interpolation between texels
  )
}


// Create the GPU-displaced terrain

function buildDayNightTerrain(options) {
  const noiseData = window.generatedNoiseMaps?.fbm

  if (!noiseData) {
    console.error("Keine fBm Noise-Map gefunden.")
    return
  }

  // Delete old meshes and textures
  disposeDayNightMeshes()

  const {
    resolution,
    baseHeight,
    maximumHeight,
    waterLevel,
    heightLevel,
    heightCurveExponent,
    wireframe
  } = options

  const WORLD_SIZE = WorldConfig.terrainSize

  // Flat mesh - the displacement happens on the GPU, not on the CPU
  dayNightMesh = BABYLON.MeshBuilder.CreateGround(
    "day-night-shader-terrain",
    {
      width: WORLD_SIZE,
      height: WORLD_SIZE,
      subdivisions: resolution - 1
    },
    dayNightScene
  )

  dayNightHeightTexture = createDayNightHeightTextureFromNoise(noiseData)

  const texelSize = 1 / noiseData.width
  const worldStep = WORLD_SIZE * texelSize

  const material = new BABYLON.ShaderMaterial(
    "day-night-shader-displace-material",
    dayNightScene,
    {
      vertex: "terrainDayNight",
      fragment: "terrainDayNight"
    },
    {
      attributes: ["position", "normal", "uv"],
      uniforms: [
        "world",
        "worldViewProjection",
        "baseHeight",
        "maximumHeight",
        "heightLevel",
        "heightCurveExponent",
        "texelSize",
        "worldStep",
        "lightDirection",
        "timeOfDay"
      ],
      samplers: ["heightMap"]
    }
  )

  material.setTexture("heightMap", dayNightHeightTexture)

  material.setFloat("baseHeight", baseHeight)
  material.setFloat("maximumHeight", maximumHeight)
  material.setFloat("heightLevel", heightLevel)
  material.setFloat("heightCurveExponent", heightCurveExponent)
  material.setFloat("texelSize", texelSize)
  material.setFloat("worldStep", worldStep)

  material.setFloat("timeOfDay", timeOfDay)

  material.setVector3(
    "lightDirection",
    new BABYLON.Vector3(-0.5, -1.0, -0.3)
  )

  material.wireframe = wireframe

  dayNightMesh.material = material

  buildDayNightWaterPlane(WORLD_SIZE, waterLevel)
}


// Regenerate terrain
function regenerateDayNightTerrain() {
  const options = {
    resolution: getDayNightResolutionValue(document.getElementById("day-night-shader-resolution-input").value),
    baseHeight: Number(document.getElementById("day-night-shader-base-height-input").value),
    maximumHeight: Number(document.getElementById("day-night-shader-maximum-height-input").value),
    waterLevel: Number(document.getElementById("day-night-shader-water-level-input").value),
    heightLevel: Number(document.getElementById("day-night-shader-height-level-input").value),
    heightCurveExponent: Number(document.getElementById("day-night-shader-height-curve-input").value),
    wireframe: document.getElementById("day-night-shader-wireframe-input").checked
  }

  buildDayNightTerrain(options)
}


// Init
document.addEventListener("DOMContentLoaded", () => {
  initializeDayNightScene()

  const generateButton = document.getElementById("generate-day-night-shader-terrain")

  if (!generateButton) return

  generateButton.addEventListener("click", () => {
    generateButton.disabled = true
    generateButton.textContent = "Terrain wird generiert..."

    setTimeout(() => {
      regenerateDayNightTerrain()

      generateButton.disabled = false
      generateButton.textContent = "Terrain generieren"
    }, 10)
  })
})
