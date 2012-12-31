/*global define, esri */
/*jslint white:true*/
define(["esri/renderer", "esri/symbol"], function () {
	"use strict";
	// This list returned from http://www.wsdot.wa.gov/Traffic/api/HighwayAlerts/HighwayAlertsREST.svc/GetEventCategoriesAsJson
	var categories, priorityValues;
	
	// Each alert category is grouped into a super-category for symbolization.
	categories = {
		"Construction": [
			"Construction",
			"Ferry",
			"Lane Closure",
			"Maintenance"
		],
		"Alert": [			"Abandoned Vehicle",
			"Alarm",
			"AMBER Alert",
			"Bridge",
			"Brush fire",
			"Cable Barrier",
			"Chain Enforcement",
			"Collision",
			"Collision fatality",
			"Complaint",
			"Dead Animal",
			"Debris",
			"Debris blocking",
			"Disabled vehicle",
			"Hazardous material",
			"Fatality or Possible Fatality",
			"Fire",
			"Flammable Restriction",
			"HCB Motor Open",
			"ITS & IT",
			"Other",
			"Pass Report",
			"Pierce Co. Roads",
			"Pierce Co. Signs/Signals",
			"Rocks",
			"Signals",
			"Signs",
			"Special Event",
			
			"",
			"Administrative",
			"Boat Traffic",
			"Bridge Lift",
			"Heavy Traffic",
			"In Service",
			"Lakewood",
			"MBT",
			"MIL",
			"ODOT",
			"Out of Service",
			"P-1 Sand / Plowing / Deicing",
			"Pedestrian",
			"Power Lines",
			"Road Report",
			"Sand / Plowing / Deicing",
			"Shift Change",
			"Toll",
			"Utilities"
		],		"Closure": [
			"Avalanche Control",
			"Bomb",
			"Bridge Closed",
			"Closure",
			"Emergency closure",
			"Pass Closure",
			
			"Rollover",
			"Multi-vehicle collision",
			"Chemical Spill",
			"Vehicle fire",
			"Medical emergency",
			"Major incident",
			"Semi Truck Involved",
			"Incident",
			"Two or more lanes closed",
			"Rock Slide",
			"Snow slide",
			
			"Hazmat",
			"HCB Closed Maint",
			"HCB Closed Marine",
			"HCB Closed Police",
			"HCB Closed Winds",
			"Slide",
			"Slides",
			"Water over Roadway",
			"Rocks - Closure",
			"Trees",
			"Hood Canal Bridge"
		],
		"Weather": [
			"Traction Advisory",
			"Weather",
			"Weather event"
		]
		// "Unclassified": [

		// ]
	};
	
	// These values are used to determine what image is used.
	priorityValues = {
		Unknown: 5,
		Lowest: 4,
		Low: 3,
		Medium: 2,
		High: 1,
		Highest: 1
	};
	
	// function getCategory(subCategory) {
		// var catName, category, currentSub, i, l, output;
		// for (catName in categories) {
			// if (categories.hasOwnProperty(catName)) {
				// category = categories[catName];
				// for (i = 0, l = category.length; i < l; i += 1) {
					// currentSub = category[i];
					// if (currentSub === subCategory) {
						// output = catName;
						// break;
					// }
				// }
				// if (output) {
					// break;
				// }
			// }
		// }
		// return output || "Alert";
	// }
	
	function createRenderer(alertImageRoot) {
		var renderer, w = 25, h = 25, fieldDelimiter = ",", imagePrefixes, ext = ".png", closureSymbol;
		
		imagePrefixes = {
			"Construction": "Flagger",
			"Alert": "AccidentAlert",
			"Closure": "RoadClosure",
			"Weather": "Weather"
		};
		
		closureSymbol = new esri.symbol.PictureMarkerSymbol(alertImageRoot + "/RoadClosure.png", w, h);
		
		renderer = new esri.renderer.UniqueValueRenderer(
			new esri.symbol.PictureMarkerSymbol(alertImageRoot + "/AccidentAlert5.png", w, h),
			"EventCategory",
			"Priority",
			null,
			fieldDelimiter
		);
		
		(function() {
			var catName, priorityName, img, symbol, subCategories, sci, scl;
			
			for (catName in categories) {
				if (categories.hasOwnProperty(catName)) {
					for (priorityName in priorityValues) {
						if (priorityValues.hasOwnProperty(priorityName)) {
							if (catName === "Closure") {
								img = null;
								symbol = closureSymbol;
							} else {
								img = [alertImageRoot, "/", imagePrefixes[catName], priorityValues[priorityName], ext].join("");
								symbol = new esri.symbol.PictureMarkerSymbol(img, w, h);
							}
							
							// Loop through the sub-categories...
							subCategories = categories[catName];
							for (sci = 0, scl = subCategories.length; sci < scl; sci += 1) {
								renderer.addValue({
									value: [subCategories[sci], priorityName].join(fieldDelimiter),
									symbol: symbol
								});
							}
						}
					}
				}
			}
		}());
		
		return renderer;
	}
	
	return {
		//categories: categories,
		//getCategory: getCategory,
		createRenderer: createRenderer
	};
});
