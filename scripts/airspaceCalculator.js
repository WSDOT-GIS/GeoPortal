/*global jQuery*/
/*jslint nomen: true */
(function ($) {
	"use strict";
	$.widget("ui.airspaceCalculator", {
		options: {
			url: null // e.g., "http://hqolymgis19d/ArcGIS/rest/services/test3dIntersect1/GPServer/Intersect%203D%20Line%20With%20Multipatch"
		},
		_xInput: null,
		_yInput: null,
		_heightInput: null,
		_calculateButton: null,
		_form: null,
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
				name: "x",
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
				name: "y",
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
				name: "height",
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
					alert("Sorry, this function is not yet available.");
					return false;
				}
			});
			return this;
		},
		_destroy: function () {
			$.Widget.prototype.destroy.apply(this, arguments);
		}
	});
} (jQuery));