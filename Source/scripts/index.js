/// <reference path="http://ajax.googleapis.com/ajax/libs/dojo/1.6/dojo/dojo.xd.js"/>
/// <reference path="http://serverapi.arcgisonline.com/jsapi/arcgis/?v=2.2"/>
/// <reference path="dojo.js.uncompressed.js" />
/// <reference path="http://ajax.aspnetcdn.com/ajax/jQuery/jquery-1.5-vsdoc.js "/>
/// <reference path="extentAutoComplete.js"/>
/// <reference path="jquery.pnotify.js"/>
/// <reference path="jquery.ba-bbq.js" />
/// <reference path="json2.js" />
/// <reference path="kmlGraphicsLayer.js" />
/// <reference path="layerList.js" />

(function () {
    $(document).ready(function () {
        $("#mainContainer").css("display", "");
        // Setup the contact us dialog.

        // Set the links to other websites to open in a new window.  
        // Specifically selecting any element that has an href attribute and the value of that attribute does not start with # or mailto.
        $("a.newTab").each(function (index, element) {
            // Store the current value of the href attribute.
            var href = element.href;
            // Set a handler on the click event to open the url in a new window or tab.  (Window or tab is determined by the browser settings.)
            $(element).bind("click", { href: href }, function (event) { window.open(event.data.href); return null; });
            // Change the value of href to #.  (Otherwise the URL will still replace this application AND open in a new tab, which is not what we want.)
            element.href = "#";
        });

        // Set alternating row colors in legend
        $(".alternatingLines tbody tr:odd").addClass("alternate-row");
    });



    dojo.require("dijit.dijit"); // optimize: load dijit layer
    dojo.require("dijit.layout.BorderContainer");
    dojo.require("dijit.layout.TabContainer");
    dojo.require("dijit.layout.AccordionContainer");
    dojo.require("dijit.layout.ContentPane");


    dojo.require("dijit.Toolbar");
    dojo.require("dijit.Menu");

    dojo.require("dojox.layout.ExpandoPane");

    dojo.require("dijit.form.FilteringSelect");
    dojo.require("dojo.data.ItemFileReadStore");


    dojo.require("dojo.parser");

    dojo.require("esri.map");
    //dojo.require("esri.virtualearth.VETiledLayer");
    dojo.require("esri.dijit.BasemapGallery");
    dojo.require("esri.arcgis.utils");
    dojo.require("esri.dijit.Scalebar");
    dojo.require("esri.tasks.query");
    dojo.require("esri.toolbars.navigation");
    dojo.require("esri.dijit.Legend");

    var map = null;
    var extents = null;
    var navToolbar;
    var notices = {};









    function init() {
        function setExtentLink(extent) {
            /// <summary>Sets the extent link in the bookmark tab to the given extent.</summary>
            /// <param name="extent" type="esri.geometry.Envelope">The extent that the link will be set to.</param>
            var extentJson = extent.toJson();
            delete extentJson.spatialReference;
            $("#extentLink").attr("href", $.param.querystring(window.location.protocol + "//" + window.location.host + window.location.pathname, extentJson));
        }

        function setupNorthArrow() {
            // Create the north arrow.
            dojo.create("img", { id: "northArrow", src: "images/NorthArrow.png", alt: "North Arrow" }, "map_root", "last");
        }

        function SetupLayout() {
            var mainContainer = new dijit.layout.BorderContainer({ design: "headline", gutters: false }, "mainContainer");
            mainContainer.addChild(new dijit.layout.ContentPane({ region: "top" }, "headerPane"));
            mainContainer.addChild(new dijit.layout.ContentPane({ region: "center" }, "mapContentPane"));

            var legendPane = new dojox.layout.ExpandoPane({ region: "leading", splitter: true, title: "Tools" }, "legendPane");
            var tabs = new dijit.layout.TabContainer(null, "tabs");
            tabs.addChild(new dijit.layout.ContentPane({ title: "Legend" }, "legendTab"));
            tabs.addChild(new dijit.layout.ContentPane({ title: "Layers" }, "layersTab"));
            var zoomTab = new dijit.layout.ContentPane({ title: "Zoom" }, "zoomTab");
            var zoomAccordion = new dijit.layout.AccordionContainer(null, "zoomAccordion");
            zoomAccordion.addChild(new dijit.layout.ContentPane({ title: "Zoom Controls" }, "zoomControls"));
            zoomAccordion.addChild(new dijit.layout.ContentPane({ title: "Zoom Instructions" }, "zoomInstructions"));
            zoomAccordion.addChild(new dijit.layout.ContentPane({ title: "Bookmark" }, "zoombookmark"));
            tabs.addChild(zoomTab);
            tabs.addChild(new dijit.layout.ContentPane({ title: "Basemap" }, "basemapTab"));
            legendPane.addChild(tabs);
            mainContainer.addChild(legendPane);

            mainContainer.startup();
        }

        SetupLayout();

        var initExtent = new esri.geometry.Extent({
            "xmin": -13938444.981854893,
            "ymin": 5800958.950617068,
            "ymax": 6257746.631649259,
            "xmax": -12960051.019804686,
            "spatialReference": {
                "wkid": 102100
            }
        });

        // Define zoom extents for menu.
        var extentSpatialReference = new esri.SpatialReference({ wkid: 102100 });
        extents = {
            fullExtent: new esri.geometry.Extent({ "xmin": -14058520.2360666, "ymin": 5539437.0343901999, "ymax": 6499798.1008670302, "xmax": -12822768.6769759, "spatialReference": extentSpatialReference }),
            countyExtents: { "Cowlitz": { "xmin": -13716608.1772, "ymin": 5756446.5261, "xmax": -13607638.501, "ymax": 5842754.0508 }, "Whitman": { "xmin": -13163464.6711, "ymin": 5847392.8245, "xmax": -13028774.4496, "ymax": 5984725.1359 }, "Spokane": { "xmin": -13116067.9387, "ymin": 5984489.784, "xmax": -13028809.6233, "ymax": 6114814.6868 }, "Okanogan": { "xmin": -13456929.5548, "ymin": 6097022.1384, "xmax": -13228768.0346, "ymax": 6274958.9602 }, "Whatcom": { "xmin": -13728170.447, "ymin": 6211586.2765, "xmax": -13431350.2501, "ymax": 6275274.979 }, "King": { "xmin": -13641277.0042, "ymin": 5955853.9667, "xmax": -13477001.0149, "ymax": 6070428.8593 }, "Kittitas": { "xmin": -13521532.7745, "ymin": 5899113.9835, "xmax": -13350070.2043, "ymax": 6040226.1383 }, "Yakima": { "xmin": -13527887.9391, "ymin": 5786789.6607, "xmax": -13343374.1361, "ymax": 5956573.2746 }, "Columbia": { "xmin": -13162673.7586, "ymin": 5780181.9819, "xmax": -13091540.6017, "ymax": 5881022.6956 }, "Skagit": { "xmin": -13666072.6368, "ymin": 6156232.4448, "xmax": -13434716.5579, "ymax": 6216862.0714 }, "Wahkiakum": { "xmin": -13773334.2204, "ymin": 5803187.7205, "xmax": -13716034.4264, "ymax": 5842274.2847 }, "San Juan": { "xmin": -13722118.9812, "ymin": 6154236.6866, "xmax": -13659272.347, "ymax": 6246272.0081 }, "Jefferson": { "xmin": -13883451.6533, "ymin": 6026992.6909, "xmax": -13647254.6175, "ymax": 6168652.2854 }, "Lewis": { "xmin": -13733788.4441, "ymin": 5842022.6891, "xmax": -13508975.7523, "ymax": 5908584.5364 }, "Ferry": { "xmin": -13232547.6219, "ymin": 6078547.14, "xmax": -13147311.3041, "ymax": 6274878.086 }, "Pend Oreille": { "xmin": -13094470.0429, "ymin": 6114408.5894, "xmax": -13027916.5477, "ymax": 6274942.0713 }, "Franklin": { "xmin": -13297953.5226, "ymin": 5811290.5149, "xmax": -13157743.3914, "ymax": 5899593.8738 }, "Walla Walla": { "xmin": -13251654.4058, "ymin": 5780326.7638, "xmax": -13134753.0631, "ymax": 5878116.3164 }, "Lincoln": { "xmin": -13244769.7727, "ymin": 5984619.1827, "xmax": -13115603.0047, "ymax": 6099856.8495 }, "Benton": { "xmin": -13344617.6406, "ymin": 5754139.5511, "xmax": -13240449.8207, "ymax": 5897751.643 }, "Clark": { "xmin": -13669582.7159, "ymin": 5707531.0819, "xmax": -13608198.7464, "ymax": 5789926.0889 }, "Pierce": { "xmin": -13675925.5501, "ymin": 5897856.0581, "xmax": -13511306.3151, "ymax": 6008212.5148 }, "Klickitat": { "xmin": -13537868.9285, "ymin": 5717448.7451, "xmax": -13343404.634, "ymax": 5787581.0243 }, "Grant": { "xmin": -13363106.9209, "ymin": 5881154.2164, "xmax": -13243995.6844, "ymax": 6100566.8755 }, "Chelan": { "xmin": -13489786.8267, "ymin": 5984760.3314, "xmax": -13342761.5943, "ymax": 6198989.41 }, "Thurston": { "xmin": -13714908.1752, "ymin": 5903319.5991, "xmax": -13603589.1089, "ymax": 5973834.5544 }, "Clallam": { "xmin": -13899444.6403, "ymin": 6084703.4441, "xmax": -13680883.6168, "ymax": 6189343.3633 }, "Douglas": { "xmin": -13393771.1496, "ymin": 5978080.6643, "xmax": -13241520.921, "ymax": 6132044.942 }, "Stevens": { "xmin": -13180410.3388, "ymin": 6072370.4054, "xmax": -13072245.7038, "ymax": 6274987.4244 }, "Adams": { "xmin": -13288154.3124, "ymin": 5898997.675, "xmax": -13131174.6649, "ymax": 5984917.9955 }, "Pacific": { "xmin": -13823107.8933, "ymin": 5818061.0061, "xmax": -13732083.3359, "ymax": 5908563.6219 }, "Island": { "xmin": -13677515.936, "ymin": 6078202.9272, "xmax": -13617553.3997, "ymax": 6176489.1526 }, "Kitsap": { "xmin": -13696574.1685, "ymin": 6008153.0256, "xmax": -13628515.5078, "ymax": 6102333.7942 }, "Garfield": { "xmin": -13120489.3456, "ymin": 5779994.9236, "xmax": -13049763.0779, "ymax": 5893758.4025 }, "Mason": { "xmin": -13748635.6001, "ymin": 5955512.1077, "xmax": -13670052.185, "ymax": 6041803.2531 }, "Grays Harbor": { "xmin": -13856990.0768, "ymin": 5908013.6975, "xmax": -13709928.0411, "ymax": 6029660.264 }, "Asotin": { "xmin": -13077814.2164, "ymin": 5779598.1341, "xmax": -13014945.7855, "ymax": 5854737.304 }, "Skamania": { "xmin": -13608832.7415, "ymin": 5708314.0933, "xmax": -13526920.5016, "ymax": 5842848.1259 }, "Snohomish": { "xmin": -13632030.2268, "ymin": 6069562.9349, "xmax": -13459351.7812, "ymax": 6156742.2548} }
        };

        var extentData = [];

        // Convert the county JSON objects into esri.geomtry.Extents.
        for (var i in extents.countyExtents) {
            // extents.countyExtents[i] = new esri.geometry.fromJson(extents.countyExtents[i]);
            extentData.push({ name: i, extent: new esri.geometry.fromJson(extents.countyExtents[i]).setSpatialReference(extentSpatialReference) });
        }

        extents.countyExtents = extentData;
        delete extentData;

        map = new esri.Map("map", {
            logo: false,
            extent: initExtent,
            lods: [
		    { "level": 1, "resolution": 1222.99245256249, "scale": 4622324.434309 },
		    { "level": 2, "resolution": 611.49622628138, "scale": 2311162.217155 },
		    { "level": 3, "resolution": 305.748113140558, "scale": 1155581.108577 },
		    { "level": 4, "resolution": 152.874056570411, "scale": 577790.554289 },
		    { "level": 5, "resolution": 76.4370282850732, "scale": 288895.277144 },
		    { "level": 6, "resolution": 38.2185141425366, "scale": 144447.638572 },
		    { "level": 7, "resolution": 19.1092570712683, "scale": 72223.819286 },
		    { "level": 8, "resolution": 9.55462853563415, "scale": 36111.909643 },
		    { "level": 9, "resolution": 4.77731426794937, "scale": 18055.954822 },
		    { "level": 10, "resolution": 2.38865713397468, "scale": 9027.977411 },
		    { "level": 11, "resolution": 1.19432856685505, "scale": 4513.988705 }

		]
        });
        var initBasemap = new esri.layers.ArcGISTiledMapServiceLayer("http://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer");
        map.addLayer(initBasemap);
        notices.updatingMap = $.pnotify({
            pnotify_title: "Updating map...",
            pnotify_text: "Please wait...",
            pnotify_notice_icon: 'ui-icon ui-icon-transferthick-e-w',
            pnotify_nonblock: true,
            pnotify_hide: false,
            pnotify_closer: false,
            pnotify_history: false
        });

        dojo.connect(map, "onLoad", map, function () {
            setupNorthArrow();
            delete setupNorthArrow;
            var scalebar = new esri.dijit.Scalebar({ map: map, attachTo: "bottom-left" });

            function createBasemapGallery() {
                var basemapGallery = new esri.dijit.BasemapGallery({
                    showArcGISBasemaps: true,
                    bingMapsKey: 'Av1bH4keF8rXBtxWOegklgWGCYYz8UGYvBhsWKuvc4Z15kT76xVFOERk8jkKEDvT',
                    map: map
                }, "basemapGallery");

                basemapGallery.startup();

                dojo.connect(basemapGallery, "onError", function (msg) {
                    // TODO: Show error message instead of just closing notification.
                    if (notices.loadingBasemap) {
                        notices.loadingBasemap.pnotify_remove();
                    }
                });

                // Set up code to hide or display basemap-specific legends.
                dojo.connect(basemapGallery, "onSelectionChange", function () {
                    if (notices.loadingBasemap) {
                        notices.loadingBasemap.pnotify_remove();
                    }

                    var basemap = basemapGallery.getSelected();
                });
            }


            createBasemapGallery();
            delete createBasemapGallery;

            function resizeMap() {
                //resize the map when the browser resizes - view the 'Resizing and repositioning the map' section in
                //the following help topic for more details http://help.esri.com/EN/webapi/javascript/arcgis/help/jshelp_start.htm#jshelp/inside_guidelines.htm
                var resizeTimer;
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(function () {
                    map.resize();
                    map.reposition();
                }, 500);
            }

            dojo.connect(dijit.byId('mapContentPane'), 'resize', resizeMap);

            // Zoom to the extent in the query string (if provided).
            // Test example:
            // xmin=-13677603.622831678&ymin=5956814.051290565&xmax=-13576171.686297385&ymax=6004663.630997022
            var qsParams = $.deparam.querystring(true);
            if (qsParams.xmin && qsParams.ymin && qsParams.xmax && qsParams.ymax) {
                var extent = esri.geometry.fromJson(qsParams);
                extent.spatialReference = map.spatialReference;
                map.setExtent(extent);
            }

            setExtentLink(map.extent);

            $("#layerList").layerList(map);

            // Add a graphics layer made from KML.
            var cameraLayer = new wsdot.layers.KmlGraphicsLayer({ id: "Cameras", visible: false, iconWidth: 12, iconHeight: 6, url: "../GetRemoteXml.ashx?url=http://www.wsdot.wa.gov/Traffic/api/HighwayCameras/kml.aspx" });
            var alertLayer = new wsdot.layers.KmlGraphicsLayer({ id: "Highway Alerts", iconWidth: 25, iconHeight: 25, url: "../GetRemoteXml.ashx?url=http://www.wsdot.wa.gov/Traffic/api/HighwayAlerts/kml.aspx" });
            var mtnLayer = new wsdot.layers.KmlGraphicsLayer({ id: "Mtn. Pass Conditions", iconWidth: 19, iconHeight: 15, url: "../GetRemoteXml.ashx?url=http://www.wsdot.wa.gov/Traffic/api/MountainPassConditions/kml.aspx" });

            // Attach an event to each layer's onClick event that will show a jQuery dialog about the clicked graphic.
            dojo.forEach([cameraLayer, alertLayer, mtnLayer], function (layer) {
                map.addLayer(layer);
                dojo.connect(layer, "onClick", map, function (event) {
                    var graphic = event.graphic;
                    if (graphic) {
                        $("#kmlDialog").remove();
                        var kmlDialog = $("#kmlDialog");
                        if (kmlDialog.length < 1) {
                            kmlDialog = $("<div>").attr("id", "kmlDialog");
                        }
                        var screenPoint = esri.geometry.toScreenGeometry(map.extent, map.width, map.height, graphic.geometry);
                        kmlDialog.append(graphic.attributes.description).dialog({
                            title: graphic.attributes.name,
                            position: [screenPoint.x, screenPoint.y]
                        });
                    }
                }, undefined);
            });


        });

        var legend = new esri.dijit.Legend({ map: map }, "legend");
        legend.startup();

        ////// Used for debugging errors
        ////dojo.connect(map, "onLayerAddResult", function (layer, error) {
        ////    if (error) {
        ////        console.warn(error);
        ////    }
        ////    else {
        ////        dojo.connect(layer, "onUpdateEnd", layer, function (error) {
        ////            if (error) {
        ////                console.warn(error);
        ////            }
        ////        });
        ////    }
        ////});

        // Setup update notifications.
        dojo.connect(map, "onUpdateStart", map, function () {
            notices.updatingMap.pnotify_display();
        });
        dojo.connect(map, "onUpdateEnd", map, function () {
            if (notices.updatingMap) {
                notices.updatingMap.pnotify_remove();
            }
        });



        dojo.connect(map, "onZoomEnd", function (extent, zoomFactor, anchor, level) {
            setExtentLink(extent);
        });


        // Setup the navigation toolbar.
        navToolbar = new esri.toolbars.Navigation(map);
        dojo.connect(navToolbar, "onExtentHistoryChange", function () {
            dijit.byId("previousExtentButton").disabled = navToolbar.isFirstExtent();
            dijit.byId("nextExtentButton").disabled = navToolbar.isLastExtent();
        });

        // Set up the zoom select boxes.
        (function () {
            function setupFilteringSelect(featureSet, id) {
                /// <summary>Creates a dijit.form.FilteringSelect from a feature set.</summary>
                /// <param name="featureSet" type="esri.tasks.FeatureSet">A set of features returned from a query.</param>
                var sortByName = function (a, b) { return (a.name < b.name) ? -1 : (a.name > b.name) ? 1 : 0; };
                var data;
                if (featureSet.declaredClass === "esri.tasks.FeatureSet") {
                    var graphic;
                    var nameAttribute = "NAME";
                    data = { identifier: "name", label: "name", items: [] };
                    for (var i = 0, l = featureSet.features.length; i < l; i++) {
                        graphic = featureSet.features[i];
                        data.items.push({
                            name: graphic.attributes[nameAttribute],
                            extent: graphic.geometry.getExtent()
                        });
                    }
                    data.items.sort(sortByName);
                    data = new dojo.data.ItemFileReadStore({ data: data });
                }
                else {
                    featureSet.sort(sortByName);
                    data = new dojo.data.ItemFileReadStore({ data: { identifier: "name", label: "name", items: featureSet} });
                }
                var filteringSelect = new dijit.form.FilteringSelect({
                    id: id,
                    name: "name",
                    store: data,
                    searchAttr: "name",
                    required: false,
                    onChange: function (newValue) {
                        if (this.item != null && this.item.extent != null) {
                            var extent = this.item.extent[0];

                            try {
                                map.setExtent(extent);
                            }
                            catch (e) {
                                if (typeof (console) !== "undefined" && typeof (console.debug) !== "undefined") {
                                    console.debug(e);
                                }
                            }
                        }
                        this.reset();
                    }
                }, id);
            };

            // Setup the zoom controls.
            setupFilteringSelect(extents.countyExtents, "countyZoomSelect");
            delete extents.countyExtents;


            // Setup extents for cities and urbanized area zoom tools.
            var cityQueryTask = new esri.tasks.QueryTask("http://hqolymgis11t/ArcGIS/rest/services/HPMS/WSDOTFunctionalClassBaseMap/MapServer/23");
            var query = new esri.tasks.Query();
            query.where = "1 = 1";
            query.returnGeometry = true;
            query.outFields = ["NAME"];
            cityQueryTask.execute(query, function (featureSet) { setupFilteringSelect(featureSet, "cityZoomSelect"); });

            var urbanAreaQueryTask = new esri.tasks.QueryTask("http://hqolymgis11t/ArcGIS/rest/services/HPMS/WSDOTFunctionalClassBaseMap/MapServer/24");
            query.where = "1 = 1";
            query.returnGeometry = true;
            urbanAreaQueryTask.execute(query, function (featureSet) { setupFilteringSelect(featureSet, "urbanAreaZoomSelect") });

            // Associate labels with select controls, so that clicking on a label activates the corresponding control.
            dojo.attr("countyZoomLabel", "for", "countyZoomSelect");
            dojo.attr("cityZoomLabel", "for", "cityZoomSelect");
            dojo.attr("urbanAreaZoomLabel", "for", "urbanAreaZoomSelect");
        })();

        // Create the button dijits.
        var button = new dijit.form.Button({
            iconClass: "zoomfullextIcon",
            showLabel: false,
            onClick: function () {
                map.setExtent(extents.fullExtent);
            }
        }, "fullExtentButton");

        button = new dijit.form.Button({
            iconClass: "zoomprevIcon",
            showLabel: false,
            onClick: function () {
                navToolbar.zoomToPrevExtent();
            }
        }, "previousExtentButton");

        button = new dijit.form.Button({
            iconClass: "zoomnextIcon",
            showLabel: false,
            onClick: function () {
                navToolbar.zoomToNextExtent();
            }
        }, "nextExtentButton");

        delete button;
    }





    //show map on load
    dojo.addOnLoad(init);
})();