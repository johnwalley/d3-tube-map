import * as d3 from 'd3';

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
  var dir;
  var sqrt2 = Math.sqrt(2);

  var lineFunction = d3
    .line()
    .x(function(d) {
      return xScale(d[0]);
    })
    .y(function(d) {
      return yScale(d[1]);
    });

  switch (d.labelPos.toLowerCase()) {
    case 'n':
      dir = [0, 1];
      break;
    case 'ne':
      dir = [1 / sqrt2, 1 / sqrt2];
      break;
    case 'e':
      dir = [1, 0];
      break;
    case 'se':
      dir = [1 / sqrt2, -1 / sqrt2];
      break;
    case 's':
      dir = [0, -1];
      break;
    case 'sw':
      dir = [-1 / sqrt2, -1 / sqrt2];
      break;
    case 'w':
      dir = [-1, 0];
      break;
    case 'nw':
      dir = [-1 / sqrt2, 1 / sqrt2];
      break;
    default:
      break;
  }

  return lineFunction([
    [
      d.x +
        d.shiftX * lineWidthMultiplier +
        lineWidthMultiplier / 2.05 * dir[0],
      d.y +
        d.shiftY * lineWidthMultiplier +
        lineWidthMultiplier / 2.05 * dir[1],
    ],
    [
      d.x +
        d.shiftX * lineWidthMultiplier +
        lineWidthMultiplier / 2 * dir[0] +
        lineWidthMultiplier / lineWidthTickRatio * dir[0],
      d.y +
        d.shiftY * lineWidthMultiplier +
        lineWidthMultiplier / 2 * dir[1] +
        lineWidthMultiplier / lineWidthTickRatio * dir[1],
    ],
  ]);
}

