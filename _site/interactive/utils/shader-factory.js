// Imports
import { getMinFragment } from "../shader/min_fragment.js";
import { getFragmentExample } from "../shader/fragment_example.js";
import { getVertexDisplacementMapping } from "../shader/vertex_displacement_mapping.js";
import { getDayNightFragmentShader } from "../shader/DayNightShader.js";

// Structure of the shader registry for usage in other files
export const ShaderTypes = {
    EXAMPLE: "example",
    MIN: "min",
    DISPLACEMENT: "displacement",
    DAYNIGHT: "daynight",
    WINTER: "winter"
};

// Registry of the shaders
const shaderRegistry = {
    [ShaderTypes.EXAMPLE]: getFragmentExample,	
    [ShaderTypes.MIN]: getMinFragment,
    [ShaderTypes.DISPLACEMENT]: getVertexDisplacementMapping,
    [ShaderTypes.DAYNIGHT]: getDayNightFragmentShader
};

// Function to get the shader by type
export function getShader(type) {
    const factory = shaderRegistry[type];
    if (!factory) {
        throw new Error(`Unknown shader type: ${type}`);
    }
    return factory();
}
