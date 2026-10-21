/* =====================================================
   AIRPORTS — selectable airport + runway profiles (Maldives focus).
   Depends on: data.js (TTX_DATA). Loaded before app.js.

   Every exercise adjusts to the selected airport and runway in use:
   scenario aircraft, souls on board, casualties and resources scale to
   what the airport actually handles, inject text is filled with the
   local runway, hospital, transport and mutual-aid details, and the
   Key Locations map is drawn as that island with its runway in its
   real orientation.

   Data comes from public sources (MCAA / MACL publications, press and
   aviation reference listings). Runway figures and hospital transfer
   times are PLANNING values — verify against the MCAA AIP and your
   own Airport Emergency Plan before an exercise.
   ===================================================== */

var TTX_PUBLIC_SERVICES = {
  "seaAmbulances": [
    {
      "atollCode": "HA",
      "atoll": "Haa Alifu",
      "island": "Dhidhdhoo",
      "kind": "Atoll capital",
      "quantity": 1,
      "source": "Site owner service-location information, 22 October 2026"
    },
    {
      "atollCode": "HDh",
      "atoll": "Haa Dhaalu",
      "island": "Kulhudhuffushi",
      "kind": "Atoll capital",
      "quantity": 1,
      "source": "Site owner service-location information, 22 October 2026"
    },
    {
      "atollCode": "Sh",
      "atoll": "Shaviyani",
      "island": "Funadhoo",
      "kind": "Atoll capital",
      "quantity": 1,
      "source": "Site owner service-location information, 22 October 2026"
    },
    {
      "atollCode": "N",
      "atoll": "Noonu",
      "island": "Manadhoo",
      "kind": "Atoll capital",
      "quantity": 1,
      "source": "Site owner service-location information, 22 October 2026"
    },
    {
      "atollCode": "R",
      "atoll": "Raa",
      "island": "Ungoofaaru",
      "kind": "Atoll capital",
      "quantity": 1,
      "source": "Site owner service-location information, 22 October 2026"
    },
    {
      "atollCode": "B",
      "atoll": "Baa",
      "island": "Eydhafushi",
      "kind": "Atoll capital",
      "quantity": 1,
      "source": "Site owner service-location information, 22 October 2026"
    },
    {
      "atollCode": "Lh",
      "atoll": "Lhaviyani",
      "island": "Naifaru",
      "kind": "Atoll capital",
      "quantity": 1,
      "source": "Site owner service-location information, 22 October 2026"
    },
    {
      "atollCode": "K",
      "atoll": "Kaafu",
      "island": "Thulusdhoo",
      "kind": "Atoll capital",
      "quantity": 1,
      "source": "Site owner service-location information, 22 October 2026"
    },
    {
      "atollCode": "AA",
      "atoll": "Alifu Alifu",
      "island": "Rasdhoo",
      "kind": "Atoll capital",
      "quantity": 1,
      "source": "Site owner service-location information, 22 October 2026"
    },
    {
      "atollCode": "ADh",
      "atoll": "Alifu Dhaalu",
      "island": "Mahibadhoo",
      "kind": "Atoll capital",
      "quantity": 1,
      "source": "Site owner service-location information, 22 October 2026"
    },
    {
      "atollCode": "V",
      "atoll": "Vaavu",
      "island": "Felidhoo",
      "kind": "Atoll capital",
      "quantity": 1,
      "source": "Site owner service-location information, 22 October 2026"
    },
    {
      "atollCode": "M",
      "atoll": "Meemu",
      "island": "Muli",
      "kind": "Atoll capital",
      "quantity": 1,
      "source": "Site owner service-location information, 22 October 2026"
    },
    {
      "atollCode": "F",
      "atoll": "Faafu",
      "island": "Nilandhoo",
      "kind": "Atoll capital",
      "quantity": 1,
      "source": "Site owner service-location information, 22 October 2026"
    },
    {
      "atollCode": "Dh",
      "atoll": "Dhaalu",
      "island": "Kudahuvadhoo",
      "kind": "Atoll capital",
      "quantity": 1,
      "source": "Site owner service-location information, 22 October 2026"
    },
    {
      "atollCode": "Th",
      "atoll": "Thaa",
      "island": "Veymandoo",
      "kind": "Atoll capital",
      "quantity": 1,
      "source": "Site owner service-location information, 22 October 2026"
    },
    {
      "atollCode": "L",
      "atoll": "Laamu",
      "island": "Fonadhoo",
      "kind": "Atoll capital",
      "quantity": 1,
      "source": "Site owner service-location information, 22 October 2026"
    },
    {
      "atollCode": "GA",
      "atoll": "Gaafu Alifu",
      "island": "Vilingili",
      "kind": "Atoll capital",
      "quantity": 1,
      "source": "Site owner service-location information, 22 October 2026"
    },
    {
      "atollCode": "GDh",
      "atoll": "Gaafu Dhaalu",
      "island": "Thinadhoo",
      "kind": "Atoll capital",
      "quantity": 1,
      "source": "Site owner service-location information, 22 October 2026"
    },
    {
      "atollCode": "Gn",
      "atoll": "Gnaviyani",
      "island": "Fuvahmulah",
      "kind": "Atoll capital",
      "quantity": 1,
      "source": "Site owner service-location information, 22 October 2026"
    },
    {
      "atollCode": "S",
      "atoll": "Seenu / Addu",
      "island": "Hithadhoo",
      "kind": "Atoll capital",
      "quantity": 1,
      "source": "Site owner service-location information, 22 October 2026"
    },
    {
      "atollCode": "HA",
      "atoll": "Haa Alifu",
      "island": "Hoarafushi",
      "kind": "Additional location",
      "quantity": 1,
      "source": "Site owner service-location information, 22 October 2026"
    },
    {
      "atollCode": "HDh",
      "atoll": "Haa Dhaalu",
      "island": "Makunudhoo",
      "kind": "Additional location",
      "quantity": 1,
      "source": "Site owner service-location information, 22 October 2026"
    }
  ]
};

