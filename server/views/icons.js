// Hand-drawn line icon set (24x24, stroke-based) — keeps a consistent look across every
// browser/OS instead of relying on emoji glyphs, which render inconsistently (and were
// missing entirely for some codepoints during testing). Kept deliberately simple/bold
// so they still read clearly at small sizes.

const ICON_PATHS = {
  // Snowflake — universal cold/refrigeration symbol.
  'commercial-refrigeration-repair': `
    <g stroke-width="1.8">
      <path d="M12 2.5v19"/>
      <path d="M2.5 12h19"/>
      <path d="M5.5 5.5l13 13"/>
      <path d="M18.5 5.5l-13 13"/>
    </g>
    <g stroke-width="1.5">
      <path d="M12 2.5l-2 2.4M12 2.5l2 2.4M12 21.5l-2-2.4M12 21.5l2-2.4"/>
      <path d="M2.5 12l2.4-2M2.5 12l2.4 2M21.5 12l-2.4-2M21.5 12l-2.4 2"/>
    </g>`,

  // Thermometer — clear, unambiguous climate-control symbol for HVAC/AC.
  'commercial-hvac-ac-repair': `
    <path d="M12 14.5V4.8a2 2 0 10-4 0v9.7a4 4 0 104 0z"/>
    <circle cx="10" cy="17" r="1.6" fill="currentColor" stroke="none"/>
    <line x1="10" y1="6.5" x2="10" y2="13" stroke-width="1.3"/>
    <path d="M15 7h3.5M15 10h3.5M15 13h2.5" stroke-width="1.3"/>`,

  // Three ice cubes fanned out — reads clearly as "ice" rather than a generic grid.
  'commercial-ice-machine-repair': `
    <rect x="2.5" y="9.5" width="7" height="7" rx="1" transform="rotate(-8 6 13)"/>
    <rect x="8.5" y="7.2" width="7" height="7" rx="1"/>
    <rect x="14.7" y="9.5" width="7" height="7" rx="1" transform="rotate(8 18.2 13)"/>`,

  // Single bold flame — universal cooking/heat symbol.
  'commercial-kitchen-equipment-repair': `
    <path d="M12 2.8c2.2 2.6 3.6 4.8 3.6 7.6a3.6 3.6 0 01-7.2 0c0-1.1.4-2 1-2.8.1 1 .7 1.6 1.4 1.6.9 0 1.4-.8 1.2-1.7-.3-1.4-1.3-2.5-1.3-4 0-.3.1-.5.3-.7z"/>
    <path d="M6.5 16.5a5.5 5.5 0 0011 0" stroke-width="1.6"/>`,

  // Mixing bowl with a whisk loop — clearer at small sizes than a full whisk head.
  'commercial-mixer-repair': `
    <path d="M4.2 10h15.6l-1.8 8.2a2.4 2.4 0 01-2.35 1.9H8.35A2.4 2.4 0 016 18.2L4.2 10z" stroke-linejoin="round"/>
    <path d="M9.8 10c-.3-2.6.7-4.3 2.2-4.3s2.5 1.7 2.2 4.3" stroke-width="1.4"/>
    <line x1="12" y1="2.3" x2="12" y2="5.9" stroke-width="1.4"/>`,

  // Sparkles — universal "clean/fresh" symbol.
  'commercial-equipment-cleaning-maintenance': `
    <path d="M12 3.5l1.7 4.6 4.6 1.7-4.6 1.7-1.7 4.6-1.7-4.6-4.6-1.7 4.6-1.7z" stroke-linejoin="round"/>
    <path d="M18.8 14.5l.9 2.4 2.4.9-2.4.9-.9 2.4-.9-2.4-2.4-.9 2.4-.9z" stroke-width="1.3" stroke-linejoin="round"/>
    <path d="M5.4 16.6l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" stroke-width="1.3" stroke-linejoin="round"/>`,

  // Hood with venting arrow.
  'commercial-exhaust-hood-repair': `
    <path d="M4.3 9.4L7 4.4h10l2.7 5H4.3z" stroke-linejoin="round"/>
    <line x1="12" y1="9.4" x2="12" y2="16.5"/>
    <path d="M8.6 20.2h6.8"/>
    <path d="M12 1.2v2.6"/>
    <path d="M10.1 2.6L12 1l1.9 1.6" stroke-width="1.3"/>`,
};

function renderServiceIcon(slug, size = 28) {
  const path = ICON_PATHS[slug];
  if (!path) return '';
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
}

module.exports = { renderServiceIcon };
