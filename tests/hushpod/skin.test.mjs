import test from 'node:test';
import assert from 'node:assert/strict';
import { Skin } from '../../dist/instruments/hushpod/skin.mjs';

test('pockets and waists are independently reachable at desktop and phone sizes',()=>{
  for (const [width,height] of [[1120,580],[390,540],[320,430],[760,210]]) {
    const skin=new Skin({getContext:()=>({})});skin.resize(width,height);
    for(let j=0;j<3;j++){
      const p=skin.pocketCenter(j);assert.deepEqual(skin.hit(p.x,p.y),{type:'pocket',index:j});
      assert.ok(p.x-skin.r>0&&p.x+skin.r<width&&p.y-skin.r>0&&p.y+skin.r<height);
    }
    for(let j=0;j<2;j++){
      const p=skin.waistCenter(j);assert.deepEqual(skin.hit(p.x,p.y),{type:'waist',index:j});
    }
  }
});
test('opening drag has the advertised direction on both orientations',()=>{
  for(const [width,height] of [[1120,580],[390,540]]){
    const skin=new Skin({getContext:()=>({})});skin.resize(width,height);
    const p=skin.waistCenter(0),v0=skin.local(p.x,p.y).v;
    const next=skin.vertical?skin.local(p.x+40,p.y):skin.local(p.x,p.y-40);
    assert.ok(v0-next.v>0);
  }
});
