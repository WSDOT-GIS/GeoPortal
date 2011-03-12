/// <reference path="http://serverapi.arcgisonline.com/jsapi/arcgis/?v=2.2"/>
/// <reference path="http://ajax.googleapis.com/ajax/libs/jquery/1.5.1/jquery.js"/>
/// <reference path="http://ajax.googleapis.com/ajax/libs/jqueryui/1.8.10/jquery-ui.js"/>
/// <reference path="scripts/extentAutoComplete.js"/>

// Setup the contact us dialog.
$(document).ready(function () {
    $("#contactUsDialog").dialog({ title: "Contact Us", autoOpen: false, modal: true });
    $("#contactUsLink").bind('click', function (eventObject) {
        $("#contactUsDialog").dialog('open');
    });
    $("#fullExtentButton").button({ icons: { primary: 'ui-icon-search', secondary: 'ui-icon-arrow-4-diag' }, text: false });
    $("#previousExtentButton").button({ icons: { primary: 'ui-icon-search', secondary: 'ui-icon-arrowthick-1-w' }, text: false })
    $("#nextExtentButton").button({ icons: { primary: 'ui-icon-search', secondary: 'ui-icon-arrowthick-1-e' }, text: false })
    $("#zoomAcordion").accordion({ autoHeight: false });
});

dojo.require("dijit.dijit"); // optimize: load dijit layer
dojo.require("dijit.layout.BorderContainer");
dojo.require("dijit.layout.TabContainer");
dojo.require("dijit.layout.ContentPane");
dojo.require("dijit.Toolbar");
dojo.require("dijit.form.DropDownButton");
dojo.require("dijit.Dialog");
dojo.require("dijit.Menu");
dojo.require("dijit.form.CheckBox");
dojo.require("dijit.form.FilteringSelect");
dojo.require("dojo.data.ItemFileReadStore");

dojo.require("dojo.parser");

dojo.require("esri.map");
dojo.require("esri.virtualearth.VETiledLayer");
dojo.require("esri.dijit.BasemapGallery");
dojo.require("esri.arcgis.utils");
dojo.require("esri.dijit.Legend");
dojo.require("esri.dijit.Scalebar");
dojo.require("esri.tasks.query");
dojo.require("esri.toolbars.navigation");

var map = null;
var extents = null;
var navToolbar;

//function handleLayerCheckboxClick() {
//    // Get all of the checked checkboxes.
//    var checkedBoxes = dojo.query("[id^=layer]:checked");
//    var regex = /layer(\d+)checkbox/i
//    var visibleLayers = dojo.map(checkedBoxes, function(item, index, array) { return Number(item.id.match(regex)[1]); });
//    functionalClassLayer.setVisibleLayers(visibleLayers);
//    functionalClassLayer.refresh();
//}

function setupNorthArrow() {
    // Create the north arrow.
    dojo.create("img", { id: "northArrow", src: "images/NorthArrow.png", alt: "North Arrow" }, "map_root", "last");
}

