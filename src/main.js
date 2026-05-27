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
// GEE TILE URL (UPDATED)
// ======================
const GEE_TILE =
  "https://earthengine.googleapis.com/v1/projects/maps-testing-464609/maps/2bf45133fdf75cc221123699ea0ce674-05179bffd3598b8af673c0ed2d4be185/tiles/{z}/{x}/{y}";

// ======================
// MAP
// ======================
const map = new maplibregl.Map({
  container: "map",

  style: {
    version: 8,

    sources: {
      satellite: {
        type: "raster",
        tiles: [
          "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        ],
        tileSize: 256,
      },

      maptiler: {
        type: "vector",
        url: `https://api.maptiler.com/tiles/v3/tiles.json?key=${API_KEY}`,
      },
    },

    layers: [
      {
        id: "satellite",
        type: "raster",
        source: "satellite",
      },

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
// MODEL
// ======================
const data = [
  {
    position: [100.3624642, -0.9242544],
  },
];

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

let ndbiVisible = false;

// ======================
// LOAD MAP
// ======================
map.on("load", () => {
  map.addSource("ndbi", {
    type: "raster",
    tiles: [GEE_TILE],
    tileSize: 256,
  });

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

  map.addControl(overlay);

  loadGeeStats();

  console.log("MAP LOADED");
});

// ======================
// GEOJSON LOADER
// ======================
async function loadGeeStats() {
  try {
    const response = await fetch("/ndbi.geojson");
    const data = await response.json();

    const stats = data.features[0].properties;

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

    createHistogram(stats.histogram.map(Number));
  } catch (err) {
    console.log("GEOJSON ERROR:", err);
  }
}

// ======================
// HISTOGRAM
// ======================
function createHistogram(values = []) {
  const histogram = document.getElementById("histogram");
  histogram.innerHTML = "";

  const maxValue = Math.max(...values);

  values.forEach((v, i) => {
    const bar = document.createElement("div");

    const height = (v / maxValue) * 120;

    bar.style.width = "12px";
    bar.style.height = `${height}px`;
    bar.style.borderRadius = "4px";
    bar.style.display = "inline-block";

    if (i < 4) bar.style.background = "#053061";
    else if (i < 8) bar.style.background = "#2166ac";
    else if (i < 12) bar.style.background = "#4393c3";
    else bar.style.background = "#b2182b";

    histogram.appendChild(bar);
  });
}

// ======================
// TOGGLE
// ======================
document.getElementById("toggleNDBI").addEventListener("click", () => {
  ndbiVisible = !ndbiVisible;

  map.setLayoutProperty(
    "ndbi-layer",
    "visibility",
    ndbiVisible ? "visible" : "none",
  );

  map.setLayoutProperty(
    "3d-buildings",
    "visibility",
    ndbiVisible ? "none" : "visible",
  );

  document.getElementById("toggleNDBI").innerText = ndbiVisible
    ? "Sembunyikan Kerapatan Bangunan"
    : "Tampilkan Kerapatan Bangunan";
});

// ======================
// OPACITY
// ======================
document.getElementById("opacitySlider").addEventListener("input", (e) => {
  const value = Number(e.target.value) / 100;

  document.getElementById("opacityValue").innerText = `${e.target.value}%`;

  map.setPaintProperty("ndbi-layer", "raster-opacity", value);
});
