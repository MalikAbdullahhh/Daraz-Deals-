// Daraz Deals products API — MongoDB-backed (previously a local JSON file).
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/daraz-deals';

// Products keep the frontend's own shape (string `id`, nested reviews, etc.).
const productSchema = new mongoose.Schema(
  { id: { type: String, required: true, unique: true, index: true } },
  { strict: false, timestamps: true, versionKey: false }
);
const Product = mongoose.models.Product || mongoose.model('Product', productSchema);
const clean = (doc) => { if (!doc) return doc; const { _id, ...rest } = doc; return rest; };

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/', (_req, res) => res.json({ ok: true, service: 'daraz-deals-api' }));

app.get('/api/products', async (_req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: 1 }).lean();
    res.json(products.map(clean));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const created = await Product.create({ id: uuidv4(), ...req.body });
    res.status(201).json({ message: 'Product added successfully', product: clean(created.toObject()) });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const { id, _id, ...changes } = req.body || {};
    const updated = await Product.findOneAndUpdate({ id: req.params.id }, { $set: changes }, { returnDocument: 'after', lean: true });
    if (!updated) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product updated successfully', product: clean(updated) });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findOne({ id: req.params.id }).lean();
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(clean(product));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const deleted = await Product.findOneAndDelete({ id: req.params.id }).lean();
    if (!deleted) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted successfully', product: clean(deleted) });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

mongoose.set('strictQuery', true);
mongoose.connect(MONGODB_URI).then(() => {
  app.listen(PORT, () => console.log(`Daraz Deals API on http://localhost:${PORT}`));
}).catch((err) => {
  console.error('MongoDB connection failed:', err.message);
  process.exit(1);
});

module.exports = { Product };
