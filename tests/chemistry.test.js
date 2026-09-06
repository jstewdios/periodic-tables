import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {elements,bySymbol} from '../dist/elements.js';
import {compounds,compoundById,families,signature,matchCompound,suggestions,formulaText,cleanAtoms,atomCount,MAX_ATOMS,trails,everyday} from '../dist/chemistry.js';
import {pitchFor} from '../dist/audio.js';

test('all 118 elements occupy unique cells and preserve their source values',()=>{
  const {Table:source}=JSON.parse(readFileSync(new URL('../docs/pubchem-periodic-table.json',import.meta.url)));
  assert.equal(elements.length,118);
  assert.equal(new Set(elements.map(e=>`${e.row}:${e.column}`)).size,118);
  assert.deepEqual(elements.map(e=>e.number),Array.from({length:118},(_,i)=>i+1));
  for(const [index,e] of elements.entries()){
    const record=Object.fromEntries(source.Columns.Column.map((key,i)=>[key,source.Row[index].Cell[i]]));
    assert.equal(e.symbol,record.Symbol);
    assert.equal(e.electronegativity,record.Electronegativity?Number(record.Electronegativity):null);
    assert.ok(families[e.category]);
    assert.ok(e.column>=1&&e.column<=18);
    assert.ok(e.period>=1&&e.period<=7);
  }
  assert.equal(bySymbol.He.column,18);
  assert.equal(bySymbol.La.row,9);
  assert.equal(bySymbol.La.period,6);
  assert.equal(bySymbol.Hf.column,4);
  assert.equal(bySymbol.Ac.period,7);
});
test('missing values and unknown bulk states are not presented as zero or measured predictions',()=>{
  assert.equal(bySymbol.He.electronegativity,null);
  assert.equal(bySymbol.Ne.electronegativity,null);
  assert.equal(pitchFor(bySymbol.He,'pull'),null);
  assert.deepEqual(elements.filter(e=>e.state==='Liquid').map(e=>e.symbol),['Br','Hg']);
  assert.ok(elements.filter(e=>e.number>=104).every(e=>e.state==='Unknown'&&e.predicted));
});
test('water and peroxide retain exact molecular counts and do not simplify to the same composition',()=>{
  assert.equal(matchCompound({O:1,H:2}).id,'water');
  assert.equal(matchCompound({H:2,O:2}).id,'peroxide');
  assert.equal(matchCompound({H:1,O:1}),null);
  assert.equal(matchCompound({H:4,O:2}),null);
  assert.equal(matchCompound({Na:2,Cl:2}),null);
  assert.notEqual(signature({H:2,O:1}),signature({H:2,O:2}));
  assert.equal(matchCompound({H:2,O:1,He:1}),null);
});
test('every curated formula matches its atom inventory, and only molecules have bond diagrams',()=>{
  assert.equal(new Set(compounds.map(c=>signature(c.atoms))).size,compounds.length);
  for(const c of compounds){
    const parsed={};
    for(const [,symbol,count] of c.formula.matchAll(/([A-Z][a-z]?)(\d*)/g))parsed[symbol]=(parsed[symbol]??0)+Number(count||1);
    assert.deepEqual(parsed,c.atoms,c.id);
    assert.equal(matchCompound(c.atoms).id,c.id);
    assert.ok(atomCount(c.atoms)<=MAX_ATOMS);
    if(c.kind==='molecule'){
      const nodes={};c.nodes.forEach(([s])=>nodes[s]=(nodes[s]??0)+1);
      assert.deepEqual(nodes,c.atoms);
      c.bonds.forEach(([a,b,n])=>{assert.ok(c.nodes[a]&&c.nodes[b]);assert.notEqual(a,b);assert.ok([1,2,3].includes(n));});
    }else{assert.equal(c.nodes,undefined);assert.equal(c.bonds,undefined);}
  }
});
test('unmatched compositions get nearby suggestions without asserting impossible chemistry',()=>{
  assert.equal(matchCompound({Si:1,O:1}),null);
  assert.deepEqual(suggestions({Si:1}).map(c=>c.id),['silica']);
  assert.ok(suggestions({H:2,O:1}).some(c=>c.id==='peroxide'));
  assert.deepEqual(suggestions({Xe:1}),[]);
  assert.equal(formulaText({H:4,C:1}),'CH4');
  assert.deepEqual(cleanAtoms({Fake:1,H:-1,O:2,Na:1.5,C:Infinity}),{O:2});
});
test('trail targets and everyday connections point to real supported records',()=>{
  for(const trail of trails){
    assert.equal(trail.steps.length,3);
    for(const step of trail.steps){
      if(step.compound)assert.ok(compoundById[step.compound]);
      if(step.symbols)step.symbols.forEach(s=>assert.ok(bySymbol[s]));
    }
  }
  for(const object of everyday){object.symbols.forEach(s=>assert.ok(bySymbol[s]));if(object.compound)assert.ok(compoundById[object.compound]);}
});
test('sonification follows the disclosed property mappings',()=>{
  assert.equal(pitchFor(bySymbol.Li,'families'),pitchFor(bySymbol.Na,'families'));
  assert.ok(pitchFor(bySymbol.Li,'pull')<pitchFor(bySymbol.C,'pull'));
  assert.ok(pitchFor(bySymbol.C,'pull')<pitchFor(bySymbol.F,'pull'));
  for(let i=1;i<elements.length;i++)assert.ok(pitchFor(elements[i-1],'number')<pitchFor(elements[i],'number'));
});
