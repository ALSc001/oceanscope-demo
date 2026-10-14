import {build} from 'vite';
import {copyFile,cp} from 'node:fs/promises';
await build();
await copyFile('dist/workbench.html','index.html');
await cp('dist/assets','assets',{recursive:true});
console.log('Published files prepared at repository root. Existing hashed assets retained for open browser sessions.');
