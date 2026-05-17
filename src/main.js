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
// HTML
// ======================
document.querySelector("#app").innerHTML = `
  <div id="map"></div>
`;

// ======================
// MAP
// ======================
const map = new maplibregl.Map({
  container: "map",

  style: {
    version: 8,

    sources: {
      // ======================
      // SATELLITE BASEMAP
      // ======================
      carto: {
        type: "raster",

        tiles: [
          "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        ],

        tileSize: 256,

        attribution: "Esri World Imagery",
      },

      // ======================
      // VECTOR TILE BUILDINGS
      // ======================
      openmaptiles: {
        type: "vector",

        tiles: [
          "https://tiles.stadiamaps.com/data/openmaptiles/{z}/{x}/{y}.pbf",
        ],

        minzoom: 0,
        maxzoom: 14,
      },
    },

    layers: [
      // ======================
      // BASEMAP
      // ======================
      {
        id: "carto-layer",

        type: "raster",

        source: "carto",
      },

      // ======================
      // 3D BUILDINGS
      // ======================
      {
        id: "3d-buildings",

        type: "fill-extrusion",

        source: "openmaptiles",

        "source-layer": "building",

        minzoom: 14,

        paint: {
          // ======================
          // WARNA GEDUNG
          // ======================
          "fill-extrusion-color": [
            "interpolate",
            ["linear"],
            ["zoom"],

            14,
            "#3b3b2a",

            18,
            "#4b4b35",
          ],

          // ======================
          // TINGGI GEDUNG
          // ======================
          "fill-extrusion-height": ["coalesce", ["get", "render_height"], 8],

          // ======================
          // DASAR GEDUNG
          // ======================
          "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], 0],

          // ======================
          // OPACITY
          // ======================
          "fill-extrusion-opacity": 0.95,

          // ======================
          // GRADIENT
          // ======================
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
// CONTROL NAVIGATION
// ======================
map.addControl(
  new maplibregl.NavigationControl({
    visualizePitch: true,
  }),
  "top-right",
);

// ======================
// ENABLE ROTATE
// ======================
map.dragRotate.enable();

map.touchZoomRotate.enableRotation();

// ======================
// MAX PITCH
// ======================
map.setMaxPitch(85);

// ======================
// ATMOSPHERE / FOG
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
// DECKGL OVERLAY
// ======================
const overlay = new MapboxOverlay({
  interleaved: true,

  layers: [
    new ScenegraphLayer({
      id: "mesjid-3d",

      data,

      scenegraph: modelUrl,

      getPosition: (d) => d.position,

      // ======================
      // ROTASI MODEL
      // ======================
      getOrientation: () => [0, 0, 90],

      // ======================
      // POSISI MODEL
      // ======================
      getTranslation: () => [-50, 180, -30],

      // ======================
      // UKURAN MODEL
      // ======================
      sizeScale: 1.15,

      // ======================
      // LIGHTING
      // ======================
      _lighting: "pbr",

      pickable: true,
    }),
  ],
});

// ======================
// LOAD
// ======================
map.on("load", () => {
  map.addControl(overlay);

  console.log("MAP & MODEL LOADED");
});

// ======================
// ERROR
// ======================
map.on("error", (e) => {
  console.log("MAP ERROR:", e.error);
});
