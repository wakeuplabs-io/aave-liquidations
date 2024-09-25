export function convertDecimals(value, nDecimals, xDecimals) {
  // Convert nDecimals and xDecimals to BigInt to avoid precision loss
  const scaleFactor = 10n ** BigInt(xDecimals - nDecimals);

  // Adjust the value by the scale factor
  return value * scaleFactor;
}
