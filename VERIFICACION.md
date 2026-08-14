# Verificación de requisitos

- [x] Base circular 20 cm
- [x] Plano polar 10°
- [x] Gravedad 9.81
- [x] Rótula física
- [x] Cuerdas visibles
- [x] Masas colgantes visibles
- [x] P1/P2/P3
- [x] r1/r2/r3 dibujados
- [x] m1/m2/m3 sliders
- [x] r1/r2/r3 radio+ángulo
- [x] Radio hasta 20 cm
- [x] m3/r3 manuales + calcular
- [x] Tiempo real
- [x] Sin botón Actualizar
- [x] 3 modos rotación
- [x] Zoom
- [x] DCL botón
- [x] DCL x/z y Wj
- [x] Modelos de torre
- [x] Altura 10–100 cm
- [x] 4 reinicios
- [x] Modo 30 masas eliminado
- [x] Base tipo madera

## Nota de fidelidad
La escena reproduce la geometría y los elementos funcionales del prototipo (base circular, plano polar, rótula, torre de varillas, tres poleas, cuerdas azules y masas colgantes) con materiales procedurales. No es una reconstrucción fotogramétrica milimétrica del objeto real.

## Física
La torre se integra como cuerpo rígido con gravedad 9.81 m/s² y una rótula tipo `PointToPointConstraint`. Las fuerzas de cable se recalculan cada cuadro con magnitud `T = m g` y dirección instantánea desde la punta hacia la polea. No existe botón de actualización: los sliders redibujan y recalculan inmediatamente. El único botón de cálculo es el solicitado para imponer equilibrio y ajustar m3 + dirección de r3 manteniendo su radio actual.