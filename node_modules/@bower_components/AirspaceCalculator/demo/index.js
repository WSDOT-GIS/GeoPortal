require(["esri/map", "esri/layers/ArcGISImageServiceLayer", "AirspaceCalculator/ArcGisUI"], function (Map, ArcGISImageServiceLayer, ArcGisUI) {
    "use strict";
    // Define the image service URL with airport surfaces.
    var imageServiceUrl = "//data.wsdot.wa.gov/arcgis/rest/services/AirportMapApplication/AirspaceCalculatorSurface/ImageServer";
    // Create the map.
    var map = new Map("map", {
        basemap: "streets",
        center: [-120.80566406246835, 47.41322033015946],
        zoom: 7,
        showAttribution: true
    });
    // Create the ArcGIS Airspace Calculator UI.
    var ui = new ArcGisUI.default(imageServiceUrl);
    ui.zoomLevel = 11;
    ui.form.addEventListener("calculation-error", function (e) {
        console.error("calculation error", e);
    });
    // Insert the UI's <form> into the "tools" div as the first element.
    var toolsDiv = document.getElementById("tools");
    toolsDiv.insertBefore(ui.form, toolsDiv.firstChild);
    // Once the map has loaded...
    map.on("load", function () {
        // Assign the AirspaceCalculator/ArcGisUI's map property.
        ui.map = map;
        ui.form.addEventListener("draw-complete", function () {
            map.setInfoWindowOnClick(true);
        });
        ui.form.addEventListener("add-from-map", function () {
            map.setInfoWindowOnClick(false);
        });
        // You can add the image service to the map, but it's not necessary for the airspace calculator to function.
        map.addLayer(new ArcGISImageServiceLayer(imageServiceUrl, {
            id: "surfaces",
            opacity: 0.5
        }));
    });
});