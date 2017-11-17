var tape = require('tape');
var d3 = require('../');

tape('map() does not throw', function(test) {
  test.doesNotThrow(d3.tubeMap, '');
  test.end();
});
