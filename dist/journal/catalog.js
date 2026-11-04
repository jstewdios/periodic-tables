// Journal stories remain distinct from the instrument catalog. URLs are relative
// to /journal/, including on subdirectory hosts.
export const entries = [
  {
    id: 'hushpod', number: '001', title: 'The Sound That Was Still There',
    question: 'Can something be quiet and still be moving?',
    description: 'Prepare two oscillators half a turn apart. Reveal the motion hidden by cancellation, and compare what is stored with what you hear.',
    topics: 'Cancellation · oscillator action', href: './hushpod/',
    relation: 'Play Hushpod', relatedHref: '../instruments/hushpod/',
    study: 'Study 01 · Emergent Musical Toys',
    source: 'https://github.com/jstewdios/collaborative-instruments/tree/main/studies/001-emergent-musical-toys',
  },
  {
    id: 'ring', number: '002', title: 'The Ring That Will Not Close',
    question: 'Where does a circle of fifths leave its tension?',
    description: 'Twelve pure fifths miss seven octaves. Push one voice, change the listening rule, and hear how the ring shares that mismatch.',
    topics: 'Tuning · the Pythagorean comma', href: './ring/',
    relation: 'Play the full Ring', relatedHref: './ring/full.html',
    study: 'Study 02 · The Question That Changes',
    source: 'https://github.com/jstewdios/collaborative-instruments/tree/main/studies/002-the-question-that-changes',
  },
];
