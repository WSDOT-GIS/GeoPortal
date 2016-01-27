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

require(["esri/tasks/Geoprocessor"], function (Geoprocessor) {
    "use strict";


    var gpUrl = "http://hqolymgis99t:6080/arcgis/rest/services/Traffic/GetFilteredCsv/GPServer/Get Filtered CSV";
    var siteIdsUrl = "http://hqolymgis99t:6080/arcgis/rest/services/Traffic/PTRSites/MapServer/0/query?where=1%3D1&outFields=ADCTraffic.DBO.PTRSites.SiteID,ADCTraffic.DBO.ADCTrafficSiteCurrentLocation.SiteLocation&returnGeometry=false&orderByFields=ADCTraffic.DBO.PTRSites.SiteID&returnDistinctValues=true&f=json"

    /**
     * An object that manages a list item associated with a job.
     * @class
     * @property {HTMLLIElement} listItem - The list item (<li>) associated with this object.
     * @property {Boolean} loading - Gets or sets the "loading" status of this object. Changing this value will toggle the "loading" class on the list item.
     * @property {string} link - The URL inside of the <a> element.
     */
    function JobListItem() {
        var _jobId = null;
        var li = document.createElement("li");
        li.classList.add("loading");
        var progress = document.createElement("progress");
        progress.textContent = "Loading...";
        li.appendChild(progress);
        
        var a = document.createElement("a");
        a.href = "";
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
    // Create a URL object for accessing the URL's search parameters.
    var url = new URL(window.location.href);

    // Get the GP parameters from the URL search if available.
    var siteId = url.searchParams.get("siteid");
    var startDate = url.searchParams.get("startdate");
    var endDate = url.searchParams.get("enddate");

    // Convert the date strings into Date objects.
    startDate = startDate ? new Date(startDate) : null;
    endDate = endDate ? new Date(endDate) : null;


    // Populate the form with the values from the URL search.
    var form = document.forms[0];
    form.siteid.setAttribute("value", siteId);
    form.startdate.valueAsDate = startDate;
    form.enddate.valueAsDate = endDate;

    /**
     * @typedef {Object} GPMessage
     * @property {string} description - Message
     * @property {string} type - Message type
     */

    /**
     * @typedef {Object} JobInfo
     * @property {string} jobId - Job ID
     * @property {string} jobStatus - Job Status
     * @property {GPMessage[]} messages 
     */

    /**
     * @typedef JobStatus
     * @property {JobInfo} jobInfo - Job Info
     * @property {Geoprocessor} target - The Geoprocessor that is executing the task.
     */

    // Create the Geoprocessor
    var gp = new Geoprocessor(gpUrl);

    gp.on("job-cancel", function (e) {
        console.debug("job-cancel", e);
    });

    function submitJob() {
        var params = {
            Site_ID: form.siteid.value,
            Start_Date: form.startdate.valueAsDate,
            End_Date: form.enddate.valueAsDate
        };

        url.searchParams.set("siteid", form.siteid.value);
        url.searchParams.set("startdate", form.startdate.value);
        url.searchParams.set("enddate", form.enddate.value);

        window.history.pushState(params, null, url.toString());

        var li = new JobListItem();
        li.siteId = params.Site_ID;
        li.startDate = form.startdate.value;
        li.endDate = form.enddate.value;

        document.getElementById("jobsList").appendChild(li.listItem);

        return gp.submitJob(params).then(function (e) {
            var jobId = e.jobId;
            gp.getResultData(jobId, "zip_file_path").then(function (dataEvent) {
                console.debug("get-result-data-complete", dataEvent);
                li.loading = false;
                li.link = dataEvent.value.url;
            }, null, function (error) {
                li.error = error;
                console.error(error);
            });
        });
    }

    form.onsubmit = function () {
        submitJob();
        return false;
    };

    function populateSiteIdOptionList() {
        // Populate site id option list.
        var request = new XMLHttpRequest();
        request.open("get", siteIdsUrl);
        request.onloadend = function (e) {
            var self = e.target;
            var data;
            if (self.status !== 200) {
                throw new Error(self.statusText);
            }
            data = JSON.parse(self.responseText, function (k, v) {
                if (typeof v === "string") {
                    return v.trim();
                }
                return v;
            });
            if (data.error) {
                throw new Error(data.error);
            }


            var field = data.displayFieldName; // "ADCTraffic.DBO.PTRSites.SiteID";
            var descField = data.fields[1].name;
            var siteIdList = document.getElementById("siteIdList");
            var docFrag = document.createDocumentFragment();
            data.features.forEach(function (feature) {
                var siteId = feature.attributes[field];
                var option = document.createElement("option");
                option.value = siteId;
                option.textContent = feature.attributes[descField];
                docFrag.appendChild(option);
            });
            siteIdList.appendChild(docFrag);
        };
        request.send();
    }

    populateSiteIdOptionList();
    if (form.checkValidity()) {
        submitJob();
    }

});