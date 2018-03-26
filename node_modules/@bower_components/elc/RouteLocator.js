/*eslint eqeqeq:[2, "smart"]*/

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(["./Route", "./RouteLocation", "./routeUtils"], factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require("Route", "RouteLocation", "routeUtils"));
    } else {
        // Browser globals (root is window)
        root.RouteLocator = factory(root.Route, root.RouteLocation, root.routeUtils);
    }
}(this, function (Route, RouteLocation, routeUtils) {

    "use strict";


    /**
     * Converts an object into a query string.
     * @param {Object} o - An object
     * @returns {string} Returns a query string representation of the input object.
     */
    function toQueryString(o) {
        var output = [], value;
        for (var name in o) {
            if (o.hasOwnProperty(name)) {
                value = o[name];
                if (value == null) {
                    value = "";
                }
                output.push([name, encodeURIComponent(value)].join("="));
            }
        }
        return output.join('&');
    }

    /** Tests if a URL is under a certain length. This is used to determine whether POST should be used instead of GET.
     * @param {string} url - A URL
     * @param {number} [maxLength=2000] - The threshold URL length used to determine if GET or POST is used.
     * @returns {Boolean} Returns true if url exceeds maxLength, false otherwise.
     */
    function isUrlTooLong(url, maxLength) {
        if (!maxLength) {
            maxLength = 2000;
        }
        if (typeof url === "string") {
            return url.length > 2000;
        }
        return false;
    }

    /**
     * A helper object for querying the ELC REST SOE endpoints.
     * @constructor
     * @param {String} [url="https://data.wsdot.wa.gov/arcgis/rest/services/Shared/ElcRestSOE/MapServer/exts/ElcRestSoe"] The URL for the ELC REST Endpoint.
     * @param {String} [findRouteLocationsOperationName="Find Route Locations"] - The name of the Find Route Locations operation
     * @param {String} [findNearestRouteLocationsOperationName="Find Nearest Route Locations"] - The name of the Find Nearest Route Locations operation
     * @param {String} [routesResourceName="Route Info"] - Set to "routes" for pre 3.3 versions which do not support the "Route Info" endpoint.
     */
    function RouteLocator(url, findRouteLocationsOperationName, findNearestRouteLocationsOperationName, routesResourceName) {
        this.url = url || (typeof window !== "undefined" ? "" : "https:") + "//data.wsdot.wa.gov/arcgis/rest/services/Shared/ElcRestSOE/MapServer/exts/ElcRestSoe";
        this.findRouteLocationsOperationName = findRouteLocationsOperationName || "Find Route Locations";
        this.findNearestRouteLocationsOperationName = findNearestRouteLocationsOperationName || "Find Nearest Route Locations";
        this.routesResourceName = routesResourceName || "Route Info";
        this.layerList = null;
    }

    /**
     * Returns the map service portion of the ELC REST SOE URL.
     * @return {String} Returns the URL to the map service.
     */
    RouteLocator.prototype.getMapServiceUrl = function () {
        return this.url.match(/.+\/MapServer/gi)[0];
    };

    /**
     * A dictionary of route arrays, keyed by year.
     * @typedef {Object.<string, Route[]>} RouteList
     */

    /**
     * Returns a {@link RouteList}
     * @param {boolean} [useCors=true] Set to true if you want to use CORS, false otherwise. (This function does not check client or server for CORS support.)
     * @returns {Promise} - Success: This function takes a single {@link RouteList}, Error: This function takes a single error parameter.
     */
    RouteLocator.prototype.getRouteList = function (useCors) {
        var elc = this, data, request, url;

        var promise = new Promise(function (resolve, reject) {
            if (useCors == null) { // Testing for null or undefined. Use of == instead of === is intentional.
                useCors = true;
            }

            // If a layer list has already been defined (meaning this method has previously been called), call the resolve immediately.
            if (elc.layerList) {
                if (typeof resolve === "function") {
                    resolve(elc.layerList);
                }
                return;
            }


            try {
                request = new XMLHttpRequest();
                url = [elc.url, elc.routesResourceName].join('/');
                data = {
                    "f": "json"
                };
                if (!useCors) {
                    data.callback = "jsonp";
                }
                data = toQueryString(data);
                url = [url, data].join("?");
                request.open("get", url);
                request.addEventListener("loadend", function (e) {
                    var data;
                    data = e.target.response;
                    data = Route.parseRoutes(data);
                    if (this.status === 200) {
                        if (data.error) {
                            if (elc.routesResourceName === "Route Info" && data.error.code === 400) {
                                // If the newer Route Info is not supported, try the older version.
                                console.warn('The "Route Info" endpoint is not supported. Trying the older "route"..."', url);
                                elc.routesResourceName = "routes";
                                elc.getRouteList(useCors).then(resolve, reject);
                            } else {
                                reject(data.error);
                            }
                        } else {
                            elc.layerList = data;
                            resolve(elc.layerList);
                        }
                    } else {
                        if (typeof reject === "function") {
                            reject(data);
                        }
                    }
                });
                request.send();

            } catch (err) {
                // This situation could occur if you try to use CORS when either
                // the browser or GIS server does not support it.
                if (typeof reject === "function") {
                    reject(err);
                }
            }
        });

        return promise;
    };



    /**
     * Converts a Date object into the type of string that the ELC REST SOE methods expect.
     * @author Jeff Jacobson
     * @param {Date} date - A date object.
     * @return {string} A string representation of the input date, if possible, or an empty string.
     * @memberOf RouteLocator
     */
    function dateToRouteLocatorDate(date) {
        var elcdate;
        if (typeof date === "object" && date instanceof Date) {
            // Convert date to a string, as that is what the API is expecting.
            elcdate = [
                String(routeUtils.getActualMonth(date)),
                String(date.getDate()),
                String(date.getFullYear())
            ].join("/");
        } else {
            elcdate = date || "";
        }
        return elcdate;
    }

    RouteLocator.dateToRouteLocatorDate = dateToRouteLocatorDate;

    // Used for JSON deserialization to RouteLocation objects.
    var routeLocationReviver = function (k, v) {
        if (typeof v === "object" && v.hasOwnProperty("Route")) {
            return new RouteLocation(v);
        } else {
            return v;
        }
    };

    /**
     * Calls the ELC REST SOE to get geometry corresponding to the input locations.
     * @author Jeff Jacobson
     * @param {object} params The parameters for the Find Route Locations query.
     * @param {RouteLocation[]} params.locations An array of RouteLocaiton objects.
     * @param {Date} [params.referenceDate] The date that the locations were collected.  This can be omitted if each of the locations in the input array have their ReferenceDate properties set to a Date value.
     * @param {number|string} [params.outSR] The spatial reference for the output geometry, either a WKID or WKT.  If omitted the output geometry will be the same as that of the ELC map service.
     * @param {string} [params.lrsYear] Indicates which LRS layers will be used for linear referencing.  If omitted, the current LRS will be used. (E.g., "Current", "2008", "2005", "2005B".)
     * @param {boolean} [params.useCors=false] If you are sure both your client (browser) and ELC server support CORS, you can set this to true.  Otherwise leave it set to false.
     * @returns {Promise} Returns a promise.
     * @throws {Error} Thrown if invalid parameters are specified.
     */
    RouteLocator.prototype.findRouteLocations = function (params) {
        var locations, referenceDate, outSR, lrsYear, useCors, data;
        locations = params.locations;
        // Set the reference date to an empty string if a value is not provided.  This is what the ELC REST SOE expects when omitting this value. (Hopefully this can be changed in the future.)
        referenceDate = params.referenceDate || "";
        outSR = params.outSR || null;
        lrsYear = params.lrsYear || null;
        useCors = params.useCors != null ? params.useCors : true;

        if (typeof locations !== "object" || !(locations instanceof Array)) {
            throw new Error("The locations parameter must be an array of RouteLocations with at least one element.");
        } else if (!locations.length) { // locations has no elements or no length property...
            throw new Error("locations does not have enough elements.");
        }

        if (typeof referenceDate === "object" && referenceDate instanceof Date) {
            // Convert date to a string, as that is what the API is expecting.
            referenceDate = [
                String(routeUtils.getActualMonth(referenceDate)),
                String(referenceDate.getDate()),
                String(referenceDate.getFullYear())
            ].join("/");
        }/*
         else if (typeof referenceDate !== "string") {
                    console.debug(typeof referenceDate !== "string");
                    throw new Error("Unexpected referenceDate type.  Expected a Date or a string.");
        }*/

        if (typeof outSR !== "undefined" && outSR !== null && typeof outSR !== "number" && typeof outSR !== "string") {
            throw new Error("Unexpected outSR type.  Must be a WKID (number), WKT (string), or omitted (null or undefined).");
        }

        if (typeof lrsYear !== "undefined" && lrsYear !== null && typeof lrsYear !== "string") {
            throw new Error("Invalid lrsYear.  Must be either a string or omitted altogether.");
        }

        var self = this;

        var promise = new Promise(function (resolve, reject) {
            try {
                // Construct the HTTP request.
                data = {
                    f: "json",
                    locations: JSON.stringify(locations),
                    outSR: outSR || null,
                    referenceDate: referenceDate || null,
                    lrsYear: lrsYear || null
                };

                var url = [self.url, self.findRouteLocationsOperationName].join("/");
                if (!useCors) {
                    data.callback = "jsonp";
                }
                var request = new XMLHttpRequest();
                var formData = toQueryString(data);

                // Determine whether to use GET or POST based on URL length.
                var method = isUrlTooLong([url, formData].join("?")) ? "POST" : "GET";

                if (method === "GET") {
                    url = [url, formData].join("?");
                    formData = null;
                }
                request.open(method, url);
                if (formData) {
                    request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
                }

                // When the response has been returned from the request,
                // convert it to RouteLocation objects and resolve the
                // Promise. If an error has occured, reject instead.
                request.addEventListener("loadend", function (e) {
                    var json, output;
                    json = e.target.response;
                    if (e.target.status === 200) {
                        output = JSON.parse(json, routeLocationReviver);
                        if (output.error && typeof reject === "function") {
                            reject(output);
                        } else {
                            resolve(output);
                        }
                    } else {
                        if (typeof reject === "function") {
                            reject(json);
                        }
                    }
                });
                request.send(formData);
            } catch (err) {
                // This situation could occur if you try to use CORS when either
                // the browser or GIS server does not support it.
                if (typeof reject === "function") {
                    reject(err);
                }
            }
        });

        return promise;
    };

    /**
     * Calls the ELC REST SOE to get the route locations corresponding to the input point coordinates.
     * @author Jeff Jacobson
     * @param {object} params - See below for details
     * @param {number[]} params.coordinates An array of numbers with at least two elements.  Even indexed elements represent X coordinates; odd represent Y coordinates.
     * @param {Date} [params.referenceDate] The date that the locations were collected.  This can be omitted if each of the locations in the input array have their ReferenceDate properties set to a Date value.
     * @param {number} params.searchRadius The distance in feet to search around each of the coordinates for a state route.
     * @param {number|string} params.inSR The spatial reference of the coordinates, either a WKID or WKT.  If omitted the output geometry will be the same as that of the ELC map service.
     * @param {number|string} [params.outSR] The spatial reference for the output geometry, either a WKID or WKT.  If omitted the output geometry will be the same as that of the ELC map service.
     * @param {string} [params.lrsYear] Indicates which LRS layers will be used for linear referencing.  If omitted, the current LRS will be used. (E.g., "Current", "2008", "2005", "2005B".)
     * @param {string} [params.routeFilter] A partial SQL query that can be used to limit which routes are searched.  E.g., "LIKE '005%'" or "'005'".
     * @param {boolean} [params.useCors=true] If you are sure both your client (browser) and ELC server support CORS, you can set this to true.  Otherwise leave it set to false.
     * @throws {Error} Throws an error if any of the params properties are provided with invalid values.
     * @returns {Promise} A promise
     */
    RouteLocator.prototype.findNearestRouteLocations = function (params) {
        var elcParams = {
            f: "json"
        };



        if (params.useCors == null) {
            params.useCors = true;
        }

        if (typeof params.referenceDate === "undefined" || params.referenceDate === null) {
            throw new Error("referenceDate not provided.");
        } else {
            // Convert the date into the format that the ELC is expecting.
            elcParams.referenceDate = dateToRouteLocatorDate(params.referenceDate);
        }

        // validate coordinates.
        params.coordinates = routeUtils.flattenArray(params.coordinates); // Run the flattenArray function to ensure array elements are not arrays themselves.
        if (typeof params.coordinates !== "object" || !(params.coordinates instanceof Array)) {
            throw new Error("The coordinates parameter must be an array of numbers.");
        } else if (params.coordinates.length < 2 || params.coordinates.length % 2 !== 0) {
            throw new Error("The coordinates array must contain at least two elements and consist of an even number of elements.");
        }
        // Stringify the coordinates and assign to elcParams.
        elcParams.coordinates = JSON.stringify(params.coordinates);

        // validate search radius
        if (typeof params.searchRadius !== "number" || params.searchRadius <= 0) {
            throw new Error("searchRadius must be a number that is greater than zero.");
        } else {
            elcParams.searchRadius = params.searchRadius;
        }

        // validate inSR.
        if (typeof params.inSR !== "number" && typeof params.outSR !== "string") {
            throw new Error("Unexpected inSR type.  The inSR value must be either a WKID (number) or a WKT (string).");
        } else {
            elcParams.inSR = params.inSR;
        }

        // validate outSR.
        if (typeof params.outSR !== "undefined" && params.outSR !== null && typeof params.outSR !== "number" && typeof params.outSR !== "string") {
            throw new Error("Unexpected outSR type.  Must be a WKID (number), WKT (string), or omitted (null or undefined).");
        } else {
            elcParams.outSR = params.outSR;
        }

        // validate LRS year.
        // Make sure lrsYear is either a string or omitted (null or undefined).  (The previous "if" statement has already converted from number to string, if necessary.)
        if (typeof params.lrsYear !== "undefined" && params.lrsYear !== null && typeof params.lrsYear !== "string") {
            throw new Error("Invalid lrsYear.  Must be either a string or omitted altogether.");
        } else {
            elcParams.lrsYear = params.lrsYear || undefined;
        }

        // validate routeFilter
        elcParams.routeFilter = params.routeFilter || undefined;
        if (typeof params.routeFilter !== "undefined" && typeof params.routeFilter !== "string") {
            throw new Error("Invalid route filter type.  The routeFilter parameter should be either a string or omitted altogether.");
        }

        var self = this;

        var promise = new Promise(function (resolve, reject) {

            try {
                var url = [self.url, self.findNearestRouteLocationsOperationName].join("/");
                if (!params.useCors) {
                    elcParams.callback = "jsonp";
                }
                var formData = toQueryString(elcParams);
                var method = isUrlTooLong(url + "?" + formData) ? "POST" : "GET";
                var request = new XMLHttpRequest();
                if (method === "GET") {
                    url = [url, formData].join("?");
                }
                request.open(method, url);
                if (method === "POST") {
                    request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
                }
                request.addEventListener("loadend", function (e) {
                    var json;
                    json = e.target.response;

                    if (e.target.status === 200) {
                        json = JSON.parse(json, routeLocationReviver);
                        if (json.error) {
                            reject(json);
                        } else {
                            resolve(json);
                        }
                    } else {
                        reject(json);
                    }
                });
                if (method === "POST") {
                    request.send(formData);
                } else {
                    request.send();
                }
            } catch (err) {
                reject(err);
            }
        });

        return promise;
    };

    // Just return a value to define the module export.
    // This example returns an object, but the module
    // can return a function as the exported value.
    return RouteLocator;
}));