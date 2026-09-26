/**
 * KALKULATOR VEKTOR NAVIGASI NAUTIKA
 * Logik Pengiraan Navigasi, Halaju & Masa (L = V × T), Visualisasi Canvas & Peta Laut Leaflet OpenSeaMap
 */

(() => {
  'use strict';

  // --- Palet Warna Vektor ---
  const VECTOR_COLORS = [
    '#38bdf8', // Sky Blue
    '#34d399', // Emerald
    '#fbbf24', // Amber
    '#f472b6', // Pink
    '#a78bfa', // Purple
    '#fb923c', // Orange
    '#4ade80', // Lime
    '#22d3ee', // Cyan
    '#e879f9', // Fuchsia
    '#facc15'  // Yellow
  ];

  // Nilai Asal Default Origin Maritim (Perairan Terengganu, Laut China Selatan)
  const DEFAULT_ORIGIN_GEO = {
    lat: 5.333333,
    lon: 104.000000,
    label: "Perairan Terengganu (05° 20.00' N, 104° 00.00' E)"
  };

  // --- IAMSAR Manual Vol II Leeway Targets (Figure N-2 & Figure N-3) ---
  const LEEWAY_TARGETS = {
    // Figure N-2: Liferafts, survival craft and persons in the water (PIWs)
    'no_ballast_no_canopy': {
      category: 'Fig. N-2',
      name: 'No ballast, no canopy, no drogue',
      breakWind: 6.0,
      slopeLow: 0.054,
      slope: 0.054,
      intercept: 0.0,
      minWind: 0.0,
      divergence: 25,
      errorE: 0.25,
      formulaStr: 'W ≤ 6 kts: LW = 0.054 × W | W > 6 kts: LW = 0.054 × W'
    },
    'no_ballast_unknown': {
      category: 'Fig. N-2',
      name: 'No ballast, canopy unknown, drogue unknown',
      breakWind: 6.0,
      slopeLow: 0.044,
      slope: 0.044,
      intercept: 0.0,
      minWind: 0.0,
      divergence: 30,
      errorE: 0.35,
      formulaStr: 'W ≤ 6 kts: LW = 0.044 × W | W > 6 kts: LW = 0.044 × W'
    },
    'aviation_no_drogue': {
      category: 'Fig. N-2',
      name: 'Aviation (4-6 person) w/o drogue',
      breakWind: 6.0,
      slopeLow: 0.038,
      slope: 0.038,
      intercept: 0.0,
      minWind: 0.0,
      divergence: 25,
      errorE: 0.10,
      formulaStr: 'W ≤ 6 kts: LW = 0.038 × W | W > 6 kts: LW = 0.038 × W'
    },
    'life_capsule': {
      category: 'Fig. N-2',
      name: 'Life capsule - fully enclosed',
      breakWind: 6.0,
      slopeLow: 0.033,
      slope: 0.033,
      intercept: 0.0,
      minWind: 0.0,
      divergence: 20,
      errorE: 0.10,
      formulaStr: 'W ≤ 6 kts: LW = 0.033 × W | W > 6 kts: LW = 0.033 × W'
    },
    'deep_ballast': {
      category: 'Fig. N-2',
      name: 'Deep ballast',
      breakWind: 6.0,
      slopeLow: 0.031,
      slope: 0.031,
      intercept: 0.0,
      minWind: 0.0,
      divergence: 15,
      errorE: 0.20,
      formulaStr: 'W ≤ 6 kts: LW = 0.031 × W | W > 6 kts: LW = 0.031 × W'
    },
    'shallow_ballast_no_drogue': {
      category: 'Fig. N-2',
      name: 'Shallow ballast with no drogue or unknown drogue',
      breakWind: 6.0,
      slopeLow: 0.028,
      slope: 0.028,
      intercept: 0.0,
      minWind: 0.0,
      divergence: 20,
      errorE: 0.35,
      formulaStr: 'W ≤ 6 kts: LW = 0.028 × W | W > 6 kts: LW = 0.028 × W'
    },
    'no_ballast_canopy_drogue': {
      category: 'Fig. N-2',
      name: 'No ballast, with canopy and drogue',
      breakWind: 6.0,
      slopeLow: 0.025,
      slope: 0.025,
      intercept: 0.0,
      minWind: 0.0,
      divergence: 30,
      errorE: 0.35,
      formulaStr: 'W ≤ 6 kts: LW = 0.025 × W | W > 6 kts: LW = 0.025 × W'
    },
    'aviation_evac_slide': {
      category: 'Fig. N-2',
      name: 'Aviation (46-person) Evac/slide',
      breakWind: 6.0,
      slopeLow: 0.022,
      slope: 0.022,
      intercept: 0.0,
      minWind: 0.0,
      divergence: 15,
      errorE: 0.10,
      formulaStr: 'W ≤ 6 kts: LW = 0.022 × W | W > 6 kts: LW = 0.022 × W'
    },
    'sea_rescue_kit': {
      category: 'Fig. N-2',
      name: 'Sea rescue kit',
      breakWind: 6.0,
      slopeLow: 0.018,
      slope: 0.018,
      intercept: 0.0,
      minWind: 0.0,
      divergence: 5,
      errorE: 0.10,
      formulaStr: 'W ≤ 6 kts: LW = 0.018 × W | W > 6 kts: LW = 0.018 × W'
    },
    'shallow_ballast_with_drogue': {
      category: 'Fig. N-2',
      name: 'Shallow ballast with drogue',
      breakWind: 6.0,
      slopeLow: 0.015,
      slope: 0.015,
      intercept: 0.0,
      minWind: 0.0,
      divergence: 20,
      errorE: 0.10,
      formulaStr: 'W ≤ 6 kts: LW = 0.015 × W | W > 6 kts: LW = 0.015 × W'
    },
    'piw_survival_suit': {
      category: 'Fig. N-2',
      name: 'PIW: Survival suit or deceased',
      breakWind: 6.0,
      slopeLow: 0.013,
      slope: 0.013,
      intercept: 0.0,
      minWind: 0.0,
      divergence: 30,
      errorE: 0.25,
      formulaStr: 'W ≤ 6 kts: LW = 0.013 × W | W > 6 kts: LW = 0.013 × W'
    },
    'shallow_ballast_capsized': {
      category: 'Fig. N-2',
      name: 'Shallow ballast, capsized',
      breakWind: 6.0,
      slopeLow: 0.010,
      slope: 0.010,
      intercept: 0.0,
      minWind: 0.0,
      divergence: 10,
      errorE: 0.10,
      formulaStr: 'W ≤ 6 kts: LW = 0.010 × W | W > 6 kts: LW = 0.010 × W'
    },
    'piw_unknown': {
      category: 'Fig. N-2',
      name: 'PIW: Position/survival gear unknown',
      breakWind: 6.0,
      slopeLow: 0.007,
      slope: 0.007,
      intercept: 0.0,
      minWind: 0.0,
      divergence: 30,
      errorE: 0.35,
      formulaStr: 'W ≤ 6 kts: LW = 0.007 × W | W > 6 kts: LW = 0.007 × W'
    },
    'deep_ballast_capsized': {
      category: 'Fig. N-2',
      name: 'Deep ballast, capsized/swamped',
      breakWind: 6.0,
      slopeLow: 0.004,
      slope: 0.004,
      intercept: 0.0,
      minWind: 0.0,
      divergence: 10,
      errorE: 0.10,
      formulaStr: 'W ≤ 6 kts: LW = 0.004 × W | W > 6 kts: LW = 0.004 × W'
    },
    'piw_scuba': {
      category: 'Fig. N-2',
      name: 'PIW: Scuba suit',
      breakWind: 6.0,
      slopeLow: 0.003,
      slope: 0.003,
      intercept: 0.0,
      minWind: 0.0,
      divergence: 30,
      errorE: 0.15,
      formulaStr: 'W ≤ 6 kts: LW = 0.003 × W | W > 6 kts: LW = 0.003 × W'
    },
    'piw_vertical': {
      category: 'Fig. N-2',
      name: 'PIW: Vertical',
      breakWind: 6.0,
      slopeLow: 0.001,
      slope: 0.001,
      intercept: 0.0,
      minWind: 0.0,
      divergence: 20,
      errorE: 0.25,
      formulaStr: 'W ≤ 6 kts: LW = 0.001 × W | W > 6 kts: LW = 0.001 × W'
    },

    // Figure N-3: Power vessels, sailing vessels and person-powered craft
    'raft_tubes_sail': {
      category: 'Fig. N-3',
      name: 'Raft (2 inner tubes with frame) with sail',
      breakWind: 6.0,
      slopeLow: 0.0,
      slope: 0.103,
      intercept: -0.62,
      minWind: 6.0,
      divergence: 35,
      errorE: 0.15,
      formulaStr: 'W < 6 kts: LW = 0.00 | W ≥ 6 kts: LW = 0.103 × W - 0.62'
    },
    'sport_boat': {
      category: 'Fig. N-3',
      name: 'Sport boats (4.5–8.5 m, 2–3 m beam) with cuddy cabin or side console, modified V-hull',
      breakWind: 4.0,
      slopeLow: 0.0,
      slope: 0.075,
      intercept: -0.30,
      minWind: 4.0,
      divergence: 20,
      errorE: 0.10,
      formulaStr: 'W < 4 kts: LW = 0.00 | W ≥ 4 kts: LW = 0.075 × W - 0.30'
    },
    'sport_fisher': {
      category: 'Fig. N-3',
      name: 'Sport fisher (5–30 m, beam width up to 7.3 m) with center console or walk-around cabin',
      breakWind: 4.0,
      slopeLow: 0.0,
      slope: 0.068,
      intercept: -0.27,
      minWind: 4.0,
      divergence: 20,
      errorE: 0.10,
      formulaStr: 'W < 4 kts: LW = 0.00 | W ≥ 4 kts: LW = 0.068 × W - 0.27'
    },
    'commercial_fishing_unknown': {
      category: 'Fig. N-3',
      name: 'Commercial fishing vessels (14–30 m): Trollers/sampans/longliners, Gill-netters, Unknown type',
      breakWind: 12.0,
      slopeLow: 0.044,
      slope: 0.044,
      intercept: 0.0,
      minWind: 0.0,
      divergence: 50,
      errorE: 0.35,
      formulaStr: 'W ≤ 12 kts: LW = 0.044 × W | W > 12 kts: LW = 0.044 × W'
    },
    'sailing_fin_keel': {
      category: 'Fig. N-3',
      name: 'Sailing vessels with fin keel, shoal draft (< 9 m, sails down)',
      breakWind: 6.0,
      slopeLow: 0.043,
      slope: 0.043,
      intercept: 0.0,
      minWind: 0.0,
      divergence: 50,
      errorE: 0.25,
      formulaStr: 'W ≤ 6 kts: LW = 0.043 × W | W > 6 kts: LW = 0.043 × W'
    },
    'skiff_flat': {
      category: 'Fig. N-3',
      name: 'Skiff, flat-bottom (< 6 m)',
      breakWind: 6.0,
      slopeLow: 0.034,
      slope: 0.034,
      intercept: 0.0,
      minWind: 0.0,
      divergence: 20,
      errorE: 0.10,
      formulaStr: 'W ≤ 6 kts: LW = 0.034 × W | W > 6 kts: LW = 0.034 × W'
    },
    'skiff_v_hull': {
      category: 'Fig. N-3',
      name: 'Skiff, V-hull (< 6 m)',
      breakWind: 6.0,
      slopeLow: 0.031,
      slope: 0.031,
      intercept: 0.0,
      minWind: 0.0,
      divergence: 15,
      errorE: 0.10,
      formulaStr: 'W ≤ 6 kts: LW = 0.031 × W | W > 6 kts: LW = 0.031 × W'
    },
    'bait_box_light': {
      category: 'Fig. N-3',
      name: 'Bait/wharf box lightly loaded (90 kg) (< 6 m)',
      breakWind: 6.0,
      slopeLow: 0.028,
      slope: 0.028,
      intercept: 0.0,
      minWind: 0.0,
      divergence: 15,
      errorE: 0.10,
      formulaStr: 'W ≤ 6 kts: LW = 0.028 × W | W > 6 kts: LW = 0.028 × W'
    },
    'coastal_freighter': {
      category: 'Fig. N-3',
      name: 'Coastal freighter (<= 30 m)',
      breakWind: 12.0,
      slopeLow: 0.026,
      slope: 0.026,
      intercept: 0.0,
      minWind: 0.0,
      divergence: 50,
      errorE: 0.25,
      formulaStr: 'W ≤ 12 kts: LW = 0.026 × W | W > 12 kts: LW = 0.026 × W'
    },
    'coastal_fishing_vessel': {
      category: 'Fig. N-3',
      name: 'Coastal fishing vessel (12.5 m, typical in western Pacific)',
      breakWind: 12.0,
      slopeLow: 0.025,
      slope: 0.025,
      intercept: 0.0,
      minWind: 0.0,
      divergence: 50,
      errorE: 0.10,
      formulaStr: 'W ≤ 12 kts: LW = 0.025 × W | W > 12 kts: LW = 0.025 × W'
    },
    'sailing_full_keel': {
      category: 'Fig. N-3',
      name: 'Sailing vessel, full keel, deep draft (< 9 m)',
      breakWind: 6.0,
      slopeLow: 0.022,
      slope: 0.022,
      intercept: 0.0,
      minWind: 0.0,
      divergence: 50,
      errorE: 0.25,
      formulaStr: 'W ≤ 6 kts: LW = 0.022 × W | W > 6 kts: LW = 0.022 × W'
    },
    'windsurfer': {
      category: 'Fig. N-3',
      name: 'Windsurfer',
      breakWind: 6.0,
      slopeLow: 0.019,
      slope: 0.019,
      intercept: 0.0,
      minWind: 0.0,
      divergence: 10,
      errorE: 0.10,
      formulaStr: 'W ≤ 6 kts: LW = 0.019 × W | W > 6 kts: LW = 0.019 × W'
    },
    'surfboard_kayak': {
      category: 'Fig. N-3',
      name: 'Surfboard or sea kayak',
      breakWind: 6.0,
      slopeLow: 0.016,
      slope: 0.016,
      intercept: 0.0,
      minWind: 0.0,
      divergence: 15,
      errorE: 0.25,
      formulaStr: 'W ≤ 6 kts: LW = 0.016 × W | W > 6 kts: LW = 0.016 × W'
    },
    'fv_debris': {
      category: 'Fig. N-3',
      name: 'F/V debris',
      breakWind: 6.0,
      slopeLow: 0.015,
      slope: 0.015,
      intercept: 0.0,
      minWind: 0.0,
      divergence: 10,
      errorE: 0.25,
      formulaStr: 'W ≤ 6 kts: LW = 0.015 × W | W > 6 kts: LW = 0.015 × W'
    },
    'bait_box_full': {
      category: 'Fig. N-3',
      name: 'Bait/wharf box, full (365 kg) or unknown loading',
      breakWind: 6.0,
      slopeLow: 0.013,
      slope: 0.013,
      intercept: 0.0,
      minWind: 0.0,
      divergence: 35,
      errorE: 0.15,
      formulaStr: 'W ≤ 6 kts: LW = 0.013 × W | W > 6 kts: LW = 0.013 × W'
    },
    'raft_tubes_no_sail': {
      category: 'Fig. N-3',
      name: 'Raft (2 inner tubes with frame) no sail',
      breakWind: 6.0,
      slopeLow: 0.007,
      slope: 0.007,
      intercept: 0.0,
      minWind: 0.0,
      divergence: 15,
      errorE: 0.10,
      formulaStr: 'W ≤ 6 kts: LW = 0.007 × W | W > 6 kts: LW = 0.007 × W'
    },
    'skiff_v_swamped': {
      category: 'Fig. N-3',
      name: 'Skiff, V-hull, swamped',
      breakWind: 6.0,
      slopeLow: 0.004,
      slope: 0.004,
      intercept: 0.0,
      minWind: 0.0,
      divergence: 15,
      errorE: 0.10,
      formulaStr: 'W ≤ 6 kts: LW = 0.004 × W | W > 6 kts: LW = 0.004 × W'
    },

    // Formula Manual
    'custom': {
      category: 'Custom',
      name: 'Formula Manual (Peratusan ASW %)',
      breakWind: 0.0,
      slopeLow: 0.035,
      slope: 0.035,
      intercept: 0.0,
      minWind: 0.0,
      divergence: 20,
      errorE: 0.20,
      formulaStr: 'LW = Custom % × W'
    }
  };

  // ---------------------------------------------------------
  // IAMSAR MANUAL VOL II TABLES N-1 HINGGA N-8
  // ---------------------------------------------------------
  const IAMSAR_TABLES = {
    tableN1_NavigationalFixErrors: {
      title: "Table N-1: Navigational fix errors",
      unit: "NM",
      note: "* Should be evaluated upward according to circumstances.",
      data: [
        { meansOfNavigation: "GNSS", fixError: "0.1" },
        { meansOfNavigation: "Radar", fixError: "1" },
        { meansOfNavigation: "Visual fix (3 lines)*", fixError: "1" },
        { meansOfNavigation: "Celestial fix (3 lines)*", fixError: "2" },
        { meansOfNavigation: "Marine radio beacon", fixError: "4 (3-beacon fix)" },
        { meansOfNavigation: "LORAN C", fixError: "1" },
        { meansOfNavigation: "INS", fixError: "0.5 per flight hour without position update" },
        { meansOfNavigation: "VOR", fixError: "±3° arc and 3% of distance or 0.5 NM radius, whichever is greater" },
        { meansOfNavigation: "TACAN", fixError: "±3° arc and 3% of distance or 0.5 NM radius, whichever is greater" }
      ]
    },

    tableN2_FixErrorsByCraftType: {
      title: "Table N-2: Fix errors by craft type (If means of navigation is unknown)",
      unit: "NM",
      data: [
        { craftType: "Ships, military submarines, and aircraft with more than two engines", fixError: 5 },
        { craftType: "Twin-engine aircraft", fixError: 10 },
        { craftType: "Boats, submersibles, and single-engine aircraft", fixError: 15 }
      ]
    },

    tableN3_DeadReckoningErrors: {
      title: "Table N-3: Dead reckoning errors",
      unit: "% of DR distance",
      data: [
        { craftType: "Ship", drErrorRate: 5 },
        { craftType: "Submarine (military)", drErrorRate: 5 },
        { craftType: "Aircraft (more than two engines)", drErrorRate: 5 },
        { craftType: "Aircraft (twin-engine)", drErrorRate: 10 },
        { craftType: "Aircraft (single-engine)", drErrorRate: 15 },
        { craftType: "Submersible", drErrorRate: 15 },
        { craftType: "Boat", drErrorRate: 15 }
      ]
    },

    tableN4_MerchantVessels: {
      title: "Table N-4: Sweep widths for merchant vessels",
      unit: "NM",
      visibility_NM: [3, 5, 10, 15, 20],
      data: [
        { searchObject: "Person in water", sweepWidth: { 3: 0.4, 5: 0.5, 10: 0.6, 15: 0.7, 20: 0.7 } },
        { searchObject: "4-person liferaft", sweepWidth: { 3: 2.3, 5: 3.2, 10: 4.2, 15: 4.9, 20: 5.5 } },
        { searchObject: "6-person liferaft", sweepWidth: { 3: 2.5, 5: 3.6, 10: 5.0, 15: 6.2, 20: 6.9 } },
        { searchObject: "15-person liferaft", sweepWidth: { 3: 2.6, 5: 4.0, 10: 5.1, 15: 6.4, 20: 7.3 } },
        { searchObject: "25-person liferaft", sweepWidth: { 3: 2.7, 5: 4.2, 10: 5.2, 15: 6.5, 20: 7.5 } },
        { searchObject: "Boat < 5 m (17 ft)", sweepWidth: { 3: 1.1, 5: 1.4, 10: 1.9, 15: 2.1, 20: 2.3 } },
        { searchObject: "Boat 7 m (23 ft)", sweepWidth: { 3: 2.0, 5: 2.9, 10: 4.3, 15: 5.2, 20: 5.8 } },
        { searchObject: "Boat 12 m (40 ft)", sweepWidth: { 3: 2.8, 5: 4.5, 10: 7.6, 15: 9.4, 20: 11.6 } },
        { searchObject: "Boat 24 m (79 ft)", sweepWidth: { 3: 3.2, 5: 5.6, 10: 10.7, 15: 14.7, 20: 18.1 } }
      ]
    },

    tableN5_Helicopters: {
      title: "Table N-5: Sweep widths for helicopters",
      unit: "NM",
      visibility_NM: [1, 3, 5, 10, 15, 20],
      data: {
        "150m (500ft)": [
          { searchObject: "Person in water", sweepWidth: { 1: 0.0, 3: 0.1, 5: 0.1, 10: 0.1, 15: 0.1, 20: 0.1 } },
          { searchObject: "Raft 1-person", sweepWidth: { 1: 0.5, 3: 0.9, 5: 1.2, 10: 1.6, 15: 1.6, 20: 1.6 } },
          { searchObject: "Raft 4-person", sweepWidth: { 1: 0.5, 3: 1.4, 5: 1.9, 10: 2.8, 15: 3.2, 20: 3.5 } },
          { searchObject: "Raft 6-person", sweepWidth: { 1: 0.6, 3: 1.5, 5: 2.0, 10: 3.1, 15: 3.6, 20: 4.0 } },
          { searchObject: "Raft 10-person", sweepWidth: { 1: 0.6, 3: 1.6, 5: 2.2, 10: 3.4, 15: 4.0, 20: 4.5 } },
          { searchObject: "Raft 15-person", sweepWidth: { 1: 0.6, 3: 1.7, 5: 2.3, 10: 3.8, 15: 4.4, 20: 5.0 } },
          { searchObject: "Raft 20-person", sweepWidth: { 1: 0.6, 3: 1.8, 5: 2.4, 10: 4.1, 15: 4.8, 20: 5.5 } },
          { searchObject: "Raft 25-person", sweepWidth: { 1: 0.6, 3: 1.8, 5: 2.5, 10: 4.3, 15: 5.0, 20: 5.8 } },
          { searchObject: "Power boat < 5 (15)", sweepWidth: { 1: 0.5, 3: 1.2, 5: 1.6, 10: 2.4, 15: 2.7, 20: 2.8 } },
          { searchObject: "Power boat 6 (20)", sweepWidth: { 1: 0.5, 3: 1.4, 5: 1.9, 10: 3.2, 15: 3.9, 20: 4.3 } },
          { searchObject: "Power boat 10 (33)", sweepWidth: { 1: 0.8, 3: 2.5, 5: 3.9, 10: 6.2, 15: 7.8, 20: 8.9 } },
          { searchObject: "Power boat 16 (53)", sweepWidth: { 1: 0.8, 3: 3.1, 5: 5.1, 10: 9.2, 15: 12.3, 20: 14.7 } },
          { searchObject: "Power boat 24 (78)", sweepWidth: { 1: 0.7, 3: 3.3, 5: 5.9, 10: 11.4, 15: 15.7, 20: 18.8 } },
          { searchObject: "Sail boat 5 (15)", sweepWidth: { 1: 0.7, 3: 1.3, 5: 1.7, 10: 2.6, 15: 3.1, 20: 3.4 } },
          { searchObject: "Sail boat 8 (26)", sweepWidth: { 1: 0.8, 3: 2.4, 5: 3.7, 10: 6.1, 15: 7.7, 20: 8.7 } },
          { searchObject: "Sail boat 12 (39)", sweepWidth: { 1: 0.8, 3: 3.0, 5: 5.2, 10: 9.5, 15: 12.7, 20: 15.3 } },
          { searchObject: "Sail boat 15 (49)", sweepWidth: { 1: 0.8, 3: 3.1, 5: 5.5, 10: 10.6, 15: 14.5, 20: 17.5 } },
          { searchObject: "Sail boat 21 (69)", sweepWidth: { 1: 0.8, 3: 3.3, 5: 5.9, 10: 11.9, 15: 16.7, 20: 20.9 } },
          { searchObject: "Sail boat 25 (83)", sweepWidth: { 1: 0.8, 3: 3.4, 5: 6.1, 10: 12.6, 15: 18.0, 20: 22.8 } },
          { searchObject: "Ship 27-46 (90-150)", sweepWidth: { 1: 0.8, 3: 3.4, 5: 6.3, 10: 13.6, 15: 20.4, 20: 26.3 } },
          { searchObject: "Ship 46-91 (150-300)", sweepWidth: { 1: 0.8, 3: 3.5, 5: 6.4, 10: 14.1, 15: 22.1, 20: 29.8 } },
          { searchObject: "Ship > 91 (300)", sweepWidth: { 1: 0.8, 3: 3.5, 5: 6.4, 10: 14.3, 15: 22.2, 20: 29.8 } }
        ],
        "300m (1000ft)": [
          { searchObject: "Person in water", sweepWidth: { 1: 0.0, 3: 0.0, 5: 0.0, 10: 0.0, 15: 0.0, 20: 0.0 } },
          { searchObject: "Raft 1-person", sweepWidth: { 1: 0.4, 3: 0.9, 5: 1.2, 10: 1.6, 15: 1.6, 20: 1.6 } },
          { searchObject: "Raft 4-person", sweepWidth: { 1: 0.5, 3: 1.4, 5: 2.0, 10: 2.8, 15: 3.2, 20: 3.5 } },
          { searchObject: "Raft 6-person", sweepWidth: { 1: 0.5, 3: 1.5, 5: 2.1, 10: 3.2, 15: 3.7, 20: 4.1 } },
          { searchObject: "Raft 10-person", sweepWidth: { 1: 0.5, 3: 1.6, 5: 2.3, 10: 3.5, 15: 4.1, 20: 4.6 } },
          { searchObject: "Raft 15-person", sweepWidth: { 1: 0.5, 3: 1.7, 5: 2.4, 10: 3.9, 15: 4.6, 20: 5.2 } },
          { searchObject: "Raft 20-person", sweepWidth: { 1: 0.5, 3: 1.8, 5: 2.6, 10: 4.2, 15: 5.0, 20: 5.7 } },
          { searchObject: "Raft 25-person", sweepWidth: { 1: 0.6, 3: 1.8, 5: 2.7, 10: 4.4, 15: 5.3, 20: 6.0 } },
          { searchObject: "Power boat < 5 (15)", sweepWidth: { 1: 0.5, 3: 1.2, 5: 1.6, 10: 2.2, 15: 2.5, 20: 2.6 } },
          { searchObject: "Power boat 6 (20)", sweepWidth: { 1: 0.5, 3: 1.4, 5: 2.0, 10: 3.0, 15: 3.7, 20: 4.0 } },
          { searchObject: "Power boat 10 (33)", sweepWidth: { 1: 0.7, 3: 2.6, 5: 3.9, 10: 6.0, 15: 7.9, 20: 9.0 } },
          { searchObject: "Power boat 16 (53)", sweepWidth: { 1: 0.7, 3: 3.1, 5: 5.2, 10: 9.2, 15: 12.3, 20: 14.8 } },
          { searchObject: "Power boat 24 (78)", sweepWidth: { 1: 0.7, 3: 3.5, 5: 6.2, 10: 11.7, 15: 16.2, 20: 19.4 } },
          { searchObject: "Sail boat 5 (15)", sweepWidth: { 1: 0.7, 3: 1.3, 5: 1.7, 10: 2.5, 15: 3.0, 20: 3.3 } },
          { searchObject: "Sail boat 8 (26)", sweepWidth: { 1: 0.7, 3: 2.6, 5: 3.9, 10: 6.3, 15: 8.1, 20: 9.3 } },
          { searchObject: "Sail boat 12 (39)", sweepWidth: { 1: 0.7, 3: 3.0, 5: 5.3, 10: 9.5, 15: 12.8, 20: 15.5 } },
          { searchObject: "Sail boat 15 (49)", sweepWidth: { 1: 0.7, 3: 3.1, 5: 5.6, 10: 10.6, 15: 14.6, 20: 17.8 } },
          { searchObject: "Sail boat 21 (69)", sweepWidth: { 1: 0.7, 3: 3.3, 5: 6.0, 10: 12.0, 15: 17.0, 20: 21.4 } },
          { searchObject: "Sail boat 25 (83)", sweepWidth: { 1: 0.8, 3: 3.4, 5: 6.3, 10: 12.9, 15: 18.4, 20: 23.5 } },
          { searchObject: "Ship 27-46 (90-150)", sweepWidth: { 1: 0.8, 3: 3.4, 5: 6.4, 10: 13.8, 15: 20.8, 20: 27.2 } },
          { searchObject: "Ship 46-91 (150-300)", sweepWidth: { 1: 0.8, 3: 3.5, 5: 6.5, 10: 14.3, 15: 22.2, 20: 30.1 } },
          { searchObject: "Ship > 91 (300)", sweepWidth: { 1: 0.8, 3: 3.5, 5: 6.5, 10: 14.3, 15: 22.2, 20: 29.8 } }
        ],
        "600m (2000ft)": [
          { searchObject: "Person in water", sweepWidth: { 1: 0.0, 3: 0.0, 5: 0.0, 10: 0.0, 15: 0.0, 20: 0.0 } },
          { searchObject: "Raft 1-person", sweepWidth: { 1: 0.3, 3: 0.8, 5: 1.1, 10: 1.5, 15: 1.5, 20: 1.5 } },
          { searchObject: "Raft 4-person", sweepWidth: { 1: 0.4, 3: 1.2, 5: 1.7, 10: 2.6, 15: 3.0, 20: 3.3 } },
          { searchObject: "Raft 6-person", sweepWidth: { 1: 0.4, 3: 1.3, 5: 1.8, 10: 2.9, 15: 3.4, 20: 3.8 } },
          { searchObject: "Raft 10-person", sweepWidth: { 1: 0.4, 3: 1.4, 5: 2.0, 10: 3.2, 15: 3.8, 20: 4.3 } },
          { searchObject: "Raft 15-person", sweepWidth: { 1: 0.4, 3: 1.6, 5: 2.1, 10: 3.6, 15: 4.3, 20: 4.9 } },
          { searchObject: "Raft 20-person", sweepWidth: { 1: 0.5, 3: 1.6, 5: 2.3, 10: 3.9, 15: 4.7, 20: 5.4 } },
          { searchObject: "Raft 25-person", sweepWidth: { 1: 0.5, 3: 1.7, 5: 2.4, 10: 4.1, 15: 5.0, 20: 5.7 } },
          { searchObject: "Power boat < 5 (15)", sweepWidth: { 1: 0.4, 3: 1.1, 5: 1.5, 10: 2.2, 15: 2.5, 20: 2.6 } },
          { searchObject: "Power boat 6 (20)", sweepWidth: { 1: 0.4, 3: 1.3, 5: 1.8, 10: 2.9, 15: 3.6, 20: 4.0 } },
          { searchObject: "Power boat 10 (33)", sweepWidth: { 1: 0.5, 3: 2.4, 5: 3.7, 10: 5.9, 15: 7.8, 20: 9.0 } },
          { searchObject: "Power boat 16 (53)", sweepWidth: { 1: 0.5, 3: 2.8, 5: 4.8, 10: 8.8, 15: 11.8, 20: 14.2 } },
          { searchObject: "Power boat 24 (78)", sweepWidth: { 1: 0.5, 3: 3.2, 5: 5.7, 10: 11.1, 15: 15.4, 20: 18.5 } },
          { searchObject: "Sail boat 5 (15)", sweepWidth: { 1: 0.4, 3: 1.2, 5: 1.7, 10: 2.6, 15: 3.1, 20: 3.5 } },
          { searchObject: "Sail boat 8 (26)", sweepWidth: { 1: 0.5, 3: 2.3, 5: 3.7, 10: 6.1, 15: 7.9, 20: 9.2 } },
          { searchObject: "Sail boat 12 (39)", sweepWidth: { 1: 0.5, 3: 2.9, 5: 5.1, 10: 9.3, 15: 12.7, 20: 15.4 } },
          { searchObject: "Sail boat 15 (49)", sweepWidth: { 1: 0.5, 3: 3.0, 5: 5.4, 10: 10.5, 15: 14.5, 20: 17.8 } },
          { searchObject: "Sail boat 21 (69)", sweepWidth: { 1: 0.5, 3: 3.2, 5: 5.9, 10: 11.8, 15: 16.9, 20: 21.4 } },
          { searchObject: "Sail boat 25 (83)", sweepWidth: { 1: 0.5, 3: 3.2, 5: 6.1, 10: 12.7, 15: 18.4, 20: 23.7 } },
          { searchObject: "Ship 27-46 (90-150)", sweepWidth: { 1: 0.5, 3: 3.4, 5: 6.3, 10: 13.6, 15: 20.7, 20: 27.2 } },
          { searchObject: "Ship 46-91 (150-300)", sweepWidth: { 1: 0.5, 3: 3.4, 5: 6.3, 10: 14.1, 15: 22.0, 20: 30.0 } },
          { searchObject: "Ship > 91 (300)", sweepWidth: { 1: 0.5, 3: 3.4, 5: 6.3, 10: 14.3, 15: 22.2, 20: 29.8 } }
        ]
      }
    },

    tableN6_FixedWingAircraft: {
      title: "Table N-6: Sweep widths for fixed-wing aircraft",
      unit: "NM",
      visibility_NM: [1, 3, 5, 10, 15, 20],
      data: {
        "150m (500ft)": [
          { searchObject: "Person in water", sweepWidth: { 1: 0.0, 3: 0.1, 5: 0.1, 10: 0.1, 15: 0.1, 20: 0.1 } },
          { searchObject: "Raft 1-person", sweepWidth: { 1: 0.4, 3: 0.7, 5: 0.9, 10: 1.2, 15: 1.2, 20: 1.2 } },
          { searchObject: "Raft 4-person", sweepWidth: { 1: 0.4, 3: 1.0, 5: 1.4, 10: 2.1, 15: 2.4, 20: 2.6 } },
          { searchObject: "Raft 6-person", sweepWidth: { 1: 0.4, 3: 1.1, 5: 1.5, 10: 2.3, 15: 2.7, 20: 2.9 } },
          { searchObject: "Raft 10-person", sweepWidth: { 1: 0.4, 3: 1.2, 5: 1.7, 10: 2.6, 15: 3.0, 20: 3.4 } },
          { searchObject: "Raft 15-person", sweepWidth: { 1: 0.4, 3: 1.3, 5: 1.8, 10: 2.9, 15: 3.3, 20: 3.8 } },
          { searchObject: "Raft 20-person", sweepWidth: { 1: 0.5, 3: 1.3, 5: 1.9, 10: 3.1, 15: 3.6, 20: 4.1 } },
          { searchObject: "Raft 25-person", sweepWidth: { 1: 0.5, 3: 1.4, 5: 1.9, 10: 3.2, 15: 3.8, 20: 4.4 } },
          { searchObject: "Power boat < 5 (15)", sweepWidth: { 1: 0.4, 3: 0.9, 5: 1.2, 10: 1.7, 15: 2.0, 20: 2.1 } },
          { searchObject: "Power boat 6 (20)", sweepWidth: { 1: 0.4, 3: 1.0, 5: 1.4, 10: 2.4, 15: 3.0, 20: 3.3 } },
          { searchObject: "Power boat 10 (33)", sweepWidth: { 1: 0.6, 3: 1.9, 5: 2.9, 10: 4.7, 15: 5.9, 20: 6.7 } },
          { searchObject: "Power boat 16 (53)", sweepWidth: { 1: 0.6, 3: 2.3, 5: 3.8, 10: 6.9, 15: 9.3, 20: 11.0 } },
          { searchObject: "Power boat 24 (78)", sweepWidth: { 1: 0.6, 3: 2.5, 5: 4.4, 10: 8.5, 15: 11.8, 20: 14.2 } },
          { searchObject: "Sail boat 5 (15)", sweepWidth: { 1: 0.5, 3: 1.0, 5: 1.3, 10: 1.9, 15: 2.3, 20: 2.6 } },
          { searchObject: "Sail boat 8 (26)", sweepWidth: { 1: 0.6, 3: 1.8, 5: 2.8, 10: 4.6, 15: 5.8, 20: 6.6 } },
          { searchObject: "Sail boat 12 (39)", sweepWidth: { 1: 0.6, 3: 2.2, 5: 3.9, 10: 7.1, 15: 9.6, 20: 11.5 } },
          { searchObject: "Sail boat 15 (49)", sweepWidth: { 1: 0.6, 3: 2.3, 5: 4.1, 10: 8.0, 15: 10.9, 20: 13.2 } },
          { searchObject: "Sail boat 21 (69)", sweepWidth: { 1: 0.6, 3: 2.4, 5: 4.4, 10: 9.0, 15: 12.6, 20: 15.7 } },
          { searchObject: "Sail boat 25 (83)", sweepWidth: { 1: 0.6, 3: 2.5, 5: 4.6, 10: 9.5, 15: 13.6, 20: 17.1 } },
          { searchObject: "Ship 27-46 (90-150)", sweepWidth: { 1: 0.6, 3: 2.5, 5: 4.7, 10: 10.2, 15: 15.3, 20: 19.8 } },
          { searchObject: "Ship 46-91 (150-300)", sweepWidth: { 1: 0.6, 3: 2.6, 5: 4.8, 10: 10.6, 15: 16.6, 20: 22.5 } },
          { searchObject: "Ship > 91 (300)", sweepWidth: { 1: 0.6, 3: 2.6, 5: 4.8, 10: 10.7, 15: 16.6, 20: 22.5 } }
        ],
        "300m (1000ft)": [
          { searchObject: "Person in water", sweepWidth: { 1: 0.0, 3: 0.0, 5: 0.0, 10: 0.0, 15: 0.0, 20: 0.0 } },
          { searchObject: "Raft 1-person", sweepWidth: { 1: 0.3, 3: 0.6, 5: 0.8, 10: 1.1, 15: 1.1, 20: 1.1 } },
          { searchObject: "Raft 4-person", sweepWidth: { 1: 0.3, 3: 1.0, 5: 1.4, 10: 2.0, 15: 2.3, 20: 2.6 } },
          { searchObject: "Raft 6-person", sweepWidth: { 1: 0.4, 3: 1.1, 5: 1.6, 10: 2.4, 15: 2.8, 20: 3.1 } },
          { searchObject: "Raft 10-person", sweepWidth: { 1: 0.4, 3: 1.2, 5: 1.7, 10: 2.6, 15: 3.1, 20: 3.5 } },
          { searchObject: "Raft 15-person", sweepWidth: { 1: 0.4, 3: 1.3, 5: 1.8, 10: 2.9, 15: 3.4, 20: 3.9 } },
          { searchObject: "Raft 20-person", sweepWidth: { 1: 0.4, 3: 1.3, 5: 1.9, 10: 3.1, 15: 3.7, 20: 4.3 } },
          { searchObject: "Raft 25-person", sweepWidth: { 1: 0.4, 3: 1.4, 5: 2.0, 10: 3.3, 15: 3.9, 20: 4.5 } },
          { searchObject: "Power boat < 5 (15)", sweepWidth: { 1: 0.4, 3: 0.9, 5: 1.2, 10: 1.7, 15: 1.9, 20: 2.0 } },
          { searchObject: "Power boat 6 (20)", sweepWidth: { 1: 0.4, 3: 1.0, 5: 1.5, 10: 2.2, 15: 2.8, 20: 3.0 } },
          { searchObject: "Power boat 10 (33)", sweepWidth: { 1: 0.5, 3: 1.9, 5: 2.9, 10: 4.5, 15: 5.9, 20: 6.8 } },
          { searchObject: "Power boat 16 (53)", sweepWidth: { 1: 0.5, 3: 2.3, 5: 3.9, 10: 6.9, 15: 9.3, 20: 11.1 } },
          { searchObject: "Power boat 24 (78)", sweepWidth: { 1: 0.5, 3: 2.6, 5: 4.6, 10: 8.8, 15: 12.2, 20: 14.6 } },
          { searchObject: "Sail boat 5 (15)", sweepWidth: { 1: 0.5, 3: 1.0, 5: 1.3, 10: 1.9, 15: 2.3, 20: 2.5 } },
          { searchObject: "Sail boat 8 (26)", sweepWidth: { 1: 0.5, 3: 1.9, 5: 2.9, 10: 4.7, 15: 6.1, 20: 7.0 } },
          { searchObject: "Sail boat 12 (39)", sweepWidth: { 1: 0.5, 3: 2.3, 5: 4.0, 10: 7.1, 15: 9.6, 20: 11.6 } },
          { searchObject: "Sail boat 15 (49)", sweepWidth: { 1: 0.6, 3: 2.4, 5: 4.2, 10: 8.0, 15: 11.0, 20: 13.4 } },
          { searchObject: "Sail boat 21 (69)", sweepWidth: { 1: 0.6, 3: 2.4, 5: 4.5, 10: 9.0, 15: 12.8, 20: 16.1 } },
          { searchObject: "Sail boat 25 (83)", sweepWidth: { 1: 0.6, 3: 2.5, 5: 4.7, 10: 9.6, 15: 13.8, 20: 17.6 } },
          { searchObject: "Ship 27-46 (90-150)", sweepWidth: { 1: 0.6, 3: 2.6, 5: 4.8, 10: 10.3, 15: 15.6, 20: 20.4 } },
          { searchObject: "Ship 46-91 (150-300)", sweepWidth: { 1: 0.6, 3: 2.6, 5: 4.8, 10: 10.7, 15: 16.7, 20: 22.6 } },
          { searchObject: "Ship > 91 (300)", sweepWidth: { 1: 0.6, 3: 2.6, 5: 4.8, 10: 10.7, 15: 16.7, 20: 22.6 } }
        ],
        "600m (2000ft)": [
          { searchObject: "Person in water", sweepWidth: { 1: 0.0, 3: 0.0, 5: 0.0, 10: 0.0, 15: 0.0, 20: 0.0 } },
          { searchObject: "Raft 1-person", sweepWidth: { 1: 0.2, 3: 0.5, 5: 0.7, 10: 1.0, 15: 1.0, 20: 1.0 } },
          { searchObject: "Raft 4-person", sweepWidth: { 1: 0.3, 3: 0.9, 5: 1.2, 10: 1.9, 15: 2.2, 20: 2.4 } },
          { searchObject: "Raft 6-person", sweepWidth: { 1: 0.3, 3: 1.0, 5: 1.3, 10: 2.1, 15: 2.5, 20: 2.8 } },
          { searchObject: "Raft 10-person", sweepWidth: { 1: 0.3, 3: 1.1, 5: 1.5, 10: 2.4, 15: 2.8, 20: 3.2 } },
          { searchObject: "Raft 15-person", sweepWidth: { 1: 0.3, 3: 1.2, 5: 1.6, 10: 2.7, 15: 3.2, 20: 3.6 } },
          { searchObject: "Raft 20-person", sweepWidth: { 1: 0.3, 3: 1.2, 5: 1.7, 10: 2.9, 15: 3.5, 20: 4.0 } },
          { searchObject: "Raft 25-person", sweepWidth: { 1: 0.3, 3: 1.3, 5: 1.7, 10: 3.0, 15: 3.7, 20: 4.2 } },
          { searchObject: "Power boat < 5 (15)", sweepWidth: { 1: 0.3, 3: 0.8, 5: 1.1, 10: 1.6, 15: 1.8, 20: 1.9 } },
          { searchObject: "Power boat 6 (20)", sweepWidth: { 1: 0.3, 3: 1.0, 5: 1.3, 10: 2.2, 15: 2.7, 20: 3.0 } },
          { searchObject: "Power boat 10 (33)", sweepWidth: { 1: 0.4, 3: 1.7, 5: 2.7, 10: 4.4, 15: 5.8, 20: 6.7 } },
          { searchObject: "Power boat 16 (53)", sweepWidth: { 1: 0.4, 3: 2.1, 5: 3.6, 10: 6.6, 15: 8.8, 20: 10.7 } },
          { searchObject: "Power boat 24 (78)", sweepWidth: { 1: 0.4, 3: 2.4, 5: 4.3, 10: 8.3, 15: 11.5, 20: 13.9 } },
          { searchObject: "Sail boat 5 (15)", sweepWidth: { 1: 0.4, 3: 0.9, 5: 1.2, 10: 1.9, 15: 2.3, 20: 2.6 } },
          { searchObject: "Sail boat 8 (26)", sweepWidth: { 1: 0.4, 3: 1.7, 5: 2.7, 10: 4.5, 15: 5.9, 20: 6.9 } },
          { searchObject: "Sail boat 12 (39)", sweepWidth: { 1: 0.4, 3: 2.1, 5: 3.8, 10: 7.0, 15: 9.5, 20: 11.5 } },
          { searchObject: "Sail boat 15 (49)", sweepWidth: { 1: 0.4, 3: 2.2, 5: 4.0, 10: 7.8, 15: 10.8, 20: 13.3 } },
          { searchObject: "Sail boat 21 (69)", sweepWidth: { 1: 0.4, 3: 2.4, 5: 4.3, 10: 8.8, 15: 12.7, 20: 16.0 } },
          { searchObject: "Sail boat 25 (83)", sweepWidth: { 1: 0.4, 3: 2.4, 5: 4.5, 10: 9.4, 15: 13.7, 20: 17.6 } },
          { searchObject: "Ship 27-46 (90-150)", sweepWidth: { 1: 0.4, 3: 2.5, 5: 4.7, 10: 10.1, 15: 15.5, 20: 20.3 } },
          { searchObject: "Ship 46-91 (150-300)", sweepWidth: { 1: 0.4, 3: 2.6, 5: 4.8, 10: 10.6, 15: 16.6, 20: 22.5 } },
          { searchObject: "Ship > 91 (300)", sweepWidth: { 1: 0.4, 3: 2.6, 5: 4.8, 10: 10.7, 15: 16.6, 20: 22.6 } }
        ]
      }
    },

    tableN7_WeatherCorrection: {
      title: "Table N-7: Weather correction factors for all types of search facilities",
      conditions: [
        {
          weather: "Winds 0-28 km/h (0-15 kts) or seas 0-1 m (0-3 ft)",
          personInWaterRaftOrBoatUnder10m: 1.0,
          otherSearchObjects: 1.0
        },
        {
          weather: "Winds 28-46 km/h (15-25 kts) or seas 1-1.5 m (3-5 ft)",
          personInWaterRaftOrBoatUnder10m: 0.5,
          otherSearchObjects: 0.9
        },
        {
          weather: "Winds > 46 km/h (> 25 kts) or seas > 1.5 m (> 5 ft)",
          personInWaterRaftOrBoatUnder10m: 0.25,
          otherSearchObjects: 0.9
        }
      ]
    },

    tableN8_SpeedCorrection: {
      title: "Table N-8: Speed (velocity) correction factors for helicopter and fixed-wing aircraft",
      speeds_kts: {
        fixedWing: [150, 180, 210],
        helicopter: [60, 90, 120, 140]
      },
      data: [
        {
          searchObject: "Person in Water",
          fixedWing: { 150: 1.2, 180: 1.0, 210: 0.9 },
          helicopter: { 60: 1.5, 90: 1.0, 120: 0.8, 140: 0.7 }
        },
        {
          searchObject: "Raft 1-4 person",
          fixedWing: { 150: 1.1, 180: 1.0, 210: 0.9 },
          helicopter: { 60: 1.3, 90: 1.0, 120: 0.9, 140: 0.8 }
        },
        {
          searchObject: "Raft 6-25 person",
          fixedWing: { 150: 1.1, 180: 1.0, 210: 0.9 },
          helicopter: { 60: 1.2, 90: 1.0, 120: 0.9, 140: 0.8 }
        },
        {
          searchObject: "Power boat < 8 m (< 25 ft)",
          fixedWing: { 150: 1.1, 180: 1.0, 210: 0.9 },
          helicopter: { 60: 1.2, 90: 1.0, 120: 0.9, 140: 0.8 }
        },
        {
          searchObject: "Power boat 10 m (33 ft)",
          fixedWing: { 150: 1.1, 180: 1.0, 210: 0.9 },
          helicopter: { 60: 1.1, 90: 1.0, 120: 0.9, 140: 0.9 }
        },
        {
          searchObject: "Power boat 16 m (53 ft)",
          fixedWing: { 150: 1.1, 180: 1.0, 210: 1.0 },
          helicopter: { 60: 1.1, 90: 1.0, 120: 0.9, 140: 0.9 }
        },
        {
          searchObject: "Power boat 24 m (78 ft)",
          fixedWing: { 150: 1.1, 180: 1.0, 210: 1.0 },
          helicopter: { 60: 1.1, 90: 1.0, 120: 1.0, 140: 0.9 }
        },
        {
          searchObject: "Sail boat < 8 m (< 25 ft)",
          fixedWing: { 150: 1.1, 180: 1.0, 210: 0.9 },
          helicopter: { 60: 1.2, 90: 1.0, 120: 0.9, 140: 0.9 }
        },
        {
          searchObject: "Sail boat 12 m (39 ft)",
          fixedWing: { 150: 1.1, 180: 1.0, 210: 1.0 },
          helicopter: { 60: 1.1, 90: 1.0, 120: 0.9, 140: 0.9 }
        },
        {
          searchObject: "Sail boat 25 m (83 ft)",
          fixedWing: { 150: 1.1, 180: 1.0, 210: 1.0 },
          helicopter: { 60: 1.1, 90: 1.0, 120: 1.0, 140: 0.9 }
        },
        {
          searchObject: "Ship > 27 m (> 90 ft)",
          fixedWing: { 150: 1.0, 180: 1.0, 210: 1.0 },
          helicopter: { 60: 1.1, 90: 1.0, 120: 1.0, 140: 0.9 }
        }
      ]
    }
  };

  // Dedahkan iamsarTables secara global
  window.iamsarTables = IAMSAR_TABLES;

  // --- State Aplikasi ---
  const state = {
    vectors: [],      // Senarai vektor (Tab 1): [{ id, legIndex, bearing, speed, time, distance, dx, dy, x0, y0, x1, y1, color }]
    points: [{ x: 0, y: 0 }], // Senarai titik grid matematik: p0=(0,0), p1, p2...
    isCalculated: false,
    resultant: null,

    // State untuk Tab 2: ASW
    aswVectors: [],   // [{ id, index, bearing, speed, time, distance, dx, dy }]
    isAswCalculated: false,
    aswResultant: null,

    // State untuk Tab 2: Wind Current (WC)
    wcVector: null,
    isWcCalculated: false,

    // State untuk Tab 2: Total Water Current (TWC)
    twcMode: 'computed', // 'observed' atau 'computed' (Lalai: Computed TWC)
    twcObserved: {
      source: 'DMB (Datum Marker Buoy)',
      bearing: 0,
      speed: 0,
      time: 1.0,
      distance: 0,
      dx: 0,
      dy: 0,
      quality: 'good',
      twcE: 0.1,
      isCalculated: false
    },
    scVectors: [],    // [{ id, index, type, bearing, speed, time, distance, dx, dy, errorE }]
    isScCalculated: false,
    scResultant: null,

    // State untuk Tab 2: Leeway (LW)
    leewayVector: null,
    isLeewayCalculated: false,

    // State untuk Tab 2: IAMSAR Final Datum
    finalDatum: null,

    // State untuk Tab 3: Planning (IAMSAR Vol 2 Search Planning)
    planning: {
      activeDrawer: 'zta', // 'zta' atau 'alloc'
      datumType: 'leeway', // 'single', 'leeway', 'line'
      zta: {
        totalZta: 0.0,
        sr: 0.0
      },
      alloc: {
        za: 0.0,
        e: 1.0,
        l: 10.0,
        dd: 0.0,
        fz: 1.0,
        zr: 0.0,
        zrc: 0.0,
        fs: 1.1,
        ro: 1.1,
        ao: 4.84,
        co: 1.0,
        at: 0.0,
        r: 0.0
      }
    },

    displayMode: 'grid', // 'grid' atau 'map'
    activeTab: 'vector',  // 'vector', 'datum', 'planning'
    theme: localStorage.getItem('nautical_theme') || 'dark',

    // Koordinat Geografi Mula (Origin GPS)
    originGeo: {
      lat: DEFAULT_ORIGIN_GEO.lat,
      lon: DEFAULT_ORIGIN_GEO.lon
    },
    isPickingLocation: false,
    
    // Viewport Canvas Grid (Pan & Zoom)
    view: {
      zoom: 1,
      panX: 0,
      panY: 0,
      basePixelsPerNM: 35,
      isDragging: false,
      lastMouseX: 0,
      lastMouseY: 0,
      touchStartDist: 0
    },

    // State untuk Simulasi Hanyutan Monte Carlo
    monteCarlo: {
      isActive: false,
      isVisible: true,
      isPlaying: false,
      currentTime: 0.0,
      maxTime: 12.0,
      playbackSpeed: 1.0,
      particleCount: 1000,
      particles: [],
      animationFrameId: null,
      lastTimestamp: 0
    }
  };

  let leafletMap = null;
  let vectorLayerGroup = null;
  let planningLayerGroup = null;

  // --- Rujukan Elemen DOM ---
  const el = {
    // Navigation Tabs (Sebelah Kiri Atas)
    tabBtns: document.querySelectorAll('.sidebar-tab-btn'),
    tabContents: document.querySelectorAll('.tab-content-panel'),

    form: document.getElementById('vector-form'),
    bearingInput: document.getElementById('bearing-input'),
    speedInput: document.getElementById('speed-input'),
    timeInput: document.getElementById('time-input'),
    calcDistPreview: document.getElementById('calc-dist-preview'),

    btnAdd: document.getElementById('btn-add-vector'),
    btnCalc: document.getElementById('btn-calculate'),
    btnReset: document.getElementById('btn-reset'),
    btnSample: document.getElementById('btn-sample'),
    btnExportImg: document.getElementById('btn-export-img'),
    btnFullscreen: document.getElementById('btn-fullscreen'),
    btnOpenMathPopup: document.getElementById('btn-open-math-popup'),
    btnThemeToggle: document.getElementById('btn-theme-toggle'),
    themeToggleText: document.getElementById('theme-toggle-text'),
    
    // Indikator Mod Paparan Kanan
    viewModeIcon: document.getElementById('view-mode-icon'),
    viewModeTitle: document.getElementById('view-mode-title'),
    gridControls: document.getElementById('grid-controls'),
    compassBadge: document.getElementById('compass-badge'),

    // Tab 2: Determining Datum Elements
    distressDateTimeInput: document.getElementById('distress-datetime'),
    originLatInput: document.getElementById('origin-lat'),
    originLonInput: document.getElementById('origin-lon'),
    btnPickLocation: document.getElementById('btn-pick-location'),
    
    // Average Surface Wind (ASW)
    aswBearingInput: document.getElementById('asw-bearing-input'),
    aswSpeedInput: document.getElementById('asw-speed-input'),
    aswTimeInput: document.getElementById('asw-time-input'),
    aswDistPreview: document.getElementById('asw-dist-preview'),
    btnAddAsw: document.getElementById('btn-add-asw'),
    btnCalcAsw: document.getElementById('btn-calc-asw'),
    btnResetAsw: document.getElementById('btn-reset-asw'),
    aswStatusBadge: document.getElementById('asw-status-badge'),
    resAswBearing: document.getElementById('res-asw-bearing'),
    resAswBearingCardinal: document.getElementById('res-asw-bearing-cardinal'),
    resAswSpeed: document.getElementById('res-asw-speed'),
    resAswSpeedKmh: document.getElementById('res-asw-speed-kmh'),
    resAswTotalDist: document.getElementById('res-asw-total-dist'),
    resAswTotalTime: document.getElementById('res-asw-total-time'),
    resAswCount: document.getElementById('res-asw-count'),
    aswTbody: document.getElementById('asw-tbody'),
    aswCounter: document.getElementById('asw-counter'),

    // ASW Probable Error (Section B)
    aswErrorTypeSelect: document.getElementById('asw-error-type-select'),
    aswEInput: document.getElementById('asw-e-input'),
    aswdvEInput: document.getElementById('aswdv-e-input'),
    resAsweVal: document.getElementById('res-aswe-val'),
    resAswdveVal: document.getElementById('res-aswdve-val'),

    // Wind Current (WC)
    wcBearingInput: document.getElementById('wc-bearing-input'),
    wcSpeedInput: document.getElementById('wc-speed-input'),
    wcTimeInput: document.getElementById('wc-time-input'),
    wcDistPreview: document.getElementById('wc-dist-preview'),
    btnAutoWcFromAsw: document.getElementById('btn-auto-wc-from-asw'),
    btnCalcWc: document.getElementById('btn-calc-wc'),
    btnResetWc: document.getElementById('btn-reset-wc'),
    wcStatusBadge: document.getElementById('wc-status-badge'),
    resWcBearing: document.getElementById('res-wc-bearing'),
    resWcBearingCardinal: document.getElementById('res-wc-bearing-cardinal'),
    resWcSpeed: document.getElementById('res-wc-speed'),
    resWcSpeedKmh: document.getElementById('res-wc-speed-kmh'),
    resWcTotalDist: document.getElementById('res-wc-total-dist'),
    resWcTotalTime: document.getElementById('res-wc-total-time'),
    resWcMethod: document.getElementById('res-wc-method'),
    wcEInput: document.getElementById('wc-e-input'),
    resWceVal: document.getElementById('res-wce-val'),
    summaryWcVal: document.getElementById('summary-wc-val'),
    summaryWceVal: document.getElementById('summary-wce-val'),

    // Total Water Current (TWC) Mode & Containers
    btnTwcModeObserved: document.getElementById('btn-twc-mode-observed'),
    btnTwcModeComputed: document.getElementById('btn-twc-mode-computed'),
    radioTwcObserved: document.getElementById('radio-twc-observed'),
    radioTwcComputed: document.getElementById('radio-twc-computed'),
    twcObservedContainer: document.getElementById('twc-observed-container'),
    twcComputedContainer: document.getElementById('twc-computed-container'),

    // 1. Observed TWC Elements
    twcObsSourceSelect: document.getElementById('twc-obs-source-select'),
    twcObsSourceInput: document.getElementById('twc-obs-source-input'),
    twcObsBearingInput: document.getElementById('twc-obs-bearing-input'),
    twcObsSpeedInput: document.getElementById('twc-obs-speed-input'),
    twcObsTimeInput: document.getElementById('twc-obs-time-input'),
    twcObsDistPreview: document.getElementById('twc-obs-dist-preview'),
    twcObsQualitySelect: document.getElementById('twc-obs-quality-select'),
    twcObsEInput: document.getElementById('twc-obs-e-input'),
    btnCalcObsTwc: document.getElementById('btn-calc-obs-twc'),
    btnResetObsTwc: document.getElementById('btn-reset-obs-twc'),
    twcObsStatusBadge: document.getElementById('twc-obs-status-badge'),
    resTwcObsBearing: document.getElementById('res-twc-obs-bearing'),
    resTwcObsBearingCardinal: document.getElementById('res-twc-obs-bearing-cardinal'),
    resTwcObsSpeed: document.getElementById('res-twc-obs-speed'),
    resTwcObsSpeedKmh: document.getElementById('res-twc-obs-speed-kmh'),
    resTwcObsDist: document.getElementById('res-twc-obs-dist'),
    resTwcObsTimeSub: document.getElementById('res-twc-obs-time-sub'),
    resTwcObsE: document.getElementById('res-twc-obs-e'),
    resTwcObsSourceLabel: document.getElementById('res-twc-obs-source-label'),

    // 2. Computed TWC Elements
    scTypeSelect: document.getElementById('sc-type-select'),
    scBearingInput: document.getElementById('sc-bearing-input'),
    scSpeedInput: document.getElementById('sc-speed-input'),
    scTimeInput: document.getElementById('sc-time-input'),
    scVectorEInput: document.getElementById('sc-vector-e-input'),
    scDistPreview: document.getElementById('sc-dist-preview'),
    btnAddSc: document.getElementById('btn-add-sc'),
    btnCalcSc: document.getElementById('btn-calc-sc'),
    btnResetSc: document.getElementById('btn-reset-sc'),
    scStatusBadge: document.getElementById('sc-status-badge'),
    resScBearing: document.getElementById('res-sc-bearing'),
    resScBearingCardinal: document.getElementById('res-sc-bearing-cardinal'),
    resScSpeed: document.getElementById('res-sc-speed'),
    resScSpeedKmh: document.getElementById('res-sc-speed-kmh'),
    resScTotalDist: document.getElementById('res-sc-total-dist'),
    resScTotalTime: document.getElementById('res-sc-total-time'),
    resScCount: document.getElementById('res-sc-count'),
    resTwceVal: document.getElementById('res-twce-val'),
    resTwceFormula: document.getElementById('res-twce-formula'),
    scTbody: document.getElementById('sc-tbody'),
    scCounter: document.getElementById('sc-counter'),
    summaryTwceVal: document.getElementById('summary-twce-val'),

    // Leeway (LW) - IAMSAR Figure N-2 & Figure N-3
    leewayTargetType: document.getElementById('leeway-target-type'),
    leewayCombobox: document.getElementById('leeway-combobox'),
    leewayComboboxControl: document.getElementById('leeway-combobox-control'),
    leewaySearchInput: document.getElementById('leeway-search-input'),
    leewaySearchClear: document.getElementById('leeway-search-clear'),
    leewayComboboxArrow: document.getElementById('leeway-combobox-arrow'),
    leewayComboboxMenu: document.getElementById('leeway-combobox-menu'),
    lwAswSpeedDisplay: document.getElementById('lw-asw-speed-display'),
    leewayDivergence: document.getElementById('leeway-divergence'),
    lwTimeInput: document.getElementById('lw-time-input'),
    lwSpeedPreview: document.getElementById('lw-speed-preview'),
    leewayCustomRow: document.getElementById('leeway-custom-row'),
    leewayCustomPct: document.getElementById('leeway-custom-pct'),
    lwFormulaBannerText: document.getElementById('lw-formula-banner-text'),
    lwDistPreview: document.getElementById('lw-dist-preview'),
    btnCalcLw: document.getElementById('btn-calc-lw'),
    btnResetLw: document.getElementById('btn-reset-lw'),
    lwStatusBadge: document.getElementById('lw-status-badge'),
    resLwDownwind: document.getElementById('res-lw-downwind'),
    resLwDownwindCardinal: document.getElementById('res-lw-downwind-cardinal'),
    resLwSpeed: document.getElementById('res-lw-speed'),
    resLwSpeedKmh: document.getElementById('res-lw-speed-kmh'),
    resLwDivergenceTracks: document.getElementById('res-lw-divergence-tracks'),
    resLwDivergenceSub: document.getElementById('res-lw-divergence-sub'),
    resLwDist: document.getElementById('res-lw-dist'),
    resLwTimeSub: document.getElementById('res-lw-time-sub'),
    lwEInput: document.getElementById('lw-e-input'),
    resLweVal: document.getElementById('res-lwe-val'),
    resLweTargetLabel: document.getElementById('res-lwe-target-label'),

    // Final Datum & Divergence Datum (IAMSAR Vol 2)
    btnCalcDatum: document.getElementById('btn-calc-datum'),
    btnCalcDatumPanel: document.getElementById('btn-calc-datum-panel'),
    btnViewDatumMap: document.getElementById('btn-view-datum-map'),
    resDatumLat: document.getElementById('res-datum-lat'),
    resDatumLon: document.getElementById('res-datum-lon'),
    resDatumDrift: document.getElementById('res-datum-drift'),
    resDatumTrack: document.getElementById('res-datum-track'),
    resDatumRadius: document.getElementById('res-datum-radius'),
    resDatumLatL: document.getElementById('res-datum-lat-l'),
    resDatumLonL: document.getElementById('res-datum-lon-l'),
    resDatumDriftL: document.getElementById('res-datum-drift-l'),
    resDatumTrackL: document.getElementById('res-datum-track-l'),
    badgeDatumLTrack: document.getElementById('badge-datum-l-track'),
    resDatumLatR: document.getElementById('res-datum-lat-r'),
    resDatumLonR: document.getElementById('res-datum-lon-r'),
    resDatumDriftR: document.getElementById('res-datum-drift-r'),
    resDatumTrackR: document.getElementById('res-datum-track-r'),
    badgeDatumRTrack: document.getElementById('badge-datum-r-track'),
    resDatumDD: document.getElementById('res-datum-dd'),
    resDatumDDKm: document.getElementById('res-datum-dd-km'),
    resDatumDve: document.getElementById('res-datum-dve'),
    resDatumDveFormula: document.getElementById('res-datum-dve-formula'),
    resDatumDivAngle: document.getElementById('res-datum-div-angle'),
    resDatumDe: document.getElementById('res-datum-de'),
    resDatumDeSub: document.getElementById('res-datum-de-sub'),
    resDatumDdDriftL: document.getElementById('res-datum-dd-drift-l'),
    resDatumDdTrackL: document.getElementById('res-datum-dd-track-l'),
    resDatumDdDriftR: document.getElementById('res-datum-dd-drift-r'),
    resDatumDdTrackR: document.getElementById('res-datum-dd-track-r'),
    resDatumCenterCoords: document.getElementById('res-datum-center-coords'),
    resDatumDriftCenter: document.getElementById('res-datum-drift-center'),
    datumCoordsTbody: document.getElementById('datum-coords-tbody'),

    // Tab 2 Drawer & Cockpit Summary Elements
    tab2Drawer: document.getElementById('tab2-drawer'),
    drawerHeading: document.getElementById('drawer-heading'),
    btnCloseDrawer: document.getElementById('btn-close-drawer'),
    datumDateTimeInput: document.getElementById('datum-datetime'),
    datumIntervalInput: document.getElementById('datum-interval-hours'),
    summaryAswVal: document.getElementById('summary-asw-val'),
    summaryAswdveVal: document.getElementById('summary-aswdve-val'),
    summaryTwcVal: document.getElementById('summary-twc-val'),
    summaryLwVal: document.getElementById('summary-lw-val'),
    summaryDriftVal: document.getElementById('summary-drift-val'),
    summaryDatumVal: document.getElementById('summary-datum-val'),
    summaryErrorVal: document.getElementById('summary-error-val'),

    // Result metrics for Panels 4 (Drift), 5 (Datum), 6 (Error)
    driftTableTbody: document.getElementById('drift-table-tbody'),
    driftStatusBadge: document.getElementById('drift-status-badge'),
    resDriftDist: document.getElementById('res-drift-dist'),
    resDriftDistKm: document.getElementById('res-drift-dist-km'),
    resDriftBearing: document.getElementById('res-drift-bearing'),
    resDriftCardinal: document.getElementById('res-drift-cardinal'),
    resDriftSpeed: document.getElementById('res-drift-speed'),
    resDriftSpeedKmh: document.getElementById('res-drift-speed-kmh'),
    resDriftTime: document.getElementById('res-drift-time'),
    resDriftDivL: document.getElementById('res-drift-div-l'),
    resDriftDivR: document.getElementById('res-drift-div-r'),
    resDriftMathText: document.getElementById('res-drift-math-text'),
    btnCalcDrift: document.getElementById('btn-calc-drift'),
    btnViewDriftMap: document.getElementById('btn-view-drift-map'),
    datumStatusBadge: document.getElementById('datum-status-badge'),
    // Result metrics for Drawer 6 (Error & Radius - IAMSAR Vol 2 App K)
    errXFixInput: document.getElementById('err-x-fix'),
    errXDrRateInput: document.getElementById('err-x-dr-rate'),
    errXDrDistInput: document.getElementById('err-x-dr-dist'),
    resErrXDrNav: document.getElementById('res-err-x-dr-nav'),
    errXGlideInput: document.getElementById('err-x-glide'),
    resErrorX: document.getElementById('res-error-x'),

    errDeIntervalInput: document.getElementById('err-de-interval'),
    errDeDveInput: document.getElementById('err-de-dve'),
    resErrorDe: document.getElementById('res-error-de'),

    errYFixInput: document.getElementById('err-y-fix'),
    errYDrRateInput: document.getElementById('err-y-dr-rate'),
    errYDrDistInput: document.getElementById('err-y-dr-dist'),
    resErrYDrNav: document.getElementById('res-err-y-dr-nav'),
    resErrorY: document.getElementById('res-error-y'),

    resErrorSumsq: document.getElementById('res-error-sumsq'),
    resErrorE: document.getElementById('res-error-e'),
    resErrorSr: document.getElementById('res-error-sr'),
    resErrorSrSub: document.getElementById('res-error-sr-sub'),
    resErrorSrGuidance: document.getElementById('res-error-sr-guidance'),
    resErrorR: document.getElementById('res-error-r'),
    resErrorArea: document.getElementById('res-error-area'),
    resErrorZ: document.getElementById('res-error-z'),
    btnCalcError: document.getElementById('btn-calc-error'),
    btnResetError: document.getElementById('btn-reset-error'),

    // Tab 3 Planning Elements
    tab3Drawer: document.getElementById('tab3-drawer'),
    tab3DrawerHeading: document.getElementById('tab3-drawer-heading'),
    btnCloseTab3Drawer: document.getElementById('btn-close-tab3-drawer'),
    planCaseTitle: document.getElementById('plan-case-title'),
    planCaseNum: document.getElementById('plan-case-num'),
    planPlannerName: document.getElementById('plan-planner-name'),
    planSearchPlan: document.getElementById('plan-search-plan'),
    btnPlanSyncTab2: document.getElementById('btn-plan-sync-tab2'),
    summaryPlanZtaVal: document.getElementById('summary-plan-zta-val'),
    summaryPlanAllocVal: document.getElementById('summary-plan-alloc-val'),
    summaryPlanRoutingBanner: document.getElementById('summary-plan-routing-banner'),
    btnCalcPlanningAll: document.getElementById('btn-calc-planning-all'),
    btnResetPlanningAll: document.getElementById('btn-reset-planning-all'),

    // Drawer 1: Zta Worksheet
    planDatumNum: document.getElementById('plan-datum-num'),
    planCaseDate: document.getElementById('plan-case-date'),
    planCaseDatetime: document.getElementById('plan-case-datetime'),
    planSearchObject: document.getElementById('plan-search-object'),
    planDatumLatL: document.getElementById('plan-datum-lat-l'),
    planDatumLonL: document.getElementById('plan-datum-lon-l'),
    planDatumLatR: document.getElementById('plan-datum-lat-r'),
    planDatumLonR: document.getElementById('plan-datum-lon-r'),
    resPlanZtaTotal: document.getElementById('res-plan-zta-total'),
    planZtaSr: document.getElementById('plan-zta-sr'),
    resPlanZtaRouting: document.getElementById('res-plan-zta-routing'),
    btnCalcZta: document.getElementById('btn-calc-zta'),
    btnGotoAlloc: document.getElementById('btn-goto-alloc'),
    btnResetZta: document.getElementById('btn-reset-zta'),

    // Drawer 2: Allocation Worksheet
    btnDatumTypeSingle: document.getElementById('btn-datum-type-single'),
    btnDatumTypeLeeway: document.getElementById('btn-datum-type-leeway'),
    btnDatumTypeLine: document.getElementById('btn-datum-type-line'),
    resAllocSubTitle: document.getElementById('res-alloc-sub-title'),
    resAllocSubObject: document.getElementById('res-alloc-sub-object'),
    resAllocSubLatL: document.getElementById('res-alloc-sub-latl'),
    resAllocSubLatR: document.getElementById('res-alloc-sub-latr'),
    planAllocZa: document.getElementById('plan-alloc-za'),
    planAllocE: document.getElementById('plan-alloc-e'),
    planAllocL: document.getElementById('plan-alloc-l'),
    groupPlanAllocL: document.getElementById('group-plan-alloc-l'),
    planAllocDd: document.getElementById('plan-alloc-dd'),
    groupPlanAllocDd: document.getElementById('group-plan-alloc-dd'),
    resPlanAllocFz: document.getElementById('res-plan-alloc-fz'),
    hintPlanAllocFz: document.getElementById('hint-plan-alloc-fz'),
    resPlanAllocZr: document.getElementById('res-plan-alloc-zr'),
    planAllocZrc: document.getElementById('plan-alloc-zrc'),
    planAllocZrcHalved: document.getElementById('plan-alloc-zrc-halved'),
    planAllocFs: document.getElementById('plan-alloc-fs'),
    btnFsIdeal: document.getElementById('btn-fs-ideal'),
    btnFsNormal: document.getElementById('btn-fs-normal'),
    planAllocFsReason: document.getElementById('plan-alloc-fs-reason'),
    resPlanAllocRo: document.getElementById('res-plan-alloc-ro'),
    resPlanAllocAo: document.getElementById('res-plan-alloc-ao'),
    hintPlanAllocAo: document.getElementById('hint-plan-alloc-ao'),
    resPlanAllocCo: document.getElementById('res-plan-alloc-co'),
    resPlanAllocAt: document.getElementById('res-plan-alloc-at'),
    resPlanAllocR: document.getElementById('res-plan-alloc-r'),
    btnCalcAlloc: document.getElementById('btn-calc-alloc'),
    btnPlotAllocMap: document.getElementById('btn-plot-alloc-map'),
    btnResetAlloc: document.getElementById('btn-reset-alloc'),
    btnPlotSearchPattern: document.getElementById('btn-plot-search-pattern'),

    // IAMSAR Tables (N-1 hingga N-8) Elements
    btnOpenIamsarTables: document.getElementById('btn-open-iamsar-tables'),
    btnOpenTablesFromZta: document.getElementById('btn-open-tables-from-zta'),
    modalIamsarTables: document.getElementById('modal-iamsar-tables'),
    btnCloseIamsarModal: document.getElementById('btn-close-iamsar-modal'),
    iamsarModalTabs: document.getElementById('iamsar-modal-tabs'),
    iamsarModalBody: document.getElementById('iamsar-modal-body'),
    quickPresetXFix: document.getElementById('quick-preset-x-fix'),
    quickPresetXDr: document.getElementById('quick-preset-x-dr'),
    quickPresetYFix: document.getElementById('quick-preset-y-fix'),
    quickPresetYDr: document.getElementById('quick-preset-y-dr'),
    lookupSearchObject: document.getElementById('lookup-search-object'),
    lookupVisibility: document.getElementById('lookup-visibility'),
    lookupWeather: document.getElementById('lookup-weather'),
    btnApplyIamsarLookup: document.getElementById('btn-apply-iamsar-lookup'),

    // Results
    statusBadge: document.getElementById('status-badge'),
    resBearing: document.getElementById('res-bearing'),
    resBearingCardinal: document.getElementById('res-bearing-cardinal'),
    resDistance: document.getElementById('res-distance'),
    resDistanceKm: document.getElementById('res-distance-km'),
    resScale1cm: document.getElementById('res-scale-1cm'),
    resScale2cm: document.getElementById('res-scale-2cm'),
    resTotalTrack: document.getElementById('res-total-track'),
    resLegCount: document.getElementById('res-leg-count'),
    stepByStepText: document.getElementById('step-by-step-text'),
    mathAccordion: document.getElementById('math-accordion'),

    // Table
    vectorTbody: document.getElementById('vector-tbody'),
    vectorCounter: document.getElementById('vector-counter'),

    // Canvas & Leaflet
    canvasWrapper: document.getElementById('canvas-wrapper'),
    canvas: document.getElementById('navChart'),
    mapContainer: document.getElementById('leafletMap'),
    btnZoomIn: document.getElementById('btn-zoom-in'),
    btnZoomOut: document.getElementById('btn-zoom-out'),
    btnFitView: document.getElementById('btn-fit-view'),
    btnResetPan: document.getElementById('btn-reset-pan'),
    cursorCoords: document.getElementById('cursor-coords'),
    chartTipText: document.getElementById('chart-tip-text'),
    chartScaleIndicator: document.getElementById('chart-scale-indicator'),

    // Monte Carlo & Datum Action Elements
    btnRunSimulation: document.getElementById('btn-run-simulation'),
    btnResetDatumAll: document.getElementById('btn-reset-datum-all'),
    mcCanvasOverlay: document.getElementById('mcCanvasOverlay'),
    mcTimelineBar: document.getElementById('mc-timeline-bar'),
    mcParticlesCountBadge: document.getElementById('mc-particles-count-badge'),
    btnMcPlay: document.getElementById('btn-mc-play'),
    chkMcVisible: document.getElementById('chk-mc-visible'),
    mcPlayIcon: document.getElementById('mc-play-icon'),
    mcPauseIcon: document.getElementById('mc-pause-icon'),
    btnMcReset: document.getElementById('btn-mc-reset'),
    btnMcClose: document.getElementById('btn-mc-close'),
    mcTimeSlider: document.getElementById('mc-time-slider'),
    mcSliderCurrTime: document.getElementById('mc-slider-curr-time'),
    mcSliderMaxTime: document.getElementById('mc-slider-max-time'),
    mcSpeedBtns: document.querySelectorAll('.mc-speed-btn'),
    mcPocStat: document.getElementById('mc-poc-stat')
  };

  const ctx = el.canvas.getContext('2d');

  // =========================================================================
  // MATEMATIK & PENGIRAAN NAVIGASI NAUTIKA
  // =========================================================================

  function calculateComponents(bearingDeg, distanceNM) {
    const thetaDeg = 90 - bearingDeg;
    const thetaRad = (thetaDeg * Math.PI) / 180;
    const dx = distanceNM * Math.cos(thetaRad);
    const dy = distanceNM * Math.sin(thetaRad);
    return { dx, dy, thetaDeg };
  }

  function cartesianToNauticalBearing(dx, dy) {
    const atan2Deg = (Math.atan2(dy, dx) * 180) / Math.PI;
    let bearing = (90 - atan2Deg) % 360;
    if (bearing < 0) bearing += 360;
    return bearing;
  }

  function formatNauticalBearing(deg) {
    if (isNaN(deg) || deg === null || deg === undefined) return '---.--°';
    const norm = ((deg % 360) + 360) % 360;
    const rounded = Math.round(norm * 100) / 100;
    const intPart = Math.floor(rounded);
    const decVal = Math.round((rounded - intPart) * 100);
    const paddedInt = String(intPart).padStart(3, '0');
    const paddedDec = String(decVal).padStart(2, '0');
    return `${paddedInt}.${paddedDec}°`;
  }

  function getCardinalDirection(deg) {
    const directions = [
      'Utara (N)', 'Utara-Timur Laut (NNE)', 'Timur Laut (NE)', 'Timur-Timur Laut (ENE)',
      'Timur (E)', 'Timur-Tenggara (ESE)', 'Tenggara (SE)', 'Selatan-Tenggara (SSE)',
      'Selatan (S)', 'Selatan-Barat Daya (SSW)', 'Barat Daya (SW)', 'Barat-Barat Daya (WSW)',
      'Barat (W)', 'Barat-Barat Laut (WNW)', 'Barat Laut (NW)', 'Utara-Barat Laut (NNW)'
    ];
    const index = Math.round(((deg % 360) / 22.5)) % 16;
    return directions[index];
  }

  function calculateA4Scale(points) {
    const allAbs = points.flatMap(p => [Math.abs(p.x), Math.abs(p.y)]);
    const range = Math.max(...allAbs, 0.1);
    const scale_cm = Math.min(18 / range, 26 / range);
    let nm_per_cm = Math.round((1 / scale_cm) / 2) * 2;
    if (nm_per_cm < 1) nm_per_cm = 1;
    const nm_2cm = nm_per_cm * 2;
    return { nm_per_cm, nm_2cm, range };
  }

  function updateDistancePreview() {
    const speed = parseFloat(el.speedInput.value) || 0;
    const time = parseFloat(el.timeInput.value) || 0;
    const dist = speed * time;
    el.calcDistPreview.textContent = `${dist.toFixed(2)} NM`;
  }

  function updateAswDistancePreview() {
    if (!el.aswSpeedInput || !el.aswTimeInput || !el.aswDistPreview) return;
    const speed = parseFloat(el.aswSpeedInput.value) || 0;
    const time = parseFloat(el.aswTimeInput.value) || 0;
    const dist = speed * time;
    el.aswDistPreview.textContent = `${dist.toFixed(2)} NM`;
  }

  function updateWcDistancePreview() {
    if (!el.wcSpeedInput || !el.wcTimeInput || !el.wcDistPreview) return;
    const speed = parseFloat(el.wcSpeedInput.value) || 0;
    const time = parseFloat(el.wcTimeInput.value) || 0;
    const dist = speed * time;
    el.wcDistPreview.textContent = `${dist.toFixed(2)} NM`;
  }

  function updateScDistancePreview() {
    if (!el.scSpeedInput || !el.scTimeInput || !el.scDistPreview) return;
    const speed = parseFloat(el.scSpeedInput.value) || 0;
    const time = parseFloat(el.scTimeInput.value) || 0;
    const dist = speed * time;
    el.scDistPreview.textContent = `${dist.toFixed(2)} NM`;
  }

  // =========================================================================
  // GEODESI GPS NAUTIKA (GREAT CIRCLE DESTINATION)
  // =========================================================================

  function calculateDestinationPoint(startLat, startLon, bearingDeg, distanceNM) {
    const R = 3440.065; // Radius bumi dalam NM
    const dByR = distanceNM / R;
    const bRad = (bearingDeg * Math.PI) / 180;
    const latRad = (startLat * Math.PI) / 180;
    const lonRad = (startLon * Math.PI) / 180;

    const lat2Rad = Math.asin(
      Math.sin(latRad) * Math.cos(dByR) +
      Math.cos(latRad) * Math.sin(dByR) * Math.cos(bRad)
    );

    const lon2Rad = lonRad + Math.atan2(
      Math.sin(bRad) * Math.sin(dByR) * Math.cos(latRad),
      Math.cos(dByR) - Math.sin(latRad) * Math.sin(lat2Rad)
    );

    return {
      lat: (lat2Rad * 180) / Math.PI,
      lon: (lon2Rad * 180) / Math.PI
    };
  }

  function parseCoordinate(inputStr, isLatitude) {
    if (typeof inputStr !== 'string') return NaN;
    let str = inputStr.trim().toUpperCase();
    if (!str) return NaN;

    let sign = 1;
    if (isLatitude) {
      if (str.includes('S')) sign = -1;
      str = str.replace(/[NS]/g, '').trim();
    } else {
      if (str.includes('W') || str.includes('B')) sign = -1;
      str = str.replace(/[EWBT]/g, '').trim();
    }

    const floatVal = parseFloat(str);
    if (!isNaN(floatVal) && !str.includes('°') && !str.includes('\'') && !str.includes(' ')) {
      return floatVal * sign;
    }

    const tokens = str.split(/[°\'\s]+/).filter(t => t.length > 0);
    if (tokens.length >= 2) {
      const deg = parseFloat(tokens[0]) || 0;
      const min = parseFloat(tokens[1]) || 0;
      const sec = parseFloat(tokens[2]) || 0;
      return (deg + min / 60 + sec / 3600) * sign;
    }

    return floatVal * sign;
  }

  function formatCoordinate(val, isLatitude) {
    if (isNaN(val)) return '-';
    const dir = isLatitude ? (val >= 0 ? 'N' : 'S') : (val >= 0 ? 'E' : 'W');
    const abs = Math.abs(val);
    const deg = Math.floor(abs);
    const min = (abs - deg) * 60;
    const degStr = isLatitude ? String(deg).padStart(2, '0') : String(deg).padStart(3, '0');
    const minStr = min.toFixed(2).padStart(5, '0');
    return `${degStr}° ${minStr}' ${dir}`;
  }

  // =========================================================================
  // OPERASI VEKTOR (DENGAN HALAJU & MASA)
  // =========================================================================

  function addVector(bearing, speed, time) {
    if (isNaN(bearing) || isNaN(speed) || isNaN(time) || speed <= 0 || time <= 0) {
      alert('Sila masukkan nilai Haluan (0°-360°), Halaju (> 0 Knot), dan Masa (> 0 Jam) yang sah.');
      return;
    }

    bearing = ((bearing % 360) + 360) % 360;
    const distance = speed * time;

    const lastPoint = state.points[state.points.length - 1];
    const { dx, dy } = calculateComponents(bearing, distance);
    const x1 = lastPoint.x + dx;
    const y1 = lastPoint.y + dy;

    const color = VECTOR_COLORS[state.vectors.length % VECTOR_COLORS.length];

    const newVec = {
      id: Date.now() + Math.random(),
      legIndex: state.vectors.length + 1,
      bearing,
      speed,
      time,
      distance,
      dx,
      dy,
      x0: lastPoint.x,
      y0: lastPoint.y,
      x1,
      y1,
      color
    };

    state.vectors.push(newVec);
    state.points.push({ x: x1, y: y1 });
    state.isCalculated = false;

    updateUI();
    saveAppState();
    if (state.displayMode === 'grid') {
      autoFitView();
    } else {
      updateLeafletMap();
    }
  }

  function deleteVector(id) {
    const idx = state.vectors.findIndex(v => v.id === id);
    if (idx === -1) return;

    state.vectors.splice(idx, 1);
    rebuildVectorChain();
    updateUI();
    saveAppState();

    if (state.displayMode === 'grid') {
      drawChart();
    } else {
      updateLeafletMap();
    }
  }

  function rebuildVectorChain() {
    state.points = [{ x: 0, y: 0 }];
    state.vectors.forEach((v, i) => {
      const prev = state.points[state.points.length - 1];
      const { dx, dy } = calculateComponents(v.bearing, v.distance);
      v.legIndex = i + 1;
      v.color = VECTOR_COLORS[i % VECTOR_COLORS.length];
      v.x0 = prev.x;
      v.y0 = prev.y;
      v.x1 = prev.x + dx;
      v.y1 = prev.y + dy;
      state.points.push({ x: v.x1, y: v.y1 });
    });
    state.isCalculated = false;
  }

  function calculateResultant() {
    if (state.vectors.length === 0) {
      alert('Sila tambah sekurang-kurangnya satu vektor sebelum mengira resultant.');
      return;
    }

    const p0 = state.points[0];
    const pEnd = state.points[state.points.length - 1];

    const totalDx = pEnd.x - p0.x;
    const totalDy = pEnd.y - p0.y;
    const distance = Math.hypot(totalDx, totalDy);
    const bearing = cartesianToNauticalBearing(totalDx, totalDy);
    const totalTrack = state.vectors.reduce((sum, v) => sum + v.distance, 0);
    const totalTime = state.vectors.reduce((sum, v) => sum + (v.time || 0), 0);

    const { nm_per_cm, nm_2cm } = calculateA4Scale(state.points);

    state.resultant = {
      p0,
      pEnd,
      dx: totalDx,
      dy: totalDy,
      distance,
      bearing,
      totalTrack,
      totalTime,
      scaleA4_1cm: nm_per_cm,
      scaleA4_2cm: nm_2cm
    };

    state.isCalculated = true;
    updateUI();
    saveAppState();

    if (state.displayMode === 'grid') {
      drawChart();
    } else {
      updateLeafletMap();
    }
  }

  function resetAll() {
    state.vectors = [];
    state.points = [{ x: 0, y: 0 }];
    state.isCalculated = false;
    state.resultant = null;

    el.bearingInput.value = '090';
    el.speedInput.value = '12.0';
    el.timeInput.value = '1.0';
    updateDistancePreview();

    updateUI();
    saveAppState();
    if (state.displayMode === 'grid') {
      resetPanZoom();
    } else {
      updateLeafletMap();
    }
  }

  // =========================================================================
  // OPERASI AVERAGE SURFACE WIND (ASW) - TAB 2
  // =========================================================================

  function addAswVector(bearing, speed, time) {
    if (isNaN(bearing) || isNaN(speed) || isNaN(time) || speed <= 0 || time <= 0) {
      alert('Sila masukkan nilai Arah Angin (0°-360°), Kelajuan (> 0 Knot), dan Tempoh (> 0 Jam) yang sah.');
      return;
    }

    bearing = ((bearing % 360) + 360) % 360;
    const distance = speed * time;
    const { dx, dy } = calculateComponents(bearing, distance);

    const newAsw = {
      id: Date.now() + Math.random(),
      index: state.aswVectors.length + 1,
      bearing,
      speed,
      time,
      distance,
      dx,
      dy
    };

    state.aswVectors.push(newAsw);
    state.isAswCalculated = false;
    updateAswUI();
    saveAppState();
  }

  function deleteAswVector(id) {
    const idx = state.aswVectors.findIndex(v => v.id === id);
    if (idx === -1) return;

    state.aswVectors.splice(idx, 1);
    state.aswVectors.forEach((v, i) => { v.index = i + 1; });
    state.isAswCalculated = false;
    updateAswUI();
    saveAppState();
  }

  function calculateAswResultant() {
    if (state.aswVectors.length === 0) {
      alert('Sila tambah sekurang-kurangnya satu cerapan angin sebelum mengira ASW.');
      return;
    }

    const totalDx = state.aswVectors.reduce((sum, v) => sum + v.dx, 0);
    const totalDy = state.aswVectors.reduce((sum, v) => sum + v.dy, 0);
    const totalDist = Math.hypot(totalDx, totalDy);
    const totalTime = state.aswVectors.reduce((sum, v) => sum + v.time, 0);
    const bearing = cartesianToNauticalBearing(totalDx, totalDy);
    const avgSpeed = totalTime > 0 ? totalDist / totalTime : 0;

    state.aswResultant = {
      bearing,
      avgSpeed,
      totalDist,
      totalTime,
      count: state.aswVectors.length,
      dx: totalDx,
      dy: totalDy
    };

    state.isAswCalculated = true;
    updateAswUI();
    saveAppState();
  }

  function resetAsw() {
    state.aswVectors = [];
    state.isAswCalculated = false;
    state.aswResultant = null;

    if (el.aswBearingInput) el.aswBearingInput.value = '000';
    if (el.aswSpeedInput) el.aswSpeedInput.value = '0.0';
    if (el.aswTimeInput) el.aswTimeInput.value = '1.0';
    if (el.aswErrorTypeSelect) el.aswErrorTypeSelect.value = 'forecast';
    if (el.aswEInput) el.aswEInput.value = '8.0';
    if (el.aswdvEInput) el.aswdvEInput.value = '0.5';

    updateAswDistancePreview();
    updateAswUI();
    saveAppState();
  }

  function updateAswUI() {
    if (!el.aswTbody) return;

    if (state.aswVectors.length === 0) {
      el.aswTbody.innerHTML = `
        <tr class="empty-row">
          <td colspan="8">Belum ada cerapan angin. Masukkan Arah, Kelajuan &amp; Tempoh di bawah kemudian klik "Tambah Angin".</td>
        </tr>
      `;
      if (el.aswCounter) el.aswCounter.textContent = '0 Rekod';
    } else {
      if (el.aswCounter) el.aswCounter.textContent = `${state.aswVectors.length} Rekod`;
      el.aswTbody.innerHTML = state.aswVectors.map(v => `
        <tr>
          <td><strong>#${v.index}</strong></td>
          <td>${formatNauticalBearing(v.bearing)}</td>
          <td>${v.speed.toFixed(2)} kts</td>
          <td>${v.time.toFixed(2)} j</td>
          <td><strong>${v.distance.toFixed(2)} NM</strong></td>
          <td>${v.dx >= 0 ? '+' : ''}${v.dx.toFixed(2)}</td>
          <td>${v.dy >= 0 ? '+' : ''}${v.dy.toFixed(2)}</td>
          <td>
            <button class="btn-del" onclick="window.navApp.deleteAswVector(${v.id})" title="Padam Rekod Angin #${v.index}">
              <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" fill="none" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          </td>
        </tr>
      `).join('');
    }

    if (state.isAswCalculated && state.aswResultant) {
      const r = state.aswResultant;
      if (el.aswStatusBadge) {
        el.aswStatusBadge.textContent = 'Telah Dikira';
        el.aswStatusBadge.classList.add('active');
      }
      if (el.resAswBearing) el.resAswBearing.textContent = formatNauticalBearing(r.bearing);
      if (el.resAswBearingCardinal) el.resAswBearingCardinal.textContent = getCardinalDirection(r.bearing);
      if (el.resAswSpeed) el.resAswSpeed.textContent = `${r.avgSpeed.toFixed(2)} kts`;
      if (el.resAswSpeedKmh) el.resAswSpeedKmh.textContent = `≈ ${(r.avgSpeed * 1.852).toFixed(2)} km/j`;
      if (el.resAswTotalDist) el.resAswTotalDist.textContent = `${r.totalDist.toFixed(2)} NM`;
      if (el.resAswTotalTime) el.resAswTotalTime.textContent = `${r.totalTime.toFixed(2)} Jam Tempoh`;
      if (el.resAswCount) el.resAswCount.textContent = `${r.count} Rekod`;

      if (el.summaryAswVal) {
        el.summaryAswVal.textContent = `${formatNauticalBearing(r.bearing)} T ${r.avgSpeed.toFixed(2)} kts`;
      }
    } else {
      if (el.aswStatusBadge) {
        el.aswStatusBadge.textContent = state.aswVectors.length > 0 ? 'Perlu Pengiraan' : 'Menunggu Input';
        el.aswStatusBadge.classList.remove('active');
      }
      if (el.resAswBearing) el.resAswBearing.textContent = '---°';
      if (el.resAswBearingCardinal) el.resAswBearingCardinal.textContent = '-';
      if (el.resAswSpeed) el.resAswSpeed.textContent = '--- kts';
      if (el.resAswSpeedKmh) el.resAswSpeedKmh.textContent = '-';
      
      const totalDist = state.aswVectors.reduce((sum, v) => sum + v.distance, 0);
      const totalTime = state.aswVectors.reduce((sum, v) => sum + v.time, 0);
      if (el.resAswTotalDist) el.resAswTotalDist.textContent = `${totalDist.toFixed(2)} NM`;
      if (el.resAswTotalTime) el.resAswTotalTime.textContent = `${totalTime.toFixed(2)} Jam Tempoh`;
      if (el.resAswCount) el.resAswCount.textContent = `${state.aswVectors.length} Rekod`;

      if (el.summaryAswVal) {
        el.summaryAswVal.textContent = state.aswVectors.length > 0 
          ? `---° T --- kts (Perlu Kira)` 
          : '---° T --- kts';
      }
    }

    updateAswProbableError();
  }

  function updateAswProbableError() {
    if (!el.aswEInput || !el.aswdvEInput) return;

    const aswE = parseFloat(el.aswEInput.value) || 0.0;
    const aswdvE = parseFloat(el.aswdvEInput.value) || 0.0;

    if (el.resAsweVal) el.resAsweVal.textContent = `${aswE.toFixed(2)} kts`;
    if (el.resAswdveVal) el.resAswdveVal.textContent = `${aswdvE.toFixed(2)} kts`;
    if (el.summaryAswdveVal) el.summaryAswdveVal.textContent = `ASWDVe: ${aswdvE.toFixed(2)} kts`;
  }

  // =========================================================================
  // OPERASI WIND CURRENT (WC) - TAB 2 (IAMSAR VOL 2 APP. K)
  // =========================================================================

  function calculateWcFromAsw() {
    const aswRes = state.aswResultant;
    const windSpeed = aswRes ? aswRes.avgSpeed : (parseFloat(el.aswSpeedInput ? el.aswSpeedInput.value : '0') || 0);
    const windBearing = aswRes ? aswRes.bearing : (parseFloat(el.aswBearingInput ? el.aswBearingInput.value : '0') || 0);
    const duration = aswRes ? aswRes.totalTime : (parseFloat(el.aswTimeInput ? el.aswTimeInput.value : '1.0') || 1.0);

    if (windSpeed <= 0) {
      alert('Sila pastikan data ASW (Average Surface Wind) telah dimasukkan dan dikira terlebih dahulu.');
      return;
    }

    // 1. Kelajuan WC mengikut IAMSAR Vol 2 Rajah N-1 (Figure N-1): V_wc = ASW / 28
    const wcSpeed = Math.round((windSpeed / 28) * 100) / 100;

    // 2. Arah Set WC (Deflection mengikut Latitude / Hemisfera - IAMSAR Figure N-1)
    // Downwind = Arah Datang Angin + 180°
    const downwind = (windBearing + 180) % 360;
    const lat = state.originGeo.lat;
    let deflection = 0;
    if (lat >= 10) {
      deflection = 30; // Hemisfera Utara (> 10°N): 30° ke kanan
    } else if (lat <= -10) {
      deflection = -30; // Hemisfera Selatan (> 10°S): 30° ke kiri
    } else {
      deflection = 0; // Khatulistiwa (10°S - 10°N): 0° (terus downwind)
    }

    const wcBearing = ((downwind + deflection) % 360 + 360) % 360;

    if (el.wcBearingInput) el.wcBearingInput.value = String(Math.round(wcBearing)).padStart(3, '0');
    if (el.wcSpeedInput) el.wcSpeedInput.value = wcSpeed.toFixed(2);
    if (el.wcTimeInput) el.wcTimeInput.value = duration.toFixed(2);

    updateWcDistancePreview();
    calculateWc();
  }

  function calculateWc() {
    if (!el.wcBearingInput || !el.wcSpeedInput || !el.wcTimeInput) return;

    const bearing = parseFloat(el.wcBearingInput.value) || 0;
    const speed = parseFloat(el.wcSpeedInput.value) || 0;
    const time = parseFloat(el.wcTimeInput.value) || 1.0;

    const normalizedBearing = ((bearing % 360) + 360) % 360;
    const distance = speed * time;
    const { dx, dy } = calculateComponents(normalizedBearing, distance);

    state.wcVector = {
      bearing: normalizedBearing,
      speed,
      time,
      distance,
      dx,
      dy
    };
    state.isWcCalculated = true;

    updateWcUI();
    saveAppState();
  }

  function resetWc() {
    state.wcVector = null;
    state.isWcCalculated = false;

    if (el.wcBearingInput) el.wcBearingInput.value = '000';
    if (el.wcSpeedInput) el.wcSpeedInput.value = '0.0';
    if (el.wcTimeInput) el.wcTimeInput.value = '1.0';
    if (el.wcEInput) el.wcEInput.value = '0.3';

    updateWcDistancePreview();
    updateWcUI();
    saveAppState();
  }

  function updateWcUI() {
    if (state.isWcCalculated && state.wcVector) {
      const v = state.wcVector;
      if (el.wcStatusBadge) {
        el.wcStatusBadge.textContent = 'Telah Dikira';
        el.wcStatusBadge.classList.add('active');
      }
      if (el.resWcBearing) el.resWcBearing.textContent = `${formatNauticalBearing(v.bearing)} T`;
      if (el.resWcBearingCardinal) el.resWcBearingCardinal.textContent = getCardinalDirection(v.bearing);
      if (el.resWcSpeed) el.resWcSpeed.textContent = `${v.speed.toFixed(2)} kts`;
      if (el.resWcSpeedKmh) el.resWcSpeedKmh.textContent = `≈ ${(v.speed * 1.852).toFixed(2)} km/j`;
      if (el.resWcTotalDist) el.resWcTotalDist.textContent = `${v.distance.toFixed(2)} NM`;
      if (el.resWcTotalTime) el.resWcTotalTime.textContent = `${v.time.toFixed(2)} Jam Tempoh`;

      if (el.summaryWcVal) {
        el.summaryWcVal.textContent = `${formatNauticalBearing(v.bearing)} T ${v.speed.toFixed(2)} kts (${v.distance.toFixed(2)} NM)`;
      }
    } else {
      if (el.wcStatusBadge) {
        el.wcStatusBadge.textContent = 'Menunggu Input';
        el.wcStatusBadge.classList.remove('active');
      }
      if (el.resWcBearing) el.resWcBearing.textContent = '---°';
      if (el.resWcBearingCardinal) el.resWcBearingCardinal.textContent = '-';
      if (el.resWcSpeed) el.resWcSpeed.textContent = '--- kts';
      if (el.resWcSpeedKmh) el.resWcSpeedKmh.textContent = '-';
      if (el.resWcTotalDist) el.resWcTotalDist.textContent = '0.00 NM';
      if (el.resWcTotalTime) el.resWcTotalTime.textContent = '0.00 Jam Tempoh';

      if (el.summaryWcVal) {
        el.summaryWcVal.textContent = '---° T --- kts';
      }
    }

    updateWcProbableError();
    calculateScResultant();
    updateScUI();
  }

  function updateWcProbableError() {
    if (!el.wcEInput) return;
    const wcE = parseFloat(el.wcEInput.value) || 0.3;

    if (el.resWceVal) el.resWceVal.textContent = `${wcE.toFixed(2)} kts`;
    if (el.summaryWceVal) el.summaryWceVal.textContent = `WCe: ${wcE.toFixed(2)} kts`;
    calculateScResultant();
    updateScUI();
  }

  // =========================================================================
  // OPERASI TOTAL WATER CURRENT (TWC) - TAB 2 (DRAWER TWC)
  // MOD 1: OBSERVED TWC & MOD 2: COMPUTED TWC
  // =========================================================================

  function switchTwcMode(mode) {
    state.twcMode = mode || 'computed';

    if (el.radioTwcObserved) el.radioTwcObserved.checked = (state.twcMode === 'observed');
    if (el.radioTwcComputed) el.radioTwcComputed.checked = (state.twcMode === 'computed');

    if (el.btnTwcModeObserved) el.btnTwcModeObserved.classList.toggle('active', state.twcMode === 'observed');
    if (el.btnTwcModeComputed) el.btnTwcModeComputed.classList.toggle('active', state.twcMode === 'computed');

    if (el.twcObservedContainer) el.twcObservedContainer.classList.toggle('active', state.twcMode === 'observed');
    if (el.twcComputedContainer) el.twcComputedContainer.classList.toggle('active', state.twcMode === 'computed');

    updateActiveTwcSummary();
    saveAppState();
  }

  function updateActiveTwcSummary() {
    if (state.twcMode === 'observed') {
      const obs = state.twcObserved;
      if (obs && obs.isCalculated) {
        if (el.summaryTwcVal) {
          el.summaryTwcVal.textContent = `${formatNauticalBearing(obs.bearing)} / ${obs.speed.toFixed(2)} kts (${obs.distance.toFixed(2)} NM)`;
        }
        if (el.summaryTwceVal) {
          el.summaryTwceVal.textContent = `TWCe: ${obs.twcE.toFixed(2)} kts`;
        }
      } else {
        if (el.summaryTwcVal) el.summaryTwcVal.textContent = '---° / --- kts';
        if (el.summaryTwceVal) el.summaryTwceVal.textContent = 'TWCe: 0.10 kts';
      }
    } else {
      // Computed TWC
      if (state.isScCalculated && state.scResultant) {
        const r = state.scResultant;
        if (el.summaryTwcVal) {
          el.summaryTwcVal.textContent = `${formatNauticalBearing(r.bearing)} / ${r.avgSpeed.toFixed(2)} kts (${r.totalDist.toFixed(2)} NM)`;
        }
        if (el.summaryTwceVal) {
          el.summaryTwceVal.textContent = `TWCe: ${r.computedTwcE.toFixed(2)} kts`;
        }
      } else {
        if (el.summaryTwcVal) {
          el.summaryTwcVal.textContent = state.scVectors.length > 0 ? `${state.scVectors.length + 1} Vektor (Perlu Kira)` : '---° / --- kts';
        }
        if (el.summaryTwceVal) {
          const wcE = el.wcEInput ? (parseFloat(el.wcEInput.value) || 0.3) : 0.3;
          el.summaryTwceVal.textContent = `TWCe: ${wcE.toFixed(2)} kts`;
        }
      }
    }
  }

  // --- 1. OBSERVED TWC OPERATIONS ---

  function updateObsTwcDistancePreview() {
    const s = parseFloat(el.twcObsSpeedInput ? el.twcObsSpeedInput.value : '0') || 0;
    const t = parseFloat(el.twcObsTimeInput ? el.twcObsTimeInput.value : '1.0') || 0;
    if (el.twcObsDistPreview) {
      el.twcObsDistPreview.textContent = `${(s * t).toFixed(2)} NM`;
    }
  }

  function calculateObsTwc() {
    const bearing = parseFloat(el.twcObsBearingInput ? el.twcObsBearingInput.value : '0') || 0;
    const speed = parseFloat(el.twcObsSpeedInput ? el.twcObsSpeedInput.value : '0') || 0;
    const time = parseFloat(el.twcObsTimeInput ? el.twcObsTimeInput.value : '1.0') || 1.0;

    const normBearing = ((bearing % 360) + 360) % 360;
    const distance = speed * time;
    const { dx, dy } = calculateComponents(normBearing, distance);
    const source = el.twcObsSourceInput ? el.twcObsSourceInput.value : 'DMB (Datum Marker Buoy)';
    const quality = el.twcObsQualitySelect ? el.twcObsQualitySelect.value : 'good';
    const twcE = el.twcObsEInput ? (parseFloat(el.twcObsEInput.value) || 0.1) : 0.1;

    state.twcObserved = {
      source,
      bearing: normBearing,
      speed,
      time,
      distance,
      dx,
      dy,
      quality,
      twcE,
      isCalculated: true
    };

    updateObsTwcUI();
    calculateFinalDatum();
    updateLeafletMap();
    saveAppState();
  }

  function resetObsTwc() {
    if (el.twcObsSourceSelect) el.twcObsSourceSelect.value = 'DMB (Datum Marker Buoy)';
    if (el.twcObsSourceInput) el.twcObsSourceInput.value = 'DMB (Datum Marker Buoy)';
    if (el.twcObsBearingInput) el.twcObsBearingInput.value = '0';
    if (el.twcObsSpeedInput) el.twcObsSpeedInput.value = '0';
    if (el.twcObsTimeInput) el.twcObsTimeInput.value = '1.0';
    if (el.twcObsQualitySelect) el.twcObsQualitySelect.value = 'good';
    if (el.twcObsEInput) el.twcObsEInput.value = '0.1';

    state.twcObserved = {
      source: 'DMB (Datum Marker Buoy)',
      bearing: 0,
      speed: 0,
      time: 1.0,
      distance: 0,
      dx: 0,
      dy: 0,
      quality: 'good',
      twcE: 0.1,
      isCalculated: false
    };

    updateObsTwcDistancePreview();
    updateObsTwcUI();
    calculateFinalDatum();
    updateLeafletMap();
    saveAppState();
  }

  function updateObsTwcUI() {
    const obs = state.twcObserved;
    if (!obs) return;

    if (obs.isCalculated) {
      if (el.twcObsStatusBadge) {
        el.twcObsStatusBadge.textContent = 'Aktif (Dikira)';
        el.twcObsStatusBadge.classList.add('active');
      }
      if (el.resTwcObsBearing) el.resTwcObsBearing.textContent = `${formatNauticalBearing(obs.bearing)} T`;
      if (el.resTwcObsBearingCardinal) el.resTwcObsBearingCardinal.textContent = getCardinalDirection(obs.bearing);
      if (el.resTwcObsSpeed) el.resTwcObsSpeed.textContent = `${obs.speed.toFixed(2)} kts`;
      if (el.resTwcObsSpeedKmh) el.resTwcObsSpeedKmh.textContent = `≈ ${(obs.speed * 1.852).toFixed(2)} km/j`;
      if (el.resTwcObsDist) el.resTwcObsDist.textContent = `${obs.distance.toFixed(2)} NM`;
      if (el.resTwcObsTimeSub) el.resTwcObsTimeSub.textContent = `${obs.time.toFixed(2)} Jam Tempoh`;
      if (el.resTwcObsE) el.resTwcObsE.textContent = `${obs.twcE.toFixed(2)} kts`;
      if (el.resTwcObsSourceLabel) el.resTwcObsSourceLabel.textContent = `Sumber: ${obs.source || 'DMB'}`;
    } else {
      if (el.twcObsStatusBadge) {
        el.twcObsStatusBadge.textContent = 'Menunggu Input';
        el.twcObsStatusBadge.classList.remove('active');
      }
      if (el.resTwcObsBearing) el.resTwcObsBearing.textContent = '---°';
      if (el.resTwcObsBearingCardinal) el.resTwcObsBearingCardinal.textContent = '---';
      if (el.resTwcObsSpeed) el.resTwcObsSpeed.textContent = '--- kts';
      if (el.resTwcObsSpeedKmh) el.resTwcObsSpeedKmh.textContent = '-';
      if (el.resTwcObsDist) el.resTwcObsDist.textContent = '0.00 NM';
      if (el.resTwcObsTimeSub) el.resTwcObsTimeSub.textContent = '0.00 Jam Tempoh';
      if (el.resTwcObsE) el.resTwcObsE.textContent = `${(obs.twcE || 0.1).toFixed(2)} kts`;
      if (el.resTwcObsSourceLabel) el.resTwcObsSourceLabel.textContent = `Sumber: ${obs.source || 'DMB'}`;
    }

    if (state.twcMode === 'observed') {
      updateActiveTwcSummary();
    }
  }

  // --- 2. COMPUTED TWC OPERATIONS ---

  function updateScDistancePreview() {
    const s = parseFloat(el.scSpeedInput ? el.scSpeedInput.value : '1.5') || 0;
    const b = parseFloat(el.scBearingInput ? el.scBearingInput.value : '180') || 0;
    const { dx, dy } = calculateComponents(b, s);
    if (el.scDistPreview) {
      el.scDistPreview.textContent = `${s.toFixed(2)} kts (ΔX: ${dx >= 0 ? '+' : ''}${dx.toFixed(2)}, ΔY: ${dy >= 0 ? '+' : ''}${dy.toFixed(2)} kts)`;
    }
  }

  function addScVector(bearing, speed, type, errorE) {
    if (isNaN(bearing) || isNaN(speed) || speed <= 0) {
      alert('Sila masukkan nilai Arah Arus (0°-360°) dan Kelajuan (> 0 Knot) yang sah.');
      return;
    }

    const currentType = type || (el.scTypeSelect ? el.scTypeSelect.value : 'SC');
    const err = errorE !== undefined ? errorE : (el.scVectorEInput ? (parseFloat(el.scVectorEInput.value) || 0.3) : 0.3);
    bearing = ((bearing % 360) + 360) % 360;
    const { dx, dy } = calculateComponents(bearing, speed);

    const newSc = {
      id: Date.now() + Math.random(),
      index: state.scVectors.length + 1,
      type: currentType,
      bearing,
      speed,
      dx,
      dy,
      errorE: err
    };

    state.scVectors.push(newSc);
    calculateScResultant();
    updateScUI();
    saveAppState();
  }

  function deleteScVector(id) {
    const idx = state.scVectors.findIndex(v => v.id === id);
    if (idx === -1) return;

    state.scVectors.splice(idx, 1);
    state.scVectors.forEach((v, i) => { v.index = i + 1; });
    calculateScResultant();
    updateScUI();
    saveAppState();
  }

  function calculateScResultant() {
    // 1. Ambil data Wind Current (WC) dari Drawer WC sebagai vektor pertama (berdasarkan kelajuan knots)
    let wcDx = 0, wcDy = 0, wcSpeed = 0;
    const wcE = el.wcEInput ? (parseFloat(el.wcEInput.value) || 0.3) : 0.3;
    
    if (state.isWcCalculated && state.wcVector) {
      wcSpeed = state.wcVector.speed || 0;
      const { dx, dy } = calculateComponents(state.wcVector.bearing, wcSpeed);
      wcDx = dx;
      wcDy = dy;
    }

    // 2. Paduan Semua Vektor: WC + Semua Arus Lain (berdasarkan kelajuan knots)
    let totalDx = wcDx;
    let totalDy = wcDy;

    // Kira punca kuasa 2 hasil tambah semua kuasa 2 error yang terlibat
    // TWCe = sqrt( WCe^2 + e1^2 + e2^2 + ... )
    let sumSqErrors = Math.pow(wcE, 2);
    let errorTerms = [`${wcE.toFixed(2)}`];

    state.scVectors.forEach(v => {
      const { dx, dy } = calculateComponents(v.bearing, v.speed);
      v.dx = dx;
      v.dy = dy;
      totalDx += dx;
      totalDy += dy;
      
      const eVal = v.errorE !== undefined ? v.errorE : 0.3;
      sumSqErrors += Math.pow(eVal, 2);
      errorTerms.push(`${eVal.toFixed(2)}`);
    });

    const totalSpeed = Math.hypot(totalDx, totalDy);
    const bearing = totalSpeed > 0.0001 ? cartesianToNauticalBearing(totalDx, totalDy) : 0;
    const computedTwcE = Math.sqrt(sumSqErrors);

    state.scResultant = {
      bearing,
      speed: totalSpeed,
      avgSpeed: totalSpeed,
      totalDist: totalSpeed,
      totalTime: 1.0,
      count: (state.wcVector ? 1 : 0) + state.scVectors.length,
      dx: totalDx,
      dy: totalDy,
      computedTwcE,
      errorTerms
    };

    state.isScCalculated = true;
    updateScUI();
    saveAppState();
  }

  function resetSc() {
    state.scVectors = [];
    state.isScCalculated = false;
    state.scResultant = null;

    if (el.scTypeSelect) el.scTypeSelect.value = 'SC';
    if (el.scBearingInput) el.scBearingInput.value = '180';
    if (el.scSpeedInput) el.scSpeedInput.value = '1.5';
    if (el.scVectorEInput) el.scVectorEInput.value = '0.3';

    updateScDistancePreview();
    updateScUI();
    calculateFinalDatum();
    updateLeafletMap();
    saveAppState();
  }

  function updateScUI() {
    if (!el.scTbody) return;

    const wc = (state.isWcCalculated && state.wcVector) ? state.wcVector : null;
    const wcE = el.wcEInput ? (parseFloat(el.wcEInput.value) || 0.3) : 0.3;
    const totalRecords = (wc ? 1 : 0) + state.scVectors.length;

    if (el.scCounter) {
      el.scCounter.textContent = `${totalRecords} Rekod (Termasuk WC)`;
    }

    let rowsHtml = '';

    // 1. BARIS 1 DI ATAS: WIND CURRENT (WC)
    if (wc) {
      const { dx: wcDx, dy: wcDy } = calculateComponents(wc.bearing, wc.speed);
      rowsHtml += `
        <tr style="background: rgba(6, 182, 212, 0.08); font-weight: 600;">
          <td><strong style="color: #06b6d4;">#1</strong></td>
          <td><span class="badge" style="background: #06b6d4; color: #fff; font-size: 0.68rem; padding: 2px 6px;">WC (Wind Current)</span></td>
          <td>${formatNauticalBearing(wc.bearing)} T</td>
          <td>${wc.speed.toFixed(2)} kts</td>
          <td>${wcDx >= 0 ? '+' : ''}${wcDx.toFixed(2)}</td>
          <td>${wcDy >= 0 ? '+' : ''}${wcDy.toFixed(2)}</td>
          <td><span class="unit-badge" style="background: rgba(6, 182, 212, 0.2); color: #0891b2; font-weight: 700;">${wcE.toFixed(2)} kts</span></td>
          <td><span style="font-size: 0.68rem; color: var(--text-muted); font-weight: 600;">⚡ Dari Drawer WC</span></td>
        </tr>
      `;
    } else {
      rowsHtml += `
        <tr style="background: rgba(6, 182, 212, 0.04); color: var(--text-muted);">
          <td><strong style="color: #06b6d4;">#1</strong></td>
          <td><span class="badge" style="background: #0891b2; color: #fff; font-size: 0.68rem; padding: 2px 6px;">WC (Wind Current)</span></td>
          <td>000.00° T</td>
          <td>0.00 kts</td>
          <td>+0.00</td>
          <td>+0.00</td>
          <td><span class="unit-badge">${wcE.toFixed(2)} kts</span></td>
          <td><span style="font-size: 0.68rem; color: #f59e0b;">Belum dikira di WC</span></td>
        </tr>
      `;
    }

    // 2. BARIS-BARIS VEKTOR ARUS TAMBAHAN
    state.scVectors.forEach((v, idx) => {
      const err = v.errorE !== undefined ? v.errorE : 0.3;
      const { dx, dy } = calculateComponents(v.bearing, v.speed);
      rowsHtml += `
        <tr>
          <td><strong>#${idx + 2}</strong></td>
          <td><span class="badge" style="font-size: 0.68rem; padding: 2px 6px;">${v.type || 'SC'}</span></td>
          <td>${formatNauticalBearing(v.bearing)} T</td>
          <td>${v.speed.toFixed(2)} kts</td>
          <td>${dx >= 0 ? '+' : ''}${dx.toFixed(2)}</td>
          <td>${dy >= 0 ? '+' : ''}${dy.toFixed(2)}</td>
          <td><span class="unit-badge" style="font-weight: 700;">${err.toFixed(2)} kts</span></td>
          <td>
            <button class="btn-del" onclick="window.navApp.deleteScVector(${v.id})" title="Padam Rekod Arus #${idx + 2}">
              <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" fill="none" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          </td>
        </tr>
      `;
    });

    el.scTbody.innerHTML = rowsHtml;

    // Kemaskini Hasil Paduan Computed TWC
    if (state.isScCalculated && state.scResultant) {
      const r = state.scResultant;
      if (el.scStatusBadge) {
        el.scStatusBadge.textContent = 'Telah Dikira';
        el.scStatusBadge.classList.add('active');
      }
      if (el.resScBearing) el.resScBearing.textContent = `${formatNauticalBearing(r.bearing)} T`;
      if (el.resScBearingCardinal) el.resScBearingCardinal.textContent = getCardinalDirection(r.bearing);
      if (el.resScSpeed) el.resScSpeed.textContent = `${r.speed.toFixed(2)} kts`;
      if (el.resScSpeedKmh) el.resScSpeedKmh.textContent = `≈ ${(r.speed * 1.852).toFixed(2)} km/j`;
      if (el.resScTotalDist) el.resScTotalDist.textContent = `ΔX: ${r.dx >= 0 ? '+' : ''}${r.dx.toFixed(2)} | ΔY: ${r.dy >= 0 ? '+' : ''}${r.dy.toFixed(2)} kts`;
      if (el.resScTotalTime) el.resScTotalTime.textContent = `${r.count} Vektor Arus Terkumpul`;
      if (el.resScCount) el.resScCount.textContent = `${r.count} Rekod (WC + ${state.scVectors.length})`;

      // Computed TWCe = sqrt( sum(e^2) )
      if (el.resTwceVal) el.resTwceVal.textContent = `${r.computedTwcE.toFixed(2)} kts`;
      if (el.resTwceFormula) {
        const termsStr = r.errorTerms ? r.errorTerms.map(t => `${t}²`).join(' + ') : 'e²';
        el.resTwceFormula.textContent = `√(${termsStr}) = ${r.computedTwcE.toFixed(2)} kts`;
      }
    } else {
      if (el.scStatusBadge) {
        el.scStatusBadge.textContent = 'Menunggu Input';
        el.scStatusBadge.classList.remove('active');
      }
      if (el.resScBearing) el.resScBearing.textContent = '---°';
      if (el.resScBearingCardinal) el.resScBearingCardinal.textContent = '-';
      if (el.resScSpeed) el.resScSpeed.textContent = '--- kts';
      if (el.resScSpeedKmh) el.resScSpeedKmh.textContent = '-';
      if (el.resScTotalDist) el.resScTotalDist.textContent = 'ΔX: 0.00 | ΔY: 0.00 kts';
      if (el.resScTotalTime) el.resScTotalTime.textContent = '0 Rekod';
      if (el.resScCount) el.resScCount.textContent = '0 Rekod';
      if (el.resTwceVal) el.resTwceVal.textContent = '0.30 kts';
      if (el.resTwceFormula) el.resTwceFormula.textContent = '√(Σ e²)';
    }

    if (state.twcMode === 'computed') {
      updateActiveTwcSummary();
    }
  }

  // =========================================================================
  // OPERASI LEEWAY (LW) - IAMSAR VOL 2 FIGURE N-2 & FIGURE N-3 (PIECEWISE)
  // =========================================================================

  function getLeewayFormulaDescription(targetKey, windSpeed) {
    if (!targetKey) {
      return 'Formula: Sila pilih objek hanyutan SAR';
    }
    const target = LEEWAY_TARGETS[targetKey];
    if (!target) {
      if (targetKey === 'custom') {
        const pct = parseFloat(el.leewayCustomPct ? el.leewayCustomPct.value : '3.5') || 3.5;
        return `Formula: LW = ${pct.toFixed(1)}% × W`;
      }
      return 'Formula: Sila pilih objek hanyutan SAR';
    }

    if (targetKey === 'custom') {
      const pct = parseFloat(el.leewayCustomPct ? el.leewayCustomPct.value : '3.5') || 3.5;
      return `Formula: LW = ${pct.toFixed(1)}% × W`;
    }

    if (target.minWind && target.minWind > 0) {
      const sign = (target.intercept >= 0) ? '+' : '-';
      const absC = Math.abs(target.intercept || 0).toFixed(2);
      return `Formula (Min Wind): W < ${target.minWind.toFixed(1)} kts → LW = 0.00 | W ≥ ${target.minWind.toFixed(1)} kts → LW = ${target.slope.toFixed(3)} × W ${sign} ${absC}`;
    }

    if (target.breakWind && target.breakWind > 0) {
      const slopeLow = (target.slopeLow !== undefined) ? target.slopeLow : target.slope;
      const slopeHigh = target.slope;
      const sign = (target.intercept >= 0) ? '+' : '-';
      const absC = Math.abs(target.intercept || 0).toFixed(2);
      const cStr = (target.intercept && target.intercept !== 0) ? ` ${sign} ${absC}` : '';
      return `Dwikecerunan (Piecewise): W ≤ ${target.breakWind.toFixed(1)} kts → LW = ${slopeLow.toFixed(3)} × W | W > ${target.breakWind.toFixed(1)} kts → LW = ${slopeHigh.toFixed(3)} × W${cStr}`;
    }

    const sign = (target.intercept >= 0) ? '+' : '-';
    const absC = Math.abs(target.intercept || 0).toFixed(2);
    const cStr = (target.intercept && target.intercept !== 0) ? ` ${sign} ${absC}` : '';
    return `Formula: LW = ${target.slope.toFixed(3)} × W${cStr}`;
  }

  function computeLeewaySpeed(targetKey, windSpeed) {
    if (!targetKey || windSpeed <= 0.0001) return 0.0;
    const target = LEEWAY_TARGETS[targetKey];
    if (!target) {
      if (targetKey === 'custom') {
        const pct = parseFloat(el.leewayCustomPct ? el.leewayCustomPct.value : '3.5') || 3.5;
        return (pct / 100) * windSpeed;
      }
      return 0.0;
    }

    if (targetKey === 'custom') {
      const pct = parseFloat(el.leewayCustomPct ? el.leewayCustomPct.value : '3.5') || 3.5;
      return (pct / 100) * windSpeed;
    }

    // Cutoff kelajuan angin minimum jika ada (cth: Raft w/ sail, Sport boats, Sport fisher)
    if (target.minWind && target.minWind > 0 && windSpeed < target.minWind) {
      return 0.0;
    }

    // Pengiraan Dwikecerunan / Piecewise mengikut breakpoint (cth: 6.0 kts atau 12.0 kts)
    if (target.breakWind && target.breakWind > 0) {
      if (windSpeed <= target.breakWind) {
        const slope1 = (target.slopeLow !== undefined) ? target.slopeLow : target.slope;
        const intercept1 = (target.interceptLow !== undefined) ? target.interceptLow : 0.0;
        return Math.max(0, slope1 * windSpeed + intercept1);
      } else {
        const slope2 = target.slope;
        const intercept2 = (target.intercept !== undefined) ? target.intercept : 0.0;
        return Math.max(0, slope2 * windSpeed + intercept2);
      }
    }

    return Math.max(0, target.slope * windSpeed + (target.intercept || 0.0));
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // =========================================================================
  // SEARCHABLE COMBOBOX UNTUK JENIS SASARAN / OBJEK HANYUTAN LEEWAY
  // =========================================================================

  let leewayComboboxOptions = [];

  function initLeewaySearchableCombobox() {
    if (!el.leewayTargetType || !el.leewayComboboxMenu || !el.leewaySearchInput) return;

    // Kumpul senarai pilihan dari elemen <select> dan optgroup
    leewayComboboxOptions = [];
    const optgroups = el.leewayTargetType.querySelectorAll('optgroup');
    optgroups.forEach(group => {
      const groupLabel = group.getAttribute('label') || '';
      const options = group.querySelectorAll('option');
      options.forEach(opt => {
        const val = opt.value;
        const rawText = opt.textContent;
        // Pisahkan nama objek dan info formula jika ada
        const parts = rawText.split(' (');
        const name = parts[0];
        const sub = parts.length > 1 ? '(' + parts.slice(1).join(' (') : '';

        leewayComboboxOptions.push({
          value: val,
          text: rawText,
          name: name,
          sub: sub,
          group: groupLabel
        });
      });
    });

    renderLeewayComboboxMenu('');
    syncLeewayComboboxUI();

    // Event listener untuk input carian
    el.leewaySearchInput.addEventListener('input', (e) => {
      const q = e.target.value;
      if (el.leewaySearchClear) {
        el.leewaySearchClear.style.display = q.trim() ? 'block' : 'none';
      }
      openLeewayComboboxMenu();
      renderLeewayComboboxMenu(q);
    });

    el.leewaySearchInput.addEventListener('focus', () => {
      el.leewaySearchInput.value = '';
      if (el.leewaySearchClear) {
        el.leewaySearchClear.style.display = 'none';
      }
      openLeewayComboboxMenu();
      renderLeewayComboboxMenu('');
    });

    if (el.leewayComboboxArrow) {
      el.leewayComboboxArrow.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleLeewayComboboxMenu();
      });
    }

    if (el.leewaySearchClear) {
      el.leewaySearchClear.addEventListener('click', (e) => {
        e.stopPropagation();
        el.leewaySearchInput.value = '';
        el.leewaySearchClear.style.display = 'none';
        el.leewaySearchInput.focus();
        renderLeewayComboboxMenu('');
      });
    }

    // Tutup bila klik di luar
    document.addEventListener('click', (e) => {
      if (el.leewayCombobox && !el.leewayCombobox.contains(e.target)) {
        closeLeewayComboboxMenu();
      }
    });

    // Sokongan papan kekunci (Escape & Enter)
    el.leewaySearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeLeewayComboboxMenu();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const firstVisible = el.leewayComboboxMenu.querySelector('.combobox-item');
        if (firstVisible) {
          selectLeewayComboboxOption(firstVisible.dataset.value);
        }
      }
    });
  }

  function renderLeewayComboboxMenu(query = '') {
    if (!el.leewayComboboxMenu) return;

    const q = query.trim().toLowerCase();
    const currentVal = el.leewayTargetType ? el.leewayTargetType.value : 'no_ballast_no_canopy';

    let html = '';
    let matchCount = 0;

    const highlightText = (text, term) => {
      if (!term) return text;
      const idx = text.toLowerCase().indexOf(term);
      if (idx === -1) return text;
      return text.substring(0, idx) + `<span class="combobox-item-highlight">${text.substring(idx, idx + term.length)}</span>` + text.substring(idx + term.length);
    };

    // Kelaskan mengikut group
    const groups = {};
    leewayComboboxOptions.forEach(opt => {
      const matchName = opt.name.toLowerCase().includes(q);
      const matchSub = opt.sub.toLowerCase().includes(q);
      const matchGroup = opt.group.toLowerCase().includes(q);

      if (!q || matchName || matchSub || matchGroup) {
        if (!groups[opt.group]) groups[opt.group] = [];
        groups[opt.group].push({
          ...opt,
          highlightedName: highlightText(opt.name, q),
          highlightedSub: highlightText(opt.sub, q)
        });
        matchCount++;
      }
    });

    if (matchCount === 0) {
      html = `<div class="combobox-empty">Tiada sasaran sepadan dengan "<strong>${escapeHtml(query)}</strong>"</div>`;
    } else {
      Object.keys(groups).forEach(grpName => {
        html += `<div class="combobox-group-header">${grpName}</div>`;
        groups[grpName].forEach(opt => {
          const isSelected = opt.value === currentVal;
          html += `
            <div class="combobox-item ${isSelected ? 'selected' : ''}" data-value="${opt.value}">
              <div class="combobox-item-title">${opt.highlightedName}</div>
              ${opt.sub ? `<div class="combobox-item-sub">${opt.highlightedSub}</div>` : ''}
            </div>
          `;
        });
      });
    }

    el.leewayComboboxMenu.innerHTML = html;

    // Tambah event listener klik item
    el.leewayComboboxMenu.querySelectorAll('.combobox-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const val = item.dataset.value;
        selectLeewayComboboxOption(val);
      });
    });
  }

  function selectLeewayComboboxOption(val) {
    if (!el.leewayTargetType || !val) return;
    el.leewayTargetType.value = val;
    syncLeewayComboboxUI();
    closeLeewayComboboxMenu();
    onLeewayTargetChanged();
    saveAppState();
  }

  function syncLeewayComboboxUI() {
    if (!el.leewayTargetType || !el.leewaySearchInput) return;
    const currentVal = el.leewayTargetType.value;
    const targetObj = LEEWAY_TARGETS[currentVal];
    const found = leewayComboboxOptions.find(o => o.value === currentVal);
    const selectedName = (found && currentVal) ? found.name : (targetObj ? targetObj.name : '');

    // Ruangan taip kekal kosong secara lalai agar pengguna tidak perlu padam teks sedia ada
    el.leewaySearchInput.value = '';
    el.leewaySearchInput.placeholder = selectedName ? selectedName : 'Taip untuk cari objek (cth: liferaft, PIW, boat, skiff)...';
    el.leewaySearchInput.title = selectedName ? `Objek dipilih: ${selectedName} (Klik untuk cari/tukar)` : 'Pilih Objek Hanyutan';

    if (el.leewaySearchClear) {
      el.leewaySearchClear.style.display = 'none';
    }

    if (el.leewayComboboxMenu) {
      el.leewayComboboxMenu.querySelectorAll('.combobox-item').forEach(item => {
        if (currentVal && item.dataset.value === currentVal) {
          item.classList.add('selected');
        } else {
          item.classList.remove('selected');
        }
      });
    }
  }

  function openLeewayComboboxMenu() {
    if (el.leewayComboboxMenu) {
      el.leewayComboboxMenu.style.display = 'block';
    }
    if (el.leewayComboboxControl) {
      el.leewayComboboxControl.classList.add('active');
    }
  }

  function closeLeewayComboboxMenu() {
    if (el.leewayComboboxMenu) {
      el.leewayComboboxMenu.style.display = 'none';
    }
    if (el.leewayComboboxControl) {
      el.leewayComboboxControl.classList.remove('active');
    }
    if (el.leewaySearchInput) {
      el.leewaySearchInput.value = '';
      const currentVal = el.leewayTargetType ? el.leewayTargetType.value : '';
      const found = leewayComboboxOptions.find(o => o.value === currentVal);
      const targetObj = LEEWAY_TARGETS[currentVal];
      const selectedName = (found && currentVal) ? found.name : (targetObj ? targetObj.name : '');
      el.leewaySearchInput.placeholder = selectedName ? selectedName : 'Taip untuk cari objek (cth: liferaft, PIW, boat, skiff)...';
    }
    if (el.leewaySearchClear) {
      el.leewaySearchClear.style.display = 'none';
    }
  }

  function toggleLeewayComboboxMenu() {
    if (el.leewayComboboxMenu && el.leewayComboboxMenu.style.display === 'block') {
      closeLeewayComboboxMenu();
    } else {
      openLeewayComboboxMenu();
      renderLeewayComboboxMenu('');
    }
  }

  function onLeewayTargetChanged() {
    if (!el.leewayTargetType) return;
    const targetKey = el.leewayTargetType.value;

    syncLeewayComboboxUI();

    if (!targetKey) {
      if (el.leewayDivergence) el.leewayDivergence.value = '0';
      if (el.lwEInput) el.lwEInput.value = '0.00';
      if (el.resLweTargetLabel) el.resLweTargetLabel.textContent = 'Tiada Objek Dipilih';
      if (el.lwFormulaBannerText) el.lwFormulaBannerText.textContent = 'Formula: Sila pilih objek hanyutan SAR';
      if (el.leewayCustomRow) el.leewayCustomRow.style.display = 'none';
      if (el.lwSpeedPreview) el.lwSpeedPreview.value = '0.00 kts';
      if (el.lwDistPreview) el.lwDistPreview.textContent = '0.00 NM';

      state.leewayVector = null;
      state.isLeewayCalculated = false;
      updateLeewayUI();
      calculateFinalDatum();
      updateLeafletMap();
      saveAppState();
      return;
    }

    const target = LEEWAY_TARGETS[targetKey] || (targetKey === 'custom' ? { divergence: 20, errorE: 0.25, name: 'Custom Formula', category: 'Custom' } : null);
    if (!target) return;

    if (el.leewayDivergence) {
      el.leewayDivergence.value = target.divergence ? target.divergence.toFixed(0) : '0';
    }

    if (el.lwEInput) {
      el.lwEInput.value = target.errorE ? target.errorE.toFixed(2) : '0.00';
    }

    if (el.resLweTargetLabel) {
      el.resLweTargetLabel.textContent = target.name;
    }

    if (el.planSearchObject && target.name) {
      el.planSearchObject.value = target.name;
      if (typeof updateCaseInfoUI === 'function') updateCaseInfoUI();
    }

    let windSpeed = 0;
    if (state.isAswCalculated && state.aswResultant) {
      windSpeed = state.aswResultant.avgSpeed;
    } else if (el.aswSpeedInput) {
      windSpeed = parseFloat(el.aswSpeedInput.value) || 0;
    }

    if (el.lwFormulaBannerText) {
      el.lwFormulaBannerText.textContent = getLeewayFormulaDescription(targetKey, windSpeed);
    }

    if (el.leewayCustomRow) {
      el.leewayCustomRow.style.display = (targetKey === 'custom') ? 'flex' : 'none';
    }

    updateLeewayDistancePreview();
    calculateLeeway();
  }

  function updateLeewayDistancePreview() {
    let windSpeed = 0;
    if (state.isAswCalculated && state.aswResultant) {
      windSpeed = state.aswResultant.avgSpeed;
    } else if (el.aswSpeedInput) {
      windSpeed = parseFloat(el.aswSpeedInput.value) || 0;
    }

    if (el.lwAswSpeedDisplay) {
      el.lwAswSpeedDisplay.value = `${windSpeed.toFixed(2)} kts`;
    }

    const targetKey = el.leewayTargetType ? el.leewayTargetType.value : '';
    if (!targetKey) {
      if (el.lwSpeedPreview) el.lwSpeedPreview.value = '0.00 kts';
      if (el.lwDistPreview) el.lwDistPreview.textContent = '0.00 NM';
      if (el.lwFormulaBannerText) el.lwFormulaBannerText.textContent = 'Formula: Sila pilih objek hanyutan SAR';
      return;
    }

    const target = LEEWAY_TARGETS[targetKey];
    const lwSpeed = computeLeewaySpeed(targetKey, windSpeed);
    const time = parseFloat(el.lwTimeInput ? el.lwTimeInput.value : '1.0') || 1.0;
    const lwDist = lwSpeed * time;

    if (el.lwSpeedPreview) {
      el.lwSpeedPreview.value = `${lwSpeed.toFixed(2)} kts`;
    }
    if (el.lwDistPreview) {
      el.lwDistPreview.textContent = `${lwDist.toFixed(2)} NM`;
    }
    if (el.lwFormulaBannerText) {
      el.lwFormulaBannerText.textContent = getLeewayFormulaDescription(targetKey, windSpeed);
    }
  }

  function calculateLeeway() {
    const targetKey = el.leewayTargetType ? el.leewayTargetType.value : '';
    if (!targetKey) {
      state.leewayVector = null;
      state.isLeewayCalculated = false;
      updateLeewayUI();
      saveAppState();
      return;
    }

    let windSpeed = 0;
    let windBearing = 0;

    if (state.isAswCalculated && state.aswResultant) {
      windSpeed = state.aswResultant.avgSpeed;
      windBearing = state.aswResultant.bearing;
    } else {
      windSpeed = parseFloat(el.aswSpeedInput ? el.aswSpeedInput.value : '0.0') || 0;
      windBearing = parseFloat(el.aswBearingInput ? el.aswBearingInput.value : '000') || 0;
    }

    const target = LEEWAY_TARGETS[targetKey] || (targetKey === 'custom' ? { divergence: 20, errorE: 0.25, name: 'Custom Formula', category: 'Custom' } : null);
    if (!target) {
      state.leewayVector = null;
      state.isLeewayCalculated = false;
      updateLeewayUI();
      saveAppState();
      return;
    }

    const divergence = parseFloat(el.leewayDivergence ? el.leewayDivergence.value : (target.divergence || 0)) || (target.divergence || 0);
    const time = parseFloat(el.lwTimeInput ? el.lwTimeInput.value : '1.0') || 1.0;
    const errorE = parseFloat(el.lwEInput ? el.lwEInput.value : (target.errorE || 0)) || (target.errorE || 0);

    // Kira kelajuan Leeway mengikut formula dwikecerunan / piecewise IAMSAR
    const lwSpeed = computeLeewaySpeed(targetKey, windSpeed);

    const distance = lwSpeed * time;
    const downwindBearing = ((windBearing + 180) % 360 + 360) % 360;
    const leftTrack = ((downwindBearing - divergence) % 360 + 360) % 360;
    const rightTrack = ((downwindBearing + divergence) % 360 + 360) % 360;

    const { dx, dy } = calculateComponents(downwindBearing, distance);
    const { dx: dxL, dy: dyL } = calculateComponents(leftTrack, distance);
    const { dx: dxR, dy: dyR } = calculateComponents(rightTrack, distance);

    state.leewayVector = {
      targetType: targetKey,
      targetName: target.name,
      category: target.category,
      windSpeed,
      windBearing,
      speed: lwSpeed,
      time,
      distance,
      downwindBearing,
      leftTrack,
      rightTrack,
      divergence,
      dx,
      dy,
      dxL,
      dyL,
      dxR,
      dyR,
      errorE,
      isCalculated: true
    };
    state.isLeewayCalculated = true;

    updateLeewayUI();
    saveAppState();
  }

  function resetLeeway() {
    if (el.leewayTargetType) el.leewayTargetType.value = '';
    if (el.lwTimeInput) el.lwTimeInput.value = '1.0';
    if (el.leewayCustomPct) el.leewayCustomPct.value = '3.5';
    if (el.leewayDivergence) el.leewayDivergence.value = '0';
    if (el.lwEInput) el.lwEInput.value = '0.00';

    onLeewayTargetChanged();
  }

  function resetErrorParams(promptConfirm = false) {
    if (promptConfirm && !confirm('Adakah anda pasti mahu set semula (reset) semua parameter ralat IAMSAR ke nilai asal?')) {
      return;
    }

    if (el.errXFixInput) el.errXFixInput.value = '1.0';
    if (el.errXDrRateInput) el.errXDrRateInput.value = '0.0';
    if (el.errXDrDistInput) el.errXDrDistInput.value = '0.0';
    if (el.errXGlideInput) el.errXGlideInput.value = '0.0';

    const intervalVal = el.datumIntervalInput ? parseFloat(el.datumIntervalInput.value) : 1.0;
    if (el.errDeIntervalInput) el.errDeIntervalInput.value = (!isNaN(intervalVal) && intervalVal > 0) ? intervalVal.toFixed(1) : '1.0';

    const aswdvE = el.aswdvEInput ? (parseFloat(el.aswdvEInput.value) || 0.0) : 0.0;
    const twcE = state.twcMode === 'observed' ? (state.twcObserved?.twcE || 0.1) : (state.scResultant?.computedTwcE || 0.3);
    const lwE = state.leewayVector ? state.leewayVector.errorE : (el.lwEInput ? (parseFloat(el.lwEInput.value) || 0.25) : 0.25);
    const dve = Math.hypot(aswdvE, twcE, lwE);
    if (el.errDeDveInput) el.errDeDveInput.value = dve.toFixed(2);

    if (el.errYFixInput) el.errYFixInput.value = '0.1';
    if (el.errYDrRateInput) el.errYDrRateInput.value = '0.0';
    if (el.errYDrDistInput) el.errYDrDistInput.value = '0.0';

    calculateFinalDatum(true);
  }

  function resetAllDatumToDefaults() {
    if (!confirm('Adakah anda pasti mahu set semula (reset) semua data pengiraan Datum & simulasi ke setting lalai?')) {
      return;
    }

    // 1. Reset setiap komponen individu (ASW, WC, TWC, Leeway, Error)
    resetAsw();
    resetWc();
    resetObsTwc();
    resetSc();
    resetLeeway();
    resetErrorParams(false);

    // 2. Reset mod TWC ke 'computed' (Lalai)
    state.twcMode = 'computed';
    switchTwcMode('computed');

    // 4. Reset Tarikh & Masa kecemasan & datum
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    if (el.distressDateTimeInput) {
      el.distressDateTimeInput.value = now.toISOString().slice(0, 16);
    }
    if (el.datumDateTimeInput) {
      const datumTime = new Date(now.getTime() + 1 * 3600 * 1000);
      el.datumDateTimeInput.value = datumTime.toISOString().slice(0, 16);
    }

    // 5. Reset Koordinat Asal (Origin GPS) ke default
    state.originGeo.lat = DEFAULT_ORIGIN_GEO.lat;
    state.originGeo.lon = DEFAULT_ORIGIN_GEO.lon;
    if (el.originLatInput) el.originLatInput.value = formatCoordinate(DEFAULT_ORIGIN_GEO.lat, true);
    if (el.originLonInput) el.originLonInput.value = formatCoordinate(DEFAULT_ORIGIN_GEO.lon, false);

    // 6. Tutup simulasi Monte Carlo jika aktif & reset slider
    closeMonteCarlo();
    state.monteCarlo.currentTime = 0;
    updateMonteCarloTimeUI();

    // 7. Tutup drawer input jika terbuka
    closeDrawer();

    // 8. Kira semula dan kemas kini paparan Datum
    calculateTimeInterval();
    calculateFinalDatum();
    updateFinalDatumUI();
    saveAppState();

    if (state.displayMode === 'map') {
      updateLeafletMap();
    }
  }

  function updateLeewayUI() {
    if (state.isLeewayCalculated && state.leewayVector) {
      const v = state.leewayVector;
      if (el.lwStatusBadge) {
        el.lwStatusBadge.textContent = 'Telah Dikira';
        el.lwStatusBadge.classList.add('active');
      }
      if (el.resLwDownwind) el.resLwDownwind.textContent = `${formatNauticalBearing(v.downwindBearing)} T`;
      if (el.resLwDownwindCardinal) el.resLwDownwindCardinal.textContent = `${getCardinalDirection(v.downwindBearing)} (Arah Angin + 180°)`;
      if (el.resLwSpeed) el.resLwSpeed.textContent = `${v.speed.toFixed(2)} kts`;
      if (el.resLwSpeedKmh) el.resLwSpeedKmh.textContent = `≈ ${(v.speed * 1.852).toFixed(2)} km/j`;
      if (el.resLwDivergenceTracks) {
        el.resLwDivergenceTracks.textContent = `${formatNauticalBearing(v.leftTrack)} T / ${formatNauticalBearing(v.rightTrack)} T`;
      }
      if (el.resLwDivergenceSub) {
        el.resLwDivergenceSub.textContent = `Kiri (-${v.divergence.toFixed(2)}°) • Kanan (+${v.divergence.toFixed(2)}°)`;
      }
      if (el.resLwDist) el.resLwDist.textContent = `${v.distance.toFixed(2)} NM`;
      if (el.resLwTimeSub) el.resLwTimeSub.textContent = `${v.time.toFixed(2)} Jam Tempoh`;
      if (el.resLweVal) el.resLweVal.textContent = `${v.errorE.toFixed(2)} kts`;
      if (el.resLweTargetLabel) el.resLweTargetLabel.textContent = v.targetName;

      if (el.summaryLwVal) {
        el.summaryLwVal.textContent = `${v.targetName} (${v.speed.toFixed(2)} kts • ${v.distance.toFixed(2)} NM)`;
      }
    } else {
      if (el.lwStatusBadge) {
        el.lwStatusBadge.textContent = 'Menunggu Input';
        el.lwStatusBadge.classList.remove('active');
      }
      if (el.resLwDownwind) el.resLwDownwind.textContent = '---°';
      if (el.resLwDownwindCardinal) el.resLwDownwindCardinal.textContent = 'Arah Angin + 180°';
      if (el.resLwSpeed) el.resLwSpeed.textContent = '0.00 kts';
      if (el.resLwSpeedKmh) el.resLwSpeedKmh.textContent = '-';
      if (el.resLwDivergenceTracks) el.resLwDivergenceTracks.textContent = '---° / ---°';
      if (el.resLwDivergenceSub) el.resLwDivergenceSub.textContent = 'Kiri / Kanan';
      if (el.resLwDist) el.resLwDist.textContent = '0.00 NM';
      if (el.resLwTimeSub) el.resLwTimeSub.textContent = '0.00 Jam Tempoh';
      if (el.resLweVal) el.resLweVal.textContent = '0.00 kts';
      if (el.resLweTargetLabel) el.resLweTargetLabel.textContent = 'Tiada Objek Dipilih';

      if (el.summaryLwVal) {
        el.summaryLwVal.textContent = 'Tiada Objek Dipilih';
      }
    }
  }

  // =========================================================================
  // PENGIRAAN DATUM SAR AKHIR (IAMSAR VOL 2 APPENDIX K)
  // =========================================================================

  function calculateFinalDatum(forceCalculate = false) {
    // 0. Kemaskini koordinat origin dan selang masa secara langsung dari input aktif DOM
    if (el.originLatInput && el.originLonInput) {
      const parsedLat = parseCoordinate(el.originLatInput.value, true);
      const parsedLon = parseCoordinate(el.originLonInput.value, false);
      if (!isNaN(parsedLat) && !isNaN(parsedLon)) {
        state.originGeo.lat = parsedLat;
        state.originGeo.lon = parsedLon;
      }
    }
    calculateTimeInterval();

    if (forceCalculate) {
      // 1. Kemaskini ASW jika ada data vektor
      if (state.aswVectors.length > 0) {
        calculateAswResultant();
      }

      // 2. Kemaskini TWC secara langsung dari borang aktif
      if (state.twcMode === 'observed') {
        const bearing = parseFloat(el.twcObsBearingInput ? el.twcObsBearingInput.value : '180') || 0;
        const speed = parseFloat(el.twcObsSpeedInput ? el.twcObsSpeedInput.value : '1.0') || 0;
        const time = parseFloat(el.twcObsTimeInput ? el.twcObsTimeInput.value : '1.0') || 1.0;

        const normBearing = ((bearing % 360) + 360) % 360;
        const distance = speed * time;
        const { dx, dy } = calculateComponents(normBearing, distance);
        const source = el.twcObsSourceInput ? el.twcObsSourceInput.value : 'DMB (Datum Marker Buoy)';
        const quality = el.twcObsQualitySelect ? el.twcObsQualitySelect.value : 'good';
        const twcE = el.twcObsEInput ? (parseFloat(el.twcObsEInput.value) || 0.1) : 0.1;

        state.twcObserved = {
          source,
          bearing: normBearing,
          speed,
          time,
          distance,
          dx,
          dy,
          quality,
          twcE,
          isCalculated: true
        };
        updateObsTwcUI();
      } else {
        calculateScResultant();
      }

      // 3. Kemaskini Leeway secara dinamik & segar dari input terkini
      calculateLeeway();
    } else {
      // Mod bukan paksa: Pastikan ASW & Leeway dikira jika belum aktif
      if (state.aswVectors.length > 0 && !state.isAswCalculated) {
        calculateAswResultant();
      }
      if (!state.isLeewayCalculated || !state.leewayVector) {
        calculateLeeway();
      }
    }

    // Pastikan TWC dikira terlebih dahulu sebelum menjana Final Datum
    const isTwcCalculated = (state.twcMode === 'observed' && state.twcObserved && state.twcObserved.isCalculated) ||
                            (state.twcMode === 'computed' && state.isScCalculated);

    if (!isTwcCalculated) {
      state.finalDatum = null;
      updateTotalDriftUI();
      updateFinalDatumUI();
      return;
    }

    const aswRes = state.aswResultant;
    const windSpeed = aswRes ? aswRes.avgSpeed : (parseFloat(el.aswSpeedInput ? el.aswSpeedInput.value : '0') || 0);
    const windBearing = aswRes ? aswRes.bearing : (parseFloat(el.aswBearingInput ? el.aswBearingInput.value : '0') || 0);
    
    // Gunakan nilai interval jika pengguna masukkan di cockpit (lalai 1.0 jam)
    const intervalVal = el.datumIntervalInput ? parseFloat(el.datumIntervalInput.value) : 1.0;
    const totalDurationHours = (!isNaN(intervalVal) && intervalVal > 0) ? intervalVal : 1.0;

    // 4. Vektor Leeway
    const lw = state.leewayVector;
    const leewaySpeed = lw ? lw.speed : 0;
    const leewayDist = leewaySpeed * totalDurationHours;
    const downwindBearing = lw ? lw.downwindBearing : ((windBearing + 180) % 360);
    const leftTrack = lw ? lw.leftTrack : downwindBearing;
    const rightTrack = lw ? lw.rightTrack : downwindBearing;
    const divergence = lw ? lw.divergence : (el.leewayDivergence ? (parseFloat(el.leewayDivergence.value) || 0) : 0);

    const { dx: lwDx, dy: lwDy } = calculateComponents(downwindBearing, leewayDist);
    const { dx: lwDxL, dy: lwDyL } = calculateComponents(leftTrack, leewayDist);
    const { dx: lwDxR, dy: lwDyR } = calculateComponents(rightTrack, leewayDist);

    // 5. Total Water Current (TWC) Displacement & Error
    let twcDx = 0, twcDy = 0, twcDist = 0, twcSpeed = 0, twcBearing = 0, twcE = 0.3;

    if (state.twcMode === 'observed') {
      const obs = state.twcObserved || { dx: 0, dy: 0, distance: 0, speed: 0, bearing: 0, twcE: 0.1 };
      twcSpeed = obs.speed || 0;
      twcBearing = obs.bearing || 0;
      twcDist = twcSpeed * totalDurationHours;
      const { dx, dy } = calculateComponents(twcBearing, twcDist);
      twcDx = dx;
      twcDy = dy;
      twcE = obs.twcE || 0.1;
    } else {
      // Computed TWC
      const comp = state.scResultant || { dx: 0, dy: 0, speed: 0, bearing: 0, computedTwcE: 0.3 };
      twcSpeed = comp.speed || comp.avgSpeed || 0;
      twcBearing = comp.bearing || 0;
      twcDist = twcSpeed * totalDurationHours;
      twcDx = (comp.dx || 0) * totalDurationHours;
      twcDy = (comp.dy || 0) * totalDurationHours;
      twcE = comp.computedTwcE || 0.3;
    }

    // 6. Total Drift Vector: D_total = TWC + Leeway
    // A. Center Datum (Downwind)
    const totalDx = twcDx + lwDx;
    const totalDy = twcDy + lwDy;
    const totalDriftDist = Math.hypot(totalDx, totalDy);
    const totalDriftBearing = totalDriftDist > 0.0001 ? cartesianToNauticalBearing(totalDx, totalDy) : 0;

    // B. Left Datum (Divergence Kiri)
    const totalDxL = twcDx + lwDxL;
    const totalDyL = twcDy + lwDyL;
    const totalDriftDistL = Math.hypot(totalDxL, totalDyL);
    const totalDriftBearingL = totalDriftDistL > 0.0001 ? cartesianToNauticalBearing(totalDxL, totalDyL) : 0;

    // C. Right Datum (Divergence Kanan)
    const totalDxR = twcDx + lwDxR;
    const totalDyR = twcDy + lwDyR;
    const totalDriftDistR = Math.hypot(totalDxR, totalDyR);
    const totalDriftBearingR = totalDriftDistR > 0.0001 ? cartesianToNauticalBearing(totalDxR, totalDyR) : 0;

    // 7. Final Datum GPS Coordinates (Center, Left, Right)
    const originLat = state.originGeo.lat;
    const originLon = state.originGeo.lon;
    
    const datumCoords = totalDriftDist > 0
      ? calculateDestinationPoint(originLat, originLon, totalDriftBearing, totalDriftDist)
      : { lat: originLat, lon: originLon };

    const datumCoordsL = totalDriftDistL > 0
      ? calculateDestinationPoint(originLat, originLon, totalDriftBearingL, totalDriftDistL)
      : datumCoords;

    const datumCoordsR = totalDriftDistR > 0
      ? calculateDestinationPoint(originLat, originLon, totalDriftBearingR, totalDriftDistR)
      : datumCoords;

    // 8. Divergence Datum (DD) Separation Distance (IAMSAR Vol 2)
    // Jarak pemisahan fizikal garis lurus antara Datum L dan Datum R
    const divergenceDatumDist = Math.hypot(totalDxR - totalDxL, totalDyR - totalDyL);

    // 9. Total Probable Error of Position (E) & Search Radius (R) mengikut IAMSAR (Vol 2 App. K)
    // --- Bahagian A: Probable Initial Position Error (X) ---
    const xFix = el.errXFixInput ? (parseFloat(el.errXFixInput.value) || 0.0) : 1.0;
    const xDrRate = el.errXDrRateInput ? (parseFloat(el.errXDrRateInput.value) || 0.0) : 0.0;
    const xDrDist = el.errXDrDistInput ? (parseFloat(el.errXDrDistInput.value) || 0.0) : 0.0;
    const xDrNav = (xDrRate / 100.0) * xDrDist;
    const xGlide = el.errXGlideInput ? (parseFloat(el.errXGlideInput.value) || 0.0) : 0.0;
    const X = Math.round((xFix + xDrNav + xGlide) * 1000) / 1000;

    // --- Bahagian B: Total Probable Drift Error (De) ---
    const aswdvE = el.aswdvEInput ? (parseFloat(el.aswdvEInput.value) || 0.0) : 0.0;
    const lwE = lw ? lw.errorE : (el.lwEInput ? (parseFloat(el.lwEInput.value) || 0.0) : 0.0);
    const computedDve = Math.hypot(aswdvE, twcE, lwE);
    
    let dve = computedDve;
    if (el.errDeDveInput && el.errDeDveInput.value !== '') {
      const parsedDve = parseFloat(el.errDeDveInput.value);
      if (!isNaN(parsedDve) && parsedDve >= 0) {
        dve = parsedDve;
      }
    } else if (el.errDeDveInput) {
      el.errDeDveInput.value = computedDve.toFixed(2);
    }

    const driftInterval = el.errDeIntervalInput ? (parseFloat(el.errDeIntervalInput.value) || totalDurationHours) : totalDurationHours;
    const de = Math.round(dve * driftInterval * 1000) / 1000;

    // --- Bahagian C: Probable Search Facility Position Error (Y) ---
    const yFix = el.errYFixInput ? (parseFloat(el.errYFixInput.value) || 0.0) : 0.1;
    const yDrRate = el.errYDrRateInput ? (parseFloat(el.errYDrRateInput.value) || 0.0) : 0.0;
    const yDrDist = el.errYDrDistInput ? (parseFloat(el.errYDrDistInput.value) || 0.0) : 0.0;
    const yDrNav = (yDrRate / 100.0) * yDrDist;
    const Y = Math.round((yFix + yDrNav) * 1000) / 1000;

    // --- Bahagian D: Total Probable Error of Position (E) ---
    const sumSquaredErrors = Math.round(((X * X) + (de * de) + (Y * Y)) * 1000) / 1000;
    const E = Math.round(Math.sqrt(sumSquaredErrors) * 100) / 100;
    const safetyFactor = 1.1;
    const searchRadius = Math.round(safetyFactor * E * 100) / 100;
    const searchArea = Math.round(4 * searchRadius * searchRadius * 100) / 100;
    const separationRatio = E > 0 ? (Math.round((divergenceDatumDist / E) * 100) / 100) : 0.0;

    const targetLabel = lw ? lw.targetName : 'Tiada Objek Dipilih';

    state.finalDatum = {
      originLat,
      originLon,
      datumLat: datumCoords.lat,
      datumLon: datumCoords.lon,
      datumLatL: datumCoordsL.lat,
      datumLonL: datumCoordsL.lon,
      datumLatR: datumCoordsR.lat,
      datumLonR: datumCoordsR.lon,
      twcDx,
      twcDy,
      lwDx,
      lwDy,
      lwDxL,
      lwDyL,
      lwDxR,
      lwDyR,
      totalDx,
      totalDy,
      totalDxL,
      totalDyL,
      totalDxR,
      totalDyR,
      totalDriftDist,
      totalDriftBearing,
      totalDriftDistL,
      totalDriftBearingL,
      totalDriftDistR,
      totalDriftBearingR,
      divergenceDatumDist,
      separationRatio,
      windSpeed,
      windBearing,
      downwindBearing,
      leftTrack,
      rightTrack,
      divergence,
      leewaySpeed,
      leewayDist,
      scDist: twcDist,
      twcDist,
      scBearing: twcBearing,
      searchRadius,
      searchArea,
      errorE: E,
      errorX: X,
      xFix,
      xDrRate,
      xDrDist,
      xDrNav,
      xGlide,
      errorDe: de,
      dve,
      computedDve,
      driftInterval,
      errorY: Y,
      yFix,
      yDrRate,
      yDrDist,
      yDrNav,
      sumSquaredErrors,
      aswdvE,
      twcE,
      lwE,
      de,
      durationHours: totalDurationHours,
      targetType: lw ? lw.targetType : '',
      targetLabel
    };

    updateTotalDriftUI();
    updateFinalDatumUI();
    saveAppState();

    // Pastikan peta aktif & kemaskini plotting HANYA jika berada di Tab Datum / Planning
    if (state.activeTab !== 'vector') {
      if (state.displayMode !== 'map') {
        switchDisplayMode('map');
      } else {
        updateLeafletMap();
      }
    }
  }

  function updateTotalDriftUI() {
    if (!state.finalDatum) {
      if (el.driftTableTbody) {
        el.driftTableTbody.innerHTML = `
          <tr class="empty-row">
            <td colspan="7">Belum ada data paduan. Sila klik "Kira Paduan Total Drift" di bawah.</td>
          </tr>
        `;
      }
      if (el.driftStatusBadge) {
        el.driftStatusBadge.textContent = 'Menunggu Pengiraan';
        el.driftStatusBadge.classList.remove('active');
      }
      if (el.resDriftDist) el.resDriftDist.textContent = '0.00 NM';
      if (el.resDriftDistKm) el.resDriftDistKm.textContent = '≈ 0.00 km';
      if (el.resDriftBearing) el.resDriftBearing.textContent = '---°';
      if (el.resDriftCardinal) el.resDriftCardinal.textContent = '-';
      if (el.resDriftSpeed) el.resDriftSpeed.textContent = '--- kts';
      if (el.resDriftSpeedKmh) el.resDriftSpeedKmh.textContent = '-';
      if (el.resDriftTime) el.resDriftTime.textContent = '0.00 Jam';
      if (el.resDriftDivL) el.resDriftDivL.textContent = '0.00 NM (---°)';
      if (el.resDriftDivR) el.resDriftDivR.textContent = '0.00 NM (---°)';
      if (el.resDriftMathText) {
        el.resDriftMathText.textContent = 'Sila klik butang "Kira Paduan Total Drift" di bawah untuk menjana pengiraan komponen.';
      }
      return;
    }

    const fd = state.finalDatum;
    const dur = fd.durationHours || 1.0;
    const twcSpeed = (fd.twcDist || fd.scDist || 0) / dur;
    const totalSpeed = fd.totalDriftDist / dur;
    const totalSpeedL = fd.totalDriftDistL / dur;
    const totalSpeedR = fd.totalDriftDistR / dur;

    if (el.driftStatusBadge) {
      el.driftStatusBadge.textContent = 'Telah Dikira';
      el.driftStatusBadge.classList.add('active');
    }

    // Results cards
    if (el.resDriftDist) el.resDriftDist.textContent = `${fd.totalDriftDist.toFixed(2)} NM`;
    if (el.resDriftDistKm) el.resDriftDistKm.textContent = `≈ ${(fd.totalDriftDist * 1.852).toFixed(2)} km`;
    if (el.resDriftBearing) el.resDriftBearing.textContent = `${formatNauticalBearing(fd.totalDriftBearing)} T`;
    if (el.resDriftCardinal) el.resDriftCardinal.textContent = getCardinalDirection(fd.totalDriftBearing);
    if (el.resDriftSpeed) el.resDriftSpeed.textContent = `${totalSpeed.toFixed(2)} kts`;
    if (el.resDriftSpeedKmh) el.resDriftSpeedKmh.textContent = `≈ ${(totalSpeed * 1.852).toFixed(2)} km/j`;
    if (el.resDriftTime) el.resDriftTime.textContent = `${dur.toFixed(2)} Jam`;
    if (el.resDriftDivL) el.resDriftDivL.textContent = `${fd.totalDriftDistL.toFixed(2)} NM (${formatNauticalBearing(fd.totalDriftBearingL)} T)`;
    if (el.resDriftDivR) el.resDriftDivR.textContent = `${fd.totalDriftDistR.toFixed(2)} NM (${formatNauticalBearing(fd.totalDriftBearingR)} T)`;

    // Table rows
    if (el.driftTableTbody) {
      let rows = `
        <tr style="background: rgba(56, 189, 248, 0.05);">
          <td><span class="badge" style="background:#0284c7; color:#fff;">1. TWC</span> Total Water Current</td>
          <td>${formatNauticalBearing(fd.scBearing)} T</td>
          <td>${twcSpeed.toFixed(2)} kts</td>
          <td>${dur.toFixed(2)} j</td>
          <td><strong>${(fd.twcDist || fd.scDist || 0).toFixed(2)} NM</strong></td>
          <td>${(fd.twcDx >= 0 ? '+' : '')}${(fd.twcDx || 0).toFixed(2)}</td>
          <td>${(fd.twcDy >= 0 ? '+' : '')}${(fd.twcDy || 0).toFixed(2)}</td>
        </tr>
        <tr style="background: rgba(245, 158, 11, 0.05);">
          <td><span class="badge" style="background:#d97706; color:#fff;">2. LW</span> Leeway (${fd.targetLabel || 'Target'})</td>
          <td>${formatNauticalBearing(fd.downwindBearing)} T</td>
          <td>${fd.leewaySpeed.toFixed(2)} kts</td>
          <td>${dur.toFixed(2)} j</td>
          <td><strong>${fd.leewayDist.toFixed(2)} NM</strong></td>
          <td>${(fd.lwDx >= 0 ? '+' : '')}${(fd.lwDx || 0).toFixed(2)}</td>
          <td>${(fd.lwDy >= 0 ? '+' : '')}${(fd.lwDy || 0).toFixed(2)}</td>
        </tr>
        <tr style="background: rgba(139, 92, 246, 0.12); font-weight: 700;">
          <td><span class="badge" style="background:#7c3aed; color:#fff;">🎯 D</span> Total Surface Drift (Pusat)</td>
          <td>${formatNauticalBearing(fd.totalDriftBearing)} T (${getCardinalDirection(fd.totalDriftBearing)})</td>
          <td>${totalSpeed.toFixed(2)} kts</td>
          <td>${dur.toFixed(2)} j</td>
          <td><strong style="color:#a78bfa;">${fd.totalDriftDist.toFixed(2)} NM</strong></td>
          <td>${(fd.totalDx >= 0 ? '+' : '')}${(fd.totalDx || 0).toFixed(2)}</td>
          <td>${(fd.totalDy >= 0 ? '+' : '')}${(fd.totalDy || 0).toFixed(2)}</td>
        </tr>
      `;

      if (fd.divergence > 0) {
        rows += `
          <tr style="color: var(--accent-cyan);">
            <td><span class="badge" style="background:#0891b2; color:#fff;">📍 DL</span> Cabang Divergence Kiri (-${fd.divergence.toFixed(1)}°)</td>
            <td>${formatNauticalBearing(fd.totalDriftBearingL)} T</td>
            <td>${totalSpeedL.toFixed(2)} kts</td>
            <td>${dur.toFixed(2)} j</td>
            <td><strong>${fd.totalDriftDistL.toFixed(2)} NM</strong></td>
            <td>${(fd.totalDxL >= 0 ? '+' : '')}${(fd.totalDxL || 0).toFixed(2)}</td>
            <td>${(fd.totalDyL >= 0 ? '+' : '')}${(fd.totalDyL || 0).toFixed(2)}</td>
          </tr>
          <tr style="color: #c084fc;">
            <td><span class="badge" style="background:#9333ea; color:#fff;">📍 DR</span> Cabang Divergence Kanan (+${fd.divergence.toFixed(1)}°)</td>
            <td>${formatNauticalBearing(fd.totalDriftBearingR)} T</td>
            <td>${totalSpeedR.toFixed(2)} kts</td>
            <td>${dur.toFixed(2)} j</td>
            <td><strong>${fd.totalDriftDistR.toFixed(2)} NM</strong></td>
            <td>${(fd.totalDxR >= 0 ? '+' : '')}${(fd.totalDxR || 0).toFixed(2)}</td>
            <td>${(fd.totalDyR >= 0 ? '+' : '')}${(fd.totalDyR || 0).toFixed(2)}</td>
          </tr>
        `;
      }
      el.driftTableTbody.innerHTML = rows;
    }

    // Step-by-step Math text
    if (el.resDriftMathText) {
      el.resDriftMathText.textContent = 
`================ RESOLUSI VEKTOR TOTAL SURFACE DRIFT ================
1. VEKTOR TOTAL WATER CURRENT (TWC):
   • Arah Set (θ_twc) = ${formatNauticalBearing(fd.scBearing)} T, Jarak (L_twc) = ${(fd.twcDist || fd.scDist || 0).toFixed(2)} NM (${dur.toFixed(2)} jam @ ${twcSpeed.toFixed(2)} kts)
   • ΔX_twc (Timur)   = ${(fd.twcDist || fd.scDist || 0).toFixed(2)} × Sin(${formatNauticalBearing(fd.scBearing)}) = ${(fd.twcDx || 0).toFixed(2)} NM
   • ΔY_twc (Utara)   = ${(fd.twcDist || fd.scDist || 0).toFixed(2)} × Cos(${formatNauticalBearing(fd.scBearing)}) = ${(fd.twcDy || 0).toFixed(2)} NM

2. VEKTOR LEEWAY DRIFT (LW - DOWNWIND PUSAT):
   • Sasaran          = ${fd.targetLabel}
   • Arah Downwind    = ${formatNauticalBearing(fd.downwindBearing)} T, Jarak (L_lw) = ${fd.leewayDist.toFixed(2)} NM (${dur.toFixed(2)} jam @ ${fd.leewaySpeed.toFixed(2)} kts)
   • ΔX_lw (Timur)    = ${fd.leewayDist.toFixed(2)} × Sin(${formatNauticalBearing(fd.downwindBearing)}) = ${(fd.lwDx || 0).toFixed(2)} NM
   • ΔY_lw (Utara)    = ${fd.leewayDist.toFixed(2)} × Cos(${formatNauticalBearing(fd.downwindBearing)}) = ${(fd.lwDy || 0).toFixed(2)} NM

3. PADUAN TOTAL SURFACE DRIFT PUSAT (D_total = TWC + LW):
   • ΔX_total = ${(fd.twcDx || 0).toFixed(2)} + ${(fd.lwDx || 0).toFixed(2)} = ${(fd.totalDx || 0).toFixed(2)} NM
   • ΔY_total = ${(fd.twcDy || 0).toFixed(2)} + ${(fd.lwDy || 0).toFixed(2)} = ${(fd.totalDy || 0).toFixed(2)} NM
   • Jarak Anjakan (D)   = √((${(fd.totalDx || 0).toFixed(2)})² + (${(fd.totalDy || 0).toFixed(2)})²) = ${fd.totalDriftDist.toFixed(2)} NM (≈ ${(fd.totalDriftDist * 1.852).toFixed(2)} km)
   • Haluan Paduan (Track) = atan2(${(fd.totalDx || 0).toFixed(2)}, ${(fd.totalDy || 0).toFixed(2)}) = ${formatNauticalBearing(fd.totalDriftBearing)} T (${getCardinalDirection(fd.totalDriftBearing)})
   • Purata Kelajuan Drift = ${fd.totalDriftDist.toFixed(2)} NM / ${dur.toFixed(2)} jam = ${totalSpeed.toFixed(2)} kts` +
(fd.divergence > 0 ? `

4. CABANG DIVERGENCE (IAMSAR VOL 2):
   • Divergence Track Kiri  = ${formatNauticalBearing(fd.totalDriftBearingL)} T | Jarak (DL) = ${fd.totalDriftDistL.toFixed(2)} NM (@ ${totalSpeedL.toFixed(2)} kts)
   • Divergence Track Kanan = ${formatNauticalBearing(fd.totalDriftBearingR)} T | Jarak (DR) = ${fd.totalDriftDistR.toFixed(2)} NM (@ ${totalSpeedR.toFixed(2)} kts)
   • Divergence Datum (DD)  = ${(fd.divergenceDatumDist || 0).toFixed(2)} NM (Jarak pemisahan Datum L ↔ Datum R)` : '');
    }
  }

  function updateFinalDatumUI() {
    if (!state.finalDatum) {
      if (el.datumStatusBadge) {
        el.datumStatusBadge.textContent = 'Menunggu Pengiraan';
        el.datumStatusBadge.classList.remove('active');
      }
      if (el.datumCoordsTbody) {
        el.datumCoordsTbody.innerHTML = `
          <tr class="empty-row">
            <td colspan="6">Belum ada data kedudukan datum. Sila klik "Kira / Kemaskini Datum" di bawah.</td>
          </tr>
        `;
      }
      if (el.resDatumLatL) el.resDatumLatL.textContent = '---';
      if (el.resDatumLonL) el.resDatumLonL.textContent = '---';
      if (el.resDatumDriftL) el.resDatumDriftL.textContent = '0.00 NM';
      if (el.resDatumTrackL) el.resDatumTrackL.textContent = '---°';
      if (el.badgeDatumLTrack) el.badgeDatumLTrack.textContent = 'Track L: ---°';
      if (el.resDatumLatR) el.resDatumLatR.textContent = '---';
      if (el.resDatumLonR) el.resDatumLonR.textContent = '---';
      if (el.resDatumDriftR) el.resDatumDriftR.textContent = '0.00 NM';
      if (el.resDatumTrackR) el.resDatumTrackR.textContent = '---°';
      if (el.badgeDatumRTrack) el.badgeDatumRTrack.textContent = 'Track R: ---°';
      if (el.resDatumDD) el.resDatumDD.textContent = '0.00 NM';
      if (el.resDatumDDKm) el.resDatumDDKm.textContent = '≈ 0.00 km (Pemisahan L ↔ R)';
      if (el.resDatumDve) el.resDatumDve.textContent = '0.00 kts';
      if (el.resDatumDe) el.resDatumDe.textContent = '0.00 NM';
      if (el.resDatumDivAngle) el.resDatumDivAngle.textContent = '± 0.0°';
      if (el.resErrXDrNav) el.resErrXDrNav.value = '0.00 NM';
      if (el.resErrorX) el.resErrorX.textContent = '1.00 NM';
      if (el.resErrorDe) el.resErrorDe.textContent = '0.00 NM';
      if (el.resErrYDrNav) el.resErrYDrNav.value = '0.00 NM';
      if (el.resErrorY) el.resErrorY.textContent = '0.10 NM';
      if (el.resErrorSumsq) el.resErrorSumsq.textContent = '1.01 NM²';
      if (el.resErrorE) el.resErrorE.textContent = '1.00 NM';
      if (el.resErrorSr) el.resErrorSr.textContent = '0.00';
      if (el.resErrorSrSub) el.resErrorSrSub.textContent = 'SR = DD / E';
      if (el.resErrorR) el.resErrorR.textContent = '1.10 NM';
      if (el.resErrorArea) el.resErrorArea.textContent = '4.84 NM²';
      if (el.summaryDriftVal) el.summaryDriftVal.textContent = '0.00 NM • Arah: ---°';
      if (el.summaryDatumVal) el.summaryDatumVal.textContent = `Lat: ${formatCoordinate(state.originGeo.lat, true)} | Lon: ${formatCoordinate(state.originGeo.lon, false)}`;
      if (el.summaryErrorVal) el.summaryErrorVal.textContent = 'E: 1.00 NM | SR: 0.00 | R: 1.10 NM';

      updateTotalDriftUI();
      return;
    }
    const fd = state.finalDatum;
    const dd = typeof fd.divergenceDatumDist === 'number' ? fd.divergenceDatumDist : (Math.hypot((fd.totalDxR || 0) - (fd.totalDxL || 0), (fd.totalDyR || 0) - (fd.totalDyL || 0)));

    if (el.datumStatusBadge) {
      el.datumStatusBadge.textContent = 'Telah Dikira';
      el.datumStatusBadge.classList.add('active');
    }

    // 1. Dual Datum Hero Cards (Datum L & Datum R)
    if (el.resDatumLatL) el.resDatumLatL.textContent = formatCoordinate(fd.datumLatL, true);
    if (el.resDatumLonL) el.resDatumLonL.textContent = formatCoordinate(fd.datumLonL, false);
    if (el.resDatumDriftL) el.resDatumDriftL.textContent = `${fd.totalDriftDistL.toFixed(2)} NM`;
    if (el.resDatumTrackL) el.resDatumTrackL.textContent = `${formatNauticalBearing(fd.totalDriftBearingL)} T (${getCardinalDirection(fd.totalDriftBearingL)})`;
    if (el.badgeDatumLTrack) el.badgeDatumLTrack.textContent = `Track L: ${formatNauticalBearing(fd.totalDriftBearingL)}`;

    if (el.resDatumLatR) el.resDatumLatR.textContent = formatCoordinate(fd.datumLatR, true);
    if (el.resDatumLonR) el.resDatumLonR.textContent = formatCoordinate(fd.datumLonR, false);
    if (el.resDatumDriftR) el.resDatumDriftR.textContent = `${fd.totalDriftDistR.toFixed(2)} NM`;
    if (el.resDatumTrackR) el.resDatumTrackR.textContent = `${formatNauticalBearing(fd.totalDriftBearingR)} T (${getCardinalDirection(fd.totalDriftBearingR)})`;
    if (el.badgeDatumRTrack) el.badgeDatumRTrack.textContent = `Track R: ${formatNauticalBearing(fd.totalDriftBearingR)}`;

    // 2. Divergence Datum (DD) & Drift Velocity Error (DVe) (IAMSAR Vol 2)
    const aswdvEVal = typeof fd.aswdvE === 'number' ? fd.aswdvE : (parseFloat(el.aswdvEInput ? el.aswdvEInput.value : '0.5') || 0.0);
    const twcEVal = typeof fd.twcE === 'number' ? fd.twcE : 0.3;
    const lwEVal = typeof fd.lwE === 'number' ? fd.lwE : 0.25;
    const dve = typeof fd.dve === 'number' ? fd.dve : Math.hypot(aswdvEVal, twcEVal, lwEVal);
    const de = typeof fd.de === 'number' ? fd.de : (dve * (fd.durationHours || 1.0));

    if (el.resDatumDD) el.resDatumDD.textContent = `${dd.toFixed(2)} NM`;
    if (el.resDatumDDKm) el.resDatumDDKm.textContent = `≈ ${(dd * 1.852).toFixed(2)} km (Pemisahan L ↔ R)`;
    if (el.resDatumDve) el.resDatumDve.textContent = `${dve.toFixed(2)} kts`;
    if (el.resDatumDveFormula) el.resDatumDveFormula.innerHTML = `DV<sub>e</sub> = &radic;(${aswdvEVal.toFixed(2)}&sup2; + ${twcEVal.toFixed(2)}&sup2; + ${lwEVal.toFixed(2)}&sup2;)`;
    if (el.resDatumDivAngle) el.resDatumDivAngle.textContent = `± ${(fd.divergence || 0).toFixed(1)}°`;
    if (el.resDatumDe) el.resDatumDe.textContent = `${de.toFixed(2)} NM`;
    if (el.resDatumDeSub) el.resDatumDeSub.innerHTML = `D<sub>e</sub> = ${dve.toFixed(2)} kts &times; ${(fd.durationHours || 1.0).toFixed(1)} j`;

    if (el.resDatumDdDriftL) el.resDatumDdDriftL.textContent = `${fd.totalDriftDistL.toFixed(2)} NM`;
    if (el.resDatumDdTrackL) el.resDatumDdTrackL.textContent = `Track L: ${formatNauticalBearing(fd.totalDriftBearingL)}`;
    if (el.resDatumDdDriftR) el.resDatumDdDriftR.textContent = `${fd.totalDriftDistR.toFixed(2)} NM`;
    if (el.resDatumDdTrackR) el.resDatumDdTrackR.textContent = `Track R: ${formatNauticalBearing(fd.totalDriftBearingR)}`;

    // Legacy elements compatibility
    if (el.resDatumLat) el.resDatumLat.textContent = formatCoordinate(fd.datumLat, true);
    if (el.resDatumLon) el.resDatumLon.textContent = formatCoordinate(fd.datumLon, false);
    if (el.resDatumDrift) el.resDatumDrift.textContent = `${fd.totalDriftDist.toFixed(2)} NM`;
    if (el.resDatumTrack) el.resDatumTrack.textContent = `Arah: ${formatNauticalBearing(fd.totalDriftBearing)} (${getCardinalDirection(fd.totalDriftBearing)})`;

    // 3. Coordinate Summary Table (Hanya Origin, Datum L, Datum R, dan DD)
    if (el.datumCoordsTbody) {
      el.datumCoordsTbody.innerHTML = `
        <tr style="background: rgba(16, 185, 129, 0.05);">
          <td><strong style="color: #34d399;">🏁 1. Origin (LKP)</strong></td>
          <td>${formatCoordinate(fd.originLat, true)}</td>
          <td>${formatCoordinate(fd.originLon, false)}</td>
          <td>---</td>
          <td><strong>0.00 NM</strong></td>
          <td><span class="badge" style="background: #059669; color:#fff;">Titik Mula Kejadian</span></td>
        </tr>
        <tr style="background: rgba(56, 189, 248, 0.08);">
          <td><strong style="color: #38bdf8;">📍 2. Datum L (Kiri)</strong></td>
          <td><strong style="color: #38bdf8;">${formatCoordinate(fd.datumLatL, true)}</strong></td>
          <td><strong style="color: #38bdf8;">${formatCoordinate(fd.datumLonL, false)}</strong></td>
          <td>${formatNauticalBearing(fd.totalDriftBearingL)} T</td>
          <td><strong style="color: #38bdf8;">${fd.totalDriftDistL.toFixed(2)} NM</strong></td>
          <td><span class="badge" style="background: #0284c7; color:#fff;">Cabang Sisihan Kiri (-${(fd.divergence || 0).toFixed(1)}°)</span></td>
        </tr>
        <tr style="background: rgba(192, 132, 252, 0.08);">
          <td><strong style="color: #c084fc;">📍 3. Datum R (Kanan)</strong></td>
          <td><strong style="color: #c084fc;">${formatCoordinate(fd.datumLatR, true)}</strong></td>
          <td><strong style="color: #c084fc;">${formatCoordinate(fd.datumLonR, false)}</strong></td>
          <td>${formatNauticalBearing(fd.totalDriftBearingR)} T</td>
          <td><strong style="color: #c084fc;">${fd.totalDriftDistR.toFixed(2)} NM</strong></td>
          <td><span class="badge" style="background: #7e22ce; color:#fff;">Cabang Sisihan Kanan (+${(fd.divergence || 0).toFixed(1)}°)</span></td>
        </tr>
        <tr style="background: rgba(245, 158, 11, 0.12); font-weight: 700;">
          <td><strong style="color: #f59e0b;">↔️ 4. Divergence Datum (DD)</strong></td>
          <td colspan="2" style="text-align: center; color: #fbbf24;">Garis Pemisah Datum L ↔ Datum R</td>
          <td>Pemisahan</td>
          <td><strong style="color: #f59e0b; font-size: 0.92rem;">${dd.toFixed(2)} NM</strong></td>
          <td><span class="badge" style="background: #b45309; color:#fff;">DD = ${(dd * 1.852).toFixed(2)} km</span></td>
        </tr>
      `;
    }

    // Update UI elements - Panel 4 (Drift)
    updateTotalDriftUI();

    // Update UI elements - Panel 6 (Drawer Error & Separation Ratio SR)
    const errXDrNav = fd.xDrNav !== undefined ? fd.xDrNav : 0.0;
    const errX = fd.errorX !== undefined ? fd.errorX : 1.0;
    const errDe = fd.errorDe !== undefined ? fd.errorDe : (typeof fd.de === 'number' ? fd.de : 0.0);
    const errYDrNav = fd.yDrNav !== undefined ? fd.yDrNav : 0.0;
    const errY = fd.errorY !== undefined ? fd.errorY : 0.1;
    const sumSq = fd.sumSquaredErrors !== undefined ? fd.sumSquaredErrors : ((errX * errX) + (errDe * errDe) + (errY * errY));
    const errE = fd.errorE !== undefined ? fd.errorE : Math.sqrt(sumSq);
    const searchR = fd.searchRadius !== undefined ? fd.searchRadius : (1.1 * errE);
    const searchA = fd.searchArea !== undefined ? fd.searchArea : (4 * searchR * searchR);
    const srVal = typeof fd.separationRatio === 'number' ? fd.separationRatio : (errE > 0 ? (dd / errE) : 0.0);

    if (el.resErrXDrNav) el.resErrXDrNav.value = `${errXDrNav.toFixed(2)} NM`;
    if (el.resErrorX) el.resErrorX.textContent = `${errX.toFixed(2)} NM`;
    if (el.resErrorDe) el.resErrorDe.textContent = `${errDe.toFixed(2)} NM`;
    if (el.resErrYDrNav) el.resErrYDrNav.value = `${errYDrNav.toFixed(2)} NM`;
    if (el.resErrorY) el.resErrorY.textContent = `${errY.toFixed(2)} NM`;
    if (el.resErrorSumsq) el.resErrorSumsq.textContent = `${sumSq.toFixed(2)} NM²`;
    if (el.resErrorE) el.resErrorE.textContent = `${errE.toFixed(2)} NM`;
    if (el.resErrorSr) el.resErrorSr.textContent = srVal.toFixed(2);
    if (el.resErrorSrSub) el.resErrorSrSub.textContent = `SR = ${dd.toFixed(2)} / ${errE.toFixed(2)}`;
    if (el.resErrorR) el.resErrorR.textContent = `${searchR.toFixed(2)} NM`;
    if (el.resErrorArea) el.resErrorArea.textContent = `${searchA.toFixed(2)} NM²`;

    if (el.resErrorSrGuidance) {
      if (srVal <= 4.0) {
        el.resErrorSrGuidance.innerHTML = `<span style="color:#34d399; font-weight:700;">✅ SR = ${srVal.toFixed(2)} ≤ 4.0:</span> Jarak pemisahan datum rapat/sederhana. Kawasan carian bagi kedua-dua datum bertindih mencukupi. Rancang <strong>satu kawasan carian bersepadu (Single/Overlapping Search Area)</strong>.`;
      } else {
        el.resErrorSrGuidance.innerHTML = `<span style="color:#f87171; font-weight:700;">⚠️ SR = ${srVal.toFixed(2)} &gt; 4.0:</span> Jarak pemisahan datum melebihi 4 kali ganda ralat kedudukan (${dd.toFixed(2)} NM &gt; 4 &times; ${errE.toFixed(2)} NM). Rancang <strong>dua kawasan carian berasingan (Two Separate Search Areas)</strong> bagi Datum L &amp; Datum R.`;
      }
    }

    // Update Left Cockpit Summary Card
    if (el.summaryLwVal) el.summaryLwVal.textContent = `${fd.targetLabel} (${fd.leewayDist.toFixed(2)} NM)`;
    if (el.summaryDriftVal) el.summaryDriftVal.textContent = `${fd.totalDriftDist.toFixed(2)} NM • Arah: ${formatNauticalBearing(fd.totalDriftBearing)}`;
    if (el.summaryDatumVal) {
      if (fd.divergence > 0) {
        el.summaryDatumVal.textContent = `L: ${formatCoordinate(fd.datumLatL, true)} | R: ${formatCoordinate(fd.datumLatR, true)} (DD: ${dd.toFixed(2)} NM)`;
      } else {
        el.summaryDatumVal.textContent = `Lat: ${formatCoordinate(fd.datumLat, true)} | Lon: ${formatCoordinate(fd.datumLon, false)}`;
      }
    }
    if (el.summaryErrorVal) el.summaryErrorVal.textContent = `E: ${fd.errorE.toFixed(2)} NM | SR: ${srVal.toFixed(2)} | R: ${fd.searchRadius.toFixed(2)} NM`;
  }

  // =========================================================================
  // INTEGRASI LEAFLET & OPEN SEAMAP (LAPISAN KEKAL TANPA KOTAK TICK)
  // =========================================================================

  function initLeafletMap() {
    if (leafletMap || typeof L === 'undefined') return;

    try {
      leafletMap = L.map('leafletMap', {
        center: [state.originGeo.lat, state.originGeo.lon],
        zoom: 8,
        zoomControl: false,
        attributionControl: true
      });

      L.control.zoom({ position: 'topright' }).addTo(leafletMap);

      // Lapisan 1: Peta Darat OpenStreetMap Standard (Base Layer)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        subdomains: ['a', 'b', 'c'],
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors'
      }).addTo(leafletMap);

      // Lapisan 2: Peta Laut OpenSeaMap (Tanda, Suar & Pelampung Navigasi - Aktif Secara Lalai)
      L.tileLayer('https://tiles.openseamap.org/seamap/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: 'Peta Laut &copy; <a href="http://www.openseamap.org" target="_blank">OpenSeaMap</a>'
      }).addTo(leafletMap);

      vectorLayerGroup = L.layerGroup().addTo(leafletMap);
      planningLayerGroup = L.layerGroup().addTo(leafletMap);

      // Acara Klik pada Peta (untuk pilihan lokasi "Klik Peta Set Origin")
      leafletMap.on('click', (e) => {
        if (state.isPickingLocation) {
          state.originGeo.lat = e.latlng.lat;
          state.originGeo.lon = e.latlng.lng;
          el.originLatInput.value = formatCoordinate(e.latlng.lat, true);
          el.originLonInput.value = formatCoordinate(e.latlng.lng, false);

          state.isPickingLocation = false;
          el.btnPickLocation.classList.remove('btn-success');
          el.btnPickLocation.classList.add('btn-outline');
          el.btnPickLocation.innerHTML = `
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" fill="none" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="22" y1="12" x2="18" y2="12"/><line x1="6" y1="12" x2="2" y2="12"/><line x1="12" y1="6" x2="12" y2="2"/><line x1="12" y1="22" x2="12" y2="18"/></svg>
            <span>📍 Klik Peta Set Origin</span>
          `;
          el.mapContainer.style.cursor = '';

          updateLeafletMap();
          saveAppState();
          return;
        }
      });

      leafletMap.on('mousemove', (e) => {
        el.cursorCoords.textContent = `GPS: Lat ${formatCoordinate(e.latlng.lat, true)} | Lon ${formatCoordinate(e.latlng.lng, false)}`;
      });

      // Kemaskini kedudukan zarah Monte Carlo bila peta di-pan / di-zoom
      leafletMap.on('viewreset move zoom resize', () => {
        if (state.monteCarlo && state.monteCarlo.isActive) {
          renderMonteCarloFrame();
        }
      });
    } catch (err) {
      console.error('Ralat ketika memulakan Leaflet Map:', err);
    }
  }

  function updateLeafletMap() {
    if (!leafletMap || !vectorLayerGroup) return;

    vectorLayerGroup.clearLayers();

    const originLat = state.originGeo.lat;
    const originLon = state.originGeo.lon;

    const boundsLatLngs = [[originLat, originLon]];

    // 1. Marker Titik Mula Kejadian / Kecemasan (Distress Origin)
    const originMarker = L.circleMarker([originLat, originLon], {
      radius: 9,
      fillColor: '#ef4444',
      color: '#ffffff',
      weight: 2.5,
      opacity: 1,
      fillOpacity: 0.95
    }).addTo(vectorLayerGroup);

    originMarker.bindTooltip('🏁 0. Origin (LKP)', {
      permanent: false,
      direction: 'top',
      className: 'nautical-map-tooltip'
    });

    originMarker.bindPopup(`
      <div style="font-family: 'Outfit', sans-serif; min-width: 180px;">
        <h4 style="color:#ef4444; margin-bottom: 4px; font-weight:700;">📍 TITIK KECEMASAN (ORIGIN / LKP)</h4>
        <p style="margin:3px 0; font-size:0.85rem;"><strong>Lat:</strong> ${formatCoordinate(originLat, true)}</p>
        <p style="margin:3px 0; font-size:0.85rem;"><strong>Lon:</strong> ${formatCoordinate(originLon, false)}</p>
        <p style="margin:3px 0; font-size:0.8rem; color:#64748b;">Kedudukan awal kejadian</p>
      </div>
    `);

    // 2. Plotting IAMSAR Final Datum jika telah dikira
    if (state.finalDatum) {
      const fd = state.finalDatum;
      const dur = fd.durationHours || 1.0;
      const radiusMeters = fd.searchRadius * 1852; // 1 NM = 1852 meter

      // =========================================================================
      // FASA 1: PEMBENTUKAN RANTAIAN VEKTOR TWC (HEAD-TO-TAIL ADDITION DARI ORIGIN)
      // =========================================================================
      let currPt = { lat: originLat, lon: originLon };
      let twcLegCount = 0;

      if (state.twcMode === 'computed') {
        // A. Vektor 1: Wind Current (WC)
        if (state.wcVector && state.wcVector.speed > 0) {
          const wc = state.wcVector;
          const wcLegDist = wc.speed * dur;
          const nextPt = calculateDestinationPoint(currPt.lat, currPt.lon, wc.bearing, wcLegDist);
          boundsLatLngs.push([nextPt.lat, nextPt.lon]);
          twcLegCount++;

          const wcLine = L.polyline([[currPt.lat, currPt.lon], [nextPt.lat, nextPt.lon]], {
            color: '#0284c7',
            weight: 3.5,
            opacity: 0.95
          }).addTo(vectorLayerGroup);

          const midLat = (currPt.lat + nextPt.lat) / 2;
          const midLon = (currPt.lon + nextPt.lon) / 2;
          const wcLabel = `1. WC: ${formatNauticalBearing(wc.bearing)} | ${wc.speed.toFixed(2)} kts (${wcLegDist.toFixed(2)} NM)`;

          wcLine.bindTooltip(wcLabel, {
            permanent: false,
            direction: 'center',
            className: 'nautical-map-tooltip'
          });

          wcLine.bindPopup(`
            <div style="font-family: 'Outfit', sans-serif;">
              <h4 style="color:#0284c7; margin-bottom:4px; font-weight:700;">VEKTOR 1: WIND CURRENT (WC)</h4>
              <p style="margin:2px 0;"><strong>Arah Set:</strong> ${formatNauticalBearing(wc.bearing)}</p>
              <p style="margin:2px 0;"><strong>Kelajuan:</strong> ${wc.speed.toFixed(2)} kts</p>
              <p style="margin:2px 0;"><strong>Anjakan:</strong> ${wcLegDist.toFixed(2)} NM (${dur.toFixed(2)} jam)</p>
            </div>
          `);

          // Waypoint dot pada hujung WC
          const wpDot = L.circleMarker([nextPt.lat, nextPt.lon], {
            radius: 5,
            fillColor: '#0284c7',
            color: '#ffffff',
            weight: 1.5,
            opacity: 1,
            fillOpacity: 0.9
          }).addTo(vectorLayerGroup);
          wpDot.bindTooltip('WP1 (Hujung WC)', { className: 'nautical-map-tooltip' });

          currPt = nextPt;
        }

        // B. Vektor 2..N: Vektor Arus Tambahan (SC / TC / RC / OC)
        if (Array.isArray(state.scVectors) && state.scVectors.length > 0) {
          const scColors = ['#06b6d4', '#14b8a6', '#3b82f6', '#6366f1', '#8b5cf6'];

          state.scVectors.forEach((v, idx) => {
            const scLegDist = v.speed * dur;
            const nextPt = calculateDestinationPoint(currPt.lat, currPt.lon, v.bearing, scLegDist);
            boundsLatLngs.push([nextPt.lat, nextPt.lon]);
            twcLegCount++;
            const legNum = twcLegCount;
            const legColor = scColors[idx % scColors.length];

            const vecLine = L.polyline([[currPt.lat, currPt.lon], [nextPt.lat, nextPt.lon]], {
              color: legColor,
              weight: 3.5,
              opacity: 0.95
            }).addTo(vectorLayerGroup);

            const vecLabel = `${legNum}. ${v.type || 'SC'}: ${formatNauticalBearing(v.bearing)} | ${v.speed.toFixed(2)} kts (${scLegDist.toFixed(2)} NM)`;
            vecLine.bindTooltip(vecLabel, {
              permanent: false,
              direction: 'center',
              className: 'nautical-map-tooltip'
            });

            vecLine.bindPopup(`
              <div style="font-family: 'Outfit', sans-serif;">
                <h4 style="color:${legColor}; margin-bottom:4px; font-weight:700;">VEKTOR ${legNum}: ${v.type || 'SEA CURRENT'}</h4>
                <p style="margin:2px 0;"><strong>Arah Set:</strong> ${formatNauticalBearing(v.bearing)}</p>
                <p style="margin:2px 0;"><strong>Kelajuan:</strong> ${v.speed.toFixed(2)} kts</p>
                <p style="margin:2px 0;"><strong>Anjakan:</strong> ${scLegDist.toFixed(2)} NM (${dur.toFixed(2)} jam)</p>
              </div>
            `);

            // Waypoint dot pada hujung vektor arus
            const wpDot = L.circleMarker([nextPt.lat, nextPt.lon], {
              radius: 5,
              fillColor: legColor,
              color: '#ffffff',
              weight: 1.5,
              opacity: 1,
              fillOpacity: 0.9
            }).addTo(vectorLayerGroup);
            wpDot.bindTooltip(`WP${legNum} (Hujung ${v.type || 'SC'})`, { className: 'nautical-map-tooltip' });

            currPt = nextPt;
          });
        }

        // Garisan Paduan TWC (Dashed line dari Origin ke hujung TWC jika lebih 1 vektor)
        if (twcLegCount > 1 && (fd.twcDist || fd.scDist) > 0) {
          const twcResLine = L.polyline([[originLat, originLon], [currPt.lat, currPt.lon]], {
            color: '#38bdf8',
            weight: 2,
            opacity: 0.75,
            dashArray: '5, 5'
          }).addTo(vectorLayerGroup);

          twcResLine.bindTooltip(`🎯 Paduan TWC: ${formatNauticalBearing(fd.scBearing)} | ${(fd.twcDist || fd.scDist).toFixed(2)} NM`, {
            className: 'nautical-map-tooltip'
          });
        }
      } else {
        // Observed TWC Single Vector
        const obs = state.twcObserved || { bearing: 180, distance: 1.0, speed: 1.0 };
        const nextPt = calculateDestinationPoint(originLat, originLon, obs.bearing, obs.distance);
        boundsLatLngs.push([nextPt.lat, nextPt.lon]);

        const obsLine = L.polyline([[originLat, originLon], [nextPt.lat, nextPt.lon]], {
          color: '#0284c7',
          weight: 3.5,
          opacity: 0.95
        }).addTo(vectorLayerGroup);

        obsLine.bindTooltip(`🌊 Observed TWC (${obs.source || 'Cerapan'}): ${formatNauticalBearing(obs.bearing)} | ${obs.distance.toFixed(2)} NM`, {
          className: 'nautical-map-tooltip'
        });

        obsLine.bindPopup(`
          <div style="font-family: 'Outfit', sans-serif;">
            <h4 style="color:#0284c7; margin-bottom:4px; font-weight:700;">OBSERVED TOTAL WATER CURRENT (TWC)</h4>
            <p style="margin:2px 0;"><strong>Sumber:</strong> ${obs.source || 'Cerapan Arus'}</p>
            <p style="margin:2px 0;"><strong>Arah Set:</strong> ${formatNauticalBearing(obs.bearing)}</p>
            <p style="margin:2px 0;"><strong>Kelajuan:</strong> ${obs.speed.toFixed(2)} kts</p>
            <p style="margin:2px 0;"><strong>Jarak:</strong> ${obs.distance.toFixed(2)} NM</p>
          </div>
        `);

        currPt = nextPt;
      }

      const scEndPt = currPt;
      boundsLatLngs.push([scEndPt.lat, scEndPt.lon]);

      // Marker Titik Hujung TWC (Pertemuan Arus & Mula Leeway)
      if (twcLegCount > 0 || state.twcMode === 'observed') {
        const twcEndMarker = L.circleMarker([scEndPt.lat, scEndPt.lon], {
          radius: 6.5,
          fillColor: '#0f172a',
          color: '#38bdf8',
          weight: 2.5,
          opacity: 1,
          fillOpacity: 1
        }).addTo(vectorLayerGroup);

        twcEndMarker.bindTooltip('📍 Titik Hujung TWC (Mula Leeway)', {
          direction: 'top',
          className: 'nautical-map-tooltip'
        });

        twcEndMarker.bindPopup(`
          <div style="font-family: 'Outfit', sans-serif;">
            <h4 style="color:#38bdf8; margin-bottom:4px; font-weight:700;">📍 TITIK HUJUNG TWC (INTERMEDIATE)</h4>
            <p style="margin:2px 0;">Titik anjakan arus laut sebelum ditambah vektor hanyutan angin (Leeway).</p>
            <p style="margin:2px 0;"><strong>Lat:</strong> ${formatCoordinate(scEndPt.lat, true)}</p>
            <p style="margin:2px 0;"><strong>Lon:</strong> ${formatCoordinate(scEndPt.lon, false)}</p>
          </div>
        `);
      }

      // =========================================================================
      // FASA 2 & 3: PENAMBAHAN LEEWAY (TWC + LL & TWC + LR) & KEDUDUKAN DATUM
      // =========================================================================
      if (fd.divergence > 0 && fd.datumLatL && fd.datumLatR) {
        boundsLatLngs.push([fd.datumLatL, fd.datumLonL]);
        boundsLatLngs.push([fd.datumLatR, fd.datumLonR]);

        // 1. Vektor Leeway Kiri (LL): dari scEndPt ke Datum L
        const leftLeewayLine = L.polyline([[scEndPt.lat, scEndPt.lon], [fd.datumLatL, fd.datumLonL]], {
          color: '#38bdf8',
          weight: 3.5,
          opacity: 0.95
        }).addTo(vectorLayerGroup);

        leftLeewayLine.bindTooltip(`🌬️ + LL (Leeway Kiri): ${formatNauticalBearing(fd.leftTrack)} | ${fd.leewayDist.toFixed(2)} NM`, {
          className: 'nautical-map-tooltip'
        });

        leftLeewayLine.bindPopup(`
          <div style="font-family: 'Outfit', sans-serif;">
            <h4 style="color:#0284c7; margin-bottom:4px; font-weight:700;">VEKTOR LEEWAY KIRI (LL)</h4>
            <p style="margin:2px 0;">Disambungkan dari Hujung TWC ke Datum L</p>
            <p style="margin:2px 0;"><strong>Haluan Leeway:</strong> ${formatNauticalBearing(fd.leftTrack)} (-${fd.divergence.toFixed(1)}°)</p>
            <p style="margin:2px 0;"><strong>Kelajuan:</strong> ${fd.leewaySpeed.toFixed(2)} kts</p>
            <p style="margin:2px 0;"><strong>Jarak Hanyutan:</strong> ${fd.leewayDist.toFixed(2)} NM</p>
          </div>
        `);

        // 2. Vektor Leeway Kanan (LR): dari scEndPt ke Datum R
        const rightLeewayLine = L.polyline([[scEndPt.lat, scEndPt.lon], [fd.datumLatR, fd.datumLonR]], {
          color: '#a855f7',
          weight: 3.5,
          opacity: 0.95
        }).addTo(vectorLayerGroup);

        rightLeewayLine.bindTooltip(`🌬️ + LR (Leeway Kanan): ${formatNauticalBearing(fd.rightTrack)} | ${fd.leewayDist.toFixed(2)} NM`, {
          className: 'nautical-map-tooltip'
        });

        rightLeewayLine.bindPopup(`
          <div style="font-family: 'Outfit', sans-serif;">
            <h4 style="color:#9333ea; margin-bottom:4px; font-weight:700;">VEKTOR LEEWAY KANAN (LR)</h4>
            <p style="margin:2px 0;">Disambungkan dari Hujung TWC ke Datum R</p>
            <p style="margin:2px 0;"><strong>Haluan Leeway:</strong> ${formatNauticalBearing(fd.rightTrack)} (+${fd.divergence.toFixed(1)}°)</p>
            <p style="margin:2px 0;"><strong>Kelajuan:</strong> ${fd.leewaySpeed.toFixed(2)} kts</p>
            <p style="margin:2px 0;"><strong>Jarak Hanyutan:</strong> ${fd.leewayDist.toFixed(2)} NM</p>
          </div>
        `);

        // 3. Garisan Paduan Bersih dari Origin ke Datum L (Track L: D_L = TWC + LL)
        const totalTrackLineL = L.polyline([[originLat, originLon], [fd.datumLatL, fd.datumLonL]], {
          color: '#0284c7',
          weight: 2.5,
          opacity: 0.85,
          dashArray: '6, 6'
        }).addTo(vectorLayerGroup);

        totalTrackLineL.bindTooltip(`🎯 Paduan DL (TWC + LL): ${formatNauticalBearing(fd.totalDriftBearingL)} | ${fd.totalDriftDistL.toFixed(2)} NM`, {
          className: 'nautical-map-tooltip'
        });

        totalTrackLineL.bindPopup(`
          <div style="font-family: 'Outfit', sans-serif;">
            <h4 style="color:#0284c7; margin-bottom:4px; font-weight:700;">PADUAN TOTAL SURFACE DRIFT (DATUM L)</h4>
            <p style="margin:2px 0;"><strong>Formula:</strong> $\\vec{D}_L = \\vec{TWC} + \\vec{LL}$</p>
            <p style="margin:2px 0;"><strong>Haluan Paduan (Track L):</strong> ${formatNauticalBearing(fd.totalDriftBearingL)}</p>
            <p style="margin:2px 0;"><strong>Anjakan Bersih (DL):</strong> ${fd.totalDriftDistL.toFixed(2)} NM</p>
          </div>
        `);

        // 4. Garisan Paduan Bersih dari Origin ke Datum R (Track R: D_R = TWC + LR)
        const totalTrackLineR = L.polyline([[originLat, originLon], [fd.datumLatR, fd.datumLonR]], {
          color: '#7e22ce',
          weight: 2.5,
          opacity: 0.85,
          dashArray: '6, 6'
        }).addTo(vectorLayerGroup);

        totalTrackLineR.bindTooltip(`🎯 Paduan DR (TWC + LR): ${formatNauticalBearing(fd.totalDriftBearingR)} | ${fd.totalDriftDistR.toFixed(2)} NM`, {
          className: 'nautical-map-tooltip'
        });

        totalTrackLineR.bindPopup(`
          <div style="font-family: 'Outfit', sans-serif;">
            <h4 style="color:#7e22ce; margin-bottom:4px; font-weight:700;">PADUAN TOTAL SURFACE DRIFT (DATUM R)</h4>
            <p style="margin:2px 0;"><strong>Formula:</strong> $\\vec{D}_R = \\vec{TWC} + \\vec{LR}$</p>
            <p style="margin:2px 0;"><strong>Haluan Paduan (Track R):</strong> ${formatNauticalBearing(fd.totalDriftBearingR)}</p>
            <p style="margin:2px 0;"><strong>Anjakan Bersih (DR):</strong> ${fd.totalDriftDistR.toFixed(2)} NM</p>
          </div>
        `);

        // 5. Garisan Pemisah Divergence Datum (DD) antara Datum L & Datum R
        const ddDist = typeof fd.divergenceDatumDist === 'number' ? fd.divergenceDatumDist : Math.hypot((fd.totalDxR || 0) - (fd.totalDxL || 0), (fd.totalDyR || 0) - (fd.totalDyL || 0));
        const ddLine = L.polyline([[fd.datumLatL, fd.datumLonL], [fd.datumLatR, fd.datumLonR]], {
          color: '#f59e0b',
          weight: 3.5,
          opacity: 0.95,
          dashArray: '5, 5'
        }).addTo(vectorLayerGroup);

        ddLine.bindTooltip(`↔️ DD = ${ddDist.toFixed(2)} NM (≈ ${(ddDist * 1.852).toFixed(2)} km)`, {
          permanent: false,
          direction: 'center',
          className: 'nautical-map-tooltip'
        });

        ddLine.bindPopup(`
          <div style="font-family: 'Outfit', sans-serif; min-width: 200px;">
            <h4 style="color:#d97706; margin-bottom:4px; font-weight:700;">↔️ DIVERGENCE DATUM (DD)</h4>
            <p style="margin:2px 0; font-size:0.85rem;"><strong>Jarak Pemisahan:</strong> <span style="color:#f59e0b; font-weight:700;">${ddDist.toFixed(2)} NM</span> (≈ ${(ddDist * 1.852).toFixed(2)} km)</p>
            <p style="margin:2px 0; font-size:0.8rem; color:#94a3b8;">Garis lurus pemisah fizikal Datum L &harr; Datum R</p>
          </div>
        `);

        // 6. Marker Datum L (Kiri)
        const datumLMarker = L.circleMarker([fd.datumLatL, fd.datumLonL], {
          radius: 9,
          fillColor: '#38bdf8',
          color: '#ffffff',
          weight: 2.5,
          opacity: 1,
          fillOpacity: 0.95
        }).addTo(vectorLayerGroup);

        datumLMarker.bindTooltip('📍 2. Datum L (Kiri)', {
          permanent: false,
          direction: 'top',
          className: 'nautical-map-tooltip'
        });

        datumLMarker.bindPopup(`
          <div style="font-family: 'Outfit', sans-serif; min-width: 210px;">
            <h4 style="color:#0284c7; margin-bottom:4px; font-weight:700;">📍 DATUM L (CABANG KIRI)</h4>
            <p style="margin:2px 0; font-size:0.85rem;"><strong>Lat:</strong> ${formatCoordinate(fd.datumLatL, true)}</p>
            <p style="margin:2px 0; font-size:0.85rem;"><strong>Lon:</strong> ${formatCoordinate(fd.datumLonL, false)}</p>
            <p style="margin:2px 0; font-size:0.85rem;"><strong>Anjakan Bersih (DL):</strong> ${fd.totalDriftDistL.toFixed(2)} NM (${formatNauticalBearing(fd.totalDriftBearingL)})</p>
            <p style="margin:2px 0; font-size:0.8rem; color:#94a3b8;">Cabang sisihan kiri (-${(fd.divergence || 0).toFixed(1)}°)</p>
          </div>
        `).openPopup();

        // 7. Marker Datum R (Kanan)
        const datumRMarker = L.circleMarker([fd.datumLatR, fd.datumLonR], {
          radius: 9,
          fillColor: '#a855f7',
          color: '#ffffff',
          weight: 2.5,
          opacity: 1,
          fillOpacity: 0.95
        }).addTo(vectorLayerGroup);

        datumRMarker.bindTooltip('📍 3. Datum R (Kanan)', {
          permanent: false,
          direction: 'top',
          className: 'nautical-map-tooltip'
        });

        datumRMarker.bindPopup(`
          <div style="font-family: 'Outfit', sans-serif; min-width: 210px;">
            <h4 style="color:#9333ea; margin-bottom:4px; font-weight:700;">📍 DATUM R (CABANG KANAN)</h4>
            <p style="margin:2px 0; font-size:0.85rem;"><strong>Lat:</strong> ${formatCoordinate(fd.datumLatR, true)}</p>
            <p style="margin:2px 0; font-size:0.85rem;"><strong>Lon:</strong> ${formatCoordinate(fd.datumLonR, false)}</p>
            <p style="margin:2px 0; font-size:0.85rem;"><strong>Anjakan Bersih (DR):</strong> ${fd.totalDriftDistR.toFixed(2)} NM (${formatNauticalBearing(fd.totalDriftBearingR)})</p>
            <p style="margin:2px 0; font-size:0.8rem; color:#94a3b8;">Cabang sisihan kanan (+${(fd.divergence || 0).toFixed(1)}°)</p>
          </div>
        `);

        // Fit bounds jika ada anjakan hanyutan, atau zoom out (skala 8) untuk paparan luas jika belum dikira
        if (fd.totalDriftDist > 0.05) {
          leafletMap.fitBounds(boundsLatLngs, { padding: [50, 50], maxZoom: 13 });
        } else {
          leafletMap.setView([originLat, originLon], 8);
        }

      } else {
        // Kes Khas: Tiada sisihan Leeway (Divergence = 0) -> Satu kedudukan Datum
        const datumLat = fd.datumLat;
        const datumLon = fd.datumLon;
        boundsLatLngs.push([datumLat, datumLon]);

        if (fd.leewayDist > 0) {
          const leewayLine = L.polyline([[scEndPt.lat, scEndPt.lon], [datumLat, datumLon]], {
            color: '#38bdf8',
            weight: 3.5,
            opacity: 0.95
          }).addTo(vectorLayerGroup);

          leewayLine.bindTooltip(`🌬️ + Leeway: ${formatNauticalBearing(fd.downwindBearing)} | ${fd.leewayDist.toFixed(2)} NM`, {
            className: 'nautical-map-tooltip'
          });
        }

        const totalTrackLine = L.polyline([[originLat, originLon], [datumLat, datumLon]], {
          color: '#0284c7',
          weight: 2.5,
          opacity: 0.85,
          dashArray: '6, 6'
        }).addTo(vectorLayerGroup);

        const singleDatumMarker = L.circleMarker([datumLat, datumLon], {
          radius: 9,
          fillColor: '#38bdf8',
          color: '#ffffff',
          weight: 2.5,
          opacity: 1,
          fillOpacity: 0.95
        }).addTo(vectorLayerGroup);

        singleDatumMarker.bindPopup(`
          <div style="font-family: 'Outfit', sans-serif; min-width: 200px;">
            <h4 style="color:#0284c7; margin-bottom: 4px; font-weight:700;">📍 KEDUDUKAN DATUM SAR</h4>
            <p style="margin:3px 0; font-size:0.85rem;"><strong>Lat Datum:</strong> ${formatCoordinate(datumLat, true)}</p>
            <p style="margin:3px 0; font-size:0.85rem;"><strong>Lon Datum:</strong> ${formatCoordinate(datumLon, false)}</p>
            <p style="margin:3px 0; font-size:0.85rem;"><strong>Jumlah Anjakan:</strong> ${fd.totalDriftDist.toFixed(2)} NM (${formatNauticalBearing(fd.totalDriftBearing)})</p>
          </div>
        `).openPopup();

        if (fd.totalDriftDist > 0.05) {
          leafletMap.fitBounds(boundsLatLngs, { padding: [50, 50], maxZoom: 13 });
        } else {
          leafletMap.setView([originLat, originLon], 8);
        }
      }
    } else {
      originMarker.openPopup();
      leafletMap.setView([originLat, originLon], 8);
    }
  }

  // =========================================================================
  // PENGURUSAN TAB SEBELAH KIRI (VECTOR / DETERMINING DATUM / PLANNING)
  // =========================================================================

  function switchTab(tabName) {
    state.activeTab = tabName;
    saveAppState();

    // Kemaskini status butang tab aktif
    const tabBtns = document.querySelectorAll('.sidebar-tab-btn');
    tabBtns.forEach(btn => {
      if (btn.dataset.tab === tabName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Papar panel tab yang sepadan & sembunyikan panel lain
    const tabPanels = document.querySelectorAll('.tab-content-panel');
    tabPanels.forEach(panel => {
      if (panel.id === `tab-panel-${tabName}`) {
        panel.style.display = 'flex';
      } else {
        panel.style.display = 'none';
      }
    });

    // Automatik paparan sebelah kanan:
    // Tab 1 (Vector) -> Papar Carta Grid (Tiada kaitan dengan Datum / Monte Carlo)
    // Tab 2 (Determining Datum) & Tab 3 (Planning) -> Papar Peta Laut
    if (tabName === 'vector') {
      closeDrawer();
      closePlanningDrawer();
      if (typeof closeMonteCarlo === 'function') {
        closeMonteCarlo();
      }
      switchDisplayMode('grid');
    } else if (tabName === 'datum') {
      closePlanningDrawer();
      switchDisplayMode('map');
    } else if (tabName === 'planning') {
      closeDrawer();
      syncPlanningFromTab2(false);
      calculatePlanning();
      openPlanningDrawer(state.planning && state.planning.activeDrawer ? state.planning.activeDrawer : 'zta');
      switchDisplayMode('map');
    }
  }

  // =========================================================================
  // PENGURUSAN EXPANDABLE DRAWER TAB 2
  // =========================================================================

  const DRAWER_TITLES = {
    asw: 'Average Surface Wind (ASW)',
    wc: 'Wind Current (WC)',
    twc: 'Total Water Current (TWC)',
    lw: 'Leeway Drift (LW)',
    drift: 'Total Surface Drift',
    datum: 'Determining Datum Position',
    error: 'Total Probable Error (E) & Radius Carian (IAMSAR)'
  };

  function openDrawer(panelName) {
    if (!el.tab2Drawer) return;

    if (panelName === 'error') {
      const intervalVal = el.datumIntervalInput ? parseFloat(el.datumIntervalInput.value) : 1.0;
      if (el.errDeIntervalInput && (!el.errDeIntervalInput.value || el.errDeIntervalInput.value === '1.0')) {
        el.errDeIntervalInput.value = (!isNaN(intervalVal) && intervalVal > 0) ? intervalVal.toFixed(1) : '1.0';
      }
      const aswdvE = el.aswdvEInput ? (parseFloat(el.aswdvEInput.value) || 0.0) : 0.0;
      const twcE = state.twcMode === 'observed' ? (state.twcObserved?.twcE || 0.1) : (state.scResultant?.computedTwcE || 0.3);
      const lwE = state.leewayVector ? state.leewayVector.errorE : (el.lwEInput ? (parseFloat(el.lwEInput.value) || 0.25) : 0.25);
      const dve = Math.hypot(aswdvE, twcE, lwE);
      if (el.errDeDveInput && (!el.errDeDveInput.value || el.errDeDveInput.value === '0.39')) {
        el.errDeDveInput.value = dve.toFixed(2);
      }
      calculateFinalDatum();
    } else if (panelName === 'drift' || panelName === 'datum') {
      calculateFinalDatum();
    }

    // Buka drawer panel
    el.tab2Drawer.classList.add('open');

    // Kemaskini butang vertical action rail
    document.querySelectorAll('.rail-btn').forEach(btn => {
      if (btn.dataset.drawer === panelName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Kemaskini sorotan baris cockpit summary
    document.querySelectorAll('.cockpit-data-item').forEach(item => {
      if (item.dataset.drawerTarget === panelName) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Paparkan kandungan panel drawer yang sepadan
    document.querySelectorAll('#tab-panel-datum .drawer-panel-section').forEach(section => {
      if (section.id === `drawer-panel-${panelName}`) {
        section.classList.add('active');
      } else {
        section.classList.remove('active');
      }
    });

    // Kemaskini tajuk drawer header
    if (el.drawerHeading && DRAWER_TITLES[panelName]) {
      el.drawerHeading.textContent = DRAWER_TITLES[panelName];
    }
  }

  function closeDrawer() {
    if (!el.tab2Drawer) return;
    el.tab2Drawer.classList.remove('open');
    document.querySelectorAll('[data-drawer]').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('[data-drawer-target]').forEach(item => item.classList.remove('active'));
  }

  // =========================================================================
  // PENGURUSAN EXPANDABLE DRAWER TAB 3 (PLANNING)
  // WORKSHEET 1: TOTAL AVAILABLE SEARCH EFFORT (Zta) - PAGE 387
  // WORKSHEET 2: EFFORT ALLOCATION WORKSHEET - PAGE 393
  // =========================================================================

  const PLANNING_DRAWER_TITLES = {
    zta: 'Total Available Search Effort (Zta)',
    alloc: 'Effort Allocation Worksheet (Ao & Track Spacing)'
  };

  function openPlanningDrawer(panelName) {
    if (!el.tab3Drawer) return;

    state.planning.activeDrawer = panelName || 'zta';

    // Buka drawer panel Tab 3
    el.tab3Drawer.classList.add('open');

    // Kemaskini butang vertical action rail Tab 3
    document.querySelectorAll('[data-planning-rail]').forEach(btn => {
      if (btn.dataset.planningRail === panelName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Kemaskini sorotan baris cockpit summary Tab 3
    document.querySelectorAll('[data-planning-drawer]').forEach(item => {
      if (item.dataset.planningDrawer === panelName) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Paparkan kandungan panel drawer yang sepadan
    document.querySelectorAll('#tab-panel-planning .drawer-panel-section').forEach(section => {
      if (section.id === `drawer-panel-${panelName}`) {
        section.classList.add('active');
      } else {
        section.classList.remove('active');
      }
    });

    // Kemaskini tajuk drawer header
    if (el.tab3DrawerHeading && PLANNING_DRAWER_TITLES[panelName]) {
      el.tab3DrawerHeading.textContent = PLANNING_DRAWER_TITLES[panelName];
    }

    calculatePlanning();
  }

  function closePlanningDrawer() {
    if (!el.tab3Drawer) return;
    el.tab3Drawer.classList.remove('open');
    document.querySelectorAll('[data-planning-rail]').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('[data-planning-drawer]').forEach(item => item.classList.remove('active'));
  }

  function setDatumType(type) {
    state.planning.datumType = type || 'single';

    if (el.btnDatumTypeSingle) el.btnDatumTypeSingle.classList.toggle('active', type === 'single');
    if (el.btnDatumTypeLeeway) el.btnDatumTypeLeeway.classList.toggle('active', type === 'leeway');
    if (el.btnDatumTypeLine) el.btnDatumTypeLine.classList.toggle('active', type === 'line');

    if (el.groupPlanAllocL) {
      el.groupPlanAllocL.style.display = (type === 'line') ? 'block' : 'none';
    }
    if (el.groupPlanAllocDd) {
      el.groupPlanAllocDd.style.display = (type === 'leeway') ? 'block' : 'none';
    }

    if (el.hintPlanAllocFz) {
      el.hintPlanAllocFz.textContent = (type === 'line') ? 'E × L (Line Datum)' : 'E² (Single/Leeway)';
    }

    if (el.hintPlanAllocAo) {
      if (type === 'single') el.hintPlanAllocAo.textContent = '4 × (Ro)²';
      else if (type === 'leeway') el.hintPlanAllocAo.innerHTML = '4 &times; (R<sub>o</sub>)&sup2; + 2 &times; R<sub>o</sub> &times; DD';
      else if (type === 'line') el.hintPlanAllocAo.innerHTML = '2 &times; R<sub>o</sub> &times; L';
    }

    if (el.hintPlanAllocR) {
      if (type === 'single') el.hintPlanAllocR.innerHTML = 'R = &radic;(A<sub>t</sub>) / 2';
      else if (type === 'leeway') el.hintPlanAllocR.innerHTML = 'R = (&radic;(DD&sup2; + 4A<sub>t</sub>) - DD) / 4';
      else if (type === 'line') el.hintPlanAllocR.innerHTML = 'R = A<sub>t</sub> / (2 &times; L)';
    }

    calculatePlanning();
  }

  function syncPlanningFromTab2(forcePrompt = false) {
    // 1. Tarikh/Masa
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    const defaultDate = now.toISOString().slice(0, 10);
    const defaultDateTime = now.toISOString().slice(0, 16);

    if (el.planCaseDate && !el.planCaseDate.value) el.planCaseDate.value = defaultDate;
    if (el.planCaseDatetime) {
      if (el.datumDateTimeInput && el.datumDateTimeInput.value) {
        el.planCaseDatetime.value = el.datumDateTimeInput.value;
      } else if (!el.planCaseDatetime.value) {
        el.planCaseDatetime.value = defaultDateTime;
      }
    }

    // 2. Sasaran Carian (Search Object)
    if (el.planSearchObject) {
      if (state.leewayVector && state.leewayVector.targetName) {
        el.planSearchObject.value = state.leewayVector.targetName;
      } else if (state.finalDatum && state.finalDatum.targetLabel) {
        el.planSearchObject.value = state.finalDatum.targetLabel;
      }
    }

    // 3. Datum L & R
    if (state.finalDatum) {
      const fd = state.finalDatum;
      if (el.planDatumLatL) el.planDatumLatL.value = formatCoordinate(fd.datumLatL, true);
      if (el.planDatumLonL) el.planDatumLonL.value = formatCoordinate(fd.datumLonL, false);
      if (el.planDatumLatR) el.planDatumLatR.value = formatCoordinate(fd.datumLatR, true);
      if (el.planDatumLonR) el.planDatumLonR.value = formatCoordinate(fd.datumLonR, false);

      if (el.planZtaSr) {
        const srVal = typeof fd.separationRatio === 'number' ? fd.separationRatio : (fd.divergenceDatumDist / (fd.errorE || 1.0));
        el.planZtaSr.value = srVal.toFixed(2);
      }

      if (el.planAllocE) {
        el.planAllocE.value = (fd.errorE || 1.0).toFixed(2);
      }

      if (el.planAllocDd) {
        el.planAllocDd.value = (fd.divergenceDatumDist || 0.0).toFixed(2);
      }

      // Auto-set Datum Type based on divergence
      if (fd.divergence > 0) {
        setDatumType('leeway');
      } else {
        setDatumType('single');
      }
    } else {
      const origLat = state.originGeo.lat;
      const origLon = state.originGeo.lon;
      if (el.planDatumLatL && !el.planDatumLatL.value) el.planDatumLatL.value = formatCoordinate(origLat, true);
      if (el.planDatumLonL && !el.planDatumLonL.value) el.planDatumLonL.value = formatCoordinate(origLon, false);
      if (el.planDatumLatR && !el.planDatumLatR.value) el.planDatumLatR.value = formatCoordinate(origLat, true);
      if (el.planDatumLonR && !el.planDatumLonR.value) el.planDatumLonR.value = formatCoordinate(origLon, false);
    }

    calculatePlanning();
  }

  function calculateZta() {
    let totalZta = 0.0;
    let activeFacilityCount = 0;

    for (let i = 1; i <= 5; i++) {
      const vInput = document.getElementById(`plan-zta-v-${i}`);
      const endInput = document.getElementById(`plan-zta-endurance-${i}`);
      const dayInput = document.getElementById(`plan-zta-daylight-${i}`);
      const resT = document.getElementById(`res-plan-zta-t-${i}`);
      const wuInput = document.getElementById(`plan-zta-wu-${i}`);
      const fwInput = document.getElementById(`plan-zta-fw-${i}`);
      const fvInput = document.getElementById(`plan-zta-fv-${i}`);
      const ffInput = document.getElementById(`plan-zta-ff-${i}`);
      const resW = document.getElementById(`res-plan-zta-w-${i}`);
      const resZ = document.getElementById(`res-plan-zta-z-${i}`);
      const sruInput = document.getElementById(`plan-zta-sru-${i}`);

      const v = vInput ? (parseFloat(vInput.value) || 0.0) : 0.0;
      const endurance = endInput ? (parseFloat(endInput.value) || 0.0) : 0.0;
      const daylight = dayInput ? (parseFloat(dayInput.value) || 0.0) : 0.0;
      
      // Baris 6: T = 0.85 * min(4, 5)
      const minHours = Math.min(endurance, daylight);
      const T = (endurance > 0 && daylight > 0) ? (Math.round(0.85 * minHours * 100) / 100) : 0.0;
      if (resT) resT.value = `${T.toFixed(2)} j`;

      const wu = wuInput ? (parseFloat(wuInput.value) || 0.0) : 0.0;
      const fw = fwInput ? (parseFloat(fwInput.value) || 1.0) : 1.0;
      const fv = fvInput ? (parseFloat(fvInput.value) || 1.0) : 1.0;
      const ff = ffInput ? (parseFloat(ffInput.value) || 1.0) : 1.0;

      // Baris 12: W = 8 * 9 * 10 * 11
      const W = Math.round(wu * fw * fv * ff * 100) / 100;
      if (resW) resW.value = `${W.toFixed(2)} NM`;

      // Baris 13: Z = V * T * W
      const Z = Math.round(v * T * W * 100) / 100;
      if (resZ) resZ.value = `${Z.toFixed(2)} NM²`;

      if (Z > 0 || (sruInput && sruInput.value.trim() !== '')) {
        activeFacilityCount++;
      }
      totalZta += Z;

      // Sync Facility Headers & Corrected Sweep Width to Allocation Worksheet (Drawer 2)
      const thAlloc = document.getElementById(`th-alloc-sru-${i}`);
      const resAllocW = document.getElementById(`res-plan-alloc-w-${i}`);
      if (thAlloc && sruInput) {
        thAlloc.textContent = sruInput.value.trim() || `Fasiliti ${i}`;
      }
      if (resAllocW) {
        resAllocW.value = `${W.toFixed(2)} NM`;
      }
    }

    totalZta = Math.round(totalZta * 100) / 100;
    state.planning.zta.totalZta = totalZta;

    if (el.resPlanZtaTotal) el.resPlanZtaTotal.textContent = `${totalZta.toFixed(2)} NM²`;
    if (el.summaryPlanZtaVal) el.summaryPlanZtaVal.textContent = `${totalZta.toFixed(2)} NM² (${activeFacilityCount} Fasiliti)`;

    // Auto-update Za in Allocation if needed
    if (el.planAllocZa && (!el.planAllocZa.value || el.planAllocZa.dataset.synced !== 'false')) {
      el.planAllocZa.value = totalZta.toFixed(2);
    }

    // Routing Logic
    const sr = el.planZtaSr ? (parseFloat(el.planZtaSr.value) || 0.0) : 0.0;
    state.planning.zta.sr = sr;

    if (el.resPlanZtaRouting) {
      if (sr > 4.0) {
        el.resPlanZtaRouting.style.borderLeftColor = '#f87171';
        el.resPlanZtaRouting.innerHTML = `
          <div style="font-weight: 700; color: #f87171; margin-bottom: 2px;">⚠️ Routing Logic (SR = ${sr.toFixed(2)} &gt; 4.0):</div>
          <span>Jarak pemisahan datum melebihi 4 kali ganda ralat. <strong>Go to the Widely diverging datums worksheet.</strong> Rancang dua kawasan carian berasingan.</span>
        `;
      } else {
        el.resPlanZtaRouting.style.borderLeftColor = '#34d399';
        el.resPlanZtaRouting.innerHTML = `
          <div style="font-weight: 700; color: #34d399; margin-bottom: 2px;">✅ Routing Logic (SR = ${sr.toFixed(2)} &le; 4.0):</div>
          <span>Jarak pemisahan datum bercantum/sederhana. <strong>Go to the Effort allocation worksheet.</strong> Rancang satu kawasan carian bersepadu.</span>
        `;
      }
    }

    if (el.summaryPlanRoutingBanner) {
      if (sr > 4.0) {
        el.summaryPlanRoutingBanner.style.borderLeftColor = '#f87171';
        el.summaryPlanRoutingBanner.innerHTML = `<span style="font-weight: 700; color: #f87171;">⚠️ Widely Diverging:</span> SR = ${sr.toFixed(2)} &gt; 4.0. Rancang 2 kawasan carian berasingan.`;
      } else {
        el.summaryPlanRoutingBanner.style.borderLeftColor = '#34d399';
        el.summaryPlanRoutingBanner.innerHTML = `<span style="font-weight: 700; color: #34d399;">✅ Single/Overlapping:</span> SR = ${sr.toFixed(2)} &le; 4.0. Teruskan ke Effort Allocation.`;
      }
    }
  }

  function calculateAllocation() {
    const datumType = state.planning.datumType || 'leeway';

    const za = el.planAllocZa ? (parseFloat(el.planAllocZa.value) || 0.0) : 0.0;
    const E = el.planAllocE ? (parseFloat(el.planAllocE.value) || 1.0) : 1.0;
    const L = el.planAllocL ? (parseFloat(el.planAllocL.value) || 10.0) : 10.0;
    const dd = el.planAllocDd ? (parseFloat(el.planAllocDd.value) || 0.0) : 0.0;

    // 2c. Effort factor fZ
    let fZ = 1.0;
    if (datumType === 'line') {
      fZ = Math.round(E * L * 100) / 100;
    } else {
      fZ = Math.round(E * E * 100) / 100;
    }
    if (el.resPlanAllocFz) el.resPlanAllocFz.value = `${fZ.toFixed(2)} NM²`;

    // 3. Relative effort Zr = Za / fZ
    const zr = fZ > 0 ? (Math.round((za / fZ) * 100) / 100) : 0.0;
    if (el.resPlanAllocZr) el.resPlanAllocZr.value = zr.toFixed(2);

    // 4. Cumulative relative effort Zrc (Logik Lalai: 50% jika kali pertama 2 leeway divergence datums diuruskan secara berasingan)
    const isSeparateDivergence = el.planAllocZrcHalved ? el.planAllocZrcHalved.checked : false;
    const defaultZrc = isSeparateDivergence ? (Math.round(zr * 0.5 * 100) / 100) : zr;

    if (el.planAllocZrc && (!el.planAllocZrc.value || el.planAllocZrc.dataset.manual !== 'true')) {
      el.planAllocZrc.value = defaultZrc.toFixed(2);
    }

    // 5. Pemilihan Automatik 'Optimal search factor' (fs) - Normal vs Ideal (IAMSAR ms 395)
    // Syarat Normal (fs = 1.1):
    // 1. Mana-mana faktor pembetulan (fw, fv, ff) < 1.0
    // ATAU 2. Probable search facility position error (Y) > Corrected sweep width (W)
    let hasLowCorrectionFactor = false;
    let hasFacilityErrorExceedsW = false;
    const lowFactorReasons = [];

    const errY = state.finalDatum ? (state.finalDatum.errorY || 0.1) : (parseFloat(el.resErrorY ? el.resErrorY.textContent : '0.1') || 0.1);

    for (let i = 1; i <= 5; i++) {
      const vInp = document.getElementById(`plan-zta-v-${i}`);
      const sruInp = document.getElementById(`plan-zta-sru-${i}`);
      const v = vInp ? (parseFloat(vInp.value) || 0) : 0;
      const sru = sruInp ? sruInp.value.trim() : '';

      if (v > 0 || sru !== '') {
        const fw = parseFloat(document.getElementById(`plan-zta-fw-${i}`)?.value || '1.0');
        const fv = parseFloat(document.getElementById(`plan-zta-fv-${i}`)?.value || '1.0');
        const ff = parseFloat(document.getElementById(`plan-zta-ff-${i}`)?.value || '1.0');
        const wu = parseFloat(document.getElementById(`plan-zta-wu-${i}`)?.value || '0.0');
        const W = wu * fw * fv * ff;

        if (fw < 1.0 || fv < 1.0 || ff < 1.0) {
          hasLowCorrectionFactor = true;
          if (fw < 1.0 && !lowFactorReasons.includes('fw/ft')) lowFactorReasons.push('fw/ft');
          if (fv < 1.0 && !lowFactorReasons.includes('fv')) lowFactorReasons.push('fv');
          if (ff < 1.0 && !lowFactorReasons.includes('ff')) lowFactorReasons.push('ff');
        }

        if (W > 0 && errY > W) {
          hasFacilityErrorExceedsW = true;
        }
      }
    }

    let autoFs = 1.0;
    let autoReason = '';
    if (hasLowCorrectionFactor || hasFacilityErrorExceedsW) {
      autoFs = 1.1;
      const reasons = [];
      if (hasLowCorrectionFactor) reasons.push(`Faktor ${lowFactorReasons.join(', ')} < 1.0`);
      if (hasFacilityErrorExceedsW) reasons.push(`Ralat Fasiliti Y (${errY.toFixed(2)} NM) > W`);
      autoReason = `⚡ Auto: Normal (${reasons.join(' & ')})`;
    } else {
      autoFs = 1.0;
      autoReason = `⚡ Auto: Ideal (Semua faktor pembetulan ≥ 1.0 & Y ≤ W)`;
    }

    // Jika pengguna belum buat pilihan manual, guna autoFs
    if (!el.planAllocFs || !el.planAllocFs.dataset.userChoice || el.planAllocFs.dataset.userChoice === 'auto') {
      if (el.planAllocFs) el.planAllocFs.value = autoFs.toFixed(1);
      if (el.btnFsNormal && el.btnFsIdeal) {
        if (autoFs === 1.1) {
          el.btnFsNormal.classList.add('active');
          el.btnFsIdeal.classList.remove('active');
        } else {
          el.btnFsIdeal.classList.add('active');
          el.btnFsNormal.classList.remove('active');
        }
      }
    }

    if (el.planAllocFsReason) {
      el.planAllocFsReason.textContent = autoReason;
      el.planAllocFsReason.className = `fs-reason-badge ${autoFs === 1.1 ? 'warning' : 'success'}`;
    }

    const fs = el.planAllocFs ? (parseFloat(el.planAllocFs.value) || autoFs) : autoFs;

    // 6. Optimal search radius Ro = fs * E
    const Ro = Math.round(fs * E * 100) / 100;
    if (el.resPlanAllocRo) el.resPlanAllocRo.textContent = `${Ro.toFixed(2)} NM`;

    // 7. Optimal search area Ao
    let Ao = 0.0;
    if (datumType === 'single') {
      Ao = Math.round(4 * Ro * Ro * 100) / 100;
    } else if (datumType === 'leeway') {
      Ao = Math.round(((4 * Ro * Ro) + (2 * Ro * dd)) * 100) / 100;
    } else if (datumType === 'line') {
      Ao = Math.round(2 * Ro * L * 100) / 100;
    }
    if (el.resPlanAllocAo) el.resPlanAllocAo.textContent = `${Ao.toFixed(2)} NM²`;

    // 8. Optimal coverage factor Co = Za / Ao
    const Co = Ao > 0 ? (Math.round((za / Ao) * 100) / 100) : 1.0;
    if (el.resPlanAllocCo) el.resPlanAllocCo.textContent = Co.toFixed(2);

    // Facility Computations (1..5) & Sub-area width validation
    let At = 0.0;
    for (let i = 1; i <= 5; i++) {
      const wuInput = document.getElementById(`plan-zta-wu-${i}`);
      const fwInput = document.getElementById(`plan-zta-fw-${i}`);
      const fvInput = document.getElementById(`plan-zta-fv-${i}`);
      const ffInput = document.getElementById(`plan-zta-ff-${i}`);
      const vInput = document.getElementById(`plan-zta-v-${i}`);
      const endInput = document.getElementById(`plan-zta-endurance-${i}`);
      const dayInput = document.getElementById(`plan-zta-daylight-${i}`);
      const typeSelect = document.getElementById(`plan-zta-type-${i}`);

      const wu = wuInput ? (parseFloat(wuInput.value) || 0.0) : 0.0;
      const fw = fwInput ? (parseFloat(fwInput.value) || 1.0) : 1.0;
      const fv = fvInput ? (parseFloat(fvInput.value) || 1.0) : 1.0;
      const ff = ffInput ? (parseFloat(ffInput.value) || 1.0) : 1.0;
      const W = Math.round(wu * fw * fv * ff * 100) / 100;

      const v = vInput ? (parseFloat(vInput.value) || 0.0) : 0.0;
      const endurance = endInput ? (parseFloat(endInput.value) || 0.0) : 0.0;
      const daylight = dayInput ? (parseFloat(dayInput.value) || 0.0) : 0.0;
      const minHours = Math.min(endurance, daylight);
      const T = (endurance > 0 && daylight > 0) ? (Math.round(0.85 * minHours * 100) / 100) : 0.0;
      const assetType = typeSelect ? typeSelect.value : (i === 2 ? 'rotary_wing' : 'surface');

      // 9. Optimal track spacing So = W / Co
      const So = (Co > 0 && W > 0) ? (Math.round((W / Co) * 100) / 100) : 0.0;
      const resSo = document.getElementById(`res-plan-alloc-so-${i}`);
      if (resSo) resSo.value = `${So.toFixed(2)} NM`;

      // 10. Nearest assignable track spacing S
      const sInput = document.getElementById(`plan-alloc-s-${i}`);
      const S = sInput ? (parseFloat(sInput.value) || 0.0) : 0.0;

      // 11. Adjusted search area A = V * T * S
      const A = Math.round(v * T * S * 100) / 100;
      const resA = document.getElementById(`res-plan-alloc-a-${i}`);
      if (resA) resA.value = `${A.toFixed(2)} NM²`;

      // 11b. Cadangan Masa Penerbangan Per Leg (Fixed-wing ~30m, Rotary-wing ~20m)
      let legTimeHours = 0.5; // default 30 min
      let legTimeLabel = '-';
      if (assetType === 'fixed_wing') {
        legTimeHours = 0.5; // 30 minit (Pesawat Sayap Tetap)
        legTimeLabel = '30m';
      } else if (assetType === 'rotary_wing') {
        legTimeHours = 1.0 / 3.0; // 20 minit (Helikopter)
        legTimeLabel = '20m';
      } else {
        legTimeHours = 1.0; // 60 minit (Kapal / Bot)
        legTimeLabel = '60m';
      }

      const L_leg = v > 0 ? (Math.round(v * legTimeHours * 10) / 10) : 0.0;
      const resLleg = document.getElementById(`res-plan-alloc-lleg-${i}`);
      if (resLleg) {
        if (v > 0) {
          resLleg.value = `${legTimeLabel} @ ${L_leg.toFixed(1)} NM`;
        } else {
          resLleg.value = '-';
        }
      }

      // 11c. Bilangan Laluan Carian (Search Legs, N) - Nombor Bulat / Whole Integer
      const totalTrack = v * T;
      let N = 0;
      if (L_leg > 0 && totalTrack > 0) {
        N = Math.max(1, Math.round(totalTrack / L_leg));
      }
      const resLegs = document.getElementById(`res-plan-alloc-legs-${i}`);
      if (resLegs) {
        resLegs.value = N > 0 ? `${N} laluan` : '0';
      }

      // 11d. Lebar Sub-Kawasan Carian (Wsub = N × S) - Validasi Gandaan Bulat Track Spacings
      const Wsub = Math.round(N * S * 100) / 100;
      const resWsub = document.getElementById(`res-plan-alloc-wsub-${i}`);
      if (resWsub) {
        resWsub.value = Wsub > 0 ? `${Wsub.toFixed(2)} NM` : '0.00 NM';
      }

      At += A;
    }

    At = Math.round(At * 100) / 100;
    if (el.resPlanAllocAt) el.resPlanAllocAt.textContent = `${At.toFixed(2)} NM²`;

    // 13. Adjusted search radius R
    let R = 0.0;
    if (datumType === 'single') {
      R = At > 0 ? (Math.round((Math.sqrt(At) / 2.0) * 100) / 100) : 0.0;
    } else if (datumType === 'leeway') {
      const insideSqrt = (dd * dd) + (4 * At);
      R = insideSqrt >= 0 ? (Math.round(((Math.sqrt(insideSqrt) - dd) / 4.0) * 100) / 100) : 0.0;
    } else if (datumType === 'line') {
      R = (L > 0 && At > 0) ? (Math.round((At / (2.0 * L)) * 100) / 100) : 0.0;
    }
    if (el.resPlanAllocR) el.resPlanAllocR.textContent = `${R.toFixed(2)} NM`;

    if (el.summaryPlanAllocVal) {
      el.summaryPlanAllocVal.textContent = `A_t: ${At.toFixed(2)} NM² • R: ${R.toFixed(2)} NM`;
    }

    updateCaseInfoUI();
  }

  function updateCaseInfoUI() {
    const title = el.planCaseTitle ? el.planCaseTitle.value : 'Operasi SAR Maritim';
    const num = el.planCaseNum ? el.planCaseNum.value : 'SAR-2026/01';
    const date = el.planCaseDate ? el.planCaseDate.value : '';
    const planner = el.planPlannerName ? el.planPlannerName.value : 'SMC / Duty Officer';
    const datumNum = el.planDatumNum ? el.planDatumNum.value : '1';
    const plan = el.planSearchPlan ? el.planSearchPlan.value : 'A';
    const object = el.planSearchObject ? el.planSearchObject.value : 'Rakit Keselamatan (Liferaft)';

    // Tab 3 Cockpit Summary Box
    const dispTitle = document.getElementById('plan-disp-case-title');
    const dispNum = document.getElementById('plan-disp-case-num');
    const dispPlan = document.getElementById('plan-disp-search-plan');
    const dispDate = document.getElementById('plan-disp-case-date');
    const dispDatumNum = document.getElementById('plan-disp-datum-num');
    const dispPlanner = document.getElementById('plan-disp-planner-name');
    const dispObj = document.getElementById('plan-disp-search-object');

    if (dispTitle) dispTitle.textContent = title || 'Operasi SAR';
    if (dispNum) dispNum.textContent = num || 'SAR-2026/01';
    if (dispPlan) dispPlan.textContent = `Plan ${plan}`;
    if (dispDate) dispDate.textContent = date || new Date().toISOString().slice(0, 10);
    if (dispDatumNum) dispDatumNum.textContent = datumNum || '1';
    if (dispPlanner) dispPlanner.textContent = planner || 'SMC / Duty Officer';
    if (dispObj) dispObj.textContent = object || 'Sasaran SAR';

    // Drawer ZTA Bahagian 1 Summary Box
    const ztaTitle = document.getElementById('zta-disp-case-title');
    const ztaNum = document.getElementById('zta-disp-case-num');
    const ztaPlanner = document.getElementById('zta-disp-planner-name');
    const ztaPlanDatum = document.getElementById('zta-disp-plan-datum');
    const ztaObj = document.getElementById('zta-disp-search-object');

    if (ztaTitle) ztaTitle.textContent = title || 'Operasi SAR';
    if (ztaNum) ztaNum.textContent = num || 'SAR-2026/01';
    if (ztaPlanner) ztaPlanner.textContent = planner || 'SMC / Duty Officer';
    if (ztaPlanDatum) ztaPlanDatum.textContent = `Plan ${plan} • Datum ${datumNum}`;
    if (ztaObj) ztaObj.textContent = object || 'Sasaran SAR';

    // Drawer Allocation Bahagian 1
    if (el.resAllocSubTitle) el.resAllocSubTitle.textContent = (num ? `${num} (${title})` : title);
    if (el.resAllocSubObject) el.resAllocSubObject.textContent = object;
    const latLStr = el.planDatumLatL ? el.planDatumLatL.value : '';
    const lonLStr = el.planDatumLonL ? el.planDatumLonL.value : '';
    const latRStr = el.planDatumLatR ? el.planDatumLatR.value : '';
    const lonRStr = el.planDatumLonR ? el.planDatumLonR.value : '';
    if (el.resAllocSubLatL) el.resAllocSubLatL.textContent = (latLStr && lonLStr) ? `${latLStr}, ${lonLStr}` : (latLStr || '---');
    if (el.resAllocSubLatR) el.resAllocSubLatR.textContent = (latRStr && lonRStr) ? `${latRStr}, ${lonRStr}` : (latRStr || '---');
  }

  function calculatePlanning() {
    updateCaseInfoUI();
    calculateZta();
    calculateAllocation();
    saveAppState();
  }

  function resetZta() {
    if (!confirm('Set semula jadual kemudahan carian Zta ke nilai lalai?')) return;
    const defaults = [
      { subarea: '', sru: '', type: 'surface', v: 0.0, endurance: 0.0, daylight: 0.0, alt: 0, wu: 0.0, fw: 1.0, fv: 1.0, ff: 1.0 },
      { subarea: '', sru: '', type: 'surface', v: 0.0, endurance: 0.0, daylight: 0.0, alt: 0, wu: 0.0, fw: 1.0, fv: 1.0, ff: 1.0 },
      { subarea: '', sru: '', type: 'surface', v: 0.0, endurance: 0.0, daylight: 0.0, alt: 0, wu: 0.0, fw: 1.0, fv: 1.0, ff: 1.0 },
      { subarea: '', sru: '', type: 'surface', v: 0.0, endurance: 0.0, daylight: 0.0, alt: 0, wu: 0.0, fw: 1.0, fv: 1.0, ff: 1.0 },
      { subarea: '', sru: '', type: 'surface', v: 0.0, endurance: 0.0, daylight: 0.0, alt: 0, wu: 0.0, fw: 1.0, fv: 1.0, ff: 1.0 }
    ];

    for (let i = 1; i <= 5; i++) {
      const d = defaults[i - 1];
      const sub = document.getElementById(`plan-zta-subarea-${i}`);
      const sru = document.getElementById(`plan-zta-sru-${i}`);
      const type = document.getElementById(`plan-zta-type-${i}`);
      const v = document.getElementById(`plan-zta-v-${i}`);
      const end = document.getElementById(`plan-zta-endurance-${i}`);
      const day = document.getElementById(`plan-zta-daylight-${i}`);
      const alt = document.getElementById(`plan-zta-alt-${i}`);
      const wu = document.getElementById(`plan-zta-wu-${i}`);
      const fw = document.getElementById(`plan-zta-fw-${i}`);
      const fv = document.getElementById(`plan-zta-fv-${i}`);
      const ff = document.getElementById(`plan-zta-ff-${i}`);

      if (sub) sub.value = d.subarea;
      if (sru) sru.value = d.sru;
      if (type) type.value = d.type;
      if (v) v.value = d.v;
      if (end) end.value = d.endurance;
      if (day) day.value = d.daylight;
      if (alt) alt.value = d.alt;
      if (wu) wu.value = d.wu;
      if (fw) fw.value = d.fw;
      if (fv) fv.value = d.fv;
      if (ff) ff.value = d.ff;
    }

    calculatePlanning();
  }

  function resetAllocation() {
    if (!confirm('Set semula parameter Effort Allocation ke nilai asal?')) return;
    if (el.planAllocFs) el.planAllocFs.value = '1.0';
    if (el.planAllocL) el.planAllocL.value = '10.0';
    if (el.planAllocZrcHalved) el.planAllocZrcHalved.checked = false;
    for (let i = 1; i <= 5; i++) {
      const s = document.getElementById(`plan-alloc-s-${i}`);
      if (s) s.value = 0.0;
    }
    syncPlanningFromTab2();
  }

  function resetPlanningAll() {
    if (!confirm('Adakah anda pasti mahu set semula (reset) semua maklumat perancangan SAR?')) return;
    if (el.planCaseTitle) el.planCaseTitle.value = 'Operasi SAR Maritim';
    if (el.planCaseNum) el.planCaseNum.value = 'SAR-2026/01';
    if (el.planPlannerName) el.planPlannerName.value = 'SMC / Duty Officer';
    if (el.planSearchPlan) el.planSearchPlan.value = 'A';
    if (el.planDatumNum) el.planDatumNum.value = '1';
    resetZta();
    resetAllocation();
  }

  // =========================================================================
  // IAMSAR TABLES (N-1 HINGGA N-8) LOOKUP & MODAL RENDERING LOGIC
  // =========================================================================

  function renderIamsarTable(tableKey = 'tableN1_NavigationalFixErrors') {
    if (!el.iamsarModalBody) return;
    const tableData = IAMSAR_TABLES[tableKey];
    if (!tableData) return;

    let html = `
      <div style="margin-bottom: 0.85rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem;">
        <div>
          <h4 style="margin: 0; color: var(--accent-cyan); font-size: 0.95rem;">${tableData.title}</h4>
          ${tableData.unit ? `<small style="color: var(--text-muted);">Unit: <strong>${tableData.unit}</strong></small>` : ''}
        </div>
      </div>
    `;

    if (tableKey === 'tableN1_NavigationalFixErrors') {
      html += `
        <div class="iamsar-table-responsive">
          <table class="iamsar-data-table">
            <thead>
              <tr>
                <th>Kaedah Navigasi (Means of Navigation)</th>
                <th>Ralat Posisi (Fix Error - NM)</th>
              </tr>
            </thead>
            <tbody>
              ${tableData.data.map(d => `
                <tr>
                  <td style="font-weight: 600;">${d.meansOfNavigation}</td>
                  <td style="color: #38bdf8; font-weight: 700;">${d.fixError} NM</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ${tableData.note ? `<div style="font-size: 0.72rem; color: #fbbf24; margin-top: 0.65rem;">${tableData.note}</div>` : ''}
      `;
    } else if (tableKey === 'tableN2_FixErrorsByCraftType') {
      html += `
        <div class="iamsar-table-responsive">
          <table class="iamsar-data-table">
            <thead>
              <tr>
                <th>Jenis Vesel / Pesawat (Craft Type)</th>
                <th>Ralat Posisi (Fix Error - NM)</th>
              </tr>
            </thead>
            <tbody>
              ${tableData.data.map(d => `
                <tr>
                  <td style="font-weight: 600;">${d.craftType}</td>
                  <td style="color: #38bdf8; font-weight: 700;">${d.fixError} NM</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.65rem;">Digunakan apabila kaedah navigasi sasaran tidak diketahui.</div>
      `;
    } else if (tableKey === 'tableN3_DeadReckoningErrors') {
      html += `
        <div class="iamsar-table-responsive">
          <table class="iamsar-data-table">
            <thead>
              <tr>
                <th>Jenis Vesel / Pesawat (Craft Type)</th>
                <th>Kadar Ralat DR (% of DR Distance)</th>
              </tr>
            </thead>
            <tbody>
              ${tableData.data.map(d => `
                <tr>
                  <td style="font-weight: 600;">${d.craftType}</td>
                  <td style="color: #34d399; font-weight: 700;">${d.drErrorRate}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } else if (tableKey === 'tableN4_MerchantVessels') {
      html += `
        <div class="iamsar-table-responsive">
          <table class="iamsar-data-table">
            <thead>
              <tr>
                <th>Objek Carian (Search Object)</th>
                ${tableData.visibility_NM.map(v => `<th style="text-align: center;">${v} NM</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${tableData.data.map(row => `
                <tr>
                  <td style="font-weight: 600;">${row.searchObject}</td>
                  ${tableData.visibility_NM.map(v => `<td style="text-align: center; color: #38bdf8; font-weight: 700;">${row.sweepWidth[v] !== undefined ? row.sweepWidth[v].toFixed(1) : '-'}</td>`).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } else if (tableKey === 'tableN5_Helicopters' || tableKey === 'tableN6_FixedWingAircraft') {
      const altitudes = Object.keys(tableData.data);
      html += `
        <div style="display: flex; flex-direction: column; gap: 1rem;">
          ${altitudes.map(alt => `
            <div>
              <div style="font-size: 0.78rem; font-weight: 700; color: #34d399; margin-bottom: 0.35rem; display: flex; align-items: center; gap: 0.35rem;">
                <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #34d399;"></span>
                <span>Ketinggian: ${alt}</span>
              </div>
              <div class="iamsar-table-responsive">
                <table class="iamsar-data-table">
                  <thead>
                    <tr>
                      <th>Objek Carian</th>
                      ${tableData.visibility_NM.map(v => `<th style="text-align: center;">${v} NM</th>`).join('')}
                    </tr>
                  </thead>
                  <tbody>
                    ${tableData.data[alt].map(row => `
                      <tr>
                        <td style="font-weight: 600;">${row.searchObject}</td>
                        ${tableData.visibility_NM.map(v => `<td style="text-align: center; color: #38bdf8; font-weight: 700;">${row.sweepWidth[v] !== undefined ? row.sweepWidth[v].toFixed(1) : '-'}</td>`).join('')}
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    } else if (tableKey === 'tableN7_WeatherCorrection') {
      html += `
        <div class="iamsar-table-responsive">
          <table class="iamsar-data-table">
            <thead>
              <tr>
                <th>Keadaan Cuaca &amp; Ombak</th>
                <th style="text-align: center;">PIW, Raft, Bot &lt; 10m</th>
                <th style="text-align: center;">Objek Carian Lain</th>
              </tr>
            </thead>
            <tbody>
              ${tableData.conditions.map(c => `
                <tr>
                  <td style="font-weight: 600;">${c.weather}</td>
                  <td style="text-align: center; color: #fbbf24; font-weight: 700;">${c.personInWaterRaftOrBoatUnder10m}</td>
                  <td style="text-align: center; color: #34d399; font-weight: 700;">${c.otherSearchObjects}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } else if (tableKey === 'tableN8_SpeedCorrection') {
      html += `
        <div class="iamsar-table-responsive">
          <table class="iamsar-data-table">
            <thead>
              <tr>
                <th rowspan="2" style="vertical-align: middle;">Objek Carian</th>
                <th colspan="${tableData.speeds_kts.fixedWing.length}" style="text-align: center; background: rgba(56, 189, 248, 0.2);">Fixed-Wing (kts)</th>
                <th colspan="${tableData.speeds_kts.helicopter.length}" style="text-align: center; background: rgba(16, 185, 129, 0.2);">Helikopter (kts)</th>
              </tr>
              <tr>
                ${tableData.speeds_kts.fixedWing.map(s => `<th style="text-align: center; font-size: 0.72rem;">${s}</th>`).join('')}
                ${tableData.speeds_kts.helicopter.map(s => `<th style="text-align: center; font-size: 0.72rem;">${s}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${tableData.data.map(row => `
                <tr>
                  <td style="font-weight: 600;">${row.searchObject}</td>
                  ${tableData.speeds_kts.fixedWing.map(s => `<td style="text-align: center; color: #38bdf8; font-weight: 700;">${row.fixedWing[s] !== undefined ? row.fixedWing[s].toFixed(1) : '-'}</td>`).join('')}
                  ${tableData.speeds_kts.helicopter.map(s => `<td style="text-align: center; color: #34d399; font-weight: 700;">${row.helicopter[s] !== undefined ? row.helicopter[s].toFixed(1) : '-'}</td>`).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    el.iamsarModalBody.innerHTML = html;
  }

  function openIamsarTablesModal(tableKey = 'tableN1_NavigationalFixErrors') {
    if (!el.modalIamsarTables) return;
    renderIamsarTable(tableKey);

    if (el.iamsarModalTabs) {
      el.iamsarModalTabs.querySelectorAll('.iamsar-tab-btn').forEach(btn => {
        if (btn.dataset.table === tableKey) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    }

    el.modalIamsarTables.classList.add('active');
  }

  function closeIamsarTablesModal() {
    if (!el.modalIamsarTables) return;
    el.modalIamsarTables.classList.remove('active');
  }

  // Helper Lookups dari Jadual IAMSAR N-4, N-5, N-6, N-7, N-8
  function lookupWuFromIamsar(facilityType, altVal, altUnit, objectName, visNm) {
    const visNum = parseFloat(visNm) || 10;
    const visKeys = [1, 3, 5, 10, 15, 20];
    let closestVis = 10;
    let minDiff = 999;
    for (const v of visKeys) {
      const diff = Math.abs(v - visNum);
      if (diff < minDiff) {
        minDiff = diff;
        closestVis = v;
      }
    }

    if (facilityType === 'surface') {
      const merchantData = IAMSAR_TABLES.tableN4_MerchantVessels.data;
      const match = merchantData.find(d => objectName.toLowerCase().includes(d.searchObject.toLowerCase()) || d.searchObject.toLowerCase().includes(objectName.toLowerCase())) || merchantData[2];
      return match.sweepWidth[closestVis] !== undefined ? match.sweepWidth[closestVis] : 2.0;
    }

    // Aset Udara (Helikopter / Fixed-Wing)
    let altFt = parseFloat(altVal) || 500;
    if (altUnit === 'm') altFt = altFt * 3.28084;

    let altKey = "150m (500ft)";
    if (altFt >= 1500) {
      altKey = "600m (2000ft)";
    } else if (altFt >= 750) {
      altKey = "300m (1000ft)";
    } else {
      altKey = "150m (500ft)";
    }

    const tableSource = facilityType === 'rotary_wing' ? IAMSAR_TABLES.tableN5_Helicopters.data[altKey] : IAMSAR_TABLES.tableN6_FixedWingAircraft.data[altKey];
    if (!tableSource) return 2.0;

    const match = tableSource.find(d => objectName.toLowerCase().includes(d.searchObject.toLowerCase()) || d.searchObject.toLowerCase().includes(objectName.toLowerCase())) || tableSource[3];
    return match && match.sweepWidth[closestVis] !== undefined ? match.sweepWidth[closestVis] : 2.0;
  }

  function lookupFwFromIamsar(weatherIndex, objectName) {
    const wIndex = parseInt(weatherIndex, 10) || 0;
    const cond = IAMSAR_TABLES.tableN7_WeatherCorrection.conditions[wIndex] || IAMSAR_TABLES.tableN7_WeatherCorrection.conditions[0];
    const isSmall = objectName.toLowerCase().includes('person') || objectName.toLowerCase().includes('raft') || objectName.toLowerCase().includes('< 5') || objectName.toLowerCase().includes('6') || objectName.toLowerCase().includes('8');
    return isSmall ? cond.personInWaterRaftOrBoatUnder10m : cond.otherSearchObjects;
  }

  function lookupFvFromIamsar(facilityType, speedKts, objectName) {
    if (facilityType === 'surface') return 1.0;
    const spd = parseFloat(speedKts) || 90;
    const speedData = IAMSAR_TABLES.tableN8_SpeedCorrection.data;
    const match = speedData.find(d => objectName.toLowerCase().includes(d.searchObject.toLowerCase()) || d.searchObject.toLowerCase().includes(objectName.toLowerCase())) || speedData[2];

    if (facilityType === 'fixed_wing') {
      const fixedSpeeds = [150, 180, 210];
      let closest = 180;
      let minDiff = 999;
      for (const s of fixedSpeeds) {
        if (Math.abs(s - spd) < minDiff) {
          minDiff = Math.abs(s - spd);
          closest = s;
        }
      }
      return match && match.fixedWing[closest] !== undefined ? match.fixedWing[closest] : 1.0;
    } else {
      // rotary_wing
      const heliSpeeds = [60, 90, 120, 140];
      let closest = 90;
      let minDiff = 999;
      for (const s of heliSpeeds) {
        if (Math.abs(s - spd) < minDiff) {
          minDiff = Math.abs(s - spd);
          closest = s;
        }
      }
      return match && match.helicopter[closest] !== undefined ? match.helicopter[closest] : 1.0;
    }
  }

  function applyIamsarLookupToZta() {
    const objectName = el.lookupSearchObject ? el.lookupSearchObject.value : 'Raft 6-person';
    const visNm = el.lookupVisibility ? el.lookupVisibility.value : '10';
    const weatherIndex = el.lookupWeather ? el.lookupWeather.value : '0';

    for (let i = 1; i <= 5; i++) {
      const typeSelect = document.getElementById(`plan-zta-type-${i}`);
      const altInput = document.getElementById(`plan-zta-alt-${i}`);
      const altUnitSelect = document.getElementById(`plan-zta-alt-unit-${i}`);
      const vInput = document.getElementById(`plan-zta-v-${i}`);
      const wuInput = document.getElementById(`plan-zta-wu-${i}`);
      const fwInput = document.getElementById(`plan-zta-fw-${i}`);
      const fvInput = document.getElementById(`plan-zta-fv-${i}`);

      const facilityType = typeSelect ? typeSelect.value : 'surface';
      const altVal = altInput ? altInput.value : '0';
      const altUnit = altUnitSelect ? altUnitSelect.value : 'ft';
      const speed = vInput ? (parseFloat(vInput.value) || (facilityType === 'surface' ? 15 : (facilityType === 'fixed_wing' ? 150 : 90))) : 90;

      const wu = lookupWuFromIamsar(facilityType, altVal, altUnit, objectName, visNm);
      const fw = lookupFwFromIamsar(weatherIndex, objectName);
      const fv = lookupFvFromIamsar(facilityType, speed, objectName);

      if (wuInput) wuInput.value = wu.toFixed(2);
      if (fwInput) fwInput.value = fw.toFixed(2);
      if (fvInput) fvInput.value = fv.toFixed(2);
    }

    calculatePlanning();
  }

  // =========================================================================
  // VISUALISASI KAWASAN CARIAN & CORAK PENCARIAN (SEARCH PATTERNS) PADA PETA
  // =========================================================================

  function plotSearchPatternsOnMap() {
    calculatePlanning();

    // Tukar ke mod paparan Peta Laut jika berada dalam mod grid
    if (state.displayMode !== 'map') {
      switchDisplayMode('map');
    }

    if (!leafletMap) return;

    if (!planningLayerGroup) {
      planningLayerGroup = L.layerGroup().addTo(leafletMap);
    }
    planningLayerGroup.clearLayers();

    // 1. Tentukan Titik Datum Rujukan (Datum L, Datum R, atau Single Datum)
    let datumLat = state.originGeo.lat;
    let datumLon = state.originGeo.lon;
    let datumLatL = null, datumLonL = null;
    let datumLatR = null, datumLonR = null;

    if (state.finalDatum) {
      datumLat = state.finalDatum.datumLat || datumLat;
      datumLon = state.finalDatum.datumLon || datumLon;
      datumLatL = state.finalDatum.datumLatL || null;
      datumLonL = state.finalDatum.datumLonL || null;
      datumLatR = state.finalDatum.datumLatR || null;
      datumLonR = state.finalDatum.datumLonR || null;
    } else {
      if (el.planDatumLatL && el.planDatumLonL) {
        datumLatL = parseCoordinate(el.planDatumLatL.value, true);
        datumLonL = parseCoordinate(el.planDatumLonL.value, false);
      }
      if (el.planDatumLatR && el.planDatumLonR) {
        datumLatR = parseCoordinate(el.planDatumLatR.value, true);
        datumLonR = parseCoordinate(el.planDatumLonR.value, false);
      }
      if (!isNaN(datumLatL) && !isNaN(datumLonL) && !isNaN(datumLatR) && !isNaN(datumLonR)) {
        datumLat = (datumLatL + datumLatR) / 2;
        datumLon = (datumLonL + datumLonR) / 2;
      }
    }

    const datumType = state.planning?.datumType || 'leeway';
    const R_NM = el.resPlanAllocR ? (parseFloat(el.resPlanAllocR.textContent) || 0.0) : 0.0;
    const boundsPoints = [];

    // Tentukan Pusat Carian & Orientasi Sudut (Baseline Bearing)
    let centerLat = datumLat;
    let centerLon = datumLon;
    let baselineBearingRad = 0; // Sudut paksi utama (radians dari Utara Benar)
    let hasDivergence = false;

    if (datumLatL && datumLonL && datumLatR && datumLonR && !isNaN(datumLatL) && !isNaN(datumLatR)) {
      hasDivergence = true;
      centerLat = (datumLatL + datumLatR) / 2;
      centerLon = (datumLonL + datumLonR) / 2;

      const cosMid = Math.cos((centerLat * Math.PI) / 180);
      const dLonNM = (datumLonR - datumLonL) * 60 * cosMid;
      const dLatNM = (datumLatR - datumLatL) * 60;
      baselineBearingRad = Math.atan2(dLonNM, dLatNM); // Bearing L -> R
    } else if (state.originGeo && !isNaN(state.originGeo.lat) && !isNaN(state.originGeo.lon)) {
      // Jika Single Datum, gunakan arah hanyutan (drift bearing) dari Origin ke Datum
      const cosMid = Math.cos((((state.originGeo.lat + datumLat) / 2) * Math.PI) / 180);
      const dLonNM = (datumLon - state.originGeo.lon) * 60 * cosMid;
      const dLatNM = (datumLat - state.originGeo.lat) * 60;
      if (Math.abs(dLonNM) > 0.01 || Math.abs(dLatNM) > 0.01) {
        baselineBearingRad = Math.atan2(dLonNM, dLatNM);
      }
    }

    const baselineBearingDeg = Math.round(((baselineBearingRad * 180 / Math.PI) + 360) % 360);

    if (!isNaN(centerLat) && !isNaN(centerLon)) {
      boundsPoints.push([centerLat, centerLon]);
    }

    // 2. Lukis Garisan Dasar Pencapahan Leeway (Divergence Baseline) & Bulatan Radius Carian (R)
    if (hasDivergence) {
      // Garis penghubung Datum L - Datum R
      const baselineLine = L.polyline([[datumLatL, datumLonL], [datumLatR, datumLonR]], {
        color: '#e2e8f0',
        weight: 2,
        dashArray: '4, 6',
        opacity: 0.8
      }).addTo(planningLayerGroup);
      baselineLine.bindTooltip(`Paksi Pencapahan Leeway (Baseline $D_L - D_R$): ${baselineBearingDeg}°`, {
        className: 'nautical-map-tooltip'
      });
      boundsPoints.push([datumLatL, datumLonL], [datumLatR, datumLonR]);
    }

    if (R_NM > 0) {
      const radiusMeters = R_NM * 1852;
      if (datumType === 'leeway' && hasDivergence) {
        const circleL = L.circle([datumLatL, datumLonL], {
          radius: radiusMeters,
          color: '#38bdf8',
          weight: 2,
          dashArray: '6, 6',
          fillColor: '#38bdf8',
          fillOpacity: 0.08
        }).addTo(planningLayerGroup);
        circleL.bindTooltip(`Radius Carian L: ${R_NM.toFixed(2)} NM`, { className: 'nautical-map-tooltip' });

        const circleR = L.circle([datumLatR, datumLonR], {
          radius: radiusMeters,
          color: '#34d399',
          weight: 2,
          dashArray: '6, 6',
          fillColor: '#34d399',
          fillOpacity: 0.08
        }).addTo(planningLayerGroup);
        circleR.bindTooltip(`Radius Carian R: ${R_NM.toFixed(2)} NM`, { className: 'nautical-map-tooltip' });
      } else {
        const singleRadiusCircle = L.circle([centerLat, centerLon], {
          radius: radiusMeters,
          color: '#fbbf24',
          weight: 2,
          dashArray: '6, 6',
          fillColor: '#fbbf24',
          fillOpacity: 0.08
        }).addTo(planningLayerGroup);
        singleRadiusCircle.bindTooltip(`Radius Carian R: ${R_NM.toFixed(2)} NM`, { className: 'nautical-map-tooltip' });
      }
    }

    // 3. Kumpulkan Fasiliti Aktif (dengan S > 0 & A > 0)
    const activeFacilities = [];
    const facilityColors = ['#38bdf8', '#34d399', '#fbbf24', '#f472b6', '#a78bfa'];

    for (let i = 1; i <= 5; i++) {
      const sInput = document.getElementById(`plan-alloc-s-${i}`);
      const sruInput = document.getElementById(`plan-zta-sru-${i}`);
      const subareaInput = document.getElementById(`plan-zta-subarea-${i}`);
      const typeSelect = document.getElementById(`plan-zta-type-${i}`);
      const vInput = document.getElementById(`plan-zta-v-${i}`);
      const endInput = document.getElementById(`plan-zta-endurance-${i}`);
      const dayInput = document.getElementById(`plan-zta-daylight-${i}`);

      const S = sInput ? (parseFloat(sInput.value) || 0.0) : 0.0;
      const v = vInput ? (parseFloat(vInput.value) || 0.0) : 0.0;
      const end = endInput ? (parseFloat(endInput.value) || 0.0) : 0.0;
      const day = dayInput ? (parseFloat(dayInput.value) || 0.0) : 0.0;
      const minHours = Math.min(end, day);
      const T = (end > 0 && day > 0) ? (0.85 * minHours) : 0.0;
      const A = v * T * S;

      if (S > 0 && A > 0) {
        const assetType = typeSelect ? typeSelect.value : (i === 2 ? 'rotary_wing' : 'surface');
        let legTimeHours = 0.5;
        if (assetType === 'fixed_wing') legTimeHours = 0.5;
        else if (assetType === 'rotary_wing') legTimeHours = 0.3333;
        else legTimeHours = Math.max(0.5, T / 4.0);

        const targetLegLength = Math.max(1.0, v * legTimeHours);
        let N = Math.max(1, Math.round(A / (S * targetLegLength)));
        const Wsub = N * S;
        const L_leg = A / Wsub;

        activeFacilities.push({
          index: i,
          subarea: (subareaInput && subareaInput.value.trim()) ? subareaInput.value.trim() : `Sub-Area ${i}`,
          sru: (sruInput && sruInput.value.trim()) ? sruInput.value.trim() : `Fasiliti ${i}`,
          assetType,
          v,
          T,
          S,
          A,
          N,
          Wsub,
          L_leg,
          color: facilityColors[i - 1] || '#38bdf8'
        });
      }
    }

    if (activeFacilities.length === 0) {
      if (boundsPoints.length > 0) {
        leafletMap.fitBounds(boundsPoints, { padding: [50, 50], maxZoom: 13 });
      }
      return;
    }

    // 4. Transformasi Geometri (Rotasi Mengikut Sudut Paksi IAMSAR)
    // Fungsi pembantu untuk putar titik (x, y) dalam NM mengikut sudut orientasi dan tukar ke Lat/Lon
    const cosCenterLat = Math.cos((centerLat * Math.PI) / 180.0);
    function toGeoPoint(xNM, yNM, rotRad) {
      // Rotasi 2D: x adalah paksi kemaraan (creep axis), y adalah paksi laluan (search leg axis)
      const rx = xNM * Math.cos(rotRad) - yNM * Math.sin(rotRad);
      const ry = xNM * Math.sin(rotRad) + yNM * Math.cos(rotRad);
      const lat = centerLat + (ry / 60.0);
      const lon = centerLon + (rx / (60.0 * cosCenterLat));
      boundsPoints.push([lat, lon]);
      return [lat, lon];
    }

    const totalWidth = activeFacilities.reduce((sum, f) => sum + f.Wsub, 0);
    let currentCrossOffset = -totalWidth / 2;

    activeFacilities.forEach((fac) => {
      const halfLeg = fac.L_leg / 2;
      const xStart = currentCrossOffset;
      const xEnd = currentCrossOffset + fac.Wsub;

      // Orientasi Sudut mengikut Corak:
      // Parallel Sweep (PS): Leg selari dengan paksi utama (rotRad = baselineBearingRad)
      // Creeping Line (CS): Leg berserenjang dengan paksi utama (rotRad = baselineBearingRad + PI/2)
      const isPS = fac.assetType === 'surface';
      const rotAngleRad = isPS ? baselineBearingRad : (baselineBearingRad + Math.PI / 2);
      const patternType = isPS ? 'Parallel Track Search (PS)' : 'Creeping Line Search (CS)';
      const legHeadingDeg = Math.round(((rotAngleRad * 180 / Math.PI) + 360) % 360);
      const oppHeadingDeg = (legHeadingDeg + 180) % 360;

      // 4 bucu kotak sub-kawasan (NM)
      const cornerLatLngs = [
        toGeoPoint(xStart, halfLeg, rotAngleRad),
        toGeoPoint(xEnd, halfLeg, rotAngleRad),
        toGeoPoint(xEnd, -halfLeg, rotAngleRad),
        toGeoPoint(xStart, -halfLeg, rotAngleRad)
      ];

      // Lukis Poligon Kotak Sub-Kawasan Berorientasi
      const subareaPolygon = L.polygon(cornerLatLngs, {
        color: fac.color,
        weight: 2,
        dashArray: '5, 5',
        fillColor: fac.color,
        fillOpacity: 0.12
      }).addTo(planningLayerGroup);

      subareaPolygon.bindTooltip(`
        <strong>${fac.subarea}</strong>: ${fac.sru}<br>
        Luas: ${fac.A.toFixed(2)} NM² • S: ${fac.S.toFixed(2)} NM<br>
        Arah Laluan: ${legHeadingDeg}° / ${oppHeadingDeg}°
      `, {
        direction: 'center',
        className: 'nautical-map-tooltip'
      });

      // 5. Jana Titik Laluan Carian Berputar (Rotated Zig-Zag Track Legs)
      const trackLatLngs = [];
      for (let legIdx = 0; legIdx < fac.N; legIdx++) {
        const trackX = xStart + (legIdx + 0.5) * fac.S;
        const isUp = (legIdx % 2 === 0);
        const y1 = isUp ? -halfLeg : halfLeg;
        const y2 = isUp ? halfLeg : -halfLeg;

        const pt1 = toGeoPoint(trackX, y1, rotAngleRad);
        const pt2 = toGeoPoint(trackX, y2, rotAngleRad);

        trackLatLngs.push(pt1, pt2);
      }

      // Lukis Garisan Laluan Search Pattern
      if (trackLatLngs.length > 0) {
        const searchTrackLine = L.polyline(trackLatLngs, {
          color: fac.color,
          weight: 2.8,
          opacity: 0.95
        }).addTo(planningLayerGroup);

        searchTrackLine.bindTooltip(`Corak: ${patternType} (${fac.N} laluan @ ${legHeadingDeg}°/${oppHeadingDeg}°)`, {
          className: 'nautical-map-tooltip'
        });

        // 6. Penanda Titik Mula Carian (CSP - Commence Search Point)
        const cspPt = trackLatLngs[0];
        const cspMarker = L.circleMarker(cspPt, {
          radius: 8,
          fillColor: fac.color,
          color: '#ffffff',
          weight: 2.5,
          fillOpacity: 1
        }).addTo(planningLayerGroup);

        cspMarker.bindPopup(`
          <div style="font-family: 'Outfit', sans-serif; min-width: 230px; font-size: 0.85rem;">
            <div style="display:flex; align-items:center; gap:6px; margin-bottom:6px; border-bottom:1px solid rgba(0,0,0,0.1); padding-bottom:4px;">
              <span style="background:${fac.color}; color:#fff; font-size:0.68rem; font-weight:800; padding:2px 6px; border-radius:3px;">CSP</span>
              <strong style="color:${fac.color}; font-size:0.95rem;">${fac.subarea} - ${fac.sru}</strong>
            </div>
            <p style="margin:3px 0;"><strong>Corak Carian:</strong> ${patternType}</p>
            <p style="margin:3px 0;"><strong>Orientasi Haluan (Legs):</strong> ${legHeadingDeg}° / ${oppHeadingDeg}°</p>
            <p style="margin:3px 0;"><strong>Paksi Pencapahan:</strong> ${baselineBearingDeg}°</p>
            <p style="margin:3px 0;"><strong>Track Spacing (S):</strong> ${fac.S.toFixed(2)} NM</p>
            <p style="margin:3px 0;"><strong>Bilangan Laluan (N):</strong> ${fac.N} leg</p>
            <p style="margin:3px 0;"><strong>Panjang Laluan (L<sub>leg</sub>):</strong> ${fac.L_leg.toFixed(2)} NM</p>
            <p style="margin:3px 0;"><strong>Lebar Sub-Kawasan (W<sub>sub</sub>):</strong> ${fac.Wsub.toFixed(2)} NM</p>
            <p style="margin:3px 0;"><strong>Keluasan Sub-Kawasan:</strong> ${fac.A.toFixed(2)} NM²</p>
            <p style="margin:3px 0;"><strong>Keupayaan:</strong> ${fac.v.toFixed(1)} kts &bull; ${fac.T.toFixed(2)} jam</p>
          </div>
        `);
      }

      currentCrossOffset += fac.Wsub;
    });

    // 7. Laraskan Zum Peta
    if (boundsPoints.length > 0) {
      leafletMap.fitBounds(boundsPoints, { padding: [60, 60], maxZoom: 14 });
    }
  }

  function calculateTimeInterval() {
    if (!el.distressDateTimeInput || !el.datumDateTimeInput || !el.datumIntervalInput) return;
    
    const distressVal = el.distressDateTimeInput.value;
    const datumVal = el.datumDateTimeInput.value;
    
    if (distressVal && datumVal) {
      const tDistress = new Date(distressVal).getTime();
      const tDatum = new Date(datumVal).getTime();
      const diffMs = tDatum - tDistress;
      if (!isNaN(diffMs)) {
        const diffHours = diffMs / (1000 * 60 * 60);
        if (diffHours >= 0) {
          const rounded = Math.round(diffHours * 100) / 100;
          el.datumIntervalInput.value = rounded.toFixed(2);
        } else {
          el.datumIntervalInput.value = '0.00';
        }
      }
    }
  }

  function onIntervalHoursChanged() {
    if (!el.distressDateTimeInput || !el.datumDateTimeInput || !el.datumIntervalInput) return;
    const intervalHours = parseFloat(el.datumIntervalInput.value);
    const distressVal = el.distressDateTimeInput.value;
    if (!isNaN(intervalHours) && intervalHours >= 0 && distressVal) {
      const tDistress = new Date(distressVal).getTime();
      const newDatumTime = new Date(tDistress + intervalHours * 3600 * 1000);
      newDatumTime.setMinutes(newDatumTime.getMinutes() - newDatumTime.getTimezoneOffset());
      el.datumDateTimeInput.value = newDatumTime.toISOString().slice(0, 16);
    }
  }

  // =========================================================================
  // TUKAR MOD PAPARAN (CARTA GRID vs PETA LAUT)
  // =========================================================================

  function switchDisplayMode(mode) {
    state.displayMode = mode;

    if (mode === 'grid') {
      if (el.viewModeTitle) el.viewModeTitle.textContent = 'Carta Grid Vektor (0,0)';
      if (el.viewModeIcon) {
        el.viewModeIcon.innerHTML = `
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>
        `;
      }

      el.canvas.style.display = 'block';
      el.mapContainer.style.display = 'none';
      if (el.mcCanvasOverlay) el.mcCanvasOverlay.style.display = 'none';
      if (el.mcTimelineBar) el.mcTimelineBar.style.display = 'none';
      el.gridControls.style.display = 'flex';
      el.compassBadge.style.display = 'block';

      el.chartTipText.textContent = 'Tip: Seret tetikus untuk gerakkan carta • Skrol untuk Zum';
      resizeCanvas();
    } else {
      if (el.viewModeTitle) el.viewModeTitle.textContent = 'Peta Laut & Terestrial (OpenSeaMap)';
      if (el.viewModeIcon) {
        el.viewModeIcon.innerHTML = `
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" stroke-width="2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>
        `;
      }

      el.canvas.style.display = 'none';
      el.mapContainer.style.display = 'block';
      if (el.mcTimelineBar) el.mcTimelineBar.style.display = 'flex';
      el.gridControls.style.display = 'none';
      el.compassBadge.style.display = 'none';

      el.chartTipText.textContent = 'Peta Laut & Terestrial (OSM + OpenSeaMap + Esri Ocean) • Skrol untuk Zum Peta';

      if (!leafletMap) {
        initLeafletMap();
      }
      
      const triggerMapResize = () => {
        if (leafletMap) {
          leafletMap.invalidateSize();
          updateLeafletMap();
        }
      };

      requestAnimationFrame(triggerMapResize);
      setTimeout(triggerMapResize, 50);
      setTimeout(triggerMapResize, 150);
      setTimeout(triggerMapResize, 350);
    }
  }

  // =========================================================================
  // PERSISTENSI KEADAAN (LOCAL STORAGE STATE PERSISTENCE)
  // =========================================================================

  const STORAGE_KEY = 'nautical_calc_saved_state_v2';

  function saveAppState() {
    try {
      const dataToSave = {
        version: 2,
        vectors: state.vectors,
        points: state.points,
        isCalculated: state.isCalculated,
        resultant: state.resultant,
        tab1Inputs: {
          bearing: el.bearingInput ? el.bearingInput.value : '',
          speed: el.speedInput ? el.speedInput.value : '',
          time: el.timeInput ? el.timeInput.value : ''
        },
        cockpit: {
          distressDateTime: el.distressDateTimeInput ? el.distressDateTimeInput.value : '',
          datumDateTime: el.datumDateTimeInput ? el.datumDateTimeInput.value : '',
          datumInterval: el.datumIntervalInput ? el.datumIntervalInput.value : '',
          originLat: el.originLatInput ? el.originLatInput.value : '',
          originLon: el.originLonInput ? el.originLonInput.value : '',
          originGeo: state.originGeo
        },
        asw: {
          vectors: state.aswVectors,
          isCalculated: state.isAswCalculated,
          resultant: state.aswResultant,
          inputs: {
            bearing: el.aswBearingInput ? el.aswBearingInput.value : '',
            speed: el.aswSpeedInput ? el.aswSpeedInput.value : '',
            time: el.aswTimeInput ? el.aswTimeInput.value : '',
            errorType: el.aswErrorTypeSelect ? el.aswErrorTypeSelect.value : '',
            aswE: el.aswEInput ? el.aswEInput.value : '',
            aswdvE: el.aswdvEInput ? el.aswdvEInput.value : ''
          }
        },
        wc: {
          vector: state.wcVector,
          isCalculated: state.isWcCalculated,
          inputs: {
            bearing: el.wcBearingInput ? el.wcBearingInput.value : '',
            speed: el.wcSpeedInput ? el.wcSpeedInput.value : '',
            time: el.wcTimeInput ? el.wcTimeInput.value : '',
            wcE: el.wcEInput ? el.wcEInput.value : ''
          }
        },
        twc: {
          mode: state.twcMode,
          observed: state.twcObserved,
          observedInputs: {
            sourceSelect: el.twcObsSourceSelect ? el.twcObsSourceSelect.value : '',
            sourceInput: el.twcObsSourceInput ? el.twcObsSourceInput.value : '',
            bearing: el.twcObsBearingInput ? el.twcObsBearingInput.value : '',
            speed: el.twcObsSpeedInput ? el.twcObsSpeedInput.value : '',
            time: el.twcObsTimeInput ? el.twcObsTimeInput.value : '',
            quality: el.twcObsQualitySelect ? el.twcObsQualitySelect.value : '',
            twcE: el.twcObsEInput ? el.twcObsEInput.value : ''
          },
          computedVectors: state.scVectors,
          isCalculated: state.isScCalculated,
          resultant: state.scResultant,
          computedInputs: {
            type: el.scTypeSelect ? el.scTypeSelect.value : 'SC',
            bearing: el.scBearingInput ? el.scBearingInput.value : '',
            speed: el.scSpeedInput ? el.scSpeedInput.value : '',
            time: el.scTimeInput ? el.scTimeInput.value : '',
            vectorE: el.scVectorEInput ? el.scVectorEInput.value : ''
          }
        },
        leeway: {
          targetType: el.leewayTargetType ? el.leewayTargetType.value : '',
          divergence: el.leewayDivergence ? el.leewayDivergence.value : '',
          customPct: el.leewayCustomPct ? el.leewayCustomPct.value : '',
          time: el.lwTimeInput ? el.lwTimeInput.value : '',
          lwE: el.lwEInput ? el.lwEInput.value : '',
          vector: state.leewayVector,
          isCalculated: state.isLeewayCalculated
        },
        errorInputs: {
          xFix: el.errXFixInput ? el.errXFixInput.value : '',
          xDrRate: el.errXDrRateInput ? el.errXDrRateInput.value : '',
          xDrDist: el.errXDrDistInput ? el.errXDrDistInput.value : '',
          xGlide: el.errXGlideInput ? el.errXGlideInput.value : '',
          deInterval: el.errDeIntervalInput ? el.errDeIntervalInput.value : '',
          deDve: el.errDeDveInput ? el.errDeDveInput.value : '',
          yFix: el.errYFixInput ? el.errYFixInput.value : '',
          yDrRate: el.errYDrRateInput ? el.errYDrRateInput.value : '',
          yDrDist: el.errYDrDistInput ? el.errYDrDistInput.value : ''
        },
        planning: {
          caseTitle: el.planCaseTitle ? el.planCaseTitle.value : '',
          caseNum: el.planCaseNum ? el.planCaseNum.value : '',
          plannerName: el.planPlannerName ? el.planPlannerName.value : '',
          searchPlan: el.planSearchPlan ? el.planSearchPlan.value : 'A',
          datumNum: el.planDatumNum ? el.planDatumNum.value : '1',
          caseDate: el.planCaseDate ? el.planCaseDate.value : '',
          caseDatetime: el.planCaseDatetime ? el.planCaseDatetime.value : '',
          searchObject: el.planSearchObject ? el.planSearchObject.value : '',
          datumLatL: el.planDatumLatL ? el.planDatumLatL.value : '',
          datumLonL: el.planDatumLonL ? el.planDatumLonL.value : '',
          datumLatR: el.planDatumLatR ? el.planDatumLatR.value : '',
          datumLonR: el.planDatumLonR ? el.planDatumLonR.value : '',
          ztaSr: el.planZtaSr ? el.planZtaSr.value : '0.00',
          datumType: state.planning.datumType,
          allocZa: el.planAllocZa ? el.planAllocZa.value : '',
          allocE: el.planAllocE ? el.planAllocE.value : '',
          allocL: el.planAllocL ? el.planAllocL.value : '',
          allocDd: el.planAllocDd ? el.planAllocDd.value : '',
          allocFs: el.planAllocFs ? el.planAllocFs.value : '',
          allocZrc: el.planAllocZrc ? el.planAllocZrc.value : '',
          isZrcHalved: el.planAllocZrcHalved ? el.planAllocZrcHalved.checked : false,
          ztaFacilities: [1, 2, 3, 4, 5].map(i => ({
            subarea: document.getElementById(`plan-zta-subarea-${i}`)?.value || '',
            sru: document.getElementById(`plan-zta-sru-${i}`)?.value || '',
            type: document.getElementById(`plan-zta-type-${i}`)?.value || (i === 2 ? 'rotary_wing' : 'surface'),
            v: document.getElementById(`plan-zta-v-${i}`)?.value || '',
            endurance: document.getElementById(`plan-zta-endurance-${i}`)?.value || '',
            daylight: document.getElementById(`plan-zta-daylight-${i}`)?.value || '',
            alt: document.getElementById(`plan-zta-alt-${i}`)?.value || '',
            altUnit: document.getElementById(`plan-zta-alt-unit-${i}`)?.value || 'ft',
            wu: document.getElementById(`plan-zta-wu-${i}`)?.value || '',
            fw: document.getElementById(`plan-zta-fw-${i}`)?.value || '',
            fv: document.getElementById(`plan-zta-fv-${i}`)?.value || '',
            ff: document.getElementById(`plan-zta-ff-${i}`)?.value || ''
          })),
          allocS: [1, 2, 3, 4, 5].map(i => document.getElementById(`plan-alloc-s-${i}`)?.value || '')
        },
        finalDatum: state.finalDatum,
        activeTab: state.activeTab,
        displayMode: state.displayMode
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (err) {
      console.error('Failed to save state to localStorage:', err);
    }
  }

  function loadAppState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (!data || typeof data !== 'object') return false;

      // Tab 1
      if (Array.isArray(data.vectors)) state.vectors = data.vectors;
      if (Array.isArray(data.points)) state.points = data.points;
      if (typeof data.isCalculated === 'boolean') state.isCalculated = data.isCalculated;
      if (data.resultant) state.resultant = data.resultant;
      if (data.tab1Inputs) {
        if (el.bearingInput && data.tab1Inputs.bearing !== undefined) el.bearingInput.value = data.tab1Inputs.bearing;
        if (el.speedInput && data.tab1Inputs.speed !== undefined) el.speedInput.value = data.tab1Inputs.speed;
        if (el.timeInput && data.tab1Inputs.time !== undefined) el.timeInput.value = data.tab1Inputs.time;
      }

      // Cockpit
      if (data.cockpit) {
        if (el.distressDateTimeInput && data.cockpit.distressDateTime) el.distressDateTimeInput.value = data.cockpit.distressDateTime;
        if (el.datumDateTimeInput && data.cockpit.datumDateTime) el.datumDateTimeInput.value = data.cockpit.datumDateTime;
        if (el.datumIntervalInput && data.cockpit.datumInterval) el.datumIntervalInput.value = data.cockpit.datumInterval;
        if (el.originLatInput && data.cockpit.originLat) el.originLatInput.value = data.cockpit.originLat;
        if (el.originLonInput && data.cockpit.originLon) el.originLonInput.value = data.cockpit.originLon;
        if (data.cockpit.originGeo) state.originGeo = data.cockpit.originGeo;
      }

      // ASW
      if (data.asw) {
        if (Array.isArray(data.asw.vectors)) state.aswVectors = data.asw.vectors;
        if (typeof data.asw.isCalculated === 'boolean') state.isAswCalculated = data.asw.isCalculated;
        if (data.asw.resultant) state.aswResultant = data.asw.resultant;
        if (data.asw.inputs) {
          if (el.aswBearingInput && data.asw.inputs.bearing !== undefined) el.aswBearingInput.value = data.asw.inputs.bearing;
          if (el.aswSpeedInput && data.asw.inputs.speed !== undefined) el.aswSpeedInput.value = data.asw.inputs.speed;
          if (el.aswTimeInput && data.asw.inputs.time !== undefined) el.aswTimeInput.value = data.asw.inputs.time;
          if (el.aswErrorTypeSelect && data.asw.inputs.errorType !== undefined) el.aswErrorTypeSelect.value = data.asw.inputs.errorType;
          if (el.aswEInput && data.asw.inputs.aswE !== undefined) el.aswEInput.value = data.asw.inputs.aswE;
          if (el.aswdvEInput && data.asw.inputs.aswdvE !== undefined) el.aswdvEInput.value = data.asw.inputs.aswdvE;
        }
      }

      // WC
      if (data.wc) {
        if (data.wc.vector) state.wcVector = data.wc.vector;
        if (typeof data.wc.isCalculated === 'boolean') state.isWcCalculated = data.wc.isCalculated;
        if (data.wc.inputs) {
          if (el.wcBearingInput && data.wc.inputs.bearing !== undefined) el.wcBearingInput.value = data.wc.inputs.bearing;
          if (el.wcSpeedInput && data.wc.inputs.speed !== undefined) el.wcSpeedInput.value = data.wc.inputs.speed;
          if (el.wcTimeInput && data.wc.inputs.time !== undefined) el.wcTimeInput.value = data.wc.inputs.time;
          if (el.wcEInput) {
            const savedWcE = data.wc.inputs.wcE;
            el.wcEInput.value = (savedWcE && savedWcE !== '0.1' && savedWcE !== '0.10') ? savedWcE : '0.3';
          }
        }
      } else if (el.wcEInput) {
        el.wcEInput.value = '0.3';
      }

      // TWC (Dual Mode: Observed & Computed)
      if (data.twc) {
        if (data.twc.mode) state.twcMode = data.twc.mode;
        if (data.twc.observed) state.twcObserved = data.twc.observed;
        if (data.twc.observedInputs) {
          if (el.twcObsSourceSelect && data.twc.observedInputs.sourceSelect) el.twcObsSourceSelect.value = data.twc.observedInputs.sourceSelect;
          if (el.twcObsSourceInput && data.twc.observedInputs.sourceInput) el.twcObsSourceInput.value = data.twc.observedInputs.sourceInput;
          if (el.twcObsBearingInput && data.twc.observedInputs.bearing) el.twcObsBearingInput.value = data.twc.observedInputs.bearing;
          if (el.twcObsSpeedInput && data.twc.observedInputs.speed) el.twcObsSpeedInput.value = data.twc.observedInputs.speed;
          if (el.twcObsTimeInput && data.twc.observedInputs.time) el.twcObsTimeInput.value = data.twc.observedInputs.time;
          if (el.twcObsQualitySelect && data.twc.observedInputs.quality) el.twcObsQualitySelect.value = data.twc.observedInputs.quality;
          if (el.twcObsEInput && data.twc.observedInputs.twcE) el.twcObsEInput.value = data.twc.observedInputs.twcE;
        }

        if (Array.isArray(data.twc.computedVectors)) state.scVectors = data.twc.computedVectors;
        if (typeof data.twc.isCalculated === 'boolean') state.isScCalculated = data.twc.isCalculated;
        if (data.twc.resultant) state.scResultant = data.twc.resultant;
        if (data.twc.computedInputs) {
          if (el.scTypeSelect && data.twc.computedInputs.type) el.scTypeSelect.value = data.twc.computedInputs.type;
          if (el.scBearingInput && data.twc.computedInputs.bearing) el.scBearingInput.value = data.twc.computedInputs.bearing;
          if (el.scSpeedInput && data.twc.computedInputs.speed) el.scSpeedInput.value = data.twc.computedInputs.speed;
          if (el.scTimeInput && data.twc.computedInputs.time) el.scTimeInput.value = data.twc.computedInputs.time;
          if (el.scVectorEInput && data.twc.computedInputs.vectorE) el.scVectorEInput.value = data.twc.computedInputs.vectorE;
        }
      } else if (data.sc) {
        // Backward compatibility
        if (Array.isArray(data.sc.vectors)) state.scVectors = data.sc.vectors;
        if (typeof data.sc.isCalculated === 'boolean') state.isScCalculated = data.sc.isCalculated;
        if (data.sc.resultant) state.scResultant = data.sc.resultant;
        if (data.sc.inputs) {
          if (el.scTypeSelect && data.sc.inputs.type) el.scTypeSelect.value = data.sc.inputs.type;
          if (el.scBearingInput && data.sc.inputs.bearing) el.scBearingInput.value = data.sc.inputs.bearing;
          if (el.scSpeedInput && data.sc.inputs.speed) el.scSpeedInput.value = data.sc.inputs.speed;
          if (el.scTimeInput && data.sc.inputs.time) el.scTimeInput.value = data.sc.inputs.time;
        }
      }

      // Leeway & Final Datum
      if (data.leeway) {
        if (el.leewayTargetType && data.leeway.targetType) el.leewayTargetType.value = data.leeway.targetType;
        if (el.leewayDivergence && data.leeway.divergence) el.leewayDivergence.value = data.leeway.divergence;
        if (el.leewayCustomPct && data.leeway.customPct) el.leewayCustomPct.value = data.leeway.customPct;
        if (el.lwTimeInput && data.leeway.time) el.lwTimeInput.value = data.leeway.time;
        if (el.lwEInput && data.leeway.lwE) el.lwEInput.value = data.leeway.lwE;
        if (data.leeway.vector) state.leewayVector = data.leeway.vector;
        if (typeof data.leeway.isCalculated === 'boolean') state.isLeewayCalculated = data.leeway.isCalculated;
        if (typeof syncLeewayComboboxUI === 'function') syncLeewayComboboxUI();
      }

      // Drawer Error Inputs (IAMSAR Vol 2 App K)
      if (data.errorInputs) {
        if (el.errXFixInput && data.errorInputs.xFix !== undefined) el.errXFixInput.value = data.errorInputs.xFix;
        if (el.errXDrRateInput && data.errorInputs.xDrRate !== undefined) el.errXDrRateInput.value = data.errorInputs.xDrRate;
        if (el.errXDrDistInput && data.errorInputs.xDrDist !== undefined) el.errXDrDistInput.value = data.errorInputs.xDrDist;
        if (el.errXGlideInput && data.errorInputs.xGlide !== undefined) el.errXGlideInput.value = data.errorInputs.xGlide;
        if (el.errDeIntervalInput && data.errorInputs.deInterval !== undefined) el.errDeIntervalInput.value = data.errorInputs.deInterval;
        if (el.errDeDveInput && data.errorInputs.deDve !== undefined) el.errDeDveInput.value = data.errorInputs.deDve;
        if (el.errYFixInput && data.errorInputs.yFix !== undefined) el.errYFixInput.value = data.errorInputs.yFix;
        if (el.errYDrRateInput && data.errorInputs.yDrRate !== undefined) el.errYDrRateInput.value = data.errorInputs.yDrRate;
        if (el.errYDrDistInput && data.errorInputs.yDrDist !== undefined) el.errYDrDistInput.value = data.errorInputs.yDrDist;
      }

      // Tab 3 Planning Data
      if (data.planning) {
        if (el.planCaseTitle && data.planning.caseTitle !== undefined) el.planCaseTitle.value = data.planning.caseTitle;
        if (el.planCaseNum && data.planning.caseNum !== undefined) el.planCaseNum.value = data.planning.caseNum;
        if (el.planPlannerName && data.planning.plannerName !== undefined) el.planPlannerName.value = data.planning.plannerName;
        if (el.planSearchPlan && data.planning.searchPlan !== undefined) el.planSearchPlan.value = data.planning.searchPlan;
        if (el.planDatumNum && data.planning.datumNum !== undefined) el.planDatumNum.value = data.planning.datumNum;
        if (el.planCaseDate && data.planning.caseDate !== undefined) el.planCaseDate.value = data.planning.caseDate;
        if (el.planCaseDatetime && data.planning.caseDatetime !== undefined) el.planCaseDatetime.value = data.planning.caseDatetime;
        if (el.planSearchObject && data.planning.searchObject !== undefined) el.planSearchObject.value = data.planning.searchObject;
        if (el.planDatumLatL && data.planning.datumLatL !== undefined) el.planDatumLatL.value = data.planning.datumLatL;
        if (el.planDatumLonL && data.planning.datumLonL !== undefined) el.planDatumLonL.value = data.planning.datumLonL;
        if (el.planDatumLatR && data.planning.datumLatR !== undefined) el.planDatumLatR.value = data.planning.datumLatR;
        if (el.planDatumLonR && data.planning.datumLonR !== undefined) el.planDatumLonR.value = data.planning.datumLonR;
        if (el.planZtaSr && data.planning.ztaSr !== undefined) el.planZtaSr.value = data.planning.ztaSr;
        if (el.planAllocZa && data.planning.allocZa !== undefined) el.planAllocZa.value = data.planning.allocZa;
        if (el.planAllocE && data.planning.allocE !== undefined) el.planAllocE.value = data.planning.allocE;
        if (el.planAllocL && data.planning.allocL !== undefined) el.planAllocL.value = data.planning.allocL;
        if (el.planAllocDd && data.planning.allocDd !== undefined) el.planAllocDd.value = data.planning.allocDd;
        if (el.planAllocFs && data.planning.allocFs !== undefined) el.planAllocFs.value = data.planning.allocFs;
        if (el.planAllocZrc && data.planning.allocZrc !== undefined) el.planAllocZrc.value = data.planning.allocZrc;
        if (el.planAllocZrcHalved && data.planning.isZrcHalved !== undefined) el.planAllocZrcHalved.checked = data.planning.isZrcHalved;

        if (data.planning.datumType) {
          setDatumType(data.planning.datumType);
        }

        if (Array.isArray(data.planning.ztaFacilities)) {
          data.planning.ztaFacilities.forEach((fac, idx) => {
            const i = idx + 1;
            const sub = document.getElementById(`plan-zta-subarea-${i}`);
            const sru = document.getElementById(`plan-zta-sru-${i}`);
            const type = document.getElementById(`plan-zta-type-${i}`);
            const v = document.getElementById(`plan-zta-v-${i}`);
            const end = document.getElementById(`plan-zta-endurance-${i}`);
            const day = document.getElementById(`plan-zta-daylight-${i}`);
            const alt = document.getElementById(`plan-zta-alt-${i}`);
            const altUnit = document.getElementById(`plan-zta-alt-unit-${i}`);
            const wu = document.getElementById(`plan-zta-wu-${i}`);
            const fw = document.getElementById(`plan-zta-fw-${i}`);
            const fv = document.getElementById(`plan-zta-fv-${i}`);
            const ff = document.getElementById(`plan-zta-ff-${i}`);

            if (sub && fac.subarea !== undefined) sub.value = fac.subarea;
            if (sru && fac.sru !== undefined) sru.value = fac.sru;
            if (type && fac.type !== undefined) type.value = fac.type;
            if (v && fac.v !== undefined) v.value = fac.v;
            if (end && fac.endurance !== undefined) end.value = fac.endurance;
            if (day && fac.daylight !== undefined) day.value = fac.daylight;
            if (alt && fac.alt !== undefined) alt.value = fac.alt;
            if (altUnit && fac.altUnit !== undefined) altUnit.value = fac.altUnit;
            if (wu && fac.wu !== undefined) wu.value = fac.wu;
            if (fw && fac.fw !== undefined) fw.value = fac.fw;
            if (fv && fac.fv !== undefined) fv.value = fac.fv;
            if (ff && fac.ff !== undefined) ff.value = fac.ff;
          });
        }

        if (Array.isArray(data.planning.allocS)) {
          data.planning.allocS.forEach((val, idx) => {
            const i = idx + 1;
            const sInput = document.getElementById(`plan-alloc-s-${i}`);
            if (sInput && val !== undefined) sInput.value = val;
          });
        }
      }

      if (data.finalDatum) state.finalDatum = data.finalDatum;

      // Active Tab & Display Mode
      if (data.activeTab && (data.activeTab === 'vector' || data.activeTab === 'datum' || data.activeTab === 'planning')) {
        state.activeTab = data.activeTab;
      }
      if (data.displayMode && (data.displayMode === 'grid' || data.displayMode === 'map')) {
        state.displayMode = data.displayMode;
      }

      return true;
    } catch (err) {
      console.error('Failed to load state from localStorage:', err);
      return false;
    }
  }

  // =========================================================================
  // KEMASKINI PAPARAN UI
  // =========================================================================

  function updateUI() {
    if (state.vectors.length === 0) {
      el.vectorTbody.innerHTML = `
        <tr class="empty-row">
          <td colspan="9">Belum ada vektor. Masukkan Haluan, Halaju &amp; Masa di atas kemudian klik "Tambah Vektor".</td>
        </tr>
      `;
      el.vectorCounter.textContent = '0 Vektor';
    } else {
      el.vectorCounter.textContent = `${state.vectors.length} Vektor`;
      el.vectorTbody.innerHTML = state.vectors.map(v => `
        <tr>
          <td>
            <span class="leg-tag">
              <span class="color-dot" style="background:${v.color}"></span>
              V${v.legIndex}
            </span>
          </td>
          <td>${formatNauticalBearing(v.bearing)}</td>
          <td>${(v.speed !== undefined ? v.speed.toFixed(2) : '-')} kts</td>
          <td>${(v.time !== undefined ? v.time.toFixed(2) : '-')} j</td>
          <td><strong>${v.distance.toFixed(2)} NM</strong></td>
          <td>${v.dx >= 0 ? '+' : ''}${v.dx.toFixed(2)}</td>
          <td>${v.dy >= 0 ? '+' : ''}${v.dy.toFixed(2)}</td>
          <td>(${v.x1.toFixed(2)}, ${v.y1.toFixed(2)})</td>
          <td>
            <button class="btn-del" onclick="window.navApp.deleteVector(${v.id})" title="Padam Vektor ${v.legIndex}">
              <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" fill="none" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          </td>
        </tr>
      `).join('');
    }

    if (state.isCalculated && state.resultant) {
      const r = state.resultant;
      el.statusBadge.textContent = 'Telah Dikira';
      el.statusBadge.classList.add('active');

      el.resBearing.textContent = formatNauticalBearing(r.bearing);
      el.resBearingCardinal.textContent = getCardinalDirection(r.bearing);

      el.resDistance.textContent = `${r.distance.toFixed(2)} NM`;
      el.resDistanceKm.textContent = `≈ ${(r.distance * 1.852).toFixed(2)} km`;

      el.resScale1cm.textContent = r.scaleA4_1cm;
      el.resScale2cm.textContent = r.scaleA4_2cm;

      el.resTotalTrack.textContent = `${r.totalTrack.toFixed(2)} NM`;
      el.resLegCount.textContent = `${state.vectors.length} Vektor disambung (${(r.totalTime || 0).toFixed(2)} jam)`;

      buildStepByStepMath();
    } else {
      el.statusBadge.textContent = state.vectors.length > 0 ? 'Perlu Pengiraan' : 'Menunggu Input';
      el.statusBadge.classList.remove('active');

      el.resBearing.textContent = '---°';
      el.resBearingCardinal.textContent = '-';
      el.resDistance.textContent = '--- NM';
      el.resDistanceKm.textContent = '-';
      el.resScale1cm.textContent = '---';
      el.resScale2cm.textContent = '---';

      const totalTrack = state.vectors.reduce((sum, v) => sum + v.distance, 0);
      el.resTotalTrack.textContent = `${totalTrack.toFixed(2)} NM`;
      el.resLegCount.textContent = `${state.vectors.length} Vektor ditambah`;

      el.stepByStepText.textContent = 'Sila klik butang "Kira Resultant" untuk memaparkan pengiraan lengkap.';
    }
  }

  function buildStepByStepMath() {
    const r = state.resultant;
    let text = `================ JALAN PENGIRAAN VEKTOR ================\n\n`;

    text += `1. PENGIRAAN JARAK DARI HALAJU & MASA (L = V × T):\n`;
    state.vectors.forEach((v, i) => {
      text += `   [Vektor ${i+1}] Halaju = ${v.speed.toFixed(2)} Knot, Masa = ${v.time.toFixed(2)} Jam\n`;
      text += `     • Jarak (L) = ${v.speed.toFixed(2)} × ${v.time.toFixed(2)} = ${v.distance.toFixed(2)} NM\n`;
      text += `     • θ = ${formatNauticalBearing(v.bearing)}\n`;
      const degStr = formatNauticalBearing(v.bearing);
      text += `     • dX (Timur) = ${v.distance.toFixed(2)} × Sin(${degStr}) = ${v.dx.toFixed(2)} NM\n`;
      text += `     • dY (Utara) = ${v.distance.toFixed(2)} × Cos(${degStr}) = ${v.dy.toFixed(2)} NM\n\n`;
    });

    text += `2. HASIL TAMBAH KESELURUHAN KOMPONEN (ORIGIN KE TITIK AKHIR):\n`;
    text += `   • Σ dX = ${r.dx.toFixed(2)} NM (Anjakan Timur/Barat)\n`;
    text += `   • Σ dY = ${r.dy.toFixed(2)} NM (Anjakan Utara/Selatan)\n\n`;

    text += `3. JARAK TERUS PADUAN (RESULTANT DISTANCE):\n`;
    text += `   • R = √((Σ dX)² + (Σ dY)²)\n`;
    text += `   • R = √(${r.dx.toFixed(2)}² + ${r.dy.toFixed(2)}²)\n`;
    text += `   • R = ${r.distance.toFixed(2)} NM\n\n`;

    text += `4. HALUAN PADUAN (RESULTANT BEARING):\n`;
    text += `   • Bearing = 90° - atan2(Σ dY, Σ dX)\n`;
    text += `   • Bearing = ${formatNauticalBearing(r.bearing)} (${getCardinalDirection(r.bearing)})\n\n`;

    text += `5. PENENTUAN SKALA KERTAS PLOTTING A4 (18 × 26 cm):\n`;
    const allAbs = state.points.flatMap(p => [Math.abs(p.x), Math.abs(p.y)]);
    const maxRange = Math.max(...allAbs, 0.1);
    text += `   • Julat Maksimum Koordinat = ${maxRange.toFixed(2)} NM\n`;
    text += `   • Skala Disyorkan: 1 cm = ${r.scaleA4_1cm} NM (2 cm = ${r.scaleA4_2cm} NM)\n`;

    el.stepByStepText.textContent = text;
  }

  function openMathPopup(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const mathText = el.stepByStepText.textContent.trim();
    const isMobile = window.innerWidth <= 768;
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';

    const bgBody = isLight ? '#f0f4f9' : '#070d17';
    const colorText = isLight ? '#0f172a' : '#f1f5f9';
    const borderHeader = isLight ? 'rgba(2, 132, 199, 0.25)' : 'rgba(56, 189, 248, 0.25)';
    const colorH2 = isLight ? '#0284c7' : '#38bdf8';
    const bgPre = isLight ? '#ffffff' : '#091322';
    const borderPre = isLight ? '#cbd5e1' : 'rgba(255, 255, 255, 0.1)';
    const colorPre = isLight ? '#0369a1' : '#93c5fd';
    const bgSec = isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.1)';
    const colorSec = isLight ? '#334155' : '#cbd5e1';

    const htmlContent = `<!DOCTYPE html>
<html lang="ms">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Langkah Pengiraan Navigasi Nautika</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Outfit:wght@500;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: ${bgBody};
      color: ${colorText};
      font-family: 'Outfit', sans-serif;
      padding: 1.25rem;
      line-height: 1.5;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid ${borderHeader};
      padding-bottom: 0.75rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    h2 {
      font-size: 1.15rem;
      color: ${colorH2};
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .actions {
      display: flex;
      gap: 0.4rem;
    }
    .btn {
      background: #0284c7;
      color: #fff;
      border: none;
      padding: 0.4rem 0.8rem;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      transition: all 0.2s;
    }
    .btn:hover { background: #0ea5e9; }
    .btn-secondary {
      background: ${bgSec};
      color: ${colorSec};
    }
    .btn-secondary:hover { opacity: 0.85; }
    pre {
      background: ${bgPre};
      border: 1px solid ${borderPre};
      border-radius: 8px;
      padding: 1.1rem;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.84rem;
      white-space: pre-wrap;
      word-break: break-word;
      color: ${colorPre};
      line-height: 1.65;
    }
    .footer {
      margin-top: 1rem;
      font-size: 0.75rem;
      color: #64748b;
      display: flex;
      justify-content: space-between;
    }
  </style>
</head>
<body>
  <div class="header">
    <h2>📐 Langkah Pengiraan Navigasi Nautika</h2>
    <div class="actions">
      <button class="btn" onclick="navigator.clipboard.writeText(document.querySelector('pre').innerText); this.innerText='Disalin!'; setTimeout(()=>this.innerText='Salin Teks', 2000);">Salin Teks</button>
      <button class="btn btn-secondary" onclick="window.close();">Tutup</button>
    </div>
  </div>
  <pre>${mathText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
  <div class="footer">
    <span>Kalkulator Vektor Navigasi Nautika</span>
    <span>${new Date().toLocaleString('ms-MY')}</span>
  </div>
</body>
</html>`;

    if (isMobile) {
      const newTab = window.open('', '_blank');
      if (newTab) {
        newTab.document.write(htmlContent);
        newTab.document.close();
      } else {
        alert('Sila benarkan pop-up pada pelayar web anda untuk membuka tab pengiraan.');
      }
    } else {
      const popup = window.open('', 'JalanKerjaPengiraan', 'width=700,height=750,scrollbars=yes,resizable=yes');
      if (popup) {
        popup.document.write(htmlContent);
        popup.document.close();
        popup.focus();
      } else {
        alert('Sila benarkan pop-up pada pelayar web anda untuk membuka tetingkap pengiraan.');
      }
    }
  }

  // =========================================================================
  // SISTEM TOGOL TEMA (MOD GELAP & MOD CERAH)
  // =========================================================================

  function initTheme() {
    const savedTheme = localStorage.getItem('nautical_theme') || 'dark';
    applyTheme(savedTheme);
  }

  function applyTheme(theme) {
    state.theme = theme;
    if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
      if (el.themeToggleText) el.themeToggleText.textContent = 'Mod Gelap';
    } else {
      document.documentElement.removeAttribute('data-theme');
      if (el.themeToggleText) el.themeToggleText.textContent = 'Mod Cerah';
    }
    try {
      localStorage.setItem('nautical_theme', theme);
    } catch (e) {}

    if (state.displayMode === 'grid' && el.canvas && el.canvas.width > 0) {
      drawChart();
    }
  }

  function toggleTheme() {
    const nextTheme = (state.theme === 'light') ? 'dark' : 'light';
    applyTheme(nextTheme);
  }

  // =========================================================================
  // ENJIN LUKISAN CARTA INTERAKTIF (HTML5 CANVAS GRID)
  // =========================================================================

  function resizeCanvas() {
    if (state.displayMode !== 'grid') return;
    const rect = el.canvasWrapper.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    el.canvas.width = rect.width * dpr;
    el.canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    drawChart();
  }

  function getOriginScreenPos() {
    const rect = el.canvasWrapper.getBoundingClientRect();
    return {
      x: rect.width / 2 + state.view.panX,
      y: rect.height / 2 + state.view.panY
    };
  }

  function worldToScreen(wx, wy) {
    const origin = getOriginScreenPos();
    const ppm = state.view.basePixelsPerNM * state.view.zoom;
    return {
      x: origin.x + wx * ppm,
      y: origin.y - wy * ppm
    };
  }

  function screenToWorld(sx, sy) {
    const origin = getOriginScreenPos();
    const ppm = state.view.basePixelsPerNM * state.view.zoom;
    return {
      x: (sx - origin.x) / ppm,
      y: -(sy - origin.y) / ppm
    };
  }

  function drawChart() {
    if (state.displayMode !== 'grid') return;
    const rect = el.canvasWrapper.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    ctx.clearRect(0, 0, width, height);

    drawNauticalGrid(width, height);
    drawAxes(width, height);
    drawVectors();

    if (state.isCalculated && state.resultant) {
      drawResultantVector();
    }

    drawWaypoints();
  }

  function drawNauticalGrid(width, height) {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    const ppm = state.view.basePixelsPerNM * state.view.zoom;
    const origin = getOriginScreenPos();

    let stepNM = 1;
    const targetPixelStep = 70;
    const rawStep = targetPixelStep / ppm;
    
    if (rawStep <= 0.2) stepNM = 0.2;
    else if (rawStep <= 0.5) stepNM = 0.5;
    else if (rawStep <= 1) stepNM = 1;
    else if (rawStep <= 2) stepNM = 2;
    else if (rawStep <= 5) stepNM = 5;
    else if (rawStep <= 10) stepNM = 10;
    else if (rawStep <= 20) stepNM = 20;
    else stepNM = 50;

    el.chartScaleIndicator.textContent = `1 petak = ${stepNM} NM`;

    const stepPx = stepNM * ppm;

    ctx.lineWidth = 1;
    ctx.strokeStyle = isLight ? 'rgba(2, 132, 199, 0.16)' : 'rgba(56, 189, 248, 0.08)';
    ctx.beginPath();

    const startX = origin.x % stepPx;
    for (let x = startX; x < width; x += stepPx) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }

    const startY = origin.y % stepPx;
    for (let y = startY; y < height; y += stepPx) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();

    ctx.fillStyle = isLight ? 'rgba(51, 65, 85, 0.75)' : 'rgba(148, 163, 184, 0.45)';
    ctx.font = '10px "JetBrains Mono", monospace';

    for (let x = startX; x < width; x += stepPx) {
      const nmVal = (x - origin.x) / ppm;
      if (Math.abs(nmVal) > 0.05) {
        const text = `${nmVal > 0 ? '+' : ''}${Math.round(nmVal * 10) / 10}`;
        ctx.fillText(`${text}`, x + 4, Math.min(Math.max(origin.y + 14, 20), height - 10));
      }
    }

    for (let y = startY; y < height; y += stepPx) {
      const nmVal = -(y - origin.y) / ppm;
      if (Math.abs(nmVal) > 0.05) {
        const text = `${nmVal > 0 ? '+' : ''}${Math.round(nmVal * 10) / 10}`;
        ctx.fillText(`${text}`, Math.min(Math.max(origin.x + 4, 10), width - 35), y - 4);
      }
    }
  }

  function drawAxes(width, height) {
    const origin = getOriginScreenPos();
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';

    ctx.lineWidth = 1.5;
    ctx.strokeStyle = isLight ? 'rgba(2, 132, 199, 0.45)' : 'rgba(56, 189, 248, 0.35)';

    ctx.beginPath();
    ctx.moveTo(0, origin.y);
    ctx.lineTo(width, origin.y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(origin.x, 0);
    ctx.lineTo(origin.x, height);
    ctx.stroke();

    ctx.font = 'bold 11px "Outfit", sans-serif';
    ctx.fillStyle = isLight ? '#0284c7' : '#38bdf8';
    ctx.fillText('TIMUR (+X)', width - 75, Math.max(origin.y - 8, 20));
    ctx.fillText('UTARA (+Y)', Math.min(Math.max(origin.x + 8, 10), width - 80), 22);
  }

  function drawVectors() {
    state.vectors.forEach((v) => {
      const p0 = worldToScreen(v.x0, v.y0);
      const p1 = worldToScreen(v.x1, v.y1);

      ctx.save();
      ctx.strokeStyle = v.color;
      ctx.fillStyle = v.color;
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.stroke();

      const midX = (p0.x + p1.x) / 2;
      const midY = (p0.y + p1.y) / 2;
      const angle = Math.atan2(p1.y - p0.y, p1.x - p0.x);
      drawArrowHead(midX, midY, angle, 11, v.color);

      const labelText = `V${v.legIndex}: ${formatNauticalBearing(v.bearing)} | ${v.distance.toFixed(2)} NM`;
      drawBadgeLabel(midX, midY - 14, labelText, v.color);

      ctx.restore();
    });
  }

  function drawResultantVector() {
    const r = state.resultant;
    const p0 = worldToScreen(r.p0.x, r.p0.y);
    const p1 = worldToScreen(r.pEnd.x, r.pEnd.y);

    ctx.save();
    ctx.strokeStyle = '#ef4444';
    ctx.fillStyle = '#ef4444';
    ctx.lineWidth = 3.5;

    ctx.setLineDash([8, 5]);
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.stroke();
    ctx.setLineDash([]);

    const midX = (p0.x + p1.x) / 2;
    const midY = (p0.y + p1.y) / 2;
    const angle = Math.atan2(p1.y - p0.y, p1.x - p0.x);
    drawArrowHead(midX, midY, angle, 14, '#ef4444');
    drawArrowHead(p1.x, p1.y, angle, 14, '#ef4444');

    const resText = `RESULTANT: ${formatNauticalBearing(r.bearing)} | ${r.distance.toFixed(2)} NM`;
    drawBadgeLabel(midX, midY - 20, resText, '#ef4444', true);

    ctx.restore();
  }

  function drawWaypoints() {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    state.points.forEach((pt, i) => {
      const pos = worldToScreen(pt.x, pt.y);

      ctx.save();
      if (i === 0) {
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.font = 'bold 11px "Outfit", sans-serif';
        ctx.fillStyle = isLight ? '#059669' : '#10b981';
        ctx.textAlign = 'left';
        ctx.fillText('ORIGIN (0,0)', pos.x + 9, pos.y + 4);
      } else {
        const isEnd = (i === state.points.length - 1);
        ctx.fillStyle = isEnd ? '#f43f5e' : (isLight ? '#0284c7' : '#38bdf8');
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, isEnd ? 5 : 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.fillStyle = isLight ? '#0f172a' : '#cbd5e1';
        ctx.textAlign = 'left';
        ctx.fillText(isEnd ? `WP${i} (END)` : `WP${i}`, pos.x + 7, pos.y - 4);
      }
      ctx.restore();
    });
  }

  function drawArrowHead(x, y, angle, size, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.translate(x, y);
    ctx.rotate(angle);

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-size, -size * 0.5);
    ctx.lineTo(-size * 0.7, 0);
    ctx.lineTo(-size, size * 0.5);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  function drawBadgeLabel(x, y, text, color, isBold = false) {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    ctx.save();
    ctx.font = isBold ? 'bold 11px "JetBrains Mono", monospace' : '10px "JetBrains Mono", monospace';
    const textMetrics = ctx.measureText(text);
    const paddingX = 7;
    const paddingY = 4;
    const bgW = textMetrics.width + paddingX * 2;
    const bgH = 18;

    ctx.fillStyle = isLight ? 'rgba(255, 255, 255, 0.94)' : 'rgba(7, 13, 23, 0.88)';
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x - bgW / 2, y - bgH / 2, bgW, bgH, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = isLight ? '#0f172a' : color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);

    ctx.restore();
  }

  // =========================================================================
  // VIEWPORT CONTROLS (PAN & ZOOM)
  // =========================================================================

  function autoFitView() {
    if (state.points.length <= 1) {
      resetPanZoom();
      return;
    }

    const rect = el.canvasWrapper.getBoundingClientRect();
    const allX = state.points.map(p => p.x);
    const allY = state.points.map(p => p.y);

    const minX = Math.min(...allX, 0);
    const maxX = Math.max(...allX, 0);
    const minY = Math.min(...allY, 0);
    const maxY = Math.max(...allY, 0);

    const spanX = Math.max(maxX - minX, 4);
    const spanY = Math.max(maxY - minY, 4);

    const marginPx = 80;
    const availW = Math.max(rect.width - marginPx * 2, 100);
    const availH = Math.max(rect.height - marginPx * 2, 100);

    const fitPpmX = availW / spanX;
    const fitPpmY = availH / spanY;
    const fitPpm = Math.min(fitPpmX, fitPpmY);

    state.view.zoom = Math.max(0.2, Math.min(fitPpm / state.view.basePixelsPerNM, 4.0));

    const midWorldX = (minX + maxX) / 2;
    const midWorldY = (minY + maxY) / 2;
    const ppm = state.view.basePixelsPerNM * state.view.zoom;

    state.view.panX = -midWorldX * ppm;
    state.view.panY = midWorldY * ppm;

    drawChart();
  }

  function resetPanZoom() {
    state.view.zoom = 1.0;
    state.view.panX = 0;
    state.view.panY = 0;
    drawChart();
  }

  function zoomBy(factor, centerX, centerY) {
    const oldZoom = state.view.zoom;
    const newZoom = Math.max(0.15, Math.min(oldZoom * factor, 12));

    if (centerX !== undefined && centerY !== undefined) {
      const origin = getOriginScreenPos();
      const ppmOld = state.view.basePixelsPerNM * oldZoom;
      const ppmNew = state.view.basePixelsPerNM * newZoom;

      const wx = (centerX - origin.x) / ppmOld;
      const wy = -(centerY - origin.y) / ppmOld;

      state.view.panX = centerX - el.canvasWrapper.clientWidth / 2 - wx * ppmNew;
      state.view.panY = centerY - el.canvasWrapper.clientHeight / 2 + wy * ppmNew;
    }

    state.view.zoom = newZoom;
    drawChart();
  }

  // =========================================================================
  // PENDAFTARAN ACARA (EVENT LISTENERS)
  // =========================================================================

  function setupEventListeners() {
    // Pengendalian Tab Kiri (Vector, Determining Datum, Planning)
    document.querySelectorAll('.sidebar-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        if (tab) switchTab(tab);
      });
    });

    // Pengendalian Butang Action Rail Tab 2 (Vertical Tabs)
    document.querySelectorAll('[data-drawer]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const drawerTarget = btn.dataset.drawer;
        if (drawerTarget) {
          if (el.tab2Drawer && el.tab2Drawer.classList.contains('open') && btn.classList.contains('active')) {
            closeDrawer();
          } else {
            openDrawer(drawerTarget);
          }
        }
      });
    });

    // Pengendalian Butang Action Rail Tab 3 (Planning Vertical Tabs)
    document.querySelectorAll('[data-planning-rail]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const drawerTarget = btn.dataset.planningRail;
        if (drawerTarget) {
          if (el.tab3Drawer && el.tab3Drawer.classList.contains('open') && btn.classList.contains('active')) {
            closePlanningDrawer();
          } else {
            openPlanningDrawer(drawerTarget);
          }
        }
      });
    });

    // Pengendalian Klik Baris Ringkasan Cockpit Tab 2 (Data 1-6)
    document.querySelectorAll('[data-drawer-target]').forEach(item => {
      item.addEventListener('click', () => {
        const target = item.dataset.drawerTarget;
        if (target) openDrawer(target);
      });
    });

    // Pengendalian Klik Baris Ringkasan Cockpit Tab 3 (Planning)
    document.querySelectorAll('[data-planning-drawer]').forEach(item => {
      item.addEventListener('click', () => {
        const target = item.dataset.planningDrawer;
        if (target) openPlanningDrawer(target);
      });
    });

    // Butang "Buka" dalam Baris Ringkasan Tab 2
    document.querySelectorAll('.btn-drawer-trigger').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const target = btn.dataset.drawerBtn;
        if (target) openDrawer(target);
      });
    });

    // Butang Tutup Drawer Tab 2
    if (el.btnCloseDrawer) {
      el.btnCloseDrawer.addEventListener('click', () => {
        closeDrawer();
      });
    }

    // Butang Tutup Drawer Tab 3
    if (el.btnCloseTab3Drawer) {
      el.btnCloseTab3Drawer.addEventListener('click', () => {
        closePlanningDrawer();
      });
    }

    // Kekunci Escape untuk Tutup Drawer Tab 2 & Tab 3
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeDrawer();
        closePlanningDrawer();
      }
    });

    // Tab 3: Butang Salin Tab 2
    if (el.btnPlanSyncTab2) {
      el.btnPlanSyncTab2.addEventListener('click', () => {
        syncPlanningFromTab2(true);
      });
    }

    // Tab 3: Butang Datum Type Pills
    if (el.btnDatumTypeSingle) el.btnDatumTypeSingle.addEventListener('click', () => setDatumType('single'));
    if (el.btnDatumTypeLeeway) el.btnDatumTypeLeeway.addEventListener('click', () => setDatumType('leeway'));
    if (el.btnDatumTypeLine) el.btnDatumTypeLine.addEventListener('click', () => setDatumType('line'));

    // Tab 3: Butang fs Selection Pills (Normal vs Ideal)
    if (el.btnFsNormal) {
      el.btnFsNormal.addEventListener('click', () => {
        if (el.planAllocFs) {
          el.planAllocFs.value = '1.1';
          el.planAllocFs.dataset.userChoice = 'manual';
        }
        el.btnFsNormal.classList.add('active');
        if (el.btnFsIdeal) el.btnFsIdeal.classList.remove('active');
        calculatePlanning();
      });
    }

    if (el.btnFsIdeal) {
      el.btnFsIdeal.addEventListener('click', () => {
        if (el.planAllocFs) {
          el.planAllocFs.value = '1.0';
          el.planAllocFs.dataset.userChoice = 'manual';
        }
        el.btnFsIdeal.classList.add('active');
        if (el.btnFsNormal) el.btnFsNormal.classList.remove('active');
        calculatePlanning();
      });
    }

    // Tab 3: Butang Kira & Reset Action Buttons
    if (el.btnCalcZta) el.btnCalcZta.addEventListener('click', () => calculatePlanning());
    if (el.btnGotoAlloc) el.btnGotoAlloc.addEventListener('click', () => openPlanningDrawer('alloc'));
    if (el.btnResetZta) el.btnResetZta.addEventListener('click', () => resetZta());
    if (el.btnCalcAlloc) el.btnCalcAlloc.addEventListener('click', () => calculatePlanning());
    if (el.btnResetAlloc) el.btnResetAlloc.addEventListener('click', () => resetAllocation());
    if (el.btnCalcPlanningAll) el.btnCalcPlanningAll.addEventListener('click', () => calculatePlanning());
    if (el.btnResetPlanningAll) el.btnResetPlanningAll.addEventListener('click', () => resetPlanningAll());
    if (el.btnPlotSearchPattern) el.btnPlotSearchPattern.addEventListener('click', () => plotSearchPatternsOnMap());
    if (el.btnPlotAllocMap) el.btnPlotAllocMap.addEventListener('click', () => plotSearchPatternsOnMap());

    // IAMSAR Tables (N-1 hingga N-8) Modal Listeners
    if (el.btnOpenIamsarTables) {
      el.btnOpenIamsarTables.addEventListener('click', () => openIamsarTablesModal('tableN1_NavigationalFixErrors'));
    }
    if (el.btnOpenTablesFromZta) {
      el.btnOpenTablesFromZta.addEventListener('click', () => openIamsarTablesModal('tableN4_MerchantVessels'));
    }
    if (el.btnCloseIamsarModal) {
      el.btnCloseIamsarModal.addEventListener('click', () => closeIamsarTablesModal());
    }
    if (el.modalIamsarTables) {
      el.modalIamsarTables.addEventListener('click', (e) => {
        if (e.target === el.modalIamsarTables) {
          closeIamsarTablesModal();
        }
      });
    }
    if (el.iamsarModalTabs) {
      el.iamsarModalTabs.querySelectorAll('.iamsar-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const tableKey = btn.dataset.table;
          if (tableKey) {
            openIamsarTablesModal(tableKey);
          }
        });
      });
    }

    // Tab 2: Preset Pilihan Pantas Jadual N-1, N-2, N-3
    if (el.quickPresetXFix) {
      el.quickPresetXFix.addEventListener('change', () => {
        const val = el.quickPresetXFix.value;
        if (val && el.errXFixInput) {
          el.errXFixInput.value = val;
          calculateFinalDatum();
          saveAppState();
        }
      });
    }
    if (el.quickPresetXDr) {
      el.quickPresetXDr.addEventListener('change', () => {
        const val = el.quickPresetXDr.value;
        if (val && el.errXDrRateInput) {
          el.errXDrRateInput.value = val;
          calculateFinalDatum();
          saveAppState();
        }
      });
    }
    if (el.quickPresetYFix) {
      el.quickPresetYFix.addEventListener('change', () => {
        const val = el.quickPresetYFix.value;
        if (val && el.errYFixInput) {
          el.errYFixInput.value = val;
          calculateFinalDatum();
          saveAppState();
        }
      });
    }
    if (el.quickPresetYDr) {
      el.quickPresetYDr.addEventListener('change', () => {
        const val = el.quickPresetYDr.value;
        if (val && el.errYDrRateInput) {
          el.errYDrRateInput.value = val;
          calculateFinalDatum();
          saveAppState();
        }
      });
    }

    // Tab 3: Butang Terapkan Pembantu Jadual N-4 hingga N-8
    if (el.btnApplyIamsarLookup) {
      el.btnApplyIamsarLookup.addEventListener('click', () => {
        applyIamsarLookupToZta();
      });
    }

    // Tab 3: Realtime calculation listeners on planning inputs & 5 facility grid
    const planningLiveInputs = [
      el.planCaseTitle, el.planCaseNum, el.planPlannerName, el.planSearchPlan,
      el.planDatumNum, el.planCaseDate, el.planCaseDatetime, el.planSearchObject,
      el.planDatumLatL, el.planDatumLonL, el.planDatumLatR, el.planDatumLonR,
      el.planZtaSr, el.planAllocZa, el.planAllocE, el.planAllocL, el.planAllocDd,
      el.planAllocFs, el.planAllocZrc, el.planAllocZrcHalved
    ];
    for (let i = 1; i <= 5; i++) {
      planningLiveInputs.push(
        document.getElementById(`plan-zta-subarea-${i}`),
        document.getElementById(`plan-zta-sru-${i}`),
        document.getElementById(`plan-zta-type-${i}`),
        document.getElementById(`plan-zta-v-${i}`),
        document.getElementById(`plan-zta-endurance-${i}`),
        document.getElementById(`plan-zta-daylight-${i}`),
        document.getElementById(`plan-zta-alt-${i}`),
        document.getElementById(`plan-zta-alt-unit-${i}`),
        document.getElementById(`plan-zta-wu-${i}`),
        document.getElementById(`plan-zta-fw-${i}`),
        document.getElementById(`plan-zta-fv-${i}`),
        document.getElementById(`plan-zta-ff-${i}`),
        document.getElementById(`plan-alloc-s-${i}`)
      );
    }
    planningLiveInputs.forEach(inputEl => {
      if (inputEl) {
        inputEl.addEventListener('input', () => calculatePlanning());
        inputEl.addEventListener('change', () => calculatePlanning());
      }
    });

    // Sinkronisasi Masa & Selang Waktu (Distress Time, Datum Time, Interval Hours)
    ['input', 'change', 'blur'].forEach(evt => {
      if (el.distressDateTimeInput) {
        el.distressDateTimeInput.addEventListener(evt, calculateTimeInterval);
      }
      if (el.datumDateTimeInput) {
        el.datumDateTimeInput.addEventListener(evt, calculateTimeInterval);
      }
    });

    if (el.datumIntervalInput) {
      el.datumIntervalInput.addEventListener('input', onIntervalHoursChanged);
      el.datumIntervalInput.addEventListener('change', onIntervalHoursChanged);
    }

    // Kemaskini live preview jarak bila kelajuan atau masa berubah
    el.speedInput.addEventListener('input', updateDistancePreview);
    el.timeInput.addEventListener('input', updateDistancePreview);
    el.speedInput.addEventListener('change', updateDistancePreview);
    el.timeInput.addEventListener('change', updateDistancePreview);

    // Input Koordinat Origin Geografi
    const handleOriginChange = () => {
      const parsedLat = parseCoordinate(el.originLatInput.value, true);
      const parsedLon = parseCoordinate(el.originLonInput.value, false);

      if (!isNaN(parsedLat) && !isNaN(parsedLon)) {
        state.originGeo.lat = parsedLat;
        state.originGeo.lon = parsedLon;
        saveAppState();
        if (state.displayMode === 'map') {
          updateLeafletMap();
        }
      }
    };

    el.originLatInput.addEventListener('change', handleOriginChange);
    el.originLonInput.addEventListener('change', handleOriginChange);

    // Auto-save pada perubahan input form & cockpit
    const persistInputs = [
      el.bearingInput, el.speedInput, el.timeInput,
      el.distressDateTimeInput, el.datumDateTimeInput, el.datumIntervalInput,
      el.aswBearingInput, el.aswSpeedInput, el.aswTimeInput, el.aswErrorTypeSelect, el.aswEInput, el.aswdvEInput,
      el.wcBearingInput, el.wcSpeedInput, el.wcTimeInput, el.wcEInput,
      el.twcObsSourceSelect, el.twcObsSourceInput, el.twcObsBearingInput, el.twcObsSpeedInput, el.twcObsTimeInput, el.twcObsQualitySelect, el.twcObsEInput,
      el.scTypeSelect, el.scBearingInput, el.scSpeedInput, el.scTimeInput, el.scVectorEInput,
      el.leewayTargetType, el.leewayDivergence, el.leewayCustomPct, el.lwTimeInput, el.lwEInput,
      el.errXFixInput, el.errXDrRateInput, el.errXDrDistInput, el.errXGlideInput,
      el.errDeIntervalInput, el.errDeDveInput,
      el.errYFixInput, el.errYDrRateInput, el.errYDrDistInput
    ];

    persistInputs.forEach(inputEl => {
      if (inputEl) {
        inputEl.addEventListener('input', () => saveAppState());
        inputEl.addEventListener('change', () => saveAppState());
      }
    });

    // Butang Klik Peta Set Origin
    el.btnPickLocation.addEventListener('click', () => {
      if (state.displayMode !== 'map') {
        switchDisplayMode('map');
      }

      state.isPickingLocation = !state.isPickingLocation;
      if (state.isPickingLocation) {
        el.btnPickLocation.classList.remove('btn-outline');
        el.btnPickLocation.classList.add('btn-success');
        el.btnPickLocation.innerHTML = `
          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" fill="none" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
          <span>Klik Atas Peta Sekarang...</span>
        `;
        el.mapContainer.style.cursor = 'crosshair';
      } else {
        el.btnPickLocation.classList.remove('btn-success');
        el.btnPickLocation.classList.add('btn-outline');
        el.btnPickLocation.innerHTML = `
          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" fill="none" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="22" y1="12" x2="18" y2="12"/><line x1="6" y1="12" x2="2" y2="12"/><line x1="12" y1="6" x2="12" y2="2"/><line x1="12" y1="22" x2="12" y2="18"/></svg>
          <span>📍 Klik Peta Set Origin</span>
        `;
        el.mapContainer.style.cursor = '';
      }
    });

    // Event Listeners untuk Average Surface Wind (ASW)
    if (el.aswSpeedInput && el.aswTimeInput) {
      el.aswSpeedInput.addEventListener('input', updateAswDistancePreview);
      el.aswTimeInput.addEventListener('input', updateAswDistancePreview);
      el.aswSpeedInput.addEventListener('change', updateAswDistancePreview);
      el.aswTimeInput.addEventListener('change', updateAswDistancePreview);
    }

    // Butang Aksi ASW (Tab 2)
    if (el.btnAddAsw) {
      el.btnAddAsw.addEventListener('click', () => {
        const b = parseFloat(el.aswBearingInput.value);
        const s = parseFloat(el.aswSpeedInput.value);
        const t = parseFloat(el.aswTimeInput.value);
        addAswVector(b, s, t);
      });
    }

    // Enter Key pada input ASW
    [el.aswBearingInput, el.aswSpeedInput, el.aswTimeInput].forEach(inp => {
      if (inp) {
        inp.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            if (el.btnAddAsw) el.btnAddAsw.click();
          }
        });
      }
    });

    if (el.btnCalcAsw) {
      el.btnCalcAsw.addEventListener('click', () => {
        calculateAswResultant();
      });
    }

    // Event Listeners untuk ASW Probable Error (Section B)
    if (el.aswErrorTypeSelect) {
      el.aswErrorTypeSelect.addEventListener('change', () => {
        const type = el.aswErrorTypeSelect.value;
        if (type === 'forecast') {
          if (el.aswEInput) el.aswEInput.value = '8.0';
          if (el.aswdvEInput) el.aswdvEInput.value = '0.5';
        } else if (type === 'observed') {
          if (el.aswEInput) el.aswEInput.value = '5.0';
          if (el.aswdvEInput) el.aswdvEInput.value = '0.3';
        }
        updateAswProbableError();
      });
    }

    if (el.aswEInput) {
      el.aswEInput.addEventListener('input', updateAswProbableError);
      el.aswEInput.addEventListener('change', updateAswProbableError);
    }
    if (el.aswdvEInput) {
      el.aswdvEInput.addEventListener('input', updateAswProbableError);
      el.aswdvEInput.addEventListener('change', updateAswProbableError);
    }

    if (el.btnResetAsw) {
      el.btnResetAsw.addEventListener('click', () => {
        if (confirm('Padam semua rekod cerapan angin (ASW)?')) {
          resetAsw();
        }
      });
    }

    // Event Listeners untuk Wind Current (WC)
    if (el.wcSpeedInput && el.wcTimeInput) {
      el.wcSpeedInput.addEventListener('input', updateWcDistancePreview);
      el.wcTimeInput.addEventListener('input', updateWcDistancePreview);
      el.wcSpeedInput.addEventListener('change', updateWcDistancePreview);
      el.wcTimeInput.addEventListener('change', updateWcDistancePreview);
    }

    if (el.btnAutoWcFromAsw) {
      el.btnAutoWcFromAsw.addEventListener('click', () => {
        calculateWcFromAsw();
      });
    }

    if (el.btnCalcWc) {
      el.btnCalcWc.addEventListener('click', () => {
        calculateWc();
      });
    }

    if (el.btnResetWc) {
      el.btnResetWc.addEventListener('click', () => {
        resetWc();
      });
    }

    if (el.wcEInput) {
      el.wcEInput.addEventListener('input', updateWcProbableError);
      el.wcEInput.addEventListener('change', updateWcProbableError);
    }

    // --- TWC Mode Switcher (Observed vs Computed) ---
    if (el.btnTwcModeObserved) {
      el.btnTwcModeObserved.addEventListener('click', () => switchTwcMode('observed'));
    }
    if (el.btnTwcModeComputed) {
      el.btnTwcModeComputed.addEventListener('click', () => switchTwcMode('computed'));
    }
    if (el.radioTwcObserved) {
      el.radioTwcObserved.addEventListener('change', () => switchTwcMode('observed'));
    }
    if (el.radioTwcComputed) {
      el.radioTwcComputed.addEventListener('change', () => switchTwcMode('computed'));
    }

    // --- 1. Observed TWC Event Listeners ---
    if (el.twcObsSpeedInput && el.twcObsTimeInput) {
      el.twcObsSpeedInput.addEventListener('input', updateObsTwcDistancePreview);
      el.twcObsTimeInput.addEventListener('input', updateObsTwcDistancePreview);
      el.twcObsSpeedInput.addEventListener('change', updateObsTwcDistancePreview);
      el.twcObsTimeInput.addEventListener('change', updateObsTwcDistancePreview);
    }

    if (el.twcObsSourceSelect) {
      el.twcObsSourceSelect.addEventListener('change', () => {
        const val = el.twcObsSourceSelect.value;
        if (val !== 'custom') {
          if (el.twcObsSourceInput) el.twcObsSourceInput.value = val;
        } else {
          if (el.twcObsSourceInput) {
            el.twcObsSourceInput.value = '';
            el.twcObsSourceInput.focus();
          }
        }
      });
    }

    if (el.twcObsQualitySelect) {
      el.twcObsQualitySelect.addEventListener('change', () => {
        const quality = el.twcObsQualitySelect.value;
        if (el.twcObsEInput) {
          el.twcObsEInput.value = (quality === 'good') ? '0.1' : '0.2';
        }
      });
    }

    if (el.btnCalcObsTwc) {
      el.btnCalcObsTwc.addEventListener('click', () => {
        calculateObsTwc();
      });
    }

    if (el.btnResetObsTwc) {
      el.btnResetObsTwc.addEventListener('click', () => {
        if (confirm('Reset semula data Observed TWC ke nilai asal?')) {
          resetObsTwc();
        }
      });
    }

    // --- 2. Computed TWC Event Listeners ---
    if (el.scSpeedInput) {
      el.scSpeedInput.addEventListener('input', updateScDistancePreview);
      el.scSpeedInput.addEventListener('change', updateScDistancePreview);
    }
    if (el.scBearingInput) {
      el.scBearingInput.addEventListener('input', updateScDistancePreview);
      el.scBearingInput.addEventListener('change', updateScDistancePreview);
    }

    if (el.btnAddSc) {
      el.btnAddSc.addEventListener('click', () => {
        const b = parseFloat(el.scBearingInput ? el.scBearingInput.value : '180');
        const s = parseFloat(el.scSpeedInput ? el.scSpeedInput.value : '1.5');
        const type = el.scTypeSelect ? el.scTypeSelect.value : 'SC';
        const err = el.scVectorEInput ? (parseFloat(el.scVectorEInput.value) || 0.3) : 0.3;
        addScVector(b, s, type, err);
      });
    }

    // Enter Key pada input Computed Current
    [el.scBearingInput, el.scSpeedInput, el.scVectorEInput].forEach(inp => {
      if (inp) {
        inp.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            if (el.btnAddSc) el.btnAddSc.click();
          }
        });
      }
    });

    if (el.btnCalcSc) {
      el.btnCalcSc.addEventListener('click', () => {
        calculateScResultant();
      });
    }

    if (el.btnResetSc) {
      el.btnResetSc.addEventListener('click', () => {
        if (confirm('Padam semua rekod cerapan arus tambahan (TWC)?')) {
          resetSc();
        }
      });
    }

    // Event Listeners untuk Leeway (LW) - IAMSAR Fig N-2 & Fig N-3
    if (el.leewayTargetType) {
      el.leewayTargetType.addEventListener('change', () => {
        onLeewayTargetChanged();
      });
      initLeewaySearchableCombobox();
    }

    if (el.lwTimeInput) {
      el.lwTimeInput.addEventListener('input', updateLeewayDistancePreview);
      el.lwTimeInput.addEventListener('change', updateLeewayDistancePreview);
    }

    if (el.leewayDivergence) {
      el.leewayDivergence.addEventListener('input', () => {
        calculateLeeway();
      });
      el.leewayDivergence.addEventListener('change', () => {
        calculateLeeway();
      });
    }

    if (el.leewayCustomPct) {
      el.leewayCustomPct.addEventListener('input', updateLeewayDistancePreview);
      el.leewayCustomPct.addEventListener('change', updateLeewayDistancePreview);
    }

    if (el.lwEInput) {
      el.lwEInput.addEventListener('input', () => {
        calculateLeeway();
      });
      el.lwEInput.addEventListener('change', () => {
        calculateLeeway();
      });
    }

    if (el.btnCalcLw) {
      el.btnCalcLw.addEventListener('click', () => {
        calculateLeeway();
      });
    }

    if (el.btnResetLw) {
      el.btnResetLw.addEventListener('click', () => {
        resetLeeway();
      });
    }

    // Butang Jana Simulasi Hanyutan Monte Carlo (Cockpit Kiri)
    if (el.btnRunSimulation) {
      el.btnRunSimulation.addEventListener('click', () => {
        startMonteCarloSimulation();
      });
    }

    // Butang Reset Semua ke Setting Lalai (Sebelah Jana Simulasi)
    if (el.btnResetDatumAll) {
      el.btnResetDatumAll.addEventListener('click', () => {
        resetAllDatumToDefaults();
      });
    }

    // Butang Kira Datum SAR Akhir (Fallback compatibility)
    if (el.btnCalcDatum) {
      el.btnCalcDatum.addEventListener('click', () => {
        calculateFinalDatum(true);
        if (state.displayMode === 'map') {
          updateLeafletMap();
        }
      });
    }

    if (el.btnCalcDatumPanel) {
      el.btnCalcDatumPanel.addEventListener('click', () => {
        calculateFinalDatum(true);
        if (state.displayMode === 'map') {
          updateLeafletMap();
        }
      });
    }

    if (el.btnViewDatumMap) {
      el.btnViewDatumMap.addEventListener('click', () => {
        if (state.displayMode !== 'map') {
          switchDisplayMode('map');
        } else if (leafletMap) {
          leafletMap.invalidateSize();
          updateLeafletMap();
        }
      });
    }

    // Kawalan Player Timeline Monte Carlo
    if (el.btnMcPlay) {
      el.btnMcPlay.addEventListener('click', toggleMonteCarloPlay);
    }

    if (el.chkMcVisible) {
      el.chkMcVisible.addEventListener('change', (e) => {
        state.monteCarlo.isVisible = e.target.checked;
        if (!state.monteCarlo.isVisible) {
          if (el.mcCanvasOverlay) {
            const mcCtx = el.mcCanvasOverlay.getContext('2d');
            if (mcCtx) mcCtx.clearRect(0, 0, el.mcCanvasOverlay.width, el.mcCanvasOverlay.height);
            el.mcCanvasOverlay.style.display = 'none';
          }
        } else {
          if (state.monteCarlo.isActive) {
            if (el.mcCanvasOverlay) el.mcCanvasOverlay.style.setProperty('display', 'block', 'important');
            renderMonteCarloFrame();
          }
        }
      });
    }

    if (el.btnMcReset) {
      el.btnMcReset.addEventListener('click', resetMonteCarlo);
    }

    if (el.btnMcClose) {
      el.btnMcClose.addEventListener('click', closeMonteCarlo);
    }

    if (el.mcTimeSlider) {
      el.mcTimeSlider.addEventListener('input', (e) => {
        pauseMonteCarlo();
        state.monteCarlo.currentTime = parseFloat(e.target.value) || 0;
        updateMonteCarloTimeUI();
        renderMonteCarloFrame();
      });
    }

    if (el.mcSpeedBtns) {
      el.mcSpeedBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          el.mcSpeedBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const speed = parseFloat(btn.dataset.speed) || 1.0;
          state.monteCarlo.playbackSpeed = speed;
        });
      });
    }

    // Butang Kira Total Surface Drift & Lihat Peta
    if (el.btnCalcDrift) {
      el.btnCalcDrift.addEventListener('click', () => {
        calculateFinalDatum(true);
        if (state.displayMode === 'map') {
          updateLeafletMap();
        }
      });
    }

    if (el.btnViewDriftMap) {
      el.btnViewDriftMap.addEventListener('click', () => {
        if (state.displayMode !== 'map') {
          switchDisplayMode('map');
        } else if (leafletMap) {
          leafletMap.invalidateSize();
          updateLeafletMap();
        }
      });
    }

    // --- Drawer Error Event Listeners (IAMSAR Vol 2 App K) ---
    const errorInputsList = [
      el.errXFixInput, el.errXDrRateInput, el.errXDrDistInput, el.errXGlideInput,
      el.errDeIntervalInput, el.errDeDveInput,
      el.errYFixInput, el.errYDrRateInput, el.errYDrDistInput
    ];

    errorInputsList.forEach(inputEl => {
      if (inputEl) {
        inputEl.addEventListener('input', () => {
          calculateFinalDatum();
        });
        inputEl.addEventListener('change', () => {
          calculateFinalDatum();
        });
      }
    });

    if (el.btnCalcError) {
      el.btnCalcError.addEventListener('click', () => {
        calculateFinalDatum(true);
        if (state.displayMode === 'map') {
          updateLeafletMap();
        }
      });
    }

    if (el.btnResetError) {
      el.btnResetError.addEventListener('click', () => {
        resetErrorParams(true);
      });
    }

    // Tambah Vektor (Tab 1)
    el.btnAdd.addEventListener('click', () => {
      const b = parseFloat(el.bearingInput.value);
      const s = parseFloat(el.speedInput.value);
      const t = parseFloat(el.timeInput.value);
      addVector(b, s, t);
    });

    // Enter Key pada input
    [el.bearingInput, el.speedInput, el.timeInput].forEach(inp => {
      inp.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          el.btnAdd.click();
        }
      });
    });

    // Kira Resultant
    el.btnCalc.addEventListener('click', () => {
      calculateResultant();
    });

    // Reset Semula
    el.btnReset.addEventListener('click', () => {
      if (confirm('Adakah anda pasti mahu reset semua pengiraan dan mula dari titik asal?')) {
        resetAll();
      }
    });

    // Butang Zum & Pan
    el.btnZoomIn.addEventListener('click', () => zoomBy(1.25));
    el.btnZoomOut.addEventListener('click', () => zoomBy(0.8));
    el.btnFitView.addEventListener('click', autoFitView);
    el.btnResetPan.addEventListener('click', resetPanZoom);

    // Contoh Latihan (Segitiga Haluan Maritim)
    el.btnSample.addEventListener('click', () => {
      state.vectors = [];
      state.points = [{ x: 0, y: 0 }];
      
      // Leg 1: Haluan 090°, 12 Knot, 1.0 Jam = 12 NM
      addVector(90, 12, 1.0);
      // Leg 2: Haluan 000°, 10 Knot, 0.8 Jam = 8 NM
      addVector(0, 10, 0.8);
      // Leg 3: Haluan 240°, 8 Knot, 1.0 Jam = 8 NM
      addVector(240, 8, 1.0);
      
      calculateResultant();
      if (state.displayMode === 'grid') {
        autoFitView();
      } else {
        updateLeafletMap();
      }
    });

    // Eksport Imej PNG
    el.btnExportImg.addEventListener('click', () => {
      if (state.displayMode === 'grid') {
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = el.canvas.width;
        exportCanvas.height = el.canvas.height;
        const expCtx = exportCanvas.getContext('2d');
        const isLight = document.documentElement.getAttribute('data-theme') === 'light';
        expCtx.fillStyle = isLight ? '#f1f5f9' : '#040911';
        expCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
        expCtx.drawImage(el.canvas, 0, 0);

        const link = document.createElement('a');
        link.download = `Carta_Navigasi_${new Date().toISOString().slice(0, 10)}.png`;
        link.href = exportCanvas.toDataURL('image/png');
        link.click();
      } else {
        alert('Untuk mod Peta Laut, anda boleh gunakan fungsi Screenshot.');
      }
    });

    // Togol Mod Cerah / Mod Gelap
    if (el.btnThemeToggle) {
      el.btnThemeToggle.addEventListener('click', toggleTheme);
    }

    // Buka Langkah Pengiraan dalam Pop-up (PC) atau Tab Baharu (Mobile)
    if (el.btnOpenMathPopup) {
      el.btnOpenMathPopup.addEventListener('click', openMathPopup);
    }

    // Skrin Penuh (Fullscreen Toggle)
    if (el.btnFullscreen) {
      el.btnFullscreen.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      });
    }

    // Mouse Drag untuk Pan pada Canvas
    el.canvasWrapper.addEventListener('mousedown', (e) => {
      if (state.displayMode !== 'grid') return;
      state.view.isDragging = true;
      state.view.lastMouseX = e.clientX;
      state.view.lastMouseY = e.clientY;
      el.canvasWrapper.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', (e) => {
      if (state.displayMode !== 'grid') return;
      if (!state.view.isDragging) {
        const rect = el.canvasWrapper.getBoundingClientRect();
        if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
          const sx = e.clientX - rect.left;
          const sy = e.clientY - rect.top;
          const world = screenToWorld(sx, sy);
          el.cursorCoords.textContent = `Koordinat: X: ${world.x.toFixed(2)} NM | Y: ${world.y.toFixed(2)} NM`;
        }
        return;
      }

      const dx = e.clientX - state.view.lastMouseX;
      const dy = e.clientY - state.view.lastMouseY;
      state.view.panX += dx;
      state.view.panY += dy;
      state.view.lastMouseX = e.clientX;
      state.view.lastMouseY = e.clientY;

      drawChart();
    });

    window.addEventListener('mouseup', () => {
      if (state.displayMode !== 'grid') return;
      if (state.view.isDragging) {
        state.view.isDragging = false;
        el.canvasWrapper.style.cursor = 'crosshair';
      }
    });

    el.canvasWrapper.addEventListener('wheel', (e) => {
      if (state.displayMode !== 'grid') return;
      e.preventDefault();
      const rect = el.canvasWrapper.getBoundingClientRect();
      const cursorX = e.clientX - rect.left;
      const cursorY = e.clientY - rect.top;
      const factor = e.deltaY < 0 ? 1.15 : 0.87;
      zoomBy(factor, cursorX, cursorY);
    }, { passive: false });

    // Touch Events untuk Mobile
    el.canvasWrapper.addEventListener('touchstart', (e) => {
      if (state.displayMode !== 'grid') return;
      if (e.touches.length === 1) {
        state.view.isDragging = true;
        state.view.lastMouseX = e.touches[0].clientX;
        state.view.lastMouseY = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        state.view.isDragging = false;
        state.view.touchStartDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    }, { passive: true });

    el.canvasWrapper.addEventListener('touchmove', (e) => {
      if (state.displayMode !== 'grid') return;
      if (e.touches.length === 1 && state.view.isDragging) {
        const dx = e.touches[0].clientX - state.view.lastMouseX;
        const dy = e.touches[0].clientY - state.view.lastMouseY;
        state.view.panX += dx;
        state.view.panY += dy;
        state.view.lastMouseX = e.touches[0].clientX;
        state.view.lastMouseY = e.touches[0].clientY;
        drawChart();
      } else if (e.touches.length === 2) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        if (state.view.touchStartDist > 0) {
          const factor = dist / state.view.touchStartDist;
          zoomBy(factor);
          state.view.touchStartDist = dist;
        }
      }
    }, { passive: true });

    el.canvasWrapper.addEventListener('touchend', () => {
      if (state.displayMode !== 'grid') return;
      state.view.isDragging = false;
      state.view.touchStartDist = 0;
    });

    window.addEventListener('resize', () => {
      if (state.displayMode === 'grid') {
        resizeCanvas();
      } else if (leafletMap) {
        leafletMap.invalidateSize();
        if (state.monteCarlo && state.monteCarlo.isActive) {
          resizeMonteCarloCanvas();
          renderMonteCarloFrame();
        }
      }
    });
  }

  // =========================================================================
  // SIMULASI HANYUTAN MONTE CARLO (STOKASTIK ZARAH DENGAN TIME SLIDER)
  // =========================================================================

  function randomGaussian(mean = 0, stdev = 1) {
    let u = 1 - Math.random();
    let v = Math.random();
    let z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return mean + z * stdev;
  }

  function initMonteCarloParticles() {
    if (!state.finalDatum) {
      calculateFinalDatum();
    }
    const fd = state.finalDatum;
    if (!fd) return;

    const count = 1000;
    const dur = fd.durationHours || 1.0;

    // Komponen TWC
    const twcDist = fd.twcDist || fd.scDist || 0;
    const twcBearing = fd.scBearing || 0;
    const twcSpeed = dur > 0 ? (twcDist / dur) : 0;
    const twcE = state.twcMode === 'observed' ? (state.twcObserved?.twcE || 0.1) : 0.3;

    // Komponen Leeway
    const downwindBearing = fd.downwindBearing || 0;
    const leewaySpeed = fd.leewaySpeed || 0;
    const divergence = fd.divergence || 15;
    const lwE = fd.errorZ ? (fd.errorZ / dur) : 0.25;

    // Ralat Kedudukan Asal (X)
    const errX = fd.errorX || 1.0;

    const particles = [];

    for (let i = 0; i < count; i++) {
      // 1. Ralat kedudukan asal (Gaussian sekitar Origin LKP)
      const dx0 = randomGaussian(0, errX * 0.65);
      const dy0 = randomGaussian(0, errX * 0.65);

      // 2. Cabang Leeway: 50% Kiri, 50% Kanan
      const isLeft = Math.random() < 0.5;
      const branch = isLeft ? 'left' : 'right';

      // 3. Variasi Vektor TWC
      const pTwcSpeed = Math.max(0, randomGaussian(twcSpeed, Math.max(0.05, twcE * 0.5)));
      const pTwcBearing = (randomGaussian(twcBearing, 3.5) + 360) % 360;
      const twcRad = ((90 - pTwcBearing) * Math.PI) / 180;
      const vxTwc = pTwcSpeed * Math.cos(twcRad);
      const vyTwc = pTwcSpeed * Math.sin(twcRad);

      // 4. Variasi Vektor Leeway
      const pLwSpeed = Math.max(0, randomGaussian(leewaySpeed, Math.max(0.05, lwE * 0.5)));
      const divOffset = isLeft ? -divergence : divergence;
      const pLwBearing = (downwindBearing + divOffset + randomGaussian(0, 2.5) + 360) % 360;
      const lwRad = ((90 - pLwBearing) * Math.PI) / 180;
      const vxLw = pLwSpeed * Math.cos(lwRad);
      const vyLw = pLwSpeed * Math.sin(lwRad);

      // 5. Halaju Bersih Zarah (NM / jam)
      const vxTotal = vxTwc + vxLw;
      const vyTotal = vyTwc + vyLw;

      particles.push({
        id: i,
        branch,
        dx0,
        dy0,
        vx: vxTotal,
        vy: vyTotal
      });
    }

    state.monteCarlo.particles = particles;
    state.monteCarlo.maxTime = Math.max(1.0, Math.round(dur * 10) / 10);
    state.monteCarlo.currentTime = state.monteCarlo.maxTime; // Lalai: waktu terkini datum
  }

  function getProbabilityDensityColor(prob, alpha = 0.85) {
    const p = Math.max(0, Math.min(1, prob));
    let r, g, b;
    if (p >= 0.5) {
      // 0.5 -> 1.0 : Kuning (234, 179, 8) -> Merah (239, 68, 68)
      const factor = (p - 0.5) / 0.5;
      r = Math.round(234 + (239 - 234) * factor);
      g = Math.round(179 + (68 - 179) * factor);
      b = Math.round(8 + (68 - 8) * factor);
    } else {
      // 0.0 -> 0.5 : Hijau (34, 197, 94) -> Kuning (234, 179, 8)
      const factor = p / 0.5;
      r = Math.round(34 + (234 - 34) * factor);
      g = Math.round(197 + (179 - 197) * factor);
      b = Math.round(94 + (8 - 94) * factor);
    }
    return {
      fill: `rgba(${r}, ${g}, ${b}, ${alpha})`,
      glow: `rgb(${r}, ${g}, ${b})`
    };
  }

  function startMonteCarloSimulation() {
    if (!state.finalDatum) {
      calculateFinalDatum();
    }

    initMonteCarloParticles();
    state.monteCarlo.isActive = true;
    state.monteCarlo.isPlaying = false;

    // Pastikan mod peta laut dipaparkan
    if (state.displayMode !== 'map') {
      switchDisplayMode('map');
    }

    // Dayakan butang kawalan simulasi
    if (el.btnMcPlay) {
      el.btnMcPlay.disabled = false;
      el.btnMcPlay.title = 'Main / Jeda Simulasi';
    }
    if (el.chkMcVisible) {
      el.chkMcVisible.disabled = false;
      el.chkMcVisible.checked = true;
    }
    state.monteCarlo.isVisible = true;

    if (el.btnMcReset) {
      el.btnMcReset.disabled = false;
    }
    if (el.mcTimeSlider) {
      el.mcTimeSlider.disabled = false;
      el.mcTimeSlider.max = state.monteCarlo.maxTime;
      el.mcTimeSlider.value = state.monteCarlo.currentTime;
    }
    if (el.mcSliderMaxTime) {
      el.mcSliderMaxTime.textContent = `T + ${state.monteCarlo.maxTime.toFixed(1)} Jam`;
    }

    // Paparkan bar timeline Monte Carlo
    if (el.mcTimelineBar) {
      el.mcTimelineBar.style.display = 'flex';
    }

    // Paparkan canvas overlay Monte Carlo
    if (el.mcCanvasOverlay) {
      el.mcCanvasOverlay.style.setProperty('display', 'block', 'important');
      resizeMonteCarloCanvas();
    }

    updateMonteCarloTimeUI();

    const doInitRender = () => {
      if (leafletMap) {
        leafletMap.invalidateSize();
        fitMonteCarloBounds();
      }
      resizeMonteCarloCanvas();
      renderMonteCarloFrame();
    };

    requestAnimationFrame(doInitRender);
    setTimeout(doInitRender, 100);
    setTimeout(doInitRender, 300);
  }

  function fitMonteCarloBounds() {
    if (!leafletMap || !state.finalDatum) return;
    const originLat = state.finalDatum.originLat;
    const originLon = state.finalDatum.originLon;
    const bounds = [[originLat, originLon]];

    if (state.finalDatum.datumLatL && state.finalDatum.datumLonL) {
      bounds.push([state.finalDatum.datumLatL, state.finalDatum.datumLonL]);
    }
    if (state.finalDatum.datumLatR && state.finalDatum.datumLonR) {
      bounds.push([state.finalDatum.datumLatR, state.finalDatum.datumLonR]);
    }

    leafletMap.fitBounds(bounds, { padding: [60, 60] });
  }

  function resizeMonteCarloCanvas() {
    if (!el.mcCanvasOverlay || !el.canvasWrapper) return;
    const rect = el.canvasWrapper.getBoundingClientRect();
    el.mcCanvasOverlay.width = rect.width;
    el.mcCanvasOverlay.height = rect.height;
  }

  function renderMonteCarloFrame() {
    if (!state.monteCarlo.isActive || !state.monteCarlo.isVisible || !el.mcCanvasOverlay || !leafletMap || state.displayMode !== 'map' || state.activeTab === 'vector') {
      if (el.mcCanvasOverlay) {
        const mcCtx = el.mcCanvasOverlay.getContext('2d');
        if (mcCtx) mcCtx.clearRect(0, 0, el.mcCanvasOverlay.width, el.mcCanvasOverlay.height);
        el.mcCanvasOverlay.style.display = 'none';
      }
      return;
    }

    const mcCtx = el.mcCanvasOverlay.getContext('2d');
    if (!mcCtx) return;

    resizeMonteCarloCanvas();
    mcCtx.clearRect(0, 0, el.mcCanvasOverlay.width, el.mcCanvasOverlay.height);

    const fd = state.finalDatum;
    if (!fd) return;

    const originLat = fd.originLat;
    const originLon = fd.originLon;
    const t = state.monteCarlo.currentTime;
    const particles = state.monteCarlo.particles;
    const dur = fd.durationHours || 1.0;

    const cosLat = Math.cos((originLat * Math.PI) / 180);

    // Pusat kluster zarah pada waktu t untuk cabang Kiri & Kanan
    const cxL = dur > 0 ? (fd.totalDxL * (t / dur)) : 0;
    const cyL = dur > 0 ? (fd.totalDyL * (t / dur)) : 0;
    const cxR = dur > 0 ? (fd.totalDxR * (t / dur)) : 0;
    const cyR = dur > 0 ? (fd.totalDyR * (t / dur)) : 0;
    const dveVal = fd.dve || 0.5;
    const errXVal = fd.errorX || 1.0;
    const spread = Math.max(0.35, Math.hypot(errXVal * 0.65, dveVal * t * 0.45));

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const nmX = p.dx0 + p.vx * t;
      const nmY = p.dy0 + p.vy * t;

      // Kira jarak zarah dari pusat kluster (Datum L atau Datum R)
      const cx = p.branch === 'left' ? cxL : cxR;
      const cy = p.branch === 'left' ? cyL : cyR;
      const dist = Math.hypot(nmX - cx, nmY - cy);
      const zScore = dist / spread;
      const pDensity = Math.exp(-0.5 * zScore * zScore); // 1.0 di pusat (merah), menurun ke 0.0 di luar (hijau)
      const colorObj = getProbabilityDensityColor(pDensity, 0.75 + pDensity * 0.2);

      // Tukar NM kepada Lat/Lon
      const lat = originLat + nmY / 60.0;
      const lon = originLon + nmX / (60.0 * cosLat);

      const pt = leafletMap.latLngToContainerPoint([lat, lon]);

      // Lukis titik zarah dengan tona warna kebarangkalian
      mcCtx.beginPath();
      mcCtx.arc(pt.x, pt.y, 2.2 + pDensity * 0.8, 0, Math.PI * 2);
      mcCtx.fillStyle = colorObj.fill;
      mcCtx.shadowColor = colorObj.glow;
      mcCtx.shadowBlur = pDensity > 0.55 ? 5 : 2;
      mcCtx.fill();
    }

    mcCtx.shadowBlur = 0;
  }

  function updateMonteCarloTimeUI() {
    const t = state.monteCarlo.currentTime;
    if (el.mcSliderCurrTime) {
      el.mcSliderCurrTime.textContent = `T + ${t.toFixed(1)} Jam`;
    }
    if (el.mcTimeSlider) {
      el.mcTimeSlider.value = t;
    }
  }

  function toggleMonteCarloPlay() {
    if (!state.monteCarlo.isActive) return;
    if (state.monteCarlo.isPlaying) {
      pauseMonteCarlo();
    } else {
      playMonteCarlo();
    }
  }

  function playMonteCarlo() {
    if (!state.monteCarlo.isActive) return;
    if (state.monteCarlo.currentTime >= state.monteCarlo.maxTime - 0.05) {
      state.monteCarlo.currentTime = 0;
    }
    state.monteCarlo.isPlaying = true;
    state.monteCarlo.lastTimestamp = performance.now();

    if (el.mcPlayIcon) el.mcPlayIcon.style.display = 'none';
    if (el.mcPauseIcon) el.mcPauseIcon.style.display = 'block';

    requestAnimationFrame(monteCarloAnimationLoop);
  }

  function pauseMonteCarlo() {
    state.monteCarlo.isPlaying = false;
    if (el.mcPlayIcon) el.mcPlayIcon.style.display = 'block';
    if (el.mcPauseIcon) el.mcPauseIcon.style.display = 'none';
  }

  function resetMonteCarlo() {
    pauseMonteCarlo();
    state.monteCarlo.currentTime = 0;
    updateMonteCarloTimeUI();
    if (state.monteCarlo.isActive) {
      renderMonteCarloFrame();
    }
  }

  function closeMonteCarlo() {
    pauseMonteCarlo();
    state.monteCarlo.isActive = false;
    if (el.btnMcPlay) {
      el.btnMcPlay.disabled = true;
      el.btnMcPlay.title = "Main / Jeda Simulasi (Klik 'Jana Simulasi' dahulu)";
    }
    if (el.chkMcVisible) {
      el.chkMcVisible.disabled = true;
    }
    if (el.btnMcReset) el.btnMcReset.disabled = true;
    if (el.mcTimeSlider) el.mcTimeSlider.disabled = true;
    if (el.mcCanvasOverlay) el.mcCanvasOverlay.style.display = 'none';
    if (leafletMap) {
      leafletMap.invalidateSize();
      updateLeafletMap();
    }
  }

  function monteCarloAnimationLoop(timestamp) {
    if (!state.monteCarlo.isPlaying || !state.monteCarlo.isActive) return;

    const dt = (timestamp - state.monteCarlo.lastTimestamp) / 1000.0;
    state.monteCarlo.lastTimestamp = timestamp;

    // Di 1x speed, mengambil masa ~8 saat untuk melengkapkan animasi simulasi
    const speed = state.monteCarlo.playbackSpeed || 1.0;
    const timeDelta = (dt * speed) * (state.monteCarlo.maxTime / 8.0);

    state.monteCarlo.currentTime += timeDelta;

    if (state.monteCarlo.currentTime >= state.monteCarlo.maxTime) {
      state.monteCarlo.currentTime = state.monteCarlo.maxTime;
      updateMonteCarloTimeUI();
      renderMonteCarloFrame();
      pauseMonteCarlo();
      return;
    }

    updateMonteCarloTimeUI();
    renderMonteCarloFrame();
    requestAnimationFrame(monteCarloAnimationLoop);
  }

  window.navApp = {
    deleteVector,
    deleteAswVector,
    deleteScVector
  };

  document.addEventListener('DOMContentLoaded', () => {
    const hasRestoredState = loadAppState();
    setupEventListeners();
    initTheme();
    resizeCanvas();
    updateDistancePreview();
    updateAswDistancePreview();
    updateWcDistancePreview();
    updateObsTwcDistancePreview();
    updateScDistancePreview();
    updateUI();
    updateAswUI();
    updateWcUI();
    updateObsTwcUI();
    if (hasRestoredState && state.isScCalculated) {
      calculateScResultant();
    }
    updateScUI();
    switchTwcMode(state.twcMode || 'computed');
    updateAswProbableError();
    updateWcProbableError();
    updateLeewayDistancePreview();
    updateLeewayUI();
    if (el.leewayTargetType && (!hasRestoredState || !state.leewayVector)) {
      onLeewayTargetChanged();
    }
    calculateFinalDatum();

    // Nilai lalai tarikh & masa kecemasan jika tiada state tersimpan
    if (!hasRestoredState || !el.distressDateTimeInput || !el.distressDateTimeInput.value) {
      if (el.distressDateTimeInput) {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        el.distressDateTimeInput.value = now.toISOString().slice(0, 16);
        
        // Default datum datetime: 1 jam selepas distress
        if (el.datumDateTimeInput) {
          const datumTime = new Date(now.getTime() + 1 * 3600 * 1000);
          el.datumDateTimeInput.value = datumTime.toISOString().slice(0, 16);
        }

        calculateTimeInterval();
      }

      if (el.originLatInput) el.originLatInput.value = formatCoordinate(state.originGeo.lat, true);
      if (el.originLonInput) el.originLonInput.value = formatCoordinate(state.originGeo.lon, false);
    } else {
      calculateTimeInterval();
    }

    if (el.planCaseDate && !el.planCaseDate.value) {
      const today = new Date();
      today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
      el.planCaseDate.value = today.toISOString().slice(0, 10);
    }

    updateCaseInfoUI();
    switchTab(state.activeTab || 'vector');
  });

})();
