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
		_create: function () {
			var $this = this, table, row, cell, id, baseId = $this.element.attr("id");

			table = $("<div class='table'>").appendTo($this.element);

			// X
			id = baseId + "-x";
			row = $("<div class='table-row'>").appendTo(table);
			cell = $("<div class='table-cell'>").appendTo(row);
			$this._xInput = $("<input>").attr({
				type: "number",
				placeholder: "Longitude",
				id: id,
				required: "required"
			});
			$("<label>Longitude</label>").attr("for", id).appendTo(cell);
			cell = $("<div class='table-cell'>").appendTo(row);
			$this._xInput.appendTo(cell);

			// Y
			id = baseId + "-y";
			row = $("<div class='table-row'>").appendTo(table);
			cell = $("<div class='table-cell'>").appendTo(row);
			$this._yInput = $("<input>").attr({
				id: id,
				type: 'number',
				placeholder: 'Latitude',
				required: "required"
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
				type: 'number',
				placeholder: 'Structure Height',
				min: 0,
				required: "required"
			});
			$("<label>Structure Height</label>").attr("for", id).appendTo(cell);
			cell = $("<div class='table-cell'>").appendTo(row);
			$this._heightInput.appendTo(cell);

			// Calculate button
			$this._calculateButton = $("<button type='button'>Calculate</button>").appendTo($this.element);

			// Convert to a JQuery UI button if JQuery UI is loaded.
			if (typeof ($.fn.button) !== "undefined") {
				$this._calculateButton.button({
					icons: {
						primary: "ui-icon-calculator"
					}
				});
			}

			return this;
		},
		_destroy: function () {
			$.Widget.prototype.destroy.apply(this, arguments);
		}
	});
} (jQuery));