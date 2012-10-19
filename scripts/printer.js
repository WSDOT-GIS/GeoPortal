/*global require, jQuery*/
/*jslint plusplus:true,nomen:true*/
(function ($) {
	"use strict";

	function splitWords(s) {
		/// <summary>Splits a camel-case or Pascal-case variable name into individual words.</summary>
		/// <param name="s" type="String">A string</param>
		/// <returns type="Array" />
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



	require(["esri/tasks/PrintTask", "esri/tasks/gp"], function (PrintTask) {
		$.widget("ui.printer", {
			options: {
				map: null,
				templates: null, //templates,
				url: null,
				layoutOptions: {
					authorText: null,
					copyrightText: ["©", new Date().getFullYear(), " WSDOT"].join(""),
					//"legendLayers": [],
					titleText: null, //"Airport",
					scalebarUnit: "Miles"
				},
				bingTypeRe: /^BingMaps((?:Aerial)|(?:Road)|(?:Hybrid))/i,
				openStreetMapTypeRe: /^OpenStreetMap$/i,
				wmtsTypeRe: /^wmts$/i,
				basemapRe: /layer((?:\d+)|(?:_osm)|(?:_bing))/i
			},
			_gp: null,
			_layoutOptionsSection: null,
			_printButton: null,
			_cancelButton: null,
			_templateSelect: null,
			_printTask: null,
			_moveBasemapLayersToBasemapProperty: function (webMap) {
				/// <summary>
				/// When esri.PrintTask._getPrintDefinition creates a web map object, it does not place basemap layers in the baseMap property.  
				/// This function does that.
				/// </summary>
				/// <param name="webMap" type="Object">An object conforming to the Export Web Map Specification.  This can be generated using esri.PrintTask._getPrintDefinition.</param>
				/// <param name="basemapIdRegex" type="Regexp">A regular expression used to determine which layers should be used as basemap layers.</param>
				/// <returns type="Object">Returns the webMap parameter</returns>
				var $this = this, i, l, baseMapLayers, operationalLayers, opLayer, bmLayer;
				/*jslint eqeq:true*/
				if (webMap.baseMap || !webMap.operationalLayers || webMap.operationalLayers.length < 1) {
					return webMap;
				}
				/*jslint eqeq:false*/

				// Separate basemap and operation layers.
				baseMapLayers = [], operationalLayers = []
				for (i = 0, l = webMap.operationalLayers.length; i < l; i++) {
					opLayer = webMap.operationalLayers[i];
					bmLayer = null;
					if (opLayer.type) {
						if ($this.options.bingTypeRe.test(opLayer.type)) {
							bmLayer = {
								id: opLayer.id,
								type: opLayer.type,
								opacity: opLayer.opacity,
								key: opLayer.key
							}
						} else if ($this.options.openStreetMapTypeRe.test(opLayer.type)) {
							bmLayer = {
								id: opLayer.id,
								type: opLayer.type,
								opacity: opLayer.opacity,
								url: opLayer.url,
								credits: opLayer.credits
							}
						} else if ($this.options.wmtsTypeRe.test(opLayer.type)) {
							bmLayer = {
								id: opLayer.id,
								type: opLayer.type,
								opacity: opLayer.opacity,
								url: opLayer.url,
								layer: opLayer.layer,
								style: opLayer.style,
								format: opLayer.format,
								tilematrixSet: opLayer.tileMatrixSet
							}
						}
					} else if ($this.options.basemapRe.test(opLayer.id)) {
						bmLayer = {
							id: opLayer.id,
							url: opLayer.url,
							opacity: opLayer.opacity
						};
					}

					if (bmLayer) {
						baseMapLayers.push(bmLayer);
					} else {
						operationalLayers.push(opLayer);
					}
				}

				webMap.operationalLayers = operationalLayers;
				if (baseMapLayers.length) {
					webMap.baseMap = {
						baseMapLayers: baseMapLayers
					};
				}


				return webMap;
			},
			_create: function () {
				var $this = this;

				function addLayoutOptions(container, layoutOptions) {
					/// <summary>Adds layout options to an element.</summary>
					/// <param name="container" type="jQuery">A container element</param>
					/// <param name="layoutOptions" type="Object">An object with properties.</param>
					var optionName, optionValue;
					for (optionName in layoutOptions) {
						if (layoutOptions.hasOwnProperty(optionName)) {
							optionValue = layoutOptions[optionName];
							$("<label>").text(splitWords(optionName).join(" ")).appendTo(container);
							$("<input>").attr({
								type: "text",
								name: optionName
							}).appendTo(container).val(optionValue);
						}
					}
				}

				function createTemplateSelect() {
					var output, i, l, tName;

					output = $("<select>");
					for (i = 0, l = $this.options.templates.length; i < l; i += 1) {
						tName = $this.options.templates[i];
						$("<option>").attr({
							value: tName
						}).text(tName).appendTo(output);
					}

					return output;
				}

				$this._gp = esri.tasks.Geoprocessor($this.options.url);

				// Add controls for all of the layout options.
				$("<label>").text("Template").appendTo($this.element);
				$this._templateSelect = createTemplateSelect().appendTo($this.element);
				$this._layoutOptionsSection = $("<div>").addClass("ui-printer-layout-options").appendTo($this.element);
				addLayoutOptions($this._layoutOptionsSection, $this.options.layoutOptions);


				$("<button>").attr({
					type: "button"
				}).appendTo($this.element).button({
					label: "Print",
					icons: {
						primary: "ui-icon-print"
					}

				}).click(function () {
					var printParameters, printTemplate, printDef;
					printParameters = new esri.tasks.PrintParameters();
					printParameters.map = $this.options.map;
					printTemplate = new esri.tasks.PrintTemplate();
					printTemplate.format = "PDF";
					printTemplate.layout = $this._templateSelect.val();
					printParameters.template = printTemplate;

					if (!$this.printTask) {
						$this.printTask = new PrintTask($this.options.url);
					}
					printDef = $this.printTask._getPrintDefinition($this.options.map);
					// Move the basemap layers to the basemap property.
					$this._moveBasemapLayersToBasemapProperty(printDef);

					console.debug(printDef);
				});

				return this;
			},
			_destroy: function () {
				$.Widget.prototype.destroy.apply(this, arguments);
			}
		});
	});
} (jQuery));