/**
 * Info Template for PTR Site features.
 * @module PtrTemplate
 */
define(["esri/InfoTemplate"], function (InfoTemplate) {
    "use strict";

    /**
     * @alias module:PtrTemplate
     */
    return new InfoTemplate({
        content: "${Site Location}<p><a href='http://webpub4qa.wsdot.wa.gov/Traffic/API/PermanentTrafficRecorder/?siteId=${Site ID}' target='_blank'>Download CSV</a></p>", //createContent,
        title: "PTR Site: ${Site ID}"
    });

});