/*global require*/
require([
    "esri/map",
    "RouteLocator",
    "RouteLocator/elc-ui/ArcGisElcUI"
], function (esriMap, elc, ArcGisElcUI) {
    var map, elcUI;


    var elcUrl = (function (urlMatch) {
        return urlMatch ? urlMatch[1] : null;
    }(location.search.match(/url=([^=&]+)/i)));

    elcUI = new ArcGisElcUI(document.getElementById("elcUI"), { bootstrap: true, url: elcUrl });

    /**
     * Shows a Bootstrap modal
     * @param {string} body - The body content.
     * @param {string} title - The title of the modal.
     */
    function showModal(body, title) {
        var modal = document.getElementById("modal");
        var modalBody = modal.querySelector(".modal-body");
        var modalTitle = modal.querySelector(".modal-title");
        modalBody.textContent = body;
        modalTitle.textContent = title || "Alert";
        $(modal).modal();
    }

    // Show a modal when no results are found.
    elcUI.on("elc-results-not-found", function () {
        showModal("No results found.", "Alert");
    });

    // Show an error message when a location cannot be located.
    elcUI.on("non-geometry-results-returned", function (e) {
        console.log("non geometry results found", e);
        var elcResult = e.elcResults[0];
        var output = [];
        var properties = [
            "LocatingError",
            "ArmCalcReturnMessage",
            "ArmCalcEndReturnMessage"
        ];
        properties.forEach(function (name) {
            if (elcResult[name]) {
                output.push([name, elcResult[name]].join(": "));
            }
        });
        output = output.join("\n");
        showModal(output);
    });

    // Add a point to the map when results are found.
    elcUI.on("elc-results-found", function (e) {
        var point;
        if (e && e.graphics && e.graphics.length > 0) {
            point = e.graphics[0].geometry;
            if (point.getPoint) {
                point = point.getPoint(0, 0);
            }
            map.infoWindow.show(point);
            map.centerAt(point);
            map.infoWindow.setFeatures(e.graphics);
        }
    });

    // Create the map.
    map = new esriMap("map", {
        basemap: "osm",
        center: [-120.80566406246835, 47.41322033015946],
        zoom: 7,
        showAttribution: true
    });

    // When the map has loaded, set the elcUI's map property.
    map.on("load", function () {
        elcUI.setMap(map);
    });

});