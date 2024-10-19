if (typeof browser === "undefined") {
    var browser = chrome;
}

browser.runtime.onInstalled.addListener(() => {
    var json = loadReferenzWasser();
});

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log(sender.tab ?
            "from a content script:" + sender.tab.url :
        "from the extension");
    fetch("https://app-prod-ws.meteoswiss-app.ch/v1/forecast?plz=" + request.plz + "00&callback=?")
        .then(response => response.json())
        .then(data => {
            console.log(data);
            sendResponse(data);
        })
        .catch(error => {
            console.error("Fehler beim Laden der JSON-Datei:", error);
        });
    return true;
});

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

    fetch("https://www.hydrodaten.admin.ch/web-hydro-maps/hydro_sensor_warn_level.geojson")
        .then(response => response.json())
        .then(data => {
            console.log(data);

            chrome.storage.local.set({ "hydroData": data.features }).then(() => {
                console.log("Value is set");
            });

        })
        .catch(error => {
            console.error("Fehler beim Laden der JSON-Datei:", error);
        });

    fetch("https://data.geo.admin.ch/ch.meteoschweiz.messwerte-niederschlag-72h/ch.meteoschweiz.messwerte-niederschlag-72h_de.csv")
        .then(response => response.text())
        .then(csv => {
            const json = csvToJson(csv);
            chrome.storage.local.set({ "history72": json }).then(() => {
                console.log("Value is set");
            });

        })
        .catch(error => {
            console.error("Fehler beim Laden der JSON-Datei:", error);
        });

    fetch("https://data.geo.admin.ch/ch.meteoschweiz.messwerte-niederschlag-48h/ch.meteoschweiz.messwerte-niederschlag-48h_de.csv")
        .then(response => response.text())
        .then(csv => {
            const json = csvToJson(csv);
            chrome.storage.local.set({ "history48": json }).then(() => {
                console.log("Value is set");
            });

        })
        .catch(error => {
            console.error("Fehler beim Laden der JSON-Datei:", error);
        });

    fetch("https://data.geo.admin.ch/ch.meteoschweiz.messwerte-niederschlag-24h/ch.meteoschweiz.messwerte-niederschlag-24h_de.csv")
        .then(response => response.text())
        .then(csv => {
            const json = csvToJson(csv);
            chrome.storage.local.set({ "history24": json }).then(() => {
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