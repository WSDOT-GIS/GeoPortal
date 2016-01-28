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
        content: "${SiteLocation}<p><a href='PtrSites/?site_id=${SiteID}' target='_blank'>Download CSV</a></p>", //createContent,
        title: "PTR Site: ${SiteID}"
    });

});