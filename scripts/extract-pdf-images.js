const fs = require('fs');
const path = require('path');
const { pdf } = require('pdf-to-img');

async function extractImages() {
  const [,, pdfPath, outputDir, prefix] = process.argv;

  if (!pdfPath || !outputDir || !prefix) {
    console.error('Usage: node extract-pdf-images.js <pdfPath> <outputDir> <prefix>');
    process.exit(1);
  }

  try {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const buffer = fs.readFileSync(pdfPath);
    const pdfDoc = await pdf(buffer, { scale: 1.5 });
    
    let pageIndex = 0;
    const stats = [];

    for await (const pageImage of pdfDoc) {
      pageIndex++;
      const filename = `${prefix}_page${pageIndex}.png`;
      const fullPath = path.join(outputDir, filename);
      
      fs.writeFileSync(fullPath, pageImage);
      
      const fileStat = fs.statSync(fullPath);
      if (fileStat.size > 0) {
        stats.push({
          page: pageIndex,
          filename: filename,
          size: fileStat.size
        });
      } else {
        fs.unlinkSync(fullPath);
      }
    }

    console.log(JSON.stringify(stats));
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    process.exit(1);
  }
}

extractImages();
