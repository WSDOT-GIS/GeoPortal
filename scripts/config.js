if (typeof (wsdot) === "undefined") {
    wsdot = {};
}
wsdot.config = {
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
                { "level": 11, "resolution": 1.19432856685505, "scale": 4513.988705 }
            ]
    },
    "mapInitialLayer": {
        "layerType": "esri.layers.ArcGISTiledMapServiceLayer",
        "url": "http://www.wsdot.wa.gov/geosvcs/ArcGIS/rest/services/Shared/WebBaseMapWebMercator/MapServer"
    },
    "locationInfoUrl": "http://hqolymgis19d/LocationInfo",
    "geometryServer": "http://hqolymgis17p/ArcGIS/rest/services/Geometry/GeometryServer",
    "queryTasks": {
        "city": {
            "url": "http://www.wsdot.wa.gov/geosvcs/ArcGIS/rest/services/FunctionalClass/WSDOTFunctionalClassBaseMap/MapServer/12",
            "query": {
                "where": "1 = 1",
                "returnGeometry": true,
                "maxAllowableOffset": 50,
                "outFields": ["NAME"]
            }
        },
        "urbanArea": {
            "url": "http://www.wsdot.wa.gov/geosvcs/ArcGIS/rest/services/FunctionalClass/WSDOTFunctionalClassBaseMap/MapServer/24",
            "query": {
                "where": "1 = 1",
                "returnGeometry": true
            }
        }
    },
    "basemaps": [
        {
            "id": "wsdotBasemap",
            "title": "WSDOT Basemap",
            "thumbnailUrl": "images/WsdotBasemapThumbnail.jpg",
            "layers": [
                { "url": "http://www.wsdot.wa.gov/geosvcs/ArcGIS/rest/services/Shared/WebBaseMapWebMercator/MapServer" }
            ]
        },
        {
            "id": "functionalClassBasemap",
            "title": "Functional Class",
            "thumbnailUrl": "images/FCBasemapThumbnail.png",
            "layers": [
                { "url": "http://www.wsdot.wa.gov/geosvcs/ArcGIS/rest/services/FunctionalClass/WSDOTFunctionalClassBaseMap/MapServer" }
            ]
        }
    ],
    "basemapsToRemove": ["basemap_6"],
    "locateMileposts": {
        "url": "http://hqolymgis21t/ElcProxy/LocateMileposts.ashx",
        "options": { "useProxy": false, "usePost": true }
    },
    "locateNearestMileposts": {
        "url": "http://hqolymgis21t/ElcProxy/GetRouteCoordinatesNearestXYs.ashx",
        "options": { "useProxy": false, "usePost": true }
    },
    "identifyLayers": [
        {
            "layerType": "esri.layers.ArcGISDynamicMapServiceLayer",
            "url": "http://wsdot.wa.gov/geosvcs/ArcGIS/rest/services/Shared/QueryMapService/MapServer",
            "options": {
                "id": "Location Information"
            }
        }
    ],
    "layers": {
        "Main": {
            "Political Boundaries": [
                {
                    "layerType": "esri.layers.ArcGISTiledMapServiceLayer",
                    "url": "http://www.wsdot.wa.gov/geosvcs/ArcGIS/rest/services/Shared/CityLimits/MapServer",
                    "options": {
                        "id": "City Limits",
                        "visible": false
                    },
                    "metadataIds": [23]
                },
                {
                    "layerType": "esri.layers.ArcGISDynamicMapServiceLayer",
                    "url": "http://www.wsdot.wa.gov/geosvcs/ArcGIS/rest/services/Shared/CongressionalDistricts/MapServer",
                    "options": {
                        "id": "Congressional Districts",
                        "visible": false
                    }
                },
                {
                    "layerType": "esri.layers.ArcGISTiledMapServiceLayer",
                    "url": "http://www.wsdot.wa.gov/geosvcs/ArcGIS/rest/services/Shared/CountyBoundaries/MapServer",
                    "options": {
                        "id": "County Boundaries",
                        "visible": false
                    },
                    "metadataIds": [25]
                },
                {
                    "layerType": "esri.layers.ArcGISDynamicMapServiceLayer",
                    "url": "http://www.wsdot.wa.gov/geosvcs/ArcGIS/rest/services/Shared/LegislativeDistricts/MapServer",
                    "options": {
                        "id": "Legislative Districts",
                        "visible": false
                    }
                },
                {
                    "layerType": "esri.layers.ArcGISTiledMapServiceLayer",
                    "url": "http://www.wsdot.wa.gov/geosvcs/ArcGIS/rest/services/Shared/MPO/MapServer",
                    "options": {
                        "id": "MPO",
                        "visible": false
                    }
                },
                {
                    "layerType": "esri.layers.ArcGISTiledMapServiceLayer",
                    "url": "http://www.wsdot.wa.gov/geosvcs/ArcGIS/rest/services/Shared/RTPO/MapServer",
                    "options": {
                        "id": "RTPO",
                        "visible": false
                    }
                },
                {
                    "layerType": "esri.layers.ArcGISTiledMapServiceLayer",
                    "url": "http://www.wsdot.wa.gov/geosvcs/ArcGIS/rest/services/Shared/TownshipSection/MapServer",
                    "options": {
                        "id": "Township / Section",
                        "visible": false
                    },
                    "metadataIds": [5]
                },
                {
                    "layerType": "esri.layers.ArcGISTiledMapServiceLayer",
                    "url": "http://hqolymgis21t/ArcGIS/rest/services/Shared/TribalLands/MapServer",
                    "options": {
                        "id": "Tribal Lands",
                        "visible": false
                    }
                }
          ],
            "Design": [
               {
                   "layerType": "esri.layers.FeatureLayer",
                   "url": "http://www.wsdot.wa.gov/geosvcs/ArcGIS/rest/services/Shared/InterchangeDrawings/MapServer/0",
                   "options": {
                       "id": "Interchange Drawings",
                       "outFields": ["PDFURL", "SRID", "Label"],
                       "visible": false,
                       "mode": "MODE_SNAPSHOT"
                   }
               }
           ],
            "WSDOT Boundaries": [
                {
                    "layerType": "esri.layers.ArcGISDynamicMapServiceLayer",
                    "url": "http://www.wsdot.wa.gov/geosvcs/ArcGIS/rest/services/Shared/MaintenanceAreas/MapServer",
                    "options": {
                        "id": "Maintenance Areas",
                        "visible": false
                    }
                },
                {
                    "layerType": "esri.layers.ArcGISTiledMapServiceLayer",
                    "url": "http://www.wsdot.wa.gov/geosvcs/ArcGIS/rest/services/Shared/RegionBoundaries/MapServer",
                    "options": {
                        "id": "Region Boundaries",
                        "visible": false
                    },
                    "metadataIds": [19]
                },
                {
                    "layerType": "esri.layers.FeatureLayer",
                    "url": "http://www.wsdot.wa.gov/ArcGIS/rest/services/monuments4ngs/MapServer/0",
                    "options": {
                        "id": "Survey Monuments (NGS)",
                        "outFields": ["*"],
                        "infoTemplate": { "title": "NGS Monument", "content": "${*}" },
                        "visible": false
                    }
                }
            ],
            "Transportation Features": [
                {
                    "layerType": "esri.layers.ArcGISTiledMapServiceLayer",
                    "url": "http://www.wsdot.wa.gov/geosvcs/ArcGIS/rest/services/Shared/StateRoutes/MapServer",
                    "options": {
                        "id": "State Routes",
                        "visible": false
                    },
                    "metadataIds": [16, 15, 17]
                },
                {
                    "layerType": "esri.layers.ArcGISDynamicMapServiceLayer",
                    "url": "http://www.wsdot.wa.gov/geosvcs/ArcGIS/rest/services/FunctionalClass/WSDOTFunctionalClassMap/MapServer",
                    "options": {
                        "id": "Functional Class",
                        "visible": false
                    },
                    "metadataIds": [8, 14]
                }
            ],
            "Other": [
                {
                    "layerType": "esri.layers.ArcGISDynamicMapServiceLayer",
                    "url": "http://www.wsdot.wa.gov/ArcGIS/rest/services/TrafficSegments_2D/MapServer",
                    "options": {
                        "id": "Traffic Flow",
                        "visible": false
                    }
                }
            ]
        }
    }
};