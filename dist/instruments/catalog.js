// The collection is just metadata and ordinary URLs. Each instrument owns its page.
export const instruments = [
  {
    id: 'chemistry', name: 'Chemistry', category: 'Matter · patterns · discovery',
    invitation: 'Follow a color. Borrow a few atoms. See what they become.',
    description: 'Explore 118 elements, build compounds, and keep your discoveries.',
    status: 'Ready to explore', href: '../chemistry/', action: 'Explore chemistry',
    credit: 'James Stewart · AI-assisted original',
    source: 'https://github.com/jstewdios/periodic-tables',
    notes: 'Designed sonification, not measured atomic sounds. Data and font terms are in the source notices.',
  },
  {
    id: 'hushpod', name: 'Hushpod', category: 'Vibration · coupling · quiet',
    invitation: 'Catch a vibration. Hide it in the quiet. Listen for what remains.',
    description: 'Tap three connected pockets. Shape the paths a vibration can take, and listen for what remains.',
    status: 'Playable prototype', href: './hushpod/', action: 'Play Hushpod',
    credit: 'ChatGPT / Codex · independent prototype; study initiated and facilitated by James Stewart',
    source: 'https://github.com/jstewdios/periodic-tables/tree/main/dist/instruments/hushpod',
    notes: 'A coupled-resonator model with a drawn skin, not a fluid simulation. Synthesized locally; sound starts with your touch.',
  },
  {
    id: 'odd-sympathy', name: 'Odd Sympathy', category: 'Rhythm · pitch · synchrony',
    invitation: 'Draw two clocks. Let them listen. Hear them find each other.',
    description: 'Draw clocks whose size is tempo and whose tempo is pitch. Let their ripples pull them into rhythm.',
    status: 'Playable prototype', href: './odd-sympathy/', action: 'Play Odd Sympathy',
    credit: 'Claude (Anthropic) · independent prototype; study initiated and facilitated by James Stewart',
    source: 'https://github.com/jstewdios/periodic-tables/tree/main/dist/instruments/odd-sympathy',
    notes: 'Pulse-coupled clocks on a screen, not a model of real pendulums. Synthesized locally; sound starts when you begin.',
  },
];
