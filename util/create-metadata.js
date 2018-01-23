const fs = require('fs');
const puppeteer = require('puppeteer');

(async () => {
  var content = fs.readFileSync('cambridge-pub-map.svg', 'utf-8');
  var json = JSON.parse(fs.readFileSync('./example/pubs.json', 'utf-8'));

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(content);

  const metadata = await page.evaluate(() => {
    const text = [...document.querySelectorAll('text')];
    const stations = [...document.querySelectorAll('.station')];
    const interchanges = [...document.querySelectorAll('.interchange')];

    const regex = /translate\((\d+.\d+),(\d+.\d+)\)/;

    return {
      text: text.map(t => ({
        name: t.parentElement.id,
        bbox: {
          x: t.getBBox().x,
          y: t.getBBox().y,
          width: t.getBBox().width,
          height: t.getBBox().height,
        },
      })),
      stations: stations.map(s => ({
        name: s.id,
        x: s.getPointAtLength(0).x,
        y: s.getPointAtLength(0).y,
      })),
      interchanges: interchanges.map(i => ({
        name: i.parentElement.id,
        x: +regex.exec(i.getAttribute('transform'))[1],
        y: +regex.exec(i.getAttribute('transform'))[2],
      })),
    };
  });

  fs.writeFile(
    './cambridge-pub-map.json',
    JSON.stringify(
      metadata.text.map(x => ({
        ...x,
        ...metadata.stations.find(s => s.name === x.name),
        ...metadata.interchanges.find(i => i.name === x.name),
        label: json.stations[x.name].name,
      }))
    ),
    function() {
      console.log('Scccessfully wrote file to ./cambridge-pub-map.json');
    }
  );

  await browser.close();
})();
