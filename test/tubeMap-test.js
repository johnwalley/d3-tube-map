var tape = require("tape"),
    tubeMap = require("../");

tape("tubeMap() does not throw", function(test) {
  test.doesNotThrow(tubeMap.tubeMap(), "");
  test.end();
});
