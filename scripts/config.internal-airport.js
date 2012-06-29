﻿{
	"pageTitle": "Airport",
	"helpUrl": "help/navigation.html",
	"enableIdentify": true,
	"printUrl":"http://hqolymgis99t/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task",
	"airspaceCalculatorUrl":"http://hqolymgis19d/ArcGIS/rest/services/AirportMapApplication/AirspaceCalculator/GPServer/Get Intersection Count",
	"tabOrder": [
		"Layers",
		"Tools",
		"Basemap",
		"Legend"
	],
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
	"mapInitialLayer": {
		"layerType": "esri.layers.ArcGISTiledMapServiceLayer",
		"url": "http://wsdot.wa.gov/geosvcs/ArcGIS/rest/services/Shared/WebBaseMapWebMercator/MapServer"
	},
	"geometryServer": "http://wsdot.wa.gov/geosvcs/ArcGIS/rest/services/Geometry/GeometryServer",
	"tools": [
		"zoom",
		"airspaceCalculator",
		"lrs",
		"search"
	],
	"queryTasks": {
		"airport": {
			"label": "Airport",
			"url": "http://wsdot.wa.gov/geosvcs/ArcGIS/rest/services/Shared/Airports/MapServer/0",
			"query": {
				"where": "1 = 1",
				"returnGeometry": true,
				"outFields": ["Name"]
			},
			"levelOrFactor": 5
		},
		"county" : {
			"label": "County",
			"extents": { "Cowlitz": { "xmin": -13716608.1772, "ymin": 5756446.5261, "xmax": -13607638.501, "ymax": 5842754.0508 }, "Whitman": { "xmin": -13163464.6711, "ymin": 5847392.8245, "xmax": -13028774.4496, "ymax": 5984725.1359 }, "Spokane": { "xmin": -13116067.9387, "ymin": 5984489.784, "xmax": -13028809.6233, "ymax": 6114814.6868 }, "Okanogan": { "xmin": -13456929.5548, "ymin": 6097022.1384, "xmax": -13228768.0346, "ymax": 6274958.9602 }, "Whatcom": { "xmin": -13728170.447, "ymin": 6211586.2765, "xmax": -13431350.2501, "ymax": 6275274.979 }, "King": { "xmin": -13641277.0042, "ymin": 5955853.9667, "xmax": -13477001.0149, "ymax": 6070428.8593 }, "Kittitas": { "xmin": -13521532.7745, "ymin": 5899113.9835, "xmax": -13350070.2043, "ymax": 6040226.1383 }, "Yakima": { "xmin": -13527887.9391, "ymin": 5786789.6607, "xmax": -13343374.1361, "ymax": 5956573.2746 }, "Columbia": { "xmin": -13162673.7586, "ymin": 5780181.9819, "xmax": -13091540.6017, "ymax": 5881022.6956 }, "Skagit": { "xmin": -13666072.6368, "ymin": 6156232.4448, "xmax": -13434716.5579, "ymax": 6216862.0714 }, "Wahkiakum": { "xmin": -13773334.2204, "ymin": 5803187.7205, "xmax": -13716034.4264, "ymax": 5842274.2847 }, "San Juan": { "xmin": -13722118.9812, "ymin": 6154236.6866, "xmax": -13659272.347, "ymax": 6246272.0081 }, "Jefferson": { "xmin": -13883451.6533, "ymin": 6026992.6909, "xmax": -13647254.6175, "ymax": 6168652.2854 }, "Lewis": { "xmin": -13733788.4441, "ymin": 5842022.6891, "xmax": -13508975.7523, "ymax": 5908584.5364 }, "Ferry": { "xmin": -13232547.6219, "ymin": 6078547.14, "xmax": -13147311.3041, "ymax": 6274878.086 }, "Pend Oreille": { "xmin": -13094470.0429, "ymin": 6114408.5894, "xmax": -13027916.5477, "ymax": 6274942.0713 }, "Franklin": { "xmin": -13297953.5226, "ymin": 5811290.5149, "xmax": -13157743.3914, "ymax": 5899593.8738 }, "Walla Walla": { "xmin": -13251654.4058, "ymin": 5780326.7638, "xmax": -13134753.0631, "ymax": 5878116.3164 }, "Lincoln": { "xmin": -13244769.7727, "ymin": 5984619.1827, "xmax": -13115603.0047, "ymax": 6099856.8495 }, "Benton": { "xmin": -13344617.6406, "ymin": 5754139.5511, "xmax": -13240449.8207, "ymax": 5897751.643 }, "Clark": { "xmin": -13669582.7159, "ymin": 5707531.0819, "xmax": -13608198.7464, "ymax": 5789926.0889 }, "Pierce": { "xmin": -13675925.5501, "ymin": 5897856.0581, "xmax": -13511306.3151, "ymax": 6008212.5148 }, "Klickitat": { "xmin": -13537868.9285, "ymin": 5717448.7451, "xmax": -13343404.634, "ymax": 5787581.0243 }, "Grant": { "xmin": -13363106.9209, "ymin": 5881154.2164, "xmax": -13243995.6844, "ymax": 6100566.8755 }, "Chelan": { "xmin": -13489786.8267, "ymin": 5984760.3314, "xmax": -13342761.5943, "ymax": 6198989.41 }, "Thurston": { "xmin": -13714908.1752, "ymin": 5903319.5991, "xmax": -13603589.1089, "ymax": 5973834.5544 }, "Clallam": { "xmin": -13899444.6403, "ymin": 6084703.4441, "xmax": -13680883.6168, "ymax": 6189343.3633 }, "Douglas": { "xmin": -13393771.1496, "ymin": 5978080.6643, "xmax": -13241520.921, "ymax": 6132044.942 }, "Stevens": { "xmin": -13180410.3388, "ymin": 6072370.4054, "xmax": -13072245.7038, "ymax": 6274987.4244 }, "Adams": { "xmin": -13288154.3124, "ymin": 5898997.675, "xmax": -13131174.6649, "ymax": 5984917.9955 }, "Pacific": { "xmin": -13823107.8933, "ymin": 5818061.0061, "xmax": -13732083.3359, "ymax": 5908563.6219 }, "Island": { "xmin": -13677515.936, "ymin": 6078202.9272, "xmax": -13617553.3997, "ymax": 6176489.1526 }, "Kitsap": { "xmin": -13696574.1685, "ymin": 6008153.0256, "xmax": -13628515.5078, "ymax": 6102333.7942 }, "Garfield": { "xmin": -13120489.3456, "ymin": 5779994.9236, "xmax": -13049763.0779, "ymax": 5893758.4025 }, "Mason": { "xmin": -13748635.6001, "ymin": 5955512.1077, "xmax": -13670052.185, "ymax": 6041803.2531 }, "Grays Harbor": { "xmin": -13856990.0768, "ymin": 5908013.6975, "xmax": -13709928.0411, "ymax": 6029660.264 }, "Asotin": { "xmin": -13077814.2164, "ymin": 5779598.1341, "xmax": -13014945.7855, "ymax": 5854737.304 }, "Skamania": { "xmin": -13608832.7415, "ymin": 5708314.0933, "xmax": -13526920.5016, "ymax": 5842848.1259 }, "Snohomish": { "xmin": -13632030.2268, "ymin": 6069562.9349, "xmax": -13459351.7812, "ymax": 6156742.2548} }
		},
		"city": {
			"label": "City",
			"url": "http://wsdot.wa.gov/geosvcs/ArcGIS/rest/services/FunctionalClass/WSDOTFunctionalClassBaseMap/MapServer/12",
			"query": {
				"where": "1 = 1",
				"returnGeometry": true,
				"maxAllowableOffset": 50,
				"outFields": ["NAME"]
			}
		},
		"urbanArea": {
			"label": "Urban Area",
			"url": "http://wsdot.wa.gov/geosvcs/ArcGIS/rest/services/FunctionalClass/WSDOTFunctionalClassBaseMap/MapServer/24",
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
				{ "url": "http://wsdot.wa.gov/geosvcs/ArcGIS/rest/services/Shared/WebBaseMapWebMercator/MapServer" }
			]
		},
		{
			"id": "usaTopoMaps",
			"title": "USA Topo Maps",
			"thumbnailUrl": "images/USA_TopoThumbnail.png",
			"layers": [
				{ "url": "http://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places_Alternate/MapServer" },
				{ "url": "http://services.arcgisonline.com/ArcGIS/rest/services/USA_Topo_Maps/MapServer" }
			]
		},
		{
			"id": "aeronauticalChart",
			"title": "Aeronautical Chart",
			"thumbnailUrl": "images/Aeronautical Chart Thumb.jpg",
			"layers" : [
				{ "url": "http://wsdot.wa.gov/geosvcs/ArcGIS/rest/services/AirportMapApplication/AeronauticalChart/MapServer"}
			]
		}
	],
	"basemapsToRemove": ["basemap_4", "basemap_5", "basemap_8"],
	"routeLocatorUrl": "http://wsdot.wa.gov/geosvcs/ArcGIS/rest/services/Shared/ElcRestSoe/MapServer/exts/ElcRestSoe",
	"tabbedLayerList": true,
	"layers": {
			"Airport": [
					{
						"layerType":"esri.layers.ArcGISDynamicMapServiceLayer",
						"url":"http://wsdot.wa.gov/geosvcs/ArcGIS/rest/services/Shared/Airports/MapServer",
						"options": {
							"id": "Airports"
						}
					},
					{
						"layerType": "esri.layers.ArcGISDynamicMapServiceLayer",
						"url": "http://wsdot.wa.gov/geosvcs/ArcGIS/rest/services/AirportMapApplication/AirportFacilities/MapServer",
						"options": {
							"id": "Airport Facilities"
						}
					},
					{
						"layerType": "esri.layers.ArcGISDynamicMapServiceLayer",
						"url": "http://wsdot.wa.gov/geosvcs/ArcGIS/rest/services/AirportMapApplication/AirspaceFeatures/MapServer",
						"options": {
							"id": "Airspace Features"
						}
					},
					{
						"layerType": "esri.layers.ArcGISDynamicMapServiceLayer",
						"url": "http://wsdot.wa.gov/geosvcs/ArcGIS/rest/services/AirportMapApplication/FaaObstruction/MapServer",
						"options": {
							"id": "FAA Obstacles"
						}
					},
					{
						"layerType": "esri.layers.ArcGISDynamicMapServiceLayer",
						"url": "http://wsdot.wa.gov/geosvcs/ArcGIS/rest/services/AirportMapApplication/AirportInformation/MapServer",
						"options": {
							"id": "Airport Information"
						}
					}
			],
			"General": {
				"Political Boundaries": [
					{
						"layerType": "esri.layers.ArcGISTiledMapServiceLayer",
						"url": "http://wsdot.wa.gov/geosvcs/ArcGIS/rest/services/Shared/CityLimits/MapServer",
						"options": {
							"id": "City Limits"
						}
					},
					{
						"layerType": "esri.layers.ArcGISDynamicMapServiceLayer",
						"url": "http://wsdot.wa.gov/geosvcs/ArcGIS/rest/services/Shared/CongressionalDistricts/MapServer",
						"options": {
							"id": "Congressional Districts"
						}
					},
					{
						"layerType": "esri.layers.ArcGISTiledMapServiceLayer",
						"url": "http://wsdot.wa.gov/geosvcs/ArcGIS/rest/services/Shared/CountyBoundaries/MapServer",
						"options": {
							"id": "County Boundaries"
						}
					},
					{
						"layerType": "esri.layers.ArcGISDynamicMapServiceLayer",
						"url": "http://wsdot.wa.gov/geosvcs/ArcGIS/rest/services/Shared/LegislativeDistricts/MapServer",
						"options": {
							"id": "Legislative Districts"
						}
					},
					{
						"layerType": "esri.layers.ArcGISTiledMapServiceLayer",
						"url": "http://wsdot.wa.gov/geosvcs/ArcGIS/rest/services/Shared/MPO/MapServer",
						"options": {
							"id": "MPO"
						}
					},
					{
						"layerType": "esri.layers.ArcGISTiledMapServiceLayer",
						"url": "http://wsdot.wa.gov/geosvcs/ArcGIS/rest/services/Shared/RTPO/MapServer",
						"options": {
							"id": "RTPO"
						}
					},
					{
						"layerType": "esri.layers.ArcGISTiledMapServiceLayer",
						"url": "http://wsdot.wa.gov/geosvcs/ArcGIS/rest/services/Shared/TownshipSection/MapServer",
						"options": {
							"id": "Township / Section"
						}
					},
					{
						"layerType": "esri.layers.ArcGISTiledMapServiceLayer",
						"url": "http://wsdot.wa.gov/geosvcs/ArcGIS/rest/services/Shared/TribalLands/MapServer",
						"options": {
							"id": "Tribal Lands"
						}
					}
				],
			
				"WSDOT Boundaries": [
					{
						"layerType": "esri.layers.ArcGISTiledMapServiceLayer",
						"url": "http://wsdot.wa.gov/geosvcs/ArcGIS/rest/services/Shared/RegionBoundaries/MapServer",
						"options": {
							"id": "Region Boundaries"
						}
					}
				],
				"Transportation Features": [
					{
						"layerType": "esri.layers.ArcGISTiledMapServiceLayer",
						"url": "http://wsdot.wa.gov/geosvcs/ArcGIS/rest/services/Shared/StateRoutes/MapServer",
						"options": {
							"id": "State Routes"
						}
					}

				]
			}
	}
}