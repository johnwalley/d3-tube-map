# d3-tube-map

[![Build Status](https://travis-ci.org/johnwalley/d3-tube-map.svg?branch=master)](https://travis-ci.org/johnwalley/d3-tube-map)

Draw tube maps in the style of the London Underground using d3.

See a demo on [bl.ocks.org](https://bl.ocks.org/johnwalley/9b6d8af7a209b95c5b9dff99073db420) or [Observable](https://observablehq.com/@johnwalley/d3-tube-map).

![Screenshot](https://user-images.githubusercontent.com/981531/34120207-c26283f4-e41c-11e7-9683-e772f7bd308d.png)

A word of warning. This was created to scratch my own itch ([Cambridge Pub Map](https://www.pubmap.co.uk)). It works, but can be difficult to work with. That said, here are examples of other people creating awesome visualizations:

- [Lisbon Schematic Metro Map](https://github.com/Joao-Pedrosa/GSDB)
- [Berlin U-Bahn Map](https://github.com/skamsie/berlin-ubahn-map)

## Installing

If you use NPM, `npm install d3-tube-map`. Otherwise, download the
[latest release](https://github.com/johnwalley/d3-tube-map/releases/latest).
AMD, CommonJS, and vanilla environments are supported. In vanilla, a `d3` global
is exported:

```html
<script src="https://d3js.org/d3.v6.js"></script>
<script src="../dist/d3-tube-map.js"></script>

<script>
  var container = d3.select('#tube-map');

  var width = 1600;
  var height = 1024;

  var map = d3
    .tubeMap()
    .width(width)
    .height(height)
    .margin({
      top: height / 50,
      right: width / 7,
      bottom: height / 10,
      left: width / 7,
    });

  d3.json('./pubs.json').then(function (data) {
    container.datum(data).call(map);
  });
</script>
```

## API Reference

<a name="tubeMap" href="#tubeMap">#</a> d3.<b>tubeMap</b>()
[<>](https://github.com/johnwalley/d3-tube-map/blob/master/src/map.js#7 'Source')

Constructs a new tube map generator with the default settings.

<a name="_tubeMap" href="#_tubeMap">#</a> <i>tubeMap</i>(<i>selection</i>)
[<>](https://github.com/johnwalley/d3-tube-map/blob/master/src/map.js#L22 'Source')

Render the tube map to the given _selection_, which is a
[selection](https://github.com/d3/d3-selection).

<a name="tubeMap_width" href="#tubeMap_width">#</a>
<i>tubeMap</i>.<b>width</b>(<i>w</i>)
[<>](https://github.com/johnwalley/d3-tube-map/blob/master/src/map.js#L101 'Source')

Sets the width of the viewbox the map is rendered to.

<a name="tubeMap_height" href="#tubeMap_height">#</a>
<i>tubeMap</i>.<b>height</b>(<i>h</i>)
[<>](https://github.com/johnwalley/d3-tube-map/blob/master/src/map.js#L107 'Source')

Sets the height of the viewbox the map is rendered to.

<a name="tubeMap_margin" href="#tubeMap_margin">#</a>
<i>tubeMap</i>.<b>margin</b>(<i>m</i>)
[<>](https://github.com/johnwalley/d3-tube-map/blob/master/src/map.js#L113 'Source')

Sets the margin around the map. Takes an object of the following form:

```
{ top: 10, right: 20, bottom: 10, left: 20 }
```

## Input Data Format

The data passed to the tube map should have the following properties: `stations`, `lines` and optionally `river`. A minimal example is shown below.

```
{
  "stations": {
    "StationA": {
      "label": "Station A"
    },
    "StationB": {
      "label": "Station B"
    }
  },
  "lines": [
    {
      "name": "LineA",
      "color": "#FF0000",
      "shiftCoords": [0, 0],
      "nodes": [
        {
          "coords": [23, -4],
          "name": "StationA",
          "labelPos": "N"
        },
        {
          "coords": [30, -4]
        },
        {
          "coords": [31, -3],
        },
        {
          "coords": [31, 2],
          "name": "StationB",
          "labelPos": "E"
        }
      ]
    }
  ]
}
```

`stations` is an object where each property is a a station with the key being a unique identifier and the value being an object with a label property. The label is the display friendly text that will be rendered to the screen.

`lines` is an array of `line` objects. Each `line` must have the following:

- `name` will be used as the `id` of the `svg` `path` element
- `color` is simply the color of the line
- `shiftCoords` will translate the whole line in the x and y directions
- `nodes` is an array of nodes which define the layout of the line

A `line` may optionally also define:

- `shiftNormal` will offset the line along the direction of its normal vector

Each node must have the following:

- `coords` is the position of the node. Must be integer values
- `name` should be present if the node represents a station. It should match a station defined in the top-level `stations` property
- `labelPos` should be present if the node represents a station. It is a compass direction and determines where the label is positioned relative to the node, e.g. NE would place the label up and to the right of the node

### Corners

Two types of corner are supported: a 90 degree turn and a 45 degree turn. The latter is recognised when the position of a node differs from the position of the previous node by either:

- 1 in the x direction and 2 in the y direction
- 2 in the x direction and 1 in the y direction

For example:

```
[
  {
    "coords": [-27, -11]
  },
  {
    "coords": [-26, -9]
  }
]
```

A 90 degree turn is recognised when the position of a node differs from the position of the previous node by:

- 1 in the x direction and 1 in the y direction

For example:

```
[
  {
    "coords": [0, 2]
  },
  {
    "coords": [1, 1],
  }
]
```
