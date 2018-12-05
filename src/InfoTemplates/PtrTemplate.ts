/**
 * Info Template for PTR Site features.
 * @module PtrTemplate
 */
import InfoTemplate = require("esri/InfoTemplate");

/**
 * @alias module:PtrTemplate
 */
export = new InfoTemplate({
  content:
    "${Site Location}<p><a href='https://www.wsdot.wa.gov/Traffic/API/PermanentTrafficRecorder/?siteId=${Site ID}' target='_blank'>Download CSV</a></p>", // createContent,
  title: "PTR Site: ${Site ID}"
});
