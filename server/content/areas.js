const areas = [
  { slug: 'miami', name: 'Miami', county: 'Miami-Dade County', neighbors: ['Hialeah', 'Doral', 'Coral Gables', 'Kendall'] },
  { slug: 'hialeah', name: 'Hialeah', county: 'Miami-Dade County', neighbors: ['Miami', 'Doral', 'Miami Lakes'] },
  { slug: 'doral', name: 'Doral', county: 'Miami-Dade County', neighbors: ['Miami', 'Hialeah', 'Miami Springs'] },
  { slug: 'coral-gables', name: 'Coral Gables', county: 'Miami-Dade County', neighbors: ['Miami', 'Kendall', 'South Miami'] },
  { slug: 'kendall', name: 'Kendall', county: 'Miami-Dade County', neighbors: ['Miami', 'Coral Gables', 'Homestead'] },
  { slug: 'homestead', name: 'Homestead', county: 'Miami-Dade County', neighbors: ['Kendall', 'Florida City'] },
  { slug: 'fort-lauderdale', name: 'Fort Lauderdale', county: 'Broward County', neighbors: ['Hollywood', 'Sunrise', 'Davie'] },
  { slug: 'hollywood', name: 'Hollywood', county: 'Broward County', neighbors: ['Fort Lauderdale', 'Aventura', 'Miami'] },
  { slug: 'pompano-beach', name: 'Pompano Beach', county: 'Broward County', neighbors: ['Fort Lauderdale', 'Deerfield Beach'] },
  { slug: 'davie', name: 'Davie', county: 'Broward County', neighbors: ['Fort Lauderdale', 'Sunrise', 'Cooper City'] },
  { slug: 'sunrise', name: 'Sunrise', county: 'Broward County', neighbors: ['Fort Lauderdale', 'Davie', 'Plantation'] },
  { slug: 'west-palm-beach', name: 'West Palm Beach', county: 'Palm Beach County', neighbors: ['Boca Raton', 'Delray Beach', 'Jupiter'] },
  { slug: 'boca-raton', name: 'Boca Raton', county: 'Palm Beach County', neighbors: ['Delray Beach', 'West Palm Beach', 'Deerfield Beach'] },
  { slug: 'delray-beach', name: 'Delray Beach', county: 'Palm Beach County', neighbors: ['Boca Raton', 'Boynton Beach'] },
  { slug: 'boynton-beach', name: 'Boynton Beach', county: 'Palm Beach County', neighbors: ['Delray Beach', 'West Palm Beach'] },
  { slug: 'jupiter', name: 'Jupiter', county: 'Palm Beach County', neighbors: ['West Palm Beach', 'Palm Beach Gardens'] },
];

module.exports = { areas };
