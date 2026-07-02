import { getShader } from "../utils/shader-factory.js"
import { ShaderTypes } from "../utils/shader-factory.js"

// Globale Datatable
window.terrainVertexShaderStore = createTerrainStore()
registerTerrain("vertexShader", window.terrainVertexShaderStore)

// Global Babylon Variablen
let displaceEngine = null
let displaceScene = null
let displaceCamera = null
let displaceCanvas = null

let displaceMesh = null
let displaceWaterMesh = null
let displaceHeightTexture = null


// Register the shaders
BABYLON.Effect.ShadersStore["terrainDisplaceVertexShader"] = getShader(ShaderTypes.DISPLACEMENT)
BABYLON.Effect.ShadersStore["terrainDisplaceFragmentShader"] = getShader(ShaderTypes.MIN)


// Initialize the scene
function initializeDisplaceScene() {
  const result = createBabylonScene({
    canvasId: "vertex-shader-canvas",
    cameraName: "vertex-shader-camera",
    radius: WorldConfig.cameraRadius
  })

  if (!result) return

  displaceCanvas = result.canvas
  displaceEngine = result.engine
  displaceScene = result.scene
  displaceCamera = result.camera
}


// Validate the resolution (Only 64x64 / 128x128 / 256x256)
function getDisplaceResolutionValue(value) {
  const parsed = Number(value)

  if (parsed === 64) return 64
  if (parsed === 128) return 128
  if (parsed === 256) return 256
  return 128 // default-case
}


// Delete old meshes and textures
function disposeDisplaceMeshes() {
  if (displaceMesh) {
    displaceMesh.dispose()
    displaceMesh = null
  }

  if (displaceWaterMesh) {
    displaceWaterMesh.dispose()
    displaceWaterMesh = null
  }

  if (displaceHeightTexture) {
    displaceHeightTexture.dispose()
    displaceHeightTexture = null
  }
}


// Create a waterplane
function buildDisplaceWaterPlane(size, waterLevel) {
  displaceWaterMesh = BABYLON.MeshBuilder.CreateGround(
    "vertex-shader-water",
    {
      width: size,
      height: size,
      subdivisions: 1
    },
    displaceScene
  )

  displaceWaterMesh.position.y = waterLevel
  displaceWaterMesh.material = createWaterMaterial(displaceScene)
}


// Create the heightmap texture from the fBm Noise-Map (Upload to the GPU)
function createHeightTextureFromNoise(noiseData) {
  const width = noiseData.width
  const height = noiseData.height
  const values = noiseData.normalizedValues
  const data = new Uint8Array(width * height * 4)

  for (let i = 0; i < width * height; i++) {
    const gray = Math.max(0, Math.min(255, Math.round((values[i] ?? 0) * 255)))
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
    displaceScene,
    false,                                  // generateMipMaps
    false,                                  // invertY
    BABYLON.Texture.BILINEAR_SAMPLINGMODE   // smooth interpolation between texels
  )
}


// Create the GPU-displaced terrain
function buildDisplaceTerrain(options) {
  const noiseData = window.generatedNoiseMaps?.fbm // loads noise map

  // catch error of no noise map
  if (!noiseData) {
    console.error("Keine fBm Noise-Map gefunden.")
    return
  }

  // Delete old meshes and textures
  disposeDisplaceMeshes()

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
  displaceMesh = BABYLON.MeshBuilder.CreateGround(
    "vertex-shader-terrain",
    {
      width: WORLD_SIZE,
      height: WORLD_SIZE,
      subdivisions: resolution - 1
    },
    displaceScene
  )

  displaceHeightTexture = createHeightTextureFromNoise(noiseData)

  const texelSize = 1 / noiseData.width
  const worldStep = WORLD_SIZE * texelSize

  const material = new BABYLON.ShaderMaterial(
    "vertex-shader-displace-material",
    displaceScene,
    {
      vertex: "terrainDisplace",
      fragment: "terrainDisplace"
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
        "lightDirection"
      ],
      samplers: ["heightMap"]
    }
  )

  material.setTexture("heightMap", displaceHeightTexture)
  material.setFloat("baseHeight", baseHeight)
  material.setFloat("maximumHeight", maximumHeight)
  material.setFloat("heightLevel", heightLevel)
  material.setFloat("heightCurveExponent", heightCurveExponent)
  material.setFloat("texelSize", texelSize)
  material.setFloat("worldStep", worldStep)
  material.setVector3(
    "lightDirection",
    new BABYLON.Vector3(-0.5, -1.0, -0.3)
  )

  material.wireframe = wireframe

  displaceMesh.material = material

  buildDisplaceWaterPlane(WORLD_SIZE, waterLevel)

  // save Terrian-Data
  saveTerrainStore(
    window.terrainVertexShaderStore,
    {
      mesh: displaceMesh,
      positions: displaceMesh.getVerticesData(BABYLON.VertexBuffer.PositionKind),
      normals: displaceMesh.getVerticesData(BABYLON.VertexBuffer.NormalKind),
      indices: displaceMesh.getIndices(),
      resolution: options.resolution,
      terrainSize: WorldConfig.terrainSize,
      voxels: []
    }
  )
}


// Regenerating terrain function with input listeners
function regenerateDisplaceTerrain() {
  const options = {
    resolution: getDisplaceResolutionValue(document.getElementById("vertex-shader-resolution-input").value),
    baseHeight: Number(document.getElementById("vertex-shader-base-height-input").value),
    maximumHeight: Number(document.getElementById("vertex-shader-maximum-height-input").value),
    waterLevel: Number(document.getElementById("vertex-shader-water-level-input").value),
    heightLevel: Number(document.getElementById("vertex-shader-height-level-input").value),
    heightCurveExponent: Number(document.getElementById("vertex-shader-height-curve-input").value),
    wireframe: document.getElementById("vertex-shader-wireframe-input").checked
  }

  buildDisplaceTerrain(options)
}


document.addEventListener(
  "DOMContentLoaded",
  () => {
    initializeDisplaceScene()
    const generateButton = document.getElementById("generate-vertex-shader-terrain")
    if (!generateButton) return
    generateButton.addEventListener(
      "click",
      () => {
        generateButton.disabled = true
        generateButton.textContent = "Terrain wird generiert..."
        setTimeout(
          () => {
            regenerateDisplaceTerrain()
            generateButton.disabled = false
            generateButton.textContent = "Terrain generieren"
          },
        10)
      }
    )
  }
)
