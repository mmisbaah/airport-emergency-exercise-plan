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
      soulsOnBoard: 82,
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
    },
    {
      id: 'bomb-threat',
      name: 'Bomb Threat — Terminal Evacuation',
      aircraft: null,
      soulsOnBoard: 0,
      fuelLoad: 'N/A',
      fireInvolved: false,
      casualties: { red: 0, yellow: 1, green: 8, deceased: 0 },
      resources: { arff: 0, ambulances: 2, fireTrucks: 1, buses: 3 },
      injects: [
        '10:00 — Anonymous call claims explosive device in terminal',
        '10:05 — Threat assessed as credible by security',
        '10:10 — Terminal evacuation initiated, passengers moved to assembly area',
        '10:15 — Bomb disposal unit requested from nearest city',
        '10:20 — All flights suspended, airport in lockdown',
        '10:25 — Media arrives, PIO must manage public messaging',
        '10:30 — Secondary screening of all outbound baggage required'
      ]
    },
    {
      id: 'power-failure',
      name: 'Total Power Failure',
      aircraft: null,
      soulsOnBoard: 0,
      fuelLoad: 'N/A',
      fireInvolved: false,
      casualties: { red: 0, yellow: 2, green: 5, deceased: 0 },
      resources: { arff: 1, ambulances: 2, fireTrucks: 1, buses: 2 },
      injects: [
        '22:00 — Complete power failure across airport',
        '22:02 — Emergency lighting activates, runway lights offline',
        '22:05 — All arriving flights diverted to alternate airports',
        '22:10 — Passengers stranded in terminal, no HVAC',
        '22:15 — Backup generator fails to start for critical systems',
        '22:20 — Water pressure drops, sanitation systems affected',
        '22:25 — Coordinate with power utility for restoration timeline'
      ]
    },
    {
      id: 'medical-emergency',
      name: 'Medical Emergency — Aircraft Onboard',
      aircraft: 'ATR 72-600',
      soulsOnBoard: 74,
      fuelLoad: '5,000 kg',
      fireInvolved: false,
      casualties: { red: 1, yellow: 3, green: 10, deceased: 0 },
      resources: { arff: 0, ambulances: 2, fireTrucks: 0, buses: 0 },
      injects: [
        '13:00 — Pilot reports passenger in cardiac arrest, requests priority landing',
        '13:05 — Aircraft cleared for immediate landing',
        '13:10 — Aircraft on ground, EMS boarding at gate',
        '13:12 — Passenger unconscious, CPR in progress',
        '13:15 — Ambulance transports passenger to hospital',
        '13:20 — Remaining passengers held for questioning and care',
        '13:25 — Aircraft inspection required before next departure'
      ]
    },
    {
      id: 'runway-incursion',
      name: 'Runway Incursion — Vehicle on Runway',
      aircraft: 'Dash 8 Q400',
      soulsOnBoard: 82,
      fuelLoad: '6,530 L',
      fireInvolved: false,
      casualties: { red: 0, yellow: 1, green: 3, deceased: 0 },
      resources: { arff: 1, ambulances: 1, fireTrucks: 1, buses: 0 },
      injects: [
        '08:00 — Maintenance vehicle enters active runway without clearance',
        '08:01 — Tower instructs arriving aircraft to go around',
        '08:02 — Aircraft executes go-around, minimum separation 200 feet',
        '08:05 — Vehicle located and escorted off runway',
        '08:10 — Runway inspection for debris and damage',
        '08:15 — Operations resume, significant delays expected',
        '08:20 — Investigation launched, driver interviewed'
      ]
    },
    {
      id: 'severe-weather',
      name: 'Severe Weather — Microburst',
      aircraft: null,
      soulsOnBoard: 0,
      fuelLoad: 'N/A',
      fireInvolved: false,
      casualties: { red: 0, yellow: 0, green: 2, deceased: 0 },
      resources: { arff: 1, ambulances: 1, fireTrucks: 1, buses: 2 },
      injects: [
        '15:00 — Weather alert: microburst warning for airport area',
        '15:05 — Wind shear detected on final approach',
        '15:08 — Arriving aircraft executes go-around',
        '15:10 — All operations suspended, aircraft hold at alternate airports',
        '15:15 — Terminal passengers moved away from windows',
        '15:20 — Debris reported on runway and taxiways',
        '15:25 — Damage assessment of infrastructure begins',
        '15:30 — Coordinate with meteorological service for all-clear'
      ]
    },
    {
      id: 'hijack-threat',
      name: 'Unlawful Interference — Hijack Threat',
      aircraft: 'ATR 42-600',
      soulsOnBoard: 52,
      fuelLoad: '4,000 kg',
      fireInvolved: false,
      casualties: { red: 0, yellow: 0, green: 0, deceased: 0 },
      resources: { arff: 1, ambulances: 1, fireTrucks: 1, buses: 0 },
      injects: [
        '11:00 — Pilot reports possible hijacker onboard, squawks 7500',
        '11:02 — Aircraft cleared for priority landing, isolated parking assigned',
        '11:05 — Law enforcement notified, tactical team mobilized',
        '11:10 — Aircraft on ground at remote stand, engines running',
        '11:15 — Negotiation team establishes contact',
        '11:20 — Passengers report demands being made',
        '11:25 — Fuel exhaustion risk if situation prolonged',
        '11:30 — Coordinate with national security agencies'
      ]
    },
    {
      id: 'mass-casualty',
      name: 'Mass Casualty — Multi-Incident',
      aircraft: 'ATR 72-600',
      soulsOnBoard: 74,
      fuelLoad: '5,000 kg',
      fireInvolved: true,
      casualties: { red: 15, yellow: 30, green: 20, deceased: 9 },
      resources: { arff: 3, ambulances: 10, fireTrucks: 4, buses: 5 },
      injects: [
        '17:00 — Aircraft crashes on landing, breaks into three sections',
        '17:02 — Fire erupts in center fuselage section',
        '17:05 — Multiple casualties reported across wreckage',
        '17:08 — Mutual aid requested from all regional services',
        '17:10 — Triage overwhelmed, request additional medical teams',
        '17:15 — Hospital capacity reached, activate mass casualty plan',
        '17:20 — Family reception center overwhelmed, request additional staff',
        '17:25 — Media presence growing, establish remote briefing area'
      ]
    },
    {
      id: 'chemical-spill',
      name: 'HazMat Spill — Cargo Area',
      aircraft: null,
      soulsOnBoard: 0,
      fuelLoad: 'N/A',
      fireInvolved: false,
      casualties: { red: 1, yellow: 4, green: 6, deceased: 0 },
      resources: { arff: 1, ambulances: 2, fireTrucks: 2, buses: 1 },
      injects: [
        '09:00 — Cargo handler reports chemical leak in freight terminal',
        '09:02 — Substance identified as corrosive liquid',
        '09:05 — Area evacuated, two workers showing symptoms',
        '09:10 — HazMat team dispatched, PPE required',
        '09:15 — Wind direction shifts, vapor drifts toward terminal',
        '09:20 — Terminal ventilation shut down to prevent ingress',
        '09:25 — Decontamination corridor established',
        '09:30 — Environmental agency notified'
      ]
    },
    {
      id: 'security-breach',
      name: 'Security Breach — Perimeter Intrusion',
      aircraft: null,
      soulsOnBoard: 0,
      fuelLoad: 'N/A',
      fireInvolved: false,
      casualties: { red: 0, yellow: 0, green: 1, deceased: 0 },
      resources: { arff: 0, ambulances: 1, fireTrucks: 0, buses: 0 },
      injects: [
        '02:00 — Motion sensors detect perimeter breach near runway 09 threshold',
        '02:02 — Security patrols dispatched to investigate',
        '02:05 — Two individuals spotted on airside, fleeing toward fence',
        '02:08 — All departures suspended, aircraft held at gates',
        '02:10 — Individuals apprehended by security',
        '02:15 — Perimeter inspection for additional breaches',
        '02:20 — Operations resume with enhanced security patrols',
        '02:25 — Review CCTV footage and access control logs'
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
      name: 'Dash 8-300',
      operator: 'Mid-size regional turboprop',
      pax: 50, crew: '2+2', total: 54, wheels: 4,
      specs: [
        { k: 'Fuel capacity', v: '3,160 L' },
        { k: 'Fuel storage', v: 'Wing tanks' },
        { k: 'Boarding door', v: 'Forward left' },
        { k: 'Baggage holds', v: 'Forward + aft' },
        { k: 'Landing gear', v: 'Tricycle, retractable' },
        { k: 'Emergency exits', v: '2 doors + overwing' }
      ]
    },
    {
      name: 'Dash 8-200',
      operator: 'Shorter regional turboprop',
      pax: 37, crew: '2+1', total: 40, wheels: 4,
      specs: [
        { k: 'Fuel capacity', v: '3,160 L' },
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
