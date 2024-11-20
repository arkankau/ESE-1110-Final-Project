// src/main/detection.js
const sharp = require('sharp');
const axios = require('axios');

async function processImage(imagePath) {
  try {
    // Convert image to base64 directly without resizing
    const imageBuffer = await sharp(imagePath).toBuffer();
    const base64Image = imageBuffer.toString('base64');
    const imageDataUrl = `data:image/jpeg;base64,${base64Image}`;

    // Make API request
    const response = await axios({
      method: 'POST',
      url: 'https://detect.roboflow.com/qr-code-detection-9y8lj/1',
      params: {
        api_key: 'Bi96IMIqHglCnHWGIACD'
      },
      data: imageDataUrl,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    // Process predictions
    const predictions = response.data.predictions || [];

    if (predictions.length === 0) {
      return null;
    }

    // Find the prediction with the highest confidence
    const bestPrediction = predictions.reduce((max, prediction) =>
      prediction.confidence > max.confidence ? prediction : max
    );

    // Extract data from the best prediction
    const { x, y, width, height, class: className, confidence } = bestPrediction;

    // Calculate corners
    const halfWidth = width / 2;
    const halfHeight = height / 2;

    return {
      class: className,
      confidence,
      corners: [
        [x - halfWidth, y - halfHeight], // topLeft
        [x + halfWidth, y - halfHeight], // topRight  
        [x + halfWidth, y + halfHeight], // bottomRight
        [x - halfWidth, y + halfHeight]  // bottomLeft
      ]
    };
  } catch (error) {
    console.error('Error in processImage:', error);
    throw error;
  }
}

module.exports = { processImage };