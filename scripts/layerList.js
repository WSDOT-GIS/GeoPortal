/// <reference path="http://ajax.aspnetcdn.com/ajax/jQuery/jquery-1.6.1-vsdoc.js  "/>
/// <reference path="http://ajax.aspnetcdn.com/ajax/jquery.ui/1.8.11/jquery-ui.js"/>
/*global jQuery, dojo */
/*jslint browser: true, es5: true, undef: true, nomen: true, regexp: true, plusplus: true, bitwise: true, newcap: true, strict: true, maxerr: 500, indent: 4 */

(function ($) {
    "use strict"

    dojo.require("dijit.layout.TabContainer");
    dojo.require("dijit.layout.ContentPane");
    dojo.require("dijit.form.Slider");
    dojo.require("dijit.form.CheckBox");


    //// Code snippet: List IDS of all data layers controlled by the layer list.
    // $("*[data-layerId]").map(function(index, value) { return $(value).attr("data-layerId");});

    var settings = {
        layerSource: null,
        map: null,
        tabs: true
    };

    function formatForHtmlId(s, prefix) {
        /// <summary>Removes invalid characters from a string so that it can be used an the ID for an HTML element.</summary>
        var invalidCharRe = /[\s\/\()]+/
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
        var propNames = [], skippedPropNames = [], re;

        if (propNamesAtEnd && propNamesAtEnd.length > 0) {
            re = "";
            $.each(propNamesAtEnd, function (index, propName) {
                if (index > 0) {
                    re += "|"
                }
                re += "(" + propName + ")";
            });
            re = new RegExp(re, "gi");
        }

        for (var propName in obj) {
            if (re && propName.match(re)) {
                skippedPropNames.push(propName);
            }
            else {
                propNames.push(propName);
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

    var methods = {
        init: function (options) {
            /// <summary>
            /// Creates a list of layers for a layerSource.  The "this" keyword is the jQuery object containing the DOM element(s) that will be turned into a layer list.
            /// </summary>
            /// <param name="layerSource" type="Object">This can be either an esri.Map or an array of esri.layer.Layer</param>
            /// <param name="options" type="Object">Options for this control.</param>
            var layerListNode = this;
            var basemapLayerIdRe = /layer(?:(?:\d+)|(?:_osm))/i;

            if (options) {
                $.extend(settings, options);
            }

            var layerSource = settings.layerSource;

            // Set the map setting to equal layerSource if layerSource is an esri.Map object.
            if (layerSource.isInstanceOf && layerSource.isInstanceOf(esri.Map) && settings.map === null) {
                settings.map = layerSource;
            }

            this.addClass("ui-esri-layer-list");

            // Add tab container
            var tabContainer = $("<div>").attr("id", "layerListTabContainer").appendTo(layerListNode);


            function createControlsForLayer(layer, elementToAppendTo) {
                // TODO: Create new ContentPane for "tab" if one does not already exist.
                var checkboxId = formatForHtmlId(layer.id, "checkbox");
                var sliderId = formatForHtmlId(layer.id, "slider");

                // Create a checkbox and label and place inside of a div.
                var checkBox = $("<input>").attr("type", "checkbox").attr("data-layerId", layer.id).attr("id", checkboxId);
                var label = $("<label>").text(layer.wsdotCategory && layer.wsdotCategory === "Basemap" ? "Basemap (" + layer.id + ")" : layer.id);

                // Create a unique ID for the slider for this layer.

                var opacitySlider = $("<div>").attr("id", sliderId).css("width", "300px");
                var layerDiv = $("<div>").attr("data-layerId", layer.id).append(checkBox).append(label).append(opacitySlider);


                // Add the div to the document.
                if (elementToAppendTo) {
                    layerDiv.appendTo(elementToAppendTo);
                }

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

                // Create the checkbox dijit.
                checkBox = new dijit.form.CheckBox({
                    checked: layer.visible,
                    onChange: function (value) {
                        layer.setVisibility(value);
                        opacitySlider.set("disabled", !value);
                    }
                }, dojo.byId(checkBox.attr("id")));

                // Add an array of the dijits that are contained in the control so that they can be destroyed if the layer is removed.
                layerDiv.data("dijits", [opacitySlider, checkBox]);

                return layerDiv;
            }


            // If layerSource is an esri.Map, set the layerSource property to an array of the layers in the map.
            if (layerSource.isInstanceOf && layerSource.isInstanceOf(esri.Map)) {
                layerSource = $(settings.map.layerIds).map(function (index, element) {
                    return settings.map.getLayer(element);
                });
            }

            // Create a sorted list of tab names.
            var tabNames = createSortedPropertyNameList(layerSource);

            var sortById = function (a, b) {
                /// <summary>Used by the Array.sort method to sort elements by their ID property.</summary>
                if (a.id > b.id) { return 1; }
                else if (a.id < b.id) { return -1; }
                else { return 0; }
            }

            var tabIds = [];

            dojo.forEach(tabNames, function (tabName) {
                // Create an array of group names.
                // If one of the groups is called "Other", do not add this item until after the array has been sorted so that "Other" appears at the end of the list.
                var groupNames = createSortedPropertyNameList(layerSource[tabName], ["Other"]);

                var tabId = formatForHtmlId(tabName, "tab");
                tabIds.push(tabId);

                var tabPane = $("<div>").attr("id", tabId).appendTo(tabContainer).attr("data-tab-name", tabName);

                dojo.forEach(groupNames, function (groupName) {
                    var layers = layerSource[tabName][groupName];
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

            var anchorList = $("<ul>").prependTo(tabContainer);
            $(tabIds).each(function (index, tabId) {
                var tabName = $("#" + tabId).attr("data-tab-name")
                $("<a>").attr("href", "#" + tabId).text(tabName).appendTo($("<li>").appendTo(anchorList));
            });
            tabContainer.tabs();



            // If a map setting has been specified, add event handlers to the map so that the layer list contents are updated when a layer is added or removed from the map.
            if (settings.map) {
                // Add layer item to the layer list when it is added to the layerSource.
                dojo.connect(settings.map, "onLayerAddResult", layerListNode, function (layer, error) {
                    var existingControlsForThisLayer = $("div[data-layerId='" + layer.id + "']");
                    if (!existingControlsForThisLayer || existingControlsForThisLayer.length < 1 && !error) {
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
                    dojo.forEach(dijits, function (item) {
                        if (item.destroyRecursive) {
                            item.destroyRecursive(false);
                        }
                    });
                    layerDiv.remove();
                });
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

            // TODO: Loop through all of the groups and put the controls in order based on the layer ID.
            for (var i = 0, l = groups.length; i < l; i += 1) {

            }
            throw new Error("Not implemented");
        }
    };




    $.fn.layerList = function (method) {

        // Method calling logic
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' + method + ' does not exist on jQuery.layerList');
        }
    }
})(jQuery);