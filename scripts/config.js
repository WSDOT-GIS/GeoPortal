if (typeof (wsdot) === "undefined") {
    wsdot = {};
}
wsdot.config = {
    "locationInfoUrl": "http://hqolymgis19d/LocationInfo",
    "geometryServer": "http://hqolymgis17p/ArcGIS/rest/services/Geometry/GeometryServer",
    "queryTasks": {
        "city": {
            "url": "http://wwwi.wsdot.wa.gov/geosvcs/ArcGIS/rest/services/FunctionalClass/WSDOTFunctionalClassBaseMap/MapServer/12",
            "query": {
                "where": "1 = 1",
                "returnGeometry": true,
                "maxAllowableOffset": 50,
                "outFields": ["NAME"]
            }
        },
        "urbanArea": {
            "url": "http://wwwi.wsdot.wa.gov/geosvcs/ArcGIS/rest/services/FunctionalClass/WSDOTFunctionalClassBaseMap/MapServer/24",
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
                { "url": "http://hqolymgis21t/ArcGIS/rest/services/Shared/WebBaseMapWebMercator/MapServer" }
            ]
        },
        {
            "id": "functionalClassBasemap",
            "title": "Functional Class",
            "thumbnailUrl": "images/FCBasemapThumbnail.png",
            "layers": [
                { "url": "http://hqolymgis21t/ArcGIS/rest/services/FunctionalClass/WSDOTFunctionalClassBaseMap/MapServer" }
            ]
        }
    ],
    "basemapsToRemove": ["basemap_6"],
    "gp": {
        "Find Route Locations": "http://hqolymgis21t/ArcGIS/rest/services/Shared/WsdotLrs/GPServer/Find%20Route%20Locations",
        "Locate Points Along All LRS":"http://hqolymgis21t/ArcGIS/rest/services/Shared/WsdotLrs/GPServer/Locate%20Points%20Along%20All%20LRS"
    },
    "layers": [
        {
            "layerType": "esri.layers.ArcGISDynamicMapServiceLayer",
            "url": "http://hqolymgis21t/ArcGIS/rest/services/TransMapper/CityLimits/MapServer",
            "options": {
                "id": "City Limits",
                "visible": false
            }
        },
        {
            "layerType": "esri.layers.ArcGISDynamicMapServiceLayer",
            "url": "http://hqolymgis21t/ArcGIS/rest/services/TransMapper/CongressionalDistricts/MapServer",
            "options": {
                "id": "Congressional Districts",
                "visible": false
            }
        },
        {
            "layerType": "esri.layers.ArcGISDynamicMapServiceLayer",
            "url": "http://hqolymgis21t/ArcGIS/rest/services/TransMapper/CountyBoundaries/MapServer",
            "options": {
                "id": "County Boundaries",
                "visible": false
            }
        },
        {
            "layerType": "esri.layers.FeatureLayer",
            "url": "http://hqolymgis21t/ArcGIS/rest/services/TransMapper/InterchangeDrawings/MapServer/0",
            "options": {
                "id": "Interchange Drawings",
                "outFields": ["PDFURL", "SRID", "Label"],
                "visible": false
            }
        },
        {
            "layerType": "esri.layers.ArcGISDynamicMapServiceLayer",
            "url": "http://hqolymgis21t/ArcGIS/rest/services/TransMapper/LegisativeDistricts/MapServer",
            "options": {
                "id": "Legislative Districts",
                "visible": false
            }
        },
        {
            "layerType": "esri.layers.ArcGISDynamicMapServiceLayer",
            "url": "http://hqolymgis21t/ArcGIS/rest/services/TransMapper/MaintenanceAreas/MapServer",
            "options": {
                "id": "Maintenance Areas",
                "visible": false
            }
        },
        {
            "layerType": "esri.layers.ArcGISDynamicMapServiceLayer",
            "url": "http://hqolymgis21t/ArcGIS/rest/services/TransMapper/MPO/MapServer",
            "options": {
                "id": "MPO",
                "visible": false
            }
        },
        {
            "layerType": "esri.layers.ArcGISTiledMapServiceLayer",
            "url": "http://hqolymgis21t/ArcGIS/rest/services/TransMapper/StateRoutes/MapServer",
            "options": {
                "id": "State Routes",
                "visible": false
            }
        },
        {
            "layerType": "esri.layers.ArcGISDynamicMapServiceLayer",
            "url": "http://hqolymgis21t/ArcGIS/rest/services/TransMapper/RegionBoundaries/MapServer",
            "options": {
                "id": "Region Boundaries",
                "visible": false
            }
        },
        {
            "layerType": "esri.layers.ArcGISDynamicMapServiceLayer",
            "url": "http://hqolymgis21t/ArcGIS/rest/services/TransMapper/RTPO/MapServer",
            "options": {
                "id": "RTPO",
                "visible": false
            }
        },


        {
            "layerType": "esri.layers.ArcGISTiledMapServiceLayer",
            "url": "http://hqolymgis21t/ArcGIS/rest/services/TransMapper/TownshipSection/MapServer",
            "options": {
                "id": "Township / Section",
                "visible": false
            }
        },
        {
            "layerType": "esri.layers.ArcGISDynamicMapServiceLayer",
            "url": "http://hqolymgis21t/ArcGIS/rest/services/TransMapper/TribalLands/MapServer",
            "options": {
                "id": "Tribal Lands",
                "visible": false
            }
        },

        {
            "layerType": "esri.layers.ArcGISDynamicMapServiceLayer",
            "url": "http://hqolymgis21t/ArcGIS/rest/services/FunctionalClass/WSDOTFunctionalClassMap/MapServer",
            "options": {
                "id": "Functional Class",
                "visible": false
            }
        },
        {
            "layerType": "esri.layers.ArcGISDynamicMapServiceLayer",
            "url": "http://www.wsdot.wa.gov/ArcGIS/rest/services/TrafficSegments_2D/MapServer",
            "options": {
                "id": "Traffic Flow",
                "visible": false
            }
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
    ]
};