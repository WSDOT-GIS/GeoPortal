/// <reference path="../bower_components/polyfills/url.js" />
/// <reference path="../bower_components/promise-polyfill/Promise.js" />

/**
 * @external AllLayersAndTables
 * @see {@link http://resources.arcgis.com/en/help/arcgis-rest-api/index.html#/All_Layers_and_Tables/02r3000000v0000000/|All Layers and Tables (Map Service)}
 */

/**
 * @external MapServiceLayerQueryResult
 * @see {@link http://resources.arcgis.com/en/help/arcgis-rest-api/#/Query_Map_Service_Layer/02r3000000p1000000/|Query (Map Service\Layer)}
 */

define(function () {
    "use strict";

    /**
     * An object that manages a list item associated with a job.
     * @class
     * @property {string} jopId - The identifier for the geoprocessing job.
     * @property {HTMLLIElement} listItem - The list item (<li>) associated with this object.
     * @property {Boolean} loading - Gets or sets the "loading" status of this object. Changing this value will toggle the "loading" class on the list item.
     * @property {string} link - Gets or sets the URL inside of the <a> element.
     * @property {string} siteId - Gets or sets the site ID label on the link.
     * @property {string} startDate - Gets or sets the start date label on the link.
     * @property {string} endDate - Gets or sets the end date label on th elink.
     * @property {string} error - Gets or sets the error message on the list item.
     */
    function JobListItem() {
        var _jobId = null;
        var li = document.createElement("li");
        li.classList.add("list-group-item");
        li.classList.add("loading");
        var progress = document.createElement("progress");
        progress.textContent = "Loading...";


        
        var a = document.createElement("a");

        var icon = document.createElement("span");
        icon.setAttribute("class", "glyphicon glyphicon-compressed");
        a.appendChild(icon);

        //a.innerHTML = "<span></span> from <span></span> to <span></span>"
        var siteIdSpan = document.createElement("span");
        var startDateSpan = document.createElement("span");
        var endDateSpan = document.createElement("span");
        a.appendChild(siteIdSpan);
        a.appendChild(document.createTextNode(" from "));
        a.appendChild(startDateSpan);
        a.appendChild(document.createTextNode(" to "));
        a.appendChild(endDateSpan);
        li.appendChild(a);
        li.appendChild(progress);

        var errorP = document.createElement("p");
        errorP.classList.add("error");
        li.appendChild(errorP);

        Object.defineProperties(this, {
            jobId: {
                get: function () {
                    return _jobId;
                }, 
                set: function(value) {
                    _jobId = value;
                    li.dataset.jobId = value;
                }
            },
            listItem: {
                get: function () {
                    return li;
                }
            },
            loading: {
                get: function () {
                    li.classList.contains("loading");
                },
                set: function (isLoading) {
                    if (isLoading) {
                        li.classList.add("loading");
                    } else {
                        li.classList.remove("loading");
                    }
                }
            },
            link: {
                get: function () {
                    return a.href;
                },
                set: function (url) {
                    a.href = url;
                }
            },
            siteId: {
                get: function () {
                    return siteIdSpan.textContent;
                },
                set: function (value) {
                    siteIdSpan.textContent = value;
                }
            },
            startDate: {
                get: function () {
                    return startDateSpan.textContent;
                },
                set: function (value) {
                    startDateSpan.textContent = value;
                }
            },
            endDate: {
                get: function () {
                    return endDateSpan.textContent;
                },
                set: function (value) {
                    endDateSpan.textContent = value;
                }
            }, error: {
                set: function (value) {
                    errorP.textContent = value || "";
                    if (value) {
                        li.classList.add("error");
                    } else {
                        li.classList.remove("error");
                    }
                }
            }
        });
    }

    return JobListItem;
});