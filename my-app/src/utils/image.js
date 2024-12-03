// src/utils/image.js
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const axios = require('axios');
const { saveImageWithQRCode, getImageByQRCode, getNextValidQRCode } = require('./database');

const { processImage } = require('../main/detection'); // Correct the import path

// Check if a file exists
async function checkFileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

// Resize image to specified width and height
async function resizeImage(imagePath, width, height) {
  try {
    const resizedImageBuffer = await sharp(imagePath)
      .resize(width, height, { fit: 'inside' })
      .toBuffer();
    return resizedImageBuffer;
  } catch (error) {
    console.error('Error resizing image:', error);
    throw error;
  }
}

// Crop image based on coordinates
async function cropImage(imagePath, coordinates) {
  const [x1, y1, x2, y2, x3, y3, x4, y4] = coordinates;

  const minX = Math.min(x1, x2, x3, x4);
  const minY = Math.min(y1, y2, y3, y4);
  const maxX = Math.max(x1, x2, x3, x4);
  const maxY = Math.max(y1, y2, y3, y4);
  const width = maxX - minX;
  const height = maxY - minY;

  if (width <= 0 || height <= 0) {
    throw new Error('Invalid crop dimensions');
  }

  try {
    const outputPath = path.join(
      path.dirname(imagePath),
      'cropped-' + path.basename(imagePath)
    );
    await sharp(imagePath)
      .extract({
        left: Math.round(minX),
        top: Math.round(minY),
        width: Math.round(width),
        height: Math.round(height),
      })
      .toFile(outputPath);
    return { outputPath, width: Math.round(width), height: Math.round(height) };
  } catch (error) {
    console.error('Error cropping image:', error);
    throw error;
  }
}

// Generate a .txt file filled with 1s based on the dimensions
async function generateTextFile(width, height, filename) {
  const content = Array(height).fill('1'.repeat(width)).join('\n');
  const textFilePath = path.join(path.dirname(filename), path.basename(filename, path.extname(filename)) + '.txt');
  await fs.writeFile(textFilePath, content);
  return textFilePath;
}

// Convert image to Base64
async function imageToBase64(imagePath) {
  try {
    const imageBuffer = await sharp(imagePath).toBuffer();
    return imageBuffer.toString('base64');
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw error;
  }
}

// Scan image for QR codes and process accordingly

async function scanImageForQRCode(imagePath, isolatedImagePath) {
  try {
    // Check if the image file exists
    if (!(await checkFileExists(isolatedImagePath))) {
      console.error(`File not found: ${isolatedImagePath}`);
      throw new Error(`File not found: ${isolatedImagePath}`);
    }

    // Convert image to base64
    const imageBuffer = await sharp(isolatedImagePath).toBuffer();
    const base64Image = imageBuffer.toString('base64');

    // Send image to the QR code detection API
    const response = await axios({
      method: 'POST',
      url: 'https://detect.roboflow.com/qr-code-ee1km/3',
      params: { api_key: 'oXL7oM2JFameMYKDAJr2' },
      data: base64Image,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    const predictions = response.data?.predictions || [];
    let detectedQRCode = null;
    let coordinates = null;

    // Process predictions
    if (predictions.length > 0) {
      const bestPrediction = predictions.reduce((max, prediction) =>
        prediction.confidence > max.confidence ? prediction : max
      );
      detectedQRCode = bestPrediction.class;
      coordinates = bestPrediction.corners;
    }

    // Handle invalid or undefined QR codes
    if (!detectedQRCode || detectedQRCode.trim() === '') {
      console.log('No valid QR code detected. Generating a new QR code.');
      return await handleNewQRCode(isolatedImagePath, coordinates);
    }

    // Check if QR code exists in the database
    const imageRecord = await getImageByQRCode(detectedQRCode);
    if (imageRecord) {
      console.log(`Existing QR code found: ${detectedQRCode}`);
      return {
        success: true,
        qrCode: imageRecord.id,
        new: false,
        message: `QR code found in database.`,
      };
    } else {
      console.log('QR code not found in the database. Generating a new QR code.');
      return await handleNewQRCode(isolatedImagePath, coordinates);
    }
  } catch (error) {
    console.error('Error in scanImageForQRCode:', error);
    return { success: false, error: error.message };
  }
}

// Helper function to handle new QR code generation
async function handleNewQRCode(imagePath) {
  let width = 0,
      height = 0,
      croppedImagePath = imagePath;

  try {
    // Process the image to isolate the QR code
    const result = await processImage(imagePath);

    if (result && result.isolatedImagePath) {
      croppedImagePath = result.isolatedImagePath;
      const corners = result.corners;

      const minX = Math.min(...corners.map(corner => corner[0]));
      const minY = Math.min(...corners.map(corner => corner[1]));
      const maxX = Math.max(...corners.map(corner => corner[0]));
      const maxY = Math.max(...corners.map(corner => corner[1]));

      width = Math.round(maxX - minX);
      height = Math.round(maxY - minY);
    }
  } catch (error) {
    console.warn('Error during image processing:', error.message);
  }

  // Default values if no valid dimensions were extracted
  if (width <= 0 || height <= 0) {
    width = 100;
    height = 100;
  }

  // Generate the .txt file with dimensions
  const textFilePath = await generateTextFile(width, height, croppedImagePath);

  const imageBuffer = await fs.readFile(croppedImagePath);
  const textFileBuffer = await fs.readFile(textFilePath);

  // Save the QR code information and return
  const qrCode = await saveImageWithQRCode(path.basename(imagePath), imageBuffer, textFileBuffer);

  return {
    success: true,
    qrCode,
    new: true,
    message: `Generated a new QR code: ${qrCode}`,
  };
}








// Export functions
module.exports = {
  resizeImage,
  cropImage,
  imageToBase64,
  scanImageForQRCode,
};