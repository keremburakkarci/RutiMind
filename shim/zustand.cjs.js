// Shim to force Metro to load zustand's CJS entry (index.js)
// This avoids serving the ESM `.mjs` files that contain `import.meta`.
module.exports = require('../node_modules/zustand/index.js');
