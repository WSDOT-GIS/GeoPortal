/*jslint devel: true, browser: true, white: true, nomen: true */
/*global dojo, dijit, dojox, esri, jQuery, Modernizr, _gaq */

/*
Copyright (c) 2011 Washington State Department of Transportation

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>
*/

/*
Prerequisites:
ArcGIS JavaScript API
jQuery
jQuery UI
jQuery BBQ plug-in (http://benalman.com/projects/jquery-bbq-plugin/)
jQuery placeholder (https://github.com/mathiasbynens/jquery-placeholder) Used as a polyfill for non-HTML5-compliant browsers.
*/


/// <reference path="http://ajax.googleapis.com/ajax/libs/dojo/1.6/dojo/dojo.xd.js"/>
/// <reference path="http://serverapi.arcgisonline.com/jsapi/arcgis/?v=2.3"/>
/// <reference path="dojo.js.uncompressed.js" />
/// <reference path="http://ajax.aspnetcdn.com/ajax/jQuery/jquery-1.6.1-vsdoc.js"/>
/// <reference path="jquery.ba-bbq.js" />
/// <reference path="json2.js" />
/// <reference path="layerList.js" />
/// <reference path="locationInfo.js" />
/// <reference path="config.js" />

var wsdot;

dojo.require("dojo.number");
dojo.require("dijit.dijit"); // optimize: load dijit layer
dojo.require("dijit.layout.BorderContainer");
dojo.require("dijit.layout.TabContainer");
dojo.require("dijit.layout.AccordionContainer");
dojo.require("dijit.layout.ContentPane");

dojo.require("dojox.layout.ExpandoPane");

dojo.require("dijit.form.RadioButton");
dojo.require("dijit.form.Select");
dojo.require("dijit.form.FilteringSelect");
dojo.require("dojo.data.ItemFileReadStore");
dojo.require("dijit.form.NumberSpinner");
dojo.require("dijit.form.DateTextBox");


dojo.require("dojo.parser");

dojo.require("esri.map");
//dojo.require("esri.virtualearth.VETiledLayer");
dojo.require("esri.dijit.BasemapGallery");
dojo.require("esri.arcgis.utils");
dojo.require("esri.dijit.Scalebar");
dojo.require("esri.tasks.geometry");
dojo.require("esri.tasks.query");
dojo.require("esri.toolbars.navigation");
dojo.require("esri.toolbars.draw");
dojo.require("esri.dijit.Legend");
dojo.require("esri.dijit.Measurement");
dojo.require("esri.tasks.gp");

dojo.require("esri.layers.FeatureLayer");
dojo.require("esri.dijit.Print");

