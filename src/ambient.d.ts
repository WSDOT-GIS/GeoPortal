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
