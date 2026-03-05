/**
 * Returns an SVG cubic bezier path string between two points.
 * @param {number} x1 - Start X
 * @param {number} y1 - Start Y
 * @param {number} x2 - End X
 * @param {number} y2 - End Y
 * @returns {string} SVG path `d` attribute value
 */
export function getBezierPath(x1, y1, x2, y2) {
  const dx = Math.abs(x2 - x1);
  const cx = dx * 0.6;
  return `M ${x1} ${y1} C ${x1 + cx} ${y1}, ${x2 - cx} ${y2}, ${x2} ${y2}`;
}

/**
 * Returns the midpoint of a bezier curve (approximation at t=0.5).
 */
export function getBezierMidpoint(x1, y1, x2, y2) {
  return {
    x: (x1 + x2) / 2,
    y: (y1 + y2) / 2,
  };
}
