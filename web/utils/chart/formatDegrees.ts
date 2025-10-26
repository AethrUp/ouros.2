/**
 * Formats a decimal degree value to degrees and minutes (e.g., 15.5 -> "15°30'")
 */
export const formatDegrees = (decimal: number): string => {
  const degrees = Math.floor(decimal);
  const minutes = Math.floor((decimal - degrees) * 60);
  return `${degrees}°${minutes.toString().padStart(2, '0')}'`;
};

/**
 * Gets the degree position within a sign (0-30)
 */
export const getDegreeInSign = (longitude: number): number => {
  return longitude % 30;
};
