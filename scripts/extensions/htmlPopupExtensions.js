/// <reference path="../jsapi_vsdoc_v32_2012.js" />
/*global require, esri, dojo */
/*jslint nomen: true, white: true, browser: true */

// Copyright (C)2012 Washington State Department of Transportation (WSDOT).  Released under the MIT license (http://opensource.org/licenses/MIT).

require(["dojo/_base/array", "dojo/dom-construct", "dojo/on", "dojo/query", "dojo/NodeList-manipulate", "esri/map", "esri/layers/agsdynamic", "esri/layers/agstiled", "esri/tasks/identify"], function(djArray, domConstruct, on, query) {
	"use strict";


		var detectHtmlPopups;

		function htmlPopupTypeIsHtmlTextOrUrl(layerInfo) {
			return layerInfo.htmlPopupType !== undefined && layerInfo.htmlPopupType !== null && /esriServerHTMLPopupTypeAs(?:(?:HTMLText)|(?:URL))/i.test(layerInfo.htmlPopupType);
		}

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
			}
			else {
				for (i = 0, l = mapServiceLayer.layerInfos.length; i < l; i += 1) {
					layerInfo = mapServiceLayer.layerInfos[i];
					// Add to the output array the ID of any sublayer that has an html popup defined 
					// (and in the case of layers with a visibleLayers property, the sublayer is currently visible).
					if (htmlPopupTypeIsHtmlTextOrUrl(layerInfo)) { //if (Boolean(layerInfo.htmlPopupType) && /esriServerHTMLPopupTypeAs(?:(?:HTMLText)|(?:URL))/i.test(layerInfo.htmlPopupType)) {
						if (layerInfo.visibleLayers === undefined || dojo.indexOf(layerInfo.visibleLayers, layerInfo.id) >= 0) {
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
		dojo.extend(esri.layers.LayerInfo, {
			htmlPopupType: null
		});

		detectHtmlPopups = function (htmlPopupLayerFoundAction) {
			/// <summary>Query the map service to see if any of the layers have HTML popups and store this data in the LayerInfos.</summary>
			/// <param name="htmlPopupLayerFoundAction" type="Function">Optional.  A function that will be called whenever an HTML popup is found.</param>
			/// <returns type="String" />
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
				esri.request({
					url: layerUrl,
					content: { f: "json" },
					handleAs: "json",
					callbackParamName: "callback"
				}).then(handleHtmlPopupResponse);
			}
		};

		// Extend each of the types in the array with the same proerties and methods.
		djArray.forEach([esri.layers.ArcGISDynamicMapServiceLayer, esri.layers.ArcGISTiledMapServiceLayer], function (ctor) {
			dojo.extend(ctor, {
				detectHtmlPopups: detectHtmlPopups,
				getIdsOfLayersWithHtmlPopups: function () {
					return getIdsOfLayersWithHtmlPopups(this);
				},
				getUrlsOfLayersWithHtmlPopups: function () {
					return getIdsOfLayersWithHtmlPopups(this, true);
				}
			});
		});



		dojo.extend(esri.Map, {
			_ignoredLayerRE: null,
			detectHtmlPopupsHasRun: false,
			detectHtmlPopups: function (htmlPopupLayerFoundAction) {
				// Queries all of the map service layers in a map determines which of the layers' sublayers have an HTML Popup defined. 

				var map = this;

				// if (!map || !map.isInstanceOf || !map.isInstanceOf(esri.Map)) {
				// throw new Error("The \"map\" parameter must be of type esri.Map.");
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
						dojo.connect(mapService, "onLoad", function (/*layer*/) {
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
								idTask = new esri.tasks.IdentifyTask(layer.url);
								idParams = new esri.tasks.IdentifyParameters();
								idParams.geometry = geometry;
								idParams.layerIds = sublayerIds;
								idParams.mapExtent = map.extent;
								idParams.width = map.width;
								idParams.height = map.height;
								// The following settings are configurable via the 'options' parameter.
								idParams.returnGeometry = options.returnGeometry || true;
								idParams.layerOption = options.layerOption || esri.tasks.IdentifyParameters.LAYER_OPTION_ALL;
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
				dojo.connect(map, "onLayerAddResult", function (layer, error) {
					// If there was an error loading the layer, there is nothing to do here.
					if (error) {
						return;
					}

					if (map._ignoredLayerRE.test(layer.id)) {
						return;
					}

					if (layer && layer.isInstanceOf !== undefined && (layer.isInstanceOf(esri.layers.ArcGISDynamicMapServiceLayer) || layer.isInstanceOf(esri.layers.ArcGISTiledMapServiceLayer))) {
						layer.detectHtmlPopups();
					}
				});

				dojo.connect(map, "onClick", function (event) {
					var idTaskCount;

					// If popups are disabled, exit instead of showing the popup.
					if (!map.popupsEnabled) {
						return;
					}

					function setupRelatedImagesLink(container) {
						/// <summary>Sets up RFIP "Related Images" link to show the list within the popup window.</summary>
						var link, imgListUrl;
						// <a href="http://webprod4.wsdot.loc/geospatial/imageservice/Rfip.svc/list/{965119BC-EC0F-448C-B5E5-5CCE0A198901}" onclick="window.open(this.href); return false;">Related Images</a>
						// Style of container will be .id-result.
						// $(".id-result a[onclick^='window.open(this.href)']")
						// Select all links that are set to open in another window via onclick event attribute.
						// link = $("a[href*=Rfip]", container).first();
						link = query("a[href*=Rfip]", container)[0];
						// Get the image list URL.
						imgListUrl = link.href; // link.attr("href");
						// Remove the existing onclick attribute.
						link.onclick = null; // link.attr("onclick", null);

						// Create a new on click event.
						link.onclick = function (event) {
							var a, url, progressBar;
							a = event.currentTarget;
							url = a.href;
							a.onclick = null;
							progressBar = domConstruct.toDom("<progress>Loading related image data...</progress>");
							domConstruct.place(progressBar, a, "replace");


							esri.request({
								url: url,
								handleAs: "text",
								load: function (data) {
									var html, list, listItems, div, link;
									html = domConstruct.toDom(data);
									list = query("ul", html);
									listItems = list.length >= 0 ? query("li", list[0]) : [];

									if (listItems.length > 0) {
										div = domConstruct.toDom("<div class='ui-identify-hyperlink-list'>");
										list.appendTo(div);
										domConstruct.place(div, progressBar, "replace");
										link = query("li a", list);
										if (link.length > 0) {
											link = link[0];
											link.onclick = function () {
												window.open(this.href, "imgWin");
												return false;
											};
										}


									} else {
										domConstruct.place("<p>No related images found for this feature.</p>", progressBar, "replace");
									}
								},
								error: function (error) {
									domConstruct.place(domConstruct("<p>", {
										innerHTML: "Error loading related image data." + String(error)
									}), progressBar, "replace");
								}
							}, {
								useProxy: true,
								usePost: false
							});

							return false;
						};
					}

					function loadContent(feature) {
						var div, layer, result, url;
						div = feature.content || null;
						// Load the HTML popup content if it has not already been loaded.
						if (div === null) {
							layer = feature.layer;
							result = feature.result;

							div = domConstruct.create("div");

							// If there is an object ID field, load the HTML popup.
							// TODO: Get the layer's ObjectID field setting instead of using hard-coded "OBJECTID". Sometimes the ObjectID field has a different name.
							if (feature !== undefined && feature !== null && feature.attributes && feature.attributes.OBJECTID) {
								// Get the map service url.
								url = layer.url;
								// Append the layer ID (except for feature layers, which have the layer id as part of the url).
								if (!layer.isInstanceOf(esri.layers.FeatureLayer)) {
									url += "/" + String(result.layerId);
								}
								// Complete the htmlPopup URL.
								url += "/" + feature.attributes.OBJECTID + "/htmlPopup";

								// Request the HTML Popup
								esri.request({
									url: url,
									content: { f: "json" },
									handleAs: "json",
									callbackParamName: "callback"
								}).then(function (data) {
									if (/HTMLText$/i.test(data.htmlPopupType)) {
										domConstruct.place(data.content, div);
									} else if (/URL$/i.test(data.htmlPopupType)) {
										on(domConstruct.create("a", {
											attr: {
												href: "#"
											}
										}, div), "click", function () {
											window.open(data.content);
										});
									}
									setupRelatedImagesLink(div);
								}, function (error) {
									domConstruct("p", { innerHTML: error }, div);
								});
							} else {
								// Create a table to display attributes if no HTML popup is defined.
								(function () {
									var table, name, value, ignoredAttributes = /^(SHAPE(\.STLength\(\))?)$/i, title;

									table = domConstruct("table", {
										className: "default-html-popup"
									}, div);

									// Add a caption if the result has a display field name.
									title = result.displayFieldName ? feature.attributes[result.displayFieldName] : null;
									if (title) {
										domConstruct("caption", { innerHTML: title }, table);
									}

									for (name in feature.attributes) {
										if (!ignoredAttributes.test(name) && feature.attributes.hasOwnProperty(name)) {
											value = feature.attributes[name];
											domConstruct.toDom(["<tr><th>", name, "</th><td>", value, "</td></tr>"].join(""), table);
										}
									}
								} ());
							}
							feature.content = div;
						}

						return div;
					}

					idTaskCount = map.identify(event.mapPoint, function (layer, idResults) {

						var features, infoTemplate = new esri.InfoTemplate({ content: loadContent });

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
