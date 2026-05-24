import "./style.css";

import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import { MapboxOverlay } from "@deck.gl/mapbox";
import { ScenegraphLayer } from "@deck.gl/mesh-layers";

// ======================
// MODEL
// ======================
const modelUrl = "/mesjid2.glb";

// ======================
// API KEY MAPTILER
// ======================
const API_KEY = "E8z3IYkizwky7wsmfdrU";

// ======================
// GEE TILE URL
// ======================
const GEE_TILE =
  "https://earthengine.googleapis.com/v1/projects/maps-testing-464609/maps/36dc22f5a55fe9cbc215229e539c77b8-83c0975274f9beadaf2205f42db52457/tiles/{z}/{x}/{y}";

// ======================
// MAP
// ======================
const map = new maplibregl.Map({
  container: "map",

  style: {
    version: 8,

    sources: {
      // ======================
      // SATELLITE
      // ======================
      satellite: {
        type: "raster",

        tiles: [
          "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        ],

        tileSize: 256,
      },

      // ======================
      // MAPTILER VECTOR
      // ======================
      maptiler: {
        type: "vector",

        url: `https://api.maptiler.com/tiles/v3/tiles.json?key=${API_KEY}`,
      },
    },

    layers: [
      // ======================
      // SATELLITE
      // ======================
      {
        id: "satellite",

        type: "raster",

        source: "satellite",
      },

      // ======================
      // 3D BUILDINGS
      // ======================
      {
        id: "3d-buildings",

        type: "fill-extrusion",

        source: "maptiler",

        "source-layer": "building",

        minzoom: 14,

        paint: {
          "fill-extrusion-color": "#F6E7C1",

          "fill-extrusion-height": [
            "coalesce",
            ["get", "render_height"],
            ["get", "height"],
            10,
          ],

          "fill-extrusion-base": [
            "coalesce",
            ["get", "render_min_height"],
            ["get", "min_height"],
            0,
          ],

          "fill-extrusion-opacity": 0.9,

          "fill-extrusion-vertical-gradient": true,
        },
      },
    ],
  },

  center: [100.3624642, -0.9242544],

  zoom: 16.5,

  pitch: 75,

  bearing: -35,

  antialias: true,
});

// ======================
// NAVIGATION
// ======================
map.addControl(
  new maplibregl.NavigationControl({
    visualizePitch: true,
  }),
  "top-right",
);

// ======================
// ROTATE
// ======================
map.dragRotate.enable();

map.touchZoomRotate.enableRotation();

map.setMaxPitch(85);

// ======================
// FOG
// ======================
map.on("style.load", () => {
  map.setFog({
    color: "rgb(20,20,25)",
    "high-color": "rgb(36,92,223)",
    "horizon-blend": 0.03,
    "space-color": "rgb(5,5,10)",
    "star-intensity": 0.15,
  });
});

// ======================
// MODEL POSITION
// ======================
const data = [
  {
    position: [100.3624642, -0.9242544],
  },
];

// ======================
// DECKGL
// ======================
const overlay = new MapboxOverlay({
  interleaved: true,

  layers: [
    new ScenegraphLayer({
      id: "mesjid-3d",

      data,

      scenegraph: modelUrl,

      getPosition: (d) => d.position,

      getOrientation: () => [0, 0, 90],

      getTranslation: () => [-50, 180, -30],

      sizeScale: 1.15,

      _lighting: "pbr",

      pickable: true,
    }),
  ],
});

// ======================
// STATUS NDBI
// ======================
let ndbiVisible = false;

// ======================
// LOAD
// ======================
map.on("load", () => {
  // ======================
  // GEE SOURCE
  // ======================
  map.addSource("ndbi", {
    type: "raster",

    tiles: [GEE_TILE],

    tileSize: 256,
  });

  // ======================
  // GEE LAYER
  // ======================
  map.addLayer({
    id: "ndbi-layer",

    type: "raster",

    source: "ndbi",

    layout: {
      visibility: "none",
    },

    paint: {
      "raster-opacity": 0.7,
    },
  });

  // ======================
  // DECKGL
  // ======================
  map.addControl(overlay);

  // ======================
  // LOAD GEE JSON
  // ======================
  loadGeeStats();

  console.log("MAP & MODEL LOADED");
});

// ======================
// LOAD JSON GEE
// ======================
// ======================
// LOAD JSON GEE
// ======================
async function loadGeeStats() {
  try {
    const response = await fetch("/ndbi.geojson");

    const data = await response.json();

    console.log("FULL GEOJSON:", data);

    // ======================
    // AMBIL PROPERTIES
    // ======================
    const stats = data.features[0].properties;

    console.log("STATS:", stats);

    // ======================
    // UPDATE TEXT
    // ======================
    document.getElementById("minValue").innerText = Number(stats.min).toFixed(
      2,
    );

    document.getElementById("maxValue").innerText = Number(stats.max).toFixed(
      2,
    );

    document.getElementById("meanValue").innerText = Number(stats.mean).toFixed(
      2,
    );

    document.getElementById("stdValue").innerText = Number(stats.std).toFixed(
      2,
    );

    // ======================
    // HISTOGRAM
    // ======================
    const histogramData = stats.histogram.map(Number);

    console.log("HISTOGRAM:", histogramData);

    createHistogram(histogramData);

    console.log("GEE JSON LOADED");
  } catch (err) {
    console.log("GAGAL LOAD JSON:", err);
  }
}

// ======================
// HISTOGRAM
// ======================
// ======================
// HISTOGRAM
// ======================
function createHistogram(values = []) {
  const histogram = document.getElementById("histogram");

  histogram.innerHTML = "";

  // ======================
  // MAX VALUE
  // ======================
  const maxValue = Math.max(...values);

  values.forEach((v, i) => {
    const bar = document.createElement("div");

    // ======================
    // NORMALISASI HEIGHT
    // ======================
    const height = (v / maxValue) * 120;

    bar.style.width = "12px";

    bar.style.height = `${height}px`;

    bar.style.borderRadius = "4px";

    bar.style.display = "inline-block";

    // ======================
    // WARNA
    // ======================
    if (i < 4) {
      bar.style.background = "#053061";
    } else if (i < 8) {
      bar.style.background = "#2166ac";
    } else if (i < 12) {
      bar.style.background = "#4393c3";
    } else if (i < 12) {
      bar.style.background = "#f4a582'";
    } else {
      bar.style.background = "#b2182b";
    }

    histogram.appendChild(bar);
  });
}

// ======================
// TOGGLE BUTTON
// ======================
document.getElementById("toggleNDBI").addEventListener("click", () => {
  ndbiVisible = !ndbiVisible;

  // ======================
  // NDBI SHOW / HIDE
  // ======================
  map.setLayoutProperty(
    "ndbi-layer",
    "visibility",
    ndbiVisible ? "visible" : "none",
  );

  // ======================
  // BUILDING 3D
  // ======================
  map.setLayoutProperty(
    "3d-buildings",
    "visibility",
    ndbiVisible ? "none" : "visible",
  );

  // ======================
  // BUTTON TEXT
  // ======================
  document.getElementById("toggleNDBI").innerText = ndbiVisible
    ? "Sembunyikan Kerapatan Bangunan"
    : "Tampilkan Kerapatan Bangunan";
});

// ======================
// OPACITY CONTROL
// ======================
const opacitySlider = document.getElementById("opacitySlider");

const opacityValue = document.getElementById("opacityValue");

opacitySlider.addEventListener("input", (e) => {
  const value = Number(e.target.value) / 100;

  opacityValue.innerText = `${e.target.value}%`;

  map.setPaintProperty("ndbi-layer", "raster-opacity", value);
});

// ======================
// AUTO REFRESH
// refresh tiap 2 bulan
// ======================
setInterval(
  () => {
    loadGeeStats();

    map.triggerRepaint();

    console.log("NDBI UPDATED");
  },
  1000 * 60 * 60 * 24 * 60,
);

// ======================
// ERROR
// ======================
map.on("error", (e) => {
  console.log("MAP ERROR:", e.error);
});

// ====================== MOBILE PANEL TOGGLE ======================
document.getElementById("btnOpenPanel").addEventListener("click", () => {
  document.getElementById("panel").classList.add("open");
});

document.getElementById("btnClosePanel").addEventListener("click", () => {
  document.getElementById("panel").classList.remove("open");
});
