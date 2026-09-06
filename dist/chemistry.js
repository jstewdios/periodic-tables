import { bySymbol } from './elements.js';

export const families = {
  'Nonmetal': { color: '#b6dc89', label: 'Other nonmetals', note: 'A varied group that includes carbon, oxygen, and nitrogen. Many form bonds by sharing electrons.' },
  'Alkali metal': { color: '#e8a2b2', label: 'Alkali metals', note: 'Group 1 metals have one electron in their outermost shell. Hydrogen sits above them but is a nonmetal.' },
  'Alkaline earth metal': { color: '#dfbd78', label: 'Alkaline earth metals', note: 'Group 2 metals have two electrons in their outermost shell and commonly form ions with a 2+ charge.' },
  'Transition metal': { color: '#91b9e6', label: 'Transition metals', note: 'The broad middle of the table. Many can form ions with more than one charge; this display groups the d-block together.' },
  'Post-transition metal': { color: '#b1a1e3', label: 'Post-transition metals', note: 'Metals in the p-block, to the right of the transition metals. The boundary of this informal category varies between tables.' },
  'Metalloid': { color: '#71cab4', label: 'Metalloids', note: 'Near the zigzag boundary between metals and nonmetals. This conventional category includes familiar semiconductor elements.' },
  'Halogen': { color: '#dfd982', label: 'Halogens', note: 'Group 17 has seven electrons in its outermost shell. These elements commonly gain or share one electron in compounds.' },
  'Noble gas': { color: '#c1a6e9', label: 'Noble gases', note: 'Group 18 has filled outer shells. Most are very unreactive, although some heavier noble gases form compounds.' },
  'Lanthanide': { color: '#dc9c76', label: 'Lanthanides', note: 'Elements 57–71 belong in period 6. They are shown below to keep the table compact.' },
  'Actinide': { color: '#df9cd0', label: 'Actinides', note: 'Elements 89–103 belong in period 7. All are radioactive; they are shown below to keep the table compact.' },
};

export const elementNotes = {
  H:'The lightest element. Hydrogen is part of water and of most molecules in living things.',
  He:'Its filled first electron shell helps explain why helium rarely forms compounds.',
  Li:'Lithium ions move between electrodes in many rechargeable batteries.',
  B:'Boron compounds help give borosilicate glass its resistance to thermal shock.',
  C:'Diamond and graphite are both carbon. Different atomic arrangements give them very different properties.',
  N:'Nitrogen gas makes up most of the air. Nitrogen atoms are also part of proteins and DNA.',
  O:'Oxygen atoms appear in water, many rocks, and the oxygen gas used in respiration.',
  F:'Fluorine has the highest electronegativity on the Pauling scale: a strong attraction for shared electrons.',
  Ne:'Electrically excited neon gives the familiar red-orange glow of a neon sign.',
  Na:'A metal as an element; in table salt, it is present as positively charged sodium ions.',
  Mg:'A magnesium ion sits at the center of the chlorophyll molecule that helps plants capture light.',
  Al:'Lightweight aluminum develops a protective oxide layer on its surface.',
  Si:'Silicon is used in computer chips. Bonded to oxygen, it is also part of silica and many rocks.',
  P:'Phosphorus is part of DNA and ATP, molecules central to the chemistry of life.',
  S:'Sulfur occurs in some amino acids. Bonds between sulfur atoms help shape many proteins.',
  Cl:'Chlorine gas and chloride ions are different chemical forms. Chloride is part of table salt.',
  Ar:'Argon is used when an unreactive atmosphere is needed, including some welding processes.',
  K:'Potassium ions help cells maintain electrical differences across their membranes.',
  Ca:'Calcium compounds appear in bones, shells, limestone, and many other materials.',
  Fe:'Iron is the main ingredient in steel. In living things, iron in hemoglobin helps carry oxygen.',
  Cu:'Copper conducts electricity well, making it useful for wiring and electronic circuits.',
  Zn:'Zinc coatings help protect steel from corrosion.',
  Br:'Bromine is one of just two elements that are liquid near room temperature; mercury is the other.',
  Ag:'Silver is an excellent electrical conductor and reflects visible light well.',
  I:'The body uses iodine as part of thyroid hormones.',
  W:'Tungsten retains its strength at high temperatures and has a very high melting point.',
  Au:'Gold resists corrosion, which helps explain its use in jewelry and electronic contacts.',
  Hg:'Mercury is the only metal that is liquid near room temperature.',
  Pt:'Platinum is used as a catalyst: it helps reactions proceed without being consumed overall.',
  U:'Uranium is an actinide. Its isotopes have different nuclear properties.',
};

