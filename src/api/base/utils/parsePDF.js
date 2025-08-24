const pdfParse = require('pdf-parse');

async function parsePDF(buffer) {
  try {
    const data = await pdfParse(buffer);
    // Process and structure the data as needed
    return data.text; // or any other processed form
  } catch (error) {
    throw new Error('Error parsing PDF: ' + error.message);
  }
}

module.exports = parsePDF;
