import * as d3 from 'd3';
import {
  apply2d,
  areParallel,
  compassBearing,
  directionVector,
  normalize,
} from './directions';

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

/**
 * Return a function for applying a coordinate transform from line definition
 * coordinates to display coordinates.
 */
function coordTransform(
  xScaleFn,
  yScaleFn,
  lineWidth,
  unitLength,
  shiftNormal = 0,
  shiftCoords = [0, 0]
) {
  let shiftScale = lineWidth / unitLength;
  return (coords, tangent, shiftTangential = 0) => [
    xScaleFn(
      coords[0] +
        shiftTangential * tangent[0] +
        shiftScale * (shiftCoords[0] + shiftNormal * tangent[1])
    ),
    yScaleFn(
      coords[1] +
        shiftTangential * tangent[1] +
        shiftScale * (shiftCoords[1] - shiftNormal * tangent[0])
    ),
  ];
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
  let lineFunction = d3
    .line()
    .x(function (d) {
      return xScale(d[0]);
    })
    .y(function (d) {
      return yScale(d[1]);
    });

  let tangentVector = normalize(directionVector(d.dir));
  let labelVector = normalize(directionVector(d.labelPos));

  let shiftX = d.shiftX + d.shiftNormal * tangentVector[1];
  let shiftY = d.shiftY - d.shiftNormal * tangentVector[0];

  return lineFunction([
    [
      d.x +
        shiftX * lineWidthMultiplier +
        (lineWidthMultiplier / 2.05) * labelVector[0],
      d.y +
        shiftY * lineWidthMultiplier +
        (lineWidthMultiplier / 2.05) * labelVector[1],
    ],
    [
      d.x +
        shiftX * lineWidthMultiplier +
        (lineWidthMultiplier / 2) * labelVector[0] +
        (lineWidthMultiplier / lineWidthTickRatio) * labelVector[0],
      d.y +
        shiftY * lineWidthMultiplier +
        (lineWidthMultiplier / 2) * labelVector[1] +
        (lineWidthMultiplier / lineWidthTickRatio) * labelVector[1],
    ],
  ]);
}

/**
 * Determine the compass bearing of the tangent to the line at each node
 * along the given line, and save under the `dir` attribute.
 */
export function populateLineDirections(line) {
  for (let nNode = 1; nNode < line.nodes.length; nNode++) {
    let currNode = line.nodes[nNode];
    let prevNode = line.nodes[nNode - 1];

    let diff = apply2d(
      (i) => Math.round(currNode.coords[i]) - Math.round(prevNode.coords[i])
    );
    let [xDiff, yDiff] = diff;

    if (xDiff == 0 && yDiff == 0) {
      throw new Error(`Repeated coordinates ${currNode.coords}`);
    }

    // If it's the first segment, calculate the initial bearing, assuming
    // a straight path
    if (nNode == 1) {
      prevNode.dir = compassBearing(diff);
    }

    let prevVector = directionVector(prevNode.dir);
    if (areParallel(prevVector, diff)) {
      // Otherwise the outgoing vector is the same as the ingoing vector.
      currNode.dir = compassBearing(diff);
      if (currNode.dir !== prevNode.dir) {
        throw new Error(
          `Direction discontinuity: ${currNode.coords} is` +
            ` not ${prevNode.dir} of ${prevNode.coords}`
        );
      }
    } else {
      // A corner is required.
      let cornerPossible =
        (Math.abs(xDiff) == 1 && Math.abs(yDiff) == 1) ||
        (Math.abs(xDiff) == 1 && Math.abs(yDiff) == 2) ||
        (Math.abs(xDiff) == 2 && Math.abs(yDiff) == 1);
      if (cornerPossible) {
        // Corners are always a simple sum of the ingoing and outgoing
        // vectors in canonical integer form.
        let prevVector = directionVector(prevNode.dir);
        let nextVector = apply2d((i) => diff[i] - prevVector[i]);
        currNode.dir = compassBearing(nextVector);
      } else {
        throw new Error(
          'Cannot draw a corner between coordinates' +
            ` ${prevNode.coords} and ${currNode.coords}`
        );
      }
    }
  }
}

export function line(data, xScale, yScale, lineWidth, lineWidthTickRatio) {
  let path = '';

  let unitLength = Math.abs(
    xScale(1) - xScale(0) !== 0 ? xScale(1) - xScale(0) : yScale(1) - yScale(0)
  );

  let transform = coordTransform(
    xScale,
    yScale,
    lineWidth,
    unitLength,
    data.shiftNormal,
    data.shiftCoords
  );

  let endCorrection = lineWidth / (2 * lineWidthTickRatio * unitLength);

  for (let nNode = 1; nNode < data.nodes.length; nNode++) {
    let prevNode = data.nodes[nNode - 1];
    let nextNode = data.nodes[nNode];

    let prevVector = directionVector(prevNode.dir);
    let nextVector = directionVector(nextNode.dir);

    let prevVectorNorm = normalize(prevVector);
    let nextVectorNorm = normalize(nextVector);

    // If it's the first segment, move to the start point.
    if (nNode == 1) {
      let point = transform(prevNode.coords, prevVectorNorm, -endCorrection);
      path += svgMoveTo(point);
    }

    let prevPoint = transform(prevNode.coords, prevVectorNorm);
    let nextPoint = transform(
      nextNode.coords,
      nextVectorNorm,
      nNode === data.nodes.length - 1 ? endCorrection : 0
    );

    if (nextNode.dir !== prevNode.dir) {
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
  }

  return path;
}
