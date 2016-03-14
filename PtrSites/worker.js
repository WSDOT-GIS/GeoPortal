"use strict";

importScripts("../bower_components/promise-polyfill/Promise.min.js");

////var gpUrl = "http://hqolymgis99t:6080/arcgis/rest/services/Traffic/GetFilteredCsv/GPServer/Get Filtered CSV";
var siteIdsUrl = "http://hqolymgis99t:6080/arcgis/rest/services/Traffic/PTRSites/MapServer/0/query";
////var minMaxYearsUrl = "http://hqolymgis99t:6080/arcgis/rest/services/Traffic/PTRSites/MapServer/3/query";
var getValidDateRangeUrl = "http://hqolymgis99t:6080/arcgis/rest/services/Traffic/PTRSites/MapServer/2/query";

/**
 * Converts an object into a URL search.
 * @param {Object} o - An object
 * @returns {string} URL search
 */
function objectToSearch(o) {
    var value, output = [];
    for (var pName in o) {
        if (o.hasOwnProperty(pName)) {
            value = o[pName];
            if (value instanceof Object) {
                value = JSON.stringify(value);
            }
            output.push([pName, value].map(encodeURIComponent).join("="));
        }
    }
    output = output.join("&");
    return output;
}

// JSON reviver that converts ArcGIS style date integers into dates and trims strings.
var reviver = function (k, v) {
    var re = /Date$/i;
    if (re.test(k)) {
        return new Date(v);
    } else if (typeof v === "string") {
        return v.trim();
    }
    return v;
};

/**
 * Executes an HTTP request for a URL.
 * @param {string} url - url
 * @param {Object} searchParams - Object with search parameters.
 * @param {Function} [jsonReviver] - Function for custom JSON deserialization.
 * @returns {Promise.<(Object|string)>} - Returns the result of the query.
 */
function executeQuery(url, searchParams, jsonReviver) {
    var queryUrl = [url, objectToSearch(searchParams)].join("?");

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

/**
 * Gets a list of valid site IDs.
 * @returns {Promise.<Object.<string, string>>} Promise with list of site IDs.
 */
function getSiteIds() {
    // Populate site id option list. JSON reviver trims excess space from strings.
    var searchParams = {
        where: "1=1",
        outFields: "ADCTrafficSDE.DBO.PTRSites.SiteID,ADCTrafficSDE.DBO.ADCTrafficSiteCurrentLocation.SiteLocation",
        returnGeometry: false,
        orderByFields: "ADCTrafficSDE.DBO.PTRSites.SiteID",
        returnDistinctValues: true,
        f: "json"
    };
    return new Promise(function (resolve, reject) {
        executeQuery(siteIdsUrl, searchParams, reviver).then(function (data) {
            var field = data.fields[0].name;
            var descField = data.fields[1].name;
            var output = {};
            data.features.forEach(function (feature) {
                output[feature.attributes[field]] = feature.attributes[descField];
            });
            resolve(output);
        }, function (error) {
            reject({ "message": "Error getting site IDs", error: error });
        });
    });
}

/**
 * Gets a valid date range for user input
 * @returns {Date[]} An array with two dates: min and max.
 */
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

    var promise = executeQuery(getValidDateRangeUrl, validDateRangeSearchParams, reviver);
    return new Promise(function (resolve, reject) {
        promise.then(function (results) {
            var attributes = results.features[0].attributes;
            var minYear = attributes.minDate;
            var maxYear = attributes.maxDate;
            resolve([minYear, maxYear]);
        }, function (error) {
            reject(error);
        });
    });
}

/**
 * Gets per-site valid date ranges.
 * @returns {Promise.<Object.<string, Date[]>>} - A promise with date ranges grouped by site IDs.
 */
function getValidDateRangesForSiteIds() {
    var validDateRangeSearchParams = {
        outFields: "SiteID",
        groupByFieldsForStatistics: "SiteID",
        orderByFields: "SiteID",
        f: "json",
        outStatistics: [
            {
                statisticType: "min",
                onStatisticField: "Date",
                outStatisticFieldName: "minDate"
            },
            {
                statisticType: "max",
                onStatisticField: "Date",
                outStatisticFieldName: "maxDate"
            }
        ]
    };

    var promise = executeQuery(getValidDateRangeUrl, validDateRangeSearchParams, reviver);
    return new Promise(function (resolve, reject) {
        promise.then(function (results) {
            var output = {};
            var data = results.features.forEach(function (feature) {
                output[feature.attributes.SiteID] = [feature.attributes.minDate, feature.attributes.maxDate];
            });
            resolve(output);
        }, function (error) {
            reject(error);
        });
    });
}


var siteIdsPromise = getSiteIds();

siteIdsPromise.then(function (siteIds) {
    postMessage({ messageType: "site ids", siteIds: siteIds });
}, function (err) {
    postMessage({ messageType: "site ids error", error: err });
});

var dateRangePromise = getValidDateRange();
dateRangePromise.then(function (dates) {
    postMessage({ dates: dates });
}, function (err) {
    postMessage({ messageType: "date range error", error: err });
});

// Once all of the promises have been completed, send a final message
// and close the worker.
Promise.all([siteIdsPromise, dateRangePromise]).then(function (results) {
    postMessage({ message: "worker closed", results: results, hasErrors: false});
    self.close();
}, function (results) {
    postMessage({ message: "worker closed", results: results, hasErrors: true });
    self.close();
});


