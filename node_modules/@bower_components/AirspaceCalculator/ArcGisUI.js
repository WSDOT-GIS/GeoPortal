var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./UI", "esri/Color", "esri/toolbars/draw", "esri/layers/GraphicsLayer", "esri/graphic", "esri/geometry/Point", "esri/renderers/UniqueValueRenderer", "esri/symbols/SimpleMarkerSymbol", "esri/symbols/SimpleLineSymbol", "esri/InfoTemplate"], factory);
    }
})(function (require, exports) {
    "use strict";
    /**
     * Airspace Calculator for use with ArcGIS API for JavaScript.
     * @module ArcGisUI
     */
    var UI_1 = require("./UI");
    var Color = require("esri/Color");
    var Draw = require("esri/toolbars/draw");
    var GraphicsLayer = require("esri/layers/GraphicsLayer");
    var Graphic = require("esri/graphic");
    var Point = require("esri/geometry/Point");
    var UniqueValueRenderer = require("esri/renderers/UniqueValueRenderer");
    var SimpleMarkerSymbol = require("esri/symbols/SimpleMarkerSymbol");
    var SimpleLineSymbol = require("esri/symbols/SimpleLineSymbol");
    var InfoTemplate = require("esri/InfoTemplate");
    /**
     * Creates the renderer
     * @returns {UniqueValueRenderer}
     */
    function createRenderer() {
        var lineSymbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color("black"), 1);
        var defaultSymbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_SQUARE, 10, lineSymbol, new Color([255, 255, 255, 0.5]));
        var renderer = new UniqueValueRenderer(defaultSymbol, "penetratesSurface");
        var penetrationSymbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_SQUARE, 10, lineSymbol, new Color("red"));
        renderer.addValue({
            value: 1,
            symbol: penetrationSymbol,
            label: "Penetration",
            description: "Penetration"
        });
        return renderer;
    }
    /**
     * Converts feet to meters
     * @param {number} feet
     * @returns {number}
     */
    function feetToMeters(feet) {
        var ftPerM = 3.28084;
        return feet / ftPerM;
    }
    /**
     * Formats a Number (feet) into a string (feet and inches (rounded))
     * @param {number} feet
     * @returns {string}
     */
    function formatAsFeetAndInches(feet) {
        var prime = "\u2032";
        var doublePrime = "\u2033";
        var inches = feet % 1;
        feet = feet - inches;
        inches = Math.round(inches * 12);
        if (inches === 12) {
            feet += 1;
            inches = 0;
        }
        return inches > 0 ? [feet, prime, inches, doublePrime].join("") : [feet, prime].join("");
    }
    /**
     * Formats feet as X'Y" (Z m.)
     * @param {number} feet
     * @returns {string}
     */
    function formatFeetAsFeetAndInchesAndMeters(feet) {
        var m = feetToMeters(feet);
        return [formatAsFeetAndInches(feet), " (", Math.round(m * 100) / 100, " m.)"].join("");
    }
    /**
     * Converts an {@link AirspaceCalculatorResult} into a {@link external:Graphic}.
     * @param {AirspaceCalculatorResult} acResult
     * @returns {external:Graphic}
     */
    function acResultToGraphic(acResult) {
        var point = new Point({
            x: acResult.xy[0],
            y: acResult.xy[1],
            spatialReference: { wkid: 4326 }
        });
        var graphic = new Graphic(point, undefined, {
            agl: acResult.surfacePenetration.agl,
            distanceFromSurface: acResult.surfacePenetration.distanceFromSurface,
            penetrationOfSurface: acResult.surfacePenetration.penetrationOfSurface,
            surfaceElevation: acResult.surfacePenetration.surfaceElevation,
            terrainElevation: acResult.surfacePenetration.terrainElevation,
            penetratesSurface: acResult.surfacePenetration.penetratesSurface ? 1 : 0
        });
        return graphic;
    }
    /**
     * Creates the info window title.
     * @param {Graphic} graphic
     * @returns {string}
     */
    function formatTitle(graphic) {
        return graphic.attributes.penetratesSurface ? "Surface Penetration" : "No Surface Penetration";
    }
    /**
     * Creates the info window content.
     * @param {Graphic} graphic
     * @returns {HTMLDivElement}
     */
    function formatResults(graphic) {
        var output, message, list;
        message = ["A structure ", graphic.attributes.agl, "' above ground level ", graphic.attributes.penetratesSurface ? " would " : " would not ", " penetrate an airport's airspace."].join("");
        output = document.createElement("div");
        var p = document.createElement("p");
        var a;
        p.textContent = message;
        output.appendChild(p);
        if (graphic.attributes.penetratesSurface) {
            p = document.createElement("p");
            a = document.createElement("a");
            a.href = "http://www.faa.gov/forms/index.cfm/go/document.information/documentID/186273";
            a.target = "_blank";
            a.textContent = a.title = "Form FAA 7460-1: Notice of Proposed Construction or Alteration";
            p.appendChild(a);
            output.appendChild(p);
        }
        list = document.createElement("dl");
        output.appendChild(list);
        var data = {
            "Penetration of <abbr title='Federal Aviation Regulations'>FAR</abbr> Surface occurred at": formatFeetAsFeetAndInchesAndMeters(graphic.attributes.distanceFromSurface),
            "Terrain Elevation": formatFeetAsFeetAndInchesAndMeters(graphic.attributes.terrainElevation)
        };
        if (graphic.attributes.penetratesSurface) {
            data["Structure Exceeds <abbr title='Federal Aviation Regulations'>FAR</abbr> Surface by"] = formatFeetAsFeetAndInchesAndMeters(graphic.attributes.penetrationOfSurface);
        }
        for (var propName in data) {
            if (data.hasOwnProperty(propName)) {
                var dt = document.createElement("dt");
                dt.innerHTML = propName;
                list.appendChild(dt);
                var dd = document.createElement("dd");
                dd.textContent = data[propName];
                list.appendChild(dd);
            }
        }
        return output;
    }
    /**
     * Extension of {@link AirspaceCalculator/UI} for ArcGIS API.
     * @constructor
     * @augments AirspaceCalculator/UI
     */
    var ArcGisUI = (function (_super) {
        __extends(ArcGisUI, _super);
        function ArcGisUI(imageServiceUrl, elevationServiceUrl) {
            var _this = _super.call(this, imageServiceUrl, elevationServiceUrl) || this;
            _this.zoomLevel = 11;
            _this._draw = null;
            _this._map = null;
            _this._mapMarkerSymbol = new SimpleMarkerSymbol();
            return _this;
        }
        ArcGisUI.prototype.updateMapMarker = function (dmsCoordinates) {
            if (dmsCoordinates) {
                var point = dmsCoordinates instanceof Point ? dmsCoordinates : new Point({
                    x: dmsCoordinates.longitude.dd,
                    y: dmsCoordinates.latitude.dd,
                    spatialReference: {
                        wkid: 4326
                    }
                });
                if (!this._markerGraphic) {
                    this._markerGraphic = new Graphic(point, this._mapMarkerSymbol);
                    this._markerLayer.add(this._markerGraphic);
                }
                else {
                    this._markerGraphic.setGeometry(point);
                }
                this._markerLayer.refresh();
            }
            else {
                // Remove existing marker
                if (this._markerGraphic) {
                    this._markerLayer.remove(this._markerGraphic);
                    this._markerLayer.refresh();
                    this._markerGraphic = null;
                }
            }
        };
        Object.defineProperty(ArcGisUI.prototype, "map", {
            get: function () {
                return this._map;
            },
            set: function (value) {
                this._map = value;
                var self = this;
                if (this._map) {
                    this._draw = new Draw(this._map);
                    this._markerLayer = this._map.graphics;
                    this._draw.on("draw-complete", function (drawResponse) {
                        drawResponse.target.deactivate();
                        var drawPoint = drawResponse.geographicGeometry;
                        self.form.x.value = drawPoint.x;
                        self.form.y.value = drawPoint.y;
                        self.updateMapMarker(drawPoint);
                        var evt = new CustomEvent("draw-complete", {
                            detail: drawResponse
                        });
                        self.form.dispatchEvent(evt);
                    });
                    this.form.addEventListener("add-from-map", function () {
                        self._draw.activate(Draw.POINT);
                    });
                    this.form.addEventListener("calculation-complete", function (e) {
                        var acResult = e.detail;
                        var graphic = acResultToGraphic(acResult);
                        self._resultLayer.add(graphic);
                        self.updateMapMarker();
                    });
                    this.form.addEventListener("clear-graphics", function () {
                        self._resultLayer.clear();
                    });
                    this.form.addEventListener("coordinates-update", function (e) {
                        var dmsCoordinates = e ? e.detail : null;
                        self.updateMapMarker(dmsCoordinates);
                    });
                    var renderer = createRenderer();
                    var infoTemplate = new InfoTemplate(formatTitle, formatResults);
                    this._resultLayer = new GraphicsLayer({
                        id: "results",
                        infoTemplate: infoTemplate
                    });
                    this._resultLayer.setRenderer(renderer);
                    this._resultLayer.on("graphic-add", function (e) {
                        var graphic = e ? e.graphic || null : null;
                        if (graphic) {
                            var geometry = graphic.geometry;
                            if (self._map) {
                                var infoWindow = self._map.infoWindow;
                                infoWindow.setFeatures([graphic]);
                                infoWindow.show(geometry);
                                self._map.centerAndZoom(geometry, self.zoomLevel);
                            }
                        }
                    });
                    this._map.addLayer(self._resultLayer);
                }
            },
            enumerable: true,
            configurable: true
        });
        return ArcGisUI;
    }(UI_1.default));
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = ArcGisUI;
});
//# sourceMappingURL=ArcGisUI.js.map