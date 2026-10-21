/* =====================================================
   DATA — Edit these values to customise the dashboard.

   Scenarios adapt to the airport + runway picked in the header
   (see js/airports.js):
     aircraftRole  'regional' | 'jet' | 'widebody' | 'seaplane' (or a
                   preference list) — swapped for the aircraft the
                   selected airport actually handles; souls on board,
                   fuel, casualties and resources scale with it
     requires      airport features the scenario needs ('seaplane',
                   'seaTransfer', 'roadHospital')
     site          where the incident marker goes on the map
     {TOKENS}      in injects are filled per airport: {AIRPORT} {RWY}
                   {RWY_RECIP} {THR_SIDE} {FAR_SIDE} {HOSPITAL}
                   {HOSP_ETA} {TERTIARY} {REFERRAL} {MUTUAL_AID} {EOD}
                   {RECOVERY} {UTILITY} {AIRCRAFT} {ISLAND} {ATOLL}
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
    'Multi-agency coordination active (RFF, MNDF, police, health, ops)',
    'Zones established and both cordons controlled',
    'Key locations activated — CCP, FAC, staging, morgue',
    'Marine response activated — Coast Guard / airport rescue boats for any water-side risk',
    'Casualty transport plan confirmed — road, sea ambulance or air MEDEVAC to the receiving hospital',
    'Embassies, resort and tour operators contacted through authorised liaison for passenger accounting and family support',
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

  /* Key locations shown on the map. x / y are fallbacks — each airport
     profile places them on its own island layout (js/airports.js). */
  locations: [
    { id: 1, cat: 'command', x: 400, y: 185,
      name: 'Incident Command Post (ICP)',
      desc: 'Upwind of the incident, outside the warm zone. Clear line-of-sight to the runway and apron.' },
    { id: 2, cat: 'command', x: 239, y: 200,
      name: 'Emergency Operations Center (EOC)',
      desc: 'Fixed facility in the terminal complex. Strategic coordination with MNDF, police, health and NDMA.' },
    { id: 3, cat: 'command', x: 280, y: 490,
      name: 'Access / Crisis Control Point',
      desc: 'Single controlled entry where the landside road, causeway or bridge meets the airport.' },

    { id: 4, cat: 'casualty', x: 455, y: 310,
      name: 'Survivor Collection Area',
      desc: 'Safe assembly point at the edge of the hot zone. Initial gathering before triage.' },
    { id: 5, cat: 'casualty', x: 390, y: 355,
      name: 'Triage Area',
      desc: 'Upwind of the incident, inside the warm zone. Casualties sorted Red / Yellow / Green.' },
    { id: 6, cat: 'casualty', x: 330, y: 400,
      name: 'Casualty Collection Point (CCP)',
      desc: 'Treatment & stabilisation area. Colour-coded zones for priority care while transport is arranged.' },
    { id: 7, cat: 'casualty', x: 250, y: 420,
      name: 'Transportation Area',
      desc: 'Ambulance loading on the landside road. Direct route to the jetty or the hospital road.' },
    { id: 8, cat: 'casualty', x: 800, y: 460,
      name: 'Temporary Morgue',
      desc: 'AEP-designated screened location with controlled access, dignified handling and a confirmed onward transfer arrangement.' },

    { id: 9, cat: 'family', x: 205, y: 270,
      name: 'Family Assistance Center (FAC)',
      desc: 'Terminal conference room. Private space for relatives, embassy staff and resort representatives.' },
    { id: 10, cat: 'family', x: 300, y: 270,
      name: 'Uninjured Survivor Holding Area',
      desc: 'Terminal waiting area. Separate from casualties — for interviews, immigration and onward transfer.' },

    { id: 11, cat: 'staging', x: 370, y: 240,
      name: 'Resource Staging Center',
      desc: 'Apron parking for arriving mutual aid. Registration, briefing and assignment point.' },
    { id: 12, cat: 'staging', x: 200, y: 440,
      name: 'Ambulance Staging Area',
      desc: 'Next to the transportation area. Ambulances wait for dispatch.' },

    { id: 13, cat: 'media', x: 160, y: 330,
      name: 'Media / Public Information Area',
      desc: 'Outside the outer cordon. PIO briefings away from operations — watch for drone and phone footage.' },

    { id: 14, cat: 'casualty', x: 120, y: 520,
      name: 'Jetty — Sea Ambulance Transfer Point',
      desc: 'Boat loading for casualties going to an off-island hospital. Needs a triage officer and a stretcher team.' },
    { id: 15, cat: 'staging', x: 860, y: 300,
      name: 'Marine Rescue Staging',
      desc: 'Rendezvous for Coast Guard, airport rescue boats and resort / ferry boats joining a water-side response.' }
  ],

  /* Aircraft comparison data */
  aircraftComparison: [
    { name: 'DHC-6 Twin Otter (floats)', pax: 15, crew: '2 + 0', total: 17, fuel: '1,450 L', wheels: 0, door: 'Rear left (pax) + fwd crew', baggage: 'Nose + aft compartment' },
    { name: 'Dornier 228',   pax: 19, crew: '2 + 1', total: 22, fuel: '1,885 kg', wheels: 4, door: 'Left main door', baggage: 'Fwd + aft holds' },
    { name: 'Dash 8-200',    pax: 37, crew: '2 + 1', total: 40, fuel: '3,160 L',  wheels: 4, door: 'Forward left', baggage: 'Fwd + aft holds' },
    { name: 'ATR 42-600',    pax: 48, crew: '2 + 2', total: 52, fuel: '4,000 kg', wheels: 4, door: 'Rear left',    baggage: 'Fwd + aft holds' },
    { name: 'Dash 8-300',    pax: 50, crew: '2 + 2', total: 54, fuel: '3,160 L',  wheels: 4, door: 'Forward left', baggage: 'Fwd + aft holds' },
    { name: 'ATR 72-600',    pax: 70, crew: '2 + 2', total: 74, fuel: '5,000 kg', wheels: 4, door: 'Rear left',    baggage: 'Fwd + aft holds' },
    { name: 'Dash 8 Q400',   pax: 78, crew: '2 + 2', total: 82, fuel: '6,530 L',  wheels: 4, door: 'Forward left', baggage: 'Fwd + aft holds' },
    { name: 'Fokker 100',    pax: 100, crew: '2 + 3', total: 105, fuel: '13,600 L', wheels: 4, door: 'Forward left', baggage: 'Fwd + aft holds' },
    { name: 'Airbus A320-200', pax: 150, crew: '2 + 4', total: 156, fuel: '23,859 L', wheels: 4, door: 'Forward left', baggage: 'Fwd + aft holds' },
    { name: 'Boeing 737-800', pax: 162, crew: '2 + 4', total: 168, fuel: '26,020 L', wheels: 4, door: 'Forward left', baggage: 'Fwd + aft holds' },
    { name: 'Airbus A330-200', pax: 260, crew: '2 + 9', total: 271, fuel: '139,090 L', wheels: 8, door: 'Forward left', baggage: 'Fwd + aft + bulk holds' },
    { name: 'Boeing 777-300ER', pax: 360, crew: '2 + 14', total: 376, fuel: '181,280 L', wheels: 12, door: 'Forward left', baggage: 'Fwd + aft + bulk holds' }
  ],

  /* Scenarios for the scenario selector — adapt to the selected airport */
  scenarios: [
    {
      id: 'atr72-crash',
      name: 'Regional Turboprop Crash on Approach',
      aircraft: 'ATR 72-600',
      aircraftRole: 'regional',
      site: 'undershoot',
      soulsOnBoard: 74,
      fuelLoad: '5,000 kg',
      fireInvolved: true,
      casualties: { red: 8, yellow: 22, green: 34, deceased: 10 },
      resources: { arff: 2, ambulances: 6, fireTrucks: 2, buses: 2, boats: 3 },
      injects: [
        '09:00 — {AIRCRAFT} reports gear malfunction, requests priority landing {RWY} at {AIRPORT}',
        '09:05 — Aircraft lands short of {RWY}, breaks apart on the reef edge at the {THR_SIDE} end',
        '09:06 — Fuel fire on the wreckage; survivors in the water and on the reef flat',
        '09:10 — Wind shifts 45 degrees, smoke drifts toward the terminal',
        '09:15 — Rescue boats needed — only part of the wreck is reachable from land',
        '09:20 — A nearby boat is livestreaming the incident; unverified casualty figures spread online and reporters request confirmation',
        '09:30 — Receiving hospital ({HOSPITAL}) asks for casualty numbers — transfer {HOSP_ETA}'
      ]
    },
    {
      id: 'seaplane-capsize',
      name: 'Seaplane Capsize at the Water Aerodrome',
      aircraft: 'DHC-6 Twin Otter (floats)',
      aircraftRole: 'seaplane',
      requires: ['seaplane'],
      category: 'aircraft',
      site: 'water',
      soulsOnBoard: 17,
      fuelLoad: '1,450 L',
      fireInvolved: false,
      casualties: { red: 2, yellow: 4, green: 9, deceased: 1 },
      resources: { arff: 1, ambulances: 3, fireTrucks: 0, buses: 1, boats: 4 },
      injects: [
        '08:30 — Twin Otter on the water lane at {AIRPORT} reports gusts as it touches down',
        '08:31 — Float digs in, aircraft tips over and starts to invert in the lagoon',
        '08:33 — Passengers trapped in the cabin; two people swimming toward the docks',
        '08:35 — All seaplane departures and arrivals stopped; water lanes closed',
        '08:40 — Fuel sheen on the water drifting toward the floating docks',
        '08:45 — Resort transfer passengers in the seaplane lounge demand information',
        '08:50 — Divers requested from the Coast Guard; casualties landed at the docks for triage',
        '08:52 — Rescue boats bring survivors ashore faster than the medical boat can transfer patients; prioritise and track each handover',
        '08:54 — A promised resort boat is unavailable; the replacement has no confirmed stretcher capability',
        '08:55 — News drone launched from a nearby boat over the lagoon — seaplane lanes still closed',
        '09:00 — Tour operator asks for the passenger manifest — several nationalities aboard'
      ]
    },
    {
      id: 'runway-overrun-lagoon',
      name: 'Runway Overrun into the Lagoon',
      aircraft: 'Airbus A320-200',
      aircraftRole: ['jet', 'regional'],
      category: 'aircraft',
      site: 'overrun',
      soulsOnBoard: 156,
      fuelLoad: '23,859 L',
      fireInvolved: false,
      casualties: { red: 4, yellow: 18, green: 60, deceased: 0 },
      resources: { arff: 3, ambulances: 6, fireTrucks: 2, buses: 4, boats: 4 },
      injects: [
        '19:40 — Heavy rain shower over {AIRPORT}, standing water reported on {RWY}',
        '19:46 — {AIRCRAFT} lands long on {RWY} and fails to stop',
        '19:47 — Aircraft overruns the {FAR_SIDE} end and comes to rest nose-down in the lagoon',
        '19:48 — Slides deployed; passengers evacuating into waist-deep water in the dark',
        '19:52 — Jet fuel leaking into the lagoon; risk to the reef and to swimmers',
        '19:55 — Runway closed — all inbound traffic must divert',
        '20:05 — Head count does not match the manifest — people may have drifted',
        '20:10 — Media drones over the lagoon filming the evacuation — inbound aircraft told to hold',
        '20:20 — Environmental agency asks about fuel containment booms'
      ]
    },
    {
      id: 'remote-island-medevac',
      name: 'Turboprop Accident — No Hospital on the Island',
      aircraft: 'ATR 72-600',
      aircraftRole: 'regional',
      requires: ['seaTransfer'],
      category: 'aircraft',
      site: 'runway',
      soulsOnBoard: 74,
      fuelLoad: '5,000 kg',
      fireInvolved: true,
      casualties: { red: 6, yellow: 16, green: 30, deceased: 4 },
      resources: { arff: 2, ambulances: 4, fireTrucks: 1, buses: 2, boats: 5 },
      injects: [
        '16:10 — {AIRCRAFT} veers off {RWY} after landing at {AIRPORT}; small fire at the right engine',
        '16:12 — Fire knocked down; evacuation through the forward and rear doors',
        '16:15 — Island health centre can take only a handful of stretcher cases',
        '16:20 — {HOSPITAL} alerted — every casualty must go {HOSP_ETA}',
        '16:30 — Sea state rising; one sea ambulance available, resorts offering speedboats',
        '16:35 — Receiving hospital accepts only two Red casualties; confirm destination and onward transport for the remaining patients',
        '16:40 — The primary jetty becomes unusable; identify an alternative handover point and recalculate the last patient arrival',
        '16:45 — Two Red casualties need surgery — referral to {TERTIARY}: {REFERRAL}',
        '17:30 — Facilitator provides the exercise daylight cut-off; confirm aircraft operating constraints and an alternative medical transport route',
        '18:00 — Island Council opens the school as a holding area for uninjured passengers'
      ]
    },
    {
      id: 'terminal-fire',
      name: 'Terminal Fire',
      aircraft: null,
      category: 'fire',
      site: 'terminal',
      soulsOnBoard: 120,
      fuelLoad: 'N/A',
      fireInvolved: true,
      casualties: { red: 4, yellow: 18, green: 60, deceased: 0 },
      resources: { arff: 1, ambulances: 4, fireTrucks: 3, buses: 1, boats: 0 },
      injects: [
        '14:00 — Smoke reported in the {AIRPORT} terminal kitchen',
        '14:03 — Fire alarm activated, sprinkler system fails',
        '14:05 — Fire spreads to ceiling void, heavy smoke in departures',
        '14:10 — Two passengers trapped in upstairs lounge',
        '14:15 — Power failure in terminal, emergency lighting only',
        '14:18 — Structural fire support requested — {MUTUAL_AID}',
        '14:20 — Resort transfer desks evacuated; hundreds of tourists on the forecourt in the heat',
        '14:25 — Media drone filming above the terminal roof, near the firefighting operation'
      ]
    },
    {
      id: 'fuel-spill',
      name: 'Fuel Spill on Apron',
      aircraft: 'Dash 8 Q400',
      aircraftRole: 'regional',
      category: 'hazmat',
      site: 'apron',
      soulsOnBoard: 82,
      fuelLoad: '6,530 L',
      fireInvolved: false,
      casualties: { red: 0, yellow: 2, green: 5, deceased: 0 },
      resources: { arff: 1, ambulances: 1, fireTrucks: 1, buses: 0, boats: 1 },
      injects: [
        '11:00 — Fuel bowser hose ruptures while refuelling the {AIRCRAFT}',
        '11:02 — Approximately 2,000 L of Jet A-1 spills across apron',
        '11:05 — Fuel vapour drifts toward terminal intake vents',
        '11:08 — Fuel running toward the apron drains — which discharge into the lagoon',
        '11:10 — Aircraft evacuation initiated as precaution',
        '11:15 — Ignition source reported in nearby maintenance vehicle',
        '11:20 — Wind increases, vapour cloud expands'
      ]
    },
    {
      id: 'do228-gear-up',
      name: 'Gear-Up Landing',
      aircraft: 'Dornier 228',
      aircraftRole: 'regional',
      category: 'aircraft',
      site: 'runway',
      soulsOnBoard: 22,
      fuelLoad: '1,885 kg',
      fireInvolved: false,
      casualties: { red: 2, yellow: 6, green: 12, deceased: 2 },
      resources: { arff: 1, ambulances: 3, fireTrucks: 1, buses: 1, boats: 0 },
      injects: [
        '16:00 — {AIRCRAFT} reports a gear indication problem on approach to {AIRPORT}',
        '16:05 — Low pass confirms gear not extended',
        '16:10 — Gear-up landing on {RWY}, aircraft skids to a stop on the runway',
        '16:12 — Fuel leak reported from wing area',
        '16:15 — The only runway is blocked — {AIRPORT} closed to all traffic',
        '16:20 — Recovery: {RECOVERY}',
        '16:30 — Airlines ask how long the airport will be closed — outbound tourists stranded'
      ]
    },
    {
      id: 'bomb-threat',
      name: 'Bomb Threat — Terminal Evacuation',
      aircraft: null,
      category: 'security',
      site: 'terminal',
      soulsOnBoard: 0,
      fuelLoad: 'N/A',
      fireInvolved: false,
      casualties: { red: 0, yellow: 1, green: 8, deceased: 0 },
      resources: { arff: 0, ambulances: 2, fireTrucks: 1, buses: 3, boats: 1 },
      injects: [
        '10:00 — Anonymous call claims an explosive device in the {AIRPORT} terminal',
        '10:05 — Threat assessed as credible by Maldives Police Service and AVSEC',
        '10:10 — Terminal evacuation initiated, passengers moved to assembly area',
        '10:15 — Bomb disposal requested — {EOD}',
        '10:20 — All flights suspended, airport in lockdown',
        '10:25 — Resort boats and seaplanes arriving with departing guests must be held offshore',
        '10:30 — Secondary screening of all outbound baggage required'
      ]
    },
    {
      id: 'power-failure',
      name: 'Total Power Failure',
      aircraft: null,
      category: 'infrastructure',
      site: 'terminal',
      soulsOnBoard: 0,
      fuelLoad: 'N/A',
      fireInvolved: false,
      casualties: { red: 0, yellow: 2, green: 5, deceased: 0 },
      resources: { arff: 1, ambulances: 2, fireTrucks: 1, buses: 2, boats: 0 },
      injects: [
        '22:00 — Complete power failure across {AIRPORT}',
        '22:02 — Emergency lighting activates, runway lights offline',
        '22:05 — Arrivals told to hold or divert — the next nearest runway may be an hour away',
        '22:10 — Passengers stranded in terminal, no air conditioning in 30 °C heat',
        '22:15 — Backup generator fails to start for critical systems',
        '22:20 — Desalination pumps stop — drinking water and sanitation affected',
        '22:25 — Coordinate with {UTILITY} for restoration timeline'
      ]
    },
    {
      id: 'medical-emergency',
      name: 'Medical Emergency — Aircraft Onboard',
      aircraft: 'ATR 72-600',
      aircraftRole: ['jet', 'regional'],
      category: 'medical',
      site: 'apron',
      soulsOnBoard: 74,
      fuelLoad: '5,000 kg',
      fireInvolved: false,
      casualties: { red: 1, yellow: 3, green: 10, deceased: 0 },
      resources: { arff: 0, ambulances: 2, fireTrucks: 0, buses: 0, boats: 1 },
      injects: [
        '13:00 — Pilot of {AIRCRAFT} reports passenger in cardiac arrest, requests priority landing',
        '13:05 — Aircraft cleared for immediate landing {RWY}',
        '13:10 — Aircraft on stand, medical team boarding',
        '13:12 — Passenger unconscious, CPR in progress',
        '13:15 — Transfer to {HOSPITAL} — {HOSP_ETA}',
        '13:20 — Remaining passengers held for care and questioning',
        '13:25 — Aircraft inspection required before next departure'
      ]
    },
    {
      id: 'communicable-disease',
      name: 'Suspected Communicable Disease on Arriving Flight',
      aircraft: 'Airbus A320-200',
      aircraftRole: ['jet', 'regional'],
      category: 'medical',
      site: 'remote',
      soulsOnBoard: 156,
      fuelLoad: '23,859 L',
      fireInvolved: false,
      casualties: { red: 0, yellow: 2, green: 6, deceased: 0 },
      resources: { arff: 0, ambulances: 2, fireTrucks: 0, buses: 3, boats: 0 },
      injects: [
        '07:00 — Inbound {AIRCRAFT} reports a passenger with high fever, rash and vomiting',
        '07:05 — HPA notified; aircraft directed to a remote stand on arrival',
        '07:20 — Aircraft lands {RWY}, held on the remote stand with doors closed',
        '07:30 — Health team in PPE boards; passengers told to stay seated',
        '07:45 — Other passengers report symptoms — contact tracing list needed',
        '08:00 — Resort and liveaboard transfers waiting for these passengers ask what to do',
        '08:15 — Isolation transfer to {HOSPITAL} — {HOSP_ETA}',
        '08:30 — Decide: release, quarantine on island, or hold aboard?'
      ]
    },
    {
      id: 'runway-incursion',
      name: 'Runway Incursion — Vehicle on Runway',
      aircraft: 'Dash 8 Q400',
      aircraftRole: 'regional',
      category: 'aircraft',
      site: 'runway',
      soulsOnBoard: 82,
      fuelLoad: '6,530 L',
      fireInvolved: false,
      casualties: { red: 0, yellow: 1, green: 3, deceased: 0 },
      resources: { arff: 1, ambulances: 1, fireTrucks: 1, buses: 0, boats: 0 },
      injects: [
        '08:00 — Maintenance vehicle enters {RWY} without clearance',
        '08:01 — Tower instructs the arriving {AIRCRAFT} to go around',
        '08:02 — Go-around executed, minimum separation 200 feet',
        '08:05 — Vehicle located and escorted off the runway',
        '08:10 — Runway inspection for debris and damage',
        '08:15 — Operations resume, significant delays expected',
        '08:20 — Investigation launched, driver interviewed'
      ]
    },
    {
      id: 'severe-weather',
      name: 'Monsoon Squall — Waterspout near the Airfield',
      aircraft: null,
      category: 'weather',
      site: 'apron',
      soulsOnBoard: 0,
      fuelLoad: 'N/A',
      fireInvolved: false,
      casualties: { red: 0, yellow: 1, green: 4, deceased: 0 },
      resources: { arff: 1, ambulances: 1, fireTrucks: 1, buses: 2, boats: 1 },
      injects: [
        '15:00 — Maldives Meteorological Service issues a squall warning for {ATOLL}',
        '15:05 — Wind shear reported on final for {RWY}',
        '15:08 — Arriving aircraft goes around and holds',
        '15:10 — Waterspout seen over the lagoon; seaplane and boat transfers suspended',
        '15:15 — Terminal passengers moved away from windows; ground equipment tied down',
        '15:20 — Debris and palm fronds on the runway and taxiway',
        '15:25 — A transfer speedboat is overdue in the lagoon — Coast Guard informed',
        '15:30 — Coordinate with the Met Service for the all-clear'
      ]
    },
    {
      id: 'tsunami-warning',
      name: 'Tsunami Warning — Airport Island Evacuation',
      aircraft: null,
      category: 'weather',
      site: 'terminal',
      soulsOnBoard: 0,
      fuelLoad: 'N/A',
      fireInvolved: false,
      casualties: { red: 1, yellow: 3, green: 12, deceased: 0 },
      resources: { arff: 1, ambulances: 2, fireTrucks: 1, buses: 6, boats: 2 },
      injects: [
        '06:10 — Strong earthquake reported in the Indian Ocean; tsunami warning for the Maldives',
        '06:12 — Exercise control supplies a simulated official warning, issue time and expected impact; confirm receipt with MMS / NDMA',
        '06:15 — Inbound flights told to hold or divert; departures stopped',
        '06:20 — {AIRPORT} sits about 1–2 m above sea level — no high ground on {ISLAND}',
        '06:25 — Apply the airport-approved evacuation plan: confirm designated assembly or refuge locations, access and assistance for vulnerable passengers',
        '06:35 — Fuel farm, ARFF vehicles and boats: move, secure or keep ready?',
        '06:50 — Confirm action for vessels and aircraft under the approved warning response plan; do not assume offshore evacuation is safe',
        '07:30 — Water surges over the runway (as in 2004) — plan the recovery and reopening'
      ]
    },
    {
      id: 'fuel-supply',
      name: 'Jet A-1 Supply Disruption — Tanker Delayed',
      aircraft: null,
      category: 'infrastructure',
      site: 'fuel',
      soulsOnBoard: 0,
      fuelLoad: 'N/A',
      fireInvolved: false,
      casualties: { red: 0, yellow: 0, green: 0, deceased: 0 },
      resources: { arff: 0, ambulances: 0, fireTrucks: 0, buses: 2, boats: 1 },
      injects: [
        '09:00 — Fuel supplier warns the tanker for {AIRPORT} is delayed by rough seas',
        '09:10 — Fuel farm stock: 36 hours at normal uplift',
        '09:30 — Airlines asked to tanker fuel; some flights cannot carry enough for the return leg',
        '10:00 — Aircraft declares minimum fuel and requests priority — no fuel for turn-around',
        '11:00 — Decide which flights get fuel: MEDEVAC, scheduled, charters?',
        '12:00 — Stranded passengers and resort transfers pile up in the terminal',
        '14:00 — Emergency fuel delivery by landing craft — berth, hoses and fire cover needed'
      ]
    },
    {
      id: 'widebody-emergency',
      name: 'Widebody Full Emergency — Hydraulic Failure',
      aircraft: 'Boeing 777-300ER',
      aircraftRole: 'widebody',
      category: 'aircraft',
      site: 'runway',
      soulsOnBoard: 376,
      fuelLoad: '181,280 L',
      fireInvolved: true,
      casualties: { red: 6, yellow: 28, green: 90, deceased: 2 },
      resources: { arff: 3, ambulances: 10, fireTrucks: 4, buses: 8, boats: 2 },
      injects: [
        '21:00 — Inbound {AIRCRAFT} declares a Full Emergency: hydraulic failure, no nose-wheel steering',
        '21:05 — Alert 2: RFF to standby positions along {RWY}',
        '21:20 — Aircraft lands {RWY}, brakes overheat, departs the side of the runway',
        '21:21 — Brake fire on the main gear; captain orders evacuation',
        '21:25 — Over 300 evacuees on the airfield at night — where do they go?',
        '21:35 — Mutual aid: {MUTUAL_AID}',
        '21:50 — {HOSPITAL} activates its mass-casualty plan',
        '22:10 — Drone footage of the evacuation trending online before families are told',
        '22:30 — Embassies call — passengers from more than 20 countries'
      ]
    },
    {
      id: 'hijack-threat',
      name: 'Unlawful Interference — Hijack Threat',
      aircraft: 'ATR 42-600',
      aircraftRole: 'regional',
      category: 'security',
      site: 'remote',
      soulsOnBoard: 52,
      fuelLoad: '4,000 kg',
      fireInvolved: false,
      casualties: { red: 0, yellow: 0, green: 0, deceased: 0 },
      resources: { arff: 1, ambulances: 1, fireTrucks: 1, buses: 0, boats: 2 },
      injects: [
        '11:00 — Pilot of {AIRCRAFT} reports possible hijacker onboard, squawks 7500',
        '11:02 — Aircraft cleared for priority landing {RWY}, isolated parking assigned',
        '11:05 — MPS and MNDF notified through the airport emergency plan',
        '11:10 — Aircraft on the remote stand, engines running',
        '11:15 — Negotiation team establishes contact',
        '11:20 — Coast Guard boats seal the lagoon side of the airport',
        '11:25 — Fuel exhaustion risk if situation prolonged',
        '11:30 — Coordinate with national security agencies'
      ]
    },
    {
      id: 'mass-casualty',
      name: 'Mass Casualty — Multi-Incident',
      aircraft: 'ATR 72-600',
      aircraftRole: ['jet', 'regional'],
      category: 'compound',
      site: 'runway',
      soulsOnBoard: 74,
      fuelLoad: '5,000 kg',
      fireInvolved: true,
      casualties: { red: 15, yellow: 30, green: 20, deceased: 9 },
      resources: { arff: 3, ambulances: 10, fireTrucks: 4, buses: 5, boats: 4 },
      injects: [
        '17:00 — {AIRCRAFT} crashes on landing {RWY}, breaks into three sections',
        '17:02 — Fire erupts in centre fuselage section',
        '17:05 — Multiple casualties reported across the wreckage and in the water',
        '17:08 — Mutual aid requested — {MUTUAL_AID}',
        '17:10 — Triage overwhelmed, request additional medical teams',
        '17:15 — {HOSPITAL} at capacity — overflow and referral to {TERTIARY}',
        '17:20 — Family reception centre overwhelmed — embassy and resort reps arriving',
        '17:25 — Several media drones over the scene — PIO and MPS enforce a no-drone zone; set up a remote briefing area'
      ]
    },
    {
      id: 'chemical-spill',
      name: 'HazMat Spill — Cargo Area',
      aircraft: null,
      category: 'hazmat',
      site: 'cargo',
      soulsOnBoard: 0,
      fuelLoad: 'N/A',
      fireInvolved: false,
      casualties: { red: 1, yellow: 4, green: 6, deceased: 0 },
      resources: { arff: 1, ambulances: 2, fireTrucks: 2, buses: 1, boats: 0 },
      injects: [
        '09:00 — Cargo handler reports a chemical leak in the {AIRPORT} freight shed',
        '09:02 — Substance identified as corrosive liquid',
        '09:05 — Area evacuated, two workers showing symptoms',
        '09:10 — HazMat team dispatched, PPE required',
        '09:15 — Wind direction shifts, vapour drifts toward terminal',
        '09:20 — Terminal ventilation shut down to prevent ingress',
        '09:25 — Decontamination corridor established',
        '09:30 — Environmental Protection Agency notified — runoff must not reach the lagoon'
      ]
    },
    {
      id: 'security-breach',
      name: 'Security Breach — Intrusion from the Lagoon',
      aircraft: null,
      category: 'security',
      site: 'perimeter',
      soulsOnBoard: 0,
      fuelLoad: 'N/A',
      fireInvolved: false,
      casualties: { red: 0, yellow: 0, green: 1, deceased: 0 },
      resources: { arff: 0, ambulances: 1, fireTrucks: 0, buses: 0, boats: 2 },
      injects: [
        '02:00 — Perimeter sensors detect a breach near the {RWY_RECIP} threshold',
        '02:02 — Security patrols dispatched; a small boat seen beached on the shore',
        '02:05 — Two individuals spotted airside, running toward the water',
        '02:08 — All departures suspended, aircraft held on stand',
        '02:10 — Coast Guard asked to intercept the boat in the lagoon',
        '02:15 — Individuals apprehended by MPS',
        '02:20 — Shoreline and perimeter inspection for further breaches',
        '02:25 — Review CCTV footage and access control logs'
      ]
    }
  ],

  /* Aircraft detail cards — lengthM / fuselageM drive the ICAO RFF category */
  aircraftDetails: [
    {
      name: 'DHC-6 Twin Otter (floats)',
      operator: 'Seaplane workhorse of Maldives resort transfers (Maldivian, TMA, Manta Air)',
      pax: 15, crew: '2+0', total: 17, wheels: 0, lengthM: 15.8, fuselageM: 1.6,
      specs: [
        { k: 'Fuel capacity', v: '≈1,450 L' },
        { k: 'Fuel storage', v: 'Under-floor fuselage tanks' },
        { k: 'Boarding door', v: 'Rear left (pax) + forward crew doors' },
        { k: 'Baggage holds', v: 'Nose + aft compartment' },
        { k: 'Landing gear', v: 'Twin floats — no wheels' },
        { k: 'Emergency exits', v: 'Pax door + crew doors + emergency hatch' },
        { k: 'Water hazard', v: 'Can invert quickly — divers and boats needed' }
      ]
    },
    {
      name: 'Dornier 228',
      operator: 'Short-field utility aircraft',
      pax: 19, crew: '2+1', total: 22, wheels: 4, lengthM: 16.56, fuselageM: 1.6,
      specs: [
        { k: 'Fuel capacity', v: '1,885 kg' },
        { k: 'Fuel storage', v: 'Wing tanks' },
        { k: 'Boarding door', v: 'Left main / cargo door' },
        { k: 'Baggage holds', v: 'Fwd 90–120 kg · Aft 150–210 kg' },
        { k: 'Landing gear', v: 'Tricycle, retractable' },
        { k: 'Emergency exits', v: 'Main door + rear' }
      ]
    },
    {
      name: 'Dash 8-200',
      operator: 'Shorter regional turboprop',
      pax: 37, crew: '2+1', total: 40, wheels: 4, lengthM: 22.25, fuselageM: 2.69,
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
      name: 'ATR 42-600',
      operator: 'Shorter-fuselage regional variant',
      pax: 48, crew: '2+2', total: 52, wheels: 4, lengthM: 22.67, fuselageM: 2.87,
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
      name: 'Dash 8-300',
      operator: 'Mid-size regional turboprop — Maldivian domestic network',
      pax: 50, crew: '2+2', total: 54, wheels: 4, lengthM: 25.68, fuselageM: 2.69,
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
      name: 'ATR 72-600',
      operator: 'Main domestic turboprop in the Maldives (Maldivian, Manta Air)',
      pax: 70, crew: '2+2', total: 74, wheels: 4, lengthM: 27.17, fuselageM: 2.87,
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
      name: 'Dash 8 Q400',
      operator: 'High-speed, high-capacity turboprop',
      pax: 78, crew: '2+2', total: 82, wheels: 4, lengthM: 32.83, fuselageM: 2.69,
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
      name: 'Fokker 100',
      operator: 'Regional jet — rear-mounted engines',
      pax: 100, crew: '2+3', total: 105, wheels: 4, lengthM: 35.53, fuselageM: 3.3,
      specs: [
        { k: 'Fuel capacity', v: '13,600 L' },
        { k: 'Fuel storage', v: 'Wing + centre tanks' },
        { k: 'Boarding door', v: 'Forward left (main, airstair)' },
        { k: 'Baggage holds', v: 'Forward + aft' },
        { k: 'Landing gear', v: 'Tricycle, retractable' },
        { k: 'Emergency exits', v: '4 main + overwing' }
      ]
    },
    {
      name: 'Airbus A320-200',
      operator: 'Single-aisle jet — regional international routes (Velana, Gan, Hanimaadhoo)',
      pax: 150, crew: '2+4', total: 156, wheels: 4, lengthM: 37.57, fuselageM: 3.95,
      specs: [
        { k: 'Fuel capacity', v: '23,859 L' },
        { k: 'Fuel storage', v: 'Wing + centre tanks' },
        { k: 'Boarding door', v: 'Forward left (main)' },
        { k: 'Baggage holds', v: 'Forward + aft' },
        { k: 'Landing gear', v: 'Tricycle, retractable' },
        { k: 'Emergency exits', v: '4 main doors + overwing' }
      ]
    },
    {
      name: 'Boeing 737-800',
      operator: 'Single-aisle jet — high-capacity narrowbody',
      pax: 162, crew: '2+4', total: 168, wheels: 4, lengthM: 39.47, fuselageM: 3.76,
      specs: [
        { k: 'Fuel capacity', v: '26,020 L' },
        { k: 'Fuel storage', v: 'Wing + centre tanks' },
        { k: 'Boarding door', v: 'Forward left (main)' },
        { k: 'Baggage holds', v: 'Forward + aft' },
        { k: 'Landing gear', v: 'Tricycle, retractable' },
        { k: 'Emergency exits', v: '4 main doors + overwing' }
      ]
    },
    {
      name: 'Airbus A330-200',
      operator: 'Twin-aisle widebody — long-haul and charter flights',
      pax: 260, crew: '2+9', total: 271, wheels: 8, lengthM: 58.82, fuselageM: 5.64,
      specs: [
        { k: 'Fuel capacity', v: '139,090 L' },
        { k: 'Fuel storage', v: 'Wing + centre + trim tanks' },
        { k: 'Boarding door', v: 'Forward left (main)' },
        { k: 'Baggage holds', v: 'Forward + aft + bulk' },
        { k: 'Landing gear', v: 'Tricycle, 2 × 4-wheel main bogies' },
        { k: 'Emergency exits', v: '8 doors' }
      ]
    },
    {
      name: 'Boeing 777-300ER',
      operator: 'Large widebody — Gulf and European carriers at Velana',
      pax: 360, crew: '2+14', total: 376, wheels: 12, lengthM: 73.86, fuselageM: 6.19,
      specs: [
        { k: 'Fuel capacity', v: '181,280 L' },
        { k: 'Fuel storage', v: 'Wing + centre tanks' },
        { k: 'Boarding door', v: 'Forward left (main)' },
        { k: 'Baggage holds', v: 'Forward + aft + bulk' },
        { k: 'Landing gear', v: 'Tricycle, 2 × 6-wheel main bogies' },
        { k: 'Emergency exits', v: '10 doors' }
      ]
    }
  ],

  roleCards: [
    { role: 'Incident Commander', tag: 'Command', who: 'The overall authority for the incident until relieved.',
      duties: ['Sets objectives and approves the Incident Action Plan', 'Establishes the ICP and directs all response elements', 'Approves resource ordering and strategy changes', 'Briefs agency heads and the EOC'],
      reports: 'Reports to: EOC / Duty Manager' },
    { role: 'Safety Officer', tag: 'Command', who: 'Monitors hazards and develops safety measures for all personnel.',
      duties: ['Identifies hazards and unsafe acts on scene', 'Stops unsafe operations when life is at risk', 'Advises the IC on PPE and zone discipline', 'Investigates injuries and near-misses'],
      reports: 'Reports to: Incident Commander' },
    { role: 'Public Information Officer', tag: 'Command', who: 'Single voice for media and public messaging.',
      duties: ['Prepares press releases and holding statements', 'Runs media briefings and monitors coverage', 'Coordinates family assistance messaging', 'Clears all public statements with the IC'],
      reports: 'Reports to: Incident Commander' },
    { role: 'Liaison Officer', tag: 'Command', who: 'Point of contact for assisting and cooperating agencies.',
      duties: ['Coordinates with police, fire, EMS and government', 'Manages agency requests for resources', 'Represents the IC at multi-agency meetings', 'Maintains a list of agency contacts'],
      reports: 'Reports to: Incident Commander' },
    { role: 'Operations Section Chief', tag: 'General Staff', who: 'Directs all tactical operations to meet the IAP objectives.',
      duties: ['Develops and supervises tactical assignments', 'Manages staging areas and resource deployment', 'Controls access to the hot and warm zones', 'Requests additional resources as needed'],
      reports: 'Reports to: Incident Commander' },
    { role: 'Planning Section Chief', tag: 'General Staff', who: 'Collects, evaluates and shares incident information.',
      duties: ['Maintains the situation status and resource status', 'Prepares the IAP for each operational period', 'Documents the incident timeline for the AAR', 'Plans demobilization and recovery'],
      reports: 'Reports to: Incident Commander' },
    { role: 'Logistics Section Chief', tag: 'General Staff', who: 'Provides facilities, services and material support.',
      duties: ['Orders and tracks equipment and supplies', 'Manages communications and medical support', 'Arranges food, water and rest for responders', 'Secures facilities such as the ICP and staging'],
      reports: 'Reports to: Incident Commander' },
    { role: 'Finance / Administration', tag: 'General Staff', who: 'Tracks costs and administrative requirements.',
      duties: ['Records personnel time and equipment use', 'Documents costs for reimbursement and the AAR', 'Handles procurement and contracts', 'Manages claims and compensation records'],
      reports: 'Reports to: Incident Commander' }
  ],

  /* Glossary of exercise, ICS and Maldives terms (Checklist tab) */
  glossary: [
    { term: 'AAR', def: 'After Action Report — the document capturing strengths, gaps and corrective actions after an exercise or real event.' },
    { term: 'AEP', def: 'Airport Emergency Plan — the airport\'s documented procedures for responding to emergencies.' },
    { term: 'ARFF / RFF', def: 'Aircraft (or Airport) Rescue and Firefighting — the specialist fire service trained and equipped for aircraft incidents.' },
    { term: 'Atoll Council', def: 'Elected local government for an atoll — coordinates island councils, shelters and local resources in an emergency.' },
    { term: 'CCP', def: 'Casualty Collection Point — a designated area where casualties are gathered, triaged and prepared for transport.' },
    { term: 'Dhoni', def: 'Traditional Maldivian boat, today mostly motorised — often the quickest local transport between islands.' },
    { term: 'EOC', def: 'Emergency Operations Center — the off-scene facility where agency executives coordinate support and policy.' },
    { term: 'EPA', def: 'Environmental Protection Agency (Maldives) — notified for fuel or chemical releases that could reach the lagoon or reef.' },
    { term: 'FAC', def: 'Family Assistance Center — a safe, private area where information and support are provided to friends and relatives.' },
    { term: 'HPA', def: 'Health Protection Agency — Maldives public-health authority; leads on communicable disease at points of entry.' },
    { term: 'Hot Wash', def: 'An immediate, informal debrief held right after the exercise while memories are fresh.' },
    { term: 'IAP', def: 'Incident Action Plan — the plan for the next operational period: objectives, strategy, assignments and safety.' },
    { term: 'IC', def: 'Incident Commander — the person with overall authority and responsibility for the incident response.' },
    { term: 'ICP', def: 'Incident Command Post — the on-scene location from which the IC directs the response.' },
    { term: 'ICS', def: 'Incident Command System — the standardised on-scene management structure (Command, Operations, Planning, Logistics, Finance).' },
    { term: 'IGMH', def: 'Indira Gandhi Memorial Hospital, Malé — the national referral hospital for major trauma.' },
    { term: 'Inject', def: 'A scripted event or piece of information introduced by facilitators to drive the exercise.' },
    { term: 'MACL', def: 'Maldives Airports Company Limited — the operator of Velana International Airport and other state airports.' },
    { term: 'MCAA', def: 'Maldives Civil Aviation Authority — the regulator; certifies aerodromes under MCAR-139.' },
    { term: 'MCAR-139', def: 'Maldivian Civil Aviation Regulation Part 139 — Aerodrome Rules, with aerodrome standards in ASC 139-5 based on ICAO Annex 14.' },
    { term: 'MMS', def: 'Maldives Meteorological Service — issues squall, heavy-rain and tsunami-related warnings.' },
    { term: 'MNDF', def: 'Maldives National Defence Force — includes the Coast Guard and the Fire & Rescue Service.' },
    { term: 'MPS', def: 'Maldives Police Service — scene security, investigation and evidence.' },
    { term: 'MVT', def: 'Maldives Time, UTC+5 — use it for all exercise timings and logs.' },
    { term: 'Mutual Aid', def: 'A formal agreement for agencies to send personnel and equipment to assist each other during emergencies.' },
    { term: 'NDMA', def: 'National Disaster Management Authority — national coordination for disasters such as tsunami and flooding.' },
    { term: 'RFF Category', def: 'ICAO Annex 14 level of rescue and firefighting protection, set by the length and fuselage width of the largest aircraft using the aerodrome (1–10).' },
    { term: 'Sea ambulance', def: 'Medical patient-transfer vessel. Bases: every atoll capital, plus Haa Alifu Hoarafushi and Haa Dhaalu Makunudhoo. Confirm current availability with the health service.' },
    { term: 'Size-up', def: 'The initial assessment of the scene: what happened, what is burning, who is involved, what is needed.' },
    { term: 'SOB', def: 'Souls on Board — the total number of passengers and crew, used to plan triage and transport capacity.' },
    { term: 'Staging', def: 'A designated area where incoming resources report, are assigned and await tasking.' },
    { term: 'TTX', def: 'Tabletop Exercise — a discussion-based exercise where participants work through a scenario without deploying resources.' },
    { term: 'Warm Zone', def: 'The transition area between the hot and cold zones — triage, decontamination and PPE donning happen here.' },
    { term: 'Water aerodrome', def: 'A defined area of water used by seaplanes for take-off, landing and docking — e.g. the Velana seaplane lagoon.' }
  ],

  /* Regulatory & guidance references behind the content (Checklist tab) */
  references: [
    { doc: 'Annex 14 to the Chicago Convention, Vol. I — Aerodromes', org: 'ICAO', scope: 'Aerodrome design, emergency planning and rescue services.',
      bullets: [
        'Aerodrome physical characteristics — runway strips, runway end safety areas (RESA), clearways and obstacle limitation surfaces',
        'Airport rescue and firefighting (ARFF) — required levels of protection, response times and equipment based on airport category',
        'Emergency planning — every aerodrome must maintain an Airport Emergency Plan (AEP) and test it with regular exercises',
        'Marking, lighting and signage — visual aids that keep aircraft clear of hazards and guide emergency vehicles on the airfield'
      ] },
    { doc: 'Annex 17 — Security; and Doc 8973 (Aviation Security Manual)', org: 'ICAO', scope: 'Aviation security standards and recommended practices.',
      bullets: [
        'Standards and Recommended Practices (SARPs) for aviation security at airports and in the air',
        'Airport security programmes — access control, perimeter protection, and screening of passengers, baggage and cargo',
        'Response to unlawful interference — hijack, sabotage, bomb threats and armed attack procedures',
        'Security training, contingency plans and coordination with law enforcement and intelligence agencies'
      ] },
    { doc: 'AC 150/5200-31C — Airport Emergency Plan', org: 'FAA', scope: 'Guide for developing airport emergency plans.',
      bullets: [
        'How to develop, document, maintain and exercise an Airport Emergency Plan (AEP)',
        'Command structure, roles and responsibilities — who does what during an aircraft accident or incident',
        'Mutual aid agreements and coordination with off-airport fire, police, EMS and hospitals',
        'Emergency Operations Center (EOC) setup, communications, and post-incident review'
      ] },
    { doc: 'Regulation (EU) No 139/2013, AMC1 GM1 ADR-OPS', org: 'EASA', scope: 'Aerodrome licensing and operations requirements.',
      bullets: [
        'Aerodrome licensing requirements — safety management systems and operator accountability',
        'Emergency planning and rescue services expected of licensed aerodromes',
        'Operations and maintenance standards that affect emergency response readiness',
        'Compliance monitoring, inspections and the aerodrome operator\'s safety duties'
      ] },
    { doc: 'MCAR-139 Aerodrome Rules + ASC 139-5 Aerodrome Standards', org: 'MCAA (Maldives)', scope: 'National aerodrome certification and standards, based on ICAO Annex 14.',
      bullets: [
        'MCAR-139 (Maldives Civil Aviation Authority) — certification and operation of Maldivian aerodromes, including emergency planning',
        'ASC 139-5 Aerodrome Standards — Annex 14 based, with local adaptations (check the current issue on caa.gov.mv)',
        'Each certified aerodrome keeps an Airport Emergency Plan and exercises it (MACL, regional and private airports)',
        'Coordination with MNDF (Coast Guard, Fire & Rescue), MPS, Ministry of Health / HPA and NDMA'
      ] },
    { doc: 'NFPA 1600 — Standard on Disaster/Emergency Management', org: 'NFPA', scope: 'Continuity, emergency and crisis management standard.',
      bullets: [
        'Framework for continuity, emergency and crisis management programmes',
        'Risk assessment, resource management and incident command structure',
        'Exercises, evaluation and continuous improvement of the emergency programme',
        'Coordination with external agencies, mutual aid and community preparedness'
      ] }
  ]
};
