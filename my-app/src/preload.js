const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // API call to add material
  addMaterial: async (name, dimension, material) => {
    const response = await fetch('http://localhost:3000/addMaterial', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, dimension, material })
    });
    return response.json();
  },

  // API call to update material
  updateMaterial: async (name, dimension, material) => {
    const response = await fetch(`http://localhost:3000/updateMaterial/${name}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dimension, material })
    });
    return response.json();
  }
});
