(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory();
    } else {
        // Browser globals (root is window)
        root.routeTypeUtils = factory();
    }
}(this, function () {

    var routeTypeAbbrevsArray = ["SR", "IS", "US", "RA", "LC", "FT", "PR", "CN", "TB"];

    var routeTypeAbbrevs = {
        SR: 0,
        IS: 1,
        US: 2,
        RA: 3,
        LC: 4,
        FT: 5,
        PR: 6,
        CN: 7,
        TB: 8
    };

    var routeClassRe = /^(?:(SR)|(IS)|(US)|(RA)|(LC)|(FT)|(PR)|(CN)|(TB))$/i;

    function getRouteTypeValue(value) {
        var match, output = null;
        if (typeof value === "string") {
            match = value.match(routeClassRe);
            if (match) {
                if (match[1]) {
                    output = routeTypeAbbrevs.SR;
                } else if (match[2]) {
                    output = routeTypeAbbrevs.IS;
                } else if (match[3]) {
                    output = routeTypeAbbrevs.US;
                } else if (match[4]) {
                    output = routeTypeAbbrevs.RA;
                } else if (match[5]) {
                    output = routeTypeAbbrevs.LC;
                } else if (match[6]) {
                    output = routeTypeAbbrevs.FT;
                } else if (match[7]) {
                    output = routeTypeAbbrevs.PR;
                } else if (match[8]) {
                    output = routeTypeAbbrevs.CN;
                } else if (match[9]) {
                    output = routeTypeAbbrevs.TB;
                }
            }
        } else if (typeof value === "number" && Math.trunc(value) === value && (value >= 0 && value <= 8)) {
            output = value;
        }
        return output;
    }

    function getRouteTypeAbbreviation(value) {
        var output;
        if (typeof value === "number" && value >= 0 && value < routeTypeAbbrevsArray.length) {
            output = routeTypeAbbrevsArray[value];
        } else if (typeof value === "string" && routeClassRe.test(value)) {
            output = value.toUpperCase();
        } else {
            throw new Error("Invalid value");
        }
        return output;
    }

    var output = {
        getRouteTypeValue: getRouteTypeValue,
        getRouteTypeAbbreviation: getRouteTypeAbbreviation
    };

    return output;
}));