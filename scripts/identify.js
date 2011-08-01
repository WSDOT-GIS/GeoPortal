/*global dojo, dijit, esri, jQuery */
/*jslint nomen: true, white:true, devel: true, browser: true, maxerr: 50, indent: 4 */
/// <reference path="http://ajax.aspnetcdn.com/ajax/jQuery/jquery-1.6.2-vsdoc.js"/>
/// <reference path="http://ajax.aspnetcdn.com/ajax/jquery.ui/1.8.14/jquery-ui.js"/>
(function ($) {
    "use strict";
    dojo.require("esri.graphic");
    dojo.require("esri.tasks.identify");
    dojo.require("esri.toolbars.draw");
    dojo.require("esri.symbol");

    function ResultCollection(json) {
        /// <summary>An object that represents multiple identify results from the same layer of a map service.</summary>
        /// <param name="name" type="String">Description</param>
        this.displayFieldName = json.displayFieldName || null;
        this.features = json.features || [];
        this.layerId = json.layerId || null;
        this.layerName = json.layerName || null;

        this.toHtmlTable = function () {
            var table, attrNames = [], row, headOrBody;
            table = $("<table>").addClass("ui-identify-result");

            // Create the table head and body.
            if (this.features.length > 0) {
                // Add the table header and the column headings within.
                headOrBody = $("<thead>").appendTo(table);
                row = $("<tr>").appendTo(headOrBody);

                // Create a collection of attribute names and add a column header for each name.
                $.each(this.features[0].attributes, function (attrName /*, attrValue */) {
                    attrNames.push(attrName);
                    $("<th>").text(attrName).appendTo(row);
                });

                headOrBody = $("<tbody>").appendTo(table);

                // Add all of the attribute values to the table body.
                $.each(this.features, function (index, feature) {
                    row = $("<tr>").appendTo(headOrBody);
                    $.each(attrNames, function (index, attrName) {
                        $("<td>").text(feature.attributes[attrName]).appendTo(row);
                    });
                });
            }

            return table;
        };

    }

    function resultCollectionToTabs(resultCollections) {
        /// <summary>Converts an array of result collections into a jQuery tabs control.</summary>
        /// <param name="resultCollections" type="ResultCollection[]">An array of ResultCollection objects.</param>
        /// <returns type="jQuery UI tabs" />
        var output, select;
        output = $("<div>");
        $("<label>").text("Select a result table").attr("for", "resultTableSelect").appendTo(output);
        select = $("<select>").attr("id", "resultTableSelect").appendTo(output).change(function (eventObject) {
            // Show the currently selected table.
            var value = $(this).val();
            $("table", output).hide();
            $("table[data-layer-id=" + value + "]").show();
        });

        $.each(resultCollections, function (index, resultCollection) {
            var table;
            $("<option>").text(resultCollection.layerName).attr("value", index).appendTo(select);
            table = resultCollection.toHtmlTable().appendTo(output).attr("data-layer-id", index);
            if (index > 0) {
                table.hide();
            }
        });

        return output;
    }

    $.widget("ui.identify", {
        // default options
        options: {
            map: null,
            layers: [],
            drawToolbar: null,
            mapDpi: 96,
            pointSymbol: null,
            lineSymbol: null,
            polygonSymbol: null,
            graphicsLayer: null
        },
        isDrawing: false,
        _addLayer: function (layer /*, error*/) {
            // Add feature layer to the list of identify layers if it supports "Query".
            if (layer && layer.capabilities && layer.capabilities.search(/Query/gi) && !layer.id.match(/layer\d+/)) {
                $("<option>").data("layer", layer).text(layer.id).attr("value", layer.id).appendTo("#ui-identify-layer-select");
            }
            $("#ui-identify-layer-select").change();
        },
        _removeLayer: function (layer) {
            // Remove any option elements associated with this layer.
            $("option", "#ui-identify-layer-select").filter(function () { return $(this).data("layer") === layer; }).remove();
        },
        _create: function () {
            var widget = this,
                map = this.options.map,
                layers, tableDiv, layerIds, toolbar, geometryTypeDescriptions;

            function addControlToTable(control, label) {
                var rowDiv = $("<div>"),
                    cellDiv = $("<div>").appendTo(rowDiv),
                    id;

                id = $(control).attr("id");
                $("<label>").attr("for", id).text(label).appendTo(cellDiv);
                cellDiv = $("<div>").appendTo(rowDiv).append(control);

                return rowDiv;
            }

            function handleMapServiceChange(/*event*/) {
                var selectedMapService, sublayerSelect, childLayerInfos;
                selectedMapService = $(":selected", this).data("layer"); // "this" is the element that was changed.
                sublayerSelect = $("#ui-identify-sublayer-select");
                $("option", sublayerSelect).remove();
                // Get only the layer infos that are not group layers.
                childLayerInfos = $(selectedMapService.layerInfos).filter(function () { return this.subLayerIds === null; });

                childLayerInfos.map(function (index, layerInfo) {
                    return $("<option>").attr({
                        value: layerInfo.id,
                        name: layerInfo.name,
                        selected: true,
                        title: layerInfo.name
                    }).text(layerInfo.name).appendTo(sublayerSelect);
                });
            }

            function getIdentifyParameters(geometry) {
                /// <summary>Creates an IdentifyParameters object using the values that the user has selected.</summary>
                var map = widget.options.map, idParams = new esri.tasks.IdentifyParameters();
                if (typeof (widget.options.mapDpi) !== "undefined") {
                    idParams.dpi = widget.options.mapDpi;
                }
                idParams.geometry = geometry;
                idParams.tolerance = Number($("#ui-identify-tolerance-input").attr("value"));
                idParams.layerIds = $("#ui-identify-sublayer-select option:selected", widget.element).map(function (index, option) {
                    return Number($(option).attr("value"));
                }).toArray();
                ////idParams.returnGeometry = false;
                idParams.layerOption = $("#ui-identify-layer-option-select option:selected", widget.element).attr("value");

                ////idParams.width = map.width;
                ////idParams.height = map.heigth;
                idParams.mapExtent = map.extent;
                ////idParams.spatialReference = map.spatialReference;

                return idParams;
            }

            function performIdentify(geometry) {
                var layerOption, layer, idTask, idParameters;

                widget.isDrawing = false;
                $("#ui-identify-identify-button").button("option", "label", "Identify");

                function handleIdentifyComplete(identifyResults) {
                    var symbol, options = widget.options, resultAttributes, tabs, graphic;

                    widget.enable();


                    // Group the results by layer.
                    resultAttributes = {};
                    $.each(identifyResults, function (index, idResult) {
                        var layerUniqueId = "layer" + String(idResult.layerId);
                        // If no attributes for this layer have been recorded, create a new property for the layer and assign it an empty array.
                        if (!resultAttributes.hasOwnProperty(layerUniqueId)) {
                            resultAttributes[layerUniqueId] = new ResultCollection(idResult);
                        }
                        // Add the current results to the appropriate layer's group.
                        resultAttributes[layerUniqueId].features.push(idResult.feature);
                    });

                    // Convert from object into array.  (Now that the results are grouped by layer, we no longer need to refer to each set of results by key.)
                    resultAttributes = $.map(resultAttributes, function (resultAttr, index) {
                        return resultAttr;
                    });


                    // Choose a symbol based on the type of geometry.
                    symbol = geometry.type === "point" ? options.pointSymbol : geometry.type === "polyline" ? options.lineSymbol : options.polygonSymbol;
                    graphic = new esri.Graphic(geometry, symbol, { results: resultAttributes });
                    options.graphicsLayer.add(graphic);
                }

                function handleIdentifyError(error) {
                    widget.enable();
                    if (console && console.error) {
                        console.error(error);
                    }
                }

                // Turn off the drawing toolbar so user can once again interact with the map.
                widget.options.drawToolbar.deactivate();

                // Create the symbols if they are not already defined.
                if (!widget.options.pointSymbol) {
                    widget.options.pointSymbol = new esri.symbol.SimpleMarkerSymbol();
                }
                if (!widget.options.lineSymbol) {
                    widget.options.lineSymbol = new esri.symbol.SimpleLineSymbol();
                }
                if (!widget.options.polygonSymbol) {
                    widget.options.polygonSymbol = new esri.symbol.SimpleFillSymbol();
                }

                // Get the option that is selected in the map service layer select control.
                layerOption = $("#ui-identify-layer-select :selected");
                if (!layerOption.length || !$.hasData(layerOption[0])) {
                    if (console && console.error) {
                        console.error("Selected option has no associated data");
                    }
                    return;
                }

                layer = layerOption.data("layer");
                idTask = layerOption.data("identifyTask");

                // If an identify task has not been created for this layer, create one.
                if (!idTask) {
                    layerOption.data("identifyTask", new esri.tasks.IdentifyTask(layer.url));
                    idTask = layerOption.data("identifyTask");
                }


                idParameters = getIdentifyParameters(geometry);

                widget.disable();
                idTask.execute(idParameters, handleIdentifyComplete, handleIdentifyError);
            }

            function performDraw() {
                if (!widget.isDrawing) {
                    var geometryType = $("#ui-identify-geometry-type-select :selected").attr("value");

                    // If the draw toolbar has not yet been created, create it now.
                    if (!widget.options.drawToolbar) {
                        widget.options.drawToolbar = new esri.toolbars.Draw(widget.options.map, { showTooltips: true });
                        dojo.connect(widget.options.drawToolbar, "onDrawEnd", performIdentify);
                    }
                    // TODO: Change label.
                    widget.options.drawToolbar.activate(geometryType);
                    widget.isDrawing = true;
                    $(this).button("option", "label", "Cancel Drawing");
                } else {
                    widget.options.drawToolbar.deactivate();
                    widget.isDrawing = false;
                    $(this).button("option", "label", "Identify");
                }
            }

            // If the graphics layer does not yet exist, create it and add it to the map.
            if (!widget.options.graphicsLayer) {
                widget.options.graphicsLayer = new esri.layers.GraphicsLayer({
                    id: "Identify Results",
                    displayOnPan: (!dojo.isIE || dojo.isIE < 9)
                });
                widget.options.map.addLayer(widget.options.graphicsLayer);

                widget._clickHandler = dojo.connect(widget.options.graphicsLayer, "onClick", function (event) {
                    // The event object contains screenPoint, mapPoint, and graphic attributes.
                    var tabs, dialog;
                    tabs = event.graphic.attributes.results.length < 1 ? $("<p>").text("No results.") : resultCollectionToTabs(event.graphic.attributes.results);
                    dialog = $("<div>").append(tabs).dialog({
                        title: "Results",
                        close: function () {
                            $(this).dialog("destroy").remove();
                        },
                        buttons: {
                            "Close": function () { $(this).dialog("close"); }
                        }
                    });

                    dialog.dialog("option", { width: 640, height: 480 });
                });
            }

            this.element.addClass("ui-widget ui-widget-content ui-corner-all ui-identify");
            tableDiv = $("<div>").addClass("table ").appendTo(this.element);

            // Setup layer select controls
            addControlToTable($("<select>").attr({
                id: "ui-identify-layer-select",
                title: "Select which map service layer you want to use with the identify tool."
            }).change(handleMapServiceChange), "Layer").appendTo(tableDiv);

            // Setup layer option controls.
            addControlToTable($("<select>").attr("id", "ui-identify-layer-option-select"), "Layer Option").appendTo(tableDiv);

            // Setup tolerance controls
            addControlToTable($("<input>").attr({
                type: "number",
                value: 10,
                min: 0,
                id: "ui-identify-tolerance-input",
                title: "The distance in screen pixels from the specified geometry within which the identify should be performed.",
                name: "tolerance"
            }), "Tolerance (in pixels)").appendTo(tableDiv);

            // Setup sublayer select
            addControlToTable($("<select>").attr({ "id": "ui-identify-sublayer-select", multiple: true, name: "sublayers" }), "Sublayers").appendTo(tableDiv);

            $.each(["LAYER_OPTION_ALL", "LAYER_OPTION_TOP", "LAYER_OPTION_VISIBLE"], function (index, optionConstantName) {
                $("<option>").attr("value", esri.tasks.IdentifyParameters[optionConstantName]).text(optionConstantName.substring(13)).appendTo("#ui-identify-layer-option-select");
            });

            addControlToTable($("<select>").attr({ "id": "ui-identify-geometry-type-select" }), "Geometry Type").appendTo(tableDiv);
            $("<optgroup>").attr("label", "Lines").appendTo("#ui-identify-geometry-type-select");
            $("<optgroup>").attr("label", "Polygons").appendTo("#ui-identify-geometry-type-select");
            ////$("<optgroup>").attr("label", "Arrows").appendTo("#ui-identify-geometry-type-select");





            geometryTypeDescriptions = [
                                        { "geometryType": "POINT", "description": "Draws a point.", "selected": true },
                                        { "geometryType": "EXTENT", "description": "Draws an extent box." },
                                        { "geometryType": "LINE", "description": "Draws a line." },
                                        { "geometryType": "POLYLINE", "description": "Draws a polyline." },
                                        { "geometryType": "FREEHAND_POLYLINE", "description": "Draws a freehand polyline." },
                                        { "geometryType": "POLYGON", "description": "Draws a polygon." },
                                        { "geometryType": "FREEHAND_POLYGON", "description": "Draws a freehand polygon."}];

            $.each(geometryTypeDescriptions, function (index, geometryTypeDesc) {
                var text, option, select;
                select = $("#ui-identify-geometry-type-select");
                text = geometryTypeDesc.geometryType.replace("_", " ");
                option = $("<option>").text(text).attr({ value: esri.toolbars.Draw[geometryTypeDesc.geometryType], title: geometryTypeDesc.description });
                if (geometryTypeDesc.selected) {
                    option.attr("selected", geometryTypeDesc.selected);
                }
                if (geometryTypeDesc.geometryType.match(/ARROW/gi)) {
                    option.appendTo("optgroup[label=Arrows]", select);
                } else if (geometryTypeDesc.geometryType.match(/LINE/gi)) {
                    option.appendTo("optgroup[label=Lines]", select);
                } else if (geometryTypeDesc.geometryType.match(/(?:POLYGON)|(?:EXTENT)/gi)) {
                    option.appendTo("optgroup[label=Polygons]", select);
                } else {
                    option.appendTo(select);
                }
            });
            toolbar = $("<div>").addClass("ui-identify-toolbar").appendTo(widget.element);
            $("<button>").attr({ id: "ui-identify-identify-button", type: "button" }).button({ label: "Identify" }).appendTo(toolbar).click(performDraw);
            $("<button>").attr({ type: "button" }).button({ label: "Clear" }).appendTo(toolbar).click(function () { widget.options.graphicsLayer.clear(); });
            if (map) {
                this._layerAddHandler = dojo.connect(map, "onLayerAddResult", widget._addLayer);
                this._layerRemoveHandler = dojo.connect(map, "onLayerRemove", widget._removeLayer);

                // Get a sorted list of layer ids.
                layerIds = $.map(map.layerIds, function (layerId) { return layerId; }).sort();

                // Add the layer to the list of layers.
                $.each(layerIds, function (index, layerId) {
                    var layer = map.getLayer(layerId);
                    widget._addLayer(layer);
                });

            } else {
                throw new Error("No valid map was provided");
            }

            layers = this.options.layers;
            if (layers && layers.length) {
                $.each(layers, widget._addLayer);
            }
        },
        enable: function () {
            $.Widget.prototype.enable.apply(this, arguments);
        },
        disable: function () {
            $.Widget.prototype.disable.apply(this, arguments);
        },
        destroy: function () {
            $.Widget.prototype.destroy.apply(this, arguments); // default destroy
            this.element.removeClass("ui-identify");
            dojo.forEach([this._layerAddHandler, this._layerRemoveHandler, this._clickHandler], dojo.disconnect); // Remove map event handlers
        }
    });
} (jQuery));