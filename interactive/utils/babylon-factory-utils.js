function createBabylonScene({
  canvasId,
  cameraName,
  radius = WorldConfig.cameraRadius,
  clearColor = [0.75, 0.85, 0.95, 1],
  cameraTarget = new BABYLON.Vector3(0, 0, 0),
  cameraAlpha = Math.PI / 4,
  cameraBeta = Math.PI / 3,
  lightIntensity = 1.3
}) {
  const canvas = document.getElementById(canvasId)

  if (!canvas) {
    console.error("Canvas not found:", canvasId)
    return null
  }

  const engine = new BABYLON.Engine(canvas, true)
  const scene = new BABYLON.Scene(engine)

  scene.clearColor = new BABYLON.Color4(
                      clearColor[0],
                      clearColor[1],
                      clearColor[2],
                      clearColor[3]
                    )

  const camera = new BABYLON.ArcRotateCamera(
                  cameraName,
                  cameraAlpha,
                  cameraBeta,
                  radius,
                  cameraTarget,
                  scene
                )

  camera.attachControl(canvas, true)

  const light = new BABYLON.HemisphericLight(
                "global-light",
                new BABYLON.Vector3(0, 1, 0),
                scene
              )

  light.intensity = lightIntensity
  engine.runRenderLoop(() => {scene.render()})
  window.addEventListener("resize", () => engine.resize())

  return {
    canvas,
    engine,
    scene,
    camera,
    light
  }
}
