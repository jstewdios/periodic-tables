import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { entries } from '../dist/journal/catalog.js';

const read = path => readFileSync(new URL('../dist/'+path,import.meta.url),'utf8');
const legacy = read('home.js');

function visit(script, path, search='', hash='') {
  const replacements=[], listeners={};
  const location={href:'https://example.test'+path,search,hash,replace:url=>replacements.push(String(url))};
  runInNewContext(script,{location,URL,window:{addEventListener:(name,callback)=>{listeners[name]=callback;}}});
  return {replacements,listeners,location};
}

test('legacy chemistry fragments preserve query, fragment and subdirectory with one history replacement',()=>{
  for(const prefix of ['/','/a-fork/'])for(const name of ['table','workbench','everyday','trails','collection']) {
    const {replacements}=visit(legacy,prefix,'?from=old-link','#'+name);
    assert.deepEqual(replacements,[`https://example.test${prefix}chemistry/?from=old-link#${name}`]);
  }
  for(const hash of ['', '#main','#instruments','#journal-title','#unknown'])assert.deepEqual(visit(legacy,'/','',hash).replacements,[]);
  const changed=visit(legacy,'/');changed.location.hash='#trails';changed.listeners.hashchange();
  assert.deepEqual(changed.replacements,['https://example.test/chemistry/#trails']);
});

test('the old Instruments address is a static-host-compatible alias',()=>{
  const script=read('instruments/index.html').match(/<script>([\s\S]*?)<\/script>/)[1];
  for(const prefix of ['/','/a-fork/'])assert.deepEqual(visit(script,prefix+'instruments/','?via=bookmark','#instruments').replacements,[`https://example.test${prefix}?via=bookmark#instruments`]);
});

test('collection, chemistry and journal navigation/assets resolve on root and subdirectory hosts',()=>{
  for(const prefix of ['/','/a-fork/'])for(const path of ['index.html','instruments/index.html','chemistry/index.html','journal/index.html','journal/hushpod/index.html','journal/ring/index.html','instruments/hushpod/index.html','instruments/odd-sympathy/index.html']) {
    const html=read(path);
    for(const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      const url=new URL(match[1],`https://example.test${prefix}${path}`);
      if(url.origin!=='https://example.test')continue;
      assert.ok(url.pathname.startsWith(prefix),`${path}: ${match[1]} escaped the hosting prefix`);
      const file=url.pathname.slice(prefix.length)+(url.pathname.endsWith('/')?'index.html':'');
      assert.ok(existsSync(new URL('../dist/'+file,import.meta.url)),`${path}: ${match[1]}`);
    }
  }
});

test('both collections are usable static documents and stories have their own catalog',()=>{
  const home=read('index.html'), journal=read('journal/index.html');
  assert.equal((home.match(/class="instrument-card /g)||[]).length,3);
  assert.equal((home.match(/class="story-card /g)||[]).length,entries.length);
  assert.equal((journal.match(/class="story-card /g)||[]).length,entries.length);
  for(const entry of entries)for(const html of [home,journal])assert.ok(html.includes(entry.title));
  assert.doesNotMatch(journal,/<script/);
  assert.doesNotMatch(home,/type="module"|<canvas|<iframe/);
  assert.match(read('chemistry/index.html'),/src="\.\.\/app.js"/);
});
