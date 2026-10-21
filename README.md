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

The Island Response panel shares its assets with the unit roster and scenario commitment counts. Airport planning assets start unconfirmed and unavailable; confirm capabilities and availability before committing them. Boats are not automatically medical transport. Rescue craft, sea ambulances, resort speedboats and dhonis can be recorded separately. MNDF entries are limited to island locations and the generic statement that the nearest post responds.

Transfers record casualty tags or groups, receiving hospital acceptance and exercise capacity, both transfer points, alternatives, assigned assets and an ordered Requested → Accepted → Boarding → Departed → Arrived → Handed over history. Estimates use facilitator-entered mobilisation, capacity, outbound and return/reload timings. Include loading and handover in entered timings. A matching casualty tag is marked transported only on handover.

Exercise settings, rosters and records are isolated by airport and exercise session. Settings can start or resume a session. Full Data backups include island response records and archived sessions. ICS forms, AAR and PDF packages include the island response appendix. Times display in MVT (UTC+5), with UTC audit timestamps retained.

Local facts include source/revision, verifier, date and assumption/confirmed status. Hospital route details are editable; receiving slots are exercise inputs. Map landmarks can be named and positioned by SVG coordinates; the map remains a schematic. Dhivehi labels support Thaana/RTL and are enabled only with an entered local reviewer; no unreviewed translation is shipped.

Verify runway/RFF details against the current AIP and approved AEP. Agency tasking, communications, evacuation arrangements, asset suitability and medical acceptance are entered by the facilitator, not inferred from equipment counts.

Run `node scripts/maldives-tests.mjs` for the operations unit checks and `node scripts/ci-tests.mjs` for browser regression tests (Playwright required).


## Public service locations

The Public services tab lists sea ambulance bases at the 20 atoll capitals, plus Haa Alifu Hoarafushi and Haa Dhaalu Makunudhoo, using site-owner service-location information. Each airport profile shows the bases in its atoll. Base location is not live availability; the health service confirms availability.

MNDF information is limited to named island locations and “Nearest MNDF post responds.” The directory includes publicly documented facilities at Maafilaafushi, Kadhdhoo, Gan and Vilimalé, with references, alongside Hanimaadhoo, Kulhudhuffushi and Maafaru. It does not infer the nearest operational unit or publish personnel strength, response times, movement arrangements or capabilities. Legacy saved military detail is removed from local exercise records and archived backups on upgrade; non-military records remain.
