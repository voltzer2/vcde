export function getFragmentExample() {
    return `
            precision highp float;

            varying float vHeight;
            varying vec3 vNormalW;
            varying vec2 vUv;

            uniform float baseHeight;
            uniform float maximumHeight;
            uniform vec3 lightDirection;

            void main() {
            // Einfärbung anhand der relativen Höhe (Strand -> Gras -> Fels -> Schnee)
            float t = clamp(
                (vHeight - baseHeight) / max(maximumHeight - baseHeight, 0.0001),
                0.0,
                1.0
            );

            vec3 lowColor = vec3(0.76, 0.70, 0.50);
            vec3 midColor = vec3(0.30, 0.55, 0.25);
            vec3 highColor = vec3(0.45, 0.42, 0.40);
            vec3 peakColor = vec3(0.95, 0.95, 0.97);

            vec3 color;
            if (t < 0.33) {
                color = mix(lowColor, midColor, t / 0.33);
            } else if (t < 0.66) {
                color = mix(midColor, highColor, (t - 0.33) / 0.33);
            } else {
                color = mix(highColor, peakColor, (t - 0.66) / 0.34);
            }

            // Diffuse Beleuchtung mit Ambient-Anteil
            vec3 nrm = normalize(vNormalW);
            float diffuse = max(dot(nrm, normalize(-lightDirection)), 0.0);
            float lighting = 0.35 + diffuse * 0.85;

            gl_FragColor = vec4(color * lighting, 1.0);
            }
            `
}
