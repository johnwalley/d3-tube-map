#!/usr/bin/env node
var PDFDocument = require('pdfkit');
var fs = require('fs');
var jsdom = require('jsdom');
var path = require('path');
var d3 = Object.assign({}, require('d3-selection'), require('../'));

var dom = new jsdom.JSDOM('<!DOCTYPE html><div></div>');

global.SVGElement = function() {};

var data = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../example/pubs.json'), 'utf8')
);

var metadata = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../cambridge-pub-map.json'), 'utf8')
);

var width = 841.89;
var height = 595.28;

d3.select(dom.window.document.body)
  .select('div')
  .datum(data)
  .call(
    d3
      .tubeMap()
      .width(width * 0.85)
      .height(height)
      .margin({
        top: 80,
        right: 80,
        bottom: 0,
        left: 80,
      })
  );

const date = 'January 2019';

var doc = new PDFDocument({
  size: [height, width],
  layout: 'landscape',
  margin: 0,
  info: { Title: `Cambridge Pub Map - ${date}`, Author: 'John Walley' },
});

doc.pipe(fs.createWriteStream('cambridge-pub-map.pdf'));

doc.font('./util/HammersmithOne.ttf');

doc.rect(0, 0, width, 40).fill('#1e4292');
doc
  .fontSize(18)
  .fillColor('white')
  .strokeColor('white')
  .lineWidth(18 * 0.03)
  .text('Cambridge pub map', 20, 10, { fill: true, stroke: true });

doc
  .fontSize(12)
  .fillColor('#10137E')
  .text('www.pubmap.co.uk', 0, height - 18, {
    width: width,
    align: 'center',
  });

doc
  .fontSize(10)
  .fillColor('#10137E')
  .text(`© John Walley ${date}`, width - 220, height - 18, {
    width: 200,
    align: 'right',
  });

doc
  .lineWidth(0.4)
  .strokeColor('#00B3F0')
  .rect(20, 60, 670, 480);

[0, 1, 2, 3, 4, 5, 6, 7].forEach((num, i) => {
  doc
    .lineWidth(0.01)
    .strokeColor('#00B3F0')
    .moveTo(20 + ((i + 1) * 670) / 9, 60)
    .lineTo(20 + ((i + 1) * 670) / 9, 540)
    .stroke();
});

[0, 1, 2, 3, 4].forEach((num, i) => {
  doc
    .lineWidth(0.01)
    .strokeColor('#00B3F0')
    .moveTo(20, 60 + ((i + 1) * 480) / 6)
    .lineTo(690, 60 + ((i + 1) * 480) / 6)
    .stroke();
});

// Clip to map rectangle
doc.save();
doc.rect(20, 60, 670, 480).clip();

doc.fontSize(7);
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

  doc.text(
    label.innerHTML,
    bbox.x,
    bbox.y + 8.2 * parseFloat(label.getAttribute('dy').slice(0, -2)),
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

doc.restore();

const keyTop = 414;
const keyLeft = 700;
const keyGap = 12;

const numPubsInFirstColumn = 45;

doc
  .fontSize(10)
  .fillColor('#10137E')
  .text('Index to pubs', keyLeft, 60);

Object.values(data.stations)
  .sort((a, b) => {
    if (a.label < b.label) {
      return -1;
    }
    if (a.label > b.label) {
      return 1;
    }
    return 0;
  })
  .forEach((line, i) => {
    doc
      .fontSize(5)
      .fillColor('#10137E')
      .text(
        `${'ABCDEFGHI'[Math.floor(9 * Math.random())]}${Math.ceil(
          9 * Math.random()
        )}`,
        keyLeft + (i > numPubsInFirstColumn ? 70 : 0),
        60 +
          20 +
          7 * (i > numPubsInFirstColumn ? i - numPubsInFirstColumn - 1 : i)
      );

    doc
      .fontSize(5)
      .fillColor('#10137E')
      .text(
        line.label.replace(/\n/g, ' '),
        keyLeft + 10 + (i > numPubsInFirstColumn ? 70 : 0),
        60 +
          20 +
          7 * (i > numPubsInFirstColumn ? i - numPubsInFirstColumn - 1 : i)
      );
  });

doc
  .lineWidth(0.8)
  .strokeColor('#00B3F0')
  .moveTo(keyLeft, keyTop)
  .lineTo(keyLeft + 120, keyTop)
  .stroke();

doc
  .lineWidth(0.8)
  .strokeColor('#00B3F0')
  .moveTo(keyLeft, keyTop + 126)
  .lineTo(keyLeft + 120, keyTop + 126)
  .stroke();

doc
  .fontSize(10)
  .fillColor('#10137E')
  .text('Key to lines', keyLeft, keyTop + 10);

data.lines
  .sort((a, b) => {
    if (a.label < b.label) {
      return -1;
    }
    if (a.label > b.label) {
      return 1;
    }
    return 0;
  })
  .forEach((line, i) => {
    doc
      .lineWidth(3)
      .strokeColor(line.color)
      .moveTo(keyLeft, keyTop + 30 + keyGap * i)
      .lineTo(keyLeft + 60, keyTop + 30 + keyGap * i)
      .stroke();

    doc
      .fontSize(8)
      .fillColor('#10137E')
      .text(line.label, keyLeft + 68, keyTop + 25 + keyGap * i);
  });

doc.end();

console.log('Successfully wrote file to ./cambridge-pub-map.pdf');
