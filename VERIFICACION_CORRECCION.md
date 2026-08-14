# Verificación de corrección V3

- La torre ya no usa integración oscilatoria para la inclinación visual. La respuesta es sobreamortiguada y monótona, por lo que no hay rebote.
- Cuando el momento residual es prácticamente cero, la orientación objetivo es exactamente vertical; se elimina la deriva numérica que hacía caer la torre aun estando calculada en equilibrio.
- La gravedad utilizada en fuerzas y peso permanece fijada en `g = 9.81 m/s²`.
- La inclinación se obtiene a partir del momento residual real de las tensiones y se limita visualmente a 28° para representar desequilibrio sin que el modelo termine acostado sobre la base.
- La rótula permanece geométricamente unida a la torre al cambiar la orientación: la posición del cuerpo se recalcula para conservar fijo el punto O.
- DCL corregido a tres componentes cartesianas para T1, T2, T3 y la reacción R: x, y, z.
- Peso: `W = (0, -m_t g, 0)`, por lo que solo tiene componente y.
- La reacción se calcula como `R = -(T1 + T2 + T3 + W)` en la representación estática.
