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

const riversidePubs = [
  'Anchor',
  'Boathouse',
  'FortStGeorge',
  'Granta',
  'GreenDragon',
  'Mill',
];

const quizes = ['CarpentersArms', 'Dobblers', 'Petersfield'];

const riverIcon =
  'M562.1 383.9c-21.5-2.4-42.1-10.5-57.9-22.9-14.1-11.1-34.2-11.3-48.2 0-37.9 30.4-107.2 30.4-145.7-1.5-13.5-11.2-33-9.1-46.7 1.8-38 30.1-106.9 30-145.2-1.7-13.5-11.2-33.3-8.9-47.1 2-15.5 12.2-36 20.1-57.7 22.4-7.9.8-13.6 7.8-13.6 15.7v32.2c0 9.1 7.6 16.8 16.7 16 28.8-2.5 56.1-11.4 79.4-25.9 56.5 34.6 137 34.1 192 0 56.5 34.6 137 34.1 192 0 23.3 14.2 50.9 23.3 79.1 25.8 9.1.8 16.7-6.9 16.7-16v-31.6c.1-8-5.7-15.4-13.8-16.3zm0-144c-21.5-2.4-42.1-10.5-57.9-22.9-14.1-11.1-34.2-11.3-48.2 0-37.9 30.4-107.2 30.4-145.7-1.5-13.5-11.2-33-9.1-46.7 1.8-38 30.1-106.9 30-145.2-1.7-13.5-11.2-33.3-8.9-47.1 2-15.5 12.2-36 20.1-57.7 22.4-7.9.8-13.6 7.8-13.6 15.7v32.2c0 9.1 7.6 16.8 16.7 16 28.8-2.5 56.1-11.4 79.4-25.9 56.5 34.6 137 34.1 192 0 56.5 34.6 137 34.1 192 0 23.3 14.2 50.9 23.3 79.1 25.8 9.1.8 16.7-6.9 16.7-16v-31.6c.1-8-5.7-15.4-13.8-16.3zm0-144C540.6 93.4 520 85.4 504.2 73 490.1 61.9 470 61.7 456 73c-37.9 30.4-107.2 30.4-145.7-1.5-13.5-11.2-33-9.1-46.7 1.8-38 30.1-106.9 30-145.2-1.7-13.5-11.2-33.3-8.9-47.1 2-15.5 12.2-36 20.1-57.7 22.4-7.9.8-13.6 7.8-13.6 15.7v32.2c0 9.1 7.6 16.8 16.7 16 28.8-2.5 56.1-11.4 79.4-25.9 56.5 34.6 137 34.1 192 0 56.5 34.6 137 34.1 192 0 23.3 14.2 50.9 23.3 79.1 25.8 9.1.8 16.7-6.9 16.7-16v-31.6c.1-8-5.7-15.4-13.8-16.3z';

//var width = 576;
//var height = 512;

const questionIcon =
  'M202.021 0C122.202 0 70.503 32.703 29.914 91.026c-7.363 10.58-5.093 25.086 5.178 32.874l43.138 32.709c10.373 7.865 25.132 6.026 33.253-4.148 25.049-31.381 43.63-49.449 82.757-49.449 30.764 0 68.816 19.799 68.816 49.631 0 22.552-18.617 34.134-48.993 51.164-35.423 19.86-82.299 44.576-82.299 106.405V320c0 13.255 10.745 24 24 24h72.471c13.255 0 24-10.745 24-24v-5.773c0-42.86 125.268-44.645 125.268-160.627C377.504 66.256 286.902 0 202.021 0zM192 373.459c-38.196 0-69.271 31.075-69.271 69.271 0 38.195 31.075 69.27 69.271 69.27s69.271-31.075 69.271-69.271-31.075-69.27-69.271-69.27z';

//var width = 384;
//var height = 512;

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
        top: 100,
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

const MAP_WIDTH = 670;
const MAP_HEIGHT = 512;
const NUM_SQUARES_X = 8;
const NUM_SQUARES_Y = 6;

d3.range(NUM_SQUARES_X).forEach((num, i) => {
  doc
    .lineWidth(0.1)
    .strokeColor('#00B3F0')
    .moveTo(20 + ((i + 1) * MAP_WIDTH) / (NUM_SQUARES_X + 1), 60)
    .lineTo(20 + ((i + 1) * MAP_WIDTH) / (NUM_SQUARES_X + 1), MAP_HEIGHT + 60)
    .stroke();
});

