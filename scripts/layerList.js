/// <reference path="http://ajax.aspnetcdn.com/ajax/jQuery/jquery-1.6.1-vsdoc.js  "/>
/// <reference path="http://ajax.aspnetcdn.com/ajax/jquery.ui/1.8.11/jquery-ui.js"/>
/*global jQuery, dojo */
/*jslint browser: true, es5: true, undef: true, nomen: true, regexp: true, plusplus: true, bitwise: true, newcap: true, strict: true, maxerr: 500, indent: 4 */

/*
Copyright (c) 2011 Washington State Department of Transportation

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>
*/

/*
This jQuery plugin is used to create a layer list control for an ArcGIS JavaScript API web application.
Prerequisites:
    ArcGIS JavaScript API
    jQuery
    jQuery UI
*/

(function ($) {
    "use strict";

    // Chrome supports the built-in slider control for HTML5's <input type="range" /> tag, so it does not need to use the dojo slider.
    if (!dojo.isChrome) {
        dojo.require("dijit.form.Slider");
    }

    //// Code snippet: List IDS of all data layers controlled by the layer list.
    // $("*[data-layerId]").map(function(index, value) { return $(value).attr("data-layerId");});

    if (esri.layers.LayerInfo) {
        dojo.extend(esri.layers.LayerInfo, {
            isGroupLayer: function () {
                return this.sublayerIds !== null;
            },
            isVisibleAt: function (scale) {
                /// <summary>Determines if the current sublayer can be seen at the current scale.</summary>
                // The minScale and maxScale properties of the LayerInfo object are not available from layers based on pre-version 10 SP1 map services.
                // Return true if there is no scale information;
                /// <returns type="Boolean" />
                if (typeof (this.minScale) === "undefined" || typeof (this.maxScale) === "undefined") {
                    return true;
                } else {
                    return (this.minScale === 0 || this.minScale >= scale) && (this.maxScale === 0 || this.maxScale <= scale);
                }
            }
        });
    }

    if (esri.layers.Layer) {
        dojo.extend(esri.layers.Layer, {
            getVisibleLayerInfos: function (scale) {
                /// <summary>Returns only the layerInfos that are visible at the given scale.</summary>
                /// <returns type="esri.layers.LayerInfo[]" />
                if (typeof (this.layerInfos) === "undefined") {
                    return null;
                }

                var visibleLayerInfos = [];
                dojo.forEach(this.layerInfos, function (layerInfo) {
                    if (layerInfo.isVisibleAt(scale)) {
                        visibleLayerInfos.push(layerInfo);
                    }
                });
                return visibleLayerInfos;
            },
            areAnySublayersVisible: function (scale) {
                /// <summary>Determines if any of the sublayers in the layer are visible at the current scale.  Only supported for ArcGIS 10.01 and higher map services.</summary>
                if (this.version < 10.01) {
                    return true;
                } else {
                    var visibleLayerInfos = this.getVisibleLayerInfos();
                    return visibleLayerInfos.length > 0;
                }
            }
        });
    }

    var settings = {
        layerSource: null,
        map: null,
        tabs: true
    }, methods = {
        init: function (options) {
            /// <summary>
            /// Creates a list of layers for a layerSource.  The "this" keyword is the jQuery object containing the DOM element(s) that will be turned into a layer list.
            /// </summary>
            /// <param name="layerSource" type="Object">This can be either an esri.Map or an array of esri.layer.Layer</param>
            /// <param name="options" type="Object">Options for this control.</param>
            var layerListNode = this,
                basemapLayerIdRe = /layer(?:(?:\d+)|(?:_osm))/i, tabContainer;

            function formatForHtmlId(s, prefix) {
                /// <summary>Removes invalid characters from a string so that it can be used an the ID for an HTML element.</summary>
                var invalidCharRe = /[\s\/\()]+/;
                while (invalidCharRe.test(s)) {
                    s = s.replace(invalidCharRe, "-");
                }
                s = s.replace(/-$/, "");
                // Add the prefix if one was provided.
                if (prefix) {
                    s = prefix + "-" + s;
                }
                return s;
            }

            function createSortedPropertyNameList(obj, propNamesAtEnd) {
                /// <summary>Returns a sorted array of property names for an object.</summary>
                /// <param name="obj" type="Object">An object that has properties.</param>
                /// <param name="propNamesAtEnd" type="Array">An array of property names that will be placed at the end of the list (instead of being sorted).</param>
                var propNames = [], skippedPropNames = [], re, propName = null;

                if (propNamesAtEnd && propNamesAtEnd.length > 0) {
                    re = "";
                    $.each(propNamesAtEnd, function (index, propName) {
                        if (index > 0) {
                            re += "|";
                        }
                        re += "(" + propName + ")";
                    });
                    re = new RegExp(re, "gi");
                }

                for (propName in obj) {
                    if (obj.hasOwnProperty(propName)) {
                        if (re && propName.match(re)) {
                            skippedPropNames.push(propName);
                        } else {
                            propNames.push(propName);
                        }
                    }
                }
                propNames.sort();
                skippedPropNames.sort();
                // propNames = propNames.concat(skippedPropNames);
                dojo.forEach(skippedPropNames, function (propName) {
                    propNames.push(propName);
                });

                return propNames;
            }

            function setClassForOutOfScaleLayerControls(level) {
                /// <summary>Adds the "outOfScale" class to the controls that represent layers that cannot be seen in the map's current scale.</summary>
                /// <param name="level" type="Number">Optional.  The level that the map is at.  If omitted, the map's getLevel function will be called to get this info.</param>
                if (typeof (level) === "undefined") {
                    level = settings.map.getLevel();
                }
                var layerDivs, scale, layers;
                // Get all of the elements that have a data-layerId attribute and remove the "outOfScale" class from them all.
                layerDivs = $("*", layerListNode).removeClass("outOfScale");
                // Get the corresponding layers from the map.
                layers = $.map(layerDivs, function (layerDiv) {
                    var layerId = $(layerDiv).attr("data-layerId");
                    return settings.map.getLayer(layerId);
                });

                // Filter out the layers that do not have a layerInfos
                scale = settings.map.getScale(level);
                layers = $.grep(layers, function (layer) {
                    return typeof (layer.layerInfos) !== "undefined" && layer.layerInfos.length > 0;
                });

                $.each(layers, function (index, layer) {
                    var visibleLayerCount = 0,
                        currentLayerDiv = $("[data-layerId='" + layer.id + "']");

                    // Add the outOfScale class to sublayer controls that we know aren't visible at the current scale.
                    // Count the layers that ARE visible.
                    $.each(layer.layerInfos, function (index, layerInfo) {
                        if (!layerInfo.isVisibleAt(scale)) {
                            $("[data-sublayer-id=" + layerInfo.id + "]", currentLayerDiv).addClass("outOfScale");
                        } else {
                            visibleLayerCount += 1;
                        }
                    });

                    // If there are no visible sublayers at the current scale, add the outOfScale class to the layer's div tag.
                    if (visibleLayerCount < 1) {
                        currentLayerDiv.addClass("outOfScale");
                    }
                });
            }

            if (options) {
                $.extend(settings, options);
            }

            // Set the map setting to equal layerSource if layerSource is an esri.Map object.
            if (settings.layerSource.isInstanceOf && settings.layerSource.isInstanceOf(esri.Map) && settings.map === null) {
                settings.map = settings.layerSource;
            }

            this.addClass("ui-esri-layer-list");

            // Add tab container
            tabContainer = $("<div>").attr("id", "layerListTabContainer").appendTo(layerListNode);


            function createControlsForLayer(layer, elementToAppendTo) {
                /// <summary>Creates the HTML controls associated with a layer</summary>
                var checkboxId, sliderId, opacitySlider, layerDiv, metadataList, sublayerList, controlsToolbar, label,
                    parentLayers, sublayerListItems, checkbox;

                function createSublayerControls(layerInfo) {
                    var list,
                        sublayerListItem = $("<li>").attr("data-sublayer-id", layerInfo.id),  // The list item that represents the current sub layer.
                        cbId = checkboxId + String(layerInfo.id);                             // The ID that will be given to the current sublayer's checkbox.

                    function setSublayerVisibility(event) {
                        /// <summary>Sets the visibility</summary>
                        /// <param name="event" type="Object">This event object should have the following properties: data.layer, data.sublayerId.</param>
                        var layer = event.data.layer,
                            sublayerId = event.data.sublayerId,
                            visibleLayers = [],
                        // Select all checked child sublayer checkboxes.
                            sublayerCheckboxes = $("ul input[type=checkbox]", layerDiv),
                            visibleLayerInfos = sublayerCheckboxes.filter(":checked").map(function (index, item) { return layer.layerInfos[$(item).data("sublayerId")]; }),
                            checked = this.checked;

                        if (visibleLayerInfos.length < 1) {
                            visibleLayers = [-1];
                        } else {
                            sublayerCheckboxes.each(function (index, checkbox) {
                                // Get the layer info associated with the current checkbox.
                                var layerInfo,
                                    uncheckedParents = $("> [type=checkbox]", $(checkbox).parentsUntil("div").filter("li")).not(":checked").not(checkbox)
                                if (checkbox.checked && uncheckedParents.length < 1) {
                                    layerInfo = layer.layerInfos[$(checkbox).data("sublayerId")];
                                    // If there are no child layers, add this layer to the visible layer list.
                                    if (layerInfo.subLayerIds === null || layerInfo.subLayerIds.length < 1) {
                                        visibleLayers.push(layerInfo.id);
                                    }
                                }
                            });
                            if (visibleLayers.length < 1) {
                                visibleLayers.push(-1);
                            }
                        }

                        // Apply the list of visible layers.
                        layer.setVisibleLayers(visibleLayers);
                    }

                    function createSublayerList() {
                        // Get the sublayerInfo objects that correspond to the current layerInfo's subLayerIds.
                        var sublayerInfos = $.map(layerInfo.subLayerIds, function (subLayerId) {
                            var sublayerInfos = [], i, l, layerInfo = null;
                            for (i = 0, l = layer.layerInfos.length; i < l; i++) {
                                layerInfo = layer.layerInfos[i];
                                if (layerInfo.id === subLayerId) {
                                    return layerInfo;
                                }
                            }
                            return null;
                        });

                        list = $("<ul>").appendTo(sublayerListItem);

                        $.each(sublayerInfos, function (index, layerInfo) {
                            createSublayerControls(layerInfo).appendTo(list);
                        });
                    }

                    // Add a checkbox for the sublayer if the layer has the ability to set visibility of sublayers.
                    if (layer.setVisibleLayers) {
                        checkbox = $("<input>").attr("id", cbId).attr({
                            type: "checkbox",
                            checked: layerInfo.defaultVisibility
                        }).data({
                            "sublayerId": layerInfo.id
                        }).appendTo(sublayerListItem);

                        checkbox.change({
                            layer: layer,
                            sublayerId: layerInfo.id
                        }, setSublayerVisibility);
                    }

                    if (layerInfo.subLayerIds) {
                        // Create the link that shows or hides the list of sublayers for the current layer.
                        $("<a>").attr("href", "#").text(layerInfo.name).appendTo(sublayerListItem).click(function () {

                            $("ul", sublayerListItem).toggle();
                        });

                        createSublayerList();

                    }
                    else {
                        $("<label>").attr("for", cbId).text(layerInfo.name).appendTo(sublayerListItem);
                    }
                    return sublayerListItem;
                }

                function createSublayerLink(layer) {
                    if (layer.layerInfos && layer.layerInfos.length > 0) {
                        $("<a>").attr("title", "Toggle sublayer list").attr("href", "#").text(layer.wsdotCategory && layer.wsdotCategory === "Basemap" ? "Basemap (" + layer.id + ")" : layer.id).insertBefore(label).click(function () { sublayerList.toggle(); });
                        label.remove();
                        // Add sublayer information
                        parentLayers = $.grep(layer.layerInfos, function (item) { return item && item.parentLayerId === -1; });
                        sublayerList = $("<ul>").appendTo(layerDiv).hide();
                        sublayerListItems = $.each(parentLayers, function (index, layerInfo) {
                            createSublayerControls(layerInfo).appendTo(sublayerList);
                        });

                    }
                }

                function showSublayerControls(layer) {
                    var dialog = $("<div>").dialog({
                        title: "Sublayers",
                        modal: true,
                        open: function () {
                            var sublayerListItems, parentLayers, list;
                            if (layer.layerInfos) {
                                list = $("<ul>").appendTo(this);
                                parentLayers = $.grep(layer.layerInfos, function (item) { return item && item.parentLayerId === -1; });
                                sublayerListItems = $.each(parentLayers, function (index, layerInfo) {
                                    createSublayerControls(layerInfo).appendTo(list);
                                });
                            }
                        },
                        close: function () {
                            $(this).dialog("destroy").remove();
                        }
                        /*
                        ,
                        buttons: {
                        "Submit": function () {
                        $(this).dialog("close");
                        },
                        "Cancel": function () {
                        $(this).dialog("close");
                        }
                        }
                        */
                    });
                }

                // TODO: Create new ContentPane for "tab" if one does not already exist.
                checkboxId = formatForHtmlId(layer.id, "checkbox");
                sliderId = formatForHtmlId(layer.id, "slider");

                layerDiv = $("<div>").attr("data-layerId", layer.id);

                // Create a checkbox and label and place inside of a div.
                $("<input>").attr("type", "checkbox").attr("data-layerId", layer.id).attr("id", checkboxId).appendTo(layerDiv);
                label = $("<label>").text(layer.wsdotCategory && layer.wsdotCategory === "Basemap" ? "Basemap (" + layer.id + ")" : layer.id).appendTo(layerDiv);

                controlsToolbar = $("<div>").addClass("layer-toolbar").css("display", "inline").css("position", "absolute").css("right", "2em").appendTo(layerDiv);
                ////if (layer.setVisibleLayers && dojo.isIE && dojo.isIE < 9) {
                ////    $("<a>").attr({ title: "Sublayers", attr: "#" }).addClass("layer-sublayer-link").text("+").appendTo(controlsToolbar).click(function () {
                ////        showSublayerControls(layer);
                ////    });
                ////}

                $("<a>").attr("title", "Toggle opacity slider").attr("href", "#").appendTo(controlsToolbar).text("o").click(function () {
                    var node = (typeof (opacitySlider.domNode) !== "undefined") ? opacitySlider.domNode : opacitySlider;
                    $(node).toggle();
                });



                // Add metadata information if available
                if (layer.metadataUrls && layer.metadataUrls.length > 0) {

                    $("<a>").attr("title", "Toggle metadata links").addClass("layer-metadata-link").attr("href", "#").text("m").appendTo(controlsToolbar).click(function () { metadataList.toggle(); });
                    if (dojo.isIE && dojo.isIE < 9) {
                        // older versions of IE don't support CSS :before and :after, limiting how we can format a list.  So in IE we won't actually use an UL.
                        metadataList = $("<div>").text("Metadata: ").appendTo(layerDiv);
                        $.each(layer.metadataUrls, function (index, metadataUrl) {
                            if (index > 0) {
                                $("<span>").text(",").appendTo(metadataList);
                            }
                            $("<a>").attr("href", "#").text(index + 1).appendTo(metadataList).click(function () { window.open(metadataUrl); });
                        });
                    } else {
                        // Create an unordered list, which will be styled via CSS.
                        metadataList = $("<ul>").addClass("metadata-list").appendTo(layerDiv);
                        $.each(layer.metadataUrls, function (index, metadataUrl) {
                            $("<li>").append($("<a>").attr("href", "#").text(index + 1)).appendTo(metadataList).click(function () { window.open(metadataUrl); });
                        });
                    }
                    metadataList.hide();
                }



                if (typeof (layer.setVisibleLayers) !== "undefined") {
                    if (layer.loaded) {
                        createSublayerLink(layer);
                        setClassForOutOfScaleLayerControls();
                    } else {
                        dojo.connect(layer, "onLoad", function (layer) { createSublayerLink(layer); setClassForOutOfScaleLayerControls() });
                    }
                }

                // Add the div to the document.
                if (elementToAppendTo) {
                    layerDiv.appendTo(elementToAppendTo);
                }

                // Create the opacity slider
                if (dojo.isChrome) {
                    opacitySlider = $("<input>").attr({ "id": sliderId, "type": "range", "min": 0, "max": 1, "step": 0.1 }).css({ "display": "block", "width": "100%" }).appendTo(layerDiv).attr("disabled", true).hide().change(function (value) {
                        layer.setOpacity(this.value);
                    });
                } else {
                    opacitySlider = $("<div>").attr("id", sliderId).css("width", "300px").appendTo(layerDiv);
                    // Create an opacity slider for the layer.
                    opacitySlider = new dijit.form.HorizontalSlider({
                        minimum: 0.0,
                        maximum: 1.0,
                        value: 1.0,
                        discreteValues: 100,
                        showButtons: true,
                        onChange: function (value) {
                            layer.setOpacity(value);
                        },
                        disabled: layer.visible !== true
                    }, dojo.byId(sliderId));
                    $(opacitySlider.domNode).hide();

                    // Add an array of the dijits that are contained in the control so that they can be destroyed if the layer is removed.
                    layerDiv.data("dijits", [opacitySlider]);
                }

                $("#" + checkboxId).attr("checked", layer.visible).change(function (eventHandler) {
                    layer.setVisibility(this.checked);
                    if (opacitySlider.set) {
                        opacitySlider.set("disabled", !this.checked);
                    } else {
                        $(opacitySlider).attr("disabled", !this.checked);
                    }
                });



                return layerDiv;
            }


            // If layerSource is an esri.Map, set the layerSource property to an array of the layers in the map.
            if (settings.layerSource.isInstanceOf && settings.layerSource.isInstanceOf(esri.Map)) {
                settings.layerSource = $(settings.map.layerIds).map(function (index, element) {
                    return settings.map.getLayer(element);
                });
            }

            // Create a sorted list of tab names.
            var tabNames = createSortedPropertyNameList(settings.layerSource);

            function sortById(a, b) {
                /// <summary>Used by the Array.sort method to sort elements by their ID property.</summary>
                if (a.id > b.id) { return 1; }
                else if (a.id < b.id) { return -1; }
                else { return 0; }
            }

            var tabIds = [];

            dojo.forEach(tabNames, function (tabName) {
                // Create an array of group names.
                // If one of the groups is called "Other", do not add this item until after the array has been sorted so that "Other" appears at the end of the list.
                var groupNames = createSortedPropertyNameList(settings.layerSource[tabName], ["Other"]);

                var tabId = formatForHtmlId(tabName, "tab");
                tabIds.push(tabId);

                var tabPane = $("<div>").attr("id", tabId).appendTo(tabContainer).attr("data-tab-name", tabName);

                dojo.forEach(groupNames, function (groupName) {
                    var layers = settings.layerSource[tabName][groupName];
                    // Sort the layers in each group by the value of their id properties
                    layers.sort(sortById);

                    // Create a new div for each group.
                    var groupDiv = $("<div>").attr("data-group", groupName).append($("<span>").html(groupName).addClass("esriLegendServiceLabel")).appendTo(tabPane);

                    // Add controls for each layer in the group.
                    dojo.forEach(layers, function (layer) {
                        createControlsForLayer(layer, groupDiv);
                    });
                });


            });

            ////tabContainer = dijit.layout.TabContainer({ style: "height: 100%; width: 100%" }, tabContainer[0]);
            ////dojo.forEach(tabIds, function (tabId) {
            ////    var tabName = $("#" + tabId).attr("data-tab-name")
            ////    var contentPane = new dijit.layout.ContentPane({ title: tabName }, tabId);
            ////    tabContainer.addChild(contentPane);
            ////});
            ////tabContainer.startup();

            // Create the jQueryUI tab container only if there is more than one tab.
            if (tabIds.length > 1) {
                var anchorList = $("<ul>").prependTo(tabContainer);
                $(tabIds).each(function (index, tabId) {
                    var tabName = $("#" + tabId).attr("data-tab-name");
                    $("<a>").attr("href", "#" + tabId).text(tabName).appendTo($("<li>").appendTo(anchorList));
                });
                tabContainer.tabs();
            }



            // If a map setting has been specified, add event handlers to the map so that the layer list contents are updated when a layer is added or removed from the map.
            if (settings.map) {
                // Add layer item to the layer list when it is added to the layerSource.
                dojo.connect(settings.map, "onLayerAddResult", layerListNode, function (layer, error) {
                    var existingControlsForThisLayer = $("div[data-layerId='" + layer.id + "']");

                    if (!dojo.isIE || dojo.isIE >= 9) {
                        setClassForOutOfScaleLayerControls();
                    }

                    if (!existingControlsForThisLayer || (existingControlsForThisLayer.length < 1 && !error)) {
                        var category;
                        if (layer.id.match(basemapLayerIdRe)) {
                            category = "Basemap";
                        } else {
                            category = "Other";
                        }


                        // Get the div for the group this layer belongs to.
                        var groupDiv = $("div[data-group='" + category + "']");

                        var tabDiv = $("div[data-tab-name='Main']");


                        // If the group div does not already exist, create it.
                        if (!groupDiv || groupDiv.length < 1) {
                            groupDiv = $("<div>").attr("data-group", category).append($("<span>").html(category).addClass("esriLegendServiceLabel")).appendTo(tabDiv);
                        }

                        var layerDiv = createControlsForLayer(layer, groupDiv);

                        groupDiv.append(layerDiv);
                    }


                });

                // When a layerSource layer is removed, also remove it from the layer list.
                dojo.connect(settings.map, "onLayerRemove", layerListNode, function (layer) {
                    var layerDiv = $("div[data-layerId='" + layer.id + "']");
                    // Destroy dijits in the layerDiv.
                    var dijits = layerDiv.data("dijits");
                    if (dijits) {
                        dojo.forEach(dijits, function (item) {
                            if (item.destroyRecursive) {
                                item.destroyRecursive(false);
                            }
                        });
                    }
                    layerDiv.remove();
                });



                if (typeof (settings.map.getScale) !== "undefined") {
                    dojo.connect(settings.map, "onZoomEnd", function (extent, zoomFactor, anchor, level) { setClassForOutOfScaleLayerControls(level); });
                    if (!dojo.isIE || dojo.isIE >= 9) {
                        dojo.connect(settings.map, "onUpdateEnd", setClassForOutOfScaleLayerControls);
                    }
                }


            }

            return this;
        },
        add: function (layer) {
            throw new Error("The add method has not yet been implemented.");
        },
        remove: function (layer) {
            throw new Error("The remove method has not yet been implemented.");
        },
        sort: function (groupName) {
            /// <summary>Sorts the elements in each group by their layer ids.</summary>
            var groups;
            if (groupName) {
                groups = $("div[data-group='" + groupName + "']");
            }
            else {
                groups = $("div[data-group]");
            }

            ////// TODO: Loop through all of the groups and put the controls in order based on the layer ID.
            ////for (var i = 0, l = groups.length; i < l; i += 1) {

            ////}
            throw new Error("Not implemented");
        }
    };




    $.fn.layerList = function (method) {

        // Method calling logic
        if (methods[method]) {
            // If the name of a method is specified, call that method.  Pass all arguments to that method except for the first (the method's name).
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            // If no method name is specified, call the init method with the specified arguments.
            return methods.init.apply(this, arguments);
        } else {
            // If the name of a non-existant method has been specified, add an error message.
            $.error('Method ' + method + ' does not exist on jQuery.layerList');
        }
    };
} (jQuery));