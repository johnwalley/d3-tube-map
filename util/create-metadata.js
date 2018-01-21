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
    return text.map(t => ({
      name: t.parentElement.id,
      x: t.getBBox().x,
      y: t.getBBox().y,
      width: t.getBBox().width,
      height: t.getBBox().height,
    }));
  });

  fs.writeFile(
    './cambridge-pub-map.json',
    JSON.stringify(
      metadata.map(x => ({
        ...x,
        label: json.stations[x.name].name,
      }))
    ),
    function() {
      console.log('Scccessfully wrote file to ./cambridge-pub-map.json');
    }
  );

  await browser.close();
})();
