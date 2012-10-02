/*global require, jQuery, dojo, esri*/
/*jslint nomen:true, white:true, plusplus:true, browser:true*/
(function ($) {
	"use strict";

	require(["esri/toolbars/draw", "esri/tasks/query"], function () {
		$.widget("ui.faaFar77", {
			options: {
				runwayCenterline: null, // esri.geometry.Polyline
				faaFar77GPUrl: null,
				runwayTypes: [
					"Non Precision Instrument runway Approach Low Visibility",
					"Non Precision Instrument Runway High Visibility",
					"Precision Instrument Runway",
					"Utility Runway Non Precision Instrument Approach",
					"Utility Runway Visual Approach",
					"Visual Runway Visual Approach"
				]
			},
			_clearwayLengthBox: null,
			_runwayTypeBox: null,
			_airportElevationBox: null,
			_create: function () {
				var $this = this, id, currentId, table, row, form;
				id = $this.element.attr("id");

				form = $("<form>").appendTo($this.element);

				table = $("<div>").addClass("table").appendTo(form);

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
							value: option
						}).text(option).appendTo(runwaySelect);
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
				identifyTolerance: 5,
				faaFar77GPUrl: null
			},
			_identifyTask: null,
			_drawToolbar: null,
			_faaFar77Dialog: null,
			_mapClickDeferred: null,
			_showFaaFar77: function (line) {
				var $this = this;

				// Create the dialog if it does not already exist.
				if (!$this._faaFar77Dialog) {
					$this._faaFar77Dialog = $("<div>").attr({
						id: "faaFar77Dialog"
					}).faaFar77({
						runwayCenterline: line,
						faaFar77GPUrl: $this.faaFar77GPUrl
					}).dialog({
						title: "FAA FAR 77 Surface Generator",
						buttons: {
							"OK": function () {
								// TODO: Call the geoprocessing function.
							},
							"Cancel": function () {
								$(this).dialog("close");
							}
						}
					});
				} else {
					$this._faaFar77Dialog.faaFar77("option", "runwayCenterline", line).dialog("open");
				}
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
				}).button();

				dojo.connect($this._drawToolbar, "onDrawEnd", $this, function (geometry) {
					$this._drawToolbar.deactivate();
					$this._trigger("createRunwayEnd", null, {
						"line": geometry
					});
					$this._showFaaFar77(geometry);
				});


				if (!$this.options.identifyUrl) {
					throw new Error("No 'identifyUrl' option was defined.");
				} else if ($this.options.identifyLayerId === null) {
					throw new Error("No 'identifyLayerId' option was specified.");
				}


				$this._identifyTask = new esri.tasks.IdentifyTask($this.options.identifyUrl, null);

				modifyRunwayButton = $("<button type='button' title='Modify an existing runway'>Modify Runway</button>").appendTo($this.element).click(function () {
					$this._trigger("modifyRunwayStart");
					// Enable identify on runway centerline layer.

					// Create a map click event...
					if ($this.options.map.disablePopups) {
						$this.options.map.disablePopups();
					}

					// Set the cursor
					$this.options.map.setMapCursor("pointer");

					$this._mapClickDeferred = dojo.connect($this.options.map, "onClick", function (event) {
						var idParams;
						// Disconnect the map click event.
						dojo.disconnect($this._mapClickDeferred);
						$this.options.map.setMapCursor("default");
						if ($this.options.map.enablePopups) {
							$this.options.map.enablePopups();
						}

						idParams = new esri.tasks.IdentifyParameters();
						idParams.layerIds = [$this.options.identifyLayerId];
						idParams.geometry = event.mapPoint;
						idParams.mapExtent = $this.options.map.extent;
						idParams.returnGeometry = true;
						idParams.tolerance = $this.options.identifyTolerance;
						$this._identifyTask.execute(idParams);
					});

				}).button();

				dojo.connect($this._identifyTask, "onComplete", function (identifyResults) {
					var line, idResult, feature;
					$this._trigger("identifyComplete", null, { identifyResults: identifyResults });
					// Get the line
					if (identifyResults.length > 0) {
						idResult = identifyResults[0];
						feature = idResult.feature;
						line = feature.geometry;
						$this._showFaaFar77(line);
					}
				});

				dojo.connect($this._identifyTask, "onError", function (error) {
					$this._trigger("identifyError", null, { error: error });
				});



				return this;
			},
			_destroy: function () {
				$.Widget.prototype.destroy.apply(this, arguments);
			}
		});
	});
} (jQuery));