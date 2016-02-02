/// <reference path="../bower_components/polyfills/url.js" />

/**
 * @external MapServiceLayerQueryResult
 * @see {@link http://resources.arcgis.com/en/help/arcgis-rest-api/#/Query_Map_Service_Layer/02r3000000p1000000/|Query (Map Service\Layer)}
 */

require([
    "esri/config",
    "esri/tasks/Geoprocessor",
    "ptrSites/JobListItem",
    "ptrSites/gpToBootstrapUtils"
], function (esriConfig, Geoprocessor, JobListItem, gpToBootstrapUtils) {
    "use strict";

    var gpUrl = "http://hqolymgis99t:6080/arcgis/rest/services/Traffic/GetFilteredCsv/GPServer/Get Filtered CSV";
    esriConfig.defaults.io.corsEnabledServers.push("hqolymgis99t:6080");

    // Create a URL object for accessing the URL's search parameters.
    var url = new URL(window.location.href);

    // Populate the form with the values from the URL search.
    var form = document.forms[0];
    // Set max year to current year.
    (function () {
        var now = new Date();
        var year = now.getFullYear();
        [form.start_year, form.end_year].forEach(function (input) {
            input.setAttribute("max", year);
        });
    }());

    // Populate the form values with corresponding search parameters.
    Array.from(url.searchParams).forEach(function (searchParam) {
        var paramName = searchParam[0];
        var paramValue = searchParam[1];

        var element = form[paramName];

        if (element) {
            form[paramName].value = paramValue;
        } else {
            console.warn("Couldn't find matching control for parameter.", searchParam);
        }
    });

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
        // Create parameters object and update the URL search parameters.
        var paramNames = ["site_id", "start_year", "start_month", "end_year", "end_month"];
        var params = {};
        paramNames.forEach(function (pName) {
            params[pName] = form[pName].value;
            url.searchParams.set(pName, form[pName].value);
            // Convert parameter values (except site_id) to numbers.
            if (pName !== "site_id" && params[pName]) {
                params[pName] = parseInt(params[pName], 10);
            }
        });
        // Update the URL search parameters.
        window.history.replaceState(params, null, url.toString());


        var li = new JobListItem(params);

        document.getElementById("jobsList").appendChild(li.listItem);

        return gp.submitJob(params).then(function (e) {
            var jobId = e.jobId;
            gp.getResultData(jobId, "zip_file").then(function (dataEvent) {
                li.link = dataEvent.value.url;
                li.updateDownloadAttribute();
                li.listItem.classList.add("list-group-item-success");
            }, function (statusEvent) {
                console.debug("zip file status update", statusEvent);
            }, function (error) {
                li.error = error;
                li.listItem.classList.add("list-group-item-danger");
                console.error(error);
            });
        }, function (errorEvent) {
            console.error("GP error", errorEvent);
            li.addMessages({ type: "error", description: errorEvent.messages });
            li.status = "error";
        }, function (statusEvent) {
            console.debug("status update", statusEvent);
            li.addMessages(statusEvent.messages);
            li.status = statusEvent.jobStatus;
        });
    }

    form.onsubmit = function () {
        submitJob();
        return false;
    };

    // Clear the URL search parameters when the form is reset.
    form.onreset = function () {
        history.replaceState(null, null, "./");
    };

    var validDates = null;


    if (window.Worker) {
        var worker = new Worker("worker.js");
        worker.onmessage = function (e) {
            function createSiteIdsDataList(siteIds) {
                var frag = document.createDocumentFragment();
                var option;
                var siteIdList = document.getElementById("siteIdList");
                for (var siteId in siteIds) {
                    option = document.createElement("option");
                    option.value = siteId;
                    option.textContent = [siteId, siteIds[siteId]].join(": ");
                    frag.appendChild(option);
                }
                siteIdList.appendChild(frag);
            }

            var data = e.data;
            if (data.siteIds) {
                createSiteIdsDataList(e.data.siteIds);
            } else if (data.dates) {
                validDates = data.dates;
                [form.start_year, form.end_year].forEach(function (input) {
                    input.setAttribute("min", validDates[0].getFullYear());
                    input.setAttribute("max", validDates[1].getFullYear());
                });
            } else if (data.dateRanges) {
                console.debug("date ranges", data.dateRanges);
            } else if (data.error) {
                console.error(data.error);
            }
        };
    } else {
        console.warn("This browser does not support web workers.");
    }

    if (form.checkValidity()) {
        submitJob();
    }

});