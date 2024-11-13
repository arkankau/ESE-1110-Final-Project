const express = require('express');
const app = express();
const QRCode = require('qrcode');
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Array to store materials (use a database in production)
let materials = [];

// GET route to fetch all materials
app.get('/materials', (req, res) => {
  res.json(materials);
});

// GET route to fetch a material by name
app.get('/material/:name', (req, res) => {
  const material = materials.find(m => m.name === req.params.name);
  if (material) {
    res.json(material);
  } else {
    res.status(404).send('Material not found');
  }
});

// POST route to add a new material
app.post('/addMaterial', (req, res) => {
  const { name, dimension, material } = req.body;
  const newMaterial = { name, dimension, material };
  materials.push(newMaterial);
  
  res.json({
    success: true,
    message: 'Material added successfully',
    qrCode: `http://localhost:3000/qr/${name}`
  });
});

// PUT route to update a material
app.put('/updateMaterial/:name', (req, res) => {
  const { name } = req.params;
  const { dimension, material } = req.body;
  
  const materialIndex = materials.findIndex(m => m.name === name);
  if (materialIndex !== -1) {
    materials[materialIndex] = { name, dimension, material };
    res.json({
      success: true,
      message: `Material ${name} updated successfully`,
      qrCode: `http://localhost:3000/qr/${name}`
    });
  } else {
    res.status(404).send('Material not found');
  }
});

// Route to generate a QR code for a material
app.get('/qr/:name', (req, res) => {
  const materialName = req.params.name;
  const qrData = `http://localhost:3000/material/${materialName}`;
  
  QRCode.toDataURL(qrData, (err, url) => {
    if (err) {
      res.status(500).send('Error generating QR code');
    } else {
      res.send(`<img src="${url}" alt="QR Code" />`);
    }
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
