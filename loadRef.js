if (typeof browser === "undefined") {
    var browser = chrome;
}

browser.runtime.onInstalled.addListener(() => {
    var json = loadReferenzWasser();
});

var lastlyLoadedHydro = new Date();
var lastlyLoadedHistory = new Date();

getHydroData();
getHistory();

const refreshDataIntervall = 1800000;
//const refreshDataIntervall = 1;

browser.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    var currentDate = new Date();
    console.log(sender.tab ?
        "from a content script:" + sender.tab.url :
        "from the extension");
    if (request.plz !== undefined) {
        var weather = await fetch("https://app-prod-ws.meteoswiss-app.ch/v1/forecast?plz=" + request.plz + "00&callback=?")
            .then(response => response.json())
            .then(data => {
                return data;
            })
            .catch(error => {
                console.error("Fehler beim Laden der JSON-Datei:", error);
            });
        sendResponse(weather);
        return weather;
    }
    else if (request.messStellenID !== undefined) {
        if (currentDate.getTime() < lastlyLoadedHydro.getTime() + refreshDataIntervall) {
            var hydroData = await browser.storage.local.get(["hydroData"]).then((result) => {
                return result;
            });
            sendResponse(hydroData.hydroData);
            return hydroData.hydroData;
        }
        else {
            var hydro = await getHydroData();
            sendResponse(hydro.features);
            return hydro.features;
        }
    }
    else {
        if (currentDate.getTime() < (lastlyLoadedHistory.getTime() + refreshDataIntervall)) {
            var history = await browser.storage.local.get(["history"]).then((result) => {
                return result;
            });
            history = history.history;
        }
        else {
            var history = await getHistory();
        }
        sendResponse(history);
        return history;
    }
});

async function getHydroData() {
    return fetch("https://www.hydrodaten.admin.ch/web-hydro-maps/hydro_sensor_warn_level.geojson")
        .then(response => response.json())
        .then(data => {
            console.log(data);
            chrome.storage.local.set({ "hydroData": data.features }).then(() => {
                console.log("Value is set");
                lastlyLoadedHydro = new Date();
            });
            return data;
        })
        .catch(error => {
            console.error("Fehler beim Laden der JSON-Datei:", error);
        });
}

async function getHistory() {
    var history72 = await fetch("https://data.geo.admin.ch/ch.meteoschweiz.messwerte-niederschlag-72h/ch.meteoschweiz.messwerte-niederschlag-72h_de.csv")
        .then(response => response.text())
        .then(csv => {
            const json = csvToJson(csv);
            return json;
        })
        .catch(error => {
            console.error("Fehler beim Laden der JSON-Datei:", error);
        });

    var history48 = await fetch("https://data.geo.admin.ch/ch.meteoschweiz.messwerte-niederschlag-48h/ch.meteoschweiz.messwerte-niederschlag-48h_de.csv")
        .then(response => response.text())
        .then(csv => {
            const json = csvToJson(csv);
            return json;
        })
        .catch(error => {
            console.error("Fehler beim Laden der JSON-Datei:", error);
        });

    var history24 = await fetch("https://data.geo.admin.ch/ch.meteoschweiz.messwerte-niederschlag-24h/ch.meteoschweiz.messwerte-niederschlag-24h_de.csv")
        .then(response => response.text())
        .then(csv => {
            const json = csvToJson(csv);
            return json;
        })
        .catch(error => {
            console.error("Fehler beim Laden der JSON-Datei:", error);
        });

    chrome.storage.local.set({ "history": [history72, history48, history24] }).then(() => {
        console.log("Value is set");
        lastlyLoadedHistory = new Date();
    });

    return [history72, history48, history24];
}

async function loadAndSetHistoryToStorage() {
    var history72 = await getHistory(72);
    chrome.storage.local.set({ "history72": history72 }).then(() => {
        console.log("Value is set");
    });

    var history48 = await getHistory(48);
    chrome.storage.local.set({ "history48": history48 }).then(() => {
        console.log("Value is set");
    });

    var history24 = await getHistory(24);
    chrome.storage.local.set({ "history24": history24 }).then(() => {
        console.log("Value is set");
    });
}

async function loadReferenzWasser() {
    fetch(chrome.runtime.getURL("resources/ReferenzWasser.json"))
        .then(response => response.json())
        .then(data => {
            console.log(data);
            // Hier kannst du mit den JSON-Daten weiterarbeiten
            chrome.storage.local.set({ "waterRef": data }).then(() => {
                console.log("Value is set");
            });

        })
        .catch(error => {
            console.error("Fehler beim Laden der JSON-Datei:", error);
        });
}

// Funktion zum Parsen der CSV-Datei
function csvToJson(csv) {
    csv = csv.replaceAll('"', '');
    csv = csv.replaceAll('ä', 'ae');
    csv = csv.replaceAll('ö', 'oe');
    csv = csv.replaceAll('ü', 'ue');
    csv = csv.replaceAll('Niederschlag mm', 'Niederschlag_mm');
    csv = csv.replaceAll('WIGOS-ID', 'WIGOS');
    const lines = csv.split('\n');
    const result = [];

    // Die erste Zeile enthält die Header (Spaltennamen)
    const headers = lines[0].split(';');

    // Für jede Zeile nach der Header-Zeile
    for (let i = 1; i < lines.length; i++) {
        const obj = {};
        const currentLine = lines[i].split(';');

        // Erstelle ein JSON-Objekt für jede Zeile
        headers.forEach((header, index) => {
            obj[header.trim()] = currentLine[index] ? currentLine[index].trim() : null;
        });

        result.push(obj);
    }

    return result;
}