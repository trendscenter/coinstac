const PDFDocument = require('pdfkit');
const fs = require('fs');
const kebabCase = require('lodash/kebabCase');
const path = require('path');
const { app } = require('electron');

function humanize(str) {
  let string = str;
  if (str.indexOf('_') > -1){
    const frags = str.split('_');
    for (let i = 0; i < frags.length; i += 1) {
      frags[i] = frags[i].charAt(0).toUpperCase() + frags[i].slice(1);
    }
    string = frags.join(' ');
  }
  string = string.replace('Beta', 'β ');
  return string;
}

function generateResultsPdf(title, localItems, globalItems, resultsPath, saveDirectory) {
  const doc = new PDFDocument();

  doc.pipe(fs.createWriteStream(`${saveDirectory}/${kebabCase(title)}.pdf`));

  const [firstLocalStat, ...restLocalStats] = localItems;
  const [firstGlobalStat, ...restGlobalStats] = globalItems;

  doc.font(path.join(app.isPackaged ? process.resourcesPath : app.getAppPath(), 'resources/fonts/Roboto-Regular.ttf')); // Embed font that support UTF-8 encoding

  if (localItems && localItems.length > 0){

    doc.fontSize(24).text('Local Stats', 10, 10);

    doc.fontSize(20).text(`Local stats - ${humanize(firstLocalStat)}`, 10, 60);
    doc.image(path.join(resultsPath, firstLocalStat), {
      fit: [400, 300],
      align: 'center',
      valign: 'center',
    });

    restLocalStats.forEach((localStatImg) => {
      if (fs.statSync(path.join(resultsPath, localStatImg), { throwIfNoEntry: false })) {
        doc
          .addPage()
          .fontSize(20)
          .text(`Local stats - ${humanize(localStatImg)}`, 10, 60)
          .image(path.join(resultsPath, localStatImg), {
            fit: [400, 300],
            align: 'center',
            valign: 'center',
          });
      }
    });
    doc.addPage();

  }

  if (globalItems && globalItems.length > 0){

    doc.fontSize(24).text('Global Stats', 10, 10);

    doc.fontSize(20).text(`Global stats - ${humanize(firstGlobalStat)}`, 10, 60);
    doc.image(path.join(resultsPath, firstGlobalStat), {
      fit: [400, 300],
      align: 'center',
      valign: 'center',
    });

    restGlobalStats.forEach((globalStatImg) => {
      doc
        .addPage()
        .fontSize(20)
        .text(`Global stats - ${humanize(globalStatImg)}`, 10, 60)
        .image(path.join(resultsPath, globalStatImg), {
          fit: [400, 300],
          align: 'center',
          valign: 'center',
        });
    });

  }

  return doc.end();
}
module.exports = {
  generateResultsPdf,
};
