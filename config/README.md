# WSDOT GeoPortal configuration settings

The configuration files for the GeoPortal are located in the `config` folder.  A configuration can be specified from the URL using the `config` query string parameter. If the `config` parameter is absent, `config/config.js` will be used.

In the following example, the configuration file that will be used is `config/crmp.js`.

```http://www.wsdot.wa.gov/data/tools/geoportal/?config=crmp```

## Showing a disclaimer

```json
"disclaimer": "disclaimers/fish-passage-barriers/Public.html",
"alwaysShowDisclaimer": false,
```

### disclaimer

URL to show in a popup when the map first opens.

### alwaysShowDisclaimer

Boolean value indicating if the disclaimer should be shown every time the page is opened.
If set to false a cookie will be set and the disclaimer will not be shown again for a week.

## pageTitle

Use this parameter to change the page title.

```json
"pageTitle": "My Page Title",
```

## noPopupLayerRe

Optional. Text here will be used to create a case-insensitive RegExp. Any layers with a matching layer ID will not be identified on map click.

```json
"noPopupLayerRe": "^(?:(?:layer\\d+)|(?:Rivers\\sand\\sLakes)|(?:.+Boundary))$",
```

## helpUrl

The location of the help page.

```json
"helpUrl": "help/navigation.html",
```

## tabContainerOptions

Used to control the layout of the tab container. This value is optional. ([More info](http://dojotoolkit.org/api/jsdoc/HEAD/dijit.layout.TabContainer)).

```json
"tabContainerOptions": {
    "tabPosition": "left"
},
```

## tabOrder

Determines the order that the tabs will appear in. The example below shows all available options. Omitting an item from the list will cause that tab to not be included in the layout.

```json
"tabOrder": [
    "Layers",
    "Tools",
    "Basemap",
    "Legend"
],
```

## alternateTabTitles

Allows tabs to be given alternate names. In the example below, the tab that would normally be called *Tools* will instead be called *Search*.

```json
"alternateTabTitles": {
    "Tools": "Search"
},
```

## tools

If provided, this determines the order of the contents of the *Tools* pane.

```json
"tools": [
    "zoom",
    "search",
    "lrs"
],
```

## customLegend

The custom legend property can be used to replace the default legend with a customLegend widget. This value will match the options object of the customLegend widget. Most configurations will probably be best served by using the default legend (and omitting the "customLegend" setting).

```json
"customLegend": {
    "html": "FunctionalClassLegend.html",
    "basemapSpecificSections": {
        "functionalClassBasemap": "#basemapLegend"
    },
    "htmlType": "url"
},
```

## enableIdentify

Set to true to enable the Identify tool. Omit or set to false if you don't want the Identify tool to be available.

```json
"enableIdentify": true,
```

## printUrl

Provide a "printUrl" to enable the print widget. This should be the URL to an ExportWebMap GP Server.

```json
"printUrl": "http://servicesbeta4.esri.com/arcgis/rest/services/Utilities/ExportWebMap/GPServer/Export%20Web%20Map%20Task",
```

## mapOptions

### logo

Do you want the esri logo in the corner of the map? `true` or `false`.

### extent

The initial extent of the map.

### lods

The levels of detail (LODs) that the map will use.

```json
"mapOptions": {
    "logo": false,
    "extent": {
        "xmin": -13938444.981854893,
        "ymin": 5800958.950617068,
        "ymax": 6257746.631649259,
        "xmax": -12960051.019804686,
        "spatialReference": {
            "wkid": 102100
        }
    },
    "lods": [
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
        { "level": 11, "resolution": 1.19432856685505, "scale": 4513.988705 },
        { "level": 12, "resolution": 0.597164283559817, "scale": 2256.994353 },
        { "level": 13, "resolution": 0.298582141647617, "scale": 1128.497176 }
    ]
},
```

## mapInitialLayer

This parameter specifies which layer will be used as the base layer when the map first loads.

```json
"mapInitialLayer": {
    "layerType": "esri.layers.ArcGISTiledMapServiceLayer",
    "url": "https://data.wsdot.wa.gov/arcgis/rest/services/Shared/WebBaseMapWebMercator/MapServer"
},
```

## initialBasemap

Specifies the initial basemap to choose from the basemap gallery widget once it has loaded its data.

Note that you must have specified `mapOptions.lods` to use this parameter.

```json
"initialBasemap": "Topographic",
```

## geometryServer

The ArcGIS Server Geometry server that will be used when a geometry server is required.

```json
"geometryServer": "https://data.wsdot.wa.gov/arcgis/rest/services/Geometry/GeometryServer",
```

## queryTasks

The "queryTasks" properties are used to populate the drop-down lists of zoom extents.