var TTX_AIRPORTS = [
  {
    "id": "VRMM",
    "icao": "VRMM",
    "iata": "MLE",
    "name": "Velana International Airport",
    "short": "Velana",
    "island": "Hulhulé",
    "atoll": "Kaafu (Malé) Atoll",
    "operator": "Maldives Airports Company Limited (MACL)",
    "type": "International · water aerodrome",
    "lat": 4.1918,
    "lon": 73.5291,
    "runways": [
      {
        "id": "18/36",
        "ends": [
          "18",
          "36"
        ],
        "hdg": 180,
        "length": 3400,
        "width": 60,
        "surface": "Asphalt"
      }
    ],
    "apronSide": "right",
    "features": {
      "seaplane": true,
      "seaTransfer": false,
      "roadHospital": true
    },
    "rff": "Category 9 — MACL Airport Fire & Rescue (new station designed to Cat 9/10, two marine rescue vessels)",
    "fleet": {
      "regional": "ATR 72-600",
      "jet": "Airbus A320-200",
      "widebody": "Boeing 777-300ER",
      "seaplane": "DHC-6 Twin Otter (floats)"
    },
    "links": [
      {
        "bearing": 0,
        "kind": "road",
        "label": "Causeway → Hulhumalé"
      },
      {
        "bearing": 235,
        "kind": "road",
        "label": "Sinamalé Bridge → Malé"
      }
    ],
    "hospitals": [
      {
        "name": "IGMH (Indira Gandhi Memorial Hospital), Malé",
        "role": "Primary trauma / tertiary",
        "how": "road via Sinamalé Bridge",
        "eta": "≈20–30 min"
      },
      {
        "name": "Hulhumalé Hospital",
        "role": "Secondary / overflow",
        "how": "road via Hulhumalé causeway",
        "eta": "≈10–15 min"
      },
      {
        "name": "ADK Hospital, Malé",
        "role": "Private overflow",
        "how": "road via Sinamalé Bridge",
        "eta": "≈25–35 min"
      }
    ],
    "agencies": [
      "MACL Airport Fire & Rescue (RFF + marine rescue boats)",
      "Maldives Police Service (MPS) + airport AVSEC",
      "Ministry of Health / HPA, IGMH",
      "NDMA (National Disaster Management Authority)",
      "Maldives Meteorological Service (Hulhulé)",
      "Maldives Immigration · Customs",
      "MNDF — nearest post responds"
    ],
    "local": {
      "arff": 6,
      "ambulances": 4,
      "fireTrucks": 4,
      "buses": 10,
      "boats": 4
    },
    "mutualAid": "Nearest MNDF post responds. Other agencies coordinate under the airport emergency plan.",
    "eod": "Specialist assistance coordinated through the relevant authorities.",
    "recovery": "MACL disabled-aircraft recovery equipment on airport",
    "utility": "MACL power plant / STELCO",
    "referral": "already at the national referral centre (IGMH, Malé)",
    "notes": "Seaplane terminal and floating docks on the eastern lagoon; the runway is bounded by sea at both ends, so undershoot and overrun accidents are water rescues.",
    "mndf": {
      "response": "Nearest MNDF post responds."
    },
    "seaAmbulanceLocations": [
      {
        "atollCode": "K",
        "atoll": "Kaafu",
        "island": "Thulusdhoo",
        "kind": "Atoll capital",
        "quantity": 1,
        "source": "Site owner service-location information, 22 October 2026"
      }
    ]
  },
  {
    "id": "VRMG",
    "icao": "VRMG",
    "iata": "GAN",
    "name": "Gan International Airport",
    "short": "Gan",
    "island": "Gan",
    "atoll": "Addu City (Seenu)",
    "operator": "Addu International Airport Pvt Ltd",
    "type": "International",
    "lat": -0.6934,
    "lon": 73.1556,
    "runways": [
      {
        "id": "10/28",
        "ends": [
          "10",
          "28"
        ],
        "hdg": 100,
        "length": 2650,
        "width": 45,
        "surface": "Concrete / asphalt"
      }
    ],
    "apronSide": "left",
    "features": {
      "seaplane": false,
      "seaTransfer": false,
      "roadHospital": true
    },
    "rff": "Check certified RFF category in the MCAA AIP",
    "fleet": {
      "regional": "ATR 72-600",
      "jet": "Airbus A320-200",
      "widebody": null,
      "seaplane": null
    },
    "links": [
      {
        "bearing": 300,
        "kind": "road",
        "label": "Link road → Feydhoo · Maradhoo · Hithadhoo"
      }
    ],
    "hospitals": [
      {
        "name": "Addu Equatorial Hospital, Hithadhoo",
        "role": "Primary",
        "how": "road via the Addu link road",
        "eta": "≈20–30 min"
      },
      {
        "name": "IGMH, Malé",
        "role": "Tertiary referral",
        "how": "air (domestic flight / air ambulance) + road",
        "eta": "≈1.5–2 h"
      }
    ],
    "agencies": [
      "Airport RFF (Addu International Airport)",
      "Maldives Police Service — Addu",
      "Addu City Council",
      "Ministry of Health / HPA",
      "NDMA",
      "MNDF — nearest post responds"
    ],
    "local": {
      "arff": 3,
      "ambulances": 2,
      "fireTrucks": 1,
      "buses": 4,
      "boats": 2
    },
    "mutualAid": "Nearest MNDF post responds. Other agencies coordinate under the airport emergency plan.",
    "eod": "Specialist assistance coordinated through the relevant authorities.",
    "recovery": "heavy recovery kit flown or shipped from Velana (1–3 days)",
    "utility": "FENAKA (Addu)",
    "referral": "air transfer to Velana then road to IGMH (≈1.5–2 h)",
    "notes": "Former RAF Gan airfield on the southern tip of Addu Atoll; the link road connects Gan to Feydhoo, Maradhoo and Hithadhoo.",
    "mndf": {
      "response": "Nearest MNDF post responds."
    },
    "seaAmbulanceLocations": [
      {
        "atollCode": "S",
        "atoll": "Seenu / Addu",
        "island": "Hithadhoo",
        "kind": "Atoll capital",
        "quantity": 1,
        "source": "Site owner service-location information, 22 October 2026"
      }
    ]
  },
  {
    "id": "VRMH",
    "icao": "VRMH",
    "iata": "HAQ",
    "name": "Hanimaadhoo International Airport",
    "short": "Hanimaadhoo",
    "island": "Hanimaadhoo",
    "atoll": "Haa Dhaalu Atoll",
    "operator": "State airport operator (verify: MACL / RACL)",
    "type": "International (upgraded runway)",
    "lat": 6.7442,
    "lon": 73.1705,
    "runways": [
      {
        "id": "03/21",
        "ends": [
          "03",
          "21"
        ],
        "hdg": 30,
        "length": 2465,
        "width": 45,
        "surface": "Asphalt"
      }
    ],
    "apronSide": "right",
    "features": {
      "seaplane": false,
      "seaTransfer": true,
      "roadHospital": false
    },
    "rff": "Check certified RFF category in the MCAA AIP",
    "fleet": {
      "regional": "ATR 72-600",
      "jet": "Airbus A320-200",
      "widebody": null,
      "seaplane": null
    },
    "links": [
      {
        "bearing": 185,
        "kind": "sea",
        "label": "Sea route → Kulhudhuffushi (≈45–60 min)"
      }
    ],
    "hospitals": [
      {
        "name": "Hanimaadhoo island health centre",
        "role": "First aid / stabilisation",
        "how": "road on island",
        "eta": "≈5–10 min"
      },
      {
        "name": "Kulhudhuffushi Regional Hospital",
        "role": "Primary",
        "how": "sea ambulance / speedboat",
        "eta": "≈45–60 min"
      },
      {
        "name": "IGMH, Malé",
        "role": "Tertiary referral",
        "how": "air ambulance / domestic flight + road",
        "eta": "≈1.5–2 h"
      }
    ],
    "agencies": [
      "Airport RFF (Hanimaadhoo)",
      "Maldives Police Service — Haa Dhaalu",
      "Hanimaadhoo Island Council · HDh Atoll Council",
      "Ministry of Health / HPA",
      "NDMA",
      "MNDF — nearest post responds"
    ],
    "local": {
      "arff": 2,
      "ambulances": 1,
      "fireTrucks": 0,
      "buses": 2,
      "boats": 1
    },
    "mutualAid": "Nearest MNDF post responds. Other agencies coordinate under the airport emergency plan.",
    "eod": "Specialist assistance coordinated through the relevant authorities.",
    "recovery": "heavy recovery kit shipped or flown from Velana (1–3 days)",
    "utility": "FENAKA (Hanimaadhoo)",
    "referral": "air ambulance or domestic flight to Velana then road to IGMH (≈1.5–2 h)",
    "mndf": {
      "response": "Nearest MNDF post responds."
    },
    "notes": "Serious casualties need a confirmed receiving hospital and sea or air transport.",
    "seaAmbulanceLocations": [
      {
        "atollCode": "HDh",
        "atoll": "Haa Dhaalu",
        "island": "Kulhudhuffushi",
        "kind": "Atoll capital",
        "quantity": 1,
        "source": "Site owner service-location information, 22 October 2026"
      },
      {
        "atollCode": "HDh",
        "atoll": "Haa Dhaalu",
        "island": "Makunudhoo",
        "kind": "Additional location",
        "quantity": 1,
        "source": "Site owner service-location information, 22 October 2026"
      }
    ]
  },
  {
    "id": "VRMK",
    "icao": "VRMK",
    "iata": "KDO",
    "name": "Kadhdhoo Airport",
    "short": "Kadhdhoo",
    "island": "Kadhdhoo",
    "atoll": "Laamu Atoll",
    "operator": "Regional Airports (verify operator)",
    "type": "Domestic",
    "lat": 1.8592,
    "lon": 73.5219,
    "runways": [
      {
        "id": "03/21",
        "ends": [
          "03",
          "21"
        ],
        "hdg": 30,
        "length": 1220,
        "width": 30,
        "surface": "Bitumen"
      }
    ],
    "apronSide": "right",
    "features": {
      "seaplane": false,
      "seaTransfer": false,
      "roadHospital": true
    },
    "rff": "Check certified RFF category in the MCAA AIP",
    "fleet": {
      "regional": "ATR 72-600",
      "jet": null,
      "widebody": null,
      "seaplane": null
    },
    "links": [
      {
        "bearing": 25,
        "kind": "road",
        "label": "Link road → Fonadhoo"
      },
      {
        "bearing": 205,
        "kind": "road",
        "label": "Link road → Gan (Laamu)"
      }
    ],
    "hospitals": [
      {
        "name": "Gan Regional Hospital, Laamu",
        "role": "Primary",
        "how": "road via the Laamu link road",
        "eta": "≈30–45 min"
      },
      {
        "name": "IGMH, Malé",
        "role": "Tertiary referral",
        "how": "air (domestic flight / air ambulance) + road",
        "eta": "≈1.5–2 h"
      }
    ],
    "agencies": [
      "Airport RFF (Kadhdhoo)",
      "Maldives Police Service — Laamu",
      "Laamu Atoll Council · Island Councils",
      "Ministry of Health / HPA",
      "NDMA",
      "MNDF — nearest post responds"
    ],
    "local": {
      "arff": 1,
      "ambulances": 1,
      "fireTrucks": 0,
      "buses": 1,
      "boats": 1
    },
    "mutualAid": "Nearest MNDF post responds. Other agencies coordinate under the airport emergency plan.",
    "eod": "Specialist assistance coordinated through the relevant authorities.",
    "recovery": "recovery kit flown or shipped from Velana (1–3 days)",
    "utility": "FENAKA (Laamu)",
    "referral": "domestic flight or air ambulance to Velana then road to IGMH (≈1.5–2 h)",
    "notes": "Short 1,220 m runway — turboprop only. The link road ties Kadhdhoo to Fonadhoo and Gan, so ambulances can come by road.",
    "mndf": {
      "response": "Nearest MNDF post responds."
    },
    "seaAmbulanceLocations": [
      {
        "atollCode": "L",
        "atoll": "Laamu",
        "island": "Fonadhoo",
        "kind": "Atoll capital",
        "quantity": 1,
        "source": "Site owner service-location information, 22 October 2026"
      }
    ]
  },
  {
    "id": "VRMD",
    "icao": "VRMD",
    "iata": "DRV",
    "name": "Dharavandhoo Airport",
    "short": "Dharavandhoo",
    "island": "Dharavandhoo",
    "atoll": "Baa Atoll",
    "operator": "Regional Airports (verify operator)",
    "type": "Domestic · resort gateway",
    "lat": 5.1561,
    "lon": 73.1302,
    "runways": [
      {
        "id": "12/30",
        "ends": [
          "12",
          "30"
        ],
        "hdg": 120,
        "length": 1189,
        "width": 30,
        "surface": "Asphalt"
      }
    ],
    "apronSide": "left",
    "features": {
      "seaplane": false,
      "seaTransfer": true,
      "roadHospital": false
    },
    "rff": "Check certified RFF category in the MCAA AIP",
    "fleet": {
      "regional": "Dash 8-300",
      "jet": null,
      "widebody": null,
      "seaplane": null
    },
    "links": [
      {
        "bearing": 250,
        "kind": "sea",
        "label": "Sea route → Eydhafushi (≈30–45 min)"
      }
    ],
    "hospitals": [
      {
        "name": "Dharavandhoo island health centre",
        "role": "First aid / stabilisation",
        "how": "road on island",
        "eta": "≈5 min"
      },
      {
        "name": "B. Eydhafushi Atoll Regional Hospital",
        "role": "Primary",
        "how": "sea ambulance / speedboat",
        "eta": "≈30–45 min"
      },
      {
        "name": "IGMH, Malé",
        "role": "Tertiary referral",
        "how": "seaplane / air ambulance + road",
        "eta": "≈1–1.5 h"
      }
    ],
    "agencies": [
      "Airport RFF (Dharavandhoo)",
      "Maldives Police Service — Baa",
      "Baa Atoll Council · Island Council",
      "Resort operators (boats, medical staff, guest manifests)",
      "Ministry of Health / HPA",
      "NDMA",
      "MNDF — nearest post responds"
    ],
    "local": {
      "arff": 1,
      "ambulances": 1,
      "fireTrucks": 0,
      "buses": 1,
      "boats": 2
    },
    "mutualAid": "Nearest MNDF post responds. Other agencies coordinate under the airport emergency plan.",
    "eod": "Specialist assistance coordinated through the relevant authorities.",
    "recovery": "recovery kit flown or shipped from Velana (1–3 days)",
    "utility": "FENAKA (Baa)",
    "referral": "seaplane or air ambulance to Velana then road to IGMH (≈1–1.5 h)",
    "notes": "Gateway to Baa Atoll resorts (UNESCO biosphere reserve) — passengers are mostly tourists and the nearest hospital is a boat ride away.",
    "mndf": {
      "response": "Nearest MNDF post responds."
    },
    "seaAmbulanceLocations": [
      {
        "atollCode": "B",
        "atoll": "Baa",
        "island": "Eydhafushi",
        "kind": "Atoll capital",
        "quantity": 1,
        "source": "Site owner service-location information, 22 October 2026"
      }
    ]
  },
  {
    "id": "VRMV",
    "icao": "VRMV",
    "iata": "VAM",
    "name": "Villa International Airport Maamigili",
    "short": "Maamigili",
    "island": "Maamigili",
    "atoll": "Alif Dhaal Atoll",
    "operator": "Villa group (private)",
    "type": "Domestic / international (private)",
    "lat": 3.4706,
    "lon": 72.8358,
    "runways": [
      {
        "id": "09/27",
        "ends": [
          "09",
          "27"
        ],
        "hdg": 90,
        "length": 1800,
        "width": 30,
        "surface": "Asphalt"
      }
    ],
    "apronSide": "left",
    "features": {
      "seaplane": false,
      "seaTransfer": true,
      "roadHospital": false
    },
    "rff": "Check certified RFF category in the MCAA AIP",
    "fleet": {
      "regional": "ATR 72-600",
      "jet": null,
      "widebody": null,
      "seaplane": null
    },
    "links": [
      {
        "bearing": 25,
        "kind": "sea",
        "label": "Sea route → Mahibadhoo (≈45–60 min)"
      }
    ],
    "hospitals": [
      {
        "name": "Maamigili island health centre",
        "role": "First aid / stabilisation",
        "how": "road on island",
        "eta": "≈5–10 min"
      },
      {
        "name": "ADh. Mahibadhoo Atoll Hospital",
        "role": "Primary",
        "how": "sea ambulance / speedboat",
        "eta": "≈45–60 min"
      },
      {
        "name": "IGMH, Malé",
        "role": "Tertiary referral",
        "how": "air ambulance / seaplane + road",
        "eta": "≈1–1.5 h"
      }
    ],
    "agencies": [
      "Airport RFF (Maamigili)",
      "Maldives Police Service — Alif Dhaal",
      "ADh Atoll Council · Island Council",
      "Resort operators (boats, guest manifests)",
      "Ministry of Health / HPA",
      "NDMA",
      "MNDF — nearest post responds"
    ],
    "local": {
      "arff": 2,
      "ambulances": 1,
      "fireTrucks": 0,
      "buses": 2,
      "boats": 2
    },
    "mutualAid": "Nearest MNDF post responds. Other agencies coordinate under the airport emergency plan.",
    "eod": "Specialist assistance coordinated through the relevant authorities.",
    "recovery": "recovery kit flown or shipped from Velana (1–3 days)",
    "utility": "Villa / FENAKA",
    "referral": "air ambulance or seaplane to Velana then road to IGMH (≈1–1.5 h)",
    "notes": "South Ari resort gateway — whale-shark season brings extra tourist traffic and day-boats in the lagoon.",
    "mndf": {
      "response": "Nearest MNDF post responds."
    },
    "seaAmbulanceLocations": [
      {
        "atollCode": "ADh",
        "atoll": "Alifu Dhaalu",
        "island": "Mahibadhoo",
        "kind": "Atoll capital",
        "quantity": 1,
        "source": "Site owner service-location information, 22 October 2026"
      }
    ]
  },
  {
    "id": "VRBK",
    "icao": "VRBK",
    "iata": "HDK",
    "name": "Kulhudhuffushi Domestic Airport",
    "short": "Kulhudhuffushi",
    "island": "Kulhudhuffushi",
    "atoll": "Haa Dhaalu Atoll",
    "operator": "Regional Airports Company Limited (RACL)",
    "type": "Domestic",
    "lat": 6.630833333333334,
    "lon": 73.06777777777778,
    "runways": [
      {
        "id": "12/30",
        "ends": [
          "12",
          "30"
        ],
        "hdg": 120,
        "length": 1220,
        "width": 30,
        "surface": "Asphalt"
      }
    ],
    "apronSide": "right",
    "features": {
      "seaplane": false,
      "seaTransfer": false,
      "roadHospital": true
    },
    "rff": "Confirm certified RFF category and current capability against AIP / AEP",
    "fleet": {
      "regional": "ATR 72-600",
      "jet": null,
      "widebody": null,
      "seaplane": null
    },
    "links": [
      {
        "bearing": 180,
        "kind": "road",
        "label": "Road route → Kulhudhuffushi Regional Hospital (route schematic; confirm AEP)"
      }
    ],
    "hospitals": [
      {
        "name": "Kulhudhuffushi Regional Hospital",
        "role": "Primary receiving hospital — acceptance required",
        "how": "road on island",
        "eta": "Confirm mobilisation, loading, travel and handover times"
      },
      {
        "name": "IGMH, Malé",
        "role": "Tertiary referral — acceptance required",
        "how": "confirmed air medical transport + road",
        "eta": "Confirm tasking and complete transfer time"
      }
    ],
    "agencies": [
      "Airport RFF (Kulhudhuffushi)",
      "Maldives Police Service / airport AVSEC",
      "Kulhudhuffushi Island / City Council · Haa Dhaalu Atoll Council",
      "Local health service and receiving hospital",
      "Resort / vessel operators — confirmed support only",
      "Ministry of Health / HPA",
      "NDMA",
      "MNDF — nearest post responds"
    ],
    "local": {
      "arff": 0,
      "ambulances": 0,
      "fireTrucks": 0,
      "buses": 0,
      "boats": 0
    },
    "localConfirmed": false,
    "mutualAid": "Nearest MNDF post responds. Other agencies coordinate under the airport emergency plan.",
    "eod": "Specialist assistance coordinated through the relevant authorities.",
    "recovery": "Confirm airport recovery capability; heavy equipment may require sea or air mobilisation",
    "utility": "Confirm airport utility provider and island service contacts",
    "referral": "Receiving-hospital acceptance and appropriate sea / air medical transport must be confirmed",
    "mndf": {
      "response": "Nearest MNDF post responds."
    },
    "sources": [
      {
        "title": "MCAA land aerodrome list — identifiers, coordinates and listed operators (06 Nov 2024)",
        "url": "https://www.caa.gov.mv/attachments/Om5BM5Rjp8j83fqs5KyPmp3EKbmsXI3XK8FsdVVp.pdf"
      },
      {
        "title": "Current AIP / AEP — validate physical data and operating conditions",
        "url": "https://www.macl.aero/air-navigation-services/aip"
      }
    ],
    "notes": "Equipment inventory is not supplied: zero planning counts mean unconfirmed inventory, not absence of equipment. Runway dimensions and layout remain planning references pending current AIP / AEP review.",
    "seaAmbulanceLocations": [
      {
        "atollCode": "HDh",
        "atoll": "Haa Dhaalu",
        "island": "Kulhudhuffushi",
        "kind": "Atoll capital",
        "quantity": 1,
        "source": "Site owner service-location information, 22 October 2026"
      },
      {
        "atollCode": "HDh",
        "atoll": "Haa Dhaalu",
        "island": "Makunudhoo",
        "kind": "Additional location",
        "quantity": 1,
        "source": "Site owner service-location information, 22 October 2026"
      }
    ]
  },
  {
    "id": "VRDA",
    "icao": "VRDA",
    "iata": "NMF",
    "name": "Maafaru International Airport",
    "short": "Maafaru",
    "island": "Maafaru",
    "atoll": "Noonu Atoll",
    "operator": "Island Aviation Services Limited",
    "type": "International",
    "lat": 5.818333333333333,
    "lon": 73.46972222222223,
    "runways": [
      {
        "id": "06/24",
        "ends": [
          "06",
          "24"
        ],
        "hdg": 60,
        "length": 2850,
        "width": 45,
        "surface": "Asphalt"
      }
    ],
    "apronSide": "right",
    "features": {
      "seaplane": false,
      "seaTransfer": true,
      "roadHospital": false
    },
    "rff": "Confirm certified RFF category and current capability against AIP / AEP",
    "fleet": {
      "regional": "ATR 72-600",
      "jet": "Airbus A320-200",
      "widebody": "Boeing 777-300ER",
      "seaplane": null
    },
    "links": [
      {
        "bearing": 180,
        "kind": "sea",
        "label": "Sea transfer → Noonu Atoll Hospital, Manadhoo (route schematic; confirm AEP)"
      }
    ],
    "hospitals": [
      {
        "name": "Maafaru local medical / first-aid service — confirm facility",
        "role": "First aid / stabilisation",
        "how": "local access arrangements to be confirmed",
        "eta": "Confirm exercise estimate"
      },
      {
        "name": "Noonu Atoll Hospital, Manadhoo",
        "role": "Primary receiving hospital — acceptance required",
        "how": "sea ambulance / suitable medical transport",
        "eta": "Confirm mobilisation, loading, travel and handover times"
      },
      {
        "name": "IGMH, Malé",
        "role": "Tertiary referral — acceptance required",
        "how": "confirmed air medical transport + road",
        "eta": "Confirm tasking and complete transfer time"
      }
    ],
    "agencies": [
      "Airport RFF (Maafaru)",
      "Maldives Police Service / airport AVSEC",
      "Maafaru Island / City Council · Noonu Atoll Council",
      "Local health service and receiving hospital",
      "Resort / vessel operators — confirmed support only",
      "Ministry of Health / HPA",
      "NDMA",
      "MNDF — nearest post responds"
    ],
    "local": {
      "arff": 0,
      "ambulances": 0,
      "fireTrucks": 0,
      "buses": 0,
      "boats": 0
    },
    "localConfirmed": false,
    "mutualAid": "Nearest MNDF post responds. Other agencies coordinate under the airport emergency plan.",
    "eod": "Specialist assistance coordinated through the relevant authorities.",
    "recovery": "Confirm airport recovery capability; heavy equipment may require sea or air mobilisation",
    "utility": "Confirm airport utility provider and island service contacts",
    "referral": "Receiving-hospital acceptance and appropriate sea / air medical transport must be confirmed",
    "mndf": {
      "response": "Nearest MNDF post responds."
    },
    "sources": [
      {
        "title": "MCAA land aerodrome list — identifiers, coordinates and listed operators (06 Nov 2024)",
        "url": "https://www.caa.gov.mv/attachments/Om5BM5Rjp8j83fqs5KyPmp3EKbmsXI3XK8FsdVVp.pdf"
      },
      {
        "title": "Current AIP / AEP — validate physical data and operating conditions",
        "url": "https://www.macl.aero/library/files/AIRAC%20AIP%20AMDT%201-26.pdf"
      }
    ],
    "notes": "Widebody exercise aircraft are planning examples, not an operational clearance. AIP Amendment 1/26 lists a 120 m displaced threshold on RWY 06 (LDA 2730 m); physical runway length is 2850 m. Equipment inventory is not supplied: zero planning counts mean unconfirmed inventory, not absence of equipment. Runway dimensions and layout remain planning references pending current AIP / AEP review.",
    "seaAmbulanceLocations": [
      {
        "atollCode": "N",
        "atoll": "Noonu",
        "island": "Manadhoo",
        "kind": "Atoll capital",
        "quantity": 1,
        "source": "Site owner service-location information, 22 October 2026"
      }
    ]
  },
  {
    "id": "VREI",
    "icao": "VREI",
    "iata": "IFU",
    "name": "Ifuru Airport",
    "short": "Ifuru",
    "island": "Ifuru",
    "atoll": "Raa Atoll",
    "operator": "Island Aviation Services Limited (CAA operator listing; confirm current arrangements)",
    "type": "Domestic",
    "lat": 5.708333333333334,
    "lon": 73.025,
    "runways": [
      {
        "id": "18/36",
        "ends": [
          "18",
          "36"
        ],
        "hdg": 180,
        "length": 1200,
        "width": 30,
        "surface": "Asphalt"
      }
    ],
    "apronSide": "right",
    "features": {
      "seaplane": false,
      "seaTransfer": true,
      "roadHospital": false
    },
    "rff": "Confirm certified RFF category and current capability against AIP / AEP",
    "fleet": {
      "regional": "ATR 72-600",
      "jet": null,
      "widebody": null,
      "seaplane": null
    },
    "links": [
      {
        "bearing": 180,
        "kind": "sea",
        "label": "Sea transfer → Ungoofaaru Regional Hospital (route schematic; confirm AEP)"
      }
    ],
    "hospitals": [
      {
        "name": "Ifuru local medical / first-aid service — confirm facility",
        "role": "First aid / stabilisation",
        "how": "local access arrangements to be confirmed",
        "eta": "Confirm exercise estimate"
      },
      {
        "name": "Ungoofaaru Regional Hospital",
        "role": "Primary receiving hospital — acceptance required",
        "how": "sea ambulance / suitable medical transport",
        "eta": "Confirm mobilisation, loading, travel and handover times"
      },
      {
        "name": "IGMH, Malé",
        "role": "Tertiary referral — acceptance required",
        "how": "confirmed air medical transport + road",
        "eta": "Confirm tasking and complete transfer time"
      }
    ],
    "agencies": [
      "Airport RFF (Ifuru)",
      "Maldives Police Service / airport AVSEC",
      "Ifuru Island / City Council · Raa Atoll Council",
      "Local health service and receiving hospital",
      "Resort / vessel operators — confirmed support only",
      "Ministry of Health / HPA",
      "NDMA",
      "MNDF — nearest post responds"
    ],
    "local": {
      "arff": 0,
      "ambulances": 0,
      "fireTrucks": 0,
      "buses": 0,
      "boats": 0
    },
    "localConfirmed": false,
    "mutualAid": "Nearest MNDF post responds. Other agencies coordinate under the airport emergency plan.",
    "eod": "Specialist assistance coordinated through the relevant authorities.",
    "recovery": "Confirm airport recovery capability; heavy equipment may require sea or air mobilisation",
    "utility": "Confirm airport utility provider and island service contacts",
    "referral": "Receiving-hospital acceptance and appropriate sea / air medical transport must be confirmed",
    "mndf": {
      "response": "Nearest MNDF post responds."
    },
    "sources": [
      {
        "title": "MCAA land aerodrome list — identifiers, coordinates and listed operators (06 Nov 2024)",
        "url": "https://www.caa.gov.mv/attachments/Om5BM5Rjp8j83fqs5KyPmp3EKbmsXI3XK8FsdVVp.pdf"
      },
      {
        "title": "Current AIP / AEP — validate physical data and operating conditions",
        "url": "https://www.macl.aero/air-navigation-services/aip"
      }
    ],
    "notes": "Confirm local first-aid arrangements and receiving-hospital acceptance. Equipment inventory is not supplied: zero planning counts mean unconfirmed inventory, not absence of equipment. Runway dimensions and layout remain planning references pending current AIP / AEP review.",
    "seaAmbulanceLocations": [
      {
        "atollCode": "R",
        "atoll": "Raa",
        "island": "Ungoofaaru",
        "kind": "Atoll capital",
        "quantity": 1,
        "source": "Site owner service-location information, 22 October 2026"
      }
    ]
  },
  {
    "id": "VRAH",
    "icao": "VRAH",
    "iata": "HRF",
    "name": "Hoarafushi Airport",
    "short": "Hoarafushi",
    "island": "Hoarafushi",
    "atoll": "Haa Alifu Atoll",
    "operator": "Regional Airports Company Limited (RACL)",
    "type": "Domestic",
    "lat": 6.969444444444445,
    "lon": 72.8963888888889,
    "runways": [
      {
        "id": "06/24",
        "ends": [
          "06",
          "24"
        ],
        "hdg": 60,
        "length": 1200,
        "width": 30,
        "surface": "Asphalt"
      }
    ],
    "apronSide": "right",
    "features": {
      "seaplane": false,
      "seaTransfer": true,
      "roadHospital": false
    },
    "rff": "Confirm certified RFF category and current capability against AIP / AEP",
    "fleet": {
      "regional": "ATR 72-600",
      "jet": null,
      "widebody": null,
      "seaplane": null
    },
    "links": [
      {
        "bearing": 180,
        "kind": "sea",
        "label": "Sea transfer → Haa Alifu Atoll Hospital, Dhidhdhoo (route schematic; confirm AEP)"
      }
    ],
    "hospitals": [
      {
        "name": "Hoarafushi local medical / first-aid service — confirm facility",
        "role": "First aid / stabilisation",
        "how": "local access arrangements to be confirmed",
        "eta": "Confirm exercise estimate"
      },
      {
        "name": "Haa Alifu Atoll Hospital, Dhidhdhoo",
        "role": "Primary receiving hospital — acceptance required",
        "how": "sea ambulance / suitable medical transport",
        "eta": "Confirm mobilisation, loading, travel and handover times"
      },
      {
        "name": "IGMH, Malé",
        "role": "Tertiary referral — acceptance required",
        "how": "confirmed air medical transport + road",
        "eta": "Confirm tasking and complete transfer time"
      }
    ],
    "agencies": [
      "Airport RFF (Hoarafushi)",
      "Maldives Police Service / airport AVSEC",
      "Hoarafushi Island / City Council · Haa Alifu Atoll Council",
      "Local health service and receiving hospital",
      "Resort / vessel operators — confirmed support only",
      "Ministry of Health / HPA",
      "NDMA",
      "MNDF — nearest post responds"
    ],
    "local": {
      "arff": 0,
      "ambulances": 0,
      "fireTrucks": 0,
      "buses": 0,
      "boats": 0
    },
    "localConfirmed": false,
    "mutualAid": "Nearest MNDF post responds. Other agencies coordinate under the airport emergency plan.",
    "eod": "Specialist assistance coordinated through the relevant authorities.",
    "recovery": "Confirm airport recovery capability; heavy equipment may require sea or air mobilisation",
    "utility": "Confirm airport utility provider and island service contacts",
    "referral": "Receiving-hospital acceptance and appropriate sea / air medical transport must be confirmed",
    "mndf": {
      "response": "Nearest MNDF post responds."
    },
    "sources": [
      {
        "title": "MCAA land aerodrome list — identifiers, coordinates and listed operators (06 Nov 2024)",
        "url": "https://www.caa.gov.mv/attachments/Om5BM5Rjp8j83fqs5KyPmp3EKbmsXI3XK8FsdVVp.pdf"
      },
      {
        "title": "Current AIP / AEP — validate physical data and operating conditions",
        "url": "https://www.macl.aero/air-navigation-services/aip"
      }
    ],
    "notes": "Confirm access between the reclaimed airport area, island health facility and casualty transfer jetty. Equipment inventory is not supplied: zero planning counts mean unconfirmed inventory, not absence of equipment. Runway dimensions and layout remain planning references pending current AIP / AEP review.",
    "seaAmbulanceLocations": [
      {
        "atollCode": "HA",
        "atoll": "Haa Alifu",
        "island": "Dhidhdhoo",
        "kind": "Atoll capital",
        "quantity": 1,
        "source": "Site owner service-location information, 22 October 2026"
      },
      {
        "atollCode": "HA",
        "atoll": "Haa Alifu",
        "island": "Hoarafushi",
        "kind": "Additional location",
        "quantity": 1,
        "source": "Site owner service-location information, 22 October 2026"
      }
    ]
  },
  {
    "id": "VRCF",
    "icao": "VRCF",
    "iata": "FND",
    "name": "Funadhoo Airport",
    "short": "Funadhoo",
    "island": "Funadhoo",
    "atoll": "Shaviyani Atoll",
    "operator": "Regional Airports Company Limited (RACL)",
    "type": "Domestic",
    "lat": 6.1625000000000005,
    "lon": 73.2875,
    "runways": [
      {
        "id": "01/19",
        "ends": [
          "01",
          "19"
        ],
        "hdg": 10,
        "length": 1200,
        "width": 30,
        "surface": "Asphalt"
      }
    ],
    "apronSide": "right",
    "features": {
      "seaplane": false,
      "seaTransfer": false,
      "roadHospital": true
    },
    "rff": "Confirm certified RFF category and current capability against AIP / AEP",
    "fleet": {
      "regional": "ATR 72-600",
      "jet": null,
      "widebody": null,
      "seaplane": null
    },
    "links": [
      {
        "bearing": 180,
        "kind": "road",
        "label": "Road route → Shaviyani Atoll Hospital, Funadhoo (route schematic; confirm AEP)"
      }
    ],
    "hospitals": [
      {
        "name": "Shaviyani Atoll Hospital, Funadhoo",
        "role": "Primary receiving hospital — acceptance required",
        "how": "road on island",
        "eta": "Confirm mobilisation, loading, travel and handover times"
      },
      {
        "name": "IGMH, Malé",
        "role": "Tertiary referral — acceptance required",
        "how": "confirmed air medical transport + road",
        "eta": "Confirm tasking and complete transfer time"
      }
    ],
    "agencies": [
      "Airport RFF (Funadhoo)",
      "Maldives Police Service / airport AVSEC",
      "Funadhoo Island / City Council · Shaviyani Atoll Council",
      "Local health service and receiving hospital",
      "Resort / vessel operators — confirmed support only",
      "Ministry of Health / HPA",
      "NDMA",
      "MNDF — nearest post responds"
    ],
    "local": {
      "arff": 0,
      "ambulances": 0,
      "fireTrucks": 0,
      "buses": 0,
      "boats": 0
    },
    "localConfirmed": false,
    "mutualAid": "Nearest MNDF post responds. Other agencies coordinate under the airport emergency plan.",
    "eod": "Specialist assistance coordinated through the relevant authorities.",
    "recovery": "Confirm airport recovery capability; heavy equipment may require sea or air mobilisation",
    "utility": "Confirm airport utility provider and island service contacts",
    "referral": "Receiving-hospital acceptance and appropriate sea / air medical transport must be confirmed",
    "mndf": {
      "response": "Nearest MNDF post responds."
    },
    "sources": [
      {
        "title": "MCAA land aerodrome list — identifiers, coordinates and listed operators (06 Nov 2024)",
        "url": "https://www.caa.gov.mv/attachments/Om5BM5Rjp8j83fqs5KyPmp3EKbmsXI3XK8FsdVVp.pdf"
      },
      {
        "title": "Current AIP / AEP — validate physical data and operating conditions",
        "url": "https://www.macl.aero/library/files/AIRAC%20AIP%20AMDT%201-26.pdf"
      }
    ],
    "notes": "Funadhoo in Shaviyani, not Fonadhoo in Laamu. AIP Amendment 1/26 lists runway 01/19. Equipment inventory is not supplied: zero planning counts mean unconfirmed inventory, not absence of equipment. Runway dimensions and layout remain planning references pending current AIP / AEP review.",
    "seaAmbulanceLocations": [
      {
        "atollCode": "Sh",
        "atoll": "Shaviyani",
        "island": "Funadhoo",
        "kind": "Atoll capital",
        "quantity": 1,
        "source": "Site owner service-location information, 22 October 2026"
      }
    ]
  },
  {
    "id": "VRGD",
    "icao": "VRGD",
    "iata": "LMV",
    "name": "Madivaru Airport",
    "short": "Madivaru",
    "island": "Madivaru",
    "atoll": "Lhaviyani Atoll",
    "operator": "Kuredu Holdings Pvt Ltd (CAA operator listing; confirm operating arrangements)",
    "type": "Domestic",
    "lat": 5.457777777777778,
    "lon": 73.37027777777777,
    "runways": [
      {
        "id": "18/36",
        "ends": [
          "18",
          "36"
        ],
        "hdg": 180,
        "length": 1200,
        "width": 30,
        "surface": "Asphalt"
      }
    ],
    "apronSide": "right",
    "features": {
      "seaplane": false,
      "seaTransfer": true,
      "roadHospital": false
    },
    "rff": "Confirm certified RFF category and current capability against AIP / AEP",
    "fleet": {
      "regional": "ATR 72-600",
      "jet": null,
      "widebody": null,
      "seaplane": null
    },
    "links": [
      {
        "bearing": 180,
        "kind": "sea",
        "label": "Sea transfer → Lhaviyani Atoll Hospital, Naifaru (route schematic; confirm AEP)"
      }
    ],
    "hospitals": [
      {
        "name": "Madivaru local medical / first-aid service — confirm facility",
        "role": "First aid / stabilisation",
        "how": "local access arrangements to be confirmed",
        "eta": "Confirm exercise estimate"
      },
      {
        "name": "Lhaviyani Atoll Hospital, Naifaru",
        "role": "Primary receiving hospital — acceptance required",
        "how": "sea ambulance / suitable medical transport",
        "eta": "Confirm mobilisation, loading, travel and handover times"
      },
      {
        "name": "IGMH, Malé",
        "role": "Tertiary referral — acceptance required",
        "how": "confirmed air medical transport + road",
        "eta": "Confirm tasking and complete transfer time"
      }
    ],
    "agencies": [
      "Airport RFF (Madivaru)",
      "Maldives Police Service / airport AVSEC",
      "Madivaru Island / City Council · Lhaviyani Atoll Council",
      "Local health service and receiving hospital",
      "Resort / vessel operators — confirmed support only",
      "Ministry of Health / HPA",
      "NDMA",
      "MNDF — nearest post responds"
    ],
    "local": {
      "arff": 0,
      "ambulances": 0,
      "fireTrucks": 0,
      "buses": 0,
      "boats": 0
    },
    "localConfirmed": false,
    "mutualAid": "Nearest MNDF post responds. Other agencies coordinate under the airport emergency plan.",
    "eod": "Specialist assistance coordinated through the relevant authorities.",
    "recovery": "Confirm airport recovery capability; heavy equipment may require sea or air mobilisation",
    "utility": "Confirm airport utility provider and island service contacts",
    "referral": "Receiving-hospital acceptance and appropriate sea / air medical transport must be confirmed",
    "mndf": {
      "response": "Nearest MNDF post responds."
    },
    "sources": [
      {
        "title": "MCAA land aerodrome list — identifiers, coordinates and listed operators (06 Nov 2024)",
        "url": "https://www.caa.gov.mv/attachments/Om5BM5Rjp8j83fqs5KyPmp3EKbmsXI3XK8FsdVVp.pdf"
      },
      {
        "title": "Current AIP / AEP — validate physical data and operating conditions",
        "url": "https://www.macl.aero/air-navigation-services/aip"
      }
    ],
    "notes": "Casualty movement requires a confirmed jetty handover and receiving hospital; resort boats are not automatically medical transport. Equipment inventory is not supplied: zero planning counts mean unconfirmed inventory, not absence of equipment. Runway dimensions and layout remain planning references pending current AIP / AEP review.",
    "seaAmbulanceLocations": [
      {
        "atollCode": "Lh",
        "atoll": "Lhaviyani",
        "island": "Naifaru",
        "kind": "Atoll capital",
        "quantity": 1,
        "source": "Site owner service-location information, 22 October 2026"
      }
    ]
  },
  {
    "id": "GENERIC",
    "icao": "—",
    "iata": "—",
    "name": "Generic island airport (template)",
    "short": "Generic",
    "island": "Airport island",
    "atoll": "—",
    "operator": "Airport operator",
    "type": "Template — adjust to your airport",
    "lat": null,
    "lon": null,
    "runways": [
      {
        "id": "18/36",
        "ends": [
          "18",
          "36"
        ],
        "hdg": 180,
        "length": 2500,
        "width": 45,
        "surface": "Asphalt"
      },
      {
        "id": "09/27",
        "ends": [
          "09",
          "27"
        ],
        "hdg": 90,
        "length": 2500,
        "width": 45,
        "surface": "Asphalt"
      },
      {
        "id": "03/21",
        "ends": [
          "03",
          "21"
        ],
        "hdg": 30,
        "length": 2500,
        "width": 45,
        "surface": "Asphalt"
      },
      {
        "id": "12/30",
        "ends": [
          "12",
          "30"
        ],
        "hdg": 120,
        "length": 2500,
        "width": 45,
        "surface": "Asphalt"
      }
    ],
    "apronSide": "right",
    "features": {
      "seaplane": true,
      "seaTransfer": true,
      "roadHospital": false
    },
    "rff": "Set to your certified RFF category",
    "fleet": {
      "regional": "ATR 72-600",
      "jet": "Airbus A320-200",
      "widebody": "Airbus A330-200",
      "seaplane": "DHC-6 Twin Otter (floats)"
    },
    "links": [
      {
        "bearing": 225,
        "kind": "road",
        "label": "Access road / causeway"
      },
      {
        "bearing": 140,
        "kind": "sea",
        "label": "Sea route → receiving hospital"
      }
    ],
    "hospitals": [
      {
        "name": "Receiving hospital (neighbouring island)",
        "role": "Primary",
        "how": "sea ambulance",
        "eta": "≈45 min"
      },
      {
        "name": "National referral hospital",
        "role": "Tertiary referral",
        "how": "air ambulance",
        "eta": "≈1.5 h"
      }
    ],
    "agencies": [
      "Airport RFF",
      "Fire & rescue service",
      "Coast guard",
      "Police",
      "Health authority",
      "Disaster management authority",
      "MNDF — nearest post responds"
    ],
    "local": {
      "arff": 3,
      "ambulances": 2,
      "fireTrucks": 1,
      "buses": 3,
      "boats": 2
    },
    "mutualAid": "Nearest MNDF post responds. Other agencies coordinate under the airport emergency plan.",
    "eod": "Specialist assistance coordinated through the relevant authorities.",
    "recovery": "recovery equipment from the main airport (1–3 days)",
    "utility": "Island power utility",
    "referral": "air ambulance to the national referral hospital (≈1.5 h)",
    "notes": "Template profile — pick the runway orientation that matches your airport, then rename locations in ✏️ Customize Map.",
    "mndf": {
      "response": "Nearest MNDF post responds."
    },
    "seaAmbulanceLocations": []
  }
];

