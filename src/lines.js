function Lines(lines) {
  this.lines = lines;
}

Lines.prototype.highlightLine = function(name) {
  this.lines.forEach(function(line) {
    if (line.name === name) {
      line.highlighted = true;
    }
  });
};

Lines.prototype.unhighlightLine = function(name) {
  this.lines.forEach(function(line) {
    if (line.name === name) {
      line.highlighted = false;
    }
  });
};

export default function(lines) {
  return new Lines(lines);
}
