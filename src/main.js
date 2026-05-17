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
          "fill-extrusion-color": "#4b4b35",

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
