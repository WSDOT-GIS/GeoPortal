/**
 * Represents a WSDOT State Route Identifier
 * @module RouteId
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory();
    } else {
        // Browser globals (root is window)
        root.RouteId = factory();
    }
}(this, function () {

    "use strict";

    var routeRe;

    /**
     * Matches a state route ID.  Regex.exec will return an array with four elements: the entire route name, SR, RRT, and RRQ 
     * @author Jeff Jacobson
     */
    //routeRe = /^(\d{3})(?:((?:AR)|(?:[CH][DI])|(?:C[O])|(?:F[DI])|(?:LX)|(?:[PQRS][\dU])|(?:RL)|(?:SP)|(?:TB)|(?:TR)|(?:PR)|(?:F[UST])|(?:ML)|(?:UC))([A-Z0-9]{0,6}))?$/i;
    routeRe = /^(\d{3})(?:([A-Z0-9]{2})([A-Z0-9]{0,6}))?/i;
    /*
    ==RRTs (Related Roadway Type)==
    AR Alternate Route 
    CD Collector Distributor (Dec)
    CI Collector Distributor (Inc)
    CO Couplet 
    FI Frontage Road (Inc) 
    FD Frontage Road (Dec) 
    LX Crossroad within Interchange
    RL Reversible Lane 
    SP Spur 
    TB Transitional Turnback 
    TR Temporary Route 
    PR Proposed Route 

    UC Under Construction
    
    ===Ramps===
    P1 - P9 Off Ramp (Inc)
    PU Extension of P ramp
    Q1 - Q9 On Ramp (Inc)
    QU Extension of Q ramp
    R1 - R9 Off Ramp (Dec)
    RU Extension of R ramp
    S1 - S9 On Ramp (Dec)
    SU Extension of S ramp
    
    ==Ferries==
    FS Ferry Ship (Boat) 
    FT Ferry Terminal 

    */

    var rrtDefinitions = {
        "AR": "Alternate Route",
        "CD": "Collector Distributor (Dec)",
        "CO": "Couplet",
        "CI": "Collector Distributor (Inc)",
        "FI": "Frontage Road (Inc)",
        "FD": "Frontage Road (Dec)",
        "LX": "Crossroad within Interchange",
        "RL": "Reversible Lane",
        "SP": "Spur",
        "TB": "Transitional Turnback",
        "TR": "Temporary Route",
        "PR": "Proposed Route",
        "FS": "Ferry Ship (Boat)",
        "FT": "Ferry Terminal",
        "UC": "Under Construction",
        "HI": "Grade-Separated HOV (Inc)",
        "HD": "Grade-Separated HOV (Dec)"
    };

    (function () {
        var rampTypes = {
            "P": "Off Ramp (Inc)",
            "Q": "On Ramp (Inc)",
            "R": "Off Ramp (Dec)",
            "S": "On Ramp (Dec)"
        };

        var key, i, l, newKey, desc;
        for (key in rampTypes) {
            if (rampTypes.hasOwnProperty(key)) {
                desc = rampTypes[key];
                for (i = 1, l = 10; i < l; i += 1) {
                    newKey = [key, i].join("");
                    rrtDefinitions[newKey] = [desc, i].join(" ");
                }
                newKey = key + "U";
                rrtDefinitions[newKey] = ["Extension of", key, "ramp"].join(" ");
            }
        }
    }());

    var rrqAbbreviations = {
        "2NDST": "2nd St.",
        "3RDAVE": "3rd Ave.",
        "6THST": "6th St.",
        "ABERDN": "Aberdeen",
        "ANACOR": "Anacortes",
        "ANACRT": "Anacortes",
        "ANAFT2": "ANAFT2",
        "AURORA": "Aurora",
        "BOONE": "Boone St.",
        //"BREFT2": "BREFT2",
        "BREMER": "Bremerton",
        "BROWNE": "Browne St.",
        "BURKE": "Beverly Burke Rd.",
        "CANBY": "Fort Canby",
        "CEDRWY": "Cedar Way",
        "CLEELM": "Cle Elem",
        //"CLIFT2": "CLIFT2",
        "CLINTN": "Clifton",
        "COLFAX": "Colfax",
        "COUGAR": "Cougar",
        "COUPLT": "COUPLT",
        "COUPVL": "Coupville",
        "CRWNPT": "Crown Point",
        "CS0631": "CS0631",
        "DIVISN": "Division",
        "EAGHBR": "Eagle Harbor",
        "EDMOND": "Edmonds",
        "EVERET": "Everett",
        "FAUNTL": "Fauntleroy",
        "FIFE": "Fife",
        "FRIDAY": "Friday Harbor",
        "GNESSE": "GNESSE",
        "GORST": "Gorst",
        "HERON": "Heron St.",
        "HQUIAM": "Hoquiam",
        "HYAK": "Hyak Dr.",
        "KELRNO": "Keller North",
        "KELRSO": "Keller South",
        "KELSO": "Kelso",
        "KINFT1": "KINFT1",
        "KINGST": "Kingston",
        "KNGSTN": "Kingston",
        "LEAHY": "Leahy",
        "LONNGR": "LONNGR",
        "LOPEZ": "Lopez",
        "MARYHL": "Maryhill",
        "MKLTEO": "Mukilteo",
        "MONROE": "Monroe",
        "MORA": "Mora Rd.",
        "MTBAKR": "Mt. Baker",
        "MUKILT": "Mukilteo",
        "NEWPRT": "Newport",
        "NSC": "NSC",
        "OLD504": "Old 504",
        "OMAK": "Omak",
        "ORCAS": "Orcas Island",
        "ORGBEG": "ORGBEG",
        "ORGMID": "ORGMID",
        "ORGSPR": "ORGSPR",
        "ORONDO": "Orondo",
        "OSO": "Oso",
        "PAINE": "Paine",
        "PEARL": "Pearl St.",
        "PRTANG": "Port Angeles",
        "PTDEFI": "Pt. Defiance",
        "PTTFT2": "PTTFT2",
        "PTTOWN": "Port Townsend",
        "PULLMN": "Pullman",
        "PURDY": "Purdy Ln.",
        "REDMND": "Redmond",
        //"SEAFT2": "SEAFT2",
        //"SEAFT3": "SEAFT3",
        "SEATAC": "SeaTac",
        "SEATTL": "Seattle",
        "SHAW": "Shaw Island",
        "SIDNEY": "Sidney",
        "SLVRDL": "Silverdale",
        "SOUTHW": "Southworth",
        "SUMAS": "Sumas",
        "TAHLEQ": "Tahlequa",
        "TUNNEL": "Tunnel",
        "UNDRWD": "Underwood",
        "VANCVR": "Vancouver",
        //"VASFT2": "VASFT2",
        "VASHON": "Vashon",
        "VIADCT": "Alaskan Way Viaduct",
        "WALULA": "Wallula Junction",
        "WENTCH": "Wenatchee",
        "WESTPT": "Westport",
        //"WINFT2": "WINFT2",
        "WINSLO": "Winslow",
        "XBASE": "XBASE",
        "YELMLP": "Yelm Loop"
    };

    /**
     * Splits a state route ID into SR, RRT, RRQ components.
     * @constructor
     * @param {string} routeId - Identifier for a WA state route
     * @alias module:RouteId
     */
    function RouteId(routeId) {
        var match;

        if (!routeId) {
            throw new TypeError("No route ID was provided.");
        }
        match = routeId.match(routeRe);

        if (!match) {
            throw new Error(['Invalid route ID: "', routeId, '".'].join(""));
        }

        var _sr, _rrt, _rrq;

        _sr = match[1];
        _rrt = match[2] || null;
        _rrq = match[3] || null;

        Object.defineProperties(this, {
            /**
             * @member {string}
             * @readonly
             */
            sr: {
                get: function () {
                    return _sr;
                }
            },
            /**
             * @member {?string}
             * @readonly
             */
            rrt: {
                get: function () {
                    return _rrt;
                }
            },
            /**
             * @member {?string}
             * @readonly
             */
            rrq: {
                get: function () {
                    return _rrq;
                }
            },
            /**
             * @member {?string}
             * @readonly
             */
            rrtDescription: {
                get: function () {
                    return _rrt ? rrtDefinitions[_rrt] : null;
                }
            },
            /** 
             * @member {?(number|string)} - The milepost on the mainline route where this route attaches. 
             * Will be null if the RRQ is non-numeric.
             * @readonly
             */
            mainlineIntersectionMP: {
                get: function () {
                    var i = null;
                    var re = /^(\d+)([BCRS])?$/i;
                    var match = _rrq ? _rrq.match(re) : null;
                    if (match) {
                        i = parseInt(match[1], 10);
                        i = i / 100;
                        if (match[2]) {
                            i = [i, match[2]].join("");
                        }
                    }
                    return i;
                }
            },
            /**
             * @member {?string} - Description of the route ID's RRQ portion, if it exists. Null otherwise.
             * @readonly
             */
            rrqDescription: {
                get: function () {
                    var n, output = null;
                    if (_rrq !== null) {
                        if (rrqAbbreviations[_rrq]) {
                            output = rrqAbbreviations[_rrq];
                        } else {
                            n = this.mainlineIntersectionMP;
                            if (n !== null) {
                                output = " @ MP " + n;
                            } else {
                                output = _rrq;
                            }
                        }
                    }
                    return output;
                }
            },
            /**
             * @member {string} - Extended description of the route ID.
             * @readonly
             */
            description: {
                get: function () {
                    var label;
                    if (!_rrt) {
                        label = [_sr, "Mainline"].join(" ");
                    } else if (!_rrq) {
                        label = [_sr, this.rrtDescription].join(" ");
                    } else if (this.mainlineIntersectionMP !== null) {
                        label = [_sr, this.rrtDescription, "@ MP", this.mainlineIntersectionMP].join(" ");
                    } else {
                        label = [_sr, this.rrtDescription, this.rrqDescription].join(" ");
                    }

                    return label;
                }
            }
        });
    }

    /**
     * Returns a string representation of the RouteID.
     * @returns {string} - Returns the route identifier string.
     */
    RouteId.prototype.toString = function () {
        var output = [this.sr];
        if (this.rrt) {
            output.push(this.rrt);
            if (this.rrq) {
                output.push(this.rrq);
            }
        }
        return output.join("");
    };

    RouteId.routeRe = routeRe;

    /**
     * A comparison method used for sorting {@link RouteId} objects.
     * @param {RouteId} a - RouteId object to be compared
     * @param {RouteId} b - RouteId object to be compared
     * @returns {number} Returns a value indicating if a should be before b or vice-versa.
     */
    RouteId.sort = function (a, b) {
        var sa, sb;
        if (a.sr > b.sr) {
            return 1;
        } else if (a.sr < b.sr) {
            return -1;
        } else if (a.rrq !== null && b.rrq !== null) {
            if (a.rrq === b.rrq) {
                return 0;
            } else if (a.mainlineIntersectionMP === null && b.mainlineIntersectionMP !== null) {
                return -1;
            } else if (a.mainlineIntersectionMP !== null && b.mainlineIntersectionMP === null) {
                return 1;
            } else if (a.rrq > b.rrq) {
                return 1;
            } else {
                return -1;
            }
        } else {
            sa = a.toString();
            sb = b.toString();
            if (sa === sb) {
                return 0;
            } else if (sa > sb) {
                return 1;
            } else {
                return -1;
            }
        }
    };

    return RouteId;
}));