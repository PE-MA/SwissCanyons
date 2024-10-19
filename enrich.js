if (typeof browser === "undefined") {
    var browser = chrome;
}

var possibleCountryElement = document.getElementsByClassName("bg-slate-100 p-1 sm:p-2 rounded-md sm:rounded-lg flex");
var possibleCountryElement = Array.prototype.slice.call(possibleCountryElement, 0);
var countryElement = possibleCountryElement.find((e) => e.childElementCount === 2);
var linkToCountry = countryElement.getElementsByTagName('a')[0].getAttribute("href");

const regex = /(?<=\[country_id]=)(\d*)/;
var found = linkToCountry.match(regex);
if (found.includes("220")) {
    console.log("Swiss Canyon found");

    var hydrologieTab = document.querySelectorAll('[x-show="showIfTabIs(\'#hydrology\')"]')[0];

    setClaimHeader();

    var enrichDiv = document.createElement("div");
    enrichDiv.style.border = "1px solid red";
    hydrologieTab.appendChild(enrichDiv);

    var coordinates = getCoordinates();
    console.log("coordinates found: " + coordinates[0] + ", " + coordinates[1]);

    try {
        var uuid = getUuid();
        var refDiv = document.createElement("div");
        enrichDiv.appendChild(refDiv);

        var hydroDiv = document.createElement("div");
        enrichDiv.appendChild(hydroDiv);
        addWaterRef(uuid);
    } catch (error) {
        console.error(error);
    }

    try {
        var basin = getBasinData(coordinates);
        var basinDiv = document.createElement("div");
        enrichDiv.appendChild(basinDiv);
        basin.then((attributes) => addBasinHTML(attributes));
    } catch (error) {
        console.error(error);
    }

    try {
        var historyDiv = document.createElement("div");
        enrichDiv.appendChild(historyDiv);
        var history = getHistory(coordinates);
        history.then((history) => addHistoryHTML(history));
    } catch (error) {
        console.error(error);
    }

    try {
        var village = getPLZForCoordinates(coordinates);
        var weatherDiv = document.createElement("div");
        enrichDiv.appendChild(weatherDiv);
        var weather = village.then((village) => getWeatherForVillage(village));
    } catch (error) {
        console.error(error);
    }
}

function setClaimHeader() {
    var headerDiv = document.createElement("div");
    headerDiv.classList.add("flex", "pt-2");

    var img = document.createElement("img");
    img.setAttribute('src', chrome.runtime.getURL("resources/Ssvg.svg"));
    img.style.height = '50px';
    img.style.width = '50px';
    headerDiv.appendChild(img);

    var claimDiv = document.createElement("div");
    claimDiv.classList.add("content-center");

    var claim = document.createElement("p");
    claim.classList.add("font-bold", "pl-1");
    claim.innerText = "Swiss Canyon";
    claimDiv.append(claim);

    headerDiv.append(claimDiv);
    hydrologieTab.appendChild(headerDiv);
}

