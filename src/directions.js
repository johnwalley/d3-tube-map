const DIRECTION_VECTORS = {
  N: [0, 1],
  NE: [1, 1],
  E: [1, 0],
  SE: [1, -1],
  S: [0, -1],
  SW: [-1, -1],
  W: [-1, 0],
  NW: [-1, 1],
};

/**
 * Return the norm of a 2-dimensional vector.
 */
function norm2d(vector) {
  return Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1]);
}

/**
 * Return the cross product of a 2-dimensional vector.
 */
function crossProd2d(a, b) {
  return a[0] * b[1] - a[1] * b[0];
}

/**
 * Return the dot product of a 2-dimensional vector.
 */
function dotProd2d(a, b) {
  return a[0] * b[0] + a[1] * b[1];
}

/**
 * Return whether the given 2D vectors are parallel.
 */
export function areParallel(a, b) {
  return (
    crossProd2d(a, b) == 0 &&
    Math.sign(a[0]) == Math.sign(b[0]) &&
    Math.sign(a[1]) == Math.sign(b[1])
  );
}

/**
 * Apply a function to both components of a 2-dimensional vector.
 */
export function apply2d(fn) {
  return [0, 1].map((i) => fn(i));
}

/**
 * Return the given vector normalized.
 */
export function normalize(vector) {
  let norm = norm2d(vector);
  return apply2d((i) => vector[i] / norm);
}

/**
 * Return a vector in the direction of the provided compass bearing.
 */
export function directionVector(bearing) {
  let key = bearing.toUpperCase();
  if (!DIRECTION_VECTORS.hasOwnProperty(key)) {
    let options = Object.keys(DIRECTION_VECTORS).join(', ');
    throw new Error(
      `'${key}' is not a recognised compass bearing. Options are ${options}`
    );
  }
  return DIRECTION_VECTORS[key];
}

/**
 * Return the compass bearing matching the provided vector.
 */
export function compassBearing(vector) {
  let entry = Object.entries(DIRECTION_VECTORS).find(([b, vec]) =>
    areParallel(vec, vector)
  );
  if (entry === undefined) {
    throw new Error(
      `No compass bearing matches vector ${vector}. Only 45 deg angles are supported.`
    );
  }
  return entry[0];
}

/**
 * Return the shift required to an interchange in order to ensure that it passes
 * through the middle of the first two encountered sets of intersecting lines.
 */
export function interchangeShift(markers) {
  let line1, line2;
  markers.forEach((m) => {
    let vec = normalize(directionVector(m.dir));
    if (line1 === undefined) {
      line1 = {
        vector: vec,
        shiftMin: m.shiftNormal,
        shiftMax: m.shiftNormal,
      };
    } else if (areParallel(line1.vector, vec)) {
      let dotProd = dotProd2d(vec, line1.vector);
      line1.shiftMin = Math.min(line1.shiftMin, m.shiftNormal * dotProd);
      line1.shiftMax = Math.max(line1.shiftMax, m.shiftNormal * dotProd);
    } else if (line2 === undefined) {
      line2 = {
        vector: vec,
        shiftMin: m.shiftNormal,
        shiftMax: m.shiftNormal,
      };
    } else if (areParallel(line2.vector, vec)) {
      let dotProd = dotProd2d(vec, line2.vector);
      line2.shiftMin = Math.min(line2.shiftMin, m.shiftNormal * dotProd);
      line2.shiftMax = Math.max(line2.shiftMax, m.shiftNormal * dotProd);
    }
  });
  if (line1 === undefined) {
    // No lines encountered, so no shift needed
    return [0, 0];
  } else if (line2 === undefined) {
    // All lines are parallel, so just shift in the one direction
    let mid1 = (line1.shiftMin + line1.shiftMax) / 2;
    return [mid1 * line1.vector[1], -mid1 * line1.vector[0]];
  } else {
    // Find the centre of the two encountered sets of lines
    let crossProd = crossProd2d(line1.vector, line2.vector);
    let mid1 = (line1.shiftMin + line1.shiftMax) / 2;
    let mid2 = (line2.shiftMin + line2.shiftMax) / 2;
    return apply2d(
      (i) => (mid2 * line1.vector[i] - mid1 * line2.vector[i]) / crossProd
    );
  }
}
