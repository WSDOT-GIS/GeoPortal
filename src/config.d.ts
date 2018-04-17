declare namespace config {
  export interface TabContainerOptions {
    tabPosition: string;
  }

  export interface SpatialReference {
    wkid: number;
  }

  export interface Extent {
    xmin: number;
    ymin: number;
    ymax: number;
    xmax: number;
    spatialReference: SpatialReference;
  }

  export interface Lod {
    level: number;
    resolution: number;
    scale: number;
  }

  export interface MapOptions {
    logo: boolean;
    extent: Extent;
    lods: Lod[];
    sliderStyle: string;
  }

  export interface Query {
    where: string;
    returnGeometry: boolean;
    outFields: string[];
  }

  export interface QueryTask {
    label: string;
    url: string;
    query: Query;
  }

  export interface QueryTasks {
    [key: string]: QueryTask;
  }

  export interface Layer {
    url: string;
    visibleLayers: number[];
    options: {
      [key: string]: any;
      visible?: boolean;
      id: string;
    };
  }

  export interface Basemap {
    id: string;
    title: string;
    thumbnailUrl: string;
    layers: Layer[];
  }

  export interface Layers {
    [key: string]: Layer[];
  }

  export interface Config {
    pageTitle: string;
    helpUrl: string;
    enableIdentify: boolean;
    disclaimer: string;
    alwaysShowDisclaimer: boolean;
    printUrl: string;
    tabContainerOptions: TabContainerOptions;
    tabOrder: string[];
    mapOptions: MapOptions;
    initialBasemap: string;
    geometryServer: string;
    tools: string[];
    queryTasks: QueryTasks;
    basemaps: Basemap[];
    basemapsToRemove: string[];
    routeLocatorUrl: string;
    tabbedLayerList: boolean;
    layers: Layer[] | Layers;
  }
}
