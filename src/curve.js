import * as d3 from 'd3';

const SQRT2 = Math.sqrt(2);

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
 * Apply a function to both components of a 2-dimensional vector.
 */
function apply2d(fn) {
  return [0, 1].map((i) => fn(i));
}

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
 * Return whether the given 2D vectors are parallel.
 */
function areParallel(a, b) {
  return (
    crossProd2d(a, b) == 0 &&
    Math.sign(a[0]) == Math.sign(b[0]) &&
    Math.sign(a[1]) == Math.sign(b[1])
  );
}

/**
 * Return the given vector normalized.
 */
function normalize(vector) {
  let norm = norm2d(vector);
  return apply2d((i) => vector[i] / norm);
}

/**
 * Return a vector in the direction of the provided compass bearing.
 */
function directionVector(bearing) {
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
function compassBearing(vector) {
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
 * Return an SVG instruction to move to the given point.
 */
function svgMoveTo(point) {
  return `M${point[0]},${point[1]}`;
}

/**
 * Return an SVG instruction to draw a line to the given point.
 */
function svgLineTo(point) {
  return `L${point[0]},${point[1]}`;
}

/**
 * Return an SVG instruction to draw a quadratic Bezier curve to the given end point,
 * using the given control point.
 */
function svgQuadraticCurveTo(controlPoint, endPoint) {
  return `Q${controlPoint[0]},${controlPoint[1]},${endPoint[0]},${endPoint[1]}`;
}

export function interchange(lineWidth) {
  return d3
    .arc()
    .innerRadius(0)
    .outerRadius(1.25 * lineWidth)
    .startAngle(0)
    .endAngle(2 * Math.PI);
}

export function station(
  d,
  xScale,
  yScale,
  lineWidthMultiplier,
  lineWidthTickRatio
) {
  var lineFunction = d3
    .line()
    .x(function (d) {
      return xScale(d[0]);
    })
    .y(function (d) {
      return yScale(d[1]);
    });

  let dir = normalize(directionVector(d.labelPos));

  return lineFunction([
    [
      d.x +
        d.shiftX * lineWidthMultiplier +
        (lineWidthMultiplier / 2.05) * dir[0],
      d.y +
        d.shiftY * lineWidthMultiplier +
        (lineWidthMultiplier / 2.05) * dir[1],
    ],
    [
      d.x +
        d.shiftX * lineWidthMultiplier +
        (lineWidthMultiplier / 2) * dir[0] +
        (lineWidthMultiplier / lineWidthTickRatio) * dir[0],
      d.y +
        d.shiftY * lineWidthMultiplier +
        (lineWidthMultiplier / 2) * dir[1] +
        (lineWidthMultiplier / lineWidthTickRatio) * dir[1],
    ],
  ]);
}

export function line(data, xScale, yScale, lineWidth, lineWidthTickRatio) {
  var path = '';

  var unitLength = Math.abs(
    xScale(1) - xScale(0) !== 0 ? xScale(1) - xScale(0) : yScale(1) - yScale(0)
  );

  var shiftCoords = apply2d(
    (i) => (data.shiftCoords[i] * lineWidth) / unitLength
  );

  let prevBearing;

  for (let nNode = 1; nNode < data.nodes.length; nNode++) {
    let nextCoords = data.nodes[nNode].coords;
    let prevCoords = data.nodes[nNode - 1].coords;

    let diff = apply2d(
      (i) => Math.round(nextCoords[i]) - Math.round(prevCoords[i])
    );
    let [xDiff, yDiff] = diff;

    if (xDiff != 0 || yDiff != 0) {
      let isCorner =
        (Math.abs(xDiff) == 1 && Math.abs(yDiff) == 1) ||
        (Math.abs(xDiff) == 1 && Math.abs(yDiff) == 2) ||
        (Math.abs(xDiff) == 2 && Math.abs(yDiff) == 1);

      // If it's the first segment, calculate the initial bearing, assuming
      // a straight path, and move to the start point.
      if (nNode == 1) {
        if (isCorner) {
          throw new Error('Cannot begin with a corner segment');
        }
        // Initialize to the direction of the current segment
        prevBearing = compassBearing(diff);

        let tangent = normalize(directionVector(prevBearing));
        let lineStartCorrection = apply2d(
          (i) =>
            (-tangent[i] * lineWidth) / (2 * lineWidthTickRatio * unitLength)
        );
        let point = [
          xScale(prevCoords[0] + shiftCoords[0] + lineStartCorrection[0]),
          yScale(prevCoords[1] + shiftCoords[1] + lineStartCorrection[1]),
        ];
        path += svgMoveTo(point);
      }

      let nextBearing;

      if (isCorner) {
        // Corners are always a simple sum of the ingoing and outgoing
        // vectors in canonical integer form.
        let prevVector = directionVector(prevBearing);
        let nextVector = apply2d((i) => diff[i] - prevVector[i]);
        nextBearing = compassBearing(nextVector);
      } else {
        // Otherwise the outgoing vector is the same as the ingoing vector.
        nextBearing = compassBearing(diff);
        if (crossProd2d(directionVector(prevBearing), diff) != 0) {
          throw new Error(
            `Direction discontinuity: ${nextCoords} is` +
              ` not ${prevBearing} (or opposite) of ${prevCoords}`
          );
        }
        let norm = norm2d(diff);
        let segmentDirection = apply2d((i) => diff[i] / norm);
      }

      let lineEndCorrection = [0, 0];
      if (nNode === data.nodes.length - 1) {
        let tangent = normalize(directionVector(nextBearing));
        lineEndCorrection = apply2d(
          (i) =>
            (tangent[i] * lineWidth) / (2 * lineWidthTickRatio * unitLength)
        );
      }

      let prevPoint = [
        xScale(prevCoords[0] + shiftCoords[0]),
        yScale(prevCoords[1] + shiftCoords[1]),
      ];
      let nextPoint = [
        xScale(nextCoords[0] + shiftCoords[0] + lineEndCorrection[0]),
        yScale(nextCoords[1] + shiftCoords[1] + lineEndCorrection[1]),
      ];

      if (isCorner) {
        let prevVector = directionVector(prevBearing);
        let nextVector = directionVector(nextBearing);
        // The control point is chosen simply to be the intersection of the
        // ingoing and outgoing vectors.
        let controlPoint = apply2d(
          (i) =>
            (prevPoint[i] * nextVector[i] + nextPoint[i] * prevVector[i]) /
            (prevVector[i] + nextVector[i])
        );
        path += svgQuadraticCurveTo(controlPoint, nextPoint);
      } else {
        path += svgLineTo(nextPoint);
      }
      prevBearing = nextBearing;
    }
  }

  return path;
}
