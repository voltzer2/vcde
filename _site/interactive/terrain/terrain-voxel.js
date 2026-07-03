// Globale Datatable
window.terrainVoxelStore = createTerrainStore()
registerTerrain("voxel", window.terrainVoxelStore)

// Global Babylon Variablen
let voxelEngine = null
let voxelScene = null
let voxelCamera = null
let voxelCanvas = null

// Instancing System
let voxelBaseMesh = null
let voxelInstances = []
let voxelWaterMesh = null


// Scene Initialisierung
function initializeVoxelScene() {
  const result = createBabylonScene({
    canvasId: "voxel-density-canvas",
    cameraName: "voxel-camera",
    radius: WorldConfig.cameraRadius
  })

  if (!result) return

  voxelCanvas = result.canvas
  voxelEngine = result.engine
  voxelScene = result.scene
  voxelCamera = result.camera
}


// Cleanup
function clearVoxels() {
  voxelInstances.forEach(i => i.dispose())
  voxelInstances = []

  if (voxelWaterMesh) {
    voxelWaterMesh.dispose()
    voxelWaterMesh = null
  }
}


// Resolution validation (Only 16x16 / 32x32 / 64x64 / 128x128)
function getVoxelResolution(value) {
  const v = Number(value)

  if (v === 16) return 16
  if (v === 32) return 32
  if (v === 64) return 64
  if (v === 128) return 128

  return 32 // default-case
}


// Create Basismesh
function createVoxelBaseMesh(voxelSize) {
  if (voxelBaseMesh) {
    voxelBaseMesh.dispose()
  }

  voxelBaseMesh = BABYLON.MeshBuilder.CreateBox("voxel-base", { size: voxelSize }, voxelScene)
  voxelBaseMesh.isVisible = false
}


// Create Voxel (Instanced)
function createVoxel(x, y, z, size, resolution) {
  const instance = voxelBaseMesh.createInstance("voxel-instance")
  const offset = ((resolution - 1) * size) / 2
  instance.position.set(
    x * size - offset,
    y * size,
    z * size - offset
  )

  voxelInstances.push(instance)
}


// Create Water Mesh
function buildVoxelWater(
  resolution,
  waterLevel,
  voxelSize
) {
  const waterVoxelSiteOffset = 0.01       // in Voxel
  const waterVoxelTopOffset = 0.125 / 2   // in Voxel

  const waterVoxelLevel = Math.floor(waterLevel / voxelSize)
  voxelWaterMesh =
    BABYLON.MeshBuilder.CreateBox(
      "voxel-water",
      {
        width: (resolution - waterVoxelSiteOffset) * voxelSize,
        depth: (resolution - waterVoxelSiteOffset) * voxelSize,
        height: (waterVoxelLevel - waterVoxelTopOffset) * voxelSize
      },
      voxelScene
    )
  const offset = ((resolution - 1) * voxelSize) / 2
  voxelWaterMesh.position.x = 0
  voxelWaterMesh.position.z = 0
  voxelWaterMesh.position.y = ((waterVoxelLevel - 1) / 2 - waterVoxelTopOffset) * voxelSize
  voxelWaterMesh.material = createWaterMaterial(voxelScene)
}


// Terrain Generation
function buildVoxelTerrain(options) {
  const noiseData = window.generatedNoiseMaps?.fbm

  if (!noiseData) {
    console.error(
      "Keine Noise-Map gefunden"
    )
    return
  }

  clearVoxels()

  const {
    resolution,
    baseHeight,
    maximumHeight,
    heightLevel,
    heightCurveExponent,
    waterLevel
  } = options

  const noiseWidth = noiseData.width
  const noiseHeight = noiseData.height
  const voxelSize = WorldConfig.terrainSize / (resolution - 1)
  const voxelPositions = []

  createVoxelBaseMesh(voxelSize)

  for (let z = 0; z < resolution; z++) {
    for (let x = 0; x < resolution; x++) {
      const noiseX = Math.floor((x / (resolution - 1)) * (noiseWidth - 1))
      const noiseZ = noiseHeight - 1 - Math.floor((z / (resolution - 1)) * (noiseHeight - 1))
      const noiseIndex = noiseZ * noiseWidth + noiseX
      const normalizedValue = noiseData.normalizedValues[noiseIndex] ?? 0
      const terrainHeight = Math.floor(
                              heightFunction(
                                normalizedValue,
                                baseHeight,
                                maximumHeight,
                                heightCurveExponent,
                                heightLevel
                              )
                            )

      const clampedHeight = Math.min(
        Math.max(terrainHeight, baseHeight),
        maximumHeight
      )
      const voxelHeight = clampedHeight / voxelSize === 0 ? 0: Math.max(1, Math.floor(clampedHeight / voxelSize))
      for (let y = 0; y < voxelHeight; y++) {
        createVoxel(x, y, z, voxelSize, resolution)
        voxelPositions.push({x, y, z})
      }
    }
  }
  voxelBaseMesh.material = createVoxelMaterial(voxelScene)
  buildVoxelWater(resolution, waterLevel, voxelSize)

  // save Terrian-Data
  saveTerrainStore(
    terrainVoxelStore,
    {
      mesh: voxelBaseMesh,
      voxels: voxelPositions,
      options: {
        ...options,
        voxelSize: 1
      },
      type: "voxel"
    }
  )
}


// UI Handler
function regenerateVoxelTerrain() {
  const options = {
    resolution: getVoxelResolution(document.getElementById("voxel-resolution-input").value),
    baseHeight: Number(document.getElementById("voxel-base-height-input").value),
    maximumHeight: Number(document.getElementById("voxel-maximum-height-input").value),
    heightLevel: Number(document.getElementById("voxel-height-level-input").value),
    heightCurveExponent: Number(document.getElementById("voxel-height-curve-input").value),
    waterLevel: Number(document.getElementById("voxel-water-level-input").value)
  }

  buildVoxelTerrain(options)
}


document.addEventListener(
  "DOMContentLoaded", 
  () => { 
    initializeVoxelScene() 
    const generateButton = document.getElementById("generate-voxel-density") 
    if (!generateButton) return 
    generateButton.addEventListener(
      "click",
      () => {
        generateButton.disabled = true 
        generateButton.textContent = "Voxel Terrain wird generiert..." 
        setTimeout(
          () => {
            regenerateVoxelTerrain() 
            generateButton.disabled = false 
            generateButton.textContent = "Voxel Terrain generieren" 
          }, 
        10) 
      }
    ) 
  }
)
