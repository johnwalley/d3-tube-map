function Stations(stations) {
  this.stations = stations;
}

Stations.prototype.toArray = function() {
  var stations = [];

  for (var name in this.stations) {
    if (this.stations.hasOwnProperty(name)) {
      var station = this.stations[name];
      station.name = name;
      stations.push(station);
    }
  }

  return stations;
};

Stations.prototype.interchanges = function() {
  var interchangeStations = this.toArray();

  return interchangeStations.filter(function(station) {
    return station.marker[0].marker === 'interchange';
  });
};

Stations.prototype.normalStations = function() {
  var stations = this.toArray();

  var stationStations = stations.filter(function(station) {
    return station.marker[0].marker !== 'interchange';
  });

  var stationMarkers = [];

  stationStations.forEach(function(station) {
    station.marker.forEach(function(marker) {
      stationMarkers.push({
        name: station.name,
        line: marker.line,
        x: station.x,
        y: station.y,
        color: marker.color,
        shiftX: marker.shiftX,
        shiftY: marker.shiftY,
        labelPos: station.labelPos,
      });
    });
  });

  return stationMarkers;
};

Stations.prototype.visited = function() {
  var visitedStations = this.toArray();

  return visitedStations.filter(function(station) {
    return station.visited;
  });
};

Stations.prototype.visitedFriendly = function() {
  var visitedStations = this.visited();

  return visitedStations.map(function(station) {
    return station.title;
  });
};

Stations.prototype.isVisited = function(name) {
  return this.stations[name].visited;
};

export default function(stations) {
  return new Stations(stations);
}
