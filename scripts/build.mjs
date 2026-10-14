import fs from 'node:fs/promises';import {build} from 'esbuild';
await fs.rm('dist',{recursive:true,force:true});await fs.mkdir('dist',{recursive:true});
await fs.cp('medal-yokocho','dist/medal-yokocho',{recursive:true});
await build({entryPoints:['medal-yokocho/pusher-3d/main.js'],outfile:'dist/medal-yokocho/pusher-3d/main.js',bundle:true,format:'esm',target:['safari16'],minify:true,legalComments:'eof'});
await fs.writeFile('dist/index.html','<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=medal-yokocho/arcade-3d/index.html"><title>宵まちメダル横丁</title><a href="medal-yokocho/arcade-3d/index.html">横丁へ</a>');
await fs.mkdir('dist/licenses',{recursive:true});for(const [from,to] of [['node_modules/three/LICENSE','three.txt'],['node_modules/@dimforge/rapier3d-compat/LICENSE','rapier.txt']])await fs.copyFile(from,'dist/licenses/'+to);
console.log('Built dist with bundled Three.js and Rapier (no runtime CDN dependency).');
