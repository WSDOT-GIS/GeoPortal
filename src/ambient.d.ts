// TODO get dijit type defs from other source.

declare module "dijit/layout/ContentPane" {
  class ContentPane {
    constructor(...args: any[]);
  }
  export = ContentPane;
}

declare module "dijit/form/Button" {
  class Button {
    constructor(...args: any[]);
    startup(): Button;
  }
  export = Button;
}

declare module "dojo/text!*" {
  const s: string;
  export = s;
}

declare module "@esri/arcgis-to-geojson-utils" {
  const arcgisToGeoJSON: (...args: any[]) => any;
  const geojsonToArcGIS: (...args: any[]) => any;
  export { arcgisToGeoJSON };
}
