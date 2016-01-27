/// <reference path="../bower_components/polyfills/url.js" />

/**
 * @external AllLayersAndTables
 * @see {@link http://resources.arcgis.com/en/help/arcgis-rest-api/index.html#/All_Layers_and_Tables/02r3000000v0000000/|All Layers and Tables (Map Service)}
 */

/**
 * @external MapServiceLayerQueryResult
 * @see {@link http://resources.arcgis.com/en/help/arcgis-rest-api/#/Query_Map_Service_Layer/02r3000000p1000000/|Query (Map Service\Layer)}
 */

require(["esri/config", "esri/tasks/Geoprocessor", "ptrSites/JobListItem"], function (esriConfig, Geoprocessor, JobListItem) {
    "use strict";

    /**
     * Converts date to YYYY-MM-DD format string.
     * @param {Date} date - A Date.
     * @returns {string} YYYY-MM-DD format representation of date.
     */
    function formatDate(date) {
        return date ? date.toISOString().replace(/T.+$/, "") : null;
    }


    var gpUrl = "http://hqolymgis99t:6080/arcgis/rest/services/Traffic/GetFilteredCsv/GPServer/Get Filtered CSV";
    var siteIdsUrl = "http://hqolymgis99t:6080/arcgis/rest/services/Traffic/PTRSites/MapServer/0/query?where=1%3D1&outFields=ADCTraffic.DBO.PTRSites.SiteID,ADCTraffic.DBO.ADCTrafficSiteCurrentLocation.SiteLocation&returnGeometry=false&orderByFields=ADCTraffic.DBO.PTRSites.SiteID&returnDistinctValues=true&f=json";
    esriConfig.defaults.io.corsEnabledServers.push("hqolymgis99t:6080");


    // Create a URL object for accessing the URL's search parameters.
    var url = new URL(window.location.href);

    // Get the GP parameters from the URL search if available.
    var siteId = url.searchParams.get("siteid") || "";
    var startDate = url.searchParams.get("startdate");
    var endDate = url.searchParams.get("enddate");

    // Convert the date strings into Date objects.
    startDate = startDate ? new Date(startDate) : null;
    endDate = endDate ? new Date(endDate) : null;

    // Populate the form with the values from the URL search.
    var form = document.forms[0];
    form.siteid.setAttribute("value", siteId);
    form.startdate.value = formatDate(startDate); //valueAsDate = startDate; // valueAsDate not currently (2016-01-27) supported in Firefox.
    form.enddate.value = formatDate(endDate); //.valueAsDate = endDate;

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
            Start_Date: form.startdate.valueAsDate || new Date(form.startdate.value),
            End_Date: form.enddate.valueAsDate || new Date(form.enddate.value)
        };

        // Update the URL search parameters.
        url.searchParams.set("siteid", form.siteid.value);
        url.searchParams.set("startdate", form.startdate.value);
        url.searchParams.set("enddate", form.enddate.value);
        window.history.replaceState(params, null, url.toString());

        var li = new JobListItem(params.Site_ID, form.startdate.value, form.enddate.value);

        document.getElementById("jobsList").appendChild(li.listItem);

        return gp.submitJob(params).then(function (e) {
            var jobId = e.jobId;
            gp.getResultData(jobId, "zip_file_path").then(function (dataEvent) {
                console.debug("get-result-data-complete", dataEvent);
                li.loading = false;
                li.link = dataEvent.value.url;
                li.updateDownloadAttribute();
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

    // Clear the URL search parameters when the form is reset.
    form.onreset = function () {
        history.replaceState(null, null, "./");
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
            // Parse the returned JSON into an Object using a custom reviver that trims excess spaces from strings.
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
                option.textContent = [siteId, feature.attributes[descField] || "[No description]"].join(": ");
                docFrag.appendChild(option);
            });
            siteIdList.appendChild(docFrag);
        };
        request.send();
    }

    try {
        populateSiteIdOptionList();
    } catch (err) {
        console.error("Error populating site ID suggestion list", err);
    }

    if (form.checkValidity()) {
        submitJob();
    }

});