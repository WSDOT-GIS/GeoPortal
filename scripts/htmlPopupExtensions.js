/*global jQuery:true, esri:true, dojo:true */
(function ($) {
    "use strict";


    function addExtensions() {
        function getIdsOfLayersWithHtmlPopups(mapServiceLayer, returnUrls) {
            var ids = [], layerInfo, i, l, layerId;
            if (typeof (mapServiceLayer.layerInfos) === "undefined") {
                throw new Error("Map service layer does not have a defined \"layerInfos\" property.");
            }

            if (typeof (mapServiceLayer.visibleLayers) !== "undefined") {
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
                    if (Boolean(layerInfo.htmlPopupType) && /esriServerHTMLPopupTypeAs(?:(?:HTMLText)|(?:URL))/i.test(layerInfo.htmlPopupType)) {
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
                    if (Boolean(layerInfo.htmlPopupType) && /esriServerHTMLPopupTypeAs(?:(?:HTMLText)|(?:URL))/i.test(layerInfo.htmlPopupType)) {
                        if (typeof (layerInfo.visibleLayers) === "undefined" || dojo.indexOf(layerInfo.visibleLayers, layerInfo.id) >= 0) {
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

        function detectHtmlPopups(htmlPopupLayerFoundAction) {
            /// <summary>Query the map service to see if any of the layers have HTML popups and store this data in the LayerInfos.</summary>
            /// <param name="htmlPopupLayerFoundAction" type="Function">Optional.  A function that will be called whenever an HTML popup is found.</param>
            /// <returns type="String" />
            var mapService = this, layerInfo, layerUrl, i, l;
            // Query the map service to get the list of layers.

            for (i = 0, l = mapService.layerInfos.length; i < l; i += 1) {
                layerInfo = mapService.layerInfos[i], layerUrl = [mapService.url, String(layerInfo.id)].join("/");
                // Query the layers to see if they support html Popups
                $.get(layerUrl, { f: "json" }, function (layerResponse, textStatus) {
                    var layerInfo = mapService.layerInfos[layerResponse.id];
                    // If the map supports HTML popups, add the layer to the list.  (Do not add any annotation layers, though.)
                    if (/success/i.test(textStatus)) {
                        if (typeof (layerResponse.htmlPopupType) !== "undefined" && /As(?:(?:HTMLText)|(?:URL))$/i.test(layerResponse.htmlPopupType) &&
                                typeof (layerResponse.type) !== "undefined" && !/Annotation/gi.test(layerResponse.type)) {
                            // Add this URL to the list of URLs that supports HTML popups.
                            layerInfo.htmlPopupType = layerResponse.htmlPopupType;
                            if (typeof (htmlPopupLayerFoundAction) === "function") {
                                htmlPopupLayerFoundAction(mapService, layerInfo, layerUrl, layerResponse);
                            }
                        }
                    }
                }, "jsonp");
            }
        }

        // Extend each of the types in the array with the same proerties and methods.
        dojo.forEach([esri.layers.ArcGISDynamicMapServiceLayer, esri.layers.ArcGISTiledMapServiceLayer], function (ctor) {
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
            detectHtmlPopups: function (htmlPopupLayerFoundAction, mapQueryCompleteAction, layerQueryCompleteAction) {
                // Queries all of the map service layers in a map determines which of the layers' sublayers have an HTML Popup defined. 
                ////var mapServiceUrlRe = /MapServer\/?$/i, layerUrlRe = /(?:(?:Map)|(?:Feature))Server\/\d+\/?$/i ;

                var map = this;

                // if (!map || !map.isInstanceOf || !map.isInstanceOf(esri.Map)) {
                // throw new Error("The \"map\" parameter must be of type esri.Map.");
                // }

                // Loop through each of the map service layers.
                dojo.forEach(map.layerIds, function (id) {
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
                        dojo.connect(mapService, "onLoad", function (layer) {
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
                dojo.forEach(map.layerIds, function (layerId) {
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
                var map = this, pointSymbol, lineSymbol, polygonSymbol;

                map.popupsEnabled = true;

                if (options.ignoredLayerRE) {
                    map._ignoredLayerRE = options.ignoredLayerRE;
                }

                // TODO: add symbols to the supported options.

                // map.detectHtmlPopups(function(id, layerId, layerUrl, layerResponse) {
                // console.log("Html Popup Layer found", [id, layerId, layerUrl, layerResponse]);
                // });
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

                    if (layer && typeof (layer.isInstanceOf) !== "undefined" && (layer.isInstanceOf(esri.layers.ArcGISDynamicMapServiceLayer) || layer.isInstanceOf(esri.layers.ArcGISTiledMapServiceLayer))) {
                        layer.detectHtmlPopups();
                    }
                });

                // Create symbols for selected graphics.
                pointSymbol = new esri.symbol.SimpleMarkerSymbol().setColor("#00ffff");
                lineSymbol = new esri.symbol.SimpleLineSymbol().setColor("#00ffff");
                polygonSymbol = new esri.symbol.SimpleFillSymbol().setColor("00ffff");


                function selectGeometry(geometry, attributes) {
                    var graphic, symbol;
                    map.graphics.clear();
                    // Set the appropriate symbol based on the geometry type.
                    symbol = geometry.isInstanceOf(esri.geometry.Point) ? pointSymbol : geometry.isInstanceOf(esri.geometry.Polyline) ? lineSymbol : geometry.isInstanceOf(esri.geometry.Polygon) ? polygonSymbol : null;
                    // Create the graphic.
                    graphic = new esri.Graphic(geometry, symbol, attributes || null);
                    map.graphics.add(graphic);
                    map.graphics.refresh();
                }

                dojo.connect(map, "onClick", function (event) {
                    var dialog, buttons, idTaskCount;

                    // If popups are disabled, exit instead of showing the popup.
                    if (!map.popupsEnabled) {
                        return;
                    }

                    function loadContent(div) {
                        var layer, result;
                        // Load the HTML popup content if it has not already been loaded.
                        if (div.contents().length < 1) {
                            layer = div.data("layer");
                            result = div.data("result");

                            // If there is an object ID field, load the HTML popup.
                            if (typeof (result.feature) !== "undefined" && result.feature !== null && result.feature.attributes && result.feature.attributes.OBJECTID) {
                                // Get the map service url.
                                var url = layer.url;
                                // Append the layer ID (except for feature layers, which have the layer id as part of the url).
                                if (!layer.isInstanceOf(esri.layers.FeatureLayer)) {
                                    url += "/" + String(result.layerId);
                                }
                                // Complete the htmlPopup URL.
                                url += "/" + result.feature.attributes.OBJECTID + "/htmlPopup";

                                $.get(url, { f: "json" }, function (data, textStatus) {
                                    if (textStatus === "success") {
                                        if (/HTMLText$/i.test(data.htmlPopupType)) {
                                            $(data.content).appendTo(div);
                                        } else if (/URL$/i.test(data.htmlPopupType)) {
                                            $("<a>").attr("href", "#").click(function () {
                                                window.open(data.content);
                                            }).appendTo(div);
                                        }
                                    } else {
                                        $("<p>").text(textStatus).appendTo(div);
                                    }
                                }, "jsonp");
                            } else {
                                var dl = $("<dl>");
                                $.each(result.feature.attributes, function (name, value) {
                                    $("<dt>").text(name).appendTo(dl);
                                    $("<dd>").text(value).appendTo(dl);
                                });
                                dl.appendTo(div);
                            }

                            // 
                        }
                    }

                    function closeExistingDialogs() {
                        // Close any pre-existing dialogs.
                        $('.result-dialog').dialog("close");
                    }

                    function setPosition(position) {
                        /// Shows the ".id-result" element at the specified position and hides all others.
                        var all, current, currentIndex, lastIndex, result;
                        if (typeof (position) === "undefined" || position === null) {
                            throw new Error("Required parameter \"position\" not provided.");
                        }
                        all = $(".id-result", dialog);
                        current = all.filter(":visible");
                        if (current.length > 1) {
                            current = current.first();
                        }
                        currentIndex = current.index();
                        lastIndex = all.length - 1;

                        // If the position is a string (i.e., first, previous, next, or last), set position to a number.
                        if (typeof (position) === "string") {
                            if (/d+/.test(position)) {
                                position = Number(position); // Convert position to a number if it is a numerical string.
                            } else if (/first/i.test(position)) { // Set position to 0 if it is currently set to "first". 
                                position = 0;
                            } else if (/prev(?:ious)?/i.test(position)) {
                                position = currentIndex - 1;
                            } else if (/next/i.test(position)) {
                                position = currentIndex + 1;
                            } else if (/last/i.test(position)) {
                                position = lastIndex;
                            }
                        }

                        // Change the position if possible. Not possible if position is out of range or already at the current position.
                        if (position !== currentIndex && position >= 0 && position <= lastIndex) {
                            // Hide the current element.
                            all.hide("fast");
                            // Show the element at the desired position.
                            current = all.filter(function (index) {
                                return index === position;
                            }).show("fast");

                            result = current.data("result");
                            if (result && result.feature) {
                                selectGeometry(result.feature.geometry, result.feature.attributes);
                            }
                            $("span.result-position", dialog.parent()).text(String(position + 1));
                            $("span.result-layer", dialog.parent()).text(result.layerName);
                        } else {
                            // If this is the first result...
                            if (map.graphics.graphics.length < 1) {
                                result = current.data("result");
                                if (result && result.feature) {
                                    selectGeometry(result.feature.geometry, result.feature.attributes);
                                }
                            }
                        }
                        // Update the dialog title with the current result number.
                        loadContent(current);
                    }

                    // Close any pre-existing dialogs.
                    closeExistingDialogs();

                    // Create a new dialog.
                    dialog = $("<div>").addClass('result-dialog').data("hasResults", false).dialog({
                        position: [event.screenPoint.x, event.screenPoint.y],
                        buttons: {
                            First: function () {
                                setPosition("first");
                            },
                            Previous: function () {
                                setPosition("previous");
                            },
                            Next: function () {
                                setPosition("next");
                            },
                            Last: function () {
                                setPosition("last");
                            }
                        },
                        title: "Result&nbsp;<span class='result-position' />&nbsp;of&nbsp;<span class='result-total' /><br /><span class='result-layer' />",
                        close: function () {
                            map.graphics.clear();
                            $(this).dialog("destroy");
                        }
                    });

                    // Style buttons
                    buttons = $(".ui-dialog-buttonset button", dialog.parent());
                    // Style the "first" button.
                    $(buttons[0]).button("option", {
                        icons: { primary: "ui-icon-seek-first" },
                        text: false,
                        label: "first result"
                    });
                    $(buttons[1]).button("option", {
                        icons: { primary: "ui-icon-seek-prev" },
                        text: false,
                        label: "previous result"
                    });
                    $(buttons[2]).button("option", {
                        icons: { primary: "ui-icon-seek-next" },
                        text: false,
                        label: "next result"
                    });
                    $(buttons[3]).button("option", {
                        icons: { primary: "ui-icon-seek-end" },
                        text: false,
                        label: "last result"
                    });

                    $("<progress>").text("Running Identify on layers...").appendTo(dialog);
                    idTaskCount = map.identify(event.mapPoint, function (layer, idResults) {
                        var totalSpan;
                        idTaskCount--;
                        // Remove the progress bar.
                        // Add a layer property to the identify results.
                        if (!idResults || !idResults.length) {
                            var resultTotal = $("span.result-total", dialog).text();
                            if (!dialog.data("hasResults") && idTaskCount < 1) {
                                $("progress", dialog).replaceWith('No results found');
                                dialog.dialog("option", "title", null);
                            }
                            return;
                        }

                        totalSpan = $("span.result-total", dialog.parent());
                        // If the total already has a value add to it.  Otherwise set it to the count of the results.
                        if (totalSpan.text().length > 0) {
                            totalSpan.text(String(Number(totalSpan.text()) + idResults.length));
                        } else {
                            totalSpan.text(String(idResults.length));
                        }

                        dojo.forEach(idResults, function (result) {
                            var progress = $("progress", dialog);

                            dialog.data("hasResults", true);

                            var resultDiv = $("<div>").addClass("id-result").appendTo(dialog).data({
                                result: result,
                                layer: layer
                            });
                            if (progress.length > 0) {
                                progress.remove();
                                setPosition(0);
                                $("span.result-position", dialog.parent()).text("1");
                                $("span.result-layer", dialog.parent()).text(result.layerName);
                            }
                        });
                    }, {
                        tolerance: 20
                    }, function (layer, error) {
                        console.error(layer, error);
                    });

                    // Remove the dialog of there are no ID tasks.
                    if (idTaskCount === 0) {
                        closeExistingDialogs();
                    }
                });
            }
        });

    }

    dojo.require("esri.map");
    dojo.require("esri.layers.agsdynamic");
    dojo.require("esri.layers.agstiled");
    dojo.require("esri.tasks.identify");
    dojo.addOnLoad(addExtensions);

} (jQuery));
