/**
 * A module representing a WSDOT route.
 * @module Route
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(["./RouteId", "./lrsTypeUtils", "./routeTypeUtils"], factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require("RouteId", "lrsTypeUtils", "routeTypeUtils"));
    } else {
        // Browser globals (root is window)
        root.Route = factory(root.RouteId, root.lrsTypeUtils, root.routeTypeUtils);
    }
}(this, function (RouteId, lrsTypeUtils, routeTypeUtils) {

    "use strict";

    /**
     * Represents a state route.
     * @param {string} name - The name of the route.
     * @param {number} lrsTypesValue - An integer from 1 to 4, corresponding to one of the following constants:
     *      {@link lrsTypeUtils.LRS_TYPE_INCREASE},
     *      {@link lrsTypeUtils.LRS_TYPE_DECREASE},
     *      {@link lrsTypeUtils.LRS_TYPE_BOTH},
     *      {@link lrsTypeUtils.LRS_TYPE_RAMP}
     * @param {number} routeType -The type of route. E.g., "SR", "IS", "US", "RA"
     * @constructor
     * @alias module:Route
     **/
    function Route(name, lrsTypesValue, routeType) {
        var _name = name;
        var _lrsTypes = lrsTypeUtils.getLrsTypeValue(lrsTypesValue);
        /*eslint-disable */
        var _routeType = routeType != null ? routeTypeUtils.getRouteTypeValue(routeType) : null;
        /*eslint-enable */

        var _routeId = new RouteId(_name);

        Object.defineProperties(this, {
            /* @member {string} name The name of the route. */
            name: {
                get: function () {
                    return _name;
                }
            },
            isMainline: {
                get: function() {
                    return name.length === 3;
                }
            },
            /**
             * Text label including route type, if available.
             * @type {string}
             */
            label: {
                get: function() {
                    var output;
                    var abbrev = this.routeTypeAbbreviation;
                    var routeNum = parseInt(_routeId.sr, 10);
                    if (abbrev) {
                        if (abbrev === "SR") {
                            output = ["WA", routeNum].join("-");
                        } else if (abbrev === "US") {
                            output = [abbrev, routeNum].join("-");
                        } else if (abbrev === "IS") {
                            output = ["I", routeNum].join("-");
                        }
                    }

                    if (!output) {
                        output = String(routeNum);
                    }
                    return output;
                }
            },
            /* @property {number} lrsTypes An integer from 1 to 4, corresponding to one of the following constants:
             *      {@link lrsTypeUtils.LRS_TYPE_INCREASE},
             *      {@link lrsTypeUtils.LRS_TYPE_DECREASE},
             *      {@link lrsTypeUtils.LRS_TYPE_BOTH},
             *      {@link lrsTypeUtils.LRS_TYPE_RAMP}
             */
            lrsTypes: {
                get: function () {
                    return _lrsTypes;
                }
            },
            routeType: {
                get: function() {
                    return _routeType;
                }
            },
            routeTypeAbbreviation: {
                get: function() {
                    return _routeType !== null ? routeTypeUtils.getRouteTypeAbbreviation(_routeType) : null;
                }
            },
            routeId: {
                get: function() {
                    return _routeId;
                }
            },
            /**
             * Returns a boolean value indicating whether the route is increase.
             * @return {boolean} Returns true if {@link Route#lrsTypes} equals 
             * {@link lrsTypeUtils.LRS_TYPE_INCREASE} or {@link lrsTypeUtils.LRS_TYPE_BOTH}.
             */
            isIncrease: {
                get: function () {
                    return _lrsTypes === lrsTypeUtils.LRS_TYPE_INCREASE || _lrsTypes === lrsTypeUtils.LRS_TYPE_BOTH;
                }
            },
            /**
             * Returns a boolean value indicating whether the route is decrease.
             * @return {boolean} Returns true if {@link Route#lrsTypes} equals 
             * {@link lrsTypeUtils.LRS_TYPE_DECREASE} or {@link lrsTypeUtils.LRS_TYPE_BOTH}.
             */
            isDecrease: {
                get: function () {
                    return _lrsTypes === lrsTypeUtils.LRS_TYPE_DECREASE || _lrsTypes === lrsTypeUtils.LRS_TYPE_BOTH;
                }
            },
            /**
             * Returns a boolean value indicating whether the route is both increase and decrease.
             * @return {boolean} Returns true if {@link Route#lrsTypes} equals {@link lrsTypeUtils.LRS_TYPE_BOTH}.
             */
            isBoth: {
                get: function () {
                    return _lrsTypes === lrsTypeUtils.LRS_TYPE_BOTH;
                }
            },
            /**
             * Returns a boolean value indicating whether the route is a ramp.
             * @return {boolean} Returns true if {@link Route#lrsTypes} equals {@link lrsTypeUtils.LRS_TYPE_RAMP}
             */
            isRamp: {
                get: function () {
                    return _lrsTypes === lrsTypeUtils.LRS_TYPE_RAMP;
                }
            }
        });
    }

    function reviver(k, v) {
        var output = v, currentValue, route;
        if (/^(?:(?:Current)|(?:\d{4,8}))$/.test(k)) {
            output = [];
            for (var routeId in v) {
                if (v.hasOwnProperty(routeId)) {
                    currentValue = v[routeId];
                    try {
                        if (typeof currentValue === "number") {
                            route = new Route(routeId, currentValue);
                        } else if (currentValue.hasOwnProperty("routeType")) {
                            route = new Route(routeId, currentValue.direction, currentValue.routeType);
                        }
                        if (route) {
                            output.push(route);
                        }
                    } catch (err) {
                        console.warn([k, err.message].join(": "), err);
                    }
                }
            }
        } else {
            output = v;
        }
        return output;
    }

    /**
     * Parses a JSON representation of a Route (or an object containing Route properties)
     * into corresponding Route objects.
     * @param {string} json - JSON string
     * @returns {Object} The input JSON string parsed into an Object
     */
    Route.parseRoutes = function (json) {
        return JSON.parse(json, reviver);
    };

    // Just return a value to define the module export.
    // This example returns an object, but the module
    // can return a function as the exported value.
    return Route;
}));