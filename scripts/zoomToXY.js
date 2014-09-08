/*jslint browser: true, nomen: true */
/*global jQuery, dojo, esri, Modernizr */

// Copyright ©2012 Washington State Department of Transportation (WSDOT).  Released under the MIT license (http://opensource.org/licenses/MIT).

/// <reference path="dmsConversion.js" />

(function ($) {
	"use strict";

	/** Defines the zoomToXY widget.
	* @example: $("#myDiv").zoomToXY({map: map});
	*/
	$.widget("ui.zoomToXY", {
		options: {
			map: null,
			zoomLevel: 10,
			symbol: null,
			infoWindowTitle: "Zoom to XY",
			xLabel: "X",
			yLabel: "Y"
		},
		_xBox: null,
		_yBox: null,
		_graphicsLayer: null,
		_submitButton: null,
		_clearGraphicsButton: null,
		/** 
		* Clears all of the graphics created by this tool.
		*/
		clearGraphics: function () {
			if (this._graphicsLayer) {
				this._graphicsLayer.clear();
			}
		},
		/**
		* Hides the info window of the map if the title matches this.options.infoWindowTitle.
		*/
		hideInfoWindow: function () {
			var map, infoWindow;
			map = this.options.map;
			infoWindow = map.infoWindow;
			if (infoWindow.isShowing && infoWindow._title.innerText === this.options.infoWindowTitle) {
				infoWindow.hide();
			}
		},
		_create: function () {
			var $this = this;

			/** Adds a point to the map at the location specified in the widget's controls.
			*/
			function submitHandler() {
				var x, y, point, map, renderer, graphic;
				map = $this.options.map;
				// Get the X and Y values from the input boxes, then convert from string to numbers.
				x = $this._xBox.attr("value");
				y = $this._yBox.attr("value");

				x = $.parseDms(x);
				y = $.parseDms(y);

				// Check to make sure that the user put numbers into the text boxes.  (If the browser supports the HTML5 number type input, the boxes will not allow non-number values.)
				if (!isNaN(x) && !isNaN(y)) {
					point = new esri.geometry.Point(x, y, new esri.SpatialReference({ wkid: 4326 }));
					point = esri.geometry.geographicToWebMercator(point);
					map.centerAndZoom(point, $this.options.zoomLevel);
					map.infoWindow.setContent([x, y].join(","));
					map.infoWindow.setTitle($this.options.infoWindowTitle);
					map.infoWindow.show(point);

					// Create the graphics layer if it does not already exist.
					if (!$this._graphicsLayer) {
						// If no symbol was specified in the options, create a default.
						if (!$this.options.symbol) {
							$this.options.symbol = new esri.symbol.SimpleMarkerSymbol();
							$this.options.symbol.setColor(new dojo.Color("red"));
							$this.options.symbol.setStyle(esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE);
						}
						// Create a renderer to use for the graphics layer and assign it the symbol.
						renderer = new esri.renderer.SimpleRenderer($this.options.symbol);

						// Create the graphics layer, assign it a renderer, and add it to the map.
						$this._graphicsLayer = new esri.layers.GraphicsLayer({
							id: "Located XY"
						});
						$this._graphicsLayer.setRenderer(renderer);
						map.addLayer($this._graphicsLayer);

						// Add info template
						$this._graphicsLayer.setInfoTemplate(new esri.InfoTemplate("Zoom to XY", "${x},${y}"));

					}

					// Create the graphic.
					graphic = new esri.Graphic(point);
					graphic.setAttributes({
						x: x,
						y: y
					});

					// Add the graphic to the graphics layer.
					$this._graphicsLayer.add(graphic);

				} else {
					window.alert("Invalid value in X or Y coordinate box");
				}

			}

			(function () {
				var table, row, cell, outerTable, outerRow, outerCell;
				// TODO: Place controls inside of a form and set up jQuery validation, as is done in airspaceCalculator.js.
				outerTable = $("<div class='table'>").appendTo($this.element);
				outerRow = $("<div class='table-row'>").appendTo(outerTable);
				outerCell = $("<div class='table-cell'>").appendTo(outerRow);

				table = $("<div class='table'>").appendTo(outerCell);

				row = $("<div class='table-row'>").appendTo(table);
				cell = $("<div class='table-cell'>").appendTo(row);
				$("<label>").text($this.options.xLabel).appendTo(cell);
				cell = $("<div class='table-cell'>").appendTo(row);
				$this._xBox = $("<input class='ui-zoomToXY-X' placeholder='e.g., -122.45' title='Enter X coordinate here'>").appendTo(cell);

				row = $("<div class='table-row'>").appendTo(table);
				cell = $("<div class='table-cell'>").appendTo(row);
				$("<label>").text($this.options.yLabel).appendTo(cell);
				cell = $("<div class='table-cell'>").appendTo(row);
				$this._yBox = $("<input class='ui-zoomToXY-Y' placeholder='e.g., 47.00' title='Enter Y coordinate here'>").appendTo(cell);

				outerCell = $("<div class='table-cell'>").appendTo(outerRow);

				$this._submitButton = $("<button type='button' class='ui-zoomToXY-button'>").text("Zoom to XY").appendTo(outerCell).click(submitHandler).button({
					text: false,
					icons: {
						primary: "ui-icon-search"
					}
				});

				$this._clearGraphicsButton = $("<button type='button'>").click(function () {
					$this.clearGraphics();
					$this.hideInfoWindow();
				}).button({
					text: false,
					label: "Clear Graphics",
					icons: {
						primary: "ui-icon-close"
					}
				}).appendTo(outerCell);

				// Setup placeholder for non-supporting browsers...
				if (typeof (Modernizr) !== "undefined" && typeof (Modernizr.input) !== "undefined" && typeof (Modernizr.input.placeholder) !== "undefined") {
					if (!Modernizr.input.placeholder) {
						$("[placeholder]", $this.element).placeholder();
					}
				}
			}());
		},
		_destroy: function () {
			// Remove the graphics layer from the map.
			this.options.map.removeLayer(this._graphicsLayer);
			this._graphicsLayer = null;
			// Remove controls that were created by this widget.
			this._xBox.remove();
			this._yBox.remove();
			this._submitButton.remove();
			// Call the base destroy method.
			$.Widget.prototype.destroy.apply(this, arguments);
		}
	});
}(jQuery));