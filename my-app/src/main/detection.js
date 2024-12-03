// src/main/detection.js
const sharp = require('sharp');
const axios = require('axios');
const path = require('path');


async function processImage(imagePath) {
  try {
    const imageBuffer = await sharp(imagePath).toBuffer();
    const base64Image = imageBuffer.toString('base64');
    const imageDataUrl = `data:image/jpeg;base64,${base64Image}`;

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

    const predictions = response.data.predictions || [];

    if (predictions.length === 0) {
      return null;
    }

    const bestPrediction = predictions.reduce((max, prediction) =>
      prediction.confidence > max.confidence ? prediction : max
    );

    const { x, y, width, height, class: className, confidence } = bestPrediction;

    const halfWidth = width / 2;
    const halfHeight = height / 2;

    const corners = [
      [x - halfWidth, y - halfHeight], // topLeft
      [x + halfWidth, y - halfHeight], // topRight  
      [x + halfWidth, y + halfHeight], // bottomRight
      [x - halfWidth, y + halfHeight]  // bottomLeft
    ];

    const minX = Math.min(...corners.map(corner => corner[0]));
    const minY = Math.min(...corners.map(corner => corner[1]));
    const maxX = Math.max(...corners.map(corner => corner[0]));
    const maxY = Math.max(...corners.map(corner => corner[1]));
    const cropWidth = maxX - minX;
    const cropHeight = maxY - minY;

    const isolatedImagePath = path.join(
      path.dirname(imagePath),
      'isolated-' + path.basename(imagePath)
    );
    await sharp(imagePath)
      .extract({
        left: Math.round(minX),
        top: Math.round(minY),
        width: Math.round(cropWidth),
        height: Math.round(cropHeight),
      })
      .toFile(isolatedImagePath);

    return {
      class: className,
      confidence,
      corners,
      isolatedImagePath
    };
  } catch (error) {
    console.error('Error in processImage:', error);
    throw error;
  }
}

module.exports = { processImage };