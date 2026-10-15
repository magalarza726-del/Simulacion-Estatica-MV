import test from 'node:test';
import assert from 'node:assert/strict';
import {verticalCableMoment, stabilizedTiltRadians, MAX_ANGLE_RAD} from '../physics-model.js';
const baseline = () => verticalCableMoment([.005,.005,.005],[17,17,17],[150,30,270],.34);
test('tres masas simétricas no producen momento neto', () => {
  assert.ok(baseline().magnitude < 1e-12, JSON.stringify(baseline()));
});
test('0.1 g extra no provoca una caída de 85°', () => {
  const m = verticalCableMoment([.0051,.005,.005],[17,17,17],[150,30,270],.34).magnitude;
  const tilt = stabilizedTiltRadians(m);
  assert.ok(tilt > 0);
  assert.ok(tilt < Math.PI/180, `Resultado: ${tilt*180/Math.PI} grados`);
});
test('el ángulo se duplica al duplicar el momento (sin saturación)', () => {
  assert.ok(Math.abs(stabilizedTiltRadians(.005)*2 - stabilizedTiltRadians(.010)) < 1e-14);
});
test('desequilibrios opuestos de igual magnitud provocan igual ángulo', () => {
  const a = verticalCableMoment([.0051,.005,.005],[17,17,17],[150,30,270],.34);
  const b = verticalCableMoment([.005,.0051,.005],[17,17,17],[150,30,270],.34);
  assert.ok(Math.abs(a.magnitude-b.magnitude) < 1e-12);
  assert.ok(Math.abs(stabilizedTiltRadians(a.magnitude)-stabilizedTiltRadians(b.magnitude)) < 1e-12);
});
test('la inclinación nunca supera 85°', () => {
  assert.equal(stabilizedTiltRadians(100),MAX_ANGLE_RAD);
});
test('un momento exactamente nulo produce inclinación nula', () => {
  assert.equal(stabilizedTiltRadians(0),0);
});
test('se rechazan entradas físicas inválidas', () => {
  assert.throws(()=>stabilizedTiltRadians(-1), RangeError);
  assert.throws(()=>stabilizedTiltRadians(1,0), RangeError);
  assert.throws(()=>verticalCableMoment([1],[1],[0],.34),TypeError);
});
