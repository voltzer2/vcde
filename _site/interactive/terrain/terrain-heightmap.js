// Globale Datatable
window.terrainHeightStore = createTerrainStore()
registerTerrain("heightmap", window.terrainHeightStore)

// Global Babylon Variablen
let terrainEngine = null
let terrainScene = null
let terrainCamera = null
let terrainCanvas = null

let terrainMesh = null
let terrainWaterMesh = null


// Scene Initialisierung
function initializeTerrainScene() {
  const result = createBabylonScene({
    canvasId: "terrain-canvas",
    cameraName: "terrain-camera",
    radius: WorldConfig.cameraRadius
  })

  if (!result) return

  terrainCanvas = result.canvas
  terrainEngine = result.engine
  terrainScene = result.scene
  terrainCamera = result.camera
}


// Resolution validation (Only 64x64 / 128x128 / 256x256)
function getTerrainResolutionValue(value) {
  const parsed = Number(value)

  if (parsed === 64) return 64
  if (parsed === 128) return 128
  if (parsed === 256) return 256
  return 128 // default-case
}


// delete old mesh
function disposeTerrainMeshes() {
  if (terrainMesh) {
    terrainMesh.dispose()
    terrainMesh = null
  }

  if (terrainWaterMesh) {
    terrainWaterMesh.dispose()
    terrainWaterMesh = null
  }
}


// create a waterplane
function buildWaterPlane(size, waterLevel) {
  terrainWaterMesh = BABYLON.MeshBuilder.CreateGround(
    "terrain-water",
    {
      width: size,
      height: size,
      subdivisions: 1
    },
    terrainScene
  )

  terrainWaterMesh.position.y = waterLevel
  terrainWaterMesh.material = createWaterMaterial(terrainScene)
}


// Building function for the terrain
function buildHeightmapTerrain(options) {
  const noiseData = window.generatedNoiseMaps?.fbm // loads noise map

  // catch error of no noise Map
  if (!noiseData) {
    console.error("Keine fBm Noise-Map gefunden.")
    return
  }

  // deletes old mesh
  disposeTerrainMeshes()

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
  const meshResolution = resolution

  terrainMesh = BABYLON.MeshBuilder.CreateGround(
    "heightmap-terrain",
    {
      width: WORLD_SIZE,
      height: WORLD_SIZE,
      subdivisions: resolution - 1,
      updatable: true
    },
    terrainScene
  )

  const positions = terrainMesh.getVerticesData(BABYLON.VertexBuffer.PositionKind)

  // sampling noise
  const noiseWidth = noiseData.width
  const noiseHeight = noiseData.height

  for (let i = 0; i < positions.length; i += 3) {
    const vertexIndex = i / 3
    const x = vertexIndex % meshResolution
    const z = Math.floor(vertexIndex / meshResolution)
    const noiseX = Math.floor((x / (meshResolution - 1)) * (noiseWidth - 1))
    const noiseZ = Math.floor((z / (meshResolution - 1)) * (noiseHeight - 1))
    const noiseIndex = noiseZ * noiseWidth + noiseX
    const normalizedValue = noiseData.normalizedValues[noiseIndex] ?? 0

    const terrainHeight = heightFunction(
                            normalizedValue,
                            baseHeight,
                            maximumHeight,
                            heightCurveExponent,
                            heightLevel
                          )

    // Set the height (y-value) of the vertex
    // (in Babylon: position = [x,y,z])
    positions[i + 1] = terrainHeight
  }

  // updates the mesh
  terrainMesh.updateVerticesData(
    BABYLON.VertexBuffer.PositionKind,
    positions
  )

  terrainMesh.refreshBoundingInfo()

  const indices = terrainMesh.getIndices()
  const normals = []

  // generates correct lighting
  BABYLON.VertexData.ComputeNormals(positions, indices, normals)
  terrainMesh.updateVerticesData(BABYLON.VertexBuffer.NormalKind, normals)

  // create and set material of the vertex to a placeholder
  const terrainMaterial = createTerrainMaterial(terrainScene,{wireframe})
  terrainMesh.material = terrainMaterial

  buildWaterPlane(WORLD_SIZE, waterLevel)

  // save Terrian-Data
  saveTerrainStore(
    window.terrainHeightStore,
    {
      mesh: terrainMesh,
      positions,
      normals,
      indices,
      resolution: options.resolution,
      terrainSize: WorldConfig.terrainSize,
      voxels: []
    }
  )
}


// Regenerating terrain function with input listeners
function regenerateTerrain() {
  const options = {
    resolution: getTerrainResolutionValue(document.getElementById("terrain-resolution-input").value),
    baseHeight: Number(document.getElementById("terrain-base-height-input").value),
    maximumHeight: Number(document.getElementById("terrain-maximum-height-input").value),
    waterLevel: Number(document.getElementById("terrain-water-level-input").value),
    heightLevel: Number(document.getElementById("terrain-height-level-input").value),
    heightCurveExponent: Number(document.getElementById("terrain-height-curve-input").value),
    wireframe: document.getElementById("terrain-wireframe-input").checked
  }

  buildHeightmapTerrain(options)
  updateTerrainInfoText(options.resolution)
}


// Text update for performance-information
function updateTerrainInfoText(resolution) {
  const info = document.getElementById("terrain-performance-info")

  if (!info) {
    return
  }

  if (resolution === 256) {
    info.textContent = "Hinweis: 256x256 erzeugt deutlich mehr Vertices und kann die Performance reduzieren."
    return
  }

  if (resolution === 128) {
    info.textContent = "128x128 ist ein guter Kompromiss zwischen Qualität und Performance."
    return
  }

  info.textContent = "64x64 besitzt wenige Vertices und eignet sich gut für schwächere Geräte."
}


document.addEventListener(
  "DOMContentLoaded", 
  () => { 
    initializeTerrainScene() 
    const generateButton = document.getElementById("generate-heightmap-terrain") 
    if (!generateButton) return 
    generateButton.addEventListener(
      "click",
      () => {
        generateButton.disabled = true 
        generateButton.textContent = "Terrain wird generiert..." 
        setTimeout(
          () => {
            regenerateTerrain() 
            generateButton.disabled = false 
            generateButton.textContent = "Terrain generieren" 
          }, 
        10) 
      }
    ) 
  }
)
