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
        var plz = getPLZForCoordinates(coordinates);
        var weather = plz.then((plz) => getWeatherForPLZ(plz));
    } catch (error) {
        console.error(error);
    }

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
        basin.then((attributes) => addBasinInfo(attributes));
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

async function addBasinInfo(basin) {
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
    cell.innerText = basin.gesamtflaeche + " km²";
    basinTable.append(cell);

    cell = document.createElement("div");
    cell.classList.add("bg-slate-200");
    cell.innerText = "Max. Höhe";
    basinTable.append(cell);
    cell = document.createElement("div");
    cell.classList.add("bg-slate-200");
    cell.innerText = Intl.NumberFormat('de-CH', { style: 'unit', unit: 'meter' }).format(basin.max_z);
    basinTable.append(cell);

    cell = document.createElement("div");
    cell.classList.add("bg-slate-200");
    cell.innerText = "Mittlere Höhe";
    basinTable.append(cell);
    cell = document.createElement("div");
    cell.classList.add("bg-slate-200");
    cell.innerText = Intl.NumberFormat('de-CH', { style: 'unit', unit: 'meter' }).format(basin.mean_z);
    basinTable.append(cell);

    cell = document.createElement("div");
    cell.classList.add("bg-slate-200");
    cell.innerText = "Min. Höhe";
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

function addWaterHTML(waterRef, ) {
    
    refDiv.classList.add("bg-slate-100", "p-1", "sm:p-2", "rounded-md", "sm:rounded-lg");

    var headLine = document.createElement("p");
    headLine.classList.add("font-bold");
    headLine.innerText = "Referenz";
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
    return data.results[0].attributes.plz;

    //https://api3.geo.admin.ch/rest/services/api/MapServer/identify?geometryType=esriGeometryPoint&returnGeometry=false&sr=4326&geometry=8.964972,46.329091&imageDisplay=0,0,0&mapExtent=0,0,0,0&tolerance=0&layers=all:ch.swisstopo-vd.ortschaftenverzeichnis_plz&returnGeometry=false
}

async function getWeatherForPLZ(plz) {
    var urlString = "https://app-prod-ws.meteoswiss-app.ch/v1/forecast?plz=" + plz + "00&callback=?";
    var data = await fetchAsync(urlString);
    return data;
}