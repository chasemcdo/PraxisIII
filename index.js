const preferDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)");
const themeIcon = document.querySelector("#theme-icon");
const themeLabel = document.querySelector("#theme-label");
const lightMapStyle = "mapbox://styles/mapbox/light-v10";
const darkMapStyle = "mapbox://styles/mapbox/dark-v10";

////////////////////////////////////////////////////////////////////////////////
// Mapbox
////////////////////////////////////////////////////////////////////////////////

mapboxgl.accessToken = "pk.eyJ1IjoieXVuaGFvLXFpYW4iLCJhIjoiY2t3amQ1M2dsMWg2ZDJwcDhnY2RvMTFwNSJ9.-I-VVokbvicl2sNiLpLwiQ";

const map = new mapboxgl.Map({
  container: "mapbox-container",
  style: preferDark ? darkMapStyle : lightMapStyle,
  center: [0, 0],
  zoom: 5,
});
let isMapLoaded = false;
map.on("load", () => isMapLoaded = true);
map.resize();

////////////////////////////////////////////////////////////////////////////////
// Drawer
////////////////////////////////////////////////////////////////////////////////

const drawer = document.querySelector("#drawer");

function toggleDrawer() {
  if (drawer.classList.contains("drawer-collapsed")) {
    drawer.classList.remove("drawer-collapsed");
  } else {
    drawer.classList.add("drawer-collapsed");
  }
}

////////////////////////////////////////////////////////////////////////////////
// Tabs
////////////////////////////////////////////////////////////////////////////////

const mapTab = document.querySelector("#map-tab");
const aboutTab = document.querySelector("#about-tab");
let activeTab = undefined;

const mapPage = document.querySelector("#map-page");
const aboutPage = document.querySelector("#about-page");
let activePage = undefined;

const mapSettingGroups = document.querySelectorAll(".map-setting-group");

function selectPage(label) {
  if (typeof activeTab !== "undefined") {
    activeTab.classList.remove("drawer-tab-active");
    activeTab = undefined;
  }
  if (typeof activePage !== "undefined") {
    activePage.classList.remove("main-page-active");
    activePage = undefined;
  }

  if (label === "map") {
    activeTab = mapTab;
    activePage = mapPage;
  } else if (label === "about") {
    activeTab = aboutTab;
    activePage = aboutPage;
  } else {
    return;
  }
  activeTab.classList.add("drawer-tab-active");
  activePage.classList.add("main-page-active");

  if (label === "map") {
    map.resize();
  }
  const mapDisplay = label === "map" ? "flex" : "none";
  for (const group of mapSettingGroups) {
    group.style.display = mapDisplay;
  }
}

selectPage("map");

////////////////////////////////////////////////////////////////////////////////
// Data query
////////////////////////////////////////////////////////////////////////////////

function queryMapData() {
  const nStations = 3;
  const nPaths = 100;

  function makeLocation() {
    return [-79.4 + 0.08 * Math.random(), 43.7 + 0.08 * Math.random()];
  }

  const stations = [];
  for (let i = 0; i < nStations; ++i) {
    stations.push({
      id: `station-${i}`,
      location: makeLocation(),
      name: `Station ${i}`,
    });
  }

  function makePath(index) {
    const data = [];
    let time = Date.now() - Math.random() * (60 * 24 * 60 * 60 * 1000);
    let iStation = Math.floor(3 * Math.random());
    let location = stations[iStation].location;
    const direction = [3e-3 * Math.random() - 1.5e-3, 3e-3 * Math.random() - 1.5e-3];

    for (let i = 0; i < 20; ++i) {
      data.push({ time, location });
      time -= Math.random() * (10 * 60 * 1000);
      location = [
        location[0] + direction[0] + 4e-3 * Math.random() - 2e-3,
        location[1] + direction[1] + 4e-3 * Math.random() - 2e-3,
      ];
    }
    return {
      id: `path-${index}`,
      station: `station-${iStation}`,
      data: data.reverse(),
    };
  }

  const paths = [];
  for (let i = 0; i < nPaths; ++i) {
    paths.push(makePath(i));
  }

  return { stations, paths };
}

const { stations, paths } = queryMapData();

////////////////////////////////////////////////////////////////////////////////
// GeoJSON conversion
////////////////////////////////////////////////////////////////////////////////

let filteredPaths = [];

function convertToHeatmapData() {
  return {
    type: "FeatureCollection",
    features: filteredPaths.map(path => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: path.data[0].location,
      },
      "properties": {},
    })),
  };
}

function convertToPathsData() {
  return {
    type: "FeatureCollection",
    features: filteredPaths.map(path => ({
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: path.data.map(record => record.location),
      },
    })),
  };
}

////////////////////////////////////////////////////////////////////////////////
// Data filtering
////////////////////////////////////////////////////////////////////////////////

let filteredStations = new Set();

function updateFilteredStations(newStations) {
  function areSetsEqual(a, b) {
    if (a.size !== b.size) {
      return false;
    }
    for (const e of a) {
      if (!b.has(e)) {
        return false;
      }
    }
    return true;
  }
  if (typeof filteredStations === "undefined" || !areSetsEqual(filteredStations, newStations)) {
    filteredStations = newStations;
    filteredPaths = paths.filter(path => filteredStations.has(path.station));
  }
}

