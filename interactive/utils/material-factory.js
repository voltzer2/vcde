function createTerrainMaterial(
  scene,
  options = {}
) {
  const material = new BABYLON.StandardMaterial("terrain-material", scene)
  material.diffuseColor = options.diffuseColor ?? new BABYLON.Color3(0.6, 0.6, 0.6)
  material.specularColor = options.specularColor ?? BABYLON.Color3.Black()
  material.wireframe = options.wireframe ?? false

  return material
}


function createWaterMaterial(scene) {
  const material = new BABYLON.StandardMaterial("water-material", scene)
  material.diffuseColor = new BABYLON.Color3(0.1, 0.35, 0.7)
  material.alpha = 0.6

  return material
}


function createVoxelMaterial(scene) {
  const material = new BABYLON.StandardMaterial("voxel-material", scene)
  material.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.8)
  material.specularColor = BABYLON.Color3.Black()

  return material
}