// Molecular models have explicit topology. Extended solids show ratios, never fictitious molecules.
export const compounds = [
  {id:'water',name:'Water',formula:'H2O',atoms:{H:2,O:1},kind:'molecule',where:'Rain, rivers, and living cells',question:'What changes if you add one more oxygen?',description:'Two hydrogen atoms bond to one oxygen atom in a bent molecule. Its uneven charge distribution helps water interact with ions and other polar molecules.',next:'peroxide',source:'Water',nodes:[['O',180,95],['H',105,153],['H',255,153]],bonds:[[0,1,1],[0,2,1]],modelNote:'Bent molecular model · schematic, not to scale'},
  {id:'peroxide',name:'Hydrogen peroxide',formula:'H2O2',atoms:{H:2,O:2},kind:'molecule',where:'Peroxide solutions',question:'Same elements. A different substance.',description:'An oxygen–oxygen bond distinguishes hydrogen peroxide from water. Changing the number and arrangement of atoms changes chemical behavior; peroxide is an oxidizing agent.',next:'water',source:'Hydrogen-Peroxide',nodes:[['O',143,110],['O',217,110],['H',88,164],['H',273,56]],bonds:[[0,1,1],[0,2,1],[1,3,1]],modelNote:'Connectivity diagram · flattened from a nonplanar molecule'},
  {id:'carbon-dioxide',name:'Carbon dioxide',formula:'CO2',atoms:{C:1,O:2},kind:'molecule',where:'Air, exhaled breath, and sparkling water',question:'What if carbon has only one oxygen partner?',description:'A carbon atom sits between two oxygen atoms in a straight line. Each carbon–oxygen connection is a double bond.',next:'carbon-monoxide',source:'Carbon-Dioxide',nodes:[['O',85,120],['C',180,120],['O',275,120]],bonds:[[0,1,2],[1,2,2]],modelNote:'Linear molecular model · schematic, not to scale'},
  {id:'carbon-monoxide',name:'Carbon monoxide',formula:'CO',atoms:{C:1,O:1},kind:'molecule',where:'Incomplete combustion',question:'One fewer oxygen makes a major difference.',description:'Carbon monoxide contains one carbon atom and one oxygen atom. Unlike carbon dioxide, it binds strongly to hemoglobin and is highly poisonous.',next:'carbon-dioxide',source:'Carbon-Monoxide',nodes:[['C',133,120],['O',227,120]],bonds:[[0,1,3]],modelNote:'Connectivity model · the line set represents a triple bond'},
  {id:'methane',name:'Methane',formula:'CH4',atoms:{C:1,H:4},kind:'molecule',where:'Natural gas and some microbial processes',question:'How do four bonds fit around carbon?',description:'Four hydrogen atoms surround a carbon atom in a tetrahedral arrangement. The molecule occupies three dimensions, even when drawn on a flat screen.',source:'Methane',nodes:[['C',180,119],['H',180,40],['H',105,156],['H',255,156],['H',180,192]],bonds:[[0,1,1],[0,2,1],[0,3,1],[0,4,1]],modelNote:'Connectivity diagram · the actual geometry is tetrahedral'},
  {id:'ammonia',name:'Ammonia',formula:'NH3',atoms:{N:1,H:3},kind:'molecule',where:'Fertilizer production and the nitrogen cycle',question:'Why is the molecule shaped like a pyramid?',description:'Nitrogen bonds to three hydrogen atoms and retains a lone pair of electrons. The arrangement of the atoms is trigonal pyramidal.',source:'Ammonia',nodes:[['N',180,90],['H',105,143],['H',255,143],['H',180,187]],bonds:[[0,1,1],[0,2,1],[0,3,1]],modelNote:'Connectivity diagram · the actual geometry is pyramidal'},
  {id:'salt',name:'Sodium chloride',formula:'NaCl',atoms:{Na:1,Cl:1},kind:'ionic',where:'Table salt and seawater',question:'Is a salt crystal one big molecule?',description:'Solid sodium chloride is a repeating lattice of sodium and chloride ions. NaCl describes the 1:1 ratio, not a separate two-atom molecule.',source:'Sodium-Chloride',modelNote:'Composition ratio · an ionic solid, not a molecule'},
  {id:'chalk',name:'Calcium carbonate',formula:'CaCO3',atoms:{Ca:1,C:1,O:3},kind:'ionic',where:'Limestone, many seashells, and natural chalk',question:'What connects a seashell and a mountain?',description:'Calcium carbonate contains calcium ions and carbonate ions. Different crystal structures of the same composition include calcite and aragonite.',source:'Calcium-Carbonate',modelNote:'Composition ratio · calcium and carbonate ions form a solid'},
  {id:'baking-soda',name:'Sodium bicarbonate',formula:'NaHCO3',atoms:{Na:1,H:1,C:1,O:3},kind:'ionic',where:'Baking soda',question:'Can a compound contain another group of atoms?',description:'Sodium bicarbonate is an ionic solid containing sodium ions and bicarbonate ions. Each bicarbonate ion contains hydrogen, carbon, and oxygen.',source:'Sodium-Bicarbonate',modelNote:'Composition ratio · sodium and bicarbonate ions form a solid'},
  {id:'silica',name:'Silicon dioxide',formula:'SiO2',atoms:{Si:1,O:2},kind:'network',where:'Quartz and silica glass',question:'Can a formula describe an entire network?',description:'In common solid silica, silicon and oxygen form an extended network. SiO2 records the 1:2 ratio. Ordinary window glass also contains other ingredients.',source:'Silicon-Dioxide',modelNote:'Composition ratio · an extended network, not a three-atom molecule'},
  {id:'magnesia',name:'Magnesium oxide',formula:'MgO',atoms:{Mg:1,O:1},kind:'ionic',where:'Heat-resistant ceramics',question:'What holds a repeating solid together?',description:'Magnesium oxide is an ionic solid with a 1:1 ratio of magnesium and oxygen. The ions form a repeating crystal structure.',source:'Magnesium-Oxide',modelNote:'Composition ratio · an ionic solid, not a molecule'},
  {id:'hematite',name:'Iron(III) oxide',formula:'Fe2O3',atoms:{Fe:2,O:3},kind:'ionic',where:'Hematite, an iron ore and pigment',question:'Why two irons for three oxygens?',description:'The formula balances iron in the +3 oxidation state with oxygen in the −2 state. Rust is more complex: it can contain several iron oxides and oxyhydroxides.',source:'Ferric-Oxide',modelNote:'Composition ratio · a solid structure, not an isolated molecule'},
  {id:'potassium-chloride',name:'Potassium chloride',formula:'KCl',atoms:{K:1,Cl:1},kind:'ionic',where:'Mineral deposits and fertilizers',question:'What happens when one family member replaces another?',description:'Like sodium chloride, potassium chloride is an ionic solid with a 1:1 ratio. Potassium and sodium sit in the same group of the periodic table.',next:'salt',source:'Potassium-Chloride',modelNote:'Composition ratio · an ionic solid, not a molecule'},
  {id:'calcium-chloride',name:'Calcium chloride',formula:'CaCl2',atoms:{Ca:1,Cl:2},kind:'ionic',where:'Deicing materials and moisture absorbers',question:'Why does calcium need two chlorides?',description:'A calcium ion has a 2+ charge; each chloride ion has a 1− charge. Two chlorides balance one calcium in the formula.',next:'salt',source:'Calcium-Chloride',modelNote:'Composition ratio · an ionic solid, not a molecule'},
];
export const compoundById = Object.fromEntries(compounds.map(c=>[c.id,c]));
export const MAX_ATOMS = 24;
export function cleanAtoms(input) {
  const clean={};
  for(const [symbol,count] of Object.entries(input??{})) {
    if(bySymbol[symbol] && Number.isInteger(count) && count>0 && count<=MAX_ATOMS) clean[symbol]=count;
  }
  return clean;
}
export function atomCount(atoms) { return Object.values(atoms).reduce((a,b)=>a+b,0); }
export function signature(atoms) { return Object.entries(cleanAtoms(atoms)).sort(([a],[b])=>a.localeCompare(b)).map(([s,n])=>`${s}:${n}`).join('|'); }
export function matchCompound(atoms) { const key=signature(atoms); return compounds.find(c=>signature(c.atoms)===key)??null; }
export function formulaText(atoms) {
  const list=Object.keys(cleanAtoms(atoms));
  // Hill ordering for arbitrary compositions. Known compounds retain conventional formula order.
  list.sort((a,b)=>list.includes('C')?(a==='C'?-1:b==='C'?1:a==='H'?-1:b==='H'?1:a.localeCompare(b)):a.localeCompare(b));
  return list.map(s=>s+(atoms[s]>1?atoms[s]:'')).join('');
}
export function suggestions(atoms) {
  const chosen=Object.keys(cleanAtoms(atoms));
  if(!chosen.length)return [compoundById.water,compoundById.salt,compoundById['carbon-dioxide']];
  return compounds.filter(c=>chosen.every(s=>c.atoms[s])).sort((a,b)=>distance(a.atoms,atoms)-distance(b.atoms,atoms)).slice(0,3);
}
function distance(a,b){return [...new Set([...Object.keys(a),...Object.keys(b)])].reduce((n,s)=>n+Math.abs((a[s]??0)-(b[s]??0)),0);}

