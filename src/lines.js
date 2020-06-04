function Lines(lines) {
  this.lines = lines;
}

export default function (lines) {
  return new Lines(lines);
}
