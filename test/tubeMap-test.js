var tape = require("tape"),
    bumpsChart = require("../");

tape("setup() a valid svg element", function(test) {
  test.doesNotThrow(tubeMap.tubeMap().setup, "");
  test.end();
});
