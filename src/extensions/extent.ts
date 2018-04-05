import lang = require("dojo/_base/lang");
import Extent = require("esri/geometry/Extent");

lang.extend(Extent, {
  toCsv(this: Extent) {
    const { xmin, ymin, xmax, ymax } = this;
    return [xmin, ymin, xmax, ymax].join(",");
  }
});
