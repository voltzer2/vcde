export function getVertexDisplacementMapping() {
    return `
            precision highp float;

            attribute vec3 position;
            attribute vec3 normal;
            attribute vec2 uv;

            uniform mat4 world;
            uniform mat4 worldViewProjection;

            uniform sampler2D heightMap;
            uniform float baseHeight;
            uniform float maximumHeight;
            uniform float heightLevel;
            uniform float heightCurveExponent;
            uniform float texelSize;
            uniform float worldStep;

            varying float vHeight;
            varying vec3 vNormalW;
            varying vec2 vUv;

            float sampleTerrainHeight(float normalizedValue) {
                float v = clamp(normalizedValue, 0.0, 1.0);
                float k = max(heightCurveExponent, 0.0001);
                float level = clamp(heightLevel, 0.0001, 0.9999);
                float safeBase = max(baseHeight, 0.0);
                float safeMax = max(safeBase + 0.0001, maximumHeight);

                if (v <= 0.0) {
                    return safeBase;
                }

                if (v >= 1.0) {
                    return safeMax;
                }

                float vk = pow(v, k);
                float oneMinusVk = pow(1.0 - v, k);
                float levelRatio = (1.0 - level) / level;
                float denominator = vk + levelRatio * oneMinusVk;
                float fraction = denominator > 0.0 ? vk / denominator : (v >= 0.5 ? 1.0 : 0.0);

                return safeBase + (safeMax - safeBase) * fraction;
            }

            void main() {
                // FIX: UV Y-Achse invertieren (wichtig für Babylon Ground)
                vec2 fixedUV = vec2(uv.x, 1.0 - uv.y);

                // Displacement
                float n = texture2D(heightMap, fixedUV).r;
                float height = sampleTerrainHeight(n);

                vec3 displaced = position;
                displaced.y += height;

                // Nachbar-Sampling mit korrigierten UVs
                float hL = sampleTerrainHeight(texture2D(heightMap, fixedUV + vec2(-texelSize, 0.0)).r);
                float hR = sampleTerrainHeight(texture2D(heightMap, fixedUV + vec2( texelSize, 0.0)).r);
                float hD = sampleTerrainHeight(texture2D(heightMap, fixedUV + vec2(0.0, -texelSize)).r);
                float hU = sampleTerrainHeight(texture2D(heightMap, fixedUV + vec2(0.0,  texelSize)).r);

                vec3 normalObj = normalize(vec3(
                    hL - hR,
                    2.0 * worldStep,
                    hD - hU
                ));

                vHeight = height;
                vNormalW = normalize(mat3(world) * normalObj);
                vUv = uv;

                gl_Position = worldViewProjection * vec4(displaced, 1.0);
            }
        `
}
