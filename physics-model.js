/** Equilibrio de referencia, unidades SI. Independiente de THREE/CANNON para pruebas. */
export const GRAVITY = 9.81;
export const MAX_ANGLE_RAD = 85 * Math.PI / 180;
export const DEFAULT_ANGULAR_STIFFNESS = 0.18; // N·m/rad: estabilizador DIDACTICO
export function verticalCableMoment(massesKg, radiiCm, anglesDeg, heightM, pulleyOffsetM = 0.012) {
  if (![massesKg, radiiCm, anglesDeg].every(v => Array.isArray(v) && v.length === 3)) {
    throw new TypeError('Se requieren tres masas, radios y ángulos');
  }
  if (!(heightM > 0)) throw new RangeError('La altura debe ser positiva');
  let sumFx = 0, sumFz = 0;
  for (let i = 0; i < 3; i++) {
    const mass = Number(massesKg[i]);
    const radius = Number(radiiCm[i]) / 100;
    const angle = Number(anglesDeg[i]) * Math.PI / 180;
    if (!(mass >= 0) || !(radius >= 0) || !Number.isFinite(angle)) {
      throw new RangeError('Masa, radio o ángulo inválidos');
    }
    const x = radius * Math.cos(angle), z = radius * Math.sin(angle);
    const cableLength = Math.hypot(x, z, heightM - pulleyOffsetM);
    if (cableLength <= 0) throw new RangeError('Longitud de cable nula');
    const tension = mass * GRAVITY;
    sumFx += tension * x / cableLength;
    sumFz += tension * z / cableLength;
  }
  const x = heightM * sumFz;
  const z = -heightM * sumFx;
  return { x, y: 0, z, magnitude: Math.hypot(x, z) };
}
/** Modo DIDACTICO estabilizado: M = k*theta, hasta 85 grados. No es rotula ideal. */
export function stabilizedTiltRadians(momentNm, stiffnessNmPerRad = DEFAULT_ANGULAR_STIFFNESS) {
  if (!Number.isFinite(momentNm) || momentNm < 0) throw new RangeError('Momento inválido');
  if (!(Number.isFinite(stiffnessNmPerRad) && stiffnessNmPerRad > 0)) {
    throw new RangeError('La rigidez debe ser positiva');
  }
  return Math.min(MAX_ANGLE_RAD, momentNm / stiffnessNmPerRad);
}
