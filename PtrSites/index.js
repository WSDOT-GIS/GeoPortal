/// <reference path="../bower_components/polyfills/url.js" />

/**
 * @external AllLayersAndTables
 * @see {@link http://resources.arcgis.com/en/help/arcgis-rest-api/index.html#/All_Layers_and_Tables/02r3000000v0000000/|All Layers and Tables (Map Service)}
 */

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
    var siteIdsUrl = "http://hqolymgis99t:6080/arcgis/rest/services/Traffic/PTRSites/MapServer/0/query";
    var minMaxYearsUrl = "http://hqolymgis99t:6080/arcgis/rest/services/Traffic/PTRSites/MapServer/3/query";
    var getValidDateRangeUrl = "http://hqolymgis99t:6080/arcgis/rest/services/Traffic/PTRSites/MapServer/2/query";
    
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

    /**
     * Executes an HTTP request for a URL.
     * @param {string} url - url
     * @param {Object} searchParams - Object with search parameters.
     * @param {Function} [jsonReviver] - Function for custom JSON deserialization.
     * @returns {Promise.<(Object|string)>} - Returns the result of the query.
     */
    function executeQuery(url, searchParams, jsonReviver) {
        var queryUrl = new URL(url), paramName, value;
        if (searchParams) {
            for (paramName in searchParams) {
                value = searchParams[paramName];
                if (value instanceof Object) {
                    value = JSON.stringify(value);
                }
                queryUrl.searchParams.set(paramName, value);
            }
        }
        return new Promise(function (resolve, reject) {
            var request = new XMLHttpRequest();
            request.open("get", queryUrl.toString());
            request.onloadend = function (e) {
                var queryResult;
                if (e.target.status !== 200) {
                    reject(e.target.statusText);
                } else {
                    queryResult = JSON.parse(e.target.response, jsonReviver);
                    if (queryResult.error) {
                        reject(queryResult.error);
                    } else {
                        resolve(queryResult);
                    }

                }
            };
            request.send();
        });
    }

    function populateSiteIdOptionList() {
        // Populate site id option list. JSON reviver trims excess space from strings.
        var searchParams = {
            where: "1=1",
            outFields: "ADCTraffic.DBO.PTRSites.SiteID,ADCTraffic.DBO.ADCTrafficSiteCurrentLocation.SiteLocation",
            returnGeometry: false,
            orderByFields: "ADCTraffic.DBO.PTRSites.SiteID",
            returnDistinctValues: true,
            f: "json"
        };
        executeQuery(siteIdsUrl, searchParams, function (k, v) {
            if (typeof v === "string") {
                return v.trim();
            }
            return v;
        }).then(function (data) {
            var field = data.displayFieldName; // "ADCTraffic.DBO.PTRSites.SiteID";
            var descField = data.fields[1].name;
            var siteIdList = document.getElementById("siteIdList");
            var docFrag = document.createDocumentFragment();
            data.features.forEach(function (feature) {
                var siteId = feature.attributes[field];
                var option = document.createElement("option");
                option.value = siteId;
                option.textContent = [siteId, feature.attributes[descField] || "[No description]"].join(": ");
                docFrag.appendChild(option);
            });
            siteIdList.appendChild(docFrag);
        }, function (error) {
            console.error("Error getting site IDs", error);
        });
    }

    function getValidDateRange() {
        var validDateRangeSearchParams = {
            f: "json",
            outStatistics: [
                {
                    statisticType: "max",
                    onStatisticField: "Date",
                    outStatisticFieldName: "maxDate"
                },
                {
                    statisticType: "min",
                    onStatisticField: "Date",
                    outStatisticFieldName: "minDate"
                }
            ]
        };

        var reviver = function (k, v) {
            var re = /Date$/i;
            if (re.test(k)) {
                return new Date(v);
            }
            return v;
        };

        var promise = executeQuery(getValidDateRangeUrl, validDateRangeSearchParams, reviver);
        promise.then(function (results) {
            var attributes = results.features[0].attributes;
            var minYear = attributes.minDate.getFullYear();
            var maxYear = attributes.maxDate.getFullYear();
            var yearInputs = document.querySelectorAll("input[name$='year']");
            Array.from(yearInputs, function (inp) {
                inp.setAttribute("min", minYear);
                inp.setAttribute("max", maxYear);
            });
        }, function (error) {
            console.error(error);
        });
    }

    populateSiteIdOptionList();
    getValidDateRange();

    if (form.checkValidity()) {
        submitJob();
    }

});