var TTX_SITE = (function () {
  'use strict';

  var STORE_KEY = 'ttx-airport';
  var DEFAULT = { airport: 'VRMM', runway: '18/36', end: '36' };

  var byId = function (id) {
    for (var i = 0; i < TTX_AIRPORTS.length; i++) if (TTX_AIRPORTS[i].id === id) return TTX_AIRPORTS[i];
    return null;
  };

  /* ---------- selection (airport + runway + runway end in use) ---------- */
  var normalise = function (sel) {
    sel = sel || {};
    var ap = byId(sel.airport) || byId(DEFAULT.airport);
    var rw = null;
    ap.runways.forEach(function (r) { if (r.id === sel.runway) rw = r; });
    rw = rw || ap.runways[0];
    var end = rw.ends.indexOf(sel.end) >= 0 ? sel.end : rw.ends[rw.ends.length - 1];
    return { airport: ap.id, runway: rw.id, end: end };
  };

  var getSelection = function () {
    var raw = null;
    try { raw = JSON.parse(localStorage.getItem(STORE_KEY) || 'null'); } catch (e) {}
    return normalise(raw || DEFAULT);
  };

  var setSelection = function (sel) {
    var n = normalise(sel);
    try { localStorage.setItem(STORE_KEY, JSON.stringify(n)); } catch (e) {}
    return n;
  };

  var context = function (sel) {
    sel = normalise(sel || getSelection());
    var ap = byId(sel.airport);
    var rw = null;
    ap.runways.forEach(function (r) { if (r.id === sel.runway) rw = r; });
    var endIdx = rw.ends.indexOf(sel.end);
    var recip = rw.ends[1 - endIdx];
    var hdg = endIdx === 0 ? rw.hdg : (rw.hdg + 180) % 360;
    return { sel: sel, airport: ap, runway: rw, end: sel.end, endIdx: endIdx, recip: recip, hdg: hdg };
  };

  /* ---------- compass helpers ---------- */
  var COMPASS8 = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'];
  var compassWord = function (deg) {
    return COMPASS8[Math.round((((deg % 360) + 360) % 360) / 45) % 8];
  };

  /* ---------- aircraft data + RFF category (ICAO Annex 14, Table 9-1) ---------- */
  var aircraftByName = function (name) {
    var d = null, c = null;
    (TTX_DATA.aircraftDetails || []).forEach(function (a) { if (a.name === name) d = a; });
    (TTX_DATA.aircraftComparison || []).forEach(function (a) { if (a.name === name) c = a; });
    if (!d && !c) return null;
    return { detail: d, cmp: c };
  };

  var RFF_TABLE = [ /* [max length exclusive, max fuselage width] */
    [9, 2], [12, 2], [18, 3], [24, 4], [28, 4], [39, 5], [49, 5], [61, 7], [76, 7], [90, 8]
  ];
  var rffCategory = function (lengthM, widthM) {
    if (!(lengthM > 0)) return null;
    var cat = RFF_TABLE.length;
    for (var i = 0; i < RFF_TABLE.length; i++) {
      if (lengthM < RFF_TABLE[i][0]) { cat = i + 1; break; }
    }
    if (widthM > RFF_TABLE[cat - 1][1] && cat < RFF_TABLE.length) cat++;
    return cat;
  };
  var rffForAircraft = function (name) {
    var a = aircraftByName(name);
    if (!a || !a.detail) return null;
    return rffCategory(a.detail.lengthM, a.detail.fuselageM);
  };
  /* Annex 14 minimum number of RFF vehicles by category */
  var minRffVehicles = function (cat) {
    if (!cat) return 0;
    return cat <= 5 ? 1 : (cat <= 7 ? 2 : 3);
  };

  /* ---------- scenario applicability + resolution ---------- */
  var pickAircraft = function (sc, ap) {
    var roles = sc.aircraftRole;
    if (!roles) return { name: sc.aircraft, substituted: false };
    if (!Array.isArray(roles)) roles = [roles];
    for (var i = 0; i < roles.length; i++) {
      var n = ap.fleet[roles[i]];
      if (n) return { name: n, substituted: n !== sc.aircraft, role: roles[i] };
    }
    return null;
  };

  var isApplicable = function (sc, ctx) {
    ctx = ctx || context();
    if (!sc || sc.custom) return true;
    var ap = ctx.airport;
    if (sc.aircraftRole && !pickAircraft(sc, ap)) return false;
    var req = sc.requires || [];
    for (var i = 0; i < req.length; i++) {
      if (!ap.features[req[i]]) return false;
    }
    return true;
  };

  var primaryHospital = function (ap) {
    var h = null;
    ap.hospitals.forEach(function (x) { if (!h && /primary/i.test(x.role)) h = x; });
    return h || ap.hospitals[0];
  };
  var tertiaryHospital = function (ap) {
    var h = null;
    ap.hospitals.forEach(function (x) { if (/tertiary/i.test(x.role)) h = x; });
    return h || primaryHospital(ap);
  };

  var tokensFor = function (ctx, ac) {
    var ap = ctx.airport;
    var ph = primaryHospital(ap);
    var th = tertiaryHospital(ap);
    var thrSide = compassWord(ctx.hdg + 180);   /* the active threshold lies opposite the landing heading */
    var farSide = compassWord(ctx.hdg);
    return {
      AIRPORT: ap.short,
      AIRPORT_FULL: ap.name,
      ICAO: ap.icao,
      ISLAND: ap.island,
      ATOLL: ap.atoll,
      OPERATOR: ap.operator,
      RWY: 'RWY ' + ctx.end,
      RWY_RECIP: 'RWY ' + ctx.recip,
      THR_SIDE: thrSide,
      FAR_SIDE: farSide,
      HOSPITAL: ph.name,
      HOSP_ETA: ph.eta + ' by ' + ph.how,
      TERTIARY: th.name,
      REFERRAL: ap.referral,
      MUTUAL_AID: ap.mutualAid,
      EOD: ap.eod,
      RECOVERY: ap.recovery,
      UTILITY: ap.utility,
      AIRCRAFT: ac || 'the aircraft'
    };
  };

  var fill = function (text, tokens) {
    return String(text).replace(/\{([A-Z_]+)\}/g, function (m, k) {
      return Object.prototype.hasOwnProperty.call(tokens, k) ? tokens[k] : m;
    });
  };

  var scaleInt = function (v, ratio, min) {
    var n = Math.round((v || 0) * ratio);
    if (v > 0 && n < (min || 0)) n = min;
    return n;
  };

  var resolveScenario = function (sc, ctx) {
    ctx = ctx || context();
    if (!sc) return sc;
    var out = JSON.parse(JSON.stringify(sc));
    var ap = ctx.airport;
    var pick = pickAircraft(sc, ap);
    if (pick && pick.name) out.aircraft = pick.name;

    /* Scale people + resources when the airport's aircraft differs */
    if (pick && pick.substituted) {
      var a = aircraftByName(pick.name);
      var newSob = a && a.detail ? a.detail.total : sc.soulsOnBoard;
      var ratio = sc.soulsOnBoard > 0 ? newSob / sc.soulsOnBoard : 1;
      out.soulsOnBoard = newSob;
      if (a && a.cmp) out.fuelLoad = a.cmp.fuel;
      var c = sc.casualties;
      out.casualties = {
        red: scaleInt(c.red, ratio, 1),
        yellow: scaleInt(c.yellow, ratio, 1),
        green: scaleInt(c.green, ratio, 1),
        deceased: scaleInt(c.deceased, ratio, 0)
      };
      /* never more casualties than people aboard */
      var keys = ['green', 'yellow', 'deceased', 'red'];
      var sum = function () { return out.casualties.red + out.casualties.yellow + out.casualties.green + out.casualties.deceased; };
      var guard = 0;
      while (out.soulsOnBoard > 0 && sum() > out.soulsOnBoard && guard++ < 2000) {
        for (var i = 0; i < keys.length && sum() > out.soulsOnBoard; i++) {
          if (out.casualties[keys[i]] > 0) out.casualties[keys[i]]--;
        }
      }
      var r = sc.resources;
      out.resources = {
        arff: r.arff,
        ambulances: scaleInt(r.ambulances, ratio, 1),
        fireTrucks: scaleInt(r.fireTrucks, Math.max(ratio, 0.5), 1),
        buses: scaleInt(r.buses, ratio, 1),
        boats: r.boats || 0 /* marine demand needs route / capacity review, not occupancy scaling */
      };
    }
    if (out.resources && out.resources.boats === undefined) out.resources.boats = 0;

    /* Aircraft RFF category sets a floor on ARFF vehicles */
    var rcat = out.aircraft ? rffForAircraft(out.aircraft) : null;
    out.rffCategory = rcat;
    if (rcat && out.resources && out.resources.arff > 0) {
      out.resources.arff = Math.max(out.resources.arff, minRffVehicles(rcat));
    }

    var tk = tokensFor(ctx, out.aircraft);
    out.injects = (sc.injects || []).map(function (t) { return fill(t, tk); });
    if (sc.brief) out.brief = fill(sc.brief, tk);
    out.siteLabel = ap.name + (ap.icao && ap.icao !== '—' ? ' (' + ap.icao + ')' : '') + ' · RWY ' + ctx.end + ' in use';
    out.airportId = ap.id;
    out.runwayEnd = ctx.end;
    return out;
  };

  /* Shortfall of each resource against what the island has */
  var shortfall = function (resolved, ctx) {
    ctx = ctx || context();
    var local = ctx.airport.local || {};
    var res = (resolved && resolved.resources) || {};
    var out = {};
    ['arff', 'ambulances', 'fireTrucks', 'buses', 'boats'].forEach(function (k) {
      var need = res[k] || 0, have = local[k] || 0;
      out[k] = { need: need, local: have, gap: Math.max(need - have, 0) };
    });
    return out;
  };

  /* Pick the runway end with the best headwind for a wind direction */
  var suggestEnd = function (windFrom, speed, ctx) {
    ctx = ctx || context();
    var rw = ctx.runway;
    var best = null;
    rw.ends.forEach(function (e, i) {
      var h = i === 0 ? rw.hdg : (rw.hdg + 180) % 360;
      var diff = (windFrom - h) * Math.PI / 180;
      var head = Math.cos(diff) * (speed || 0);
      var cross = Math.abs(Math.sin(diff) * (speed || 0));
      if (!best || head > best.head) best = { end: e, head: head, cross: cross };
    });
    return best;
  };

  /* ================= MAP GEOMETRY =================
     Canonical frame: x runs along the runway from the first end's
     threshold (x = -L/2) to the second (x = +L/2); t runs
     perpendicular, positive towards the apron / terminal side.
     Everything is converted to SVG coordinates (north up), so text
     stays upright whatever the runway heading. */
  var VB = { w: 1000, h: 720 };
  var C = { x: 500, y: 360 };
  var L = 420;           /* drawn runway length (px) */
  var HALF = L / 2;

  var frame = function (ctx) {
    var h = ctx.runway.hdg * Math.PI / 180;
    var a = { x: Math.sin(h), y: -Math.cos(h) };            /* along first end's heading */
    var right = { x: Math.cos(h), y: Math.sin(h) };
    var q = ctx.airport.apronSide === 'left' ? { x: -right.x, y: -right.y } : right;
    return {
      a: a, q: q,
      P: function (x, t) { return { x: C.x + x * a.x + t * q.x, y: C.y + x * a.y + t * q.y }; }
    };
  };

  var r1 = function (n) { return Math.round(n * 10) / 10; };
  var pts = function (arr) { return arr.map(function (p) { return r1(p.x) + ',' + r1(p.y); }).join(' '); };
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  };

  /* Rectangle in canonical frame → polygon */
  var rect = function (F, x0, x1, t0, t1, attrs) {
    return '<polygon points="' + pts([F.P(x0, t0), F.P(x1, t0), F.P(x1, t1), F.P(x0, t1)]) + '" ' + attrs + '/>';
  };
  var line = function (F, x0, t0, x1, t1, attrs) {
    var p = F.P(x0, t0), q = F.P(x1, t1);
    return '<line x1="' + r1(p.x) + '" y1="' + r1(p.y) + '" x2="' + r1(q.x) + '" y2="' + r1(q.y) + '" ' + attrs + '/>';
  };
  var text = function (p, s, attrs) {
    return '<text x="' + r1(p.x) + '" y="' + r1(p.y) + '" text-anchor="middle" ' + attrs + '>' + esc(s) + '</text>';
  };

  /* Superellipse outline (rounded rectangle) — asymmetric across the runway */
  var outline = function (F, ax, bPos, bNeg, n) {
    var out = [];
    for (var i = 0; i < 72; i++) {
      var th = (i / 72) * Math.PI * 2;
      var c = Math.cos(th), s = Math.sin(th);
      var x = ax * (c < 0 ? -1 : 1) * Math.pow(Math.abs(c), 2 / n);
      var b = s >= 0 ? bPos : bNeg;
      var t = b * (s < 0 ? -1 : 1) * Math.pow(Math.abs(s), 2 / n);
      out.push(F.P(x, t));
    }
    return out;
  };

  var inPoly = function (p, poly) {
    var inside = false;
    for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      var xi = poly[i].x, yi = poly[i].y, xj = poly[j].x, yj = poly[j].y;
      if (((yi > p.y) !== (yj > p.y)) && (p.x < (xj - xi) * (p.y - yi) / (yj - yi) + xi)) inside = !inside;
    }
    return inside;
  };

  var ISLAND = { apron: 172, far: 52, ends: 58 };

  var geometry = function (ctx) {
    var F = frame(ctx);
    var island = outline(F, HALF + ISLAND.ends, ISLAND.apron, ISLAND.far, 5);
    var sea = !!ctx.airport.features.seaplane;
    var reef = outline(F, HALF + ISLAND.ends + 40, ISLAND.apron + 42, ISLAND.far + (sea ? 118 : 42), 4);
    /* active threshold + landing roll direction (+1 = towards +x) */
    var thrX = ctx.endIdx === 0 ? -HALF : HALF;
    var dir = ctx.endIdx === 0 ? 1 : -1;
    return { F: F, island: island, reef: reef, thrX: thrX, dir: dir, sea: sea };
  };

  /* Incident site per scenario type, in canonical (x, t) */
  var siteCanon = function (site, g) {
    var f = function (frac) { return frac * HALF; };
    switch (site) {
      case 'undershoot': return { x: g.thrX - g.dir * 66, t: 0, label: 'CRASH SITE' };
      case 'overrun':    return { x: g.thrX + g.dir * (L + 70), t: 0, label: 'OVERRUN SITE' };
      case 'water':      return g.sea ? { x: f(0.1), t: -118, label: 'INCIDENT SITE' } : { x: f(0.1), t: -80, label: 'INCIDENT SITE' };
      case 'terminal':   return { x: f(-0.08), t: 134, label: 'INCIDENT SITE' };
      case 'apron':      return { x: f(-0.05), t: 82, label: 'INCIDENT SITE' };
      case 'cargo':      return { x: f(0.45), t: 80, label: 'INCIDENT SITE' };
      case 'fuel':       return { x: f(0.78), t: 108, label: 'INCIDENT SITE' };
      case 'remote':     return { x: g.thrX * 0.82, t: 36, label: 'REMOTE STAND' };
      case 'perimeter':  return { x: -g.thrX * 0.7, t: -44, label: 'BREACH POINT' };
      default:           return { x: g.thrX + g.dir * L * 0.32, t: 0, label: 'CRASH SITE' };
    }
  };

  var incidentSite = function (site, ctx) {
    ctx = ctx || context();
    var g = geometry(ctx);
    var c = siteCanon(site, g);
    var p = g.F.P(c.x, c.t);
    return { x: r1(p.x), y: r1(p.y), label: c.label };
  };

  /* Default positions for the numbered key-location pins.
     Scene pins (ICP, triage …) sit upwind of the incident and are
     pulled back onto the island if they would land in the sea. */
  var locationPositions = function (ctx, crash, windFrom, site) {
    var g = geometry(ctx);
    var F = g.F, f = function (frac) { return frac * HALF; };
    var w = windFrom * Math.PI / 180;
    var up = { x: Math.sin(w), y: -Math.cos(w) };   /* points to where the wind comes from */
    /* upwind offset; if that lands in the sea, swing it towards the
       apron side until it is back on the island */
    var cross = up.x * F.q.y - up.y * F.q.x;          /* sign of the turn from "up" to "apron" */
    var turn = cross >= 0 ? 1 : -1;
    var scene = function (dUp, dSide) {
      var vx = up.x * dUp + F.q.x * dSide, vy = up.y * dUp + F.q.y * dSide;
      for (var deg = 0; deg <= 150; deg += 25) {
        var r = turn * deg * Math.PI / 180;
        var p = { x: crash.x + vx * Math.cos(r) - vy * Math.sin(r), y: crash.y + vx * Math.sin(r) + vy * Math.cos(r) };
        if (inPoly(p, g.island)) return p;
      }
      return { x: crash.x + vx, y: crash.y + vy };
    };
    var fixed = function (x, t) { return F.P(x, t); };
    var pos = {
      1: scene(128, 34),
      2: fixed(f(0.08), 140),
      3: fixed(f(0.86), 152),
      4: scene(50, 14),
      5: scene(84, 46),
      6: scene(112, 92),
      7: fixed(f(0.5), 158),
      8: fixed(-g.thrX * 0.9, -28),
      9: fixed(f(-0.26), 140),
      10: fixed(f(-0.1), 126),
      11: fixed(f(0.12), 92),
      12: fixed(f(0.62), 140),
      13: fixed(f(-0.86), 140),
      14: fixed(f(-0.62), 196),
      15: g.sea ? fixed(f(0.42), -92) : fixed(f(0.55), -70)
    };
    /* terminal incident: EOC, FAC and survivor holding move to
       alternate buildings away from the fire */
    if (site === 'terminal') {
      pos[2] = fixed(f(0.62), 132);
      pos[9] = fixed(f(0.74), 146);
      pos[10] = fixed(f(-0.72), 128);
    }
    var waterOk = { 14: true, 15: true };
    var cx = C.x, cy = C.y;
    var ids = Object.keys(pos);
    var settle = function (id) {
      var p = pos[id];
      if (!waterOk[id]) {
        var guard = 0;
        while (!inPoly(p, g.island) && guard++ < 60) {
          p = { x: p.x + (cx - p.x) * 0.06, y: p.y + (cy - p.y) * 0.06 };
        }
      }
      p.x = Math.max(22, Math.min(VB.w - 22, p.x));
      p.y = Math.max(22, Math.min(VB.h - 22, p.y));
      pos[id] = p;
    };
    ids.forEach(settle);
    /* nudge overlapping pins apart (pins are 26 px across) */
    var MIN = 30;
    for (var it = 0; it < 40; it++) {
      var moved = false;
      for (var i = 0; i < ids.length; i++) {
        for (var j = i + 1; j < ids.length; j++) {
          var a = pos[ids[i]], b = pos[ids[j]];
          var dx = b.x - a.x, dy = b.y - a.y, d = Math.sqrt(dx * dx + dy * dy);
          if (d >= MIN) continue;
          if (d < 0.01) { dx = 1; dy = 0; d = 1; }
          var push = (MIN - d) / 2 + 0.5;
          var ux = dx / d, uy = dy / d;
          var na = { x: a.x - ux * push, y: a.y - uy * push };
          var nb = { x: b.x + ux * push, y: b.y + uy * push };
          if (waterOk[ids[i]] || inPoly(na, g.island)) pos[ids[i]] = na;
          if (waterOk[ids[j]] || inPoly(nb, g.island)) pos[ids[j]] = nb;
          moved = true;
        }
      }
      if (!moved) break;
    }
    ids.forEach(function (id) {
      settle(id);
      pos[id] = { x: Math.round(pos[id].x), y: Math.round(pos[id].y) };
    });
    return pos;
  };

  /* Static map art for the selected airport + runway in use */
  var mapSvg = function (ctx, opts) {
    ctx = ctx || context();
    opts = opts || {};
    var g = geometry(ctx);
    var F = g.F, f = function (frac) { return frac * HALF; };
    var ap = ctx.airport, rw = ctx.runway;
    var o = [];
    var lbl = 'font-size="9" fill="#7f9cc4" letter-spacing="1.4" font-weight="600" paint-order="stroke" stroke="#0a1626" stroke-width="3"';
    var small = 'font-size="7.5" fill="#6d88ad" letter-spacing="1" paint-order="stroke" stroke="#0a1626" stroke-width="3"';

    /* sea, reef, island */
    o.push('<rect width="1000" height="720" fill="url(#oceanGrad)"/>');
    o.push('<polygon points="' + pts(g.reef) + '" fill="#0b3554" opacity=".55" stroke="#1f6f8f" stroke-width="1.2" stroke-dasharray="3 5"/>');
    o.push('<polygon points="' + pts(g.island) + '" fill="#13283a" stroke="#d8c9a0" stroke-opacity=".35" stroke-width="2"/>');

    /* links to neighbouring islands (road causeways / bridges or sea routes) */
    (ap.links || []).forEach(function (lk) {
      var b = lk.bearing * Math.PI / 180;
      var v = { x: Math.sin(b), y: -Math.cos(b) };
      var start = { x: C.x, y: C.y }, k = 0;
      while (inPoly(start, g.island) && k++ < 400) { start = { x: start.x + v.x * 2, y: start.y + v.y * 2 }; }
      var len = lk.kind === 'sea' ? 120 : 95;
      var end = { x: start.x + v.x * len, y: start.y + v.y * len };
      end.x = Math.max(30, Math.min(970, end.x));
      end.y = Math.max(24, Math.min(700, end.y));
      if (lk.kind === 'sea') {
        o.push('<line x1="' + r1(start.x) + '" y1="' + r1(start.y) + '" x2="' + r1(end.x) + '" y2="' + r1(end.y) + '" stroke="#22d3ee" stroke-width="1.6" stroke-dasharray="7 6" opacity=".8"/>');
      } else {
        o.push('<line x1="' + r1(start.x) + '" y1="' + r1(start.y) + '" x2="' + r1(end.x) + '" y2="' + r1(end.y) + '" stroke="#2a4166" stroke-width="7" stroke-linecap="round"/>');
        o.push('<line x1="' + r1(start.x) + '" y1="' + r1(start.y) + '" x2="' + r1(end.x) + '" y2="' + r1(end.y) + '" stroke="#5d7a9e" stroke-width="1.2" stroke-dasharray="6 6"/>');
      }
      var lx = end.x + v.x * 10, ly = end.y + v.y * 12;
      var anchor = v.x > 0.35 ? 'start' : (v.x < -0.35 ? 'end' : 'middle');
      var tw = lk.label.length * 5.1;   /* ≈ text width at 9px */
      if (anchor === 'end') lx = Math.max(tw + 10, Math.min(990, lx));
      else if (anchor === 'start') lx = Math.max(10, Math.min(990 - tw, lx));
      else lx = Math.max(tw / 2 + 10, Math.min(990 - tw / 2, lx));
      ly = Math.max(14, Math.min(712, ly));
      o.push('<text x="' + r1(lx) + '" y="' + r1(ly) + '" text-anchor="' + anchor + '" ' + (lk.kind === 'sea'
        ? 'font-size="9" fill="#67e8f9" font-weight="600" paint-order="stroke" stroke="#04101e" stroke-width="3"'
        : 'font-size="9" fill="#a8c4e0" font-weight="600" paint-order="stroke" stroke="#04101e" stroke-width="3"') + '>' + esc(lk.label) + '</text>');
    });

    /* seaplane water aerodrome on the far-side lagoon */
    if (g.sea) {
      o.push(rect(F, f(-0.75), f(0.75), -140, -104, 'fill="none" stroke="#22d3ee" stroke-width="1" stroke-dasharray="10 6" opacity=".7"'));
      o.push(text(F.P(0, -122), 'WATER AERODROME · SEAPLANE LANES', 'font-size="8.5" fill="#67e8f9" letter-spacing="1.4" font-weight="600" paint-order="stroke" stroke="#04101e" stroke-width="3"'));
      o.push(rect(F, f(0.05), f(0.35), -84, -70, 'fill="#164e63" stroke="#22d3ee" stroke-width="1"'));
      o.push(line(F, f(0.2), -70, f(0.2), -48, 'stroke="#22d3ee" stroke-width="2"'));
      o.push(rect(F, f(0.08), f(0.32), -46, -30, 'fill="#1e3a5a" stroke="#3a5070" stroke-width="1"'));
      o.push(text(F.P(f(0.2), -88), 'SEAPLANE DOCKS', small));
    }

    /* landside road + jetty */
    o.push(line(F, f(-0.95), 160, f(0.95), 160, 'stroke="#22344f" stroke-width="5" stroke-linecap="round"'));
    o.push(line(F, f(-0.95), 160, f(0.95), 160, 'stroke="#3d5a86" stroke-width="1" stroke-dasharray="6 8"'));
    o.push(line(F, f(-0.62), 162, f(-0.62), 200, 'stroke="#c8b98f" stroke-opacity=".7" stroke-width="4"'));
    o.push(line(F, f(-0.69), 200, f(-0.55), 200, 'stroke="#c8b98f" stroke-opacity=".7" stroke-width="4"'));
    o.push(text(F.P(f(-0.62), 214), 'JETTY', small));

    /* terminal, apron, cargo, fuel farm */
    o.push(rect(F, f(-0.4), f(0.3), 52, 112, 'fill="#1e2e48" stroke="#2a3d58" stroke-width="1.1"'));
    o.push(text(F.P(f(-0.05), 86), 'APRON', lbl));
    o.push(rect(F, f(-0.38), f(0.22), 118, 150, 'fill="#2a3d5a" stroke="#3a5070" stroke-width="1.2"'));
    o.push(text(F.P(f(-0.08), 137), 'TERMINAL', lbl));
    o.push(rect(F, f(0.36), f(0.56), 60, 100, 'fill="#1c2b40" stroke="#2a3d58" stroke-width="1"'));
    o.push(text(F.P(f(0.46), 116), 'CARGO', small));
    var ff = F.P(f(0.8), 112);
    o.push('<circle cx="' + r1(ff.x - 6) + '" cy="' + r1(ff.y) + '" r="6" fill="#3a2d14" stroke="#f59e0b" stroke-width="1"/>');
    o.push('<circle cx="' + r1(ff.x + 7) + '" cy="' + r1(ff.y + 2) + '" r="6" fill="#3a2d14" stroke="#f59e0b" stroke-width="1"/>');
    o.push(text(F.P(f(0.8), 130), 'FUEL FARM', small));

    /* parallel taxiway + links */
    o.push(rect(F, f(-0.9), f(0.9), 31, 41, 'fill="#1e2e48" stroke="#2a3d58" stroke-width="1"'));
    [-0.82, 0, 0.82].forEach(function (fr) {
      o.push(rect(F, f(fr) - 6, f(fr) + 6, 12, 31, 'fill="#1e2e48"'));
    });

    /* runway */
    var w = rw.width >= 45 ? 12 : 9;
    o.push(rect(F, -HALF, HALF, -w, w, 'fill="#2a3d58" stroke="#3a5070" stroke-width="1.2"'));
    o.push(line(F, -HALF + 22, 0, HALF - 22, 0, 'stroke="#5b7ea8" stroke-width="1.4" stroke-dasharray="14 10"'));
    [-1, 1].forEach(function (s) {
      for (var i = 0; i < 4; i++) {
        var xx = s * (HALF - 6 - i * 5);
        o.push(line(F, xx, -w + 2, xx, w - 2, 'stroke="#7ba3d1" stroke-width="1.4"'));
      }
    });
    /* end numbers sit inside each threshold (the number painted at an end = its landing heading) */
    o.push(text(F.P(-HALF + 40, 0), rw.ends[0], 'font-size="13" fill="#dbe7f5" font-weight="700" dominant-baseline="central" paint-order="stroke" stroke="#0a1626" stroke-width="3"'));
    o.push(text(F.P(HALF - 40, 0), rw.ends[1], 'font-size="13" fill="#dbe7f5" font-weight="700" dominant-baseline="central" paint-order="stroke" stroke="#0a1626" stroke-width="3"'));

    /* approach arrow for the runway in use */
    var a0 = F.P(g.thrX - g.dir * 52, 0), a1 = F.P(g.thrX - g.dir * 12, 0);
    var ah = F.P(g.thrX - g.dir * 20, 7), ah2 = F.P(g.thrX - g.dir * 20, -7);
    o.push('<line x1="' + r1(a0.x) + '" y1="' + r1(a0.y) + '" x2="' + r1(a1.x) + '" y2="' + r1(a1.y) + '" stroke="#4ade80" stroke-width="2.4"/>');
    o.push('<polygon points="' + pts([a1, ah, ah2]) + '" fill="#4ade80"/>');
    var tl = F.P(g.thrX - g.dir * 60, -26);
    o.push(text(tl, 'RWY ' + ctx.end + ' IN USE', 'font-size="9" fill="#4ade80" font-weight="700" letter-spacing="1.2" paint-order="stroke" stroke="#04101e" stroke-width="3"'));

    /* title block */
    o.push('<text x="24" y="30" font-size="13" fill="#dbe7f5" font-weight="700" paint-order="stroke" stroke="#04101e" stroke-width="3">' +
      esc(ap.short + (ap.icao !== '—' ? ' · ' + ap.icao : '') + ' · RWY ' + rw.id) + '</text>');
    o.push('<text x="24" y="46" font-size="9" fill="#7f9cc4" paint-order="stroke" stroke="#04101e" stroke-width="3">' +
      esc(ap.island + (ap.atoll !== '—' ? ', ' + ap.atoll : '') + ' · ' + rw.length.toLocaleString('en-US') + ' × ' + rw.width + ' m · schematic, not survey-accurate') + '</text>');

    /* compass (north up) */
    o.push('<g transform="translate(948, 62)"><circle r="22" fill="#0a1728" stroke="#2a3d58" stroke-width="1"/>' +
      '<polygon points="0,-16 4,0 0,16 -4,0" fill="#5d7a9e"/><polygon points="0,-16 4,0 0,0 -4,0" fill="#a8c4e0"/>' +
      '<text x="0" y="-25" font-size="9" fill="#a8c4e0" text-anchor="middle" font-weight="700">N</text></g>');

    /* scale bar (500 m) */
    var px500 = Math.max(20, Math.min(260, 500 * L / rw.length));
    o.push('<g transform="translate(40, 694)"><line x1="0" y1="0" x2="' + r1(px500) + '" y2="0" stroke="#7f9cc4" stroke-width="2"/>' +
      '<line x1="0" y1="-4" x2="0" y2="4" stroke="#7f9cc4" stroke-width="2"/><line x1="' + r1(px500) + '" y1="-4" x2="' + r1(px500) + '" y2="4" stroke="#7f9cc4" stroke-width="2"/>' +
      '<text x="' + r1(px500 / 2) + '" y="-7" font-size="8" fill="#7f9cc4" text-anchor="middle">500 m (runway scale)</text></g>');

    /* wind */
    var wf = typeof opts.windFrom === 'number' ? opts.windFrom : ctx.hdg;
    var wr = wf * Math.PI / 180;
    var wc = { x: 880, y: 640 };
    var from = { x: wc.x + Math.sin(wr) * 30, y: wc.y - Math.cos(wr) * 30 };
    var to = { x: wc.x - Math.sin(wr) * 30, y: wc.y + Math.cos(wr) * 30 };
    var hd1 = { x: to.x + Math.sin(wr) * 9 + Math.cos(wr) * 5, y: to.y - Math.cos(wr) * 9 + Math.sin(wr) * 5 };
    var hd2 = { x: to.x + Math.sin(wr) * 9 - Math.cos(wr) * 5, y: to.y - Math.cos(wr) * 9 - Math.sin(wr) * 5 };
    o.push('<line x1="' + r1(from.x) + '" y1="' + r1(from.y) + '" x2="' + r1(to.x) + '" y2="' + r1(to.y) + '" stroke="#93c5fd" stroke-width="1.8"/>');
    o.push('<polygon points="' + pts([to, hd1, hd2]) + '" fill="#93c5fd"/>');
    o.push('<text x="' + wc.x + '' + '" y="' + (wc.y - 42) + '" font-size="8.5" fill="#93c5fd" text-anchor="middle" letter-spacing="1.2" font-weight="600">WIND ' +
      esc(('00' + Math.round(wf)).slice(-3)) + '°' + (opts.windLive ? ' (LIVE)' : '') + '</text>');

    /* TWR + ARFF default positions (the markers themselves are draggable elements in the page) */
    var twr = F.P(f(0.27), 128);
    var arff = F.P(f(-0.58), 72);

    return {
      svg: o.join(''),
      twr: { x: Math.round(twr.x), y: Math.round(twr.y) },
      arff: { x: Math.round(arff.x), y: Math.round(arff.y) },
      windFrom: wf
    };
  };

  /* Plain-language layout description for the Key Locations tab */
  var describe = function (ctx, windFrom, windLive) {
    ctx = ctx || context();
    var ap = ctx.airport, rw = ctx.runway;
    var wf = typeof windFrom === 'number' ? windFrom : ctx.hdg;
    var apronBearing = (rw.hdg + (ap.apronSide === 'left' ? -90 : 90) + 360) % 360;
    return {
      layout: ap.name + ' on ' + ap.island + ' — runway ' + rw.id + ' (' + rw.length.toLocaleString('en-US') + ' × ' + rw.width + ' m), terminal and apron on the ' +
        compassWord(apronBearing) + ' side, runway ' + ctx.end + ' in use (aircraft land heading ' + compassWord(ctx.hdg) +
        ', so the active threshold is at the ' + compassWord(ctx.hdg + 180) + ' end). ' + ap.notes,
      placement: 'Scene locations are placed upwind of the incident: ' +
        (windLive ? 'the live wind is from the ' + compassWord(wf) : 'with RWY ' + ctx.end + ' in use the wind is assumed to be roughly from the ' + compassWord(wf)) +
        ', so the ICP, triage and CCP sit on the ' + compassWord(wf) +
        ' side of the incident and away from smoke. Casualty transport runs from the transportation area to ' +
        primaryHospital(ap).name + ' (' + primaryHospital(ap).eta + ' by ' + primaryHospital(ap).how + '). ' +
        'The jetty doubles as the sea-ambulance transfer point. Drag any marker to match your AEP.'
    };
  };

  return {
    list: TTX_AIRPORTS,
    byId: byId,
    getSelection: getSelection,
    setSelection: setSelection,
    normalise: normalise,
    context: context,
    compassWord: compassWord,
    rffCategory: rffCategory,
    rffForAircraft: rffForAircraft,
    minRffVehicles: minRffVehicles,
    isApplicable: isApplicable,
    resolveScenario: resolveScenario,
    shortfall: shortfall,
    suggestEnd: suggestEnd,
    primaryHospital: primaryHospital,
    incidentSite: incidentSite,
    locationPositions: locationPositions,
    mapSvg: mapSvg,
    describe: describe,
    fill: fill,
    tokensFor: tokensFor
  };
})();