export const everyday = [
  {id:'leaf',label:'A leaf',title:'A little solar chemistry.',symbols:['C','H','O','N','Mg'],lead:'A leaf brings together structures, pigments, and water. It is a mixture of many substances, not one compound.',parts:[['Mg','Light capture','Magnesium sits at the center of chlorophyll.'],['C','Structure','Carbon helps form the framework of sugars and cellulose.'],['H','Water inside','Hydrogen and oxygen form water in and around living cells.']],compound:'water',source:'https://periodic-table.rsc.org/element/12/magnesium'},
  {id:'window',label:'A window',title:'A network you can see through.',symbols:['Si','O','Na','Ca'],lead:'Common window glass is mostly a silica-based network, modified with other ingredients. Its lack of long-range crystal order helps distinguish it from quartz.',parts:[['Si','The framework','Silicon and oxygen form the glass network.'],['Na','Easier to shape','Sodium-containing ingredients help lower processing temperatures.'],['Ca','Lasting glass','Calcium-containing ingredients improve chemical durability.']],compound:'silica',source:'https://periodic-table.rsc.org/element/14/silicon'},
  {id:'phone',label:'A phone',title:'A table in your pocket.',symbols:['Si','Cu','Li','Al','Au'],lead:'A phone brings together many materials. These are a few examples; the precise ingredients depend on the device.',parts:[['Si','Tiny switches','Silicon is the semiconductor in many electronic chips.'],['Cu','Connections','Copper carries electrical signals through circuitry.'],['Li','Stored energy','Lithium ions move through the battery during charging and use.']],source:'https://periodic-table.rsc.org/element/14/silicon'},
  {id:'shell',label:'A seashell',title:'Built from the ocean.',symbols:['Ca','C','O'],lead:'Many marine organisms build shells from calcium carbonate, arranged into structures with organic material.',parts:[['Ca','A building ion','Calcium ions pair with carbonate ions in the solid.'],['C','A group within a compound','Carbon and three oxygens make a carbonate ion.'],['O','Structure matters','The same composition can form calcite or aragonite crystals.']],compound:'chalk',source:'https://pubchem.ncbi.nlm.nih.gov/compound/Calcium-Carbonate'},
];
export const trails = [
  {id:'one-oxygen',label:'One more oxygen',question:'How much can one atom change?',accent:'#b6dc89',steps:[{kind:'build',compound:'water',title:'Begin with something familiar.',text:'Assemble two hydrogen atoms and one oxygen atom. Notice the bent shape of water.'},{kind:'build',compound:'peroxide',title:'Add one oxygen.',text:'Keep your two hydrogen atoms. Change the oxygen count from one to two. You have matched a different compound.'},{kind:'reflect',title:'Composition changes character.',text:'Water and hydrogen peroxide contain the same elements, but differ in composition and bonding. A formula is small; the difference it records can be enormous.'}]},
  {id:'family',label:'A family resemblance',question:'Why do the columns matter?',accent:'#e8a2b2',steps:[{kind:'select',symbols:['Li','Na','K'],title:'Visit three neighbors down a column.',text:'Select lithium, sodium, and potassium on the table. Each has one electron in its outermost shell.'},{kind:'build',compound:'salt',title:'Meet sodium in a different form.',text:'Assemble one sodium and one chlorine. In solid salt, they are ions in a repeating lattice.'},{kind:'build',compound:'potassium-chloride',title:'Swap a family member.',text:'Replace sodium with potassium. Both compounds have a 1:1 ratio. Shared patterns help us ask useful questions about chemistry.'}]},
  {id:'pull',label:'An invisible pull',question:'Can you see a bond’s tug-of-war?',accent:'#91b9e6',steps:[{kind:'mode',mode:'pull',title:'Give electron attraction a color.',text:'Switch to Electron pull. A brighter tile means a greater attraction for shared electrons on the Pauling scale.'},{kind:'select',symbols:['Li','C','F'],title:'Move across the second row.',text:'Visit lithium, carbon, and fluorine. Compare their values: the general trend rises across this row.'},{kind:'reflect',title:'A pattern, with limits.',text:'Electronegativity describes atoms in bonds. A blank means no value in this dataset, not zero. Trends help us reason; individual elements still have their own chemistry.'}]},
  {id:'network',label:'Beyond the molecule',question:'Is everything made of little molecules?',accent:'#71cab4',steps:[{kind:'build',compound:'carbon-dioxide',title:'First, a distinct molecule.',text:'Assemble one carbon and two oxygens. Carbon dioxide has separate, linear molecules.'},{kind:'build',compound:'silica',title:'Now, an extended network.',text:'Replace carbon with silicon. In common solid silica, SiO2 is a ratio within a network, not a tiny three-atom molecule.'},{kind:'reflect',title:'Same ratio. Different kind of structure.',text:'A chemical formula tells us composition. To understand a material, we also need to ask how its atoms are connected and arranged.'}]},
];
