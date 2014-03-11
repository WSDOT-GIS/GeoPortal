/*jslint devel: true, browser: true, white: true, nomen: true, regexp: true */
/*global require, Modernizr, _gaq, $ */

// Copyright ©2012 Washington State Department of Transportation (WSDOT).  Released under the MIT license (http://opensource.org/licenses/MIT).

/*
Prerequisites:
ArcGIS JavaScript API
jQuery
jQuery UI
jQuery BBQ plug-in (http://benalman.com/projects/jquery-bbq-plugin/)
jQuery placeholder (https://github.com/mathiasbynens/jquery-placeholder) Used as a polyfill for non-HTML5-compliant browsers.
*/

/// <reference path="jsapi_vsdoc_v31.js" />
/// <reference path="dojo.js.uncompressed.js" />
/// <reference path="http://ajax.aspnetcdn.com/ajax/jQuery/jquery-1.6.1-vsdoc.js"/>
/// <reference path="jquery.ba-bbq.js" />
/// <reference path="layerList.js" />
/// <reference path="locationInfo.js" />
/// <reference path="config.js" />

var wsdot;

require(["require", "dojo/ready", "dojo/on", "dijit/registry", "dojo/_base/array", "dojo/number",
	"dojo/dom",
	"dojo/dom-attr",
	"dojo/dom-construct",

	"esri/config",
	"esri/map",
	"esri/geometry/jsonUtils",
	"esri/geometry/Point",
	"esri/geometry/Extent",
	"esri/tasks/GeometryService",
	"esri/dijit/Legend",
	"esri/layers/ArcGISTiledMapServiceLayer",
	"esri/toolbars/navigation",

	"dijit/form/Button",
	"dijit/layout/BorderContainer",
	"dijit/layout/ContentPane",
	"dijit/layout/TabContainer",
	"dijit/layout/AccordionContainer",
	"dojox/layout/ExpandoPane",
	"dijit/form/RadioButton",
	"dijit/form/Select",
	"dijit/form/FilteringSelect",
	"dojo/data/ItemFileReadStore",
	"dijit/form/NumberSpinner",
	"dijit/form/DateTextBox",
	"dojo/parser",
	"esri/dijit/Attribution",
	"esri/map",
	"esri/arcgis/utils",
	"esri/dijit/Scalebar",
	"esri/tasks/geometry",
	"esri/tasks/query",
	"esri/toolbars/navigation",
	"esri/toolbars/draw",
	"esri/tasks/gp",
	"esri/layers/FeatureLayer",
	"esri/IdentityManager",
	"extensions/esriApiExtensions",
	"extensions/htmlPopupExtensions",
	"extensions/metadataExtensions",
	"extensions/extent",
	"extensions/graphicsLayer",
	"extensions/map"
], function (require, ready, on, registry, array, number, dom, domAttr, domConstruct,
	config, Map, jsonUtils, Point, Extent, GeometryService, Legend, ArcGISTiledMapServiceLayer, Navigation,
	Button, BorderContainer, ContentPane, TabContainer, AccordionContainer, ExpandoPane) {
	"use strict";

	var map = null, extents = null, navToolbar, createLinks = {}, defaultConfigUrl = "config/config.js";
	wsdot = { config: {} };

	function showDisclaimer(showEvenIfAlreadyAgreed) {
		/// <summary>Shows the disclaimer dialog if the configuration contains a disclaimer.  If the dialog is shown, a jQuery object containing the dialog is returned.</summary>
		/// <param name="showEvenIfAlreadyAgreed" type="Boolean">Set this to true if you want to force the disclaimer to be shown even if there is a cookie indicating the user has already agreed.</param>
		/// <returns type="Object" />
		// Show the disclaimer if there is no cookie indicating that the user has seen it before.
		if (wsdot.config.disclaimer !== undefined && (showEvenIfAlreadyAgreed || (wsdot.config.disclaimer !== null && !$.cookie("AgreedToDisclaimer")))) {
			// Load the content into a div.  Only when the source page has loaded do invoke the dialog constructor.
			// This is to ensure that the dialog is centered on the page.
			return $("<div>").load(wsdot.config.disclaimer, function () {
				// Remove the title element.
				var doc, title;
				doc = $(this);
				title = $("title", this).text();
				$("title,link", this).remove();
				doc.dialog({
					title: title.length > 0 ? title : "Disclaimer",
					modal: true,
					closeOnEscape: false,
					width: 600,
					buttons: {
						"Accept": function () {
							$(this).dialog("close");
						}
					},
					open: function (/*event, ui*/) {
						// Remove the close button from the disclaimer form.
						var form = $(this).parent();
						$("a.ui-dialog-titlebar-close", form).remove();
					},
					close: function (/*event, ui*/) {
						// Add a cookie
						$.cookie("AgreedToDisclaimer", true, { expires: 30 });
						$(this).dialog("destroy").remove();
					}
				});
			});
		}
	}

	function doPostConfig() {
		var button;

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

		// Show the disclaimer if one has been defined.
		showDisclaimer(wsdot.config.alwaysShowDisclaimer);

		// Add a method to the Date object that will return a short date string.
		if (Date.toShortDateString === undefined) {
			Date.prototype.toShortDateString = function () {
				/// <summary>Returns a string representation of the date in the format Month-Date-Year.</summary>
				return String(this.getMonth()) + "-" + String(this.getDate()) + "-" + String(this.getFullYear());
			};
		}

		/*jslint plusplus:true */
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
		/*jslint plusplus:false */

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

		function init() {
			var refreshLegend, gaTrackEvent, initBasemap = null;
			config.defaults.io.proxyUrl = "proxy.ashx";
			config.defaults.geometryService = new GeometryService(wsdot.config.geometryServer);

			////// Opera doesn't display the zoom slider correctly.  This will make it look better.
			////// For more info see http://forums.arcgis.com/threads/24687-Scale-Slider-on-Opera-11.0.1
			////if (dojo.isOpera) {
			////	esri.config.defaults.map.sliderLabel = { labels: ["state", "county", "city"], tick: 0 };
			////}

			function setupNorthArrow() {
				// Create the north arrow.
				domConstruct.create("img", { id: "northArrow", src: "images/NorthArrow.png", alt: "North Arrow" }, "map_root", "last");
			}

			function setupToolbar() {
				var button;
				button = new Button({
					iconClass: "helpIcon",
					showLabel: false,
					onClick: function () {
						window.open(wsdot.config.helpUrl);
					}
				}, "helpButton");

				button = new Button({
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
				button = new Button({
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

							////// The submit button doesn't work in IE without doing the following for some reason.
							////if (dojo.isIE) {
							////	$("button", form).click(function () {
							////		form.submit();
							////	});
							////}
						}

						// Show the export dialog
						exportDialog.dialog("open");
					}
				}, domConstruct.create("button", { id: "saveButton" }, "toolbar", "first"));

				button = new Button({
					label: "Arrange Layers",
					showLabel: false,
					iconClass: "sortIcon",
					onClick: function () {
						var layerSorter = $("#layerSorter");
						// Create the layer sorter dialog if it does not already exist.
						if (layerSorter.length < 1) {
							require(["scripts/layerSorter.js"], function () {
								layerSorter = $("<div id='layerSorter'>").layerSorter({ map: map }).dialog({
									title: "Arrange Layers",
									autoOpen: false
								});
							});
						}
						layerSorter.dialog("open");
					}
				}, "sortButton");

				button = new Button({
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
							var measureWidget = registry.byId("measureWidget");
							measureWidget.clearResult();
							array.forEach(["area", "distance", "location"], function (toolName) {
								measureWidget.setTool(toolName, false);
							});
							measureDialog.hide();
							$("#measureWidgetContainer").hide();
							// Re-enable the identify popups.
							map.enablePopups();
						}

						// Create the measure dialog if it does not already exist.
						if (!measureDialog || measureDialog.length < 1) {
							require(["esri/dijit/Measurement"], function (Measurement) {
								var measurement;
								// Create the dialog.
								measureDialog = $("<div>").attr("id", "measureWidgetContainer").appendTo($("#mapContentPane")).draggable().addClass("ui-widget").addClass("ui-dialog ui-widget ui-widget-content ui-corner");
								titleBar = $("<div>").attr("class", "ui-dialog-titlebar ui-widget-header ui-corner-all ui-helper-clearfix").appendTo(measureDialog);
								$("<span>").attr("id", "ui-dialog-title-dialog").addClass("ui-dialog-title").text("Measure").appendTo(titleBar);
								$("<a>").addClass("ui-dialog-titlebar-close ui-corner-all").attr("href", "#").append($('<span>').addClass("ui-icon ui-icon-closethick").text("close")).appendTo(titleBar).click(hideMeasureWidget);
								$("<div>").attr("id", "measureWidget").appendTo(measureDialog);
								// Create the widget.
								measurement = new Measurement({ map: map }, dom.byId("measureWidget")).startup();
							});
						} else {
							// If the dialog already exists, toggle its visibility.
							measureDialog = $("#measureWidgetContainer:visible");

							if (measureDialog && measureDialog.length > 0) {
								hideMeasureWidget();
							} else {
								// Show the dialog.
								$("#measureWidgetContainer").show();
							}
						}

						return false;
					}
				}, "measureButton");

				function setupPrinter(resp) {
					require(["scripts/printer.js"], function () {
						var printButton, printDialog, templateNames, pdfList;

						function getTemplateNames() {
							var layoutTemplateParam = array.filter(resp.parameters, function (param /*, idx*/) {
								return param.name === "Layout_Template";
							});

							if (layoutTemplateParam.length === 0) {
								console.log("print service parameters name for templates must be \"Layout_Template\"");
								return;
							}
							return layoutTemplateParam[0].choiceList;
						}

						function getExtraParameters() {
							return array.filter(resp.parameters, function (param /*, idx*/) {
								return param.name !== "Web_Map_as_JSON" && param.name !== "Format" && param.name !== "Output_File" && param.name !== "Layout_Template";
							});
						}

						templateNames = getTemplateNames();

						printButton = $("<button>").text("Print...").appendTo("#toolbar").click();
						pdfList = $("<ol>").appendTo("#toolbar").hide();

						printButton = new Button({
							label: "Print",
							iconClass: "dijitIconPrint",
							showLabel: false,
							onClick: function () {
								// Create the print dialog if it does not already exist.
								if (!printDialog) {
									printDialog = $("<div>").dialog({
										modal: true,
										title: "Print"
									}).printer({
										map: map,
										templates: templateNames,
										url: wsdot.config.printUrl,
										extraParameters: getExtraParameters(),
										async: resp.executionType === "esriExecutionTypeAsynchronous",
										printSubmit: function (/*e, data*/) {
											////var parameters = data.parameters;
											printDialog.dialog("close");
											printButton.set({
												disabled: true,
												iconClass: "dijitIconBusy"
											});
										},
										printComplete: function (e, data) {
											var result = data.result, li;
											printButton.set({
												disabled: false,
												iconClass: "dijitIconPrint"
											});
											pdfList.show("fade");
											li = $("<li>").appendTo(pdfList).hide();
											$("<a>").attr({
												href: result.url,
												target: "_blank"
											}).text("Printout").appendTo(li);
											li.show("fade");
											//window.open(result.url);
										},
										printError: function (e, data) {
											var error = data.error, message;
											printButton.set({
												disabled: false,
												iconClass: "dijitIconPrint"
											});
											message = error.dojoType === "timeout" ? "The print service is taking too long to respond." : error.message || "Unknown Error";
											$("<div>").text(message).dialog({
												title: "Print Error",
												modal: true,
												close: function () {
													$(this).dialog("destroy").remove();
												},
												buttons: {
													OK: function () {
														$(this).dialog("close");
													}
												}
											});
										}
									});
								} else {
									printDialog.dialog("open");
								}
							}
						}, printButton[0]);
					});

					////require(["esri/dijit/Print"], function () {
					////	/// <summary>Setup the print widget</summary>
					////	var layoutTemplate, templateNames, mapOnlyIndex, templates, printer;

					////	layoutTemplate = array.filter(resp.parameters, function (param, idx) {
					////		return param.name === "Layout_Template";
					////	});

					////	if (layoutTemplate.length === 0) {
					////		console.log("print service parameters name for templates must be \"Layout_Template\"");
					////		return;
					////	}
					////	templateNames = layoutTemplate[0].choiceList;

					////	// remove the MAP_ONLY template then add it to the end of the list of templates
					////	(function (mapOnlyIndex) {
					////		var mapOnly;
					////		if (mapOnlyIndex > -1) {
					////			mapOnly = templateNames.splice(mapOnlyIndex, mapOnlyIndex + 1)[0];
					////			templateNames.push(mapOnly);
					////		}
					////	} (dojo.indexOf(templateNames, "MAP_ONLY")));

					////	// create a print template for each choice
					////	templates = array.map(templateNames, function (ch) {
					////		var plate = new esri.tasks.PrintTemplate();
					////		plate.layout = plate.label = ch;
					////		plate.format = "PDF";
					////		plate.layoutOptions = {
					////			"authorText": "Map by WSDOT",
					////			"copyrightText": ["©", new Date().getFullYear(), " WSDOT"].join(""),
					////			//"legendLayers": [],
					////			"titleText": "Airport",
					////			"scalebarUnit": "Miles"
					////		};
					////		plate.exportOptions = {
					////			dpi: 300
					////		};
					////		return plate;
					////	});

					////	$("<div id='printButton'>").appendTo("#toolbar");
					////	printer = esri.dijit.Print({
					////		map: map,
					////		templates: templates,
					////		url: wsdot.config.printUrl
					////	}, dom.byId("printButton"));

					////	// Handle errors from the print service.
					////	dojo.connect(printer, "onError", function (error) {
					////		var message = error.dojoType === "timeout" ? "The print service is taking too long to respond." : error.message || "Unknown Error"
					////		$("<div>").text(message).dialog({
					////			title: "Print Error",
					////			modal: true,
					////			close: function () {
					////				$(this).dialog("destroy").remove();
					////			},
					////			buttons: {
					////				OK: function () {
					////					$(this).dialog("close");
					////				}
					////			}
					////		});
					////	});

					////	printer.startup();
					////});

				}

				// If a print URL has been specified, add the print widget.
				if (wsdot.config.printUrl) {
					require(["esri/request"], function (esriRequest) {
						// get print templates from the export web map task
						var printInfo = esriRequest({
							"url": wsdot.config.printUrl,
							"content": { "f": "json" }
						});
						printInfo.then(setupPrinter, function (error) {
							if (console) {
								if (console.error) {
									console.error("Failed to load print service URL.", error);
								}
							}
						});
					});
				}
			}

			function isBasemap(layerId) {
				/// <summary>Examines a layer ID and determines if it is a basemap.</summary>
				var basemapLayerIdRe = /layer(?:(?:\d+)|(?:_osm)|(?:_bing))/i;
				return layerId.match(basemapLayerIdRe);
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

				if (!isBasemap(layer.id) && typeof (this.isInstanceOf === "function") && this.isInstanceOf(Legend)) {
					this.refresh(layerInfos);
				}
			};

			gaTrackEvent = function (layer, error) {
				/// <summary>Adds a Google Analytics tracking event for the addition of a layer to the map.</summary>
				var label, basemapIdRe = /^layer\d+$/i;

				label = basemapIdRe.exec(layer.id) ? "Basemap: " + layer.url : layer.id + ": " + layer.url;

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

				legend = registry.byId("legend");

				// Create the legend dijit if it does not already exist.
				if (!legend) {
					legend = new Legend({
						map: map,
						layerInfos: layerInfos
					}, "legend");
					legend.startup();
				}

				// Set the legend to refresh when a new layer is added to the map.
				on(map, "layerAddResult", legend, refreshLegend);
			}

			function setupLegend() {
				if (typeof (wsdot.config.customLegend) === "object") {
					var basemapGallery = registry.byId("basemapGallery");
					if (basemapGallery) {
						wsdot.config.customLegend.basemapGallery = basemapGallery;
					}
					require(["scripts/customLegend.js"], function () {
						$("#legend").customLegend(wsdot.config.customLegend);
					});
				} else {
					setupDefaultLegend();
				}
			}

			function setupLayout() {
				var mainContainer, mapControlsPane, tabs, toolsTab, toolsAccordion, zoomControlsDiv;
				mainContainer = new BorderContainer({ design: "headline", gutters: false }, "mainContainer");
				mainContainer.addChild(new ContentPane({ region: "top" }, "headerPane"));
				mainContainer.addChild(new ContentPane({ region: "center" }, "mapContentPane"));

				mapControlsPane = new ExpandoPane({
					region: "leading",
					splitter: true,
					title: "Map Controls"
				}, "mapControlsPane");
				tabs = new TabContainer(wsdot.config.tabContainerOptions || null, "tabs");

				function setupAirspaceCalculator() {
					require(["esri/geometry/webMercatorUtils", "scripts/airspaceCalculator.js"], function (webMercatorUtils) {
						$("#airspaceCalculator").airspaceCalculator({
							disclaimer: 'THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, ' +
							"INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  " +
							"IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY," +
							"WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE " +
							"OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.",
							map: map,
							url: wsdot.config.airspaceCalculatorUrl,
							progressAlternativeImageUrl: "images/loading-bar.gif",
							executeComplete: function (event, data) {
								var graphic = data.graphic, geographicPoint, title = graphic.getTitle(), content = graphic.getContent();
								geographicPoint = webMercatorUtils.webMercatorToGeographic(graphic.geometry);
								map.infoWindow.setContent(content);
								map.infoWindow.setTitle(title);
								map.infoWindow.show(geographicPoint);
								map.centerAt(graphic.geometry);

							},
							drawActivate: function () {
								map.disablePopups();
							},
							drawDeactivate: function () {
								map.enablePopups();
							},
							error: function (event, data) {
								alert(['The Airspace Calculator surface returned an error message.', data.error].join("\n"));
							}
						});
					});
				}

				function setupFaaFar77() {
					require(["scripts/ais/faaFar77.js"], function () {
						$("#faaFar77").faaFar77RunwaySelector({
							map: map,
							// TODO: put this URL and layer ID in the app. options.
							identifyUrl: "http://www.wsdot.wa.gov/geosvcs/ArcGIS/rest/services/AirportMapApplication/AirspaceFeatures/MapServer",
							identifyLayerId: 0,
							identifyComplete: function (event, data) {
								var identifyResults, noFeaturesDialog;
								identifyResults = data.identifyResults;
								if (identifyResults.length < 1) {
									noFeaturesDialog = $("#faaFar77NoRunwaysDialog");
									if (noFeaturesDialog.length < 1) {
										$("<div>").text("No runway features were found in this vicinity.").dialog({
											title: "FAA FAR 77",
											buttons: {
												"OK": function () {
													$(this).dialog("close");
												}
											}
										});
									} else {
										noFeaturesDialog.dialog("open");
									}
								}
							},
							identifyError: function (event, data) {
								if (console !== undefined && console.error !== undefined) {
									console.error(data.error);
								}
							}
						});
					});
				}

				(function (tabOrder) {
					var i, l, name, contentPane;

					for (i = 0, l = tabOrder.length; i < l; i += 1) {
						name = tabOrder[i];
						if (/Layers/i.test(name)) {
							tabs.addChild(new ContentPane({ title: "Layers", id: "layersTab" }, "layersTab"));
						} else if (/Legend/i.test(name)) {
							tabs.addChild(new ContentPane({ title: "Legend", onShow: setupLegend }, "legendTab"));
						} else if (/Basemap/i.test(name)) {
							tabs.addChild(new ContentPane({ title: "Basemap", id: "basemapTab" }, "basemapTab"));
						} else if (/Tools/i.test(name)) {
							toolsTab = new ContentPane({ title: "Tools" }, "toolsTab");
							tabs.addChild(toolsTab);
						} else if (/Airspace\s*Calculator/i.test(name)) {
							// Add elements that will become the tab to the dom.
							$("<div id='airspaceCalculatorTab'><section><h1>Airspace Calculator (Prototype)</h1><div id='airspaceCalculator'></div></section></div>").appendTo("#tabs");
							contentPane = new ContentPane({
								title: "Airspc. Calc.",
								tooltip: "Airspace Calculator (Prototype)",
								id: "airspaceCalculatorTab"
							}, "airspaceCalculatorTab");
							on.once(contentPane, "show", setupAirspaceCalculator);
							tabs.addChild(contentPane);
						} else if (/FAA\s*FAR\s*77/i.test(name)) {
							$("<div id='faaFar77Tab'><div id='faaFar77'></div></div>").appendTo("#tabs");
							contentPane = new ContentPane({
								title: "FAA FAR 77",
								id: "faaFar77Tab"
							}, "faaFar77Tab");
							on.once(contentPane, "show", setupFaaFar77);
							tabs.addChild(contentPane);
						}
					}
				} (wsdot.config.tabOrder || ["Layers", "Legend", "Basemap", "Tools"]));

				toolsAccordion = new AccordionContainer(null, "toolsAccordion");

				function setupLrsControls() {
					// LRS Tools
					toolsAccordion.addChild(new ContentPane({ title: "Milepost", id: "lrsTools" }, domConstruct.create("div", { id: "lrsTools" }, "toolsAccordion")));
					createLinks.milepostTab = on(registry.byId("lrsTools"), "show", function () {
						require(["scripts/lrsTools.js"], function () {
							$("#lrsTools").lrsTools({
								map: map,
								drawActivate: function () {
									map.disablePopups();
								},
								drawDeactivate: function () {
									map.enablePopups();
								}
							});

						});

						createLinks.milepostTab.remove();
						delete createLinks.milepostTab;
					});
				}

				function setupZoomControls() {
					var button;
					// Zoom tools
					$("<div>").attr({ id: "zoomControlsPane" }).appendTo("#toolsAccordion");

					toolsAccordion.addChild(new ContentPane({ title: "Zoom to" }, "zoomControlsPane"));
					createLinks.zoomControls = on(registry.byId("zoomControlsPane"), "show", function () {
						require(["scripts/zoomToXY.js", "scripts/extentSelect.js"], function () {
							var extentTable;
							zoomControlsDiv = $("<div>").attr({ id: "zoomControls" }).appendTo("#zoomControlsPane");

							$("<button>").attr({ id: "zoomToMyCurrentLocation", type: "button" }).text("Zoom to my current location").appendTo(zoomControlsDiv);

							$("<div class='tool-header'>Zoom to Long./Lat.</div>").appendTo(zoomControlsDiv);
							$("<div id='zoomToXY'>").appendTo(zoomControlsDiv).zoomToXY({
								map: map,
								xLabel: "Long.",
								yLabel: "Lat."
							});

							extentTable = $("<table>").appendTo(zoomControlsDiv);

							require(["esri/tasks/QueryTask", "esri/tasks/query", "scripts/extentSelect.js"], function (QueryTask, Query) {
								function createQueryTask(qtName) {
									/// <summary>Creates a query task and query using settings from config.js.</summary>
									/// <param name="qtName" type="String">The name of a query task from config.js.</param>
									var queryTaskSetting, qt, query, n;
									queryTaskSetting = wsdot.config.queryTasks[qtName];
									qt = new QueryTask(queryTaskSetting.url);
									query = new Query();

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

									var body, data;

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
											queryTask.task.execute(queryTask.query, function (featureSet) {
												$("#" + selectName).extentSelect(featureSet, map, data.levelOrFactor);
											});
										} else if (data.extents) {
											$("<div>").attr("id", selectName).appendTo(cell).extentSelect(data.extents, map);
											domAttr.set(labelName, "for", selectName);
										}
									}

									body = $("<tbody>").appendTo(extentTable);

									(function () {
										var qtName;
										for (qtName in wsdot.config.queryTasks) {
											if (wsdot.config.queryTasks.hasOwnProperty(qtName)) {
												data = wsdot.config.queryTasks[qtName];
												createZoomControl(qtName, data);
											}
										}
									} ());
								}

								createZoomControls();
							});

							if (navigator.geolocation) {
								button = new Button({
									onClick: function () {
										navigator.geolocation.getCurrentPosition(function (position) {
											require(["esri/geometry/webMercatorUtils", "esri/lang"], function (webMercatorUtils, esriLang) {
												var pt, attributes;
												pt = new Point(position.coords.longitude, position.coords.latitude);
												pt = webMercatorUtils.geographicToWebMercator(pt);
												attributes = { lat: position.coords.latitude.toFixed(6), long: position.coords.longitude.toFixed(6) };
												map.infoWindow.setTitle("You are here").setContent(esriLang.substitute(attributes, "Lat: ${lat} <br />Long: ${long}")).show(map.toScreen(pt));
												map.centerAndZoom(pt, 8);
											});
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
								domConstruct.destroy("zoomToMyCurrentLocation");
							}

							createLinks.zoomControls.remove();
							delete createLinks.zoomControls;
						});
					});
				}

				function setupSearchControls() {
					// Address Search
					toolsAccordion.addChild(new ContentPane({ title: "Find an Address" }, domConstruct.create("div", { id: "searchTools" }, "toolsAccordion")));
					createLinks.search = on(registry.byId("searchTools"), "show", function () {
						require(["scripts/addressLocator.js"], function() {
							$("<div>").attr("id", "searchControl").appendTo("#searchTools").addressLocator({
								map: map,
								addressLocator: "http://tasks.arcgisonline.com/ArcGIS/rest/services/Locators/TA_Streets_US_10/GeocodeServer"
							});
							createLinks.search.remove();
							delete createLinks.search;
						});
					});
				}

				// Look in the configuration to determine which tools to add and in which order.
				(function (tools) {
					var i, l;
					// Setup a default value for tools if it hasn't been specified.
					if (!tools) {
						tools = ["lrs", "zoom", "search"];
					}
					for (i = 0, l = tools.length; i < l; i += 1) {
						if (/zoom/i.test(tools[i])) {
							setupZoomControls();
						} else if (/lrs/i.test(tools[i])) {
							setupLrsControls();
						} else if (/search/i.test(tools[i])) {
							setupSearchControls();
						} else if (/airspace\s?Calculator/i.test(tools[i])) {
							setupAirspaceCalculator();
						}
					}
				} (wsdot.config.tools));

				createLinks.basemapTab = on(registry.byId("basemapTab"), "show", function () {
					require(["esri/dijit/BasemapGallery", "esri/dijit/BasemapLayer"], function (BasemapGallery, BasemapLayer) {
						var basemaps = wsdot.config.basemaps, i, l, layeri, basemapGallery, customLegend;

						for (i = 0, l = basemaps.length; i < l; i += 1) {
							for (layeri in basemaps.layers) {
								if (basemaps.layers.hasOwnProperty(layeri)) {
									basemaps.layers[layeri] = new BasemapLayer(basemaps.layers[layeri]);
								}
							}
						}

						basemapGallery = new BasemapGallery({
							showArcGISBasemaps: true,
							map: map,
							basemaps: basemaps
						}, "basemapGallery");

						basemapGallery.startup();

						// Remove the unwanted default basemaps as defined in config.js (if any are defined).
						if (wsdot.config.basemapsToRemove) {
							basemapGallery.on("load", function () {
								/** Gets a list IDs corresponding to basemaps that should be removed, as defined in the config file.
								 * @returns {string[]}
								 */
								function getBasemapsByLabel() {
									var outputIds = [], bItem, rItem;
									if (wsdot.config.basemapsToRemove) {
										for (var i = 0, l = wsdot.config.basemapsToRemove.length; i < l; i+=1) {
											rItem = wsdot.config.basemapsToRemove[i];
											for (var b = 0, bl = basemapGallery.basemaps.length; b < bl; b += 1) {
												bItem = basemapGallery.basemaps[b];
												if (bItem.title === rItem) {
													outputIds.push(bItem.id);
													break;
												}
											}
										}
									}
									return outputIds;
								}

								var i, removed, toRemove = getBasemapsByLabel();
								for (i = 0; i < toRemove.length; i += 1) {
									removed = basemapGallery.remove(toRemove[i]);
									if (console && console.warn) {
										if (removed === null) {
											console.warn("Basemap removal failed: basemap not found: " + toRemove[i]);
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

						on(basemapGallery, "error", function (msg) {
							// Show error message
							if (console) {
								if (console.error) {
									console.error(msg);
								}
							}
						});

						createLinks.basemapTab.remove();
						delete createLinks.basemapTab;

						// Check for an existing customLegend
						customLegend = $("#legend").data("customLegend");
						if (customLegend) {
							customLegend.setBasemapGallery(basemapGallery);
						}
					});
				});

				mapControlsPane.addChild(tabs);
				mainContainer.addChild(mapControlsPane);

				mainContainer.startup();
			}

			function setScaleLabel(level) {
				// Set the scale.
				var scale = map.getScale(level);
				if (scale && scale !== 0) {
					$("#scaleText").text("");
				} else {
					$("#scaleText").text("1:" + number.format(scale, {
						round: 0,
						places: 0
					}));
				}

			}

			setupLayout();

			function setupExtents() {
				require(["esri/SpatialReference"], function (SpatialReference) {
					var extentSpatialReference = new SpatialReference({ wkid: 102100 });
					// Define zoom extents for menu.
					extents = {
						fullExtent: new Extent({ "xmin": -14058520.2360666, "ymin": 5539437.0343901999, "ymax": 6499798.1008670302, "xmax": -12822768.6769759, "spatialReference": extentSpatialReference })
					};
				});
			}

			setupExtents();

			// Convert the extent definition in the options into an Extent object.
			if (wsdot.config.mapOptions.extent) {
				wsdot.config.mapOptions.extent = new jsonUtils.fromJson(wsdot.config.mapOptions.extent);
			}
			map = new Map("map", wsdot.config.mapOptions);
			if (wsdot.config.mapInitialLayer.layerType === "esri.layers.ArcGISTiledMapServiceLayer") {
				initBasemap = new ArcGISTiledMapServiceLayer(wsdot.config.mapInitialLayer.url);
			}

			map.addLayer(initBasemap);

			on(map, "load", function () {
				// Set the scale.
				setScaleLabel();

				setupNorthArrow();
				setupToolbar();
				require(["esri/dijit/Scalebar"], function(Scalebar) {
					Scalebar({ map: map, attachTo: "bottom-left" });
				});

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
				if (_gaq !== undefined) {
					on(map, "layerAddResult", gaTrackEvent);
				}

				on(registry.byId('mapContentPane'), 'resize', resizeMap);

				function setExtentFromParams() {
					// Zoom to the extent in the query string (if provided).
					// Test example:
					// extent=-13677603.622831678,5956814.051290565,-13576171.686297385,6004663.630997022
					var qsParams = $.deparam.querystring(true), coords, extent;
					if (qsParams.extent) {
						// Split the extent into its four coordinates.  Create the extent object and set the map's extent.
						coords = $(qsParams.extent.split(/,/, 4)).map(function (index, val) { return parseFloat(val); });
						extent = new Extent(coords[0], coords[1], coords[2], coords[3], map.spatialReference);
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

				require(["scripts/layerList.js"], function () {

					// Setup either a tabbed layer list or a normal one depending on the config setting.
					if (wsdot.config.tabbedLayerList) {
						$("#layerList").tabbedLayerList({
							layers: wsdot.config.layers,
							startLayers: getLayersFromParams(),
							startCollapsed: false,
							map: map
						}).css({
							"padding": [0, 0, 0, 0],
							"margin": [0, 0, 0, 0]
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
				});

				map.setupIdentifyPopups({
					ignoredLayerRE: /^layer\d+$/i
				});
			});

			// Setup update notifications.
			on(map, "update-start", function () {
				$("#loading-bar").show();
			});
			on(map, "update-end", function () {
				$("#loading-bar").hide();
			});

			on(map, "zoomEnd", function (extent, zoomFactor, anchor, level) {
				setScaleLabel(level);
			});

			// Setup the navigation toolbar.
			navToolbar = new Navigation(map);
			navToolbar.on("extent-history-change", function () {
				registry.byId("previousExtentButton").attr("disabled", navToolbar.isFirstExtent());
				registry.byId("nextExtentButton").attr("disabled", navToolbar.isLastExtent());
			});

			// Create the button dijits.
			button = new Button({
				iconClass: "zoomfullextIcon",
				showLabel: false,
				onClick: function () {
					map.setExtent(extents.fullExtent);
				}
			}, "fullExtentButton");

			button = new Button({
				iconClass: "zoomprevIcon",
				showLabel: false,
				onClick: function () {
					navToolbar.zoomToPrevExtent();
				}
			}, "previousExtentButton");

			button = new Button({
				iconClass: "zoomnextIcon",
				showLabel: false,
				onClick: function () {
					navToolbar.zoomToNextExtent();
				}
			}, "nextExtentButton");
		}

		//show map on load
		ready(init);
	}

	function getConfigUrl() {
		/// <summary>Gets the config file specified by the query string.</summary>
		// Get the query string parameters.
		var qs = $.deparam.querystring(true), output = defaultConfigUrl;
		// If the config parameter has not been specified, return the default.
		if (qs.config) {
			if (/\//g.test(qs.config)) {
				output = [qs.config, ".js"].join("");
			} else {
				output = ["config/", qs.config, ".js"].join("");
			}
		}
		return output;
	}

	// Get the configuratio
	$.ajax(getConfigUrl(), {
		dataType: "json",
		success: function (data /*, textStatus, jqXHR*/) {
			wsdot.config = data;

			doPostConfig();
		},
		error: function (jqXHR, textStatus, errorThrown) {
			var request = this;
			// Detect the error that occurs if the user tries to access the airport power user setting via config query string parameter.
			// Redirect to the aspx page which will prompt for a log in.
			if (/parsererror/i.test(textStatus) && /^AIS\/config.js(?:on)?$/i.test(request.url)) {
				if (console) {
					if (console.debug) {
						console.debug({ jqXHR: jqXHR, textStatus: textStatus, errorThrown: errorThrown });
					}
				}
				$("body").attr("class", null).empty().append("<p>You need to <a href='AirportPowerUser.aspx'>log in</a> to access this page.</p>");
				// location.replace("AirportPowerUser.aspx");
			} else {
				$("body").attr("class", null).empty().append("<p class='ui-state-error ui-corner-all'>Error: Invalid <em>config</em> parameter.</p>");
			}
		}
	});
});