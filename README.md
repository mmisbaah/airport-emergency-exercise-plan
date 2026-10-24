# Airport Emergency Exercise Plan — EOP Dashboard

An **Emergency Operations Plan (EOP) Exercise Dashboard** for airport emergency planning and tabletop exercises (TTX), built around Maldivian island airports. Designed for Incident Commanders, exercise planners, and airport emergency management teams.

## Features

- **Airport + runway selection** — Velana (VRMM), Gan (VRMG), Hanimaadhoo (VRMH), Kadhdhoo (VRMK), Dharavandhoo (VRMD), Maamigili (VRMV) or a generic island template, plus the runway in use. Everything below adapts to the choice
- **Adaptive scenarios** — aircraft, souls on board, fuel, casualties and resources scale to what the airport handles; injects name the runway, hospital, transfer times and mutual aid; scenarios that don't fit an airport (a seaplane capsize at a land-only airport, a widebody at a 1,200 m strip) are hidden
- **Maldives scenarios** — seaplane capsize, overrun into the lagoon, accident with no hospital on the island, tsunami warning, monsoon squall, fuel tanker delay, widebody emergency, communicable disease
- **Airport profile** — runway, RFF, hospitals and transfer times, agencies, mutual aid, on-island resources and a live-wind runway suggestion
- **IC Role by Phase** — Preparation, Execution, and Evaluation responsibilities
- **Team Labels** — Exercise staff roles and simulated response team functional groups
- **Key Locations Map** — the selected island drawn with its runway in its real orientation, jetty, links and seaplane lanes; draggable pins for ICP, EOC, CCP, FAC, staging, sea-ambulance transfer and marine rescue
- **Incident Zones** — Hot / Warm / Cold zone diagrams with casualty flow
- **Emergency Types** — Aircraft-related, non-aircraft, security, public health, and compound emergencies
- **Aircraft Specifications** — Twin Otter seaplane, ATR, Dash 8, Dornier, A320, 737, A330, 777 with ICAO RFF category
- **TTX Flow & Checklist** — Interactive IC checklist with progress tracking
- **Scenario Selector** — Pre-built scenarios with casualty estimates, resource requirements, and exercise injects
- **Exercise Timeline** — Log events, injects, decisions, and milestones during the exercise
- **AAR Export** — Generate After Action Report summaries
- **Dark/Light Mode** — Toggle between themes

## Usage

### Run the Hanimaadhoo MNDF tabletop exercise

Choose **Run MNDF TTX** in the header, or open `ttx.html`. Northern Response is a dedicated facilitator console for an A320 landing gear emergency at Hanimaadhoo: first call 16:00 MVT, assumed crash 16:10, left-engine fire, 110 persons aboard, and 22 red/immediate casualties (20%). The additional allocation of 33 yellow, 50 green and 5 deceased is an exercise assumption. Total delivery time is 120 minutes: 10 briefing, 20 warning/mobilisation, 30 crash/rescue, 30 casualty movement/sustainment, 20 hotwash and 10 corrective actions. Scenario time advances independently of the delivery schedule.

- Manually release 21 injects, start/pause/accelerate the scenario clock, and open `ttx-display.html` on the same browser for a projector showing released-only information.
- Use **Reset timer** to return to 16:00, pause the clock and restore 1× speed while keeping released injects and exercise records. Use a new exercise session for a fresh scenario.
- Use **NO DUFF · pause** to stop scenario advancement. EXCON must explicitly resume play.
- Track 110 patient IDs, bulk-update movements, and require transport/destination/receiving acceptance for transfer and handover. Medical priorities remain with qualified personnel.
- Record decisions, confirmed resource tasks, command transfers, facility activation, objective evidence and corrective actions.
- Export a JSON backup or a self-contained HTML after-action report (browser print supports PDF). Restore creates a separate paused session; existing sessions remain available.

Primary operational source: user-supplied **HAQ Airport Emergency Plan, Edition 2**, issued 09 November 2025, effective 15 November 2025, reference O2-MNL/2025/25. Sections are identified in **Command & facilities**. ARFF holds interim command until the designated MNDF Incident Commander takes over; Gold coordination is through AEMC. The HDK Emergency Exercise 2026 PPTX and HTML supplied by the user inform the nine-phase teaching structure, logging and exercise conventions. Their Kulhudhuffushi location, 74-person scenario and draft timings do not replace the requested Hanimaadhoo scenario.

No reference files, private contact directories, MNDF locations, unit strengths, movement times or operational asset availability are embedded. Validate current AEP revisions and actual arrangements before delivery. The app is a tabletop discussion tool, not an emergency dispatch or clinical record system.

Sessions are browser-local and separate from the planning dashboard’s storage. Use one facilitator window. The projector synchronises only within the same browser profile/origin; it is not an authenticated participant role or a remotely shared session. Export backups to move devices. Serve over HTTP/HTTPS for service-worker offline support; both controller and display routes are cached distinctly.

Open `index.html` in any modern web browser. No build step or server required.

## Customization

Edit `js/airports.js` to add or correct an airport: runways (designators + heading), apron side, hospitals and transfer times, agencies, on-island resources, mutual aid and the aircraft it handles. Runway and hospital figures come from public sources — verify them against the MCAA AIP and your Airport Emergency Plan.

Edit `js/data.js` to customize:
- Checklist items
- Map pin locations and categories
- Aircraft types and specifications
- Exercise scenarios and injects (use `aircraftRole`, `requires`, `site` and `{TOKENS}` such as `{RWY}` or `{HOSPITAL}` so they adapt to each airport — see the comment at the top of the file)

## License

MIT



## Maldives island response

The Island Response panel shares its assets with the unit roster and scenario commitment counts. Airport planning assets start unconfirmed and unavailable; confirm capabilities and availability before committing them. Boats are not automatically medical transport. Rescue craft, sea ambulances, resort speedboats and dhonis can be recorded separately. MNDF entries contain only the generic statement that the nearest post responds.

Transfers record casualty tags or groups, receiving hospital acceptance and exercise capacity, both transfer points, alternatives, assigned assets and an ordered Requested → Accepted → Boarding → Departed → Arrived → Handed over history. Estimates use facilitator-entered mobilisation, capacity, outbound and return/reload timings. Include loading and handover in entered timings. A matching casualty tag is marked transported only on handover.

Exercise settings, rosters and records are isolated by airport and exercise session. Settings can start or resume a session. Full Data backups include island response records and archived sessions. ICS forms, AAR and PDF packages include the island response appendix. Times display in MVT (UTC+5), with UTC audit timestamps retained.

Local facts include source/revision, verifier, date and assumption/confirmed status. Hospital route details are editable; receiving slots are exercise inputs. Map landmarks can be named and positioned by SVG coordinates; the map remains a schematic. Dhivehi labels support Thaana/RTL and are enabled only with an entered local reviewer; no unreviewed translation is shipped.

Verify runway/RFF details against the current AIP and approved AEP. Agency tasking, communications, evacuation arrangements, asset suitability and medical acceptance are entered by the facilitator, not inferred from equipment counts.

Run `node scripts/maldives-tests.mjs` for the operations unit checks and `node scripts/ci-tests.mjs` for browser regression tests (Playwright required).


## Public service locations

The Public services tab lists sea ambulance bases at the 20 atoll capitals, plus Haa Alifu Hoarafushi and Haa Dhaalu Makunudhoo, using site-owner service-location information. Each airport profile shows the bases in its atoll. Base location is not live availability; the health service confirms availability.

MNDF information contains only “Nearest MNDF post responds.” No MNDF locations, source links, personnel strength, response times or movement details are published. Legacy saved military details are removed on upgrade.
