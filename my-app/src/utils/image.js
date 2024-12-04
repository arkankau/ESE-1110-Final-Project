const fs = require('fs').promises;
const sharp = require('sharp');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const { saveImageWithQRCode, getImageByQRCode, getNextValidQRCode } = require('./database');
const { processImage } = require('../main/detection');

// Check if a file exists
async function checkFileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

// Generate a .txt file filled with 1s based on the pixel dimensions of the image
async function generateTextFileFromImage(imagePath) {
  try {
    const { width, height } = await sharp(imagePath).metadata();
    const roundedHeight = Math.ceil(height / 7.5);
    const roundedWidth = Math.ceil(width / 7.5);
    const content = Array.from({ length: roundedHeight }, () => '1'.repeat(roundedWidth)).join('\n');
        const textFilePath = path.join(
      path.dirname(imagePath),
      path.basename(imagePath, path.extname(imagePath)) + '.txt'
    );
    await fs.writeFile(textFilePath, content);
    return textFilePath;
  } catch (error) {
    console.error('Error generating text file from image:', error);
    throw error;
  }
}


// Scan image for QR codes and process accordingly
async function scanImageForQRCode(imagePath) {
  try {
    let detectedQRCode = null;

    if (!(await checkFileExists(imagePath))) {
      console.error(`File not found: ${imagePath}`);
      throw new Error(`File not found: ${imagePath}`);
    }

    const imageBuffer = await fs.readFile(imagePath);

    const form = new FormData();

form.append('file', imageBuffer, {
  filename: path.basename(imagePath),
  contentType: 'image/jpeg',
});

const response = await axios.post('http://api.qrserver.com/v1/read-qr-code/', form, {
  headers: { ...form.getHeaders() },
});

const result = response.data;
if (result?.[0]?.symbol?.[0]?.data) {
  detectedQRCode = result[0].symbol[0].data;
  console.log('QR Code Detected:', detectedQRCode);
}

if (detectedQRCode) {
  const imageRecord = await getImageByQRCode(detectedQRCode);
  if (imageRecord) {
    console.log(`Existing QR code found: ${detectedQRCode}`);
    return {
      success: true,
      qrCode: imageRecord.id,
      new: false,
      message: `QR code found in database.`,
      textFilePath: imageRecord.text_file_blob // Return the associated text file
    };
  } else {
    console.log('QR code not found in the database. Generating a new QR code.');
    return await handleNewQRCode(imagePath);
  }
} else {
  console.log('No QR code detected. Generating a new QR code.');
  return await handleNewQRCode(imagePath);
}
} catch (error) {
console.error('Error in scanImageForQRCode:', error);
return { success: false, error: error.message };
}
}


// Handle new QR code generation
async function handleNewQRCode(imagePath) {
  const textFilePath = await generateTextFileFromImage(imagePath);
  const imageBuffer = await fs.readFile(imagePath);
  const textFileBuffer = await fs.readFile(textFilePath);

  const qrCode = await getNextValidQRCode();
  const id = await saveImageWithQRCode(
    path.basename(imagePath),
    imageBuffer,
    textFileBuffer
  );

  return {
    success: true,
    qrCode,
    new: true,
    message: `Generated a new QR code: ${qrCode}`,
    textFilePath // Return the new text file path
  };
}

// Export functions
module.exports = {
  checkFileExists,
  generateTextFileFromImage,
  scanImageForQRCode,
  handleNewQRCode,
};