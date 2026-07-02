function createTerrainStore() {
  return {
    mesh: null,
    positions: null,
    normals: null,
    indices: null,
    voxels: null,
    options: null,
    type: null
  }
}


function saveTerrainStore(
  store,
  {
    mesh,
    positions,
    normals,
    indices,
    resolution,
    terrainSize,
    voxels,
  }
) {
  store.mesh = mesh
  store.positions = positions ? [...positions]: null
  store.normals = normals ? [...normals]: null
  store.indices = indices ? [...indices]: null
  store.resolution = resolution ?? null
  store.terrainSize = terrainSize ?? null
  store.voxels = voxels ?? []
}


function registerTerrain(
  name,
  store
) {
  window.terrainRegistry ??= {}
  window.terrainRegistry[name] = store
}


function getTerrain(name) {
  return (
    window.terrainRegistry?.[name]
    ?? null
  )
}


function hasTerrain(name) {
  return getTerrain(name) !== null
}