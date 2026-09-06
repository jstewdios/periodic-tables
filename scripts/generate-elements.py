"""Generate the bundled data module from the checked-in PubChem snapshot."""
import json
from pathlib import Path
root = Path(__file__).resolve().parents[1]
table = json.loads((root/'docs/pubchem-periodic-table.json').read_text())['Table']
rows = [dict(zip(table['Columns']['Column'], r['Cell'])) for r in table['Row']]
layout = [
 ['H']+['']*16+['He'],
 ['Li','Be']+['']*10+['B','C','N','O','F','Ne'],
 ['Na','Mg']+['']*10+['Al','Si','P','S','Cl','Ar'],
 'K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr'.split(),
 'Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe'.split(),
 ['Cs','Ba','']+'Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn'.split(),
 ['Fr','Ra','']+'Rf Db Sg Bh Hs Mt Ds Rg Cn Nh Fl Mc Lv Ts Og'.split(),
 [], ['', '']+'La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu'.split(),
 ['', '']+'Ac Th Pa U Np Pu Am Cm Bk Cf Es Fm Md No Lr'.split()
]
positions = {s:(r+1,c+1) for r,row in enumerate(layout) for c,s in enumerate(row) if s}
elements=[]
for r in rows:
 n=int(r['AtomicNumber']); row,col=positions[r['Symbol']]
 elements.append(dict(number=n,symbol=r['Symbol'],name=r['Name'],mass=r['AtomicMass'],configuration=r['ElectronConfiguration'],electronegativity=float(r['Electronegativity']) if r['Electronegativity'] else None,category=r['GroupBlock'],state=r['StandardState'] if n<104 else 'Unknown',row=row,column=col,period=(6 if row==9 else 7 if row==10 else row),group=col if row<8 else None,predicted=n>=104))
(root/'dist/elements.js').write_text('// Data: PubChem PUG REST periodic table; snapshot 2026-09-06. See docs/SCIENCE.md.\nexport const elements = '+json.dumps(elements,ensure_ascii=False,separators=(',',':'))+';\nexport const bySymbol = Object.fromEntries(elements.map(element => [element.symbol, element]));\n')
print(f'Generated {len(elements)} elements with {len(positions)} distinct positions.')
