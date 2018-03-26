/*global require*/
require(["esri/map", "ArcGisPrintUI"], function (Map, ArcGisPrintUI) {
    var map;

    var printUrl = "http://data.wsdot.wa.gov/arcgis/rest/services/FishPassage/FishPassageExportWebMap/GPServer/Export Web Map";

    var printForm = new ArcGisPrintUI(printUrl);
    var form = printForm.form;
    document.getElementById("tools").appendChild(form);

    map = new Map("map", {
        basemap: "hybrid",
        center: [-120.80566406246835, 47.41322033015946],
        zoom: 7,
        showAttribution: true
    });

    printForm.map = map;
});