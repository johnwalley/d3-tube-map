#!/usr/bin/env node
const PDFDocument = require('pdfkit');
const fs = require('fs');
const jsdom = require('jsdom');
const path = require('path');
const d3 = Object.assign({}, require('d3'), require('../'));

const FONT_SIZE_TITLE = 18;
const FONT_SIZE_COPYRIGHT = 6;
const FONT_SIZE_PUB = 7;
const FONT_SIZE_LEGEND_TITLE = 10;
const FONT_SIZE_LEGEND_CONTENT = 5;
const FONT_SIZE_LEGEND_LINES = 8;

const dom = new jsdom.JSDOM('<!DOCTYPE html><div></div>');

global.SVGElement = function() {};

const data = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../example/pubs.json'), 'utf8')
);

const metadata = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../cambridge-pub-map.json'), 'utf8')
);

// A4 landscape
const width = 841.89;
const height = 595.28;

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

const date = d3.timeFormat('%B %Y')(Date.now());

const doc = new PDFDocument({
  size: [height, width],
  layout: 'landscape',
  margin: 0,
  info: { Title: `Cambridge Pub Map - ${date}`, Author: 'John Walley' },
});

doc.pipe(fs.createWriteStream('cambridge-pub-map.pdf'));

doc.font('./util/HammersmithOne.ttf');

doc.rect(0, 0, width, 40).fill('#1e4292');

doc
  .fontSize(FONT_SIZE_TITLE)
  .fillColor('white')
  .strokeColor('white')
  .lineWidth(FONT_SIZE_TITLE * 0.03)
  .text('Cambridge pub map', 20, 10, {
    fill: true,
    stroke: true,
    link: 'https://www.pubmap.co.uk',
  });

doc
  .fontSize(FONT_SIZE_TITLE)
  .fillColor('white')
  .strokeColor('white')
  .lineWidth(FONT_SIZE_TITLE * 0.03)
  .text(
    'www.pubmap.co.uk',
    width - 20 - doc.widthOfString('www.pubmap.co.uk'),
    10,
    {
      fill: true,
      stroke: true,
      width: doc.widthOfString('www.pubmap.co.uk'),
      align: 'center',
      link: 'https://www.pubmap.co.uk',
    }
  );

doc
  .lineWidth(0.4)
  .strokeColor('#00B3F0')
  .rect(20, 60, 670, 480)
  .stroke();

d3.range(8).forEach((num, i) => {
  doc
    .lineWidth(0.1)
    .strokeColor('#00B3F0')
    .moveTo(20 + ((i + 1) * 670) / 9, 60)
    .lineTo(20 + ((i + 1) * 670) / 9, 540)
    .stroke();
});

d3.range(5).forEach((num, i) => {
  doc
    .lineWidth(0.1)
    .strokeColor('#00B3F0')
    .moveTo(20, 60 + ((i + 1) * 480) / 6)
    .lineTo(690, 60 + ((i + 1) * 480) / 6)
    .stroke();
});

// Clip to map rectangle
doc.save();
doc.rect(20, 60, 670, 480).clip();

doc.fontSize(FONT_SIZE_PUB);
doc.fillColor('#10137E');

const labels = dom.window.document.querySelectorAll('tspan');

const alignMap = {
  start: 'left',
  middle: 'center',
  end: 'right',
};

labels.forEach(label => {
  const bbox = metadata.find(
    d => d.name === label.parentElement.parentElement.id
  ).bbox;

  const align = alignMap[label.parentElement.getAttribute('text-anchor')];

  doc.text(
    label.innerHTML,
    bbox.x,
    bbox.y + 8.2 * parseFloat(label.getAttribute('dy').slice(0, -2)),
    {
      width: bbox.width,
      align: align,
      link: data.stations[label.parentElement.parentElement.id].website,
    }
  );
});

const rivers = dom.window.document
  .querySelector('.river')
  .querySelectorAll('path');

rivers.forEach(river => {
  doc
    .path(river.getAttribute('d'))
    .lineWidth(river.getAttribute('stroke-width'))
    .stroke(river.getAttribute('stroke'));
});

const lines = dom.window.document.querySelectorAll('.line');

lines.forEach(line => {
  doc
    .path(line.getAttribute('d'))
    .lineWidth(line.getAttribute('stroke-width'))
    .stroke(line.getAttribute('stroke'));
});

const stations = dom.window.document.querySelectorAll('.station');

stations.forEach(station => {
  doc
    .path(station.getAttribute('d'))
    .lineWidth(station.getAttribute('stroke-width'))
    .stroke(station.getAttribute('stroke'));
});

const interchanges = dom.window.document.querySelectorAll('.interchange');

const regex = /translate\((\d+.\d+),(\d+.\d+)\)/;

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
  .fontSize(FONT_SIZE_LEGEND_TITLE)
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
      .fontSize(FONT_SIZE_LEGEND_CONTENT)
      .fillColor('#10137E')
      .text(
        `${
          'ABCDEFGHI'[
            Math.floor(
              (metadata.find(x => x.name === line.name).y - 60) / (480 / 6)
            )
          ]
        }${Math.ceil(
          (metadata.find(x => x.name === line.name).x - 20) / (670 / 9)
        )}`,
        keyLeft + (i > numPubsInFirstColumn ? 70 : 0),
        60 +
          20 +
          7 * (i > numPubsInFirstColumn ? i - numPubsInFirstColumn - 1 : i)
      );

    doc
      .fontSize(FONT_SIZE_LEGEND_CONTENT)
      .fillColor('#10137E')
      .text(
        line.label.replace(/\n/g, ' '),
        keyLeft + 10 + (i > numPubsInFirstColumn ? 70 : 0),
        60 +
          20 +
          7 * (i > numPubsInFirstColumn ? i - numPubsInFirstColumn - 1 : i),
        { link: line.website }
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
  .fontSize(FONT_SIZE_LEGEND_TITLE)
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
      .fontSize(FONT_SIZE_LEGEND_LINES)
      .fillColor('#10137E')
      .text(line.label, keyLeft + 68, keyTop + 25 + keyGap * i);
  });

doc
  .fontSize(8)
  .fillColor('#00B3F0')
  .strokeColor('white')
  .lineWidth(8 * 0.3);

d3.range(9).forEach((num, i) => {
  doc.text(i + 1, 20 - 2.5 + ((i + 0.5) * 670) / 9, 60 - 4, {
    fill: false,
    stroke: true,
  });

  doc.text(i + 1, 20 - 2.5 + ((i + 0.5) * 670) / 9, 60 - 4, {
    fill: true,
    stroke: false,
  });
});

d3.range(6).forEach((num, i) => {
  doc.text('ABCDEF'[i], 20 - 2.5, 60 - 4 + ((i + 0.5) * 480) / 6, {
    fill: false,
    stroke: true,
  });

  doc.text('ABCDEF'[i], 20 - 2.5, 60 - 4 + ((i + 0.5) * 480) / 6, {
    fill: true,
    stroke: false,
  });
});

doc
  .fontSize(FONT_SIZE_COPYRIGHT)
  .fillColor('#10137E')
  .text(`© John Walley ${date}`, 22, 530);

doc.end();

console.log('Successfully wrote file to ./cambridge-pub-map.pdf');
