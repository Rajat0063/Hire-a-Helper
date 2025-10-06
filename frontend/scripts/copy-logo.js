import fs from 'fs';
import path from 'path';

// Copy logo (2).png from assets to public as favicon
const src = path.resolve('src/assets/logo (2).png');
const dest = path.resolve('public/logo.png');

fs.copyFileSync(src, dest);
