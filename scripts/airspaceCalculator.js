/*global jQuery, Modernizr, esri, dojo*/
/*jslint nomen: true, browser: true */
(function ($) {
	"use strict";

	function _createRenderer() {
		var renderer, defaultSymbol, lineSymbol, penetrationSymbol;
		lineSymbol = esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color("black"), 1);
		defaultSymbol = new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_SQUARE, 10, lineSymbol, new dojo.Color([255, 255, 255, 0.5]));
		renderer = new esri.renderer.UniqueValueRenderer(defaultSymbol, "PenetratesSurface");
		penetrationSymbol = new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_SQUARE, 10, lineSymbol, new dojo.Color("red"));
		renderer.addValue({
			value: "yes",
			symbol: penetrationSymbol,
			label: "Penetration",
			description: "Penetration"
		});
		return renderer;
	}

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

	function formatResults(graphic) {
		var output, message, list, distanceM = graphic.attributes.DistanceFromSurface, distanceF, ftPerM = 3.28084;
		message = ["A building ", graphic.attributes.AGL, "' above ground level ", graphic.attributes.PenetratesSurface === "yes" ? " would " : " would not ", " penetrate an airport's airpsace."].join("");


		// Get the distance in feet (meters to feet conversion).
		distanceF = distanceM * ftPerM;

		output = $("<div>");
		$("<p>").text(message).appendTo(output);
		list = $("<dl>").appendTo(output);
		$("<dt>AGL</dt>").appendTo(list);
		$("<dd>").text(graphic.attributes.AGL + "'").appendTo(list);
		$("<dt>Distance from Surface</dt>").appendTo(list);
		$("<dd>").text([formatAsFeetAndInches(distanceF), " (", Math.round(distanceM * 100) / 100, " m.)"].join("")).appendTo(list);
		$("<dt>Elevation</dt>").appendTo(list);
		$("<dd>").text([formatAsFeetAndInches(graphic.attributes.Z * ftPerM), "(", Math.round(graphic.attributes.Z * 100) / 100, " m.)"].join("")).appendTo(list);

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
			map: null
		},
		_xInput: null,
		_yInput: null,
		_heightInput: null,
		_calculateButton: null,
		_progressBar: null,
		_form: null,
		_geoprocessor: null,
		_graphicsLayer: null,
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
				$("input", this.element).attr("disabled", true);
			} else {
				this.isBusy = false;
				this._progressBar.hide();
				this._calculateButton.show();
				$("input", this.element).attr("disabled", null);
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

			// Calculate button
			// Note that IE7 will not allow the type of the button to be changed once it has been created, therefore the type cannot be assigned via the $().attr function.
			$this._calculateButton = $("<button type='submit'>").text("Calculate").appendTo($this._form);

			// Convert the button to a JQuery UI button if JQuery UI is loaded.
			if (typeof ($.fn.button) !== "undefined") {
				$this._calculateButton.button({
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
				if (typeof (progressBar.max) !== "undefined") {
					$this._progressBar = $(progressBar).text("Waiting for response from Airpsace Calculator service...");
				} else if ($this.options.progressAlternativeImageUrl) {
					// If the browser does not supprt the progress element and an aletrnative image has been provided, create an img instead.
					$this._progressBar = $("<img>").attr({
						src: $this.options.progressAlternativeImageUrl
					});
				} else {
					// If the browser doesn't support progress and no alternate image has been specified, create a DIV instead.
					$this._progressBar = $("<div>").text("Waiting for response from Airpsace Calculator service...");
				}
				// Add the progress bar and hide it for now.
				$this._progressBar.appendTo($this.element).hide();
			} ());

			// Setup placeholder for non-supporting browsers...
			if (typeof (Modernizr) !== "undefined" && typeof (Modernizr.input) !== "undefined" && typeof (Modernizr.input.placeholder) !== "undefined") {
				if (!Modernizr.input.placeholder) {
					$("[placeholder]", $this.element).placeholder();
				}
			}

			$this._form.validate({
				submitHandler: function (form) {
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

			return this;
		},
		_destroy: function () {
			$.Widget.prototype.destroy.apply(this, arguments);
		}
	});
} (jQuery));