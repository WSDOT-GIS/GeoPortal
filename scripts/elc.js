/*jslint white: true */
/*globals jQuery*/

// Copyright ©2012 Washington State Department of Transportation (WSDOT).  Released under the MIT license (http://opensource.org/licenses/MIT).

(function ($) {
	"use strict";
	
	var routeRe, srmpRe;
	
	// Add the wsdot namespace to jQuery.
	if (typeof($.wsdot) === "undefined") {
		/**
		 * @namespace 
		 */
		$.wsdot = {};
	}

	/**
	 * @namespace
	 */
	$.wsdot.elc = {};
	
	/**
	 * Returns the month component of a Date object as an integer.
	 * For some reason JavaScript's Date.getMonth() method returns a zero-based month integer (i.e., Jan = 0, Feb = 1, etc.) instead of the way 
	 * almost every culture on Earth would expect (i.e., Jan = 1, Feb = 2, etc.).  This method returns it the correct way.
	 * @author Jeff Jacobson
	 * @return {number} Returns the number that humans use to represent the Date's month (Date.getMonth() + 1).
	 */
	Date.prototype.getActualMonth = function () {
		return this.getMonth() + 1;
	};
	
	/**
	 * Matches a state route ID.  Regex.exec will return an array with four elements: the entire route name, SR, RRT, and RRQ 
	 * @author Jeff Jacobson
	 * @memberOf $.wsdot.elc
	 */
	routeRe = /^(\d{3})(?:((?:AR)|(?:C[DI])|(?:C[O])|(?:F[DI])|(?:LX)|(?:[PQRS][\dU])|(?:RL)|(?:SP)|(?:TB)|(?:TR)|(?:PR)|(?:F[ST])|(?:ML))([A-Z0-9]{0,6}))?$/i; ///^(\d{3})(?:([A-Za-z0-9]{2})([A-Za-z0-9]{0,6}))?$/i;
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
	

	/**
	 * Matches an SRMP value.  Either just a number or a number with a B at the end (indicating back mileage).
	 * @author Jeff Jacobson
	 * @memberOf $.wsdot.elc 
	 */
	srmpRe = /^([\d\.]+)(B)?$/i;
	
	$.wsdot.elc.routeRe = routeRe;
	$.wsdot.elc.srmpRe = srmpRe;
	

	/**
	 * A helper object for querying the ELC REST SOE endpoints.
	 * @author Jeff Jacobson
	 * @class A helper object for querying the ELC REST SOE endpoints.
	 * @param {String} [url="http://wsdot.wa.gov/geosvcs/ArcGIS/rest/services/Shared/ElcRestSoe/MapServer/exts/ElcRestSoe"] The URL for the ELC REST Endpoint.
	 * @param {String} [findRouteLocationsOperationName="Find Route Locations"]
	 * @param {String} [findNearestRouteLocationsOperationName="Find Nearest Route Locations"]
	 * @param {String} [routesResourceName="routes"]
	 * @memberOf $.wsdot.elc
	 */
	function RouteLocator(url, findRouteLocationsOperationName, findNearestRouteLocationsOperationName, routesResourceName) {
		this.url = url || "http://wsdot.wa.gov/geosvcs/ArcGIS/rest/services/Shared/ElcRestSoe/MapServer/exts/ElcRestSoe";
		this.findRouteLocationsOperationName = findRouteLocationsOperationName || "Find Route Locations";
		this.findNearestRouteLocationsOperationName = findNearestRouteLocationsOperationName || "Find Nearest Route Locations";
		this.routesResourceName = routesResourceName || "routes";
		this.layerList = null;
	}
	
	$.wsdot.elc.RouteLocator = RouteLocator;
	
	/** 
	 * Route is increase only.
	 * @constant 
	 * @type{number}
	 * @default 1
	 * 
	 */
	$.wsdot.elc.ROUTE_TYPE_INCREASE = 1;
	/** 
	 * Route is decrease only
	 * @constant
	 * @type{number}
	 * @default 2
	 */
	$.wsdot.elc.ROUTE_TYPE_DECREASE = 2;
	/** 
	 * Route is both increase and decrease.
	 * @constant
	 * @type{number}
	 * @default 3 ({@link $.wsdot.elc.ROUTE_TYPE_INCREASE} | {@link $.wsdot.elc.ROUTE_TYPE_DECREASE} )
	 */
	$.wsdot.elc.ROUTE_TYPE_BOTH = 3;
	/** 
	 * Route is a ramp.
	 * @constant
	 * @type{number}
	 * @default 4
	 */
	$.wsdot.elc.ROUTE_TYPE_RAMP = 4;
	
	/**
	 * Represents a state route.
	 * @param {string} name The name of the route.
	 * @param {number} lrsTypes An integer from 1 to 4, corresponding to one of the following constants:
	 *		{@link $.wsdot.elc.ROUTE_TYPE_INCREASE},
	 *		{@link $.wsdot.elc.ROUTE_TYPE_DECREASE},
	 *		{@link $.wsdot.elc.ROUTE_TYPE_BOTH},
	 *		{@link $.wsdot.elc.ROUTE_TYPE_RAMP}	 
	 * @property {string} name The name of the route.
	 * @property {number} lrsTypes An integer from 1 to 4, corresponding to one of the following constants:
	 *		{@link $.wsdot.elc.ROUTE_TYPE_INCREASE},
	 *		{@link $.wsdot.elc.ROUTE_TYPE_DECREASE},
	 *		{@link $.wsdot.elc.ROUTE_TYPE_BOTH},
	 *		{@link $.wsdot.elc.ROUTE_TYPE_RAMP}
	 * @memberof $.wsdot.elc
	 * @class
	 **/
	function Route(name, lrsTypes) {
		this.name = name;
		this.lrsTypes = lrsTypes;
	}
	
	$.wsdot.elc.Route = Route;
	/**
	 * Returns a boolean value indicating whether the route is increase.
	 * @return {boolean} Returns true if {@link $.wsdot.elc.Route#lrsTypes} equals 
	 * {@link $.wsdot.elc.ROUTE_TYPE_INCREASE} or {@link $.wsdot.elc.ROUTE_TYPE_BOTH}.
	 */
	$.wsdot.elc.Route.prototype.isIncrease = function () {
		return this.lrsTypes === 1 || this.lrsTypes === 3;
	};
	
	/**
	 * Returns a boolean value indicating whether the route is decrease.
	 * @return {boolean} Returns true if {@link $.wsdot.elc.Route#lrsTypes} equals 
	 * {@link $.wsdot.elc.ROUTE_TYPE_DECREASE} or {@link $.wsdot.elc.ROUTE_TYPE_BOTH}.
	 */
	$.wsdot.elc.Route.prototype.isDecrease = function () {
		return this.lrsTypes === 2 || this.lrsTypes === 3;
	};
	
	/**
	 * Returns a boolean value indicating whether the route is both increase and decrease.
	 * @return {boolean} Returns true if {@link $.wsdot.elc.Route#lrsTypes} equals {@link $.wsdot.elc.ROUTE_TYPE_BOTH}.
	 */
	$.wsdot.elc.Route.prototype.isBoth = function () {
		return this.lrsTypes === 3;
	};
	
	/**
	 * Returns a boolean value indicating whether the route is a ramp.
	 * @return {boolean} Returns true if {@link $.wsdot.elc.Route#lrsTypes} equals {@link $.wsdot.elc.ROUTE_TYPE_RAMP}
	 */
	$.wsdot.elc.Route.prototype.isRamp = function () {
		return this.lrsTypes === 4;
	};


	/**
	 * Represents the list of routes returned from the ELC's routes resource.  The properties of this class will be the same as the LRS years
	 * of the map service.  The values of these properties are arrays of {@link $.wsdot.elc.Route} objects.
	 * @class Represents the list of routes returned from the ELC's routes resource.  The properties of this class will be the same as the LRS years
	 * of the map service.  The values of these properties are arrays of {@link $.wsdot.elc.Route} objects.
	 * @param {object} data The JSON data returned from the ELC's "routes" resource.
	 * @memberof $.wsdot.elc
	 */
	function RouteList(data) {
		var year, routes, route;
				
		for (year in data) {
			if (data.hasOwnProperty(year)) {
				routes = [];
				for (route in data[year]) {
					if (data[year].hasOwnProperty(route)) {
						routes.push(new Route(route, data[year][route]));
					}
				}
				this[year] = routes;
			}
		}
	}
	

	$.wsdot.elc.RouteList = RouteList;
	
	/**
	 * Gets a sorted list of the LRS years.
	 * @return {Array} An array of LRS year strings.
	 */
	$.wsdot.elc.RouteList.prototype.getYearList = function () {
		var year, output = [];
		for (year in this) {
			if (this.hasOwnProperty(year)) {
				output.push(year);
			}
		}
		
		output.sort();
		
		return output;
	};
	
	/**
	 * Returns the map service portion of the ELC REST SOE URL.
	 * @return {String}
	 */
	$.wsdot.elc.RouteLocator.prototype.getMapServiceUrl = function () {
		return this.url.match(/.+\/MapServer/gi)[0];
	};
	
	/**
	 * Returns a {@link $.wsdot.elc.RouteList}
	 * @param {function} completeHandler This function takes a single {@link $.wsdot.elc.RouteList}
	 * @param {function} errorHandler This function takes a single error parameter.
	 * @param {boolean|false} useCors Set to true if you want to use CORS, false otherwise. (This function does not check client or server for CORS support.)  
	 */
	$.wsdot.elc.RouteLocator.prototype.getRouteList = function (completeHandler, errorHandler, useCors) {
		var elc = this, data;
		// If a layer list has already been defined (meaning this method has previously been called), call the completeHandler immediately.  
		if (elc.layerList) {
			if (typeof(completeHandler) === "function") {
				completeHandler(elc.layerList);
			}
			return;
		}
		
		try {
			data = {
				f: "json"
			};
			
			$.ajax({
				url: [elc.url, elc.routesResourceName].join('/'),
				dataType: useCors ? "json" : "jsonp",
				// type: "POST",
				cache: true,
				jsonpCallback: "jsonp",
				data: data,
				success: function (data) {
					var layers;
					
					if (typeof(data.error) !== "undefined" && typeof(errorHandler === "function")) {
						errorHandler(data);
					}
					else {
						elc.layerList = new RouteList(data);
						completeHandler(elc.layerList);
					}
				},
				error: function (error) {
					if (typeof(errorHandler === "function")) {
						errorHandler(error);
					}
				}
			});
		} catch (err) {
			// This situation could occur if you try to use CORS when either
			// the browser or GIS server does not support it.
			if (typeof(errorHandler === "function")) {
				errorHandler(err);
			}
		}
	};
	
	/**
	 * If an array is a jagged-array, this function will "flatten" the array into a regular array.
	 * @author Jeff Jacobson
	 * @param {Array} array An array.
	 * @return {Array}
	 * @exception {Error} Thrown if array is not an object of type Array.
	 * @memberOf $.wsdot.elc
	 */
	function flattenArray(array) {
		var i, l, j, jl, element, array2, outArray;
		if (typeof(array) === "undefined" || array === null) {
			return array;
		}
		if (typeof(array) !== "object" || !(array instanceof Array)) {
			throw new Error("array must be an Array object.");
		}
		
		outArray = [];
		
		for (i = 0, l = array.length; i < l; i += 1) {
			element = array[i];
			array2 = null;
			if (typeof(element) === "object" && element instanceof Array) {
				array2 = flattenArray(element);
				for (j = 0, jl = array2.length; j < jl; j += 1) {
					outArray.push(array2[j]);
				}
			} else {
				outArray.push(element);
			}
		}
		
		return outArray;
	}
	
	$.wsdot.elc.flattenArray = flattenArray;
	
	/**
	 * Converts a Date object into the type of string that the ELC REST SOE methods expect.
	 * @author Jeff Jacobson
	 * @param {Date} date
	 * @return {string} A string representation of the input date, if possible, or an empty string.
	 * @memberOf $.wsdot.elc.RouteLocator
	 */
	function dateToRouteLocatorDate(date) {
		var elcdate;
		if (typeof(date) === "object" && date instanceof Date) {
			// Convert date to a string, as that is what the API is expecting.
			elcdate = [
				String(date.getActualMonth()),
				String(date.getDate()),
				String(date.getFullYear())
			].join("/");
		} else {
			elcdate = date || "";
		}
		return elcdate;
	}
	
	$.wsdot.elc.RouteLocator.dateToRouteLocatorDate = dateToRouteLocatorDate;
	

	/**
	 * Converts an array of objects to an array of equivalent {@link $.wsdot.elc.RouteLocation} objects.
	 * @param {Array} array
	 * @param {function} constructor The constructor of the class that the elements will be converted to.
	 * @exception {Error} Thrown if the array parameter is not an array.
	 * @return {Array} An array of classes corresponding to the constructor parameter.
	 * @author Jeff Jacobson
	 * @memberOf $.wsdot.elc
	 */
	function convertObjectsInArray(array, constructor) {
		var output, i, l;
		if (typeof(array) === "undefined" || array === null || typeof(array.length) !== "number") {
			throw new Error("The array parameter must actually be an Array.");
		}
		
		output = [];
		for (i = 0, l = array.length; i < l; i += 1) {
			// Note: JSLint will complain about using new with the constructor variable.
			output.push(new constructor(array[i]));
		}
		return output;
	}
	
	$.wsdot.elc.convertObjectsInArray = convertObjectsInArray;

	// Define the RouteLocation class.
	/**
	 * A class representing either a point or a segement on a WSDOT State Route. 
	 * @author Jeff Jacobson
	 * @class A class representing either a point or a segement on a WSDOT State Route.
	 * @param {object} [json] An object containing values used to initialize the RouteLocation's properties.  Properties of this object correspond to those of the {@link $.wsdot.elc.RouteLocation} class.
	 * @param {number} [json.Id] {@link $.wsdot.elc.RouteLocation#Id} 
	 * @param {string} [json.Route] {@link $.wsdot.elc.RouteLocation#Route}  
	 * @param {Decrease} [json.Decrease] {@link $.wsdot.elc.RouteLocation#Decrease} 
	 * @param {number} [json.Arm] {@link $.wsdot.elc.RouteLocation#Arm} 
	 * @param {number} [json.Srmp] {@link $.wsdot.elc.RouteLocation#Srmp} 
	 * @param {Boolean} [json.Back] {@link $.wsdot.elc.RouteLocation#Back} 
	 * @param {Date} [json.ReferenceDate] {@link $.wsdot.elc.RouteLocation#ReferenceDate} 
	 * @param {Date} [json.ResponseDate] {@link $.wsdot.elc.RouteLocation#ResponseDate} 
	 * @param {number} [json.EndArm] {@link $.wsdot.elc.RouteLocation#EndArm} Only used for line segements, not points. 
	 * @param {number} [json.EndSrmp] {@link $.wsdot.elc.RouteLocation#EndSrmp} Only used for line segements, not points. 
	 * @param {Boolean} [json.EndBack] {@link $.wsdot.elc.RouteLocation#EndBack} Only used for line segements, not points.
	 * @param {Date} [json.EndReferenceDate] {@link $.wsdot.elc.RouteLocation#EndReferenceDate} Only used for line segements, not points.
	 * @param {Date} [json.EndResponseDate] {@link $.wsdot.elc.RouteLocation#EndResponseDate} Only used for line segements, not points.
	 * @param {Date} [json.RealignmentDate] {@link $.wsdot.elc.RouteLocation#RealignmentDate} Only used for line segements, not points. You will normally never need to set this in the constructor.
	 * @param {Date} [json.EndRealignDate] {@link $.wsdot.elc.RouteLocation#EndRealignDate}  Only used for line segements, not points. You will normally never need to set this in the constructor.
	 * @param {number} [json.ArmCalcReturnCode] {@link $.wsdot.elc.RouteLocation#ArmCalcReturnCode}  You will normally never need to set this in the constructor.
	 * @param {number} [json.ArmCalcEndReturnCode] {@link $.wsdot.elc.RouteLocation#ArmCalcEndReturnCode}  Only used for line segements, not points. You will normally never need to set this in the constructor.
	 * @param {string} [json.ArmCalcReturnMessage] {@link $.wsdot.elc.RouteLocation#ArmCalcReturnMessage}  You will normally never need to set this in the constructor.
	 * @param {string} [json.ArmCalcEndReturnMessage] {@link $.wsdot.elc.RouteLocation#ArmCalcEndReturnMessage}  Only used for line segements, not points. You will normally never need to set this in the constructor.
	 * @param {string} [json.LocatingError] {@link $.wsdot.elc.RouteLocation#LocatingError}  You will normally never need to set this in the constructor.
	 * @param {Object} [json.RouteGeometry] {@link $.wsdot.elc.RouteLocation#RouteGeometry}  You will normally never need to set this in the constructor.
	 * @param {Object} [json.EventPoint] {@link $.wsdot.elc.RouteLocation#EventPoint}  You will normally never need to set this in the constructor.
	 * @param {number} [json.Distance] {@link $.wsdot.elc.RouteLocation#Distance}   You will normally never need to set this in the constructor.
	 * @param {number} [json.Angle] {@link $.wsdot.elc.RouteLocation#Angle}  You will normally never need to set this in the constructor.
	 * @property {number} Id Since the Find Nearest Route Location method does not return records for locations where it could not find any routes within the search parameters, this ID parameter can be used to indicate which source location a route location corresponds to.
	 * @property {string} Route An 3 to 11 digit state route identifier.
	 * @property {Decrease} Decrease Indicates of this location is on the Decrease LRS.  This value will be ignored if Route is a ramp.
	 * @property {number} Arm The starting measure value.
	 * @property {number} Srmp The SRMP for the start point of a route segment or the only point of a point.
	 * @property {Boolean} Back Indicates if the SRMP value is back mileage.
	 * @property {Date} ReferenceDate The date that the data was collected.
	 * @property {Date} ResponseDate The ArmCalc output date.
	 * @property {Date} RealignmentDate This is for storing ArmCalc result data of the start point.
	 * @property {number} EndArm The end measure value.  Not used when defining a point.
	 * @property {number} EndSrmp The SRMP for the end point of a route segment.  Not used when defining a point.
	 * @property {Boolean} EndBack Indicates if the EndSrmp value is back mileage.  Not used when defining a point.
	 * @property {Date} EndReferenceDate The date that the data was collected.  Not used when defining a point.
	 * @property {Date} EndResponseDate The ArmCalc output date.  Not used when defining a point.
	 * @property {Date} EndRealignDate This is for storing ArmCalc result data of the end point.  Not used when defining a point.
	 * @property {number} ArmCalcReturnCode ArmCalc return code.  See Appendix A of <a href="http://wwwi.wsdot.wa.gov/gis/roadwaydata/training/roadwaydata/pdf/PC_ArmCalc_Manual_3-19-2009.pdf">the PC ArmCalc Training Program Manual</a>.
	 * @property {number} ArmCalcEndReturnCode ArmCalc return code for end point of a route segment.  See Appendix A of <a href="http://wwwi.wsdot.wa.gov/gis/roadwaydata/training/roadwaydata/pdf/PC_ArmCalc_Manual_3-19-2009.pdf">the PC ArmCalc Training Program Manual</a>.
	 * @property {string} ArmCalcReturnMessage The error message (if any) returned by ArmCalc when converting the begin point.  If no error occurs, this will be set to an empty string by the SOE.
	 * @property {string} ArmCalcEndReturnMessage The error message (if any) returned by ArmCalc when converting the end point.  If no error occurs, this will be set to an empty string by the SOE.
	 * @property {string} LocatingError If a location cannot be found on the LRS, this value will contain a message.
	 * @property {Object} RouteGeometry An object representing either a point or a polygon.
	 * @property {Object} EventPoint When locating the nearest point along a route, this value will be set to the input point.
	 * @property {number} Distance The offset distance from the EventPoint to the RouteGeometry point.
	 * @property {number} Angle The offset angle from the EventPoint to the RouteGeometry point.
	 * @memberOf $.wsdot.elc
	 * @see Appendix A of <a href="http://wwwi.wsdot.wa.gov/gis/roadwaydata/training/roadwaydata/pdf/PC_ArmCalc_Manual_3-19-2009.pdf">PC ArmCalc Training Program Manual</a> for the meanings of ArmCalc return codes.
	 */
	function RouteLocation(json) {
		var jsonProvided = typeof(json) === "object";
		this.Id = jsonProvided && typeof(json.Id) !== "undefined" ? json.Id : null;
		this.Route = jsonProvided && typeof(json.Route) !== "undefined" ? json.Route : null;
		this.Decrease = jsonProvided && typeof(json.Decrease) !== "undefined" ? json.Decrease : null;
		
		this.Arm = jsonProvided && typeof(json.Arm) !== "undefined" ? json.Arm : null;
		this.Srmp = jsonProvided && typeof(json.Srmp) !== "undefined" ? json.Srmp : null;
		this.Back = jsonProvided && typeof(json.Back) !== "undefined" ? json.Back : null;
		this.ReferenceDate = jsonProvided && typeof(json.ReferenceDate) !== "undefined" ? json.ReferenceDate : null;
		this.ResponseDate = jsonProvided && typeof(json.ResponseDate) !== "undefined" ? json.ResponseDate : null;
		this.RealignmentDate = jsonProvided && typeof(json.RealignmentDate) !== "undefined" ? json.RealignmentDate : null;
		
		this.EndArm = jsonProvided && typeof(json.EndArm) !== "undefined" ? json.EndArm : null;
		this.EndSrmp = jsonProvided && typeof(json.EndSrmp) !== "undefined" ? json.EndSrmp : null;
		this.EndBack = jsonProvided && typeof(json.EndBack) !== "undefined" ? json.EndBack : null;
		this.EndReferenceDate = jsonProvided && typeof(json.EndReferenceDate) !== "undefined" ? json.EndReferenceDate : null;
		this.EndResponseDate = jsonProvided && typeof(json.EndResponseDate) !== "undefined" ? json.EndResponseDate : null;
		this.EndRealignDate = jsonProvided && typeof(json.EndRealignDate) !== "undefined" ? json.EndRealignDate : null;
		
		this.ArmCalcReturnCode = jsonProvided && typeof(json.ArmCalcReturnCode) !== "undefined" ? json.ArmCalcReturnCode : null;
		this.ArmCalcEndReturnCode = jsonProvided && typeof(json.ArmCalcEndReturnCode) !== "undefined" ? json.ArmCalcEndReturnCode : null;
		this.ArmCalcReturnMessage = jsonProvided && typeof(json.ArmCalcReturnMessage) !== "undefined" ? json.ArmCalcReturnMessage : null;
		this.ArmCalcEndReturnMessage = jsonProvided && typeof(json.ArmCalcEndReturnMessage) !== "undefined" ? json.ArmCalcEndReturnMessage : null;
		
		this.LocatingError = jsonProvided && typeof(json.LocatingError) !== "undefined" ? json.LocatingError : null;
		this.RouteGeometry = jsonProvided && typeof(json.RouteGeometry) !== "undefined" ? json.RouteGeometry : null;
		this.EventPoint = jsonProvided && typeof(json.EventPoint) !== "undefined" ? json.EventPoint : null;
		this.Distance = jsonProvided && typeof(json.Distance) !== "undefined" ? json.Distance : null;
		this.Angle = jsonProvided && typeof(json.Angle) !== "undefined" ? json.Angle : null;
		
		// Set the date properties to Date objects, if appropriate.
		for (var propName in this) {
			if (this.hasOwnProperty(propName)) {
				
				if (/Date$/gi.test(propName) && (typeof(this[propName]) === "string" || typeof(this[propName]) === "number")) {
					this[propName] = new Date(this[propName]);
				}
			}
		}
	}
	
	// Add the RouteLocation class to the wsdot namespace.
	$.wsdot.elc.RouteLocation = RouteLocation;
	
	/**
	 * Returns true if the RouteLocation represents a line, false otherwise.
	 * @author Jeff Jacobson
	 * @return {Boolean}
	 */
	$.wsdot.elc.RouteLocation.prototype.isLine = function () {
		return this.EndArm !== null || this.EndSrmp !== null;
	};
	
	/**
	 * Calls the ELC REST SOE to get geometry corresponding to the input locations.
	 * @author Jeff Jacobson
	 * @param {object} params The parameters for the Find Route Locations query.
	 * @param {$.wsdot.elc.RouteLocation[]} params.locations An array of RouteLocaiton objects.
	 * @param {Date} [params.referenceDate] The date that the locations were collected.  This can be omitted if each of the locations in the input array have their ReferenceDate properties set to a Date value.
	 * @param {number|string} [params.outSR] The spatial reference for the output geometry, either a WKID or WKT.  If omitted the output geometry will be the same as that of the ELC map service.
	 * @param {string} [params.lrsYear] Indicates which LRS layers will be used for linear referencing.  If omitted, the current LRS will be used. (E.g., "Current", "2008", "2005", "2005B".)
	 * @param {function} params.successHandler The function that will be called when a successful response to the corresponding ELC method is returned.  This function takes a single parameter: an array of {@link $.wsdot.elc.RouteLocation} objects.
	 * @param {function} params.errorHandler The function that will be called when the ELC method completes with an error.  This function takes parameter of type Error. 
	 * @param {boolean} [params.useCors=false] If you are sure both your client (browser) and ELC server support CORS, you can set this to true.  Otherwise leave it set to false.
	 * @throws {Error} Thrown if invalid parameters are specified.
	 */
	$.wsdot.elc.RouteLocator.prototype.findRouteLocations = function (params) {
		var locations, referenceDate, outSR, lrsYear, successHandler, errorHandler, useCors, data;
		locations = params.locations;
		// Set the reference date to an empty string if a value is not provided.  This is what the ELC REST SOE expects when omitting this value. (Hopefully this can be changed in the future.)
		referenceDate = params.referenceDate || "";
		outSR = params.outSR || null;
		lrsYear = params.lrsYear || null;
		successHandler = params.successHandler;
		errorHandler = params.errorHandler;
		useCors = params.useCors;
		
		if (typeof(locations) !== "object" || !(locations instanceof Array)) {
			throw new Error("The locations parameter must be an array of RouteLocations with at least one element.");
		} else if (!locations.length) { // locations has no elements or no length property...
			throw new Error("locations does not have enough elements.");
		}
		
		if (typeof(referenceDate) === "object" && referenceDate instanceof Date) {
			// Convert date to a string, as that is what the API is expecting.
			referenceDate = [
				String(referenceDate.getActualMonth()),
				String(referenceDate.getDate()),
				String(referenceDate.getFullYear())
			].join("/");
		}/*
		 else if (typeof(referenceDate !== "string")) {
					console.debug(typeof(referenceDate) !== "string");
					throw new Error("Unexpected referenceDate type.  Expected a Date or a string.");
		}*/
		
		
		if (typeof(outSR) !== "undefined" && outSR !== null && typeof(outSR) !== "number" && typeof(outSR) !== "string") {
			throw new Error("Unexpected outSR type.  Must be a WKID (number), WKT (string), or omitted (null or undefined).");
		}
		
		if (typeof(lrsYear) !== "undefined" && lrsYear !== null && typeof(lrsYear) !== "string") {
			throw new Error("Invalid lrsYear.  Must be either a string or omitted altogether.");
		}
		
		if (typeof(successHandler) !== "function") {
			throw new Error("No successHandler was specified.");
		}
		try {
			data = {
				f: "json",
				locations: JSON.stringify(locations),
				outSR: outSR || undefined,
				referenceDate: referenceDate,
				lrsYear: lrsYear || undefined
			};
			
			$.ajax({
				url: [this.url, this.findRouteLocationsOperationName].join("/"),
				dataType: useCors ? "json" : "jsonp",
				cache: true,
				jsonpCallback: "jsonp",
				type: "POST",
				data: data,
				success: function (data) {
					if (typeof(data.error) !== "undefined" && typeof(errorHandler === "function")) {
						errorHandler(data);
					}
					else if (typeof(successHandler === "function")) {
						successHandler(convertObjectsInArray(data, RouteLocation));
					}
				},
				error: function (error) {
					if (typeof(errorHandler === "function")) {
						errorHandler(error);
					}
				}
			});
		} catch (err) {
			// This situation could occur if you try to use CORS when either
			// the browser or GIS server does not support it.
			if (typeof(errorHandler === "function")) {
				errorHandler(err);
			}
		}
	};
	
	/**
	 * Calls the ELC REST SOE to get the route locations corresponding to the input point coordinates.
	 * @author Jeff Jacobson
	 * @param {object} params
	 * @param {number[]} params.coordinates An array of numbers with at least two elements.  Even indexed elements represent X coordinates; odd represent Y coordinates.
	 * @param {Date} [params.referenceDate] The date that the locations were collected.  This can be omitted if each of the locations in the input array have their ReferenceDate properties set to a Date value.
	 * @param {number} params.searchRadius The distance in feet to search around each of the coordinates for a state route.
	 * @param {number|string} params.inSR The spatial reference of the coordinates, either a WKID or WKT.  If omitted the output geometry will be the same as that of the ELC map service.
	 * @param {number|string} [params.outSR] The spatial reference for the output geometry, either a WKID or WKT.  If omitted the output geometry will be the same as that of the ELC map service.
	 * @param {string} [params.lrsYear] Indicates which LRS layers will be used for linear referencing.  If omitted, the current LRS will be used. (E.g., "Current", "2008", "2005", "2005B".)
	 * @param {string} [params.routeFilter] A partial SQL query that can be used to limit which routes are searched.  E.g., "LIKE '005%'" or "'005'".
	 * @param {function} params.successHandler The function that will be called when a successful response to the corresponding ELC method is returned.
	 * @param {function} [params.errorHandler] The function that will be called when the ELC method completes with an error.
	 * @param {boolean} [params.useCors=false] If you are sure both your client (browser) and ELC server support CORS, you can set this to true.  Otherwise leave it set to false.
	 * @throws {Error} Throws an error if any of the params properties are provided with invalid values. 
	 */
	$.wsdot.elc.RouteLocator.prototype.findNearestRouteLocations = function (params) {
		var elcParams = {
			f: "json"
		};
		if (typeof (params.referenceDate) === "undefined" || params.referenceDate === null) {
			throw new Error("referenceDate not provided.");
		} else {
			// Convert the date into the format that the ELC is expecting.
			elcParams.referenceDate = dateToRouteLocatorDate(params.referenceDate);
		}
		
		// validate coordinates.
		params.coordinates = flattenArray(params.coordinates); // Run the flattenArray function to ensure array elements are not arrays themselves.
		if (typeof(params.coordinates) !== "object" || !(params.coordinates instanceof Array)) {
			throw new Error("The coordinates parameter must be an array of numbers.");
		} else if (params.coordinates.length < 2 || params.coordinates.length % 2 !== 0) {
			throw new Error("The coordinates array must contain at least two elements and consist of an even number of elements.");
		}
		// Stringify the coordinates and assign to elcParams.
		elcParams.coordinates = JSON.stringify(params.coordinates);
		
		// validate search radius
		if (typeof(params.searchRadius) !== "number" || params.searchRadius <= 0) {
			throw new Error("searchRadius must be a number that is greater than zero.");
		} else {
			elcParams.searchRadius = params.searchRadius; 
		}
		
		// validate inSR.
		if (typeof(params.inSR) !== "number" && typeof(params.outSR) !== "string") {
			throw new Error("Unexpected inSR type.  The inSR value must be either a WKID (number) or a WKT (string).");
		} else {
			elcParams.inSR = params.inSR;
		}
		
		// validate outSR.
		if (typeof(params.outSR) !== "undefined" && params.outSR !== null && typeof(params.outSR) !== "number" && typeof(params.outSR) !== "string") {
			throw new Error("Unexpected outSR type.  Must be a WKID (number), WKT (string), or omitted (null or undefined).");
		} else {
			elcParams.outSR = params.outSR;
		}
		
		// validate LRS year.
		// Make sure lrsYear is either a string or omitted (null or undefined).  (The previous "if" statement has already converted from number to string, if necessary.)
		if (typeof(params.lrsYear) !== "undefined" && params.lrsYear !== null && typeof(params.lrsYear) !== "string") {
			throw new Error("Invalid lrsYear.  Must be either a string or omitted altogether.");
		} else {
			elcParams.lrsYear = params.lrsYear || undefined;
		}
		
		// validate routeFilter
		elcParams.routeFilter = params.routeFilter || undefined;
		if (typeof(params.routeFilter) !== "undefined" && typeof(params.routeFilter) !== "string") {
			throw new Error("Invalid route filter type.  The routeFilter parameter should be either a string or omitted altogether.");
		}
		
		// A success handler must be defined, otherwise calling this function is kind of pointless.
		if (typeof(params.successHandler) !== "function") {
			throw new Error("No successHandler was specified.");
		}
		
		try {
			$.ajax({
				url: [this.url, this.findNearestRouteLocationsOperationName].join("/"),
				dataType: params.useCors ? "json" : "jsonp",
				type: "POST",
				data: elcParams,
				cache: true,
				jsonpCallback: "jsonp",
				success: function (data) {
					if (typeof(data.error) !== "undefined") {
						if (typeof(params.errorHandler) === "function") {
							params.errorHandler(data.error);
						}
					} else {
						params.successHandler(convertObjectsInArray(data, RouteLocation));
					}
				},
				error: function (error) {
					if (typeof(params.errorHandler) === "function") {
						params.errorHandler(error);
					}
				}
			});
		} catch (err) {
			if (typeof(params.errorHandler) === "function") {
				params.errorHandler(err);
			}
		}
	};
	

	
	/**
	 * Converts a value into a number.  Similar to passing a value into the Number() function, except that this function will throw an error if
	 * the value cannot be converted to a number, whereas Number() will return NaN.  If null or undefined are passed in, they will also be returned.
	 * @param value A value that can be converted into a number.  If a number is passed in, the same number will be returned (unless that number is NaN).
	 * @param {string="this"} [propName] A property name that is only used when value cannot be converted to a number. 
	 * @return {number|null|undefined} If null or undefined are passed in, the same value will be returned.  Otherwise the number equivalent of "value" is returned.
	 * @throws {Error} Thrown if "value" cannot be converted into a number (and is not null or undefined).
	 */
	function toNumber(value, propName) {
		var output;
		// If a property name is not provided, set the name to "this" for the error message (if necessary).
		if (propName === null || typeof(propName) === "undefined") {
			propName = "this";
		}
		// Make sure that if ID is provided it is a number or convertable to a number.
		if (typeof(value) !== undefined && value !== null) {
			// Convert value to a number.  Something like "abc" can't be converted and will result in NaN, in which case an error is thrown.
			value = Number(value);
			if (isNaN(value)) {
				throw new Error(["If", propName, "property is provided, it must be a number."].join(" "));
			}
			output = value;
		} else if (value === null) {
			return null;
		}
		
		return output;
	}
	
	/**
	 * Converts the RouteLocation into an object that can be passed to the ELC REST SOE.  
	 * This is used internally by {@link $.wsdot.elc.RouteLocator#findRouteLocations} and {@link $.wsdot.elc.RouteLocator#findNearestRouteLocations}
	 * This method is also used when the <a href="http://www.javascriptkit.com/jsref/json.shtml">JSON.stringify</a> method is called.
	 * Note: Properties of the {@link $.wsdot.elc.RouteLocation} that have values of null will be omitted from the output of this method. 
	 * @author Jeff Jacobson
	 * @this {@link $.wsdot.elc.RouteLocation}
	 * @return {object} 
	 */
	$.wsdot.elc.RouteLocation.prototype.toJSON = function () {
		var prop, value, match, output, numFieldRe, srmpFieldRe, dateFieldRe, boolFieldRe;
		output = {};
		
		numFieldRe = /(?:Id)|(?:(?:End)?Arm)|(ReturnCode)|(Distance)|(Angle)/gi;
		srmpFieldRe = /Srmp$/gi;
		boolFieldRe = /(?:Decrease)|(Back)$/gi;
		dateFieldRe = /Date$/gi;
		
		// Loop through all of the properties in the RouteLocation and copy to the output object.
		for (prop in this) {
			if (this.hasOwnProperty(prop)) {
				value = this[prop];

				if (numFieldRe.test(prop)) { // Id, Arm, EndArm, or ...ReturnCode
					if (value !== null) {
						output[prop] = toNumber(value, prop);
					}
				} else if (srmpFieldRe.test(prop)) {
					// If the value is already a number or null, just pass it in.
					if (typeof(value) === "number" /*|| value === null*/) {
						output[prop] = value;
					} else if (typeof(value) === "string") {
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
					if (typeof(value) === "string") {
						match = routeRe.exec(this[prop]);
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
					output.Decrease = value === null ? null : Boolean(value);
				} else if (dateFieldRe.test(prop) && Boolean(value)) {
					// If a value has been provided for this date property... 
					if (value instanceof Date) {
						// Convert any date properties to strings in a format that the ELC REST SOE can handle.
						// Note that the Date.getMonth()
						output[prop] = [String(value.getActualMonth()), String(value.getDate()), String(value.getFullYear())].join("/");
					}
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


}(jQuery));