d3.range(NUM_SQUARES_Y).forEach((num, i) => {
  doc
    .lineWidth(0.1)
    .strokeColor('#00B3F0')
    .moveTo(20, 60 + ((i + 1) * MAP_HEIGHT) / (NUM_SQUARES_Y + 1))
    .lineTo(MAP_WIDTH + 20, 60 + ((i + 1) * MAP_HEIGHT) / (NUM_SQUARES_Y + 1))
    .stroke();
});

// Clip to map rectangle
doc.save();
doc.rect(20, 60, MAP_WIDTH, MAP_HEIGHT).clip();

doc.fontSize(FONT_SIZE_PUB);
doc.fillColor('#10137E');

const labels = dom.window.document.querySelectorAll('tspan');

const alignMap = {
  start: 'left',
  middle: 'center',
  end: 'right',
};

labels.forEach(label => {
  const el = metadata.find(
    d => d.name === label.parentElement.parentElement.id
  );

  const bbox = el.bbox;
  const strike = el.strike;

  const align = alignMap[label.parentElement.getAttribute('text-anchor')];

  doc.text(
    label.innerHTML,
    bbox.x,
    bbox.y + 8.2 * parseFloat(label.getAttribute('dy').slice(0, -2)),
    {
      width: bbox.width,
      align: align,
      link: data.stations[label.parentElement.parentElement.id].website,
      strike,
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

const keyTop = MAP_HEIGHT - 66;
const keyLeft = MAP_WIDTH + 30;
const keyGap = 12;
const LEGEND_PUB_VERTICAL_OFFSET = 7;

const numPubsInFirstColumn = 50;

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
          'ABCDEFGH'[
            Math.floor(
              (metadata.find(x => x.name === line.name).y - 60) /
                (MAP_HEIGHT / (NUM_SQUARES_Y + 1))
            )
          ]
        }${Math.ceil(
          (metadata.find(x => x.name === line.name).x - 20) /
            (MAP_WIDTH / (NUM_SQUARES_X + 1))
        )}`,
        keyLeft + (i > numPubsInFirstColumn ? 70 : 0),
        60 +
          20 +
          LEGEND_PUB_VERTICAL_OFFSET *
            (i > numPubsInFirstColumn ? i - numPubsInFirstColumn - 1 : i)
      );

    doc
      .fontSize(FONT_SIZE_LEGEND_CONTENT)
      .fillColor('#10137E')
      .text(
        line.label.replace(/\n/g, ' '),
        keyLeft + 10 + (i > numPubsInFirstColumn ? 70 : 0),
        60 +
          20 +
          LEGEND_PUB_VERTICAL_OFFSET *
            (i > numPubsInFirstColumn ? i - numPubsInFirstColumn - 1 : i),
        { strike: line.closed, link: line.website }
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
  .lineWidth(0.4)
  .strokeColor('#00B3F0')
  .rect(20, 60, MAP_WIDTH, MAP_HEIGHT)
  .stroke();

doc
  .fontSize(8)
  .fillColor('#00B3F0')
  .strokeColor('white')
  .lineWidth(8 * 0.3);

d3.range(NUM_SQUARES_X + 1).forEach((num, i) => {
  doc.text(
    i + 1,
    20 - 2.5 + ((i + 0.5) * MAP_WIDTH) / (NUM_SQUARES_X + 1),
    60 - 4,
    {
      fill: false,
      stroke: true,
    }
  );

  doc.text(
    i + 1,
    20 - 2.5 + ((i + 0.5) * MAP_WIDTH) / (NUM_SQUARES_X + 1),
    60 - 4,
    {
      fill: true,
      stroke: false,
    }
  );
});

d3.range(NUM_SQUARES_Y + 1).forEach((num, i) => {
  doc.text(
    'ABCDEFG'[i],
    20 - 2.5,
    60 - 4 + ((i + 0.5) * MAP_HEIGHT) / (NUM_SQUARES_Y + 1),
    {
      fill: false,
      stroke: true,
    }
  );

  doc.text(
    'ABCDEFG'[i],
    20 - 2.5,
    60 - 4 + ((i + 0.5) * MAP_HEIGHT) / (NUM_SQUARES_Y + 1),
    {
      fill: true,
      stroke: false,
    }
  );
});

doc
  .fontSize(FONT_SIZE_COPYRIGHT)
  .fillColor('#10137E')
  .text(`© John Walley ${date}`, 25, MAP_HEIGHT + 50);

doc.end();

console.log('Successfully wrote file to ./cambridge-pub-map.pdf');
