export function getDayNightFragmentShader() {
    return `
        precision highp float;

        varying float vHeight;
        varying vec3 vNormalW;
        varying vec2 vUv;

        uniform float baseHeight;
        uniform float maximumHeight;
        uniform vec3 lightDirection;
        uniform float timeOfDay;

        void main() {

            // =========================
            // 1. NORMALIZED HEIGHT
            // =========================
            float t = clamp(
                (vHeight - baseHeight) / max(maximumHeight - baseHeight, 0.0001),
                0.0,
                1.0
            );

            // =========================
            // 2. SUMMER TERRAIN COLORS
            // =========================
            vec3 grassColor = vec3(0.76, 0.70, 0.50);
            vec3 dirtColor  = vec3(0.30, 0.55, 0.25);
            vec3 rockColor  = vec3(0.45, 0.42, 0.40);
            vec3 peakColor  = vec3(0.95, 0.95, 0.97);

            vec3 color;

            if (t < 0.33) {
                color = mix(grassColor, dirtColor, t / 0.33);
            } else if (t < 0.66) {
                color = mix(dirtColor, rockColor, (t - 0.33) / 0.33);
            } else {
                color = mix(rockColor, peakColor, (t - 0.66) / 0.34);
            }

            // =========================
            // 3. NORMAL + SLOPE
            // =========================
            vec3 nrm = normalize(vNormalW);

            // =========================
            // 4. DAY / NIGHT CYCLE
            // =========================
            float dayFactor = sin(timeOfDay * 3.14159265);
            dayFactor = max(dayFactor, 0.0);

            vec3 nightTint = vec3(0.10, 0.15, 0.30);
            vec3 dayTint   = vec3(1.0, 1.0, 1.0);

            vec3 skyTint = mix(nightTint, dayTint, dayFactor);

            // =========================
            // 5. SUNRISE / SUNSET WARMTH
            // =========================
            vec3 warmTint = vec3(1.2, 0.85, 0.55);

            float sunrise =
                smoothstep(0.15, 0.30, timeOfDay) -
                smoothstep(0.30, 0.45, timeOfDay);

            sunrise +=
                smoothstep(0.55, 0.70, timeOfDay) -
                smoothstep(0.70, 0.85, timeOfDay);

            // =========================
            // 6. LIGHTING (LAMbert)
            // =========================
            float diffuse = max(dot(nrm, normalize(-lightDirection)), 0.0);

            float ambient = mix(0.20, 0.45, dayFactor);
            float lighting = ambient + diffuse * 0.9;

            // =========================
            // 7. FINAL COLOR
            // =========================
            color *= lighting;
            color *= skyTint;
            color *= mix(vec3(1.0), warmTint, sunrise * 0.3);

            gl_FragColor = vec4(color, 1.0);
        }
    `;
}