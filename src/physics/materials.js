export const MATERIAL_DEFS = {
    default: { staticFriction: 0.5, dynamicFriction: 0.35, restitution: 0.4, rollingResistance: 0.01, color: '#888' },
    ice:     { staticFriction: 0.05, dynamicFriction: 0.02, restitution: 0.15, rollingResistance: 0.001, color: '#8ef' },
    rubber:  { staticFriction: 0.9, dynamicFriction: 0.7, restitution: 0.82, rollingResistance: 0.04, color: '#e44' },
    metal:   { staticFriction: 0.35, dynamicFriction: 0.25, restitution: 0.55, rollingResistance: 0.005, color: '#aab' },
    sand:    { staticFriction: 0.7, dynamicFriction: 0.55, restitution: 0.1, rollingResistance: 0.08, color: '#da5' },
    wood:    { staticFriction: 0.45, dynamicFriction: 0.35, restitution: 0.35, rollingResistance: 0.015, color: '#a86' },
    glass:   { staticFriction: 0.15, dynamicFriction: 0.1, restitution: 0.7, rollingResistance: 0.003, color: '#ade' },
    bouncy:  { staticFriction: 0.6, dynamicFriction: 0.45, restitution: 0.95, rollingResistance: 0.02, color: '#f6a' },
    sticky:  { staticFriction: 1.2, dynamicFriction: 0.9, restitution: 0.05, rollingResistance: 0.1, color: '#6a4' },
    conveyor:{ staticFriction: 0.8, dynamicFriction: 0.6, restitution: 0.3, rollingResistance: 0.01, color: '#fa0', conveyorSpeed: 200 },
};

export function getMaterial(name) {
    return MATERIAL_DEFS[name] || MATERIAL_DEFS.default;
}

export function combineFriction(a, b) {
    return Math.sqrt(a * b);
}

export function combineRestitution(a, b) {
    return Math.max(a, b);
}
