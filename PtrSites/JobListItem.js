/// <reference path="../bower_components/polyfills/url.js" />
/// <reference path="../bower_components/promise-polyfill/Promise.js" />

/**
 * List item representing a GP job.
 * @module JobListItem
 */
define(function () {
    "use strict";

    var loadingClassName = "loading";
    var errorClassName = "error";

    /**
     * An object that manages a list item associated with a job.
     * @constructor
     * @alias module:JobListItem
     * @param {string} siteId - The site ID label on the link.
     * @param {string} startDate - The start date label on the link.
     * @param {string} endDate - The end date label on th elink.
     * @property {string} jopId - The identifier for the geoprocessing job.
     * @property {HTMLLIElement} listItem - The list item (<li>) associated with this object.
     * @property {Boolean} loading - Gets or sets the "loading" status of this object. Changing this value will toggle the "loading" class on the list item.
     * @property {string} link - Gets or sets the URL inside of the <a> element.
     * @property {string} siteId - Gets or sets the site ID label on the link.
     * @property {string} startDate - Gets or sets the start date label on the link.
     * @property {string} endDate - Gets or sets the end date label on th elink.
     * @property {string} error - Gets or sets the error message on the list item.
     */
    function JobListItem(siteId, startDate, endDate) {
        var _jobId = null;
        var li = document.createElement("li");
        li.classList.add("list-group-item");
        li.classList.add("loading");
        var progress = document.createElement("progress");
        progress.textContent = "Loading...";


        
        var a = document.createElement("a");
        a.setAttribute("type", "application/zip");

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
        errorP.classList.add(errorClassName);
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
                    li.classList.contains(loadingClassName);
                },
                set: function (isLoading) {
                    if (isLoading) {
                        li.classList.add(loadingClassName);
                    } else {
                        li.classList.remove(loadingClassName);
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
                        li.classList.add(errorClassName);
                    } else {
                        li.classList.remove(errorClassName);
                    }
                }
            }
        });

        // Set the values from parameters if provided.
        if (siteId) {
            this.siteId = siteId;
        }
        if (startDate) {
            this.startDate = startDate;
        }
        if (endDate) {
            this.endDate = endDate;
        }
    }

    /**
     * Updates the "download" attribute of the anchor element.
     */
    JobListItem.prototype.updateDownloadAttribute = function () {
        var a, fn;
        a = this.listItem.querySelector("a");
        fn = ["PTR ", this.siteId, " from ", this.startDate, " to ", this.endDate, ".zip"].join("");
        a.setAttribute("download", fn);
    };

    return JobListItem;
});