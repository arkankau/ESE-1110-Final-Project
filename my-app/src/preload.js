// src/preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveImage: (dataURL) => ipcRenderer.invoke('save-image', dataURL),
  getPhotos: () => ipcRenderer.invoke('get-photos'),
  onPhotosUpdated: (callback) => ipcRenderer.on('photos-updated', (event, photos) => callback(photos)),
  clearAllPhotos: () => ipcRenderer.invoke('clear-all-photos'),
  getImageData: (filename) => ipcRenderer.invoke('get-image-data', filename),
  isolatePaper: (filename) => ipcRenderer.invoke('isolate-paper', filename), 
});