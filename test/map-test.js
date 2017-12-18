var tape = require('tape');
var jsdom = require('jsdom');
var fs = require('fs');
var path = require('path');
var d3 = Object.assign({}, require('d3-selection'), require('../'));

tape('map() does not throw', function(test) {
  test.doesNotThrow(d3.tubeMap, '');
  test.end();
});

tape('map(selection) produces the expected result', function(test) {
  var bodyActual = new jsdom.JSDOM('<!DOCTYPE html><div></div>').window.document
    .body;

  global.SVGElement = function() {};

  var bodyExpected = new jsdom.JSDOM(file('map.html')).window.document.body;
  var data = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'map.json'), 'utf8')
  );

  d3
    .select(bodyActual)
    .select('div')
    .datum(data)
    .call(d3.tubeMap());

  test.equal(bodyActual.outerHTML, bodyExpected.outerHTML);
  test.end();
});

function file(file) {
  return fs
    .readFileSync(path.join(__dirname, file), 'utf8')
    .replace(/\n\s*/gm, '');
}