////////////////////////////////////////////////////////////////////////////////
// Map update
////////////////////////////////////////////////////////////////////////////////

let selectedLayer = undefined;
const layerSettingGroup = document.querySelector("#layer-setting-group");
const stationsSettingGroup = document.querySelector("#stations-setting-group");

function updateMapDisplay() {
  if (!isMapLoaded) {
    return;
  }
  const newStations = new Set();
  for (const input of stationsSettingGroup.querySelectorAll("input")) {
    if (input.checked) {
      newStations.add(input.value);
    }
  }
  updateFilteredStations(newStations);

  let newLayer = undefined;
  for (const input of layerSettingGroup.querySelectorAll("input")) {
    if (input.checked) {
      newLayer = input.value;
      break;
    }
  }
  const layerChanged = typeof selectedLayer === "undefined" || selectedLayer !== newLayer;
  if (layerChanged) {
    selectedLayer = newLayer;
  }

  function updateSource(sourceId, data) {
    const source = map.getSource(sourceId);
    if (!source) {
      map.addSource(sourceId, { type: "geojson", data });
    } else {
      source.setData(data);
    }
  }

  function showLayer(layerId, type, source) {
    if (typeof map.getLayer(layerId) === "undefined") {
      let layer = { id: layerId, type, source };
      if (type === "line") {
        layer = {
          ...layer,
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": theme === "dark" ? "#E0E0E0" : "#202020",
          },
        };
      }
      map.addLayer(layer);
    }
    map.setLayoutProperty(layerId, "visibility", "visible");
  }

  function hideLayer(layerId) {
    if (typeof map.getLayer(layerId) !== "undefined") {
      map.setLayoutProperty(layerId, "visibility", "none");
    }
  }

  if (selectedLayer === "heatmap") {
    updateSource("heatmap-source", convertToHeatmapData());
    hideLayer("paths-layer");
    showLayer("heatmap-layer", "heatmap", "heatmap-source");
  } else if (selectedLayer === "paths") {
    updateSource("paths-source", convertToPathsData());
    hideLayer("heatmap-layer");
    showLayer("paths-layer", "line", "paths-source");
  } else {
    hideLayer("heatmap-layer");
    hideLayer("paths-layer");
  }
}

if (isMapLoaded) {
  updateMapDisplay();
} else {
  map.on("load", updateMapDisplay);
}
map.on("styledata", () => {
  selectedLayer = undefined;
  updateMapDisplay();
});

for (const input of layerSettingGroup.querySelectorAll("input")) {
  input.addEventListener("change", updateMapDisplay);
}

////////////////////////////////////////////////////////////////////////////////
// Themes
////////////////////////////////////////////////////////////////////////////////

function setTheme(theme, setMapStyle = true) {
  if (theme === "dark") {
    document.body.classList.add("dark-theme");
    themeIcon.innerText = "nightlight_round";
    themeLabel.innerText = "Dark";
    if (setMapStyle) {
      map.setStyle(darkMapStyle);
    }
  } else {
    document.body.classList.remove("dark-theme");
    themeIcon.innerText = "wb_sunny";
    themeLabel.innerText = "Light";
    if (setMapStyle) {
      map.setStyle(lightMapStyle);
    }
  }
}

let theme = preferDark ? "dark" : "light";
setTheme(theme, false);

function toggleTheme() {
  theme = theme === "light" ? "dark" : "light";
  setTheme(theme);
}

////////////////////////////////////////////////////////////////////////////////
// Stations settings
////////////////////////////////////////////////////////////////////////////////

function fillStationsSettingGroup() {
  stationsSettingGroup.innerHTML = "";

  const header = document.createElement("div");
  header.classList.add("setting-header");
  header.innerText = "Stations";
  stationsSettingGroup.appendChild(header);

  for (const station of stations) {
    const item = document.createElement("div");
    item.classList.add("setting-item");

    const checkbox = document.createElement("input");
    checkbox.setAttribute("type", "checkbox");
    checkbox.setAttribute("id", `map-station-${station.id}`);
    checkbox.setAttribute("name", "map-station");
    checkbox.setAttribute("value", station.id);
    checkbox.checked = true;
    checkbox.addEventListener("change", updateMapDisplay);

    const checkboxSpan = document.createElement("span");
    checkboxSpan.appendChild(checkbox);
    item.appendChild(checkboxSpan);

    const label = document.createElement("label");
    label.setAttribute("for", `map-station-${station.id}`);
    label.innerText = station.name;
    item.appendChild(label);

    stationsSettingGroup.appendChild(item);
  }
}

fillStationsSettingGroup();

////////////////////////////////////////////////////////////////////////////////
// Fitting map bounds
////////////////////////////////////////////////////////////////////////////////

function fitMapBounds() {
  if (stations.length === 0 || paths.length === 0) {
    return;
  }
  const bounds = new mapboxgl.LngLatBounds(stations[0].location, stations[0].location);
  for (const station of stations) {
    bounds.extend(station.location);
  }
  for (const path of paths) {
    for (const point of path.data) {
      bounds.extend(point.location);
    }
  }
  map.fitBounds(bounds, { padding: 100 });
}

fitMapBounds();