(function ($) {
	"use strict";

	var map = null, extents = null, navToolbar, helpDialog, createLinks = {}, defaultConfigUrl = "scripts/config.js";
	wsdot = { config: {} };

	function showDisclaimer(showEvenIfAlreadyAgreed) {
		/// <summary>Shows the disclaimer dialog if the configuration contains a disclaimer.  If the dialog is shown, a jQuery object containing the dialog is returned.</summary>
		/// <param name="showEvenIfAlreadyAgreed" type="Boolean">Set this to true if you want to force the disclaimer to be shown even if there is a cookie indicating the user has already agreed.</param>
		/// <returns type="Object" />
		// Show the disclaimer if there is no cookie indicating that the user has seen it before.
		if (typeof(wsdot.config.disclaimer) !== "undefined" && (showEvenIfAlreadyAgreed || (wsdot.config.disclaimer !== null && !$.cookie("AgreedToDisclaimer")))) {
			return $("<div>" + wsdot.config.disclaimer + "<div>").dialog({
				title: "Disclaimer",
				modal: true,
				closeOnEscape: false,
				buttons: {
					"Accept": function() {
						$(this).dialog("close").dialog("destroy").remove();
					}
				},
				open: function(event, ui) {
					// Remove the close button from the disclaimer form.
					var form = $(event.target).parent();
					$("a.ui-dialog-titlebar-close", form).remove();
				},
				close: function(event, ui) {
					// Add a cookie
					$.cookie("AgreedToDisclaimer", true, {expires: 30});
					$(this).dialog("destroy").remove();
				}
			});
		}
	}

	function doPostConfig() {
		// Add support for JSON.
		Modernizr.load([
			{
				test: window.JSON,
				nope: "scripts/json2.js"
			},
			{
				test: Modernizr.input.placeholder,
				nope: "scripts/jquery.placeholder.min.js"
			}
		]);

		showDisclaimer();

		// Add a method to the Date object that will return a short date string.
		if (typeof (Date.toShortDateString) === "undefined") {
			Date.prototype.toShortDateString = function () {
				/// <summary>Returns a string representation of the date in the format Month-Date-Year.</summary>
				return String(this.getMonth()) + "-" + String(this.getDate()) + "-" + String(this.getFullYear());
			};
		}

		// Enable the Date.toISOString method if browser does not support it.
		// Copied from https://github.com/kriskowal/es5-shim/
		// ES5 15.9.5.43
		// http://es5.github.com/#x15.9.5.43
		// This function returns a String value represent the instance in time
		// represented by this Date object. The format of the String is the Date Time
		// string format defined in 15.9.1.15. All fields are present in the String.
		// The time zone is always UTC, denoted by the suffix Z. If the time value of
		// this object is not a finite Number a RangeError exception is thrown.
		if (!Date.prototype.toISOString || (new Date(-62198755200000).toISOString().indexOf('-000001') === -1)) {
			Date.prototype.toISOString = function toISOString() {
				var result, length, value, year;
				if (!isFinite(this)) {
					throw new RangeError("Date.prototype.toISOString called on non-finite value.");
				}

				// the date time string format is specified in 15.9.1.15.
				result = [this.getUTCMonth() + 1, this.getUTCDate(),
					this.getUTCHours(), this.getUTCMinutes(), this.getUTCSeconds()];
				year = this.getUTCFullYear();
				year = (year < 0 ? '-' : (year > 9999 ? '+' : '')) + ('00000' + Math.abs(year)).slice(0 <= year && year <= 9999 ? -4 : -6);

				length = result.length;
				while (length--) {
					value = result[length];
					// pad months, days, hours, minutes, and seconds to have two digits.
					if (value < 10) {
						result[length] = "0" + value;
					}
				}
				// pad milliseconds to have three digits.
				return year + "-" + result.slice(0, 2).join("-") + "T" + result.slice(2).join(":") + "." +
					("000" + this.getUTCMilliseconds()).slice(-3) + "Z";
			};
		}

		$(document).ready(function () {
			var qs = $.deparam.querystring();
			
			// If the "tree" query string parameter is set to true, replace the stylesheet for the layer list.
			if (qs.tree && !/false/.test(qs.tree)) {
				$("link[href='style/layerList.css']").attr("href", "style/layerListPlusMinus.css");
			}
			

			$("#mainContainer").css("display", "");

			// If a title is specified in the config file, replace the page title.
			if (wsdot.config.pageTitle) {
				$(".page-title").empty().text(wsdot.config.pageTitle);
				document.title = wsdot.config.pageTitle;
			}

			////// Show a warning for old versions of IE.
			////if (dojo.isIE && dojo.isIE < 9) {
			////    var slowDialog = $("<div>");
			////    $("<img>").attr("src", "images/turtle.png").css("width", "64px").css("height", "92px").css("float", "left").appendTo(slowDialog);
			////    $("<p>").text("You are using Internet Explorer " + String(dojo.isIE) + ".").appendTo(slowDialog);
			////    $("<p>").text("This is an old browser that runs JavaScript very, very slowly.  As this is a very JavaScript intensive site, you will get much better performance if you use a modern web browser.").appendTo(slowDialog);
			////    var list = $("<ul>").appendTo(slowDialog);
			////    $("<li>").append($("<a>").attr("href", "http://www.firefox.com/").text("Mozilla Firefox")).appendTo(list);
			////    $("<li>").append($("<a>").attr("href", "http://www.google.com/chrome/").text("Google Chrome")).appendTo(list);
			////    $("<li>").append($("<a>").attr("href", "http://www.apple.com/safari/").text("Apple Safari")).appendTo(list);
			////    if (dojo.isIE > 7) {
			////        $("<li>").append($("<a>").attr("href", "http://www.microsoft.com/windows/internet-explorer/").text("Internet Explorer 9 or higher (Windows 7 or higher only)")).appendTo(list);
			////    }
			////    slowDialog.dialog({
			////        title: "Warning: IE is slow",
			////        buttons: {
			////            "OK": function () {
			////                $(this).dialog("close");
			////            }
			////        },
			////        close: function () {
			////            $(this).dialog("destroy").remove();
			////        }
			////    });
			////}

		});
		//if (!dojo.isIE || dojo.isIE >= 9) {
		//    dojo.require("esri.dijit.Bookmarks");
		//}

		dojo.extend(esri.geometry.Extent, {
			"toCsv": function () {
				var propNames = ["xmin", "ymin", "xmax", "ymax"],
					output = "",
					i, l;
				for (i = 0, l = propNames.length; i < l; i += 1) {
					if (i > 0) {
						output += ",";
					}
					output += this[propNames[i]];
				}
				return output;
			}
		});

		dojo.extend(esri.layers.GraphicsLayer, {
			"getGraphicsAsJson": function () {
				/// <summary>Returns an array of ArcGIS Server JSON graphics.</summary>
				return dojo.map(this.graphics, function (item) {
					// TODO: Make the projection to geographic optional.  For the purposes of this application, though, this works just fine.
					var geometry = esri.geometry.webMercatorToGeographic(item.geometry),
						json = item.toJson();
					json.geometry = geometry.toJson();
					return json;
				});
			}
		});

		dojo.extend(esri.Map, {
			"lods": null,
			"getLOD": function (level) {
				/// <summary>Gets the current level of detail (LOD) for the map.</summary>
				/// <param name="level" type="Number">Optional.  If you know the current LOD ID, you can input it here.  Otherwise the esri.Map.getLevel() method will be called to get this value.</param>
				/// <returns type="esri.layers.LOD" />
				if (typeof (level) === "undefined") {
					level = map.getLevel();
				}
				return map.lods[level];
			},
			"getScale": function (level) {
				/// <summary>Returns the current scale of the map.</summary>
				/// <param name="level" type="Number">Optional.  If you know the current LOD ID, you can input it here.  Otherwise the esri.Map.getLevel() method will be called to get this value.</param>
				/// <returns type="Number" />
				var lod = this.getLOD(level);
				if (lod) {
					return lod.scale;
				}
				else {
					return null;
				}
			},
			"getVisibleLayers": function () {
				/// <summary>Returns an array of all of the layers in the map that are currently visible.</summary>
				/// <returns type="Array" />
				var layer,
					visibleLayers = [],
					i, l;
				for (i = 0, l = this.layerIds.length; i < l; i += 1) {
					layer = this.getLayer(this.layerIds[i]);
					if (layer.visible === true && (typeof (layer.wsdotCategory) === "undefined" || layer.wsdotCategory !== "Basemap")) {
						visibleLayers.push(layer);
					}
				}
				return visibleLayers;
			},
			"getGraphicsLayers": function () {
				/// <summary>Returns all graphics layers in the map.</summary>
				var gfxLayers = [],
					layer, id,
					i;
				for (i = 0; i < this.graphicsLayerIds.length; i += 1) {
					id = this.graphicsLayerIds[i];
					layer = this.getLayer(id);
					if (layer.isInstanceOf(esri.layers.GraphicsLayer) && !layer.isInstanceOf(esri.layers.FeatureLayer)) {
						gfxLayers.push(layer);
					}
				}
				return gfxLayers;

			},
			"getGraphicsCount": function () {
				/// <summary>Returns the total number of graphics displayed on the map (in all graphics layers).</summary>
				var graphicsLayers = this.getGraphicsLayers(),
					output = 0;

				// For each layer, get a collection of JSON graphic representations
				dojo.forEach(graphicsLayers, function (layer /*, layerIndex*/) {
					output += layer.graphics.length;
				});
				return output;
			},
			"getGraphicsAsJson": function (options) {
				/// <summary>Returns all of the graphics in all of the graphics layers in the map.</summary>
				var graphicsLayers = this.getGraphicsLayers(),
					output = {};

				// Set default values for omitted options.
				if (typeof (options) === "undefined") {
					options = {
						removeInfoTemplate: true,
						removeSymbol: true
					};
				}
				if (typeof (options.removeInfoTemplate) === "undefined") {
					options.removeInfoTemplate = true;
				}
				if (typeof (options.removeSymbol) === "undefined") {
					options.removeSymbol = true;
				}

				// For each layer, get a collection of JSON graphic representations
				dojo.forEach(graphicsLayers, function (layer /*, layerIndex*/) {
					var graphics;
					if (layer.graphics.length > 0) {
						graphics = layer.getGraphicsAsJson();
						if (options.removeInfoTemplate === true || options.removeSymbol === true) {
							// Remove unwanted properties from each graphic representation as specified in the options object.
							dojo.forEach(graphics, function (graphic /*, gIndex*/) {
								if (typeof (graphic.infoTemplate) !== "undefined" && options.removeInfoTemplate === true) {
									delete graphic.infoTemplate;
								}
								if (typeof (graphic.symbol) !== "undefined" && options.removeSymbol === true) {
									delete graphic.symbol;
								}
							});
						}
						output[layer.id] = graphics;
					}
				});
				return output;
			}
		});





		function getExtentLink() {
			/// <summary>Sets the extent link in the bookmark tab to the given extent and visible layers.</summary>
			var layers, qsParams;
			// Get the current query string parameters.
			qsParams = $.deparam.querystring(true);
			// Set the extent to the current extent.
			qsParams.extent = map.extent.toCsv();

			layers = $.map(map.getVisibleLayers(), function (layer) {
				return layer.id;
				// return [layer.id, String(layer.opacity)].join(":");
			});

			if (layers) {
				qsParams.layers = layers.join(",");
			}

			// TODO: Add support for setting each layer's opacity in the query string.
			////$(map.getVisibleLayers()).each(function (index, layer) {
			////    if (index === 0) {
			////        qsParams.layers = String(layer.id) + ":" + String(Math.round(layer.opacity * 100) / 100);
			////    }
			////    else {
			////        qsParams.layers += "," + String(layer.id) + ":" + String(Math.round(layer.opacity * 100) / 100);
			////    }
			////});

			return $.param.querystring(window.location.protocol + "//" + window.location.host + window.location.pathname, qsParams);
		}

		function showHelpDialog(helpUrl) {
			/// <summary>Opens the help dialog and adds content from the given URL.</summary>
			/// <param name="helpUrl" type="String">The URL that containts the content that will be shown in the help dialog.</param>
			var helpContent;
			// If the URL is a PDF, open in a separate window; otherwise open in a jQueryUI dialog.
			if (/\.pdf$/.test(helpUrl)) {
				window.open(helpUrl);
			} else {
				if (!helpDialog) {
					// Create the help dialog if it does not already exist.
					helpDialog = $("<div>").attr("id", "helpDialog").dialog({ autoOpen: false, title: "Help", height: 480 });
					helpContent = $("<div>").attr("id", "helpContent").appendTo(helpDialog);
				}
				else {
					// Clear the contents
					helpContent = $("#helpContent").empty();
				}

				helpDialog.dialog("open");

				// Load the content from the specified URL into the help dialog.
				helpContent.load(helpUrl, function (responseText, textStatus /*, XMLHttpRequest*/) {
					// Handle case where content could not be loaded.
					if (!textStatus.match(/(?:success)|(?:notmodified)/i)) {
						helpContent.text("Error loading help text.");
					}

					// Add disclaimer link (if applicable)
					if (wsdot.config.disclaimer) {
						$("<p class='disclaimer'><a>Disclaimer</a></p>").click(function(){showDisclaimer(true);}).prependTo(helpContent);
					}
				});
			}


		}


		function init() {
			var refreshLegend, gaTrackEvent, initBasemap = null;
			esri.config.defaults.io.proxyUrl = "proxy.ashx";
			esri.config.defaults.geometryService = new esri.tasks.GeometryService(wsdot.config.geometryServer);

			// Opera doesn't display the zoom slider correctly.  This will make it look better.
			// For more info see http://forums.arcgis.com/threads/24687-Scale-Slider-on-Opera-11.0.1
			if (dojo.isOpera) {
				esri.config.defaults.map.sliderLabel = { labels: ["state", "county", "city"], tick: 0 };
			}

			function setupNorthArrow() {
				// Create the north arrow.
				dojo.create("img", { id: "northArrow", src: "images/NorthArrow.png", alt: "North Arrow" }, "map_root", "last");
			}

			function setupToolbar() {
				dijit.form.Button({
					iconClass: "helpIcon",
					showLabel: false,
					onClick: function () {
						// window.open("help/default.html", "GRDO Map Help");
						showHelpDialog(wsdot.config.helpUrl); //"help/navigation.html");
					}
				}, "helpButton");


				dijit.form.Button({
					iconClass: "starIcon",
					showLabel: false,
					onClick: function () {
						/// <summary>Show a dialog with a link to the application, containing query string parameters with the current extent and layers.</summary>
						var linkDialog = $("#linkDialog");
						// Create the link dialog if it does not already exist.
						if (linkDialog.length === 0) {
							linkDialog = $("<div>").attr("id", "linkDialog").dialog({
								"autoOpen": true,
								"modal": true,
								"title": "Share",
								"open": function () {
									var url = getExtentLink();
									$("<p>").text("This link can be used to open this application, zoomed to the current extent, and with the current layers selected.").appendTo(this);
									$("<input>").attr({
										type: "url",
										value: url,
										readonly: "readonly"
									}).css("width", "100%").appendTo(this).select();
								},
								"close": function () {
									// Remove the dialog from the DOM.
									$(this).dialog("destroy").remove();
								}
							});
						}

					}
				}, "linkButton");

				// TODO: Make drop-down button instead of popping up a dialog.
				dijit.form.Button({
					label: "Export Graphics",
					showLabel: false,
					iconClass: "exportIcon",
					onClick: function () {
						var form, formatSelect, exportDialog = $("#exportDialog");

						// Create the export dialog if it does not already exist.
						if (exportDialog.length < 1) {
							exportDialog = $("<div>").attr("id", "exportDialog").dialog({
								autoOpen: false,
								title: "Save Graphics",
								modal: true,
								close: function () {
									// Remove the value from the hidden input element named "graphics".
									$("input[name=graphics]", this).attr("value", null);
								},
								open: function () {
									var graphics;
									// Show / hide the form and "no graphics" message based on the number of graphics in the map.
									if (map.getGraphicsCount() < 1) {
										$(".no-graphics-message", exportDialog).show();
										$("form", exportDialog).hide();
									} else {
										graphics = map.getGraphicsAsJson();

										// Set the hidden graphics element's value.
										$("input[name=graphics]", exportDialog).attr("value", JSON.stringify(graphics));

										$(".no-graphics-message", exportDialog).hide();
										$("form", exportDialog).show();
									}

								}
							});
							// Create the message that will appear when this form is opened but the user has no graphics in their map.  This message will be hidden initially.
							$("<p>").addClass("no-graphics-message").text("You do not currently have any graphics in your map to export.").appendTo(exportDialog).hide();
							// Create a form that will open its submit action in a new window.
							form = $("<form>").attr("action", "GraphicExport.ashx").attr("method", "post").attr("target", "_blank").appendTo(exportDialog);

							$("<label>").attr("for", "graphic-export-format").text("Select an export format:").appendTo(form);
							formatSelect = $("<select>").attr("name", 'f').attr("id", 'graphic-export-format').appendTo(form);

							// Populate the output format select element with options.
							$([["kml", "KML"], ["kmz", "KMZ"], ["json", "JSON"]]).each(function (index, element) {
								$("<option>").attr("value", element[0]).text(element[1]).appendTo(formatSelect);
							});

							// This hidden element will hold the graphics information while the dialog is opened.
							$("<input>").attr("type", "hidden").attr("name", "graphics").appendTo(form);

							// Create the submit button and convert it to a jQueryUI button.
							$("<button>").css("display", "block").attr("type", "submit").text("Export").appendTo(form).button();

							// The submit button doesn't work in IE without doing the following for some reason.
							if (dojo.isIE) {
								$("button", form).click(function () {
									form.submit();
								});
							}
						}

						// Show the export dialog
						exportDialog.dialog("open");
					}
				}, dojo.create("button", { id: "saveButton" }, "toolbar", "first"));

				dijit.form.Button({
					label: "Arrange Layers",
					showLabel: false,
					iconClass: "sortIcon",
					onClick: function() {
						var layerSorter = $("#layerSorter");
						// Create the layer sorter dialog if it does not already exist.
						if (layerSorter.length < 1) {
							layerSorter = $("<div id='layerSorter'>").layerSorter({map:map}).dialog({
								title: "Arrange Layers",
								autoOpen: false
							});
						}
						layerSorter.dialog("open");
					}
				}, "sortButton");

				dijit.form.Button({
					label: "Measure",
					showLabel: false,
					iconClass: "distanceIcon",
					onClick: function () {
						// Disable the identify popups while the measure dialog is active.
						map.disablePopups();
						var measureDialog = $("#measureWidgetContainer"),
						titleBar;

						function hideMeasureWidget() {
							// Hide the dialog and disable all of the tools.
							var measureWidget = dijit.byId("measureWidget");
							measureWidget.clearResult();
							dojo.forEach(["area", "distance", "location"], function (toolName) {
								measureWidget.setTool(toolName, false);
							});
							measureDialog.hide();
							$("#measureWidgetContainer").hide();
							// Re-enable the identify popups.
							map.enablePopups();
						}

						// Create the measure dialog if it does not already exist.
						if (!measureDialog || measureDialog.length < 1) {
							// Create the dialog.
							measureDialog = $("<div>").attr("id", "measureWidgetContainer").appendTo($("#mapContentPane")).draggable().addClass("ui-widget").addClass("ui-dialog ui-widget ui-widget-content ui-corner");
							titleBar = $("<div>").attr("class", "ui-dialog-titlebar ui-widget-header ui-corner-all ui-helper-clearfix").appendTo(measureDialog);
							$("<span>").attr("id", "ui-dialog-title-dialog").addClass("ui-dialog-title").text("Measure").appendTo(titleBar);
							$("<a>").text("?").addClass("ui-corner-all").appendTo(titleBar).css("position", "absolute").css({
								right: "2.5em",
								"text-decoration": "none",
								cursor: "pointer"
							}).click(function () { showHelpDialog("help/measure.html"); });
							$("<a>").addClass("ui-dialog-titlebar-close ui-corner-all").attr("href", "#").append($('<span>').addClass("ui-icon ui-icon-closethick").text("close")).appendTo(titleBar).click(hideMeasureWidget);
							$("<div>").attr("id", "measureWidget").appendTo(measureDialog);
							// Create the widget.
							esri.dijit.Measurement({ map: map }, dojo.byId("measureWidget")).startup();
						} else {
							// If the dialog already exists, toggle its visibility.
							measureDialog = $("#measureWidgetContainer:visible");

							if (measureDialog && measureDialog.length > 0) {
								hideMeasureWidget();
							}
							else {
								// Show the dialog.
								$("#measureWidgetContainer").show();
							}
						}
					}
				}, "measureButton");

				function setupPrinter(resp) {
					/// <summary>Setup the print widget</summary>
					var layoutTemplate, templateNames, mapOnlyIndex, templates, printer;

					layoutTemplate = dojo.filter(resp.parameters, function(param, idx) {
						return param.name === "Layout_Template";
					});

					if (layoutTemplate.length === 0) {
						console.log("print service parameters name for templates must be \"Layout_Template\"");
						return;
					}
					templateNames = layoutTemplate[0].choiceList;

					// remove the MAP_ONLY template then add it to the end of the list of templates
					mapOnlyIndex = dojo.indexOf(templateNames, "MAP_ONLY");
					if ( mapOnlyIndex > -1 ) {
						var mapOnly = templateNames.splice(mapOnlyIndex, mapOnlyIndex + 1)[0];
						templateNames.push(mapOnly);
					}

					// create a print template for each choice
					templates = dojo.map(templateNames, function(ch) {
						var plate = new esri.tasks.PrintTemplate();
						plate.layout = plate.label = ch;
						plate.format = "PDF";
						plate.layoutOptions = {
							//"authorText": "May by:  Esri's JS API Team",
							//"copyrightText": "<copyright info here>",
							//"legendLayers": [],
							//"titleText": "Pool Permits",
							"titleText": "Airport",
							"scalebarUnit": "Miles"
						};
						return plate;
					});

					$("<div id='printButton'>").appendTo("#toolbar");
					printer = esri.dijit.Print({
						map: map,
						templates: templates,
						url: wsdot.config.printUrl
					}, dojo.byId("printButton"));

					printer.startup();
				}

				// If a print URL has been specified, add the print widget.
				if (wsdot.config.printUrl) {
					// get print templates from the export web map task
					var printInfo = esri.request({
						"url": wsdot.config.printUrl,
						"content": { "f": "json" }
					});
					printInfo.then(setupPrinter, function(error) {
						console.error(error);
					});
				}
			}

			function isBasemap(layerId) {
				/// <summary>Examines a layer ID and determines if it is a basemap.</summary>
				var basemapLayerIdRe = /layer(?:(?:\d+)|(?:_osm)|(?:_bing))/i;
				if (layerId.match(basemapLayerIdRe)) {
					return true;
				} else {
					return false;
				}
			}

			function getLayerInfos() {
				var layerIds, layerInfos;
				// Filter out basemap layers
				layerIds = $.grep(map.layerIds, isBasemap, true);

				// Add the graphics layers to the array of layer IDs.
				$.merge(layerIds, map.graphicsLayerIds);

				// Create layer info objects from the layer IDs, to be used with the Legend constructor.
				layerInfos = $.map(layerIds, function (layerId) {
					var layer = map.getLayer(layerId);
					return { layer: layer, title: layerId };
				});

				return layerInfos;
			}

			refreshLegend = function (layer, error) {
			/// <summary>Refreshes the legend using the layers currently in the map that are not basemap layers.</summary>
				var layerInfos;
				if (!layer || error) {
					return;
				}

				layerInfos = getLayerInfos();

				
				if (!isBasemap(layer.id) && typeof(this.isInstanceOf === "function") && this.isInstanceOf(esri.dijit.Legend)) {
					this.refresh(layerInfos);
				}
			};

			gaTrackEvent = function(layer, error) {
				/// <summary>Adds a Google Analytics tracking event for the addition of a layer to the map.</summary>
				var label, basemapIdRe = /^layer\d+$/i;

				label = basemapIdRe.exec(layer.id) ? "Basemap: " + layer.url :  layer.id + ": " + layer.url;

				if (error) {
					_gaq.push(['_trackEvent', 'Layers', 'Add - Fail', label]);
				} else {
					_gaq.push(['_trackEvent', 'Layers', 'Add', label]);
				}
			};



			function setupDefaultLegend() {
				/// <summary>Creates the legend control</summary>
				var legend, layerInfos;

				layerInfos = getLayerInfos();

				legend = dijit.byId("legend");

				// Create the legend dijit if it does not already exist.
				if (!legend) {
					legend = new esri.dijit.Legend({ 
						map: map, 
						layerInfos: layerInfos 
					}, "legend");
					legend.startup();
				}

				// Set the legend to refresh when a new layer is added to the map.
				dojo.connect(map, "onLayerAddResult", legend, refreshLegend);
			}

			function setupLegend() {
				if (typeof(wsdot.config.customLegend) === "object") {
					var basemapGallery = dijit.byId("basemapGallery");
					if (basemapGallery) {
						wsdot.config.customLegend.basemapGallery = basemapGallery;
					}
					$("#legend").customLegend(
						wsdot.config.customLegend
					);
				} else {
					setupDefaultLegend();
				}
			}

			function setupLayout() {
				var mainContainer, mapControlsPane, tabs, toolsTab, toolsAccordion, zoomControlsDiv;
				mainContainer = new dijit.layout.BorderContainer({ design: "headline", gutters: false }, "mainContainer");
				mainContainer.addChild(new dijit.layout.ContentPane({ region: "top" }, "headerPane"));
				mainContainer.addChild(new dijit.layout.ContentPane({ region: "center" }, "mapContentPane"));

				mapControlsPane = new dojox.layout.ExpandoPane({ region: "leading", splitter: true, title: "Map Controls" }, "mapControlsPane");
				tabs = new dijit.layout.TabContainer(null, "tabs");
				tabs.addChild(new dijit.layout.ContentPane({ title: "Layers", id: "layersTab" }, "layersTab"));
				tabs.addChild(new dijit.layout.ContentPane({ title: "Legend", onShow:  setupLegend }, "legendTab"));
				tabs.addChild(new dijit.layout.ContentPane({ title: "Basemap", id: "basemapTab" }, "basemapTab"));
				toolsTab = new dijit.layout.ContentPane({ title: "Tools" }, "toolsTab");
				tabs.addChild(toolsTab);
				toolsAccordion = new dijit.layout.AccordionContainer(null, "toolsAccordion");

				function setupLrsControls() {
					// LRS Tools
					toolsAccordion.addChild(new dijit.layout.ContentPane({ title: "Milepost", id: "lrsTools" }, dojo.create("div", { id: "lrsTools" }, "toolsAccordion")));
					createLinks.milepostTab = dojo.connect(dijit.byId("lrsTools"), "onShow", function () {
						$.getScript("scripts/lrsTools.js", function () {
							$("#lrsTools").lrsTools({
								map: map,
								controlsCreated: function () {
									// Add help button to the LrsTools control.
									dijit.form.Button({
										label: "Milepost Help",
										iconClass: "helpIcon",
										showLabel: false,
										onClick: function () {
											showHelpDialog("help/milepost.html");
										}
									}, dojo.create("button", { type: "button" }, "milepostContainerBottom"));
								},
								drawActivate: function () {
									map.disablePopups();
								},
								drawDeactivate: function () {
									map.enablePopups();
								}
							});

						});

						dojo.disconnect(createLinks.milepostTab);
						delete createLinks.milepostTab;
					});
				}

				function setupZoomControls() {
					// Zoom tools
					$("<div>").attr({ id: "zoomControlsPane" }).appendTo("#toolsAccordion");

					toolsAccordion.addChild(new dijit.layout.ContentPane({ title: "Zoom to" }, "zoomControlsPane"));
					createLinks.zoomControls = dojo.connect(dijit.byId("zoomControlsPane"), "onShow", function () {
						var extentTable;
						zoomControlsDiv = $("<div>").attr({ id: "zoomControls" }).appendTo("#zoomControlsPane");

						$("<button>").attr({ id: "zoomToMyCurrentLocation", type: "button" }).text("Zoom to my current location").appendTo(zoomControlsDiv);

						$("<div class='tool-header'>Zoom to XY</div>").appendTo(zoomControlsDiv);
						$("<div id='zoomToXY'>").appendTo(zoomControlsDiv).zoomToXY({
							map: map
						});

						extentTable = $("<table>").appendTo(zoomControlsDiv);
					
						$.getScript("scripts/extentSelect.js", function (data, textScatus) {
							function createQueryTask(qtName) {
								/// <summary>Creates a query task and query using settings from config.js.</summary>
								/// <param name="qtName" type="String">The name of a query task from config.js.</param>
								var queryTaskSetting, qt, query, n;
								queryTaskSetting = wsdot.config.queryTasks[qtName];
								qt = new esri.tasks.QueryTask(queryTaskSetting.url);
								query = new esri.tasks.Query();
												
								for (n in queryTaskSetting.query) {
									if (queryTaskSetting.query.hasOwnProperty(n)) {
										query[n] = queryTaskSetting.query[n];
									}
								}
								return { "task": qt, "query": query };
							}

							// Set up the zoom select boxes.
							// Setup the zoom controls.
							function createZoomControls() {
								/// <summary>Creates the HTML elments that will later be used to create Dojo dijits.</summary>

								var table, body, data, row, cell;

								function createZoomControl(qtName, data) {
									var row, cell, selectName, labelName, queryTask;
									row = $("<tr>").appendTo(body);
									cell = $("<td>").appendTo(row);
									selectName = qtName + "ZoomSelect";
									labelName = qtName + "ZoomLabel";
									$("<label>").attr({ id: labelName }).text(data.label).appendTo(cell);
									cell = $("<td>").appendTo(row);
									if (data.url) {
										$("<img>").attr({ id: selectName, src: "images/ajax-loader.gif", alt: "Loading..." }).appendTo(cell);
										queryTask = createQueryTask(qtName);
										queryTask.task.execute(queryTask.query, function(featureSet) {
											$("#" + selectName).extentSelect(featureSet, map, data.levelOrFactor);
										});
									} else if (data.extents) {
										$("<div>").attr("id", selectName).appendTo(cell).extentSelect(data.extents, map);
										dojo.attr(labelName, "for", selectName);
									}
								}

								body = $("<tbody>").appendTo(extentTable);

								for (var qtName in wsdot.config.queryTasks) {
									if (wsdot.config.queryTasks.hasOwnProperty(qtName)) {
										data = wsdot.config.queryTasks[qtName];
										createZoomControl(qtName, data);
									}
								}
							}

							createZoomControls();
						});

						if (navigator.geolocation) {
							dijit.form.Button({
								onClick: function () {
									navigator.geolocation.getCurrentPosition(function (position) {
										var pt, attributes;
										pt = new esri.geometry.Point(position.coords.longitude, position.coords.latitude);
										pt = esri.geometry.geographicToWebMercator(pt);
										attributes = { lat: position.coords.latitude.toFixed(6), long: position.coords.longitude.toFixed(6) };
										map.infoWindow.setTitle("You are here").setContent(esri.substitute(attributes, "Lat: ${lat} <br />Long: ${long}")).show(map.toScreen(pt));
										map.centerAndZoom(pt, 8);
									}, function (error) {
										var message = "", strErrorCode;
										// Check for known errors
										switch (error.code) {
											case error.PERMISSION_DENIED:
												message = "This website does not have permission to use the Geolocation API";
												break;
											case error.POSITION_UNAVAILABLE:
												message = "The current position could not be determined.";
												break;
											case error.PERMISSION_DENIED_TIMEOUT:
												message = "The current position could not be determined within the specified timeout period.";
												break;
										}

									// If it's an unknown error, build a message that includes 
									// information that helps identify the situation so that 
									// the error handler can be updated.
									if (message === "") {
										strErrorCode = error.code.toString();
										message = "The position could not be determined due to an unknown error (Code: " + strErrorCode + ").";
									}
									alert(message);
								}, {
									maximumAge: 0,
									timeout: 30000,
									enableHighAccuracy: true
								});
							}
						}, "zoomToMyCurrentLocation");
					} else {
							dojo.destroy("zoomToMyCurrentLocation");
						}

						// Add the help button for the zoom controls.
						dijit.form.Button({
							label: "Zoom Help",
							showLabel: false,
							iconClass: "helpIcon",
							onClick: function () {
								showHelpDialog("help/zoom_controls.html");
							}
						}, dojo.create("button", { id: "zoomHelp", type: "button" }, "zoomControls"));

						dojo.disconnect(createLinks.zoomControls);
						delete createLinks.zoomControls;
					});
				}

				function setupSearchControls() {
					// Address Search
					toolsAccordion.addChild(new dijit.layout.ContentPane({ title: "Find an Address" }, dojo.create("div", { id: "searchTools" }, "toolsAccordion")));
					createLinks.search = dojo.connect(dijit.byId("searchTools"), "onShow", function () {
						$.getScript("scripts/addressLocator.js", function (data, textStatus) {
							$("<div>").attr("id", "searchControl").appendTo("#searchTools").addressLocator({
								map: map,
								addressLocator: "http://tasks.arcgisonline.com/ArcGIS/rest/services/Locators/TA_Streets_US_10/GeocodeServer"
							});
							dojo.disconnect(createLinks.search);
							delete createLinks.search;
						});
					});
				}

				// Look in the configuration to determine which tools to add and in which order.
				(function(tools){
					var i, l;
					// Setup a default value for tools if it hasn't been specified.
					if (!tools)  {
						tools = ["lrs", "zoom", "search"];
					}
					for (i = 0, l = tools.length; i < l; i++) {
						if (/zoom/i.test(tools[i])) {
							setupZoomControls();
						} else if (/lrs/i.test(tools[i])) {
							setupLrsControls();
						} else if (/search/i.test(tools[i])) {
							setupSearchControls();
						}
					}
				}(wsdot.config.tools));



				createLinks.basemapTab = dojo.connect(dijit.byId("basemapTab"), "onShow", function () {
					var basemaps = wsdot.config.basemaps, i, l, layeri, basemapGallery, customLegend;

					for (i = 0, l = basemaps.length; i < l; i += 1) {
						for (layeri in basemaps.layers) {
							if (basemaps.layers.hasOwnProperty(layeri)) {
								basemaps.layers[layeri] = new esri.dijit.BasemapLayer(basemaps.layers[layeri]);
							}
						}
					}

					basemapGallery = new esri.dijit.BasemapGallery({
						showArcGISBasemaps: true,
						bingMapsKey: 'Ap354free_qMBNCGXm35cv8DSmG06nLNYm1skZwgrC4Xr1VCQ5UDojZ_BKDFkD5s',
						map: map,
						basemaps: basemaps
					}, "basemapGallery");

					basemapGallery.startup();

					// Remove the unwanted default basemaps as defined in config.js (if any are defined).
					if (wsdot.config.basemapsToRemove) {
						dojo.connect(basemapGallery, "onLoad", wsdot.config.basemapsToRemove, function () {
							var i, removed;
							for (i = 0; i < this.length; i += 1) {
								removed = basemapGallery.remove(this[i]);
								if (console && console.warn) {
									if (removed === null) {
										console.warn("Basemap removal failed: basemap not found: " + this[i]);
									}
								}
							}
						});
					}

					/*
					// Uncomment this section if you need to find a basemap's ID.
					// Recomment before publishing.
					dojo.connect(basemapGallery, "onSelectionChange", function () {
						console.log("Selected basemap is " + basemapGallery.getSelected().id + ".");
					});
					*/



					dojo.connect(basemapGallery, "onError", function (msg) {
						// Show error message
						alert(msg);
					});

					dojo.disconnect(createLinks.basemapTab);
					delete createLinks.basemapTab;


					// Check for an existing customLegend
					customLegend = $("#legend").data("customLegend");
					if (customLegend) {
						customLegend.setBasemapGallery(basemapGallery);
					}
				});


				mapControlsPane.addChild(tabs);
				mainContainer.addChild(mapControlsPane);

				mainContainer.startup();
			}

			function setScaleLabel(level) {
				// Set the scale.
				var scale = map.getScale(level);
				if (typeof (scale) === "undefined" || scale === null) {
					$("#scaleText").text("");
				}
				else {
					$("#scaleText").text("1:" + dojo.number.format(scale, {
						round: 0,
						places: 0
					}));
				}

			}

			setupLayout();

			function setupExtents() {
				var extentSpatialReference = new esri.SpatialReference({wkid: 102100});
				// Define zoom extents for menu.
				extents = {
					fullExtent: new esri.geometry.Extent({ "xmin": -14058520.2360666, "ymin": 5539437.0343901999, "ymax": 6499798.1008670302, "xmax": -12822768.6769759, "spatialReference": extentSpatialReference })
				};
			}

			setupExtents();

			// Convert the extent definition in the options into an esri.geometry.Extent object.
			wsdot.config.mapOptions.extent = new esri.geometry.fromJson(wsdot.config.mapOptions.extent);
			map = new esri.Map("map", wsdot.config.mapOptions);
			if (wsdot.config.mapInitialLayer.layerType === "esri.layers.ArcGISTiledMapServiceLayer") {
				initBasemap = new esri.layers.ArcGISTiledMapServiceLayer(wsdot.config.mapInitialLayer.url);
			}



			map.addLayer(initBasemap);

			dojo.connect(map, "onLoad", map, function () {
				map.lods = dojo.clone(map.getLayer(map.layerIds[0]).tileInfo.lods);

				$("#copyright").copyrightInfo({
					map: map
				});

				// Set the scale.
				setScaleLabel();



				setupNorthArrow();
				setupToolbar();
				esri.dijit.Scalebar({ map: map, attachTo: "bottom-left" });



				function resizeMap() {
					//resize the map when the browser resizes - view the 'Resizing and repositioning the map' section in
					//the following help topic for more details http://help.esri.com/EN/webapi/javascript/arcgis/help/jshelp_start.htm#jshelp/inside_guidelines.htm
					var resizeTimer;
					clearTimeout(resizeTimer);
					resizeTimer = setTimeout(function () {
						map.resize();
						map.reposition();
					}, 500);
				}

				// Setup Google Analytics tracking of the layers that are added to the map.
				if (typeof(_gaq) !== "undefined") {
					dojo.connect(map, "onLayerAddResult", gaTrackEvent);
				}

				dojo.connect(dijit.byId('mapContentPane'), 'resize', resizeMap);

				function setExtentFromParams() {
					// Zoom to the extent in the query string (if provided).
					// Test example:
					// extent=-13677603.622831678,5956814.051290565,-13576171.686297385,6004663.630997022
					var qsParams = $.deparam.querystring(true), coords, extent;
					if (qsParams.extent) {
						// Split the extent into its four coordinates.  Create the extent object and set the map's extent.
						coords = $(qsParams.extent.split(/,/, 4)).map(function (index, val) { return parseFloat(val); });
						extent = new esri.geometry.Extent(coords[0], coords[1], coords[2], coords[3], map.spatialReference);
						map.setExtent(extent);
					}
				}

				function getLayersFromParams() {
					var qsParams = $.deparam.querystring(true), layers;
					if (typeof (qsParams.layers) === "string") {
						layers = qsParams.layers.split(",");
					}
					return layers;
				}

				setExtentFromParams();

				// Setup either a tabbed layer list or a normal one depending on the config setting.
				if (wsdot.config.tabbedLayerList) {
					$("#layerList").tabbedLayerList({
						layers: wsdot.config.layers,
						startLayers: getLayersFromParams(),
						startCollapsed: false,
						map: map
					}).css({
						"padding": [0,0,0,0],
						"margin": [0,0,0,0]
					});
					// Setting the padding and margin to 0 is required for IE.
				} else {
					$("#layerList").layerList({
						layers: wsdot.config.layers,
						startLayers: getLayersFromParams(),
						startCollapsed: false,
						map: map
					});
				}

				map.setupIdentifyPopups({
					ignoredLayerRE: /^layer\d+$/i
				});
			});



			// Setup update notifications.
			dojo.connect(map, "onUpdateStart", map, function () {
				$("#loading-bar").show();
			});
			dojo.connect(map, "onUpdateEnd", map, function () {
				$("#loading-bar").hide();
			});



			dojo.connect(map, "onZoomEnd", function (extent, zoomFactor, anchor, level) {
				setScaleLabel(level);
			});


			// Setup the navigation toolbar.
			navToolbar = new esri.toolbars.Navigation(map);
			dojo.connect(navToolbar, "onExtentHistoryChange", function () {
				dijit.byId("previousExtentButton").disabled = navToolbar.isFirstExtent();
				dijit.byId("nextExtentButton").disabled = navToolbar.isLastExtent();
			});

			// Create the button dijits.
			dijit.form.Button({
				iconClass: "zoomfullextIcon",
				showLabel: false,
				onClick: function () {
					map.setExtent(extents.fullExtent);
				}
			}, "fullExtentButton");

			dijit.form.Button({
				iconClass: "zoomprevIcon",
				showLabel: false,
				onClick: function () {
					navToolbar.zoomToPrevExtent();
				}
			}, "previousExtentButton");

			dijit.form.Button({
				iconClass: "zoomnextIcon",
				showLabel: false,
				onClick: function () {
					navToolbar.zoomToNextExtent();
				}
			}, "nextExtentButton");



		}





		//show map on load
		dojo.addOnLoad(init);
	}

	function getConfigUrl() {
		/// <summary>Gets the config file specified by the query string.</summary>
		// Get the query string parameters.
		var qs = $.deparam.querystring(true);
		// If the config parameter has not been specified, return the default.
		if (!qs.config) {
			return defaultConfigUrl;
		} else {
			return ["scripts/config", qs.config, "js"].join(".");
		}
	}


	// Get the configuration
	$.ajax(getConfigUrl(), {
		dataType: "json",
		success: function (data, textStatus, jqXHR) {
			wsdot.config = data;

			doPostConfig();
		},
		error: function (jqXHR, textStatus, errorThrown) {
			$("body").attr("class", null).empty().append("<p class='ui-state-error ui-corner-all'>Error: Invalid <em>config</em> parameter.</p>");
		}
	});


} (jQuery));