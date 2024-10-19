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
}