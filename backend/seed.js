// Seeds the catalogue from the frontend's mock data (bundled to CommonJS first).
// Usage: MONGODB_URI=... node seed.js <path-to-bundled-mockData.cjs>
const mongoose = require('mongoose');
(async () => {
  const { mockProducts } = require(require('path').resolve(process.argv[2]));
  await mongoose.connect(process.env.MONGODB_URI);
  const col = mongoose.connection.db.collection('products');
  const ops = mockProducts.map((p) => ({ updateOne: { filter: { id: String(p.id) }, update: { $set: { ...p, id: String(p.id) } }, upsert: true } }));
  const r = await col.bulkWrite(ops);
  console.log(`Seeded products: ${r.upsertedCount} new, ${r.modifiedCount} updated`);
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
