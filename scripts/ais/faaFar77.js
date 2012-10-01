/*global require, jQuery, esri*/
/*jslint nomen:true, white:true, plusplus:true, browser:true*/
(function ($) {
	"use strict";

	require(["esri/toolbars/draw", "esri/tasks/query"], function () {
		$.widget("ui.faaFar77", {
			options: {
				runwayCenterline: null, // esri.geometry.Polyline
				faaFar77GPUrl: null,
				runwayTypes: [
					{
						label: "Utility visual approach"
					},
					{
						label: "Utility nonprecision instrument approach"
					},
					{
						label: "Visual visual approach"
					},
					{
						label: "Nonprecision instrument greater visibility"
					},
					{
						label: "Nonprecision instrument approach low visibility"
					},
					{
						label: "Precision instrument"
					}
				]
			},
			_clearwayLengthBox: null,
			_runwayTypeBox: null,
			_airportElevationBox: null,
			_create: function () {
				var $this = this, id, currentId, table, row;
				id = $this.element.attr("id");



				table = $("<div>").addClass("table").appendTo($this.element);

				// Clearway Length.
				row = $("<div>").appendTo(table);
				currentId = id + "-clearway-length";
				$("<label>").text("Clearway Length").attr("for", currentId).appendTo(row);
				$this._clearwayLengthBox = $("<input>").attr({
					type: "number",
					id: currentId
				}).appendTo(row);

				// Runway Type...
				(function () {
					var runwaySelect, i, l, option;
					row = $("<div>").appendTo(table);
					currentId = id + "-runway-type";
					$("<label>").text("Runway Type").attr("for", currentId).appendTo(row);
					runwaySelect = $("<select>").attr({
						id: currentId
					}).appendTo(row);

					for (i = 0, l = $this.options.runwayTypes.length; i < l; i++) {
						option = $this.options.runwayTypes[i];
						$("<option>").attr({
							value: option.value || option.label // Use the label if no value has been defined.
						}).text(option.label).data(option).appendTo(runwaySelect);
					}
				} ());

				// Airport elevation
				row = $("<div>").appendTo(table);
				currentId = id + "-airport-elevation";
				$("<label>").text("Airport Elevation").attr("for", currentId).appendTo(row);
				$("<input>").attr({
					type: "number",
					id: currentId
				}).appendTo(row);

				return this;
			},
			_destroy: function () {
				$.Widget.prototype.destroy.apply(this, arguments);
			}
		});

		$.widget("ui.faaFar77RunwaySelector", {
			options: {
				map: null,
				identifyUrl: null,
				identifyLayerId: null,
				faaFar77GPUrl: null
			},
			_identifyTask: null,
			_drawToolbar: null,
			_faaFar77Dialog: null,
			_showFaaFar77: function (line) {

			},
			_create: function () {
				var $this = this, createRunwayButton, modifyRunwayButton;

				if (!$this.options.map) {
					throw new Error("No 'map' option was defined.");
				}


				$this._drawToolbar = new esri.toolbars.Draw($this.options.map, null);

				createRunwayButton = $("<button type='button' title='Create new runway'>Create runway</button>").appendTo($this.element).click(function () {
					$this._trigger("createRunwayStart", null, null);
					$this._drawToolbar.activate(esri.toolbars.Draw.LINE);
				});

				dojo.connect($this._drawToolbar, "onDrawEnd", $this, function (geometry) {
					$this._drawToolbar.deactivate();
					$this._trigger("createRunwayEnd", null, {
						"line": geometry
					});
				});


				if (!$this.options.identifyUrl) {
					throw new Error("No 'identifyUrl' option was defined.");
				}

				modifyRunwayButton = $("<button type='button' title='Modify an existing runway'>Modify Runway</button>").appendTo($this.element).click(function () {
					$this._trigger("modifyRunwayStart");
					// TODO: Enable identify on runway centerline layer.
					alert("This function is not currently available.");
				});

				$this._identifyTask = new esri.tasks.IdentifyTask($this.options.identifyUrl, null);

				dojo.connect($this._identifyTask, "onComplete", function (identifyResults) {
					var line;
					// TODO: get the line
					$this._showFaaFar77(line);
				});

				dojo.connect($this._identifyTask, "onError", function (error) {
				});



				return this;
			},
			_destroy: function () {
				$.Widget.prototype.destroy.apply(this, arguments);
			}
		});
	});
} (jQuery));