WSDOT GeoPortal Configuration
=============================
## Query String Parameters ##

### config ###
Use the *config* parameter to specify a configuration other than the default. The currently supported configurations are listed below.  This value is case-insensitive.

* airport
* config
* Freight
* FunctionalClass
* internal-airport
* internal-Freight
* internal-RFIP

#### layers ####
The *layers* parameter is used to specify which layers will be turned on when the map is loaded.  
The value of this parameter is a comma-separated list of layer IDs.

#### extent ####
The *extent* parameter is used to specify the initial extent that the map will be zoomed to when it is loaded.
The format of this parameter is four comma-separated numbers in this order: xmin, ymin, xmax, ymax


## Configuration ##

### `web.config` ###
The `web.config` file contains server-side settings.  Each Visual Studio project configuration will have its own [web.config transformation file].
The following settings are contained in the `/configuration/appSettings` section of the `web.config` file.
#### wsdotTrafficApiAccessCode
This setting is used for accessing the [WSDOT Trafic API] to get traffic cameras, etc.  (Not currently used.)
#### mapIconBaseMap ####
Specifies the base map that is used when exporting a map image via `MapIcon.ashx`.
#### mapIconDefaultExtent ####
Specifies a default extent for `MapIcon.ashx` when an extent is not specified.
#### metadataRestUrl ####
The URL of an ArcGIS map service's layer's REST endpoint which provides metadata for layers in this application.
#### stateRouteMapService ####
A map service that is used to retrieve state route data.
#### stateRouteMapServiceLayers ####
A JSON string that describes the layers in the `stateRouteMapService`.

[web.config transformation file]:(http://go.microsoft.com/fwlink/?LinkId=125889)
[WSDOT Trafic API]:http://wsdot.wa.gov/Traffic/api/

### `config.js` files ###
This application supports a number of configurations that can be selected via the *config* query string parameter.
The default configuration is *config.js*.  This is the configuration that is used if the *config* query string parameter is not provided a value.
The settings for other configurations are stored in files named in this format: `config/MyConfigurationName.js`, where *MyConfigurationName* is replaced by the name of the configuration.

#### Additional documentation ####
The `scripts/config/README.md` file describes the settings of a config.js file.

## Utilities ##

### GraphicExport.ashx ####
Converts ArcGIS Server JSON representations of graphics to other formats.  This is called when the map application's *export graphics* button is clicked.

### MapIcon.ashx ###
Creates an icon representing a given map service.

### MapIconGenerator.htm ###
A frontend for MapIcon.ashx.

### GetRoutes.ashx ###
Provides route information for a [jQuery UI autocomplete widget].  See `RouteListDemo.html` for an example.
Note that this handler is not currently used in main map application.

[jQuery UI autocomplete widget]:http://jqueryui.com/autocomplete/#remote

### RouteListDemo.html ###
A sample page that looks up WA state routes and uses `GetRoutes.ashx`.

## Dependencies ##

* [ArcGIS JavaScript API](http://links.esri.com/javascript)
* [JQuery](http://jquery.com)
* [jQuery UI](http://jqueryui.com)

### WSDOT Dependencies ###
* ELC Proxy