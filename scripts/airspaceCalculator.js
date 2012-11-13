/*global require, jQuery, Modernizr, esri */
/*jslint nomen: true, browser: true, white: true */
(function ($) {
	"use strict";
	require(["dojo/_base/Color", "esri/graphic", "esri/symbol", "esri/renderer", "esri/layers/graphics", "esri/toolbars/draw", "esri/geometry", "esri/tasks/gp"], function (Color) {

		function _createRenderer() {
			var renderer, defaultSymbol, lineSymbol, penetrationSymbol;
			lineSymbol = esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new Color("black"), 1);
			defaultSymbol = new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_SQUARE, 10, lineSymbol, new Color([255, 255, 255, 0.5]));
			renderer = new esri.renderer.UniqueValueRenderer(defaultSymbol, "PenetratesSurface");
			penetrationSymbol = new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_SQUARE, 10, lineSymbol, new Color("red"));
			renderer.addValue({
				value: "yes",
				symbol: penetrationSymbol,
				label: "Penetration",
				description: "Penetration"
			});
			return renderer;
		}

		function feetToMeters(feet) {
			/// <summary>Converts feet to meters</summary>
			/// <param name="feet" type="Number">number of feet</param>
			/// <returns type="Number" />
			var ftPerM = 3.28084;
			return feet / ftPerM;
		}

		////function metersToFeet(meters) {
		////	/// <summary>Converts meters to feet</summary>
		////	/// <param name="meters" type="Number">number of meters</param>
		////	/// <returns type="Number" />
		////	var ftPerM = 3.28084;
		////	return meters * ftPerM;
		////}

		function formatAsFeetAndInches(feet) {
			/// <summary>Formats a Number (feet) into a string (feet and inches (rounded))</summary>
			/// <param name="feet" type="Number">A number of feet.</param>
			/// <returns type="String" />
			var inches = feet % 1;
			feet = feet - inches;
			inches = Math.round(inches * 12);
			if (inches === 12) {
				feet += 1;
				inches = 0;
			}
			return inches > 0 ? [feet, "'", inches, '"'].join("") : [feet, "'"].join("");
		}

		function formatFeetAsFeetAndInchesAndMeters(feet) {
			/// <summary>Formats feet as X'Y" (Z m.)</summary>
			/// <param name="feet" type="Number">An amount in feet.</param>
			/// <returns type="String" />
			var m = feetToMeters(feet);
			return [formatAsFeetAndInches(feet), " (", Math.round(m * 100) / 100, " m.)"].join("");
		}

	////function formatMetersAsFeetAndInchesAndMeters(meters) {
	////	/// <summary>Formats feet as X'Y" (Z m.)</summary>
	////	/// <param name="feet" type="Number">An amount in meters.</param>
	////	/// <returns type="String" />
	////	var feet = metersToFeet(meters);
	////	return [formatAsFeetAndInches(feet), " (", Math.round(meters * 100) / 100, " m.)"].join("");
	////}

		function formatResults(graphic) {
			var output, message, list, distanceF = graphic.attributes.DistanceFromSurface, penetrationDistanceF, elevationF = graphic.attributes.Z;
			message = ["A building ", graphic.attributes.AGL, "' above ground level ", graphic.attributes.PenetratesSurface === "yes" ? " would " : " would not ", " penetrate an airport's airpsace."].join("");

			output = $("<div>");
			$("<p>").text(message).appendTo(output);
			if (graphic.attributes.PenetratesSurface === "yes") {
				$("<p>").append($("<a>").attr({
					href: "http://www.faa.gov/forms/index.cfm/go/document.information/documentID/186273",
					target: "_blank",
					title: "Form FAA 7460-1: Notice of Proposed Construction or Alteration"
				}).text("Form FAA 7460-1: Notice of Proposed Construction or Alteration")).appendTo(output);
			}
			list = $("<dl>").appendTo(output);
			////$("<dt>AGL</dt>").appendTo(list);
			////$("<dd>").text(graphic.attributes.AGL + "'").appendTo(list);
			$("<dt>Elevation of <abbr title='Federal Aviation Regulations'>FAR</abbr> Surface</dt>").appendTo(list);
			$("<dd>").text(formatFeetAsFeetAndInchesAndMeters(distanceF)).appendTo(list);
			$("<dt>Terrain Elevation</dt>").appendTo(list);
			$("<dd>").text(formatFeetAsFeetAndInchesAndMeters(elevationF)).appendTo(list);

			if (graphic.attributes.PenetratesSurface === "yes") {
				penetrationDistanceF = Math.abs(distanceF - graphic.attributes.AGL);
				$("<dt>Penetration of Surface</dt>)").appendTo(list);
				$("<dd>").text(formatFeetAsFeetAndInchesAndMeters(penetrationDistanceF)).appendTo(list);
			}
			return output[0];
		}

		function formatTitle(graphic) {
			return graphic.attributes.PenetratesSurface === "yes" ? "Surface Penetration" : "No Surface Penetration";
		}

		$.widget("ui.airspaceCalculator", {
			options: {
				url: null, // e.g., "http://hqolymgis21t/ArcGIS/rest/services/AirportMapApplication/AirspaceCalculator/GPServer/Calculate%20Penetrations"
				progressAlternativeImageUrl: null,
				isGPAsynch: false,
				map: null,
				pointClickSymbol: new esri.symbol.SimpleMarkerSymbol().setStyle(esri.symbol.SimpleMarkerSymbol.STYLE_X),
				disclaimer: null
			},
			_xInput: null,
			_yInput: null,
			_heightInput: null,
			_drawPointButton: null,
			_clearGraphicsButton: null,
			_resetButton: null,
			_calculateButton: null,
			_progressBar: null,
			_form: null,
			_geoprocessor: null,
			_graphicsLayer: null,
			_drawToolbar: null,
			_clickedGraphic: null,
			/** This will be true when the airspaceCalculator is waiting for a response from the GP service, false otherwise. */
			isBusy: false,

			/** Changes the UI from normal to "busy" mode.  When "busy", no user input is allowed and the progress bar is displayed.
			* @param Boolean inProgress Set to true to allow user input, false to disallow and display progress bar.
			*/
			_setInProgress: function (inProgress) {
				if (inProgress) {
					this.isBusy = true;
					this._progressBar.show();
					this._calculateButton.hide();
					$("input,button", this.element).attr("disabled", true);
				} else {
					this.isBusy = false;
					this._progressBar.hide();
					this._calculateButton.show();
					$("input,button", this.element).attr("disabled", null);
				}
				return this;
			},
			getGraphicsLayer: function () {
				if (this._graphicsLayer === null) {
					this._graphicsLayer = esri.layers.GraphicsLayer({ id: "Airspace Calculator" });
					// Setup renderer.
					this._graphicsLayer.setRenderer(_createRenderer());
					this._graphicsLayer.setInfoTemplate(new esri.InfoTemplate(formatTitle, formatResults));
					if (!this.options.map) {
						throw new Error("The map option has not been set for the Airspace Calculator.");
					} else {
						this.options.map.addLayer(this._graphicsLayer);
					}
				}
				return this._graphicsLayer;
			},
			_updateTempGraphic: function (point) {
				/// <summary>Adds a graphic to the map's graphics layer at the specified point, replacing any exiting graphic added to that layer by this widget.</summary>
				/// <param name="point" type="esri.graphics.Point">The point to be added to the map as a graphic.  
				// If no point is provided (null or undefined), any existing graphics will simply be removed without adding a new graphic.</param>
				/// <returns type="jQuery.fn.airspaceCalculator" />
				var $this = this;
				if ($this._clickedGraphic) {
					$this.options.map.graphics.remove($this._clickedGraphic);
				}
				if (point) {
					$this._clickedGraphic = new esri.Graphic(point, $this.options.pointClickSymbol);
					$this.options.map.graphics.add($this._clickedGraphic);
				} else {
					$this._clickedGraphic = null;
				}
				return this;
			},
			getDrawToolbar: function () {
				var $this = this;
				if (this._drawToolbar === null) {
					this._drawToolbar = new esri.toolbars.Draw(this.options.map);
					dojo.connect(this._drawToolbar, "onDrawEnd", function (geometry) {
						// Fill the X and Y boxes with the clicked point's coordinates
						$this._drawToolbar.deactivate();
						// Add the clicked location to the map
						$this._updateTempGraphic(geometry);

						$this._trigger("drawDeactivate", null, { geometry: geometry, airspaceCalculator: $this });
						if (geometry) {
							// Convert the geometry to geographic.
							geometry = esri.geometry.webMercatorToGeographic(geometry);
							$this._xInput.val(geometry.x);
							$this._yInput.val(geometry.y);
						}
					});
				}
				return this._drawToolbar;
			},
			_addFeature: function (graphic) {
				var graphicsLayer = this.getGraphicsLayer(), outGraphic;
				outGraphic = graphicsLayer.add(graphic);
				graphicsLayer.refresh();
				return outGraphic;
			},
			_create: function () {
				var $this = this, table, row, cell, id, baseId = $this.element.attr("id");

				// Create the form
				$this._form = $("<form>").attr({
					id: baseId + "-form",
					method: "get",
					action: "#"
				}).appendTo($this.element);

				// Setup the "table" layout.  (Not an actual table, but can be made to layout as a table via CSS.)
				table = $("<div class='table'>").appendTo($this._form);

				// Setup X input
				id = baseId + "-x";
				row = $("<div class='table-row'>").appendTo(table);
				cell = $("<div class='table-cell'>").appendTo(row);
				$this._xInput = $("<input>").attr({
					id: id,
					name: "X",
					placeholder: "Longitude",
					required: "required"
				}).addClass("required coordinate");
				$("<label>Longitude</label>").attr("for", id).appendTo(cell);
				cell = $("<div class='table-cell'>").appendTo(row);
				$this._xInput.appendTo(cell);

				// Setup Y input
				id = baseId + "-y";
				row = $("<div class='table-row'>").appendTo(table);
				cell = $("<div class='table-cell'>").appendTo(row);
				$this._yInput = $("<input>").attr({
					id: id,
					name: "Y",
					placeholder: 'Latitude'
				}).addClass("required coordinate");
				$("<label>Latitude</label>").attr("for", id).appendTo(cell);
				cell = $("<div class='table-cell'>").appendTo(row);
				$this._yInput.appendTo(cell);

				// Setup input for Height above ground level(HGL)
				id = baseId + "-height";
				row = $("<div class='table-row'>").appendTo(table);
				cell = $("<div class='table-cell'>").appendTo(row);
				$this._heightInput = $("<input>").attr({
					id: id,
					name: "Height",
					placeholder: 'Structure Height',
					required: "required"
				}).addClass("required number");
				$("<label>Structure Height</label>").attr("for", id).appendTo(cell);
				cell = $("<div class='table-cell'>").appendTo(row);
				$this._heightInput.appendTo(cell);

				// Create the buttons.
				row = $("<div>").appendTo($this._form);
				// Get Point
				$("<button>").attr({
					type: "button"
				}).text("Get point from map").button({
					label: "Get point from map",
					text: false,
					icons: {
						primary: "ui-icon-pencil"
					}
				}).click(function () {
					var toolbar;
					toolbar = $this.getDrawToolbar();
					toolbar.activate(esri.toolbars.Draw.POINT);
					$this._trigger("drawActivate", null, { airspaceCalculator: $this });
				}).appendTo(row);

				// Clear graphics
				$("<button>").attr({
					type: "button"
				}).text("Clear Graphics").button({
					label: "Clear Graphics",
					text: false,
					icons: {
						primary: "ui-icon-trash"
					}
				}).click(function () {
					if ($this._graphicsLayer) {
						$this._graphicsLayer.clear();
					}
					$this._updateTempGraphic();
				}).appendTo(row);

				// Reset form
				$("<button type='reset'>").button({
					label: "Reset",
					text: false,
					icons: {
						primary: "ui-icon-closethick"
					}
				}).appendTo(row);

				// Calculate button
				// Note that IE7 will not allow the type of the button to be changed once it has been created, therefore the type cannot be assigned via the $().attr function.
				$this._calculateButton = $("<button type='submit'>").text("Calculate").appendTo(row);

				// Convert the button to a JQuery UI button if JQuery UI is loaded.
				if ($.fn.button !== undefined) {
					$this._calculateButton.button({
						label: "Calculate",
						text: true,
						icons: {
							primary: "ui-icon-calculator"
						}
					});
				}

				// Setup the progress bar.
				(function () {
					var progressBar;
					// Create the progress element.
					progressBar = window.document.createElement("progress");
					// Test the browser's support for this element.  If the browser supports progress, the element should have a max property.
					if (progressBar.max !== undefined) {
						$this._progressBar = $(progressBar).text("Waiting for response from Airspace Calculator service...");
					} else if ($this.options.progressAlternativeImageUrl) {
						// If the browser does not supprt the progress element and an aletrnative image has been provided, create an img instead.
						$this._progressBar = $("<img>").attr({
							src: $this.options.progressAlternativeImageUrl
						});
					} else {
						// If the browser doesn't support progress and no alternate image has been specified, create a DIV instead.
						$this._progressBar = $("<div>").text("Waiting for response from Airspace Calculator service...");
					}
					// Add the progress bar and hide it for now.
					$this._progressBar.appendTo($this.element).hide();
				} ());

				// Setup placeholder for non-supporting browsers...
				if (Modernizr !== undefined && Modernizr.input !== undefined && Modernizr.input.placeholder !== undefined) {
					if (!Modernizr.input.placeholder && $.fn.placeholder !== undefined) {  // If the browser does not support "placeholder" attribute.
						$("[placeholder]", $this.element).placeholder();
					}
				}

				$this._form.validate({
					submitHandler: function (/*form*/) {
						var parameters;
						if ($this._geoprocessor === null) {
							// Setup the geoprocessor object and its event handlers.
							(function () {
								var onExecuteComplete, onError;


								/** Triggers the executeComplete event. */
								onExecuteComplete = function (results, messages) {
									var feature, graphic;
									$this._setInProgress(false);
									feature = results[0].value.features[0];
									// Remove the temporary graphic
									$this._updateTempGraphic();
									graphic = $this._addFeature(feature);
									$this._trigger("executeComplete", null, {
										graphic: graphic,
										results: results,
										messages: messages,
										penetrates: feature.attributes.PenetratesSurface === "yes"
									});
								};

								/** Triggers the error event. */
								onError = function (error) {
									$this._setInProgress(false);
									$this._trigger("error", null, {
										error: error
									});
								};

								$this._geoprocessor = esri.tasks.Geoprocessor($this.options.url);
								$this._geoprocessor.setOutSpatialReference($this.options.map.spatialReference);
								dojo.connect($this._geoprocessor, "onExecuteComplete", $this, onExecuteComplete);
								dojo.connect($this._geoprocessor, "onError", $this, onError);
							} ());
						}
						// Gather the input parameters.
						parameters = {
							"Input_Obstruction_Features": new esri.tasks.FeatureSet({
								"geometryType": "esriGeometryPoint",
								"spatialReference": { "wkid": 4326 },
								"features": [
								{
									"geometry": {
										"x": $.parseDms($this._xInput.val()),
										"y": $.parseDms($this._yInput.val())
									},
									"attributes": {
										"AGL": Number($this._heightInput.val())
									}
								}
							]
							})
						};

						try {
							// Submit the paramters to the GP and set the UI to be "busy".
							$this._geoprocessor.execute(parameters);
							$this._setInProgress(true);
						} finally {
							// Return false so that the form submit action does not actually redirect the browser.
							return false;
						}
					}
				});

				if ($this.options.disclaimer) {
					$("<div class='ui-disclaimer'>").append($this.options.disclaimer).appendTo($this.element);
				}

				return this;
			},
			_destroy: function () {
				$.Widget.prototype.destroy.apply(this, arguments);
			}
		});
	});
} (jQuery));