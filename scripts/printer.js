/*global require, jQuery, dojo */
/*jslint plusplus:true,nomen:true*/

(function ($) {
	"use strict";

	/**
	 * Splits a camel-case or Pascal-case variable name into individual words.
	 * @param {string} s
	 * @returns {string[]}
	 */
	function splitWords(s) {
		var re, match, output = [];
		// re = /[A-Z]?[a-z]+/g
		re = /([A-Za-z]?)([a-z]+)/g;

		/*
		matches example: "oneTwoThree"
		["one", "o", "ne"]
		["Two", "T", "wo"]
		["Three", "T", "hree"]
		*/

		match = re.exec(s);
		while (match) {
			// output.push(match.join(""));
			output.push([match[1].toUpperCase(), match[2]].join(""));
			match = re.exec(s);
		}

		return output;

	}

	require(["esri/tasks/PrintTask", "esri/tasks/PrintParameters", "esri/tasks/PrintTemplate", "esri/tasks/LegendLayer"], function (PrintTask, PrintParameters, PrintTemplate, LegendLayer) {
		/**
		 * Creates an array of LegendLayers of all layers currently visible in the map.
		 * @param {esri.Map} map
		 * @param {?number} sublayerThreshold - Any layer with that has this number or more sublayers will be omitted from the legend. Defaults to 30 if omitted.
		 * @returns {esri.tasks.LegendLayer[]}
		 */
		function getLegendLayersFromMap(map, sublayerThreshold) {
			var layer, legendLayer, output = [];
			if (sublayerThreshold === undefined) {
				sublayerThreshold = 30;
			}
			for (var i = 0, l = map.layerIds.length; i < l; i += 1) {
				layer = map.getLayer(map.layerIds[i]);
				if (layer.visible && layer.visibleAtMapScale) {
					legendLayer = new LegendLayer();
					legendLayer.layerId = layer.id;
					if (layer.visibleLayers) {
						legendLayer.subLayerIds = layer.visibleLayers;
					}
					if (legendLayer.subLayerIds.length < sublayerThreshold) {
						output.push(legendLayer);
					}
				}
			}

			// Return null if the output array has no elements.
			return output.length > 0 ? output : null;
		}

		$.widget("ui.printer", {
			options: {
				map: null,
				templates: null, //templates,
				url: null,
				layoutOptions: {
					authorText: null,
					// copyrightText: "",
					//"legendLayers": [],
					titleText: null, //"Airport",
					scalebarUnit: "Miles"
				},
				extraParameters: null,
				async: false
			},
			_layoutOptionsSection: null,
			_printButton: null,
			_cancelButton: null,
			_templateSelect: null,
			_printTask: null,
			_extraParametersControls: null,
			_create: function () {
				var $this = this;

				////function addExtraParameters() {
				////	var additionalParams, i, l, param, label, control, output;

				////	function createSelect(param) {
				////		var j, jl, choice;
				////		if (param.choiceList) {
				////			control = $("<select>").data("paramName", param.name);
				////			for (j = 0, jl = param.choiceList.length; j < jl; j += 1) {
				////				choice = param.choiceList[j];
				////				$("<option>").text(choice).attr({
				////					value: choice,
				////					selected: choice === param.defaultValue
				////				}).appendTo(control);
				////			}
				////			control.appendTo(output);
				////		}
				////	}

				////	function createInput(param) {
				////		control = $("<input>").data("paramName", param.name);
				////		if (param.dataType === "GPString") {
				////			control.attr({
				////				type: "text"
				////			});
				////		} else if (param.dataType === "GPLong") {
				////			control.attr({
				////				type: "range",
				////				step: 1
				////			});
				////			if (param.name === "Resolution") {
				////				control.attr({
				////					min: 96,
				////					max: 300
				////				});
				////			} else if (param.name === "JPEG_Compression_Quality") {
				////				control.attr({
				////					min: 1,
				////					max: 100
				////				});
				////			}
				////		}
				////		if (param.defaultValue) {
				////			control.val(param.defaultValue);
				////		}
				////		control.appendTo(output);
				////	}

				////	if ($this.options.extraParameters) {
				////		output = $("<div>").addClass("ui-printer-extra-parameters");
				////		additionalParams = $this.options.extraParameters;
				////		for (i = 0, l = additionalParams.length; i < l; i += 1) {
				////			param = additionalParams[i];
				////			// TODO: handle label's "for" attribute.
				////			label = $("<label>").text(param.displayName).appendTo(output);
				////			if (param.choiceList) {
				////				createSelect(param);
				////			} else {
				////				createInput(param);
				////			}
				////		}
				////	}
				////	return output;
				////}

				/**
				 * Adds layout options to an element.
				 * @param {jQuery} container - A container element.
				 * @param {Object} layoutOptions
				 */
				function addLayoutOptions(container, layoutOptions) {
					var optionName, optionValue;

					function handleOptionChange(event) {
						var element = $(event.target), name = element.attr("name"), value = element.val();
						if (value === "") {
							value = null;
						}

						$this.options.layoutOptions[name] = value;

					}

					function createSelect() {
						var select, values = ["Miles", "Kilometers", "Meters", "Feet"].sort(), i, l, value;

						select = $("<select name='scalebarUnit'>").change(handleOptionChange);

						for (i = 0, l = values.length; i < l; i++) {
							value = values[i];
							$("<option>").attr({
								value: value,
								selected: value === layoutOptions.scalebarUnit
							}).text(value).appendTo(select);
						}

						return select;
					}


					for (optionName in layoutOptions) {
						if (layoutOptions.hasOwnProperty(optionName)) {
							optionValue = layoutOptions[optionName];
							$("<label>").text(splitWords(optionName).join(" ")).appendTo(container);
							if (optionName === "scalebarUnit") {
								createSelect().appendTo(container);
							} else {
								$("<input>").attr({
									type: "text",
									name: optionName
								}).appendTo(container).val(optionValue).blur(handleOptionChange);
							}
						}
					}
				}

				/**
				 * Creates the select control for selecting print templates.
				 * @returns {HTMLSelectElement}
				 */
				function createTemplateSelect() {
					var output, i, l, tName, ansiRe = /\bANSI\b/i, ansiMatch, firstAnsiFound;

					output = $("<select>");
					for (i = 0, l = $this.options.templates.length; i < l; i += 1) {
						tName = $this.options.templates[i];
						// Test to see if this is an ANSI size template.
						ansiMatch = ansiRe.test(tName);
						$("<option>").attr({
							value: tName,
							// Set this to be the default option if it is the first ANSI sized template.
							selected: !!ansiMatch && !firstAnsiFound 
						}).text(tName).appendTo(output);
						// Set variable to indicate that an ANSI template has been set as default value.
						if (!!ansiMatch) {
							firstAnsiFound = true;
						}
					}

					return output;
				}

				////function getExtraParameters() {
				////	var i, l, output, controls, control, value;
				////	if (!$this._extraParametersControls) {
				////		output = null;
				////	} else {
				////		controls = $("input,select", $this._extraParametersControls);
				////		output = {};
				////		for (i = 0, l = controls.length; i < l; i += 1) {
				////			control = controls.eq(i);
				////			value = control.val();
				////			if (value) {
				////				output[control.data("paramName")] = value;
				////			}
				////		}
				////	}

				////	return output;
				////}

				// Add controls for all of the layout options.
				$("<label>").text("Template").appendTo($this.element);
				$this._templateSelect = createTemplateSelect().appendTo($this.element);
				$this._layoutOptionsSection = $("<div>").addClass("ui-printer-layout-options").appendTo($this.element);
				addLayoutOptions($this._layoutOptionsSection, $this.options.layoutOptions);
				////$this._extraParametersControls = addextraParameters().appendTo($this.element);


				$("<button>").attr({
					type: "button"
				}).appendTo($this.element).button({
					label: "Print",
					icons: {
						primary: "ui-icon-print"
					}

				}).click(function () {
					var printParameters, printTemplate;
					printParameters = new PrintParameters();
					printParameters.map = $this.options.map;
					printTemplate = new PrintTemplate();
					printTemplate.format = "PDF";
					printTemplate.layout = $this._templateSelect.val();
					printTemplate.layoutOptions = $this.options.layoutOptions;
					printTemplate.layoutOptions.legendLayers = getLegendLayersFromMap($this.options.map);
					printParameters.template = printTemplate;
					//// printParameters.extraParameters = getExtraParameters();

					// Create the print task if it does not already exist.
					if (!$this.printTask) {
						$this.printTask = new PrintTask($this.options.url, {
							async: $this.options.async
						});
						dojo.connect($this.printTask, "onComplete", function (result) {
							$this._trigger("printComplete", null, {
								printParameters: printParameters,
								date: Date(),
								result: result
							});
						});
						dojo.connect($this.printTask, "onError", function (error) {
							$this._trigger("printError", null, {
								printParameters: printParameters,
								date: Date(),
								error: error
							});
						});
					}

					$this.printTask.execute(printParameters);
					$this._trigger("printSubmit", null, { parameters: printParameters });
				});

				return this;
			},
			_destroy: function () {
				$.Widget.prototype.destroy.apply(this, arguments);
			}
		});
	});
} (jQuery));