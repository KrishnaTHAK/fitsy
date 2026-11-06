// Adds `sizeChart` to products that already exist in MongoDB, WITHOUT touching
// anything else. Use this instead of re-running seed.js, which deletes all
// products, users, carts and wishlists before inserting.
//
//   node scripts/backfillSizeCharts.js --dry-run   # show what would change
//   node scripts/backfillSizeCharts.js             # apply
//
// Only products whose chart would actually change are updated, so it is safe
// to run more than once. Products with no applicable chart (shoes,
// accessories, numeric-sized Bottoms) are left alone.

const { buildSizeChart } = require('../data/sizeCharts');

/** Pure: decide which products need an update. Exported for unit testing. */
function computeChartUpdates(products) {
  const updates = [];
  for (const product of products) {
    const wanted = buildSizeChart(product.category, product.sizes);
    const current = Array.isArray(product.sizeChart) ? product.sizeChart : [];
    if (wanted.length === 0) continue; // nothing applicable: leave the product untouched
    if (sameChart(current, wanted)) continue; // already up to date
    updates.push({ id: product._id, name: product.name, sizeChart: wanted });
  }
  return updates;
}

function sameChart(a, b) {
  if (a.length !== b.length) return false;
  return a.every((entry, i) => {
    const plain = typeof entry.toObject === 'function' ? entry.toObject() : entry;
    return Object.keys(b[i]).every((key) => plain[key] === b[i][key]) && Object.keys(plain).filter((k) => k !== '_id').length === Object.keys(b[i]).length;
  });
}

async function run() {
  const dotenv = require('dotenv');
  const mongoose = require('mongoose');
  const Product = require('../models/Product');
  dotenv.config();

  const dryRun = process.argv.includes('--dry-run');
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is not set. Add it to backend/.env first.');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  const products = await Product.find({});
  const updates = computeChartUpdates(products);

  console.log(`${products.length} products found, ${updates.length} need a size chart${dryRun ? ' (dry run, nothing written)' : ''}.`);
  for (const u of updates) {
    console.log(`  ${dryRun ? 'would update' : 'updating'}: ${u.name}`);
    if (!dryRun) await Product.updateOne({ _id: u.id }, { $set: { sizeChart: u.sizeChart } });
  }

  await mongoose.disconnect();
}

if (require.main === module) {
  run().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { computeChartUpdates };
