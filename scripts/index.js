/*global require, gaTracker, $ */
/*jslint devel: true, browser: true, white: true, nomen: true, regexp: true */

/*
Prerequisites:
ArcGIS JavaScript API
jQuery
jQuery UI
jQuery BBQ plug-in (http://benalman.com/projects/jquery-bbq-plugin/)
*/

/**
 * The Position interface represents the position of the concerned device at a given time. 
 * The position, represented by a Coordinates object, comprehends the 2D position of the device, 
 * on a spheroid representing the Earth, but also its altitude and its speed.
 * @external {Position}
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Position Position}
 */

/**
 * The PositionError interface represents the reason of an error occuring when using the geolocating device.
 * @external PositionError
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/PositionError PositionError}
 */

var wsdot;

require(["require", "dojo/ready", "dojo/on", "dijit/registry",
	"esri/config",
	"esri/map",
	"esri/geometry/jsonUtils",
	"esri/geometry/Point",
	"esri/geometry/Extent",
	"esri/tasks/GeometryService",
	"esri/dijit/Legend",
	"esri/layers/ArcGISTiledMapServiceLayer",
	"esri/toolbars/navigation",
	"esri/layers/GraphicsLayer",
	"esri/dijit/HomeButton",

	"dijit/form/Button",
	"dijit/layout/BorderContainer",
	"dijit/layout/ContentPane",
	"dijit/layout/TabContainer",
	"dijit/layout/AccordionContainer",
	"dojox/layout/ExpandoPane",
	"esri/dijit/Scalebar",
	"esri/graphic",
	"esri/geometry/webMercatorUtils",
	"esri/InfoTemplate",
	"esri/tasks/QueryTask",
	"esri/tasks/query",
	"esri/dijit/BasemapGallery",
	"esri/dijit/BasemapLayer",
	"esri/SpatialReference",
	"esri/dijit/Measurement",
	"esri/request",
	"esri/layers/LabelLayer",
	"esri/renderers/SimpleRenderer",
	"extentSelect",
	"geolocate-button",
	"esri/dijit/Search",

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
	"esri/dijit/Popup",
	"extensions/esriApiExtensions",
	"extensions/htmlPopupExtensions",
	"extensions/metadataExtensions",
	"extensions/extent",
	"extensions/graphicsLayer",
	"extensions/map",
	"scripts/layerList.js",
	"scripts/zoomToXY.js", "scripts/extentSelect.js"
], function (require, ready, on, registry,
	esriConfig, Map, jsonUtils, Point, Extent, GeometryService, Legend, ArcGISTiledMapServiceLayer, Navigation,
	GraphicsLayer, HomeButton, Button, BorderContainer, ContentPane, TabContainer, AccordionContainer, ExpandoPane,
	Scalebar, Graphic, webMercatorUtils, InfoTemplate, QueryTask, Query, BasemapGallery, BasemapLayer, SpatialReference,
	Measurement, esriRequest, LabelLayer, SimpleRenderer, createExtentSelect, createGeolocateButton, Search
) {
	"use strict";

	var map = null, extents = null, navToolbar, createLinks = {}, defaultConfigUrl = "config/config.json";
	wsdot = { config: {} };

	// Setup other geoportals links
	(function (form) {
		var select = form.querySelector("select[name=config]");

		/**
		 * When a config query string parameter has been specified,
		 * set the default selected option to match.
		 */
		function syncSelectedWithQSSetting() {
			var currentConfig = location.search.match("config=([^=&]+)");
			var selectedOption;
			if (currentConfig) {
				currentConfig = currentConfig[1];
				selectedOption = select.querySelector("option[selected]");
				if (selectedOption) {
					selectedOption.removeAttribute("selected");
				}
				selectedOption = select.querySelector("option[value='" + currentConfig + "']");
				if (selectedOption) {
					selectedOption.setAttribute("selected", "selected");
				}
			}
		}

		syncSelectedWithQSSetting();


		// If config/internal-airport.json cannot be reached, remove internal options.
		var request = new XMLHttpRequest();
		request.open("head", "config/internal-airport.json");
		request.onloadend = function (e) {
			var internalGroup;
			if (e.target.status !== 200) {
				internalGroup = select.querySelector("optgroup[label='internal']");
				select.removeChild(internalGroup);
			}
		};
		request.send();

		select.addEventListener("change", function () {
			form.submit();
		});
	}(document.getElementById("otherGeoportalsForm")));

	/**
	 * Shows the disclaimer dialog if the configuration contains a disclaimer.  If the dialog is shown, a jQuery object containing the dialog is returned.
	 * @param {Boolean} showEvenIfAlreadyAgreed - Set this to true if you want to force the disclaimer to be shown even if there is a cookie indicating the user has already agreed.
	 * @returns {Object}
	 */
	function showDisclaimer(showEvenIfAlreadyAgreed) {
		var configName, settingName;

		// Get the configuration name from the query string.
		(function () {
			var re = /\bconfig=([^&]+)/i, match;
			if (location.search) {
				match = location.search.match(re);
				if (match) {
					configName = match[1];
				}
			}
			if (!configName) {
				configName = "";
			}
		}());

		settingName = "GeoportalAggreedToDisclaimer" + configName;

		// Show the disclaimer if there is no cookie indicating that the user has seen it before.
		if (wsdot.config.disclaimer !== undefined && (showEvenIfAlreadyAgreed || (wsdot.config.disclaimer !== null && !$.cookie(settingName)))) {
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
						$.cookie(settingName, true, { expires: 5 });
						$(this).dialog("destroy").remove();
					}
				});
			});
		}
	}

	function doPostConfig() {
		var button;

		// Add a method to the Date object that will return a short date string.
		if (Date.toShortDateString === undefined) {
			/**
			 * Returns a string representation of the date in the format Month-Date-Year.
			 * @returns {string}
			 */
			Date.prototype.toShortDateString = function () {
				return String(this.getMonth()) + "-" + String(this.getDate()) + "-" + String(this.getFullYear());
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

		});

		/**
		 * Sets the extent link in the bookmark tab to the given extent and visible layers.
		 * @returns {string}
		 */
		function getExtentLink() {
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

			return $.param.querystring(window.location.protocol + "//" + window.location.host + window.location.pathname, qsParams);
		}

		function init() {
			var gaTrackEvent, initBasemap = null;
			esriConfig.defaults.io.proxyUrl = "proxy.ashx";
			// Specify list of CORS enabled servers.
			(function (servers) {
				for (var i = 0; i < servers.length; i++) {
					esriConfig.defaults.io.corsEnabledServers.push(servers[i]);
				}
			}(["www.wsdot.wa.gov"]));
			esriConfig.defaults.geometryService = new GeometryService(wsdot.config.geometryServer);

			function setupNorthArrow() {
				// Create the north arrow.
				var img = document.createElement("img");
				img.id = "northArrow";
				img.src = "images/NorthArrow.png";
				img.alt = "North Arrow";
				document.getElementById("map_root").appendChild(img);
			}

			function setupToolbar() {
				var button;
				button = new Button({
					iconClass: "helpIcon",
					showLabel: false,
					onClick: function () {
						window.open(wsdot.config.helpUrl);

						if (window.gaTracker) {
							gaTracker.send("event", "button", "click", "help");
						}
					}
				}, "helpButton");

				button = new Button({
					iconClass: "starIcon",
					showLabel: false,
					/**
					 * Show a dialog with a link to the application, containing query string parameters with the current extent and layers.
					 */
					onClick: function () {
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
						if (window.gaTracker) {
							gaTracker.send("event", "button", "click", "get link");
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
						}

						// Show the export dialog
						exportDialog.dialog("open");

						if (window.gaTracker) {
							gaTracker.send("event", "button", "click", "export graphics");
						}
					}
				}, "saveButton");

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
						if (window.gaTracker) {
							gaTracker.send("event", "button", "click", "layer sorter");
						}
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
							["area", "distance", "location"].forEach(function (toolName) {
								measureWidget.setTool(toolName, false);
							});
							measureDialog.hide();
							$("#measureWidgetContainer").hide();
							// Re-enable the identify popups.
							map.enablePopups();
						}

						// Create the measure dialog if it does not already exist.
						if (!measureDialog || measureDialog.length < 1) {
							(function () {
								var measurement;
								// Create the dialog.
								measureDialog = $("<div>").attr("id", "measureWidgetContainer").appendTo($("#mapContentPane")).addClass("ui-widget").addClass("ui-dialog ui-widget ui-widget-content ui-corner");
								titleBar = $("<div>").attr("class", "ui-dialog-titlebar ui-widget-header ui-corner-all ui-helper-clearfix").appendTo(measureDialog);
								measureDialog.draggable({
									handle: titleBar
								});
								$("<span>").attr("id", "ui-dialog-title-dialog").addClass("ui-dialog-title").text("Measure").appendTo(titleBar);
								$("<a>").addClass("ui-dialog-titlebar-close ui-corner-all").attr("href", "#").append($('<span>').addClass("ui-icon ui-icon-closethick").text("close")).appendTo(titleBar).click(hideMeasureWidget);
								$("<div>").attr("id", "measureWidget").appendTo(measureDialog);
								// Create the widget.
								measurement = new Measurement({
									map: map
								}, document.getElementById("measureWidget"));
								measurement.startup();

								// Setup Google Analytics tracking of measurement tool.
								if (window.gaTracker) {
									measurement.on("measure-end", function (measureEvent) {
										gaTracker.send("event", "measure", measureEvent.toolName, measureEvent.unitName);
									});
								}
							}());
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
							var layoutTemplateParam = resp.parameters.filter(function (param /*, idx*/) {
								return param.name === "Layout_Template";
							});

							if (layoutTemplateParam.length === 0) {
								console.log("print service parameters name for templates must be \"Layout_Template\"");
								return;
							}
							return layoutTemplateParam[0].choiceList;
						}

						function getExtraParameters() {
							return resp.parameters.filter(function (param /*, idx*/) {
								return param.name !== "Web_Map_as_JSON" && param.name !== "Format" && param.name !== "Output_File" && param.name !== "Layout_Template";
							});
						}

						templateNames = getTemplateNames();

						printButton = document.getElementById("printButton");
						pdfList = $("<ol class='printouts-list'>").appendTo("#toolbar").hide();

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
											if (window.gaTracker) {
												gaTracker.send("event", "print", "submit", wsdot.config.printUrl);
											}
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
											
											if (window.gaTracker) {
												gaTracker.send("event", "print", "complete", result.url);
											}
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
											if (window.gaTracker) {
												gaTracker.send("event", "print", "error", [message, wsdot.config.printUrl].join("\n"));
											}
										}
									});
								} else {
									printDialog.dialog("open");
								}
							}
						}, printButton);
					});
				}

				// If a print URL has been specified, add the print widget.
				if (wsdot.config.printUrl) {
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
				} else {
					(function (printButton) {
						var parent = printButton.parentElement;
						parent.removeChild(printButton);
					}(document.getElementById("printButton")));
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

			/**
			 * Refreshes the legend using the layers currently in the map that are not basemap layers.
			 * @param {Object} layerInfo
			 * @param {Layer} layerInfo.layer
			 * @param {Map} layerInfo.target
			 */
			function refreshLegend(/*layerInfo*/) {
				var layerInfos, legend;
				legend = registry.byId("legend");
				layerInfos = getLayerInfos();
				legend.refresh(layerInfos);
			}

		    /**
			 * Adds a Google Analytics tracking event for the addition of a layer to the map.
			 */
			gaTrackEvent = function (e) {

			    var label, basemapIdRe = /^layer\d+$/i, layer, error, action;

			    layer = e.layer;
			    error = e.error;

			    label = basemapIdRe.exec(layer.id) ? "Basemap: " + layer.url : layer.id + ": " + layer.url;
			    action = error ? 'Add - Fail' : 'Add';

			    gaTracker.send('event', 'Layers', action, label);
			};

			/**
			 * Creates the legend control.
			 */
			function setupDefaultLegend() {
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
				map.on("layer-add-result", refreshLegend);
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
					require(["scripts/airspaceCalculator.js"], function () {
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

					/**
					 * Gets the alternate title for this tab name from the config file.
					 * If no alternative is available, the input string is returned.
					 * @param {string} title
					 * @returns {string}
					 */
					function getTabTitle(title) {
						var output;
						if (wsdot.config && wsdot.config.alternateTabTitles && wsdot.config.alternateTabTitles.hasOwnProperty(title)) {
							output = wsdot.config.alternateTabTitles[title];
						}
						return output || title;
					}

					for (i = 0, l = tabOrder.length; i < l; i += 1) {
						name = tabOrder[i];
						if (/Layers/i.test(name)) {
							tabs.addChild(new ContentPane({ title: getTabTitle("Layers"), id: "layersTab" }, "layersTab"));
						} else if (/Legend/i.test(name)) {
							tabs.addChild(new ContentPane({ title: getTabTitle("Legend"), onShow: setupLegend }, "legendTab"));
						} else if (/Basemap/i.test(name)) {
							tabs.addChild(new ContentPane({ title: getTabTitle("Basemap"), id: "basemapTab" }, "basemapTab"));
						} else if (/Tools/i.test(name)) {
							toolsTab = new ContentPane({ title: getTabTitle("Tools") }, "toolsTab");
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
					var div = document.createElement("div");
					div.id = "lrsTools";
					document.getElementById("toolsAccordion").appendChild(div);
					toolsAccordion.addChild(new ContentPane({ title: "State Route Milepost", id: "lrsTools" }, div));
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
					//var button;
					// Zoom tools
					var zoomControlsPaneDiv = document.createElement("div");
					zoomControlsPaneDiv.id = "zoomControlsPane";
					document.getElementById("toolsAccordion").appendChild(zoomControlsPaneDiv);

					toolsAccordion.addChild(new ContentPane({ title: "Zoom to" }, "zoomControlsPane"));
					on.once(registry.byId("zoomControlsPane"), "show", function () {
						var extentTable;
						zoomControlsDiv = $("<div>").attr({ id: "zoomControls" }).appendTo("#zoomControlsPane");

						$("<div class='tool-header'>Zoom to Long./Lat.</div>").appendTo(zoomControlsDiv);
						$("<div id='zoomToXY'>").appendTo(zoomControlsDiv).zoomToXY({
							map: map,
							xLabel: "Long.",
							yLabel: "Lat."
						});

						extentTable = $("<table>").appendTo(zoomControlsDiv);

						/**
						 * Creates a query task and query using settings from config.json.
						 * @param {string} qtName - The name of a query task from config.json.
						 */
						function createQueryTask(qtName) {
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

						/**
						 * Creates the HTML elments that will later be used to create Dojo dijits.
						 */
						function createZoomControls() {
							var body, data;

							function createZoomControl(qtName, data) {
								var row, cell, selectName, labelName, queryTask, label;
								row = $("<tr>").appendTo(body);
								cell = $("<td>").appendTo(row);
								selectName = qtName + "ZoomSelect";
								labelName = qtName + "ZoomLabel";
								//$("<label>").attr({ id: labelName }).text(data.label).appendTo(cell);
								label = document.createElement(label);
								label.id = labelName;
								label.textContent = data.label;
								cell[0].appendChild(label);
								cell = $("<td>").appendTo(row);
								if (data.url) {
									$("<progress>").attr({ id: selectName, src: "images/ajax-loader.gif", alt: "Loading..." }).appendTo(cell);
									queryTask = createQueryTask(qtName);
									queryTask.task.execute(queryTask.query, function (featureSet) {
										createExtentSelect(selectName, featureSet, map, data.levelOrFactor);
									});
								} else if (data.extents) {
									createExtentSelect($("<div>").attr("id", selectName).appendTo(cell)[0], data.extents, map);
									label.htmlFor = selectName;
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
							}());
						}

						createZoomControls();



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
						} else if (/airspace\s?Calculator/i.test(tools[i])) {
							setupAirspaceCalculator();
						}
					}
				} (wsdot.config.tools));

				mapControlsPane.addChild(tabs);
				mainContainer.addChild(mapControlsPane);

				mainContainer.startup();
			}

			/**
			 * Updates the scale level.
			 */
			function setScaleLabel(level) {
				// Set the scale.
				var scale = map.getScale(level);
				var scaleNode = document.getElementById("scaleText");
				var nFormat = (window.Intl && window.Intl.NumberFormat) ? new window.Intl.NumberFormat() : null;
				var value = nFormat ? nFormat.format(scale) : scale;
				scaleNode.textContent = scale ? ["1", value].join(":") : "";
			}

			setupLayout();

			function setupExtents() {
				var extentSpatialReference = new SpatialReference({ wkid: 102100 });
				// Define zoom extents for menu.
				extents = {
					fullExtent: new Extent({ "xmin": -14058520.2360666, "ymin": 5539437.0343901999, "ymax": 6499798.1008670302, "xmax": -12822768.6769759, "spatialReference": extentSpatialReference })
				};
			}

			setupExtents();

			// Convert the extent definition in the options into an Extent object.
			if (wsdot.config.mapOptions.extent) {
				wsdot.config.mapOptions.extent = new jsonUtils.fromJson(wsdot.config.mapOptions.extent);
			}
			map = new Map("map", wsdot.config.mapOptions);

			/**
			 * @typedef {Object} LabelingInfoItem
			 * @property {string} labelExpression - JSON string representation of array of field names.
			 * @property {string} labelPlacement - e.g., "always-horizontal"
			 * @property {TextSymbol} symbol
			 * @property {Boolean} useCodedValues
			 */

			/** Add a LabelLayer if a text layer has that defined.
			 * @param {Object} result
			 * @param {Layer} result.layer
			 * @param {LabelingInfoItem[]} result.layer.labelingInfo
			 * @param {Map} result.target
			 * @param {Error} [result.error]
			 */
			map.on("layer-add-result", function (result) {
				var layer, labelingInfo, liItem, labelLayer, renderer;

				/**
				 * Moves the label layer's list item below that of the layer it is labelling.
				 */
				function moveLabelLayerListItem() {
					var labelLayerCB, labelLayerLI, layerCB, layerLI;
					labelLayerCB = document.querySelector("[data-layer-id='" + labelLayer.id + "']");
					labelLayerLI = labelLayerCB.parentElement;
					layerCB = document.querySelector("[data-layer-id='" + layer.id + "']");
					layerLI = layerCB.parentElement;
					layerLI.parentElement.insertBefore(labelLayerLI, layerLI.nextSibling);
				}

				/**
				 * @param {string} labelExpression - E.g., "[WRIA_NR]"
				 * @returns {string} - E.g., "${WRIA_NR}"
				 */
				function labelExpressionToTextExpression(labelExpression) {
					var re = /\[([^\]]+)/i, match, output;
					match = labelExpression.match(re);
					if (match) {
						output = "${" + match[1] + "}";
					}
					return output;
				}

				if (result.layer && result.layer.labelingInfo) {
					layer = result.layer;
					labelingInfo = layer.labelingInfo;
					if (labelingInfo.length) {
						if (labelingInfo.length >= 1) {
							liItem = labelingInfo[0];
							labelLayer = new LabelLayer({
								id: [layer.id, "(label)"].join(" ")
							});
							renderer = new SimpleRenderer(liItem.symbol);
							labelLayer.addFeatureLayer(layer, renderer, labelExpressionToTextExpression(liItem.labelExpression), liItem);
							map.addLayer(labelLayer);
							moveLabelLayerListItem();
						}
					}
				}
			});

			// Setup the basemap gallery
			(function () {
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
					basemaps: basemaps,
					basemapLayers: map.layerIds
				}, "basemapGallery");

				basemapGallery.startup();

				// Remove the unwanted default basemaps as defined in config.js (if any are defined).
				basemapGallery.on("load", function () {
					/** Gets a list IDs corresponding to basemaps that should be removed, as defined in the config file.
					 * @returns {string[]}
					 */
					function getBasemapsByLabel() {
						var outputIds = [], bItem, rItem;
						if (wsdot.config.basemapsToRemove) {
							for (var i = 0, l = wsdot.config.basemapsToRemove.length; i < l; i += 1) {
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

					if (wsdot.config.basemapsToRemove) {
						var i, removed, toRemove = getBasemapsByLabel();
						for (i = 0; i < toRemove.length; i += 1) {
							removed = basemapGallery.remove(toRemove[i]);
							if (console && console.warn) {
								if (removed === null) {
									console.warn("Basemap removal failed: basemap not found: " + toRemove[i]);
								}
							}
						}
					}

					// If an initial basemap was specified in the config file, 
					// select that basemap now.
					if (wsdot.config.initialBasemap) {
						(function () {
							var firstBasemap, currentBasemap;
							for (var i = 0, l = basemapGallery.basemaps.length; i < l; i += 1) {
								currentBasemap = basemapGallery.basemaps[i];
								if (currentBasemap.title === wsdot.config.initialBasemap) {
									firstBasemap = currentBasemap;
									break;
								}
							}
							if (firstBasemap) {
								basemapGallery.select(firstBasemap.id);
							}
						}());
					}
				});

				on(basemapGallery, "error", function (msg) {
					// Show error message
					if (console) {
						if (console.error) {
							console.error(msg);
						}
					}
				});

				// Check for an existing customLegend
				customLegend = $("#legend").data("customLegend");
				if (customLegend) {
					customLegend.setBasemapGallery(basemapGallery);
				}
			}());

			if (wsdot.config.mapInitialLayer && wsdot.config.mapInitialLayer.layerType === "esri.layers.ArcGISTiledMapServiceLayer") {
				initBasemap = new ArcGISTiledMapServiceLayer(wsdot.config.mapInitialLayer.url);
				map.addLayer(initBasemap);
			}

			(new HomeButton({ map: map }, "homeButton")).startup();

			// Setup Zoom Button
			createGeolocateButton(document.getElementById("geolocateButton"), map);

			map.on("load", function () {

				function setupSearchControls() {
					// Address Search
					var toolbar = document.getElementById("toolbar");
					var addressDiv = document.createElement("div");
					addressDiv.id = "search";
					toolbar.insertBefore(addressDiv, toolbar.firstChild);


					var search = new Search({
						map: map,
						enableHighlight: false,
					}, addressDiv);

					search.on("load", function () {
						var source = search.sources[0];
						source.countryCode = "US";
						// Set the extent to WA. Values from http://epsg.io/1416-area.
						source.searchExtent = extents.fullExtent;
					});

					search.startup();
				}

				setupSearchControls();

				// Set the scale.
				setScaleLabel();

				// Show the disclaimer if one has been defined.
				showDisclaimer(wsdot.config.alwaysShowDisclaimer);

				setupNorthArrow();
				setupToolbar();

				Scalebar({ map: map, attachTo: "bottom-left" });

				// Setup Google Analytics tracking of the layers that are added to the map.
				if (window.gaTracker) {
					on(map, "layer-add-result", gaTrackEvent);
				}

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

				/**
				 * Converts an collection of layer definition objects 
				 * (either an array or arrays grouped into properties of an object)
				 * into an array of layer definitions.
				 * 
				 * If the input is an array, the output will simply be the input.
				 * @param {(Object)|(Object[])} layers
				 * @returns {Object[]}
				 */
				function getLayerArray(layers) {
					var output = null, propName, value;
					if (layers) {
						if (layers instanceof Array) {
							output = layers;
						} else if (typeof layers === "object") {
							output = [];
							for (propName in layers) {
								if (layers.hasOwnProperty(propName)) {
									value = layers[propName];
									value = getLayerArray(value);
									if (value) {
										output = output.concat(value);
									}
								}
							}
						}
					}
					return output;
				}

				/**
				 * Gets all of the layer IDs of layers that are specified with the `visible` option set to true.
				 * @returns {Object[]}
				 */
				function getVisibleLayerIdsFromConfig() {
					var layers = wsdot.config.layers, output = [], i, l, layer;
					if (layers) {
						layers = getLayerArray(layers);
						for (i = 0, l = layers.length; i < l; i += 1) {
							layer = layers[i];
							if (layer.options && layer.options.visible && layer.options.id) {
								output.push(layer.options.id);
							}
						}
					}
					return output;
				}

				setExtentFromParams();

				

				// Setup either a tabbed layer list or a normal one depending on the config setting.
				if (wsdot.config.tabbedLayerList) {
					$("#layerList").tabbedLayerList({
						layers: wsdot.config.layers,
						startLayers: getVisibleLayerIdsFromConfig().concat(getLayersFromParams()),
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
						startLayers: getVisibleLayerIdsFromConfig().concat(getLayersFromParams()),
						startCollapsed: false,
						map: map
					});
				}
				

				map.setupIdentifyPopups({
					ignoredLayerRE: wsdot.config.noPopupLayerRe ? new RegExp(wsdot.config.noPopupLayerRe, "i") : /^layer\d+$/i
				});
			});

			// Setup update notifications.
			on(map, "update-start", function () {
				$("#loading-bar").show();
			});
			on(map, "update-end", function () {
				$("#loading-bar").hide();
			});

			/**
			 * @param {esri.geometry.ScreenPoint} zoomArgs.anchor
			 * @param {esri.geometry.Extent} zoomArgs.extent
			 * @param {number} zoomArgs.level
			 * @param {esri.Map} zoomArgs.target
			 * @param {number} zoomArgs.zoomFactor
			 */
			on(map, "zoom-end", function (zoomArgs) {
				setScaleLabel(zoomArgs.level);
			});

			// Setup the navigation toolbar.
			navToolbar = new Navigation(map);
			navToolbar.on("extent-history-change", function () {
				registry.byId("previousExtentButton").attr("disabled", navToolbar.isFirstExtent());
				registry.byId("nextExtentButton").attr("disabled", navToolbar.isLastExtent());
			});

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

	/**
	 * Gets the config file specified by the query string.
	 * @returns {string}l
	 */
	function getConfigUrl() {
		// Get the query string parameters.
		var qs = $.deparam.querystring(true), output = defaultConfigUrl;
		// If the config parameter has not been specified, return the default.
		if (qs.config) {
			if (/\//g.test(qs.config)) {
				output = [qs.config, ".json"].join("");
			} else {
				output = ["config/", qs.config, ".json"].join("");
			}
		}
		return output;
	}

	// Get the configuration
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