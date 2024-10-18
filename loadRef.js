browser.runtime.onInstalled.addListener(() => {
    var json = loadReferenzWasser();
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