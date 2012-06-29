/*global jQuery, Modernizr, esri, dojo*/
/*jslint nomen: true, browser: true */
(function ($) {
	"use strict";

	$.widget("ui.airspaceCalculator", {
		options: {
			url: null // e.g., "http://hqolymgis19d/ArcGIS/rest/services/AirportMapApplication/AirspaceCalculator/GPServer/Get Intersection Count"
		},
		_xInput: null,
		_yInput: null,
		_heightInput: null,
		_calculateButton: null,
		_progressBar: null,
		_form: null,
		_geoprocessor: null,
		_isGPAsync: false,
		/** Changes the UI from normal to "busy" mode.  When "busy", no user input is allowed and the progress bar is displayed.
		* @param Boolean inProgress Set to true to allow user input, false to disallow and display progress bar.
		*/
		_setInProgress: function (inProgress) {
			if (inProgress) {
				this._progressBar.show();
				this._calculateButton.hide();
				$("input", this.element).attr("disabled", true);
			} else {
				this._progressBar.hide();
				this._calculateButton.show();
				$("input", this.element).attr("disabled", null);
			}
		},
		_create: function () {
			var $this = this, table, row, cell, id, baseId = $this.element.attr("id");

			$this._form = $("<form>").attr({
				id: baseId + "-form",
				method: "get",
				action: ""
			}).appendTo($this.element);

			table = $("<div class='table'>").appendTo($this._form);

			// X
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

			// Y
			id = baseId + "-y";
			row = $("<div class='table-row'>").appendTo(table);
			cell = $("<div class='table-cell'>").appendTo(row);
			$this._yInput = $("<input>").attr({
				id: id,
				name: "Y",
				placeholder: 'Latitude',
				required: "required coordinate"
			});
			$("<label>Latitude</label>").attr("for", id).appendTo(cell);
			cell = $("<div class='table-cell'>").appendTo(row);
			$this._yInput.appendTo(cell);

			// Height above ground level(HGL)
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
			$this._calculateButton = $("<button>").attr({
				type: 'submit'
			}).text("Calculate").appendTo($this._form);

			// Add the progress bar and hide it for now.
			$this._progressBar = $("<progress>").text("Waiting for response from Airpsace Calculator service...").appendTo($this.element).hide();

			// Convert to a JQuery UI button if JQuery UI is loaded.
			if (typeof ($.fn.button) !== "undefined") {
				$this._calculateButton.button({
					icons: {
						primary: "ui-icon-calculator"
					}
				});
			}

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
						(function () {
							var onExecuteComplete, onError;

							onExecuteComplete = function (results, messages) {
								$this._setInProgress(false);
								$this._trigger("executeComplete", null, {
									results: results, messages: messages
								});
							};

							onError = function (error) {
								$this._setInProgress(false);
								$this._trigger("error", null, {
									error: error
								});
							};

							$this._geoprocessor = esri.tasks.Geoprocessor($this.options.url);
							dojo.connect($this._geoprocessor, "onExecuteComplete", $this, onExecuteComplete);
							dojo.connect($this._geoprocessor, "onError", $this, onError);
						} ());
					}
					parameters = {
						X: Number($this._xInput.val()),
						Y: Number($this._yInput.val()),
						Height: Number($this._heightInput.val())
					};
					try {
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