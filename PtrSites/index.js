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

    function JobListItem(jobId) {
        var li = document.createElement("li");
        li.id = "job" + jobId;
        li.classList.add("loading");
        var progress = document.createElement("progress");
        progress.textContent = "Loading...";
        li.appendChild(progress);
        
        var a = document.createElement("a");
        a.href = "";
        li.appendChild(a);

        Object.defineProperties(this, {
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
                    return a;
                }
            }
        });
    }

    var jobListItems = {

    };

    var gpUrl = "http://hqolymgis99t:6080/arcgis/rest/services/Traffic/GetFilteredCsv/GPServer/Get Filtered CSV";

    function writeError(message) {
        var p = document.createElement("p");
        p.setAttribute("class", "error");
        p.textContent = message;
        document.body.appendChild(p);
    }

    var url = new URL(window.location.href);

    var siteId = url.searchParams.get("siteid");

    var startDate, endDate;

    startDate = url.searchParams.get("startdate");
    endDate = url.searchParams.get("enddate");

    startDate = startDate ? new Date(startDate) : null;
    endDate = endDate ? new Date(endDate) : null;


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

    var gp = new Geoprocessor(gpUrl);

    /**
     * 
     * @param {JobStatus} e - job status event
     */
    gp.on("status-update", function (e) {
        var jobInfo = e.jobInfo;
        var jobLI, list;
        list = document.getElementById("jobsList");
        if (jobInfo.jobStatus === "esriJobSubmitted") {
            jobLI = new JobListItem(jobInfo.jobId);
            list.appendChild(jobLI.listItem);
            jobListItems[jobInfo.jobId] = jobLI;
        } else {
            jobLI = jobListItems[jobInfo.jobId];
            if (jobInfo.jobStatus !== "esriJobExecuting") {
                jobLI.loading = false;
            }
        }
        console.debug("status-update", e);
    });

    gp.on("job-complete", function (e) {
        console.debug("job-complete", e);
        this.getResultData(e.jobInfo.jobId, "zip_file_path").then(function (dataEvent) {
            console.debug("get-result-data-complete", dataEvent);
            var jobLI = jobListItems[e.jobInfo.jobId];
            jobLI.link.href = dataEvent.value.url;
            jobLI.link.textContent = dataEvent.value.url;
        });
    });

    gp.on("job-cancel", function (e) {
        console.debug("job-cancel", e);
    });

    gp.on("error", function (e) {
        console.error("GP error", e);
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

        return gp.submitJob(params);
    }

    form.onsubmit = function () {
        submitJob();
        return false;
    };

    if (form.checkValidity()) {
        submitJob();
    }

});