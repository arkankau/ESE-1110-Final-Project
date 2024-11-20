// src/main/window.js
const { BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, '../preload.js'),
    },
  });

  mainWindow.loadFile(path.join(__dirname, '../index.html'));
  return mainWindow;
}

module.exports = { createWindow };