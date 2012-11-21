/*global require, dojo, dijit, esri, jQuery */
/*jslint nomen: true, white:true, devel: true, browser: true */

// Copyright ©2012 Washington State Department of Transportation (WSDOT).  Released under the MIT license (http://opensource.org/licenses/MIT).

/*
This jQuery plugin is used to create an address locator control for an ArcGIS JavaScript API web application.
Prerequisites:
ArcGIS JavaScript API
jQuery
jQuery UI
*/
/// <reference path="http://ajax.aspnetcdn.com/ajax/jQuery/jquery-1.6.2-vsdoc.js"/>
/// <reference path="http://ajax.aspnetcdn.com/ajax/jquery.ui/1.8.14/jquery-ui.js"/>
(function ($) {
	"use strict";
	require(["dojo/_base/Color", "dojo/_base/array", "esri/tasks/locator"], function (Color, array) {

		function createSpatialReference(obj) {
			/// <summary>
			/// Creates a spatial reference object using the input object.  
			/// If the input object is already an esri.SpatialReference, the input object is returned.
			/// </summary>
			/// <param name="obj" type="esri.SpatialReference or Number or String or Object">Description</param>
			var output;
			if (obj !== undefined) {
				if (obj.isInstanceOf && obj.isInstanceOf(esri.SpatialReference)) {
					output = obj;
				} else if (typeof (obj) === "number") {
					output = new esri.SpatialReference({ wkid: obj });
				} else if (typeof (obj) === "string") {
					output = new esri.SpatialReference({ wkt: obj });
				} else if (obj.hasOwnProperty("wkid") || obj.hasOwnProperty("wkt")) {
					output = new esri.SpatialReference(obj);
				}

				return output;
			}

			throw new Error("Invalid parameter provided for createSpatialReference method.");
		}

		$.widget("ui.addressLocator", {
			// default options
			options: {
				addressLocator: null,
				outSR: { wkid: 3857 },
				map: null
			},
			_dojoEventHandlers: [],
			_create: function () {
				// If the supplied address locator is a string, assume it is a URL and create a locator object.
				var widget = this, element = this.element, inputDiv, resultsDiv, toolbar, zoomToSelectedCandidate, stateOrZipRe;
				stateOrZipRe = /(?:WA(?:shington)?)|(?:\d{5}(?:-\d{4)?)/gi;

				zoomToSelectedCandidate = function () {
					// Get the currently selected address candidate, then zoom the map to it.
					var addressCandidate = $(this).data("addressCandidate"); //$("#ui-address-locator-results :checked").data("addressCandidate");
					widget.options.map.centerAndZoom(addressCandidate.location, 10);
				};

				function handleAddressToLocationsComplete(addressCandidates) {
					widget.enable();

					function createGraphicsLayer() {
						var renderer, layer, infos;
						renderer = new esri.renderer.ClassBreaksRenderer(new esri.symbol.SimpleMarkerSymbol(), "score");
						infos = [
						{
							minValue: 100,
							maxValue: 101,
							symbol: new esri.symbol.SimpleMarkerSymbol().setColor(new Color("#00FF00")),
							label: "100",
							description: "Perfect Match"
						},
						{
							minValue: 90,
							maxValue: 100,
							symbol: new esri.symbol.SimpleMarkerSymbol().setColor(new Color("#B0FF00")),
							label: "High",
							description: "High Score"
						},
						{
							minValue: 80,
							maxValue: 90,
							symbol: new esri.symbol.SimpleMarkerSymbol().setColor(new Color("#FFFF00")),
							label: "Medium-High",
							description: "Medium-High Score"
						},
						{
							minValue: 70,
							maxValue: 80,
							symbol: new esri.symbol.SimpleMarkerSymbol().setColor(new Color("#FF7D16")),
							label: "Medium",
							description: "Medium Score"
						},
						{
							minValue: 0,
							maxValue: 69,
							symbol: new esri.symbol.SimpleMarkerSymbol().setColor(new Color("#FF0000")),
							label: "Low",
							description: "Low Score"
						}

					];
						array.forEach(infos, function (info) {
							renderer.addBreak(info);
						});

						layer = new esri.layers.GraphicsLayer({ id: "Located Addresses" });
						layer.setInfoTemplate(new esri.InfoTemplate("${address}", "Score: ${score}"));
						layer.setRenderer(renderer);

						return layer;
					}

					var resultsDiv, list, row, link, graphic;
					// Create the list of address candidates.
					resultsDiv = $("#ui-address-locator-results");
					resultsDiv.empty();

					// Create the graphics layer if it does not already exist.
					if (!widget._graphicsLayer) {
						widget._graphicsLayer = createGraphicsLayer();
						widget.options.map.addLayer(widget._graphicsLayer);
					}


					if (addressCandidates.length < 1) {
						resultsDiv.text("No matches found");
					} else {
						list = $("<ul>").addClass("ui-address-locator-results").appendTo(resultsDiv);
						$.each(addressCandidates, function (index, candidate) {
							var inputId = "ui-address-locator-result-" + index;
							graphic = new esri.Graphic(candidate.location).setAttributes({ address: candidate.address, score: candidate.score });
							widget._graphicsLayer.add(graphic);
							row = $("<li>").addClass("ui-address-locator-result").appendTo(list).attr({ title: "Score: " + String(candidate.score) });
							if (candidate.score === 100) {
								row.addClass("score-100");
							} else if (candidate.score >= 90) {
								row.addClass("score-high");
							} else if (candidate.score >= 80) {
								row.addClass("score-medium-high");
							} else if (candidate.score >= 70) {
								row.addClass("score-medium");
							} else {
								row.addClass("score-low");
							}

							link = $("<a>").attr("href", "#").text(candidate.address).appendTo(row).data({ addressCandidate: candidate }).click(zoomToSelectedCandidate);

						});
						$("#ui-address-locator-results-toolbar").show();
					}

					resultsDiv.slideDown();
				}

				////function handleLocationToAddressComplete(addressCandidate) {
				////}

				function handleError(error) {
					widget.enable();
				}

				if (typeof (widget.options.addressLocator) === "string") {
					widget.options.addressLocator = new esri.tasks.Locator(widget.options.addressLocator);
					if (widget.options.outSR !== undefined) {
						widget.options.outSR = createSpatialReference(widget.options.outSR);
						widget.options.addressLocator.setOutSpatialReference(widget.options.outSR);
					}
				} else if (!widget.options.addressLocator.isInstanceOf || !widget.options.addressLocator.isInstanceOf(esri.tasks.Locator)) {
					throw new Error("Invalid addressLocator.  The 'addressLocator' option must be either a string or an esri.tasks.Locator object.");
				}

				widget._dojoEventHandlers.push(dojo.connect(widget.options.addressLocator, "onAddressToLocationsComplete", widget, handleAddressToLocationsComplete));
				widget._dojoEventHandlers.push(dojo.connect(widget.options.addressLocator, "onError", widget, handleError));

				// Create the container that will contain the input controls.
				inputDiv = $("<div>").attr({ id: "ui-address-locator" }).addClass("ui-widget").appendTo(element);

				(function () {
					var textArea, button;
					// Create the search box.
					textArea = $("<textarea>").attr({ name: "address", rows: 5, placeholder: "Input an address here" }).appendTo(inputDiv).blur(function (eventObject) {
						var address = $(this).val();
						if (address.length > 0 && !address.match(stateOrZipRe)) {
							address += ", WA";
							$(this).val(address);
						}
					});
					button = $("<button>").attr({ type: "button" }).button({ label: "Find", icons: { primary: "ui-icon-search" }, text: false }).appendTo(inputDiv).click(function () {
						var address = $("#ui-address-locator *[name=address]").val();
						if (address) {
							address = { "Single Line Input": address };
							widget.options.addressLocator.addressToLocations(address);
							if (widget._graphicsLayer && widget._graphicsLayer.clear) {
								widget._graphicsLayer.clear();
							}
							widget.disable();
						} else if (console && console.error) {
							console.error("Invalid address");
						}
					});

					// Setup the ctrl + enter event in the text area so that it will click the find button.
					textArea.keydown(function (event) {
						if (event.ctrlKey && event.keyCode === 13) {
							button.click();
						}
					});
				} ());
				resultsDiv = $("<div>").attr({ id: "ui-address-locator-results" }).addClass("ui-corner-all  ui-widget-content").appendTo(element).hide();
				toolbar = $("<div>").attr("id", "ui-address-locator-results-toolbar").appendTo(element).hide();
				$("<button>").button({
					label: "Clear Results",
					text: true,
					icons: {
						primary: "ui-icon-closethick"
					}
				}).appendTo(toolbar).click(function () {
					widget.clearResults();
				});
			},
			enable: function () {
				$.Widget.prototype.enable.apply(this, arguments);
			},
			disable: function () {
				$.Widget.prototype.disable.apply(this, arguments);
			},
			clearResults: function () {
				$("#ui-address-locator-results").slideUp().empty();
				// Clear the graphics layer if it exists.
				if (this._graphicsLayer && this._graphicsLayer.clear) {
					this._graphicsLayer.clear();
				}
				$("#ui-address-locator-results-toolbar").hide();
			},
			destroy: function () {
				$.Widget.prototype.destroy.apply(this, arguments); // default destroy
				array.forEach(this._dojoEventHandlers, function (eventHandler) {
					dojo.disconnect(eventHandler);
				});
			}
		});
	});
}(jQuery));