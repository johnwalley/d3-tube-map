var tape = require('tape');
var jsdom = require('jsdom');
var beautify_html = require('js-beautify').html;
var fs = require('fs');
var path = require('path');
var d3 = Object.assign({}, require('d3-selection'), require('../'));

tape('map() does not throw', function (test) {
  test.doesNotThrow(d3.tubeMap, '');
  test.end();
});

tape('map(selection) produces the expected result for map.json', function (test) {
  test.equal(
    actualHtml(readFile(testFilePath('map.json'))),
    expectedHtml(readFile(testFilePath('map.html')))
  );
  test.end();
});

tape('map(selection) produces the expected result for london-tube.json', function (test) {
  // Uncomment to replace the expected HTML content:
  // saveBaselineHtml(exampleFilePath('london-tube.json'), testFilePath('london-tube.html'));
  test.equal(
    actualHtml(readFile(exampleFilePath('london-tube.json'))),
    expectedHtml(readFile(testFilePath('london-tube.html')))
  );
  test.end();
});

tape('map(selection) produces the expected result for pubs.json', function (test) {
  // Uncomment to replace the expected HTML content:
  // saveBaselineHtml(exampleFilePath('pubs.json'), testFilePath('pubs.html'));
  test.equal(
    actualHtml(readFile(exampleFilePath('pubs.json'))),
    expectedHtml(readFile(testFilePath('pubs.html')))
  );
  test.end();
});

tape('map(selection) produces the expected result for minimal.json', function (test) {
  // Uncomment to replace the expected HTML content:
  // saveBaselineHtml(exampleFilePath('minimal.json'), testFilePath('minimal.html'));
  test.equal(
    actualHtml(readFile(exampleFilePath('minimal.json'))),
    expectedHtml(readFile(testFilePath('minimal.html')))
  );
  test.end();
});

/**
 * Return the expected outer HTML content from a given HTML file.
 */
function expectedHtml(htmlFile) {
  return (new jsdom.JSDOM(htmlFile).window.document.body).outerHTML;
}

/**
 * Return the generated HTML content from a given JSON network definition.
 */
function actualHtml(jsonFile) {
  var body = new jsdom.JSDOM('<!DOCTYPE html><div></div>').window.document.body;

  global.SVGElement = function () {};

  var data = JSON.parse(jsonFile);

  d3.select(body).select('div').datum(data).call(d3.tubeMap());
  return body.outerHTML;
}

/**
 * Return the path to a file in the 'test' directory.
 */
function testFilePath(filename) {
  return path.join(__dirname, filename);
}

/**
 * Return the path to a file in the `example` directory.
 */
function exampleFilePath(filename) {
  return path.join(__dirname, "..", "example", filename);
}

/**
 * Read a file from the given path.
 */
function readFile(path) {
  return fs
    .readFileSync(path, 'utf8')
    .replace(/\n\s*/gm, '');
}

/**
 * Write data to a given file path.
 */
function writeFile(path, data) {
  return fs
    .writeFileSync(path, data);
}

/**
 * Save the HTML output from parsing a JSON defined network as the basis for a regression test.
 */
function saveBaselineHtml(jsonInPath, htmlOutPath) {
  writeFile(
    htmlOutPath,
    beautify_html(
      actualHtml(readFile(jsonInPath)),
      {indent_size: 2}
    )
  );
}
