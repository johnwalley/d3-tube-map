#!/usr/bin/env node
var PDFDocument = require('pdfkit');
var fs = require('fs');
var jsdom = require('jsdom');
var path = require('path');
var d3 = Object.assign({}, require('d3-selection'), require('../'));

var dom = new jsdom.JSDOM('<!DOCTYPE html><div></div>');
var bodyActual = dom.window.document.body;

global.SVGElement = function() {};

var data = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../example/pubs.json'), 'utf8')
);

var metadata = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../cambridge-pub-map.json'), 'utf8')
);

var width = 841.89;
var height = 595.28;

d3
  .select(dom.window.document.body)
  .select('div')
  .datum(data)
  .call(
    d3
      .tubeMap()
      .width(width)
      .height(height)
      .margin({
        top: 60,
        right: 80,
        bottom: 0,
        left: 50,
      })
  );

var doc = new PDFDocument({
  size: [height, width],
  layout: 'landscape',
  margin: 0,
  info: { Title: 'Cambridge Pub Map - January 2018', Author: 'John Walley' },
});

doc.pipe(fs.createWriteStream('cambridge-pub-map.pdf'));

doc.font('./util/HammersmithOne.ttf');

doc.rect(0, 0, width, 40).fill('#1e4292');
doc
  .fontSize(18)
  .fillColor('white')
  .text('Cambridge pub map', 20, 10);

doc
  .fontSize(12)
  .fillColor('#10137E')
  .text('www.pubmap.co.uk', 0, height - 18, {
    width: width,
    align: 'center',
  });

doc
  .fontSize(4.5)
  .fillColor('#10137E')
  .text('© John Walley 2018', width - 60, height - 12);

doc.fontSize(4.5);
doc.fillColor('#10137E');

var labels = dom.window.document.querySelectorAll('tspan');

var alignMap = {
  start: 'left',
  middle: 'center',
  end: 'right',
};

labels.forEach(label => {
  var bbox = metadata.find(d => d.name === label.parentElement.parentElement.id)
    .bbox;
  var align = alignMap[label.parentElement.getAttribute('text-anchor')];

  //doc.rect(bbox.x, bbox.y, bbox.width, bbox.height).stroke('black');
  doc.text(
    label.innerHTML,
    bbox.x,
    bbox.y + 4.5 * parseFloat(label.getAttribute('dy').slice(0, -2)),
    {
      width: bbox.width,
      align: align,
    }
  );
});

var rivers = dom.window.document
  .querySelector('.river')
  .querySelectorAll('path');

rivers.forEach(river => {
  doc
    .path(river.getAttribute('d'))
    .lineWidth(river.getAttribute('stroke-width'))
    .stroke(river.getAttribute('stroke'));
});

var lines = dom.window.document.querySelectorAll('.line');

lines.forEach(line => {
  doc
    .path(line.getAttribute('d'))
    .lineWidth(line.getAttribute('stroke-width'))
    .stroke(line.getAttribute('stroke'));
});

var stations = dom.window.document.querySelectorAll('.station');

stations.forEach(station => {
  doc
    .path(station.getAttribute('d'))
    .lineWidth(station.getAttribute('stroke-width'))
    .stroke(station.getAttribute('stroke'));
});

var interchanges = dom.window.document.querySelectorAll('.interchange');

var regex = /translate\((\d+.\d+),(\d+.\d+)\)/;

interchanges.forEach(interchange => {
  doc
    .translate(
      +regex.exec(interchange.getAttribute('transform'))[1],
      +regex.exec(interchange.getAttribute('transform'))[2]
    )
    .path(interchange.getAttribute('d'))
    .lineWidth(interchange.getAttribute('stroke-width'))
    .fillAndStroke(
      interchange.getAttribute('fill'),
      interchange.getAttribute('stroke')
    )
    .translate(
      -regex.exec(interchange.getAttribute('transform'))[1],
      -regex.exec(interchange.getAttribute('transform'))[2]
    );
});

doc.end();