function init() {
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
    extents = {
        fullExtent: new esri.geometry.Extent({ "xmin": -14058520.2360666, "ymin": 5539437.0343901999, "ymax": 6499798.1008670302, "xmax": -12822768.6769759, "SpatialReference": { "wkid": 102100} }),
        countyExtents: { "Cowlitz": { "xmin": -13716608.1772, "ymin": 5756446.5261, "xmax": -13607638.501, "ymax": 5842754.0508 }, "Whitman": { "xmin": -13163464.6711, "ymin": 5847392.8245, "xmax": -13028774.4496, "ymax": 5984725.1359 }, "Spokane": { "xmin": -13116067.9387, "ymin": 5984489.784, "xmax": -13028809.6233, "ymax": 6114814.6868 }, "Okanogan": { "xmin": -13456929.5548, "ymin": 6097022.1384, "xmax": -13228768.0346, "ymax": 6274958.9602 }, "Whatcom": { "xmin": -13728170.447, "ymin": 6211586.2765, "xmax": -13431350.2501, "ymax": 6275274.979 }, "King": { "xmin": -13641277.0042, "ymin": 5955853.9667, "xmax": -13477001.0149, "ymax": 6070428.8593 }, "Kittitas": { "xmin": -13521532.7745, "ymin": 5899113.9835, "xmax": -13350070.2043, "ymax": 6040226.1383 }, "Yakima": { "xmin": -13527887.9391, "ymin": 5786789.6607, "xmax": -13343374.1361, "ymax": 5956573.2746 }, "Columbia": { "xmin": -13162673.7586, "ymin": 5780181.9819, "xmax": -13091540.6017, "ymax": 5881022.6956 }, "Skagit": { "xmin": -13666072.6368, "ymin": 6156232.4448, "xmax": -13434716.5579, "ymax": 6216862.0714 }, "Wahkiakum": { "xmin": -13773334.2204, "ymin": 5803187.7205, "xmax": -13716034.4264, "ymax": 5842274.2847 }, "San Juan": { "xmin": -13722118.9812, "ymin": 6154236.6866, "xmax": -13659272.347, "ymax": 6246272.0081 }, "Jefferson": { "xmin": -13883451.6533, "ymin": 6026992.6909, "xmax": -13647254.6175, "ymax": 6168652.2854 }, "Lewis": { "xmin": -13733788.4441, "ymin": 5842022.6891, "xmax": -13508975.7523, "ymax": 5908584.5364 }, "Ferry": { "xmin": -13232547.6219, "ymin": 6078547.14, "xmax": -13147311.3041, "ymax": 6274878.086 }, "Pend Oreille": { "xmin": -13094470.0429, "ymin": 6114408.5894, "xmax": -13027916.5477, "ymax": 6274942.0713 }, "Franklin": { "xmin": -13297953.5226, "ymin": 5811290.5149, "xmax": -13157743.3914, "ymax": 5899593.8738 }, "Walla Walla": { "xmin": -13251654.4058, "ymin": 5780326.7638, "xmax": -13134753.0631, "ymax": 5878116.3164 }, "Lincoln": { "xmin": -13244769.7727, "ymin": 5984619.1827, "xmax": -13115603.0047, "ymax": 6099856.8495 }, "Benton": { "xmin": -13344617.6406, "ymin": 5754139.5511, "xmax": -13240449.8207, "ymax": 5897751.643 }, "Clark": { "xmin": -13669582.7159, "ymin": 5707531.0819, "xmax": -13608198.7464, "ymax": 5789926.0889 }, "Pierce": { "xmin": -13675925.5501, "ymin": 5897856.0581, "xmax": -13511306.3151, "ymax": 6008212.5148 }, "Klickitat": { "xmin": -13537868.9285, "ymin": 5717448.7451, "xmax": -13343404.634, "ymax": 5787581.0243 }, "Grant": { "xmin": -13363106.9209, "ymin": 5881154.2164, "xmax": -13243995.6844, "ymax": 6100566.8755 }, "Chelan": { "xmin": -13489786.8267, "ymin": 5984760.3314, "xmax": -13342761.5943, "ymax": 6198989.41 }, "Thurston": { "xmin": -13714908.1752, "ymin": 5903319.5991, "xmax": -13603589.1089, "ymax": 5973834.5544 }, "Clallam": { "xmin": -13899444.6403, "ymin": 6084703.4441, "xmax": -13680883.6168, "ymax": 6189343.3633 }, "Douglas": { "xmin": -13393771.1496, "ymin": 5978080.6643, "xmax": -13241520.921, "ymax": 6132044.942 }, "Stevens": { "xmin": -13180410.3388, "ymin": 6072370.4054, "xmax": -13072245.7038, "ymax": 6274987.4244 }, "Adams": { "xmin": -13288154.3124, "ymin": 5898997.675, "xmax": -13131174.6649, "ymax": 5984917.9955 }, "Pacific": { "xmin": -13823107.8933, "ymin": 5818061.0061, "xmax": -13732083.3359, "ymax": 5908563.6219 }, "Island": { "xmin": -13677515.936, "ymin": 6078202.9272, "xmax": -13617553.3997, "ymax": 6176489.1526 }, "Kitsap": { "xmin": -13696574.1685, "ymin": 6008153.0256, "xmax": -13628515.5078, "ymax": 6102333.7942 }, "Garfield": { "xmin": -13120489.3456, "ymin": 5779994.9236, "xmax": -13049763.0779, "ymax": 5893758.4025 }, "Mason": { "xmin": -13748635.6001, "ymin": 5955512.1077, "xmax": -13670052.185, "ymax": 6041803.2531 }, "Grays Harbor": { "xmin": -13856990.0768, "ymin": 5908013.6975, "xmax": -13709928.0411, "ymax": 6029660.264 }, "Asotin": { "xmin": -13077814.2164, "ymin": 5779598.1341, "xmax": -13014945.7855, "ymax": 5854737.304 }, "Skamania": { "xmin": -13608832.7415, "ymin": 5708314.0933, "xmax": -13526920.5016, "ymax": 5842848.1259 }, "Snohomish": { "xmin": -13632030.2268, "ymin": 6069562.9349, "xmax": -13459351.7812, "ymax": 6156742.2548} }
    };

    var extentData = [];

    // Convert the county JSON objects into esri.geomtry.Extents.
    for (var i in extents.countyExtents) {
        // extents.countyExtents[i] = new esri.geometry.fromJson(extents.countyExtents[i]);
        extentData.push({ label: i, extent: new esri.geometry.fromJson(extents.countyExtents[i]) });
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
    var initBasemap = new esri.layers.ArcGISDynamicMapServiceLayer("http://hqolymgis11t/ArcGIS/rest/services/HPMS/WSDOTFunctionalClassBaseMap/MapServer");
    map.addLayer(initBasemap);
    var functionalClassLayer = new esri.layers.ArcGISDynamicMapServiceLayer("http://hqolymgis11t/ArcGIS/rest/services/HPMS/HPMS/MapServer", { id: "functionalClass" });
    map.addLayer(functionalClassLayer);

    navToolbar = new esri.toolbars.Navigation(map);
    dojo.connect(navToolbar, "onExtentHistoryChange", function () {
        $("#previousExtentButton").button({ disabled: navToolbar.isFirstExtent() });
        $("#nextExtentButton").button({ disabled: navToolbar.isLastExtent() });
    });

    setupNorthArrow();
    var scalebar = new esri.dijit.Scalebar({ map: map, attachTo: "bottom-left" });


    createBasemapGallery();
    dojo.connect(dijit.byId('map'), 'resize', resizeMap);

    $("#countyZoomSelect").extentAutoComplete(extents.countyExtents, map);


    // Setup extents for cities and urbanized area zoom tools.
    var cityQueryTask = new esri.tasks.QueryTask("http://hqolymgis11t/ArcGIS/rest/services/HPMS/WSDOTFunctionalClassBaseMap/MapServer/23");
    var query = new esri.tasks.Query();
    query.where = "1 = 1";
    query.returnGeometry = true;
    query.outFields = ["NAME"];

    cityQueryTask.execute(query, function (featureSet) {
        $("#cityZoomSelect").extentAutoComplete(featureSet, map);
    });


    var urbanAreaQueryTask = new esri.tasks.QueryTask("http://hqolymgis11t/ArcGIS/rest/services/HPMS/WSDOTFunctionalClassBaseMap/MapServer/24");
    query.where = "1 = 1";
    query.returnGeometry = true;
    urbanAreaQueryTask.execute(query, function (featureSet) {
        $("#urbanAreaZoomSelect").extentAutoComplete(featureSet, map, "NAME");
    });
}

function createBasemapGallery() {
    var basemapLayers =
    {
        cities: new esri.dijit.BasemapLayer({ url: "http://hqolymgis11t/ArcGIS/rest/services/HPMS/Cities/MapServer" }),
        counties: new esri.dijit.BasemapLayer({ url: "http://hqolymgis11t/ArcGIS/rest/services/HPMS/CountyBoundariesNoMaplex/MapServer" })
    };

    var basemaps = [
        new esri.dijit.Basemap({
            id : "fcBasemap",
            layers: [
                    new esri.dijit.BasemapLayer({ url: "http://hqolymgis11t/ArcGIS/rest/services/HPMS/WSDOTFunctionalClassBaseMap/MapServer" })
                ],
            thumbnailUrl: "images/HpmsBasemapThumbnail.png",
            title: "Functional Class Basemap"
        })
        ,
        new esri.dijit.Basemap({
            layers: [
                new esri.dijit.BasemapLayer({ url: "http://hqolymgis17p/ArcGIS/rest/services/WSDOTBaseMap/WSDOTBaseMap/MapServer" })
            ],
            thumbnailUrl: "images/WsdotBasemapThumbnail.jpg",
            title: "WSDOT Basemap"
        }),
        new esri.dijit.Basemap({
            layers: [
                basemapLayers.cities,
                basemapLayers.counties,
                new esri.dijit.BasemapLayer({ url: "http://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer" })
            ],
            thumbnailUrl: "http://www.arcgis.com/sharing/content/items/c03a526d94704bfb839445e80de95495/info/thumbnail/imagery.jpg",
            title: "ESRI Imagery"
        }),
        new esri.dijit.Basemap({
            layers: [
                new esri.dijit.BasemapLayer({url: "http://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer"}),
                new esri.dijit.BasemapLayer({ url: "http://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer" })
            ],
            thumbnailUrl: "http://www.arcgis.com/sharing/content/items/716b600dbbac433faa4bec9220c76b3a/info/thumbnail/imagery_labels.jpg",
            title: "ESRI Imagery w/ Labels"
        }),
        new esri.dijit.Basemap({
            layers: [
                basemapLayers.cities,
                basemapLayers.counties,
                new esri.dijit.BasemapLayer({ url: "http://services.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer" })
            ],
            thumbnailUrl: "http://www.arcgis.com/sharing/content/items/11742666e55b45b8a508751532d0c1ea/info/thumbnail/terrain.jpg",
            title: "ESRI Terrain"
        }),
    //new esri.dijit.Basemap({
    //    layers: [
    //        basemapLayers.cities,
    //        basemapLayers.counties,
    //        new esri.dijit.BasemapLayer({ type: "BingMapsAerial" })
    //    ],
    //    thumbnailUrl: "http://www.arcgis.com/sharing/content/items/677cd0c509d842a98360c46186a2768e/info/thumbnail/bing_aerial.jpg",
    //    title: "Bing Maps Imagery"
    //}),
        new esri.dijit.Basemap({
            layers: [
                basemapLayers.cities,
                basemapLayers.counties
            ],

            title: "Counties and Cities Only"
        })

    ];
    var basemapGallery = new esri.dijit.BasemapGallery({
        showArcGISBasemaps: false,
        //bingMapsKey: 'Av1bH4keF8rXBtxWOegklgWGCYYz8UGYvBhsWKuvc4Z15kT76xVFOERk8jkKEDvT',
        basemaps: basemaps,
        map: map
    }, "basemapGallery");

    basemapGallery.startup();

    dojo.connect(basemapGallery, "onError", function (msg) { console.log(msg); });

    // Set up code to hide or display basemap-specific legends.
    dojo.connect(basemapGallery, "onSelectionChange", function () {
        var basemap = basemapGallery.getSelected();
        if (basemap.id === "fcBasemap") {
            dojo.removeClass("basemapLegend", "hidden");
        }
        else {
            dojo.addClass("basemapLegend", "hidden");

        }
    });
}

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

//show map on load
dojo.addOnLoad(init);
