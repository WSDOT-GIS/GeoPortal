/*global define*/
define([
    "esri/domUtils",
    "esri/Color",
    "esri/InfoTemplate",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/symbols/SimpleLineSymbol",
    "esri/symbols/SimpleFillSymbol",
    "esri/symbols/TextSymbol",

    "ArcGisDrawUI/ArcGisHelper"
], function (
    domUtils,
    Color,
    InfoTemplate,
    SimpleMarkerSymbol,
    SimpleLineSymbol,
    SimpleFillSymbol,
    TextSymbol,
    DrawUIHelper
) {
    return function (map) {
        function createInfoWindowContent(graphic) {
            var btn = document.createElement("button");
            var deleteButtonGraphic = function () {
                if (this.graphic) {
                    map.infoWindow.hide();
                    drawHelper.layer.remove(this.graphic);
                }
            };

            btn.type = "button";
            btn.textContent = "Delete";
            btn.title = "Delete this graphic";
            btn.graphic = graphic;
            btn.classList.add("delete-graphic-button");
            btn.onclick = deleteButtonGraphic;
            return btn;
        }

        var drawToolsNode, lineSymbol, pointSymbol, fillSymbol, textSymbol, lineColor, symbolOptions, drawHelper;

        drawToolsNode = document.getElementById("drawUI");


        if (drawToolsNode) {

            lineSymbol = new SimpleLineSymbol();
            pointSymbol = new SimpleMarkerSymbol();
            fillSymbol = new SimpleFillSymbol();
            textSymbol = new TextSymbol("Default Label");
            lineColor = new Color("red");

            lineSymbol.setColor(lineColor).setWidth(2);
            pointSymbol.setOutline(lineSymbol);
            fillSymbol.setOutline(lineSymbol);
            textSymbol.setColor(lineColor);

            symbolOptions = new DrawUIHelper.SymbolOptions(pointSymbol, lineSymbol, fillSymbol, textSymbol);

            drawHelper = new DrawUIHelper(map, drawToolsNode, symbolOptions, {
                id: "Drawn Features",
                infoTemplate: new InfoTemplate("Drawn Graphic", createInfoWindowContent)
            });

            drawHelper.on("draw-activate", function () {
                map.disablePopups();
            });
            drawHelper.on("draw-complete", function () {
                map.enablePopups();
            });
        }
    };
});