export function line(data, xScale, yScale, lineWidth, lineWidthTickRatio) {
  var path = '';

  var lineNodes = data.nodes;

  var unitLength = xScale(1) - xScale(0);
  var sqrt2 = Math.sqrt(2);

  var shiftCoords = [
    data.shiftCoords[0] * lineWidth / unitLength,
    data.shiftCoords[1] * lineWidth / unitLength,
  ];

  var lastSectionType = 'diagonal'; // TODO: HACK

  var nextNode, currNode, xDiff, yDiff;
  var points;

  for (var lineNode = 0; lineNode < lineNodes.length; lineNode++) {
    if (lineNode > 0) {
      nextNode = lineNodes[lineNode];
      currNode = lineNodes[lineNode - 1];

      var direction = '';

      xDiff = Math.round(currNode.coords[0] - nextNode.coords[0]);
      yDiff = Math.round(currNode.coords[1] - nextNode.coords[1]);

      var lineEndCorrection = [0, 0];

      if (lineNode === lineNodes.length - 1) {
        if (xDiff == 0 || yDiff == 0) {
          if (xDiff > 0)
            lineEndCorrection = [
              -lineWidth / (2 * lineWidthTickRatio * unitLength),
              0,
            ];
          if (xDiff < 0)
            lineEndCorrection = [
              lineWidth / (2 * lineWidthTickRatio * unitLength),
              0,
            ];
          if (yDiff > 0)
            lineEndCorrection = [
              0,
              -lineWidth / (2 * lineWidthTickRatio * unitLength),
            ];
          if (yDiff < 0)
            lineEndCorrection = [
              0,
              lineWidth / (2 * lineWidthTickRatio * unitLength),
            ];
        } else {
          if (xDiff > 0 && yDiff > 0)
            lineEndCorrection = [
              -lineWidth / (2 * lineWidthTickRatio * unitLength * sqrt2),
              -lineWidth / (2 * lineWidthTickRatio * unitLength * sqrt2),
            ];
          if (xDiff > 0 && yDiff < 0)
            lineEndCorrection = [
              -lineWidth / (2 * lineWidthTickRatio * unitLength * sqrt2),
              lineWidth / (2 * lineWidthTickRatio * unitLength * sqrt2),
            ];
          if (xDiff < 0 && yDiff > 0)
            lineEndCorrection = [
              lineWidth / (2 * lineWidthTickRatio * unitLength * sqrt2),
              -lineWidth / (2 * lineWidthTickRatio * unitLength * sqrt2),
            ];
          if (xDiff < 0 && yDiff < 0)
            lineEndCorrection = [
              lineWidth / (2 * lineWidthTickRatio * unitLength * sqrt2),
              lineWidth / (2 * lineWidthTickRatio * unitLength * sqrt2),
            ];
        }
      }

      points = [
        [
          xScale(currNode.coords[0] + shiftCoords[0]),
          yScale(currNode.coords[1] + shiftCoords[1]),
        ],
        [
          xScale(nextNode.coords[0] + shiftCoords[0] + lineEndCorrection[0]),
          yScale(nextNode.coords[1] + shiftCoords[1] + lineEndCorrection[1]),
        ],
      ];

      if (xDiff == 0 || yDiff == 0) {
        lastSectionType = 'udlr';
        path += 'L' + points[1][0] + ',' + points[1][1];
      } else if (Math.abs(xDiff) == Math.abs(yDiff) && Math.abs(xDiff) > 1) {
        lastSectionType = 'diagonal';
        path += 'L' + points[1][0] + ',' + points[1][1];
      } else if (Math.abs(xDiff) == 1 && Math.abs(yDiff) == 1) {
        direction = nextNode.dir.toLowerCase();

        switch (direction) {
          case 'e':
            path +=
              'Q' +
              points[1][0] +
              ',' +
              points[0][1] +
              ',' +
              points[1][0] +
              ',' +
              points[1][1];
            break;
          case 's':
            path +=
              'Q' +
              points[0][0] +
              ',' +
              points[1][1] +
              ',' +
              points[1][0] +
              ',' +
              points[1][1];
            break;
          case 'n':
            path +=
              'Q' +
              points[0][0] +
              ',' +
              points[1][1] +
              ',' +
              points[1][0] +
              ',' +
              points[1][1];
            break;
          case 'w':
            path +=
              'Q' +
              points[1][0] +
              ',' +
              points[0][1] +
              ',' +
              points[1][0] +
              ',' +
              points[1][1];
            break;
        }
      } else if (
        (Math.abs(xDiff) == 1 && Math.abs(yDiff) == 2) ||
        (Math.abs(xDiff) == 2 && Math.abs(yDiff) == 1)
      ) {
        var controlPoints;
        if (xDiff == 1) {
          if (lastSectionType == 'udlr') {
            controlPoints = [
              points[0][0],
              points[0][1] + (points[1][1] - points[0][1]) / 2,
            ];
          } else if (lastSectionType == 'diagonal') {
            controlPoints = [
              points[1][0],
              points[0][1] + (points[1][1] - points[0][1]) / 2,
            ];
          }
        } else if (xDiff == -1) {
          if (lastSectionType == 'udlr') {
            controlPoints = [
              points[0][0],
              points[0][1] + (points[1][1] - points[0][1]) / 2,
            ];
          } else if (lastSectionType == 'diagonal') {
            controlPoints = [
              points[1][0],
              points[0][1] + (points[1][1] - points[0][1]) / 2,
            ];
          }
        } else if (xDiff == -2) {
          if (lastSectionType == 'udlr') {
            controlPoints = [
              points[0][0] + (points[1][0] - points[0][0]) / 2,
              points[0][1],
            ];
          } else if (lastSectionType == 'diagonal') {
            controlPoints = [
              points[0][0] + (points[1][0] - points[0][0]) / 2,
              points[1][1],
            ];
          }
        } else if (xDiff == 2) {
          if (lastSectionType == 'udlr') {
            controlPoints = [
              points[0][0] + (points[1][0] - points[0][0]) / 2,
              points[0][1],
            ];
          } else if (lastSectionType == 'diagonal') {
            controlPoints = [
              points[0][0] + (points[1][0] - points[0][0]) / 2,
              points[1][1],
            ];
          }
        }

        path +=
          'C' +
          controlPoints[0] +
          ',' +
          controlPoints[1] +
          ',' +
          controlPoints[0] +
          ',' +
          controlPoints[1] +
          ',' +
          points[1][0] +
          ',' +
          points[1][1];
      }
    } else {
      nextNode = lineNodes[lineNode + 1];
      currNode = lineNodes[lineNode];

      xDiff = Math.round(currNode.coords[0] - nextNode.coords[0]);
      yDiff = Math.round(currNode.coords[1] - nextNode.coords[1]);

      var lineStartCorrection = [0, 0];

      if (xDiff == 0 || yDiff == 0) {
        if (xDiff > 0)
          lineStartCorrection = [
            lineWidth / (2 * lineWidthTickRatio * unitLength),
            0,
          ];
        if (xDiff < 0)
          lineStartCorrection = [
            -lineWidth / (2 * lineWidthTickRatio * unitLength),
            0,
          ];
        if (yDiff > 0)
          lineStartCorrection = [
            0,
            lineWidth / (2 * lineWidthTickRatio * unitLength),
          ];
        if (yDiff < 0)
          lineStartCorrection = [
            0,
            -lineWidth / (2 * lineWidthTickRatio * unitLength),
          ];
      } else {
        if (xDiff > 0 && yDiff > 0)
          lineStartCorrection = [
            lineWidth / (2 * lineWidthTickRatio * unitLength * sqrt2),
            lineWidth / (2 * lineWidthTickRatio * unitLength * sqrt2),
          ];
        if (xDiff > 0 && yDiff < 0)
          lineStartCorrection = [
            lineWidth / (2 * lineWidthTickRatio * unitLength * sqrt2),
            -lineWidth / (2 * lineWidthTickRatio * unitLength * sqrt2),
          ];
        if (xDiff < 0 && yDiff > 0)
          lineStartCorrection = [
            -lineWidth / (2 * lineWidthTickRatio * unitLength * sqrt2),
            lineWidth / (2 * lineWidthTickRatio * unitLength * sqrt2),
          ];
        if (xDiff < 0 && yDiff < 0)
          lineStartCorrection = [
            -lineWidth / (2 * lineWidthTickRatio * unitLength * sqrt2),
            -lineWidth / (2 * lineWidthTickRatio * unitLength * sqrt2),
          ];
      }

      points = [
        xScale(currNode.coords[0] + shiftCoords[0] + lineStartCorrection[0]),
        yScale(currNode.coords[1] + shiftCoords[1] + lineStartCorrection[1]),
      ];

      path += 'M' + points[0] + ',' + points[1];
    }
  }

  return path;
}
