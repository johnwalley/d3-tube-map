import * as d3 from 'd3';
import { line, station, interchange, populateLineDirections } from './curve';
import { normalize, directionVector, interchangeShift } from './directions';
import lineList from './lines';
import stationList from './stations';

export default function () {
  var margin = { top: 80, right: 80, bottom: 20, left: 80 };
  var width = 760;
  var height = 640;
  var xScale = d3.scaleLinear();
  var yScale = d3.scaleLinear();
  var lineWidth;
  var lineWidthMultiplier = 0.8;
  var lineWidthTickRatio = 3 / 2;
  var svg;
  var _data;
  var gMap;

  var listeners = d3.dispatch('click');

  function map(selection) {
    selection.each(function (data) {
      _data = transformData(data);

      var minX =
        d3.min(_data.raw, function (line) {
          return d3.min(line.nodes, function (node) {
            return node.coords[0];
          });
        }) - 1;

      var maxX =
        d3.max(_data.raw, function (line) {
          return d3.max(line.nodes, function (node) {
            return node.coords[0];
          });
        }) + 1;

      var minY =
        d3.min(_data.raw, function (line) {
          return d3.min(line.nodes, function (node) {
            return node.coords[1];
          });
        }) - 1;

      var maxY =
        d3.max(_data.raw, function (line) {
          return d3.max(line.nodes, function (node) {
            return node.coords[1];
          });
        }) + 1;

      var desiredAspectRatio = (maxX - minX) / (maxY - minY);
      var actualAspectRatio =
        (width - margin.left - margin.right) /
        (height - margin.top - margin.bottom);

      var ratioRatio = actualAspectRatio / desiredAspectRatio;
      var maxXRange;
      var maxYRange;

      // Note that we flip the sense of the y-axis here
      if (desiredAspectRatio > actualAspectRatio) {
        maxXRange = width - margin.left - margin.right;
        maxYRange = (height - margin.top - margin.bottom) * ratioRatio;
      } else {
        maxXRange = (width - margin.left - margin.right) / ratioRatio;
        maxYRange = height - margin.top - margin.bottom;
      }

      xScale.domain([minX, maxX]).range([margin.left, margin.left + maxXRange]);
      yScale.domain([minY, maxY]).range([margin.top + maxYRange, margin.top]);

      var unitLength = Math.abs(
        xScale(1) - xScale(0) !== 0
          ? xScale(1) - xScale(0)
          : yScale(1) - yScale(0)
      );

      lineWidth = lineWidthMultiplier * unitLength;

      svg = selection
        .append('svg')
        .style('width', '100%')
        .style('height', '100%');

      gMap = svg.append('g');

      if (_data.river !== undefined) {
        drawRiver();
      }

      drawLines();
      drawInterchanges();
      drawStations();
      drawLabels();
    });
  }

  map.width = function (w) {
    if (!arguments.length) return width;
    width = w;
    return map;
  };

  map.height = function (h) {
    if (!arguments.length) return height;
    height = h;
    return map;
  };

  map.margin = function (m) {
    if (!arguments.length) return margin;
    margin = m;
    return map;
  };

  map.on = function () {
    var value = listeners.on.apply(listeners, arguments);
    return value === listeners ? map : value;
  };

  function drawRiver() {
    gMap
      .append('g')
      .attr('class', 'river')
      .selectAll('path')
      .data([_data.river])
      .enter()
      .append('path')
      .attr('d', function (d) {
        return line(d, xScale, yScale, lineWidth, lineWidthTickRatio);
      })
      .attr('stroke', '#CCECF4')
      .attr('fill', 'none')
      .attr('stroke-width', 1.8 * lineWidth);
  }

  function drawLines() {
    gMap
      .append('g')
      .attr('class', 'lines')
      .selectAll('path')
      .data(_data.lines.lines)
      .enter()
      .append('path')
      .attr('d', function (d) {
        return line(d, xScale, yScale, lineWidth, lineWidthTickRatio);
      })
      .attr('id', function (d) {
        return d.name;
      })
      .attr('stroke', function (d) {
        return d.color;
      })
      .attr('fill', 'none')
      .attr('stroke-width', function (d) {
        return d.highlighted ? lineWidth * 1.3 : lineWidth;
      })
      .classed('line', true);
  }

  function drawInterchanges() {
    var fgColor = '#000000';
    var bgColor = '#ffffff';

    gMap
      .append('g')
      .attr('class', 'interchanges')
      .selectAll('path')
      .data(_data.stations.interchanges())
      .enter()
      .append('g')
      .attr('id', function (d) {
        return d.name;
      })
      .on('click', function () {
        var label = d3.select(this);
        var name = label.attr('id');
        listeners.call('click', this, name);
      })
      .append('path')
      .attr('d', interchange(lineWidth))
      .attr('transform', function (d) {
        let shiftNormal = interchangeShift(d.marker);
        return (
          'translate(' +
          xScale(
            d.x + (shiftNormal[0] + d.marker[0].shiftX) * lineWidthMultiplier
          ) +
          ',' +
          yScale(
            d.y + (shiftNormal[1] + d.marker[0].shiftY) * lineWidthMultiplier
          ) +
          ')'
        );
      })
      .attr('stroke-width', lineWidth / 2)
      .attr('fill', function (d) {
        return d.visited ? fgColor : bgColor;
      })
      .attr('stroke', function (d) {
        return d.visited ? bgColor : fgColor;
      })
      .classed('interchange', true)
      .style('cursor', 'pointer');
  }

  function drawStations() {
    gMap
      .append('g')
      .attr('class', 'stations')
      .selectAll('path')
      .data(_data.stations.normalStations())
      .enter()
      .append('g')
      .attr('id', function (d) {
        return d.name;
      })
      .on('click', function () {
        var label = d3.select(this);
        var name = label.attr('id');
        listeners.call('click', this, name);
      })
      .append('path')
      .attr('d', function (d) {
        return station(
          d,
          xScale,
          yScale,
          lineWidthMultiplier,
          lineWidthTickRatio
        );
      })
      .attr('stroke', function (d) {
        return d.color;
      })
      .attr('stroke-width', lineWidth / lineWidthTickRatio)
      .attr('fill', 'none')
      .attr('class', function (d) {
        return d.line;
      })
      .attr('id', function (d) {
        return d.name;
      })
      .classed('station', true);
  }

  function drawLabels() {
    gMap
      .append('g')
      .attr('class', 'labels')
      .selectAll('text')
      .data(_data.stations.toArray())
      .enter()
      .append('g')
      .attr('id', function (d) {
        return d.name;
      })
      .classed('label', true)
      .on('click', function () {
        var label = d3.select(this);
        var name = label.attr('id');
        listeners.call('click', this, name);
      })
      .append('text')
      .text(function (d) {
        return d.label;
      })
      .attr('fill', '#10137E')
      .attr('dy', 0)
      .attr('x', function (d) {
        let shiftX =
          d.labelShiftX +
          d.labelShiftNormal * normalize(directionVector(d.dir))[1];
        return xScale(d.x + shiftX * lineWidthMultiplier) + textPos(d).pos[0];
      })
      .attr('y', function (d) {
        let shiftY =
          d.labelShiftY -
          d.labelShiftNormal * normalize(directionVector(d.dir))[0];
        return yScale(d.y + shiftY * lineWidthMultiplier) - textPos(d).pos[1];
      })
      .attr('text-anchor', function (d) {
        return textPos(d).textAnchor;
      })
      .style('display', function (d) {
        return d.hide !== true ? 'block' : 'none';
      })
      .style('text-decoration', function (d) {
        return d.closed ? 'line-through' : 'none';
      })
      .style('font-size', 1.96 * lineWidth + 'px')
      .style('-webkit-user-select', 'none')
      .attr('class', function (d) {
        return d.marker
          .map(function (marker) {
            return marker.line;
          })
          .join(' ');
      })
      .classed('highlighted', function (d) {
        return d.visited;
      })
      .call(wrap, function (d) {
        return textPos(d).alignmentBaseline;
      });
  }

  function transformData(data) {
    data.lines.forEach((line) => populateLineDirections(line));
    if (data.river !== undefined) {
      populateLineDirections(data.river);
    }

    return {
      raw: data.lines,
      river: data.river,
      stations: extractStations(data),
      lines: extractLines(data.lines),
    };
  }

  function extractStations(data) {
    data.lines.forEach(function (line) {
      for (var node = 0; node < line.nodes.length; node++) {
        var d = line.nodes[node];

        if (!d.hasOwnProperty('name')) continue;

        if (!data.stations.hasOwnProperty(d.name))
          throw new Error('Cannot find station with key: ' + d.name);

        var station = data.stations[d.name];

        station.x = d.coords[0];
        station.y = d.coords[1];

        if (station.labelPos === undefined || d.hasOwnProperty('canonical')) {
          station.labelPos = d.labelPos;
          station.labelShiftX = d.hasOwnProperty('labelShiftCoords')
            ? d.labelShiftCoords[0]
            : d.hasOwnProperty('shiftCoords')
            ? d.shiftCoords[0]
            : line.shiftCoords[0];
          station.labelShiftY = d.hasOwnProperty('labelShiftCoords')
            ? d.labelShiftCoords[1]
            : d.hasOwnProperty('shiftCoords')
            ? d.shiftCoords[1]
            : line.shiftCoords[1];
          station.labelShiftNormal = line.hasOwnProperty('shiftNormal')
            ? line.shiftNormal
            : 0;
          station.dir = d.dir;
        }

        station.label = data.stations[d.name].label;
        station.position = data.stations[d.name].position;
        station.closed = data.stations[d.name].hasOwnProperty('closed')
          ? data.stations[d.name].closed
          : false;
        station.visited = false;

        if (!d.hide) {
          station.marker = station.marker || [];

          station.marker.push({
            line: line.name,
            color: line.color,
            labelPos: d.labelPos,
            dir: d.dir,
            marker: d.hasOwnProperty('marker') ? d.marker : 'station',
            shiftX: d.hasOwnProperty('shiftCoords')
              ? d.shiftCoords[0]
              : line.shiftCoords[0],
            shiftY: d.hasOwnProperty('shiftCoords')
              ? d.shiftCoords[1]
              : line.shiftCoords[1],
            shiftNormal: line.hasOwnProperty('shiftNormal')
              ? line.shiftNormal
              : 0,
          });
        }
      }
    });

    return stationList(data.stations);
  }

  function extractLines(data) {
    var lines = [];

    data.forEach(function (line) {
      var lineObj = {
        name: line.name,
        title: line.label,
        stations: [],
        color: line.color,
        shiftCoords: line.shiftCoords,
        shiftNormal: line.shiftNormal,
        nodes: line.nodes,
        highlighted: false,
      };

      lines.push(lineObj);

      for (var node = 0; node < line.nodes.length; node++) {
        var data = line.nodes[node];

        if (!data.hasOwnProperty('name')) continue;

        lineObj.stations.push(data.name);
      }
    });

    return lineList(lines);
  }

  function textPos(data) {
    var pos;
    var textAnchor;
    var alignmentBaseline;
    var offset = lineWidth * 1.8;

    var numLines = data.label.split(/\n/).length;

    var sqrt2 = Math.sqrt(2);

    switch (data.labelPos.toLowerCase()) {
      case 'n':
        pos = [0, 2.1 * lineWidth * (numLines - 1) + offset];
        textAnchor = 'middle';
        alignmentBaseline = 'baseline';
        break;
      case 'ne':
        pos = [offset / sqrt2, (lineWidth * (numLines - 1) + offset) / sqrt2];
        textAnchor = 'start';
        alignmentBaseline = 'baseline';
        break;
      case 'e':
        pos = [offset, 0];
        textAnchor = 'start';
        alignmentBaseline = 'middle';
        break;
      case 'se':
        pos = [offset / sqrt2, -offset / sqrt2];
        textAnchor = 'start';
        alignmentBaseline = 'hanging';
        break;
      case 's':
        pos = [0, -lineWidthMultiplier * offset];
        textAnchor = 'middle';
        alignmentBaseline = 'hanging';
        break;
      case 'sw':
        pos = [-offset / sqrt2, -offset / sqrt2];
        textAnchor = 'end';
        alignmentBaseline = 'hanging';
        break;
      case 'w':
        pos = [-offset, 0];
        textAnchor = 'end';
        alignmentBaseline = 'middle';
        break;
      case 'nw':
        pos = [
          -(lineWidth * (numLines - 1) + offset) / sqrt2,
          (lineWidth * (numLines - 1) + offset) / sqrt2,
        ];
        textAnchor = 'end';
        alignmentBaseline = 'baseline';
        break;
      default:
        break;
    }

    return {
      pos: pos,
      textAnchor: textAnchor,
      alignmentBaseline: alignmentBaseline,
    };
  }

  // Render line breaks for svg text
  function wrap(text, baseline) {
    text.each(function () {
      var text = d3.select(this);
      var lines = text.text().split(/\n/);

      var y = text.attr('y');
      var x = text.attr('x');
      var dy = parseFloat(text.attr('dy'));

      text
        .text(null)
        .append('tspan')
        .attr('x', x)
        .attr('y', y)
        .attr('dy', dy + 'em')
        .attr('dominant-baseline', baseline)
        .text(lines[0]);

      for (var lineNum = 1; lineNum < lines.length; lineNum++) {
        text
          .append('tspan')
          .attr('x', x)
          .attr('y', y)
          .attr('dy', lineNum * 1.1 + dy + 'em')
          .attr('dominant-baseline', baseline)
          .text(lines[lineNum]);
      }
    });
  }

  return map;
}
