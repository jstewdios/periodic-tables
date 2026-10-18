import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { instruments } from '../dist/instruments/catalog.js';

test('catalog destinations resolve to standalone documents on root and subpath hosting',()=>{
  assert.equal(new Set(instruments.map(i=>i.id)).size,instruments.length);
  for(const item of instruments){
    for(const key of ['name','invitation','status','href','credit','source'])assert.ok(item[key],`${item.id}: ${key}`);
    for(const prefix of ['/', '/a-fork/']) {
      const url=new URL(item.href,`https://example.test${prefix}instruments/`);
      assert.equal(url.origin,'https://example.test');assert.ok(url.pathname.startsWith(prefix));
      const relative=url.pathname.slice(prefix.length);
      assert.ok(existsSync(new URL('../dist/'+relative+(relative.endsWith('/')||!relative?'index.html':''),import.meta.url)));
    }
  }
});
test('the imported scientific model and processor match the recorded original snapshot',()=>{
  const provenance=JSON.parse(readFileSync(new URL('../docs/hushpod-provenance.json',import.meta.url)));
  for(const file of provenance.files.filter(f=>!f.modified)){
    const bytes=readFileSync(new URL('../'+file.path,import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex'),file.original_sha256,file.path);
  }
  for(const name of ['model.mjs','worklet.mjs'])assert.equal(provenance.files.find(f=>f.path.endsWith('/'+name)).modified,false);
});
