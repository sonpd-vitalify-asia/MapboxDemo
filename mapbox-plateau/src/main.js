import javascriptLogo from './javascript.svg'
import viteLogo from '/vite.svg'
import { setupCounter } from './counter.js'
import { setupPlateau, setupWind } from './map-visualizer.js';
import { setupFlightRoute } from './flight-route.js';

const VITE_MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
mapboxgl.accessToken = VITE_MAPBOX_TOKEN;

const origin = [139.68786, 35.68355];

const map = new mapboxgl.Map({
    container: 'map', // container ID
    center: origin,
    zoom: 15.27,
    pitch: 42,
    bearing: -50,
    style: 'mapbox://styles/mapbox/satellite-v9',
    minZoom: 10,
    maxZoom: 16,
    maxPitch: 80,
}); 

map.on('style.load', function () {
  setupPlateau(map);
  //setupWind(map);
  setupFlightRoute(map);
});
