"""Copy project notices into the tracked static distribution. Run after editing them."""
from pathlib import Path

root = Path(__file__).resolve().parents[1]
(root / 'dist/LICENSE.txt').write_bytes((root / 'LICENSE').read_bytes())
notice = (root / 'THIRD_PARTY_NOTICES.md').read_text()
# The deployed copy is plain text: repository-relative links resolve via its source tree.
base = 'https://github.com/jstewdios/periodic-tables/blob/main/'
for path in ['LICENSE', 'dist/fonts/DM-Sans-OFL.txt', 'dist/fonts/Manrope-OFL.txt', 'docs/provenance.json', 'docs/SCIENCE.md']:
    notice = notice.replace('](' + path + ')', '](' + base + path + ')')
notice += '\nLocal copies in this distribution: LICENSE.txt, fonts/DM-Sans-OFL.txt, fonts/Manrope-OFL.txt.\n'
(root / 'dist/THIRD_PARTY_NOTICES.txt').write_text(notice)
print('Updated deployed license and third-party notices.')
