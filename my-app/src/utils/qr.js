// src/utils/qr.js
const qrCode = require('qrcode');
const { saveImageWithQRCode, getImageByQRCode, getNextQRCode } = require('./database');

// Generate a QR code
async function createQRCode(data) {
  try {
    const qrCodeData = data || `QR-${Date.now()}`; // Use provided data or fallback
    const qrCodeImage = await qrCode.toDataURL(qrCodeData); // Generate QR code image as Base64
    return { qrCodeData, qrCodeImage };
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
}

// Process and save an image with a new or existing QR code
async function processImage(filename, scannedQRCode, textFile) {
  try {
    if (scannedQRCode) {
      const existingImage = await getImageByQRCode(scannedQRCode);
      if (existingImage) {
        console.log('Existing QR code found:', scannedQRCode);
        return { filename, qrCode: scannedQRCode, new: false }; // Return existing data
      } else {
        console.log('No matching QR code found in the database for:', scannedQRCode);
      }
    } else {
      console.log('No QR code scanned from the image.');
    }

    // Generate a new QR code if none exists
    const nextQRCode = await getNextQRCode();
    await saveImageWithQRCode(filename, nextQRCode, textFile);
    console.log('New QR code generated and saved:', nextQRCode);
    return { filename, qrCode: nextQRCode, new: true };

  } catch (error) {
    console.error('Error processing image:', error);
    throw error;
  }
}

module.exports = {
  createQRCode,
  processImage,
};