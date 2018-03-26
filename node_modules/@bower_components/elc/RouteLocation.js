// if the module has no dependencies, the above pattern can be simplified to
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(["./Route", "./RouteId", "./routeUtils"], factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require("Route", "RouteId", "routeUtils"));
    } else {
        // Browser globals (root is window)
        root.RouteLocation = factory(root.Route, root.RouteId, root.routeUtils);
    }
}(this, function (Route, RouteId, routeUtils) {

    "use strict";

    var srmpRe;

    /**
     * Matches an SRMP value.  Either just a number or a number with a B at the end (indicating back mileage).
     * @author Jeff Jacobson
     * @memberOf $.wsdot.elc 
     */
    srmpRe = /^([\d\.]+)(B)?$/i;

    // Define the RouteLocation class.

    /**
     * A class representing either a point or a segement on a WSDOT State Route. 
     * @class A class representing either a point or a segement on a WSDOT State Route.
     * @param {object} [json] An object containing values used to initialize the RouteLocation's properties.  Properties of this object correspond to those of the {@link RouteLocation} class.
     * @param {number} [json.Id] {@link RouteLocation#Id} 
     * @param {string} [json.Route] {@link RouteLocation#Route}  
     * @param {Decrease} [json.Decrease] {@link RouteLocation#Decrease} 
     * @param {number} [json.Arm] {@link RouteLocation#Arm} 
     * @param {number} [json.Srmp] {@link RouteLocation#Srmp} 
     * @param {Boolean} [json.Back] {@link RouteLocation#Back} 
     * @param {Date} [json.ReferenceDate] {@link RouteLocation#ReferenceDate} 
     * @param {Date} [json.ResponseDate] {@link RouteLocation#ResponseDate} 
     * @param {number} [json.EndArm] {@link RouteLocation#EndArm} Only used for line segements, not points. 
     * @param {number} [json.EndSrmp] {@link RouteLocation#EndSrmp} Only used for line segements, not points. 
     * @param {Boolean} [json.EndBack] {@link RouteLocation#EndBack} Only used for line segements, not points.
     * @param {Date} [json.EndReferenceDate] {@link RouteLocation#EndReferenceDate} Only used for line segements, not points.
     * @param {Date} [json.EndResponseDate] {@link RouteLocation#EndResponseDate} Only used for line segements, not points.
     * @param {Date} [json.RealignmentDate] {@link RouteLocation#RealignmentDate} Only used for line segements, not points. You will normally never need to set this in the constructor.
     * @param {Date} [json.EndRealignDate] {@link RouteLocation#EndRealignDate}  Only used for line segements, not points. You will normally never need to set this in the constructor.
     * @param {number} [json.ArmCalcReturnCode] {@link RouteLocation#ArmCalcReturnCode}  You will normally never need to set this in the constructor.
     * @param {number} [json.ArmCalcEndReturnCode] {@link RouteLocation#ArmCalcEndReturnCode}  Only used for line segements, not points. You will normally never need to set this in the constructor.
     * @param {string} [json.ArmCalcReturnMessage] {@link RouteLocation#ArmCalcReturnMessage}  You will normally never need to set this in the constructor.
     * @param {string} [json.ArmCalcEndReturnMessage] {@link RouteLocation#ArmCalcEndReturnMessage}  Only used for line segements, not points. You will normally never need to set this in the constructor.
     * @param {string} [json.LocatingError] {@link RouteLocation#LocatingError}  You will normally never need to set this in the constructor.
     * @param {Object} [json.RouteGeometry] {@link RouteLocation#RouteGeometry}  You will normally never need to set this in the constructor.
     * @param {Object} [json.EventPoint] {@link RouteLocation#EventPoint}  You will normally never need to set this in the constructor.
     * @param {number} [json.Distance] {@link RouteLocation#Distance}   You will normally never need to set this in the constructor.
     * @param {number} [json.Angle] {@link RouteLocation#Angle}  You will normally never need to set this in the constructor.
     * @member {number} Id Since the Find Nearest Route Location method does not return records for locations where it could not find any routes within the search parameters, this ID parameter can be used to indicate which source location a route location corresponds to.
     * @member {string} Route An 3 to 11 digit state route identifier.
     * @member {Boolean} Decrease Indicates of this location is on the Decrease LRS.  This value will be ignored if Route is a ramp.
     * @member {number} Arm The starting measure value.
     * @member {number} Srmp The SRMP for the start point of a route segment or the only point of a point.
     * @member {Boolean} Back Indicates if the SRMP value is back mileage.
     * @member {Date} ReferenceDate The date that the data was collected.
     * @member {Date} ResponseDate The ArmCalc output date.
     * @member {Date} RealignmentDate This is for storing ArmCalc result data of the start point.
     * @member {number} EndArm The end measure value.  Not used when defining a point.
     * @member {number} EndSrmp The SRMP for the end point of a route segment.  Not used when defining a point.
     * @member {Boolean} EndBack Indicates if the EndSrmp value is back mileage.  Not used when defining a point.
     * @member {Date} EndReferenceDate The date that the data was collected.  Not used when defining a point.
     * @member {Date} EndResponseDate The ArmCalc output date.  Not used when defining a point.
     * @member {Date} EndRealignDate This is for storing ArmCalc result data of the end point.  Not used when defining a point.
     * @member {number} ArmCalcReturnCode ArmCalc return code.  See Appendix A of <a href="http://wwwi.wsdot.wa.gov/gis/roadwaydata/training/roadwaydata/pdf/PC_ArmCalc_Manual_3-19-2009.pdf">the PC ArmCalc Training Program Manual</a>.
     * @member {number} ArmCalcEndReturnCode ArmCalc return code for end point of a route segment.  See Appendix A of <a href="http://wwwi.wsdot.wa.gov/gis/roadwaydata/training/roadwaydata/pdf/PC_ArmCalc_Manual_3-19-2009.pdf">the PC ArmCalc Training Program Manual</a>.
     * @member {string} ArmCalcReturnMessage The error message (if any) returned by ArmCalc when converting the begin point.  If no error occurs, this will be set to an empty string by the SOE.
     * @member {string} ArmCalcEndReturnMessage The error message (if any) returned by ArmCalc when converting the end point.  If no error occurs, this will be set to an empty string by the SOE.
     * @member {string} LocatingError If a location cannot be found on the LRS, this value will contain a message.
     * @member {Object} RouteGeometry An object representing either a point or a polygon.
     * @member {Object} EventPoint When locating the nearest point along a route, this value will be set to the input point.
     * @member {number} Distance The offset distance from the EventPoint to the RouteGeometry point.
     * @member {number} Angle The offset angle from the EventPoint to the RouteGeometry point.
     * @see Appendix A of <a href="http://wwwi.wsdot.wa.gov/gis/roadwaydata/training/roadwaydata/pdf/PC_ArmCalc_Manual_3-19-2009.pdf">PC ArmCalc Training Program Manual</a> for the meanings of ArmCalc return codes.
     */
    function RouteLocation(json) {
        if (!(json && typeof  json === "object")) {
            throw new TypeError("No data provided");
        }
        this.Id = typeof  json.Id !== "undefined" ? json.Id : null;
        this.Route = typeof  json.Route !== "undefined" ? json.Route : null;
        this.Decrease = typeof  json.Decrease !== "undefined" ? json.Decrease : null;

        this.Arm = typeof  json.Arm !== "undefined" ? json.Arm : null;
        this.Srmp = typeof  json.Srmp !== "undefined" ? json.Srmp : null;
        this.Back = typeof  json.Back !== "undefined" ? json.Back : null;
        this.ReferenceDate = typeof  json.ReferenceDate !== "undefined" ? json.ReferenceDate : null;
        this.ResponseDate = typeof  json.ResponseDate !== "undefined" ? json.ResponseDate : null;
        this.RealignmentDate = typeof  json.RealignmentDate !== "undefined" ? json.RealignmentDate : null;

        this.EndArm = typeof  json.EndArm !== "undefined" ? json.EndArm : null;
        this.EndSrmp = typeof  json.EndSrmp !== "undefined" ? json.EndSrmp : null;
        this.EndBack = typeof  json.EndBack !== "undefined" ? json.EndBack : null;
        this.EndReferenceDate = typeof  json.EndReferenceDate !== "undefined" ? json.EndReferenceDate : null;
        this.EndResponseDate = typeof  json.EndResponseDate !== "undefined" ? json.EndResponseDate : null;
        this.EndRealignDate = typeof  json.EndRealignDate !== "undefined" ? json.EndRealignDate : null;

        this.ArmCalcReturnCode = typeof  json.ArmCalcReturnCode !== "undefined" ? json.ArmCalcReturnCode : null;
        this.ArmCalcEndReturnCode = typeof  json.ArmCalcEndReturnCode !== "undefined" ? json.ArmCalcEndReturnCode : null;
        this.ArmCalcReturnMessage = typeof  json.ArmCalcReturnMessage !== "undefined" ? json.ArmCalcReturnMessage : null;
        this.ArmCalcEndReturnMessage = typeof  json.ArmCalcEndReturnMessage !== "undefined" ? json.ArmCalcEndReturnMessage : null;

        this.LocatingError = typeof  json.LocatingError !== "undefined" ? json.LocatingError : null;
        this.RouteGeometry = typeof  json.RouteGeometry !== "undefined" ? json.RouteGeometry : null;
        this.EventPoint = typeof  json.EventPoint !== "undefined" ? json.EventPoint : null;
        this.Distance = typeof  json.Distance !== "undefined" ? json.Distance : null;
        this.Angle = typeof  json.Angle !== "undefined" ? json.Angle : null;

        // Set the date properties to Date objects, if appropriate.
        for (var propName in this) {
            if (this.hasOwnProperty(propName)) {

                if (/Date$/gi.test(propName) && (typeof  this[propName] === "string" || typeof  this[propName] === "number")) {
                    this[propName] = new Date(this[propName]);
                }
            }
        }
    }

    /**
     * Returns true if the RouteLocation represents a line, false otherwise.
     * @author Jeff Jacobson
     * @returns {Boolean} Returns true for a linear route location, false for a point.
     */
    RouteLocation.prototype.isLine = function () {
        return this.EndArm !== null || this.EndSrmp !== null;
    };

    /**
     * Converts the RouteLocation into an object that can be passed to the ELC REST SOE.  
     * This is used internally by {@link RouteLocator#findRouteLocations} and {@link RouteLocator#findNearestRouteLocations}
     * This method is also used when the <a href="http://www.javascriptkit.com/jsref/json.shtml">JSON.stringify</a> method is called.
     * Note: Properties of the {@link RouteLocation} that have values of null will be omitted from the output of this method. 
     * @author Jeff Jacobson
     * @this {@link RouteLocation}
     * @returns {object} 
     */
    RouteLocation.prototype.toJSON = function () {
        var prop, value, match, output, numFieldRe, srmpFieldRe, dateFieldRe, boolFieldRe;
        output = {};

        numFieldRe = /^(?:(?:Id)|(?:(?:End)?Arm)|(ReturnCode)|(Distance)|(Angle))$/gi;
        srmpFieldRe = /Srmp$/gi;
        boolFieldRe = /(?:Decrease)|(Back)$/gi;
        dateFieldRe = /Date$/i;

        // Loop through all of the properties in the RouteLocation and copy to the output object.
        for (prop in this) {
            if (this.hasOwnProperty(prop)) {
                value = this[prop];

                if (value && value instanceof Date && dateFieldRe.test(prop)) {
                    output[prop] = [String(routeUtils.getActualMonth(value)), String(value.getDate()), String(value.getFullYear())].join("/");
                } else if (numFieldRe.test(prop)) { // Id, Arm, EndArm, or ...ReturnCode
                    if (value !== null) {
                        output[prop] = routeUtils.toNumber(value, prop);
                    }
                } else if (srmpFieldRe.test(prop)) {
                    // If the value is already a number or null, just pass it in.
                    if (typeof  value === "number" /*|| value === null*/) {
                        output[prop] = value;
                    } else if (typeof  value === "string") {
                        match = srmpRe.exec(value);
                        // If a matching string, match[1] will be the number portion and match[2] will be the back indicator (or undefined if there was no back indicator)
                        if (match) {
                            // Set the output equivalent of this property to the number portion converted to a number.
                            output[prop] = Number(match[1]);
                            // If there is a back indicator, set the corresponding back property to true.
                            if (match[2]) {
                                if (/End$/.test(prop)) {
                                    output.EndBack = true;
                                } else if (prop === "Srmp") {
                                    output.Back = true;
                                }
                            }
                        } else {
                            throw new Error(["Invalid", prop, "value:", String(value)].join(" "));
                        }
                    }
                } else if (prop === "Route") {
                    if (typeof  value === "string") {
                        match = RouteId.routeRe.exec(this[prop]);
                        if (match) {
                            output.Route = match[0];
                        } else {
                            throw new Error("Route is invalidly formatted.");
                        }
                    } else if (value !== null) {
                        throw new Error("Route must be a string.");
                    }
                } else if (boolFieldRe.test(prop)) { // Decrease, Back or EndBack
                    // If provided set Decrease to its boolean equivalent.  Leave as null if its null.
                    output[prop] = value === null ? null : Boolean(value);
                } else if (value !== null) {
                    output[prop] = value;
                }
            }
            /*
            else {
                // Other properties (e.g., from decendant classes) will just be ignored by the ELC, so we can include them in the JSON output.
                // JSLint will complain about this else clause but this is the desired effect.
                output[prop] = value;
            }
            */
        }

        return output;
    };

    // Just return a value to define the module export.
    // This example returns an object, but the module
    // can return a function as the exported value.
    return RouteLocation;
}));