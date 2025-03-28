﻿WSDOT GeoPortal
===============

Development Environment
-----------------------

Visual Studio Code

The GeoPortal was originally developed using plain JavaScript, but newer components are [written in TypeScript and transpiled to JavaScript using Webpack](https://webpack.js.org/guides/typescript/).

Configuration
-------------

### Query String Parameters ###

#### config ####
Use the *config* parameter to specify a configuration other than the default. The currently supported configurations are listed below.  This value is case-insensitive.

* config
* Freight
* FunctionalClass
* internal-Freight
* internal-RFIP

##### layers #####
The *layers* parameter is used to specify which layers will be turned on when the map is loaded.
The value of this parameter is a comma-separated list of layer IDs.

##### extent #####
The *extent* parameter is used to specify the initial extent that the map will be zoomed to when it is loaded.
The format of this parameter is four comma-separated numbers in this order: xmin, ymin, xmax, ymax


### Configuration ###

#### `config.js` files ####
This application supports a number of configurations that can be selected via the *config* query string parameter.
The default configuration is *config.js*.  This is the configuration that is used if the *config* query string parameter is not provided a value.
The settings for other configurations are stored in files named in this format: `config/MyConfigurationName.js`, where *MyConfigurationName* is replaced by the name of the configuration.

##### Additional documentation #####
The `config/README.md` file describes the settings of a config.js file.

### Utilities ###

#### GraphicExport.ashx ####
Converts ArcGIS Server JSON representations of graphics to other formats.  This is called when the map application's *export graphics* button is clicked.

### Dependencies ###

* [ArcGIS JavaScript API]
* [JQuery]
* [jQuery UI]

[ArcGIS JavaScript API]:http://links.esri.com/javascript
[JQuery]:http://jquery.com
[jQuery UI]:http://jqueryui.com
[NodeJS]:https://nodejs.org/
