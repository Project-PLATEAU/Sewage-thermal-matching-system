//esbuild wwwroot/js/Map.js --bundle --minify --format=esm   --target=es2020 --outfile=wwwroot/js/Map.min.js

import { build } from "esbuild";

await build({
  entryPoints: ['wwwroot/js/map.js'],
  bundle: true,
  minify: true,
  format: 'esm',
  target: 'es2022',
  outfile: 'wwwroot/js_out/map.js',
});
