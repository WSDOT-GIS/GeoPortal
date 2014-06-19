/*global require */
/*jslint nomen: true, white: true, browser: true */

// Copyright (C)2012 Washington State Department of Transportation (WSDOT).  Released under the MIT license (http://opensource.org/licenses/MIT).

require([
	"dojo/_base/array",
	"dojo/_base/lang",
	"dojo/on",
	"esri/request",
	"esri/InfoTemplate",
	"esri/map",
	"esri/layers/LayerInfo",
	"esri/layers/ArcGISDynamicMapServiceLayer",
	"esri/layers/ArcGISTiledMapServiceLayer",
	"esri/layers/FeatureLayer",
	"esri/tasks/IdentifyTask",
	"esri/tasks/IdentifyParameters",
], function (djArray, lang, on, esriRequest, InfoTemplate, Map, LayerInfo, ArcGISDynamicMapServiceLayer,
	ArcGISTiledMapServiceLayer, FeatureLayer, IdentifyTask, IdentifyParameters
) {
	"use strict";
	var detectHtmlPopups;

	/**
	 * Gets the WDFW ID from a table.
	 * @param {Node} node - An HTML Table node.
	 * @returns {(string|null)}
	 */
	function getWdfwId(node) {
		var headers, wdfwId = null, current, re = /^WDFW\s?ID$/i;
		if (node.querySelectorAll) {
			headers = node.querySelectorAll("tr>:first-child");
			for (var i = 0, l = headers.length; i < l; i += 1) {
				current = headers[i];
				if (current.textContent && re.test(current.textContent)) {
					wdfwId = current.parentNode.querySelector(":last-child").textContent;
					break;
				}
			}
		}
		return wdfwId;
	}

	/**
	 * @param {string} wdfwId
	 * @param {string} [imageViewerUrl]
	 */
	function getWdfwImageUrl(wdfwId, imageViewerUrl) {
		var output = null;
		if (!!wdfwId) {
			if (!imageViewerUrl) {
				imageViewerUrl = "./fish-barrier-images/";
			}
			output = [imageViewerUrl, "?id=", wdfwId].join("");
		}
		return output;
	}

	/** For all <a> children of the input node where the href is the same as the text content,
	 * the text content is replaced with the word "link".
	 * @param {Node} node
	 */
	function shortenAnchorText(node) {
		var anchors, a, i, l;
		if (node.querySelectorAll) {
			anchors = node.querySelectorAll("a");
			for (i = 0, l = anchors.length; i < l; i += 1) {
				a = anchors[i];
				if (a.href === a.textContent) {
					a.textContent = "link";
				}
			}
		}
	}

	/** Tests to see if an object has an htmlPopupType property that is either HTML Text or a URL.
	 * @param {Object} layerInfo
	 * @returns {Boolean}
	 */
	function htmlPopupTypeIsHtmlTextOrUrl(layerInfo) {
		return layerInfo.htmlPopupType !== undefined && layerInfo.htmlPopupType !== null && /esriServerHTMLPopupTypeAs(?:(?:HTMLText)|(?:URL))/i.test(layerInfo.htmlPopupType);
	}

	/**
	 * Gets the IDs of the layers that have HTML popups.
	 * @param {(ArcGISDynamicMapServiceLayer|ArcGISTiledMapServiceLayer)} mapServiceLayer
	 * @param {boolean} [returnUrls=undefined] - If truthy, an array of map service URLs will be returned. Otherwise, and array of ID integers will be returned.
	 * @returns {(number[]|string[])}
	 */
	function getIdsOfLayersWithHtmlPopups(mapServiceLayer, returnUrls) {
		var ids = [], layerInfo, i, l, layerId;
		if (mapServiceLayer.layerInfos === undefined) {
			throw new Error("Map service layer does not have a defined \"layerInfos\" property.");
		}

		if (mapServiceLayer.visibleLayers !== undefined) {
			// Loop through all of the visibleLayers.  Each element is a layer ID integer.
			for (i = 0, l = mapServiceLayer.visibleLayers.length; i < l; i += 1) {
				// Get the current layer ID.
				layerId = mapServiceLayer.visibleLayers[i];
				if (layerId === -1) {
					break;
				}
				// Get the layerInfo corresponding to the current layer ID.
				layerInfo = mapServiceLayer.layerInfos[layerId];

				// Add to the output array the ID of any sublayer that has an html popup defined 
				// (and in the case of layers with a visibleLayers property, the sublayer is currently visible).
				if (htmlPopupTypeIsHtmlTextOrUrl(layerInfo)) { //if (Boolean(layerInfo.htmlPopupType) && /esriServerHTMLPopupTypeAs(?:(?:HTMLText)|(?:URL))/i.test(layerInfo.htmlPopupType)) {
					if (returnUrls) {
						ids.push(mapServiceLayer.url + "/" + String(layerId));
					} else {
						ids.push(layerId);
					}
				}
			}
		} else {
			for (i = 0, l = mapServiceLayer.layerInfos.length; i < l; i += 1) {
				layerInfo = mapServiceLayer.layerInfos[i];
				// Add to the output array the ID of any sublayer that has an html popup defined 
				// (and in the case of layers with a visibleLayers property, the sublayer is currently visible).
				if (htmlPopupTypeIsHtmlTextOrUrl(layerInfo)) { //if (Boolean(layerInfo.htmlPopupType) && /esriServerHTMLPopupTypeAs(?:(?:HTMLText)|(?:URL))/i.test(layerInfo.htmlPopupType)) {
					if (layerInfo.visibleLayers === undefined || djArray.indexOf(layerInfo.visibleLayers, layerInfo.id) >= 0) {
						if (returnUrls) {
							ids.push(mapServiceLayer.url + "/" + String(layerInfo.id));
						} else {
							ids.push(layerInfo.id);
						}
					}
				}
			}
		}

		return ids;
	}
	lang.extend(LayerInfo, {
		htmlPopupType: null
	});

	/**
	 * Query the map service to see if any of the layers have HTML popups and store this data in the LayerInfos.
	 * @param {Function} [htmlPopupLayerFoundAction] - Optional.  A function that will be called whenever an HTML popup is found.
	 * @returns {string}
	 */
	detectHtmlPopups = function (htmlPopupLayerFoundAction) {
		var mapService = this, layerInfo, layerUrl, i, l;
		// Query the map service to get the list of layers.

		function handleHtmlPopupResponse(layerResponse) {
			var layerInfo = mapService.layerInfos[layerResponse.id];
			// If the map supports HTML popups, add the layer to the list.  (Do not add any annotation layers, though.)
			if (layerResponse.htmlPopupType !== undefined && /As(?:(?:HTMLText)|(?:URL))$/i.test(layerResponse.htmlPopupType) &&
						layerResponse.type !== undefined && !/Annotation/gi.test(layerResponse.type)) {
				// Add this URL to the list of URLs that supports HTML popups.
				layerInfo.htmlPopupType = layerResponse.htmlPopupType;
				if (typeof (htmlPopupLayerFoundAction) === "function") {
					htmlPopupLayerFoundAction(mapService, layerInfo, layerUrl, layerResponse);
				}
			}
		}

		for (i = 0, l = mapService.layerInfos.length; i < l; i += 1) {
			layerInfo = mapService.layerInfos[i];
			layerUrl = [mapService.url, String(layerInfo.id)].join("/");

			// Query the layers to see if they support html Popups
			esriRequest({
				url: layerUrl,
				content: { f: "json" },
				handleAs: "json",
				callbackParamName: "callback"
			}).then(handleHtmlPopupResponse);
		}
	};

	// Extend each of the types in the array with the same proerties and methods.
	djArray.forEach([ArcGISDynamicMapServiceLayer, ArcGISTiledMapServiceLayer], function (ctor) {
		lang.extend(ctor, {
			detectHtmlPopups: detectHtmlPopups,
			getIdsOfLayersWithHtmlPopups: function () {
				return getIdsOfLayersWithHtmlPopups(this);
			},
			getUrlsOfLayersWithHtmlPopups: function () {
				return getIdsOfLayersWithHtmlPopups(this, true);
			}
		});
	});

	lang.extend(Map, {
		_ignoredLayerRE: null,
		detectHtmlPopupsHasRun: false,
		detectHtmlPopups: function (htmlPopupLayerFoundAction) {
			// Queries all of the map service layers in a map determines which of the layers' sublayers have an HTML Popup defined. 

			var map = this;

			// if (!map || !map.isInstanceOf || !map.isInstanceOf(Map)) {
			// throw new Error("The \"map\" parameter must be of type Map.");
			// }

			// Loop through each of the map service layers.
			djArray.forEach(map.layerIds, function (id) {
				var mapService;

				// Skip layers with an ID that matches the ignore regex.
				if (map._ignoredLayerRE.test(id)) {
					return;
				}

				mapService = map.getLayer(id);

				if (mapService.loaded) {
					if (typeof (mapService.detectHtmlPopups) === "function") {
						mapService.detectHtmlPopups(htmlPopupLayerFoundAction);
					}
				} else {
					mapService.on("load", function (/*layer*/) {
						if (typeof (mapService.detectHtmlPopups) === "function") {
							mapService.detectHtmlPopups(htmlPopupLayerFoundAction);
						}
					});
				}

			});

			this.detectHtmlPopupsHasRun = true;
		},
		identify: function (geometry, identifyCompleteHandler, options, errorHandler) {
			///<summary>Runs an identify task for each map service that has HTML Popup sublayers.</summary>
			///<param name="geometry" type="esri.geometry.Geometry"/>
			///<param name="identifyCompleteHandler">A function that has layer and identifyResults parameters.</param>
			///<param name="options">Use this parameter to override the default identify task options: layerOption, tolerance, and maxAllowableOffset</param>
			///<param name="errorHandler">A function to handler identify task errors.  Function parameters layer, error.</param>
			///<returns type="Number">Returns the number of identify tasks that were performed.</returns>
			var map = this, queryCount = 0;

			// Detect which layers have HTML popups.
			if (!this.detectHtmlPopupsHasRun) {
				this.detectHtmlPopups();
			}

			if (!options) {
				options = {};
			}

			if (!geometry) {
				throw new Error("Geometry not specified.");
			} else if (typeof (identifyCompleteHandler) !== "function") {
				throw new Error("Identify Complete function not defined.");
			}

			// Loop through all of the map services.
			djArray.forEach(map.layerIds, function (layerId) {
				var layer, sublayerIds, idTask, idParams;

				// Skip any layers that match the ignored layers regular expression (if one has been specified).
				if (map._ignoredLayerRE && map._ignoredLayerRE.test(layerId)) {
					return;
				}
				layer = map.getLayer(layerId);
				if (layer.visible) {
					if (typeof (layer.getIdsOfLayersWithHtmlPopups) === "function") {
						sublayerIds = layer.getIdsOfLayersWithHtmlPopups();
						// If there are sublayers defined, run an identify task.
						if (sublayerIds && sublayerIds.length > 0) {
							queryCount += 1;
							idTask = new IdentifyTask(layer.url);
							idParams = new IdentifyParameters();
							idParams.geometry = geometry;
							idParams.layerIds = sublayerIds;
							idParams.mapExtent = map.extent;
							idParams.width = map.width;
							idParams.height = map.height;
							// The following settings are configurable via the 'options' parameter.
							idParams.returnGeometry = options.returnGeometry || true;
							idParams.layerOption = options.layerOption || IdentifyParameters.LAYER_OPTION_ALL;
							idParams.tolerance = options.tolerance || 5;
							idParams.maxAllowableOffset = options.maxAllowableOffset || 5;

							// Execute the identify task
							idTask.execute(idParams, function (idResults) {
								if (typeof (identifyCompleteHandler) === "function") {
									// Execute the handler, passing it the current layer and associated ID results.
									identifyCompleteHandler(layer, idResults);
								}
							}, function (error) {
								if (typeof (errorHandler) === "function") {
									errorHandler(layer, error);
								}
							});
						}

					}
				}

			});

			//TODO: Handle FeatureLayers

			return queryCount;
		},

		popupsEnabled: null,
		enablePopups: function () {
			this.popupsEnabled = true;
		},
		disablePopups: function () {
			this.popupsEnabled = false;
		},
		setupIdentifyPopups: function (options) {
			/// <param name="options" type="Object">
			/// Defines options for setting up identify popups.
			/// ignoredLayerRE: A regular expression.  Any layer with an ID that matches this expression will be ignored by the identify tool.
			/// </param>
			var map = this;

			map.popupsEnabled = true;

			if (options.ignoredLayerRE) {
				map._ignoredLayerRE = options.ignoredLayerRE;
			}

			// Load the HTML Popup data from each of the layers.
			map.detectHtmlPopups();

			// Set up an event handler that will update the HTML popup data when a new layer is added.
			map.on("layer-add-result", function (event) {
				// If there was an error loading the layer, there is nothing to do here.
				if (event.error) {
					return;
				}

				if (map._ignoredLayerRE.test(event.layer.id)) {
					return;
				}

				if (event.layer && event.layer.isInstanceOf !== undefined && (event.layer.isInstanceOf(ArcGISDynamicMapServiceLayer) || event.layer.isInstanceOf(ArcGISTiledMapServiceLayer))) {
					event.layer.detectHtmlPopups();
				}
			});

			map.on("click", function (event) {
				var idTaskCount;

				// If popups are disabled, exit instead of showing the popup.
				if (!map.popupsEnabled) {
					return;
				}

				function loadContent(feature) {
					var div, layer, result, url;
					div = null; //feature.content || null;
					// Load the HTML popup content if it has not already been loaded.
					if (div === null) {
						layer = feature.layer;
						result = feature.result;

						div = document.createElement("div");

						// If there is an object ID field, load the HTML popup.
						// TODO: Get the layer's ObjectID field setting instead of using hard-coded "OBJECTID". Sometimes the ObjectID field has a different name.
						if (feature !== undefined && feature !== null && feature.attributes && feature.attributes.OBJECTID) {
							// Get the map service url.
							url = layer.url;
							// Append the layer ID (except for feature layers, which have the layer id as part of the url).
							if (!layer.isInstanceOf(FeatureLayer)) {
								url += "/" + String(result.layerId);
							}
							// Complete the htmlPopup URL.
							url += "/" + feature.attributes.OBJECTID + "/htmlPopup";

							// Request the HTML Popup
							esriRequest({
								url: url,
								content: { f: "json" },
								handleAs: "json",
								callbackParamName: "callback"
							}).then(function (data) {
								var domParser, htmlPopup, docFrag, bodyChildren, node;
								if (/HTMLText$/i.test(data.htmlPopupType)) {
									domParser = new DOMParser();
									htmlPopup = domParser.parseFromString(data.content, "text/html");
									docFrag = document.createDocumentFragment();
									bodyChildren = htmlPopup.querySelectorAll("body > *:not(script)");

									for (var i = 0, l = bodyChildren.length; i < l; i += 1) {
										node = bodyChildren[i];
										if (node) {
											docFrag.appendChild(node);
										}
									}

									shortenAnchorText(docFrag);

									div.appendChild(docFrag);
								} else if (/URL$/i.test(data.htmlPopupType)) {
									node = document.createElement("a");
									node.href = data.content;
									node.target = "_blank";
									div.appendChild(node);
								}

								// Add WDFW URL;
								(function (wdfwId) {
									var url, a;
									if (wdfwId) {
										url = getWdfwImageUrl(wdfwId);
										a = document.createElement("a");
										a.href = url;
										a.target = "_blank";
										a.appendChild(document.createTextNode("Images"));
										div.insertBefore(a, div.firstChild);
									}
								}(getWdfwId(div)));
							}, function (error) {
								var p;
								p = document.createElement("p");
								p.appendChild(document.createTextNode(error));
								div.appendChild(p);
							});
						} else {
							// Create a table to display attributes if no HTML popup is defined.
							(function () {
								var table, name, value, ignoredAttributes = /^(SHAPE(\.STLength\(\))?)$/i, title, caption, tr;

								table = document.createElement("table");
								table.setAttribute("class", "default-html-popup");
								div.appendChild(table);

								// Add a caption if the result has a display field name.
								title = result.displayFieldName ? feature.attributes[result.displayFieldName] : null;
								if (title) {
									caption = document.createElement("caption");
									caption.innerText = title;
									table.appendChild(caption);
								}

								for (name in feature.attributes) {
									if (!ignoredAttributes.test(name) && feature.attributes.hasOwnProperty(name)) {
										value = feature.attributes[name];
										tr = document.createElement("tr");
										tr.innerHTML = ["<th>", name, "</th><td>", value, "</td>"].join("");
										table.appendChild(tr);
									}
								}
							}());
						}
						feature.content = div;
					}

					return div;
				}

				idTaskCount = map.identify(event.mapPoint, function (layer, idResults) {

					var features, infoTemplate = new InfoTemplate({ content: loadContent });

					// Get the existing features in the info window.  If there are no existing features, create a new array.
					features = map.infoWindow.features || [];

					// Get an array of features...
					(function () {
						var i, l, idResult, feature;

						for (i = 0, l = idResults.length; i < l; i += 1) {
							idResult = idResults[i];
							feature = idResult.feature;
							feature.layer = layer;
							feature.result = idResult;
							feature.setInfoTemplate(infoTemplate);
							features.push(feature);
						}
					}());

					map.infoWindow.setFeatures(features);
					map.infoWindow.show(event.mapPoint, {
						closetFirst: true
					});
				}, {
					tolerance: 20
				}, function (layer, error) {
					/*global console:true */
					if (console !== undefined) {
						console.error(layer, error);
					}
					/*global console:false*/
				});

				if (idTaskCount) {
					map.infoWindow.clearFeatures();
					map.infoWindow.setContent("<progress>Running Identify on layers...</progress>");
					map.infoWindow.show(event.mapPoint);
				}
			});
		}
	});

});
