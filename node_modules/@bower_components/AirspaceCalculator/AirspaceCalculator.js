/**
 * Calculates surface penetrations
 * @module AirspaceCalculator
 */
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "usgs-ned", "./SurfacePenetrationInfo"], factory);
    }
})(function (require, exports) {
    "use strict";
    var usgs_ned_1 = require("usgs-ned");
    var SurfacePenetrationInfo_1 = require("./SurfacePenetrationInfo");
    /**
     * @external ArcGisPoint
     * @see {@link http://resources.arcgis.com/en/help/arcgis-rest-api/02r3/02r3000000n1000000.htm#POINT|Point}
     */
    /**
     * Converts WGS 84 coordinate pair into ArcGIS format point object.
     * @returns {ArcGisPoint}
     */
    function createEsriGeometry(x, y) {
        return {
            x: x,
            y: y,
            spatialReference: {
                wkid: 4326
            }
        };
    }
    /**
     * Converts an object into a query string
     */
    function objectToQueryString(o) {
        var output = [];
        for (var name_1 in o) {
            if (o.hasOwnProperty(name_1)) {
                var v = o[name_1];
                if (typeof v === "object") {
                    v = JSON.stringify(v);
                }
                output.push([name_1, v].map(encodeURIComponent).join("="));
            }
        }
        return output.join("&");
    }
    /**
     * Executes an identify operation on an image service and returns the numeric value.
     */
    function identify(x, y, imageServerUrl) {
        var params = {
            geometry: createEsriGeometry(x, y),
            returnGeometry: false,
            geometryType: "esriGeometryPoint",
            f: "json"
        };
        // Add the identify operation to the URL if not present.
        if (!/\/identify\/?$/.test(imageServerUrl)) {
            imageServerUrl = imageServerUrl.replace(/\/?$/, "/identify");
        }
        // Add the query string URL.
        imageServerUrl = [imageServerUrl, objectToQueryString(params)].join("?");
        return fetch(imageServerUrl).then(function (response) {
            return response.json();
            // For JSON structure, see response section here:
            // http://resources.arcgis.com/en/help/arcgis-rest-api/index.html#/Identify/02r30000010s000000/
        }).then(function (json) {
            var pixelValue = json.value;
            var n = Number(pixelValue);
            // Return the number, or pixel value if not a number.
            return isNaN(n) ? pixelValue : n;
        });
    }
    /**
     * Performs calculation
     * @param x - X coordinate of a point
     * @param y - Y coordinate of a point
     * @param agl - Height above ground level (AGL) in feet.
     * @param imageServiceUrl - E.g., http://example.com/arcgis/rest/services/Airport/Airport_Surfaces_40ft_Int/ImageServer
     * @param [elevationServiceUrl] - Override the default URL to the USGS National Map Elevation service, in case they move the service in the future.
     */
    var calculateSurfacePenetration = function (x, y, agl, imageServiceUrl, elevationServiceUrl) {
        var elevationPromise = usgs_ned_1.default(x, y, "Feet", elevationServiceUrl);
        var identifyPromise = identify(x, y, imageServiceUrl);
        return new Promise(function (resolve, reject) {
            Promise.all([elevationPromise, identifyPromise]).then(function (promises) {
                var terrainResponse = promises[0];
                var surfaceElevation = typeof promises[1] === "number" ? promises[1] : null;
                var spInfo = new SurfacePenetrationInfo_1.default(agl, surfaceElevation, terrainResponse.elevation);
                resolve({
                    surfacePenetration: spInfo,
                    terrainInfo: terrainResponse,
                    xy: [x, y]
                });
            }, function (error) {
                reject(error);
            });
        });
    };
    /**
     * Calculates surface penetrations
     */
    var AirspaceCalculator = (function () {
        /**
         * @param imageServiceUrl - E.g., http://example.com/arcgis/rest/services/Airport/Airport_Surfaces_40ft_Int/ImageServer
         * @param [elevationServiceUrl] - Override the default URL to the USGS National Map Elevation service, in case they move the service in the future.
         */
        function AirspaceCalculator(imageServiceUrl, elevationServiceUrl) {
            this.imageServiceUrl = imageServiceUrl;
            this.elevationServiceUrl = elevationServiceUrl;
            if (!imageServiceUrl) {
                throw new TypeError("imageServiceUrl not provided");
            }
        }
        /**
         * Performs calculation
         * @param {number} x
         * @param {number} y
         * @param {number} agl - Height above ground level (AGL) in feet.
         * @returns {Promise<AirspaceCalculatorResult>}
         */
        AirspaceCalculator.prototype.calculate = function (x, y, agl) {
            return calculateSurfacePenetration(x, y, agl, this.imageServiceUrl, this.elevationServiceUrl);
        };
        ;
        return AirspaceCalculator;
    }());
    /**
     * Performs calculation
     * @param {number} x
     * @param {number} y
     * @param {number} agl - Height above ground level (AGL) in feet.
     * @param {string} imageServiceUrl - E.g., http://example.com/arcgis/rest/services/Airport/Airport_Surfaces_40ft_Int/ImageServer
     * @returns {Promise<AirspaceCalculatorResult>}
     */
    AirspaceCalculator.calculateSurfacePenetration = calculateSurfacePenetration;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = AirspaceCalculator;
});
//# sourceMappingURL=AirspaceCalculator.js.map