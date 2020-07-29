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

  var lineNodes = data.nodes;

  var unitLength = Math.abs(
    xScale(1) - xScale(0) !== 0 ? xScale(1) - xScale(0) : yScale(1) - yScale(0)
  );

  var shiftCoords = [
    (data.shiftCoords[0] * lineWidth) / unitLength,
    (data.shiftCoords[1] * lineWidth) / unitLength,
  ];

  let prevBearing;

  for (var lineNode = 1; lineNode < lineNodes.length; lineNode++) {
    let nextNode = lineNodes[lineNode];
    let currNode = lineNodes[lineNode - 1];

    let xDiff = Math.round(nextNode.coords[0] - currNode.coords[0]);
    let yDiff = Math.round(nextNode.coords[1] - currNode.coords[1]);
    let diff = [xDiff, yDiff];

    if (xDiff != 0 || yDiff != 0) {
      let isCorner =
        (Math.abs(xDiff) == 1 && Math.abs(yDiff) == 1) ||
        (Math.abs(xDiff) == 1 && Math.abs(yDiff) == 2) ||
        (Math.abs(xDiff) == 2 && Math.abs(yDiff) == 1);

      if (lineNode == 1) {
        if (isCorner) {
          throw new Error('Cannot begin with a corner segment');
        }
        // Initialize to the direction of the current segment
        prevBearing = compassBearing(diff);
      }

      let nextBearing;

      if (isCorner) {
        let prevVector = directionVector(prevBearing);
        let nextVector = apply2d((i) => diff[i] - prevVector[i]);
        nextBearing = compassBearing(nextVector);
      } else {
        nextBearing = compassBearing(diff);
        if (crossProd2d(directionVector(prevBearing), diff) != 0) {
          throw new Error(
            `Direction discontinuity: ${nextNode.coords} is` +
              ` not ${prevBearing} (or opposite) of ${currNode.coords}`
          );
        }
        let norm = norm2d(diff);
        let segmentDirection = apply2d((i) => diff[i] / norm);
      }

      if (lineNode == 1) {
        let tangent = normalize(directionVector(prevBearing));
        let lineStartCorrection = apply2d(
          (i) =>
            (-tangent[i] * lineWidth) / (2 * lineWidthTickRatio * unitLength)
        );
        let points = [
          xScale(currNode.coords[0] + shiftCoords[0] + lineStartCorrection[0]),
          yScale(currNode.coords[1] + shiftCoords[1] + lineStartCorrection[1]),
        ];
        path += 'M' + points[0] + ',' + points[1];
      }

      let lineEndCorrection = [0, 0];
      if (lineNode === lineNodes.length - 1) {
        let tangent = normalize(directionVector(nextBearing));
        lineEndCorrection = apply2d(
          (i) =>
            (tangent[i] * lineWidth) / (2 * lineWidthTickRatio * unitLength)
        );
      }

      let prevPoint = [
        xScale(currNode.coords[0] + shiftCoords[0]),
        yScale(currNode.coords[1] + shiftCoords[1]),
      ];
      let nextPoint = [
        xScale(nextNode.coords[0] + shiftCoords[0] + lineEndCorrection[0]),
        yScale(nextNode.coords[1] + shiftCoords[1] + lineEndCorrection[1]),
      ];

      if (isCorner) {
        let prevVector = directionVector(prevBearing);
        let nextVector = directionVector(nextBearing);
        let controlPoint = apply2d(
          (i) =>
            (prevPoint[i] * nextVector[i] + nextPoint[i] * prevVector[i]) /
            (prevVector[i] + nextVector[i])
        );
        if (Math.abs(xDiff) == 1 && Math.abs(yDiff) == 1) {
          path +=
            'Q' +
            controlPoint[0] +
            ',' +
            controlPoint[1] +
            ',' +
            nextPoint[0] +
            ',' +
            nextPoint[1];
        } else if (
          (Math.abs(xDiff) == 1 && Math.abs(yDiff) == 2) ||
          (Math.abs(xDiff) == 2 && Math.abs(yDiff) == 1)
        ) {
          path +=
            'C' +
            controlPoint[0] +
            ',' +
            controlPoint[1] +
            ',' +
            controlPoint[0] +
            ',' +
            controlPoint[1] +
            ',' +
            nextPoint[0] +
            ',' +
            nextPoint[1];
        }
      } else {
        path += 'L' + nextPoint[0] + ',' + nextPoint[1];
      }
      prevBearing = nextBearing;
    }
  }

  return path;
}
