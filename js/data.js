/* =====================================================
   DATA — Edit these values to customise the dashboard.
   ===================================================== */

var TTX_DATA = {

  /* Checklist items for the IC Checklist tab */
  checklistItems: [
    'AEP reviewed and IC role officially confirmed',
    'Scenario and exercise objectives fully understood',
    'Incident Command Post established and identifiable',
    'Size-up completed and Incident Action Plan communicated',
    'Safety Officer assigned',
    'Public Information Officer assigned',
    'Liaison Officer assigned',
    'Multi-agency coordination active (fire, police, EMS, ops)',
    'Zones established and both cordons controlled',
    'Key locations activated — CCP, FAC, staging, morgue',
    'Hot Wash attended and AAR contributions submitted'
  ],

  /* Map pin categories */
  pinCategories: {
    command:  { label: 'Command & Coordination', color: '#3b82f6' },
    casualty: { label: 'Casualty Management',     color: '#ef4444' },
    family:   { label: 'Family & Survivor',       color: '#22c55e' },
    staging:  { label: 'Staging & Logistics',     color: '#f59e0b' },
    media:    { label: 'Media',                   color: '#a855f7' }
  },

  /* Key locations shown on the map — adjust to your airport layout */
  locations: [
    { id: 1, cat: 'command', x: 400, y: 185,
      name: 'Incident Command Post (ICP)',
      desc: 'Upwind of crash site, outside warm zone. Clear line-of-sight to runway and apron.' },
    { id: 2, cat: 'command', x: 239, y: 200,
      name: 'Emergency Operations Center (EOC)',
      desc: 'Fixed facility within the terminal complex. Strategic coordination with external agencies.' },
    { id: 3, cat: 'command', x: 280, y: 490,
      name: 'Access / Crisis Control Point',
      desc: 'Single controlled entry on the access road where it meets the airport boundary.' },

    { id: 4, cat: 'casualty', x: 455, y: 310,
      name: 'Survivor Collection Area',
      desc: 'Safe assembly point on the apron side, edge of the hot zone. Initial gathering before triage.' },
    { id: 5, cat: 'casualty', x: 390, y: 355,
      name: 'Triage Area',
      desc: 'Upwind of crash, inside warm zone. Casualties sorted Red / Yellow / Green.' },
    { id: 6, cat: 'casualty', x: 330, y: 400,
      name: 'Casualty Collection Point (CCP)',
      desc: 'Treatment & stabilisation area. Colour-coded zones for priority care.' },
    { id: 7, cat: 'casualty', x: 250, y: 420,
      name: 'Transportation Area',
      desc: 'Ambulance loading on the access road. Direct route to hospitals.' },
    { id: 8, cat: 'casualty', x: 800, y: 460,
      name: 'Temporary Morgue',
      desc: 'Remote corner of the airfield. Secure, dignified, away from terminal and public.' },

    { id: 9, cat: 'family', x: 205, y: 270,
      name: 'Family Assistance Center (FAC)',
      desc: 'Terminal conference room. Secure, private, off the operational area.' },
    { id: 10, cat: 'family', x: 300, y: 270,
      name: 'Uninjured Survivor Holding Area',
      desc: 'Terminal waiting area. Separate from casualties, for interviews and eventual release.' },

    { id: 11, cat: 'staging', x: 370, y: 240,
      name: 'Resource Staging Center',
      desc: 'Apron parking for mutual aid. Registration, briefing, and assignment point.' },
    { id: 12, cat: 'staging', x: 200, y: 440,
      name: 'Ambulance Staging Area',
      desc: 'Adjacent to the transportation area. Ambulances wait for dispatch.' },

    { id: 13, cat: 'media', x: 160, y: 330,
      name: 'Media / Public Information Area',
      desc: 'Outside outer cordon. PIO briefings away from operations.' }
  ],

  /* Aircraft comparison data */
  aircraftComparison: [
    { name: 'ATR 72-600',    pax: 70, crew: '2 + 2', total: 74, fuel: '5,000 kg', wheels: 4, door: 'Rear left',    baggage: 'Fwd + aft holds' },
    { name: 'ATR 42-600',    pax: 48, crew: '2 + 2', total: 52, fuel: '4,000 kg', wheels: 4, door: 'Rear left',    baggage: 'Fwd + aft holds' },
    { name: 'Dash 8 Q400',   pax: 78, crew: '2 + 2', total: 82, fuel: '6,530 L',  wheels: 4, door: 'Forward left', baggage: 'Fwd + aft holds' },
    { name: 'Dash 8-300',    pax: 50, crew: '2 + 2', total: 54, fuel: '3,160 L',  wheels: 4, door: 'Forward left', baggage: 'Fwd + aft holds' },
    { name: 'Dash 8-200',    pax: 37, crew: '2 + 1', total: 40, fuel: '3,160 L',  wheels: 4, door: 'Forward left', baggage: 'Fwd + aft holds' },
    { name: 'Dornier 228',   pax: 19, crew: '2 + 1', total: 22, fuel: '1,885 kg', wheels: 4, door: 'Left main door', baggage: 'Fwd + aft holds' }
  ],

  /* Scenarios for the scenario selector — customise for your airport */
  scenarios: [
    {
      id: 'atr72-crash',
      name: 'Regional Turboprop Crash on Runway',
      aircraft: 'ATR 72-600',
      soulsOnBoard: 74,
      fuelLoad: '5,000 kg',
      fireInvolved: true,
      casualties: { red: 8, yellow: 22, green: 34, deceased: 10 },
      resources: { arff: 2, ambulances: 6, fireTrucks: 2, buses: 2 },
      injects: [
        '09:00 — Aircraft reports gear malfunction, requests priority landing',
        '09:05 — Aircraft crashes short of runway, breaks apart',
        '09:06 — Fuel fire erupts near wreckage, spreading east',
        '09:10 — Wind shifts 45 degrees, smoke drifts toward terminal',
        '09:15 — Secondary explosion reported in rear fuselage',
        '09:20 — Media helicopter spotted overflying the scene'
      ]
    },
    {
      id: 'terminal-fire',
      name: 'Terminal Fire',
      aircraft: null,
      soulsOnBoard: 120,
      fuelLoad: 'N/A',
      fireInvolved: true,
      casualties: { red: 4, yellow: 18, green: 60, deceased: 0 },
      resources: { arff: 1, ambulances: 4, fireTrucks: 3, buses: 1 },
      injects: [
        '14:00 — Smoke reported in terminal kitchen',
        '14:03 — Fire alarm activated, sprinkler system fails',
        '14:05 — Fire spreads to ceiling void, heavy smoke in departures',
        '14:10 — Two passengers trapped in upstairs lounge',
        '14:15 — Power failure in terminal, emergency lighting only',
        '14:20 — Media arrives outside perimeter'
      ]
    },
    {
      id: 'fuel-spill',
      name: 'Fuel Spill on Apron',
      aircraft: 'Dash 8 Q400',
      soulsOnBoard: 0,
      fuelLoad: '6,530 L',
      fireInvolved: false,
      casualties: { red: 0, yellow: 2, green: 5, deceased: 0 },
      resources: { arff: 1, ambulances: 1, fireTrucks: 1, buses: 0 },
      injects: [
        '11:00 — Fuel bowser hose ruptures during refuelling',
        '11:02 — Approximately 2,000 L of Jet A-1 spills across apron',
        '11:05 — Fuel vapour drifts toward terminal intake vents',
        '11:10 — Aircraft evacuation initiated as precaution',
        '11:15 — Ignition source reported in nearby maintenance vehicle',
        '11:20 — Wind increases, vapour cloud expands'
      ]
    },
    {
      id: 'do228-gear-up',
      name: 'Gear-Up Landing',
      aircraft: 'Dornier 228',
      soulsOnBoard: 22,
      fuelLoad: '1,885 kg',
      fireInvolved: false,
      casualties: { red: 2, yellow: 6, green: 12, deceased: 2 },
      resources: { arff: 1, ambulances: 3, fireTrucks: 1, buses: 1 },
      injects: [
        '16:00 — Aircraft reports gear indication problem',
        '16:05 — Low pass confirms gear not extended',
        '16:10 — Gear-up landing on runway, aircraft skids to stop',
        '16:12 — Fuel leak reported from wing area',
        '16:15 — Runway blocked, airport closed to all traffic',
        '16:20 — Recovery equipment requested from nearest major airport'
      ]
    }
  ],

  /* Aircraft detail cards */
  aircraftDetails: [
    {
      name: 'ATR 72-600',
      operator: 'Common regional turboprop',
      pax: 70, crew: '2+2', total: 74, wheels: 4,
      specs: [
        { k: 'Fuel capacity', v: '5,000 kg' },
        { k: 'Fuel storage', v: 'Integral wing tanks' },
        { k: 'Boarding door', v: 'Rear left (main)' },
        { k: 'Baggage holds', v: 'Forward + aft' },
        { k: 'Landing gear', v: 'Tricycle, retractable' },
        { k: 'Emergency exits', v: '4 main + overwing' }
      ]
    },
    {
      name: 'ATR 42-600',
      operator: 'Shorter-fuselage regional variant',
      pax: 48, crew: '2+2', total: 52, wheels: 4,
      specs: [
        { k: 'Fuel capacity', v: '4,000 kg' },
        { k: 'Fuel storage', v: 'Integral wing tanks' },
        { k: 'Boarding door', v: 'Rear left (main)' },
        { k: 'Baggage holds', v: 'Forward + aft' },
        { k: 'Landing gear', v: 'Tricycle, retractable' },
        { k: 'Emergency exits', v: '4 main + overwing' }
      ]
    },
    {
      name: 'Dash 8 Q400',
      operator: 'High-speed, high-capacity turboprop',
      pax: 78, crew: '2+2', total: 82, wheels: 4,
      specs: [
        { k: 'Fuel capacity', v: '6,530 L' },
        { k: 'Fuel storage', v: 'Wing tanks' },
        { k: 'Boarding door', v: 'Forward left' },
        { k: 'Baggage holds', v: 'Forward + aft' },
        { k: 'Landing gear', v: 'Tricycle, retractable' },
        { k: 'Emergency exits', v: '2 doors + overwing' }
      ]
    },
    {
      name: 'Dornier 228',
      operator: 'Short-field utility aircraft',
      pax: 19, crew: '2+1', total: 22, wheels: 4,
      specs: [
        { k: 'Fuel capacity', v: '1,885 kg' },
        { k: 'Fuel storage', v: 'Wing tanks' },
        { k: 'Boarding door', v: 'Left main / cargo door' },
        { k: 'Baggage holds', v: 'Fwd 90–120 kg · Aft 150–210 kg' },
        { k: 'Landing gear', v: 'Tricycle, retractable' },
        { k: 'Emergency exits', v: 'Main door + rear' }
      ]
    }
  ]
};