function getUuid() {
    var currentUrl = window.location.href;
    const regex = /(?<=\/canyon\/).+?(?=#|$)/;
    var Uuid = currentUrl.match(regex)[0];
    return Uuid;
}

function getCoordinates() {
    var coordinateElements = document.querySelectorAll('[x-data="{ show_links: false }"]');

    var startCoordinate = coordinateElements[0].getElementsByTagName('span')[0];
    var coordinateString = startCoordinate.innerText;

    const regexFirstDezimal = /^\d*\.?\d*/;
    var firstDezimal = coordinateString.match(regexFirstDezimal);

    const regexSecondDezimal = /(?<=, )\d*\.?\d*/;
    var secondDezimal = coordinateString.match(regexSecondDezimal);

    return [firstDezimal[0], secondDezimal[0]];
}

async function fetchAsync(url) {
    let response = await fetch(url);
    let data = await response.json();
    console.log(data);
    return data;
}

async function getBasinData(coordinates) {

    var urlString = "https://api3.geo.admin.ch/rest/services/api/MapServer/identify?geometryType=esriGeometryPoint&returnGeometry=false&sr=4326&geometry=" + coordinates[1] + "," + coordinates[0] + "&imageDisplay=0,0,0&mapExtent=0,0,0,0&tolerance=0&layers=all:ch.bafu.wasser-teileinzugsgebiete_2";
    var data = await fetchAsync(urlString);
    return data.results[0].attributes;
}

async function addBasinHTML(basin) {
    await basin;

    basinDiv.classList.add("bg-slate-100", "p-1", "sm:p-2", "rounded-md", "sm:rounded-lg");

    var headLine = document.createElement("p");
    headLine.classList.add("font-bold");
    headLine.innerText = "Einzugsgebiet";
    basinDiv.append(headLine);

    var linkToMap = document.createElement("a");
    linkToMap.classList.add("hover:text-blue-700");
    linkToMap.setAttribute('target', '_blank');
    linkToMap.innerText = "Link zur Karte";
    linkToMap.href = "https://map.geo.admin.ch/#/map?lang=de&z=6.248&bgLayer=ch.swisstopo.pixelkarte-farbe&topic=ech&layers=ch.swisstopo.zeitreihen@year=1864,f;ch.bfs.gebaeude_wohnungs_register,f;ch.bav.haltestellen-oev,f;ch.swisstopo.swisstlm3d-wanderwege,f;ch.astra.wanderland-sperrungen_umleitungen,f;ch.bafu.wasser-teileinzugsgebiete_2@features=" + basin.label + "&featureInfo=default&catalogNodes=ech,532,614";
    basinDiv.append(linkToMap);

    var basinTable = document.createElement("div");
    basinTable.classList.add("grid", "grid-cols-4", "gap-1");

    var cell = document.createElement("div");
    cell.classList.add("bg-slate-200");
    cell.innerText = "Fläche";
    basinTable.append(cell);
    cell = document.createElement("div");
    cell.classList.add("bg-slate-200");
    cell.innerText = "Max. Höhe";
    basinTable.append(cell);
    cell = document.createElement("div");
    cell.classList.add("bg-slate-200");
    cell.innerText = "Mittlere Höhe";
    basinTable.append(cell);
    cell = document.createElement("div");
    cell.classList.add("bg-slate-200");
    cell.innerText = "Min. Höhe";
    basinTable.append(cell);

    cell = document.createElement("div");
    cell.classList.add("bg-slate-200");
    cell.innerText = basin.gesamtflaeche + " km²";
    basinTable.append(cell);
    cell = document.createElement("div");
    cell.classList.add("bg-slate-200");
    cell.innerText = Intl.NumberFormat('de-CH', { style: 'unit', unit: 'meter' }).format(basin.max_z);
    basinTable.append(cell);
    cell = document.createElement("div");
    cell.classList.add("bg-slate-200");
    cell.innerText = Intl.NumberFormat('de-CH', { style: 'unit', unit: 'meter' }).format(basin.mean_z);
    basinTable.append(cell);
    cell = document.createElement("div");
    cell.classList.add("bg-slate-200");
    cell.innerText = Intl.NumberFormat('de-CH', { style: 'unit', unit: 'meter' }).format(basin.min_z);
    basinTable.append(cell);

    basinDiv.append(basinTable);
}

function addWaterRef(uuid) {
    chrome.storage.local.get(["waterRef"]).then((result) => {
        console.log("Value is " + result);
        const jsonArray = Object.values(result.waterRef.Referenzen);
        var waterRef = jsonArray.filter(
            function (data) {
                return data.uuid == uuid;
            }
        )[0];
        console.log(waterRef);
        addWaterHTML(waterRef);
        getcurrentFlowData(waterRef);
    });
}

function addHydroHTML(hydroData) {
    hydroDiv.classList.add("bg-slate-100", "p-1", "sm:p-2", "rounded-md", "sm:rounded-lg");

    var headLine = document.createElement("p");
    headLine.classList.add("font-bold");
    headLine.innerText = "Wasserstand";
    hydroDiv.append(headLine);

    var hydroTable = document.createElement("div");
    hydroTable.classList.add("grid", "grid-cols-3", "gap-1");
    hydroDiv.append(hydroTable);

    var cell = document.createElement("div");
    cell.classList.add("bg-slate-200");
    var measureDate = new Date(hydroData.properties.last_measured_at);
    cell.innerText = "Letzter Messwert (" + measureDate.toLocaleString() + "): ";
    hydroTable.append(cell);

    cell = document.createElement("div");
    cell.classList.add("bg-slate-200");
    cell.innerText = "Mittelwert 24h: ";
    hydroTable.append(cell);

    cell = document.createElement("div");
    cell.classList.add("bg-slate-200");
    cell.innerText = "Maximum 24h: ";
    hydroTable.append(cell);

    cell = document.createElement("div");
    cell.classList.add("bg-slate-200");
    cell.innerText = Intl.NumberFormat('de-CH', { style: 'unit', unit: 'liter-per-second' }).format(hydroData.properties.last_value * 1000);
    hydroTable.append(cell);

    cell = document.createElement("div");
    cell.classList.add("bg-slate-200");
    cell.innerText = Intl.NumberFormat('de-CH', { style: 'unit', unit: 'liter-per-second' }).format(hydroData.properties.mean_24h * 1000);
    hydroTable.append(cell);

    cell = document.createElement("div");
    cell.classList.add("bg-slate-200");
    cell.innerText = Intl.NumberFormat('de-CH', { style: 'unit', unit: 'liter-per-second' }).format(hydroData.properties.max_24h * 1000);
    hydroTable.append(cell);
}

function addWaterHTML(waterRef,) {

    refDiv.classList.add("bg-slate-100", "p-1", "sm:p-2", "rounded-md", "sm:rounded-lg");

    var headLine = document.createElement("p");
    headLine.classList.add("font-bold");
    headLine.innerText = "Referenzwerte";
    refDiv.append(headLine);

    var linkToMap = document.createElement("a");
    linkToMap.classList.add("hover:text-blue-700");
    linkToMap.setAttribute('target', '_blank');
    linkToMap.innerText = "Link zur Messstation";
    linkToMap.href = waterRef.link;
    refDiv.append(linkToMap);

    var refTable = document.createElement("div");
    refTable.classList.add("grid", "grid-cols-3", "gap-1");

    cell = document.createElement("div");
    cell.classList.add("bg-slate-200");
    cell.innerText = "Niedrig bis: ";
    refTable.append(cell);

    cell = document.createElement("div");
    cell.classList.add("bg-slate-200");
    cell.innerText = "Mittel bis: ";
    refTable.append(cell);

    cell = document.createElement("div");
    cell.classList.add("bg-slate-200");
    cell.innerText = "Hoch bis: ";
    refTable.append(cell);

    cell = document.createElement("div");
    cell.classList.add("bg-slate-200");
    cell.innerText = Intl.NumberFormat('de-CH', { style: 'unit', unit: 'liter-per-second' }).format(waterRef.niedrig);
    refTable.append(cell);

    cell = document.createElement("div");
    cell.classList.add("bg-slate-200");
    cell.innerText = Intl.NumberFormat('de-CH', { style: 'unit', unit: 'liter-per-second' }).format(waterRef.mittel);
    refTable.append(cell);

    cell = document.createElement("div");
    cell.classList.add("bg-slate-200");
    cell.innerText = Intl.NumberFormat('de-CH', { style: 'unit', unit: 'liter-per-second' }).format(waterRef.hoch);
    refTable.append(cell);

    cell = document.createElement("div");
    cell.classList.add("bg-slate-200");
    cell.innerText = "Bemerkung: ";
    refTable.append(cell);
    cell = document.createElement("div");
    cell.classList.add("bg-slate-200", "col-span-2");
    cell.innerText = waterRef.bemerkung;
    refTable.append(cell);

    refDiv.append(refTable);
}

async function getcurrentFlowData(waterRef) {
    const regex = /(?<=stationen-und-daten\/).+?(?=$)/;
    var matches = waterRef.link.match(regex);
    if (matches.length === 1) {
        var messStellenID = matches[0];
        chrome.storage.local.get(["hydroData"]).then((result) => {
            console.log("Value is " + result);
            const jsonArray = Object.values(result.hydroData);
            var hydroData = jsonArray.filter(
                function (data) {
                    return data.properties.key == messStellenID;
                }
            )[0];
            console.log(hydroData);
            addHydroHTML(hydroData);
        });
    }
}

async function getPLZForCoordinates(coordinates) {
    var urlString = "https://api3.geo.admin.ch/rest/services/api/MapServer/identify?geometryType=esriGeometryPoint&returnGeometry=false&sr=4326&geometry=" + coordinates[1] + "," + coordinates[0] + "&imageDisplay=0,0,0&mapExtent=0,0,0,0&tolerance=0&layers=all:ch.swisstopo-vd.ortschaftenverzeichnis_plz&returnGeometry=false";
    var data = await fetchAsync(urlString);
    return data.results[0].attributes;

    //https://api3.geo.admin.ch/rest/services/api/MapServer/identify?geometryType=esriGeometryPoint&returnGeometry=false&sr=4326&geometry=8.964972,46.329091&imageDisplay=0,0,0&mapExtent=0,0,0,0&tolerance=0&layers=all:ch.swisstopo-vd.ortschaftenverzeichnis_plz&returnGeometry=false
}

async function getWeatherForVillage(village) {
    browser.runtime.sendMessage({ plz: village.plz }).then((w) => addWeatherHTML(w, village));
}

function addWeatherHTML(weather, villagedata) {
    weatherDiv.classList.add("bg-slate-100", "p-1", "sm:p-2", "rounded-md", "sm:rounded-lg");

    var headLine = document.createElement("p");
    headLine.classList.add("font-bold");
    headLine.innerText = "Wetterprognose für: " + villagedata.langtext + " (" + villagedata.plz + ")";
    weatherDiv.append(headLine);

    var linkToMS = document.createElement("a");
    linkToMS.classList.add("hover:text-blue-700");
    linkToMS.setAttribute('target', '_blank');
    linkToMS.innerText = "Link zu MeteoSwiss";
    linkToMS.href = "https://www.meteoschweiz.admin.ch/lokalprognose/" + villagedata.langtext.toLowerCase() + "/" + villagedata.plz + ".html#forecast-tab=detail-view";
    weatherDiv.append(linkToMS);

    if (weather !== undefined) {
        var weatherTable = document.createElement("div");
        weatherTable.classList.add("grid", "grid-cols-7", "gap-1");

        addCellsToTable(weatherTable, ["", "Temp-Min", "Temp-Max", "Regen", "Regen-Von", "Regen-Bis", "Vorschau"]);

        var todaysWeather = weather.regionForecast[0];
        addCellsToTable(weatherTable, ["Heute (" + new Date(todaysWeather.dayDate).toLocaleDateString() + ")",
        Intl.NumberFormat('de-CH', { style: 'unit', unit: 'celsius' }).format(todaysWeather.temperatureMin),
        Intl.NumberFormat('de-CH', { style: 'unit', unit: 'celsius' }).format(todaysWeather.temperatureMax),
        Intl.NumberFormat('de-CH', { style: 'unit', unit: 'millimeter' }).format(todaysWeather.precipitation),
        Intl.NumberFormat('de-CH', { style: 'unit', unit: 'millimeter' }).format(todaysWeather.precipitationMin),
        Intl.NumberFormat('de-CH', { style: 'unit', unit: 'millimeter' }).format(todaysWeather.precipitationMax),
            ""]);

        var tomorrowsWeather = weather.regionForecast[1];
        addCellsToTable(weatherTable, ["Morgen (" + new Date(tomorrowsWeather.dayDate).toLocaleDateString() + ")",
        Intl.NumberFormat('de-CH', { style: 'unit', unit: 'celsius' }).format(tomorrowsWeather.temperatureMin),
        Intl.NumberFormat('de-CH', { style: 'unit', unit: 'celsius' }).format(tomorrowsWeather.temperatureMax),
        Intl.NumberFormat('de-CH', { style: 'unit', unit: 'millimeter' }).format(tomorrowsWeather.precipitation),
        Intl.NumberFormat('de-CH', { style: 'unit', unit: 'millimeter' }).format(tomorrowsWeather.precipitationMin),
        Intl.NumberFormat('de-CH', { style: 'unit', unit: 'millimeter' }).format(tomorrowsWeather.precipitationMax),
            ""]);

        var theDayAfterTomorrowsWeather = weather.regionForecast[2];
        addCellsToTable(weatherTable, ["Übermorgen (" + new Date(theDayAfterTomorrowsWeather.dayDate).toLocaleDateString() + ")",
        Intl.NumberFormat('de-CH', { style: 'unit', unit: 'celsius' }).format(theDayAfterTomorrowsWeather.temperatureMin),
        Intl.NumberFormat('de-CH', { style: 'unit', unit: 'celsius' }).format(theDayAfterTomorrowsWeather.temperatureMax),
        Intl.NumberFormat('de-CH', { style: 'unit', unit: 'millimeter' }).format(theDayAfterTomorrowsWeather.precipitation),
        Intl.NumberFormat('de-CH', { style: 'unit', unit: 'millimeter' }).format(theDayAfterTomorrowsWeather.precipitationMin),
        Intl.NumberFormat('de-CH', { style: 'unit', unit: 'millimeter' }).format(theDayAfterTomorrowsWeather.precipitationMax),
            ""]);

        weatherDiv.append(weatherTable);
    }
}

function addCellsToTable(Table, valueArray) {
    valueArray.forEach(function (element) {
        var cell = document.createElement("div");
        cell.classList.add("bg-slate-200");
        cell.innerText = element;
        Table.append(cell);
    });
}

async function getHistory(coordinates) {
    var history72 = await chrome.storage.local.get(["history72"]);
    const jsonArray = Object.values(history72)[0];

    var lowestValue;
    var lowestIndex;
    jsonArray.forEach(function (element, i) {
        var distance = haversine(coordinates[0], coordinates[1], element.Breitengrad, element.Laengengrad);
        if (lowestValue === undefined || distance < lowestValue) {
            lowestValue = distance;
            lowestIndex = i;
        }
    });
    var station72 = jsonArray[lowestIndex];

    var history48 = await chrome.storage.local.get(["history48"]);
    var station48 = Object.values(history48)[0].filter(
        function (data) {
            return data.WIGOS == station72.WIGOS;
        }
    )[0];

    var history24 = await chrome.storage.local.get(["history24"]);
    var station24 = Object.values(history24)[0].filter(
        function (data) {
            return data.WIGOS == station72.WIGOS;
        }
    )[0];

    return [station72, station48, station24];
}

function addHistoryHTML(stations) {
    historyDiv.classList.add("bg-slate-100", "p-1", "sm:p-2", "rounded-md", "sm:rounded-lg");

    var headLine = document.createElement("p");
    headLine.classList.add("font-bold");
    headLine.innerText = "Niederschlag für: " + stations[0].Station;
    historyDiv.append(headLine);

    var linkToMS = document.createElement("a");
    linkToMS.classList.add("hover:text-blue-700");
    linkToMS.setAttribute('target', '_blank');
    linkToMS.innerText = "Link zur Messstation";
    linkToMS.href = stations[0].Link;
    historyDiv.append(linkToMS);

    var historyTable = document.createElement("div");
    historyTable.classList.add("grid", "grid-cols-3", "gap-1");

    addCellsToTable(historyTable, ["72h (" + new Date(stations[0].Messdatum).toLocaleString() + ")",
    "48h (" + new Date(stations[1].Messdatum).toLocaleString() + ")",
    "24h (" + new Date(stations[2].Messdatum).toLocaleString() + ")",
    ]);

    addCellsToTable(historyTable, [Intl.NumberFormat('de-CH', { style: 'unit', unit: 'millimeter' }).format(stations[0].Niederschlag_mm),
        Intl.NumberFormat('de-CH', { style: 'unit', unit: 'millimeter' }).format(stations[1].Niederschlag_mm),
        Intl.NumberFormat('de-CH', { style: 'unit', unit: 'millimeter' }).format(stations[2].Niederschlag_mm),
    ]);

    historyDiv.append(historyTable);
}

async function getStation(number, wigos) {
    chrome.storage.local.get(["history" + number]).then((result) => {
        console.log("Value is " + result);
        const jsonArray = Object.values(result)[0];

        if (wigos === undefined) {
            var lowestValue;
            var lowestIndex;
            jsonArray.forEach(function (element, i) {
                var distance = haversine(coordinates[0], coordinates[1], element.Breitengrad, element.Laengengrad);
                if (lowestValue === undefined || distance < lowestValue) {
                    lowestValue = distance;
                    lowestIndex = i;
                }
            });
            return jsonArray[lowestIndex];
        }
        else {
            jsonArray.forEach(function (element) {
                if (element.WIGOS === wigos) {
                    return element;
                }
            });
        }
    });
}

function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371; // Erdradius in Kilometern

    // Umrechnung der Gradangaben in Radians
    const dLat = degreesToRadians(lat2 - lat1);
    const dLon = degreesToRadians(lon2 - lon1);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(degreesToRadians(lat1)) * Math.cos(degreesToRadians(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Entfernung in Kilometern
}

function degreesToRadians(degrees) {
    return degrees * (Math.PI / 180);
}
