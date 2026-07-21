// General, informational price ranges based on typical commercial repair market rates in
// South Florida. These are ballpark estimates for planning purposes only, not a quote —
// every job gets a firm, flat-rate price after an on-site diagnosis, before work begins.
const pricing = {
  'commercial-refrigeration-repair': {
    serviceCallFee: '$89–$175',
    items: [
      { label: 'Door gasket, hinge, or minor hardware repair', range: '$150–$400' },
      { label: 'Evaporator or condenser fan motor replacement', range: '$300–$700' },
      { label: 'Refrigerant leak repair & recharge', range: '$300–$900+' },
      { label: 'Compressor replacement', range: '$1,200–$3,500+' },
    ],
    factors: [
      'Unit size and refrigerant type (older R22 systems typically cost more to service than modern refrigerants)',
      'Whether the part is in-stock locally or needs to be sourced',
      'Walk-in vs. reach-in vs. display case — access and labor time varies',
      'Age of the unit and whether repair vs. replacement makes more financial sense',
    ],
  },
  'commercial-hvac-ac-repair': {
    serviceCallFee: '$89–$175',
    items: [
      { label: 'Capacitor or contactor replacement', range: '$150–$350' },
      { label: 'Blower/fan motor replacement', range: '$300–$800' },
      { label: 'Refrigerant recharge (leak repair extra)', range: '$300–$900' },
      { label: 'Rooftop unit (RTU) compressor replacement', range: '$1,500–$4,500+' },
    ],
    factors: [
      'Tonnage and type of system (mini-split, split system, or full rooftop package unit)',
      'Roof access and rigging required for RTU work',
      'Age of the system — units past 12–15 years often make more sense to replace than repair',
      'Refrigerant type on older systems',
    ],
  },
  'commercial-ice-machine-repair': {
    serviceCallFee: '$89–$175',
    items: [
      { label: 'Water inlet valve or pump repair', range: '$150–$400' },
      { label: 'Descaling & sanitation service', range: '$150–$300' },
      { label: 'Condenser cleaning (running hot / short-cycling)', range: '$120–$250' },
      { label: 'Compressor / sealed system repair', range: '$600–$1,800' },
    ],
    factors: [
      'Under-counter vs. standalone vs. high-volume production machine',
      'Air-cooled vs. water-cooled condenser',
      'How long scale/mineral buildup has been left untreated',
      'Whether the bin control or thermostat also needs calibration',
    ],
  },
  'commercial-kitchen-equipment-repair': {
    serviceCallFee: '$89–$175',
    items: [
      { label: 'Igniter, thermocouple, or burner repair', range: '$150–$400' },
      { label: 'Control board or electrical repair', range: '$250–$600' },
      { label: 'Fryer element or thermostat replacement', range: '$200–$500' },
      { label: 'Dishwasher pump or motor replacement', range: '$300–$700' },
    ],
    factors: [
      'Gas vs. electric equipment',
      'Brand and whether OEM parts are required',
      'Single-unit repair vs. a full line with multiple pieces of equipment',
      'Whether the repair needs to happen during active service hours',
    ],
  },
  'commercial-mixer-repair': {
    serviceCallFee: '$89–$175',
    items: [
      { label: 'Belt, switch, or speed control repair', range: '$150–$400' },
      { label: 'Bowl-lift mechanism repair', range: '$250–$600' },
      { label: 'Gearbox / transmission repair', range: '$500–$1,200+' },
    ],
    factors: [
      'Stand mixer vs. spiral mixer',
      'Bowl capacity (20-qt vs. 60-qt+ commercial units cost more to service)',
      'Whether parts are stocked or need to be special-ordered for the brand',
    ],
  },
  'commercial-exhaust-hood-repair': {
    serviceCallFee: '$89–$175',
    items: [
      { label: 'Belt, bearing, or pulley repair', range: '$150–$400' },
      { label: 'Exhaust fan motor replacement', range: '$350–$800' },
      { label: 'Control switch or wiring repair', range: '$200–$500' },
    ],
    factors: [
      'Roof-mounted vs. wall-mounted fan access',
      'Grease buildup severity (may require cleaning before diagnosis)',
      'Whether the repair needs to happen ahead of a scheduled health/fire inspection',
    ],
  },
  'commercial-equipment-cleaning-maintenance': {
    serviceCallFee: '$89–$175',
    items: [
      { label: 'Ice machine deep cleaning & sanitation', range: '$150–$450+' },
      { label: 'Condenser / evaporator coil cleaning (per unit)', range: '$120–$350+' },
      { label: 'Walk-in drain line clearing & gasket service', range: '$100–$300' },
      { label: 'Multi-unit deep cleaning (full kitchen/bar)', range: '$400–$1,200+' },
      { label: 'Quarterly preventive-maintenance plan (per visit)', range: '$200–$700+' },
    ],
    factors: [
      'Number of units covered in a single visit — bundling several units is cheaper per unit',
      'How long since the last professional cleaning (heavy scale/buildup takes longer)',
      'One-time deep clean vs. recurring plan pricing (plans cost less per visit)',
      'Air-cooled vs. water-cooled equipment',
    ],
  },
};

module.exports = { pricing };
