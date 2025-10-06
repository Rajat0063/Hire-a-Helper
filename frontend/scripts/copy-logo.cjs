// This script copies the logo from src/assets to public for favicon use
const fs = require('fs');
const path = require('path');

const src = path.resolve(__dirname, '../src/assets/logo (2).png');
const dest = path.resolve(__dirname, '../public/logo.png');

fs.copyFileSync(src, dest);
