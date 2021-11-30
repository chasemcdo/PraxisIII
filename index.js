const body = document.querySelector("body");

const initialDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)");
const colorThemeIcon = document.querySelector("#color-theme-icon");
const colorThemeLabel = document.querySelector("#color-theme-label");
const lightMapStyle = "mapbox://styles/mapbox/light-v10";
const darkMapStyle = "mapbox://styles/mapbox/dark-v10";

mapboxgl.accessToken = "pk.eyJ1IjoieXVuaGFvLXFpYW4iLCJhIjoiY2t3amQ1M2dsMWg2ZDJwcDhnY2RvMTFwNSJ9.-I-VVokbvicl2sNiLpLwiQ";
const map = new mapboxgl.Map({
  container: "mapbox-container",
  style: initialDark ? darkMapStyle : lightMapStyle,
  center: [0, 0],
  zoom: 5,
});

function setColorTheme(theme, setMapStyle = true) {
  if (theme === "dark") {
    body.classList.add("dark-theme");
    colorThemeIcon.innerText = "nightlight_round";
    colorThemeLabel.innerText = "Dark";
    if (setMapStyle) {
      map.setStyle(darkMapStyle);
    }
  } else {
    body.classList.remove("dark-theme");
    colorThemeIcon.innerText = "wb_sunny";
    colorThemeLabel.innerText = "Light";
    if (setMapStyle) {
      map.setStyle(lightMapStyle);
    }
  }
}

let colorTheme = initialDark ? "dark" : "light";
setColorTheme(colorTheme, false);

function toggleColorTheme() {
  colorTheme = colorTheme === "light" ? "dark" : "light";
  setColorTheme(colorTheme);
}

const drawer = document.querySelector("#drawer");

function toggleDrawer() {
  if (drawer.classList.contains("drawer-collapsed")) {
    drawer.classList.remove("drawer-collapsed");
  } else {
    drawer.classList.add("drawer-collapsed");
  }
}

const mapTab = document.querySelector("#map-tab");
const aboutTab = document.querySelector("#about-tab");
let activeTab = undefined;
const mapPage = document.querySelector("#map-page");
const aboutPage = document.querySelector("#about-page");
let activePage = undefined;
const mapSettingGroups = document.querySelectorAll("#map-setting-group");

function selectPage(label) {
  if (activeTab !== undefined) {
    activeTab.classList.remove("drawer-tab-active");
    activeTab = undefined;
  }
  if (activePage !== undefined) {
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
    if (map.loaded()) {
      map.resize();
    } else {
      map.once("load", () => map.resize());
    }
  }

  const mapDisplay = label === "map" ? "flex" : "none";
  for (const group of mapSettingGroups) {
    group.style.display = mapDisplay;
  }
}

selectPage("map");

function queryMapData() {
  const nStations = 3;
  const nPaths = 100;

  function makeLocation() {
    return [-0.24 + 0.08 * Math.random(), 5.54 + 0.06 * Math.random()];
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

    for (let i = 0; i < 50; ++i) {
      data.push({ time, location });
      time -= Math.random() * (10 * 60 * 1000);
      location = [
        location[0] + 2e-3 * Math.random() - 1e-3,
        location[1] + 2e-3 * Math.random() - 1e-3
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

const stationsSettingGroup = document.querySelector("#stations-setting-group");

function addStationsSettingGroup() {
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

addStationsSettingGroup();

function updateMapBounds() {
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

  if (map.loaded()) {
    map.fitBounds(bounds, { padding: 50 });
  } else {
    map.once("load", () => map.fitBounds(bounds, { padding: 50 }));
  }
}

updateMapBounds();