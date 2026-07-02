export function getMinFragment() { 
    return `
        precision highp float;
        varying vec3 vNormalW;
        uniform vec3 lightDirection;

        void main() {
            vec3 color = vec3(0.6, 0.6, 0.6);

            // Diffuse Beleuchtung mit Ambient-Anteil
            vec3 nrm = normalize(vNormalW);
            float diffuse = max(dot(nrm, normalize(-lightDirection)), 0.0);
            float lighting = 0.35 + diffuse * 0.85;
            
            gl_FragColor = vec4(color * lighting, 1.0);
        }
    `
}
