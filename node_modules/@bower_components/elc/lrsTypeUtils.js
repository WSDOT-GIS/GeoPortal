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
        root.lrsTypeUtils = factory();
    }
}(this, function () {
    var LRS_TYPE_INCREASE = 1;
    var LRS_TYPE_DECREASE = 2;
    var LRS_TYPE_BOTH = 3;
    var LRS_TYPE_RAMP = 4;
    var LRS_TYPE_FT = 8;
    var LRS_TYPE_TURNBACK = 0x10;

    /**
     * Returns the numerical value.
     * @param {(number|string)} value - either a number or a string
     * @returns {number} Returns the number corresponding to the input value. If the input is a valid number, the same value is returned.
     */
    function getLrsTypeValue(value) {
        var output = null;
        if (typeof value === "string") {
            if (/^i/i.test(value)) {
                output = LRS_TYPE_INCREASE;
            } else if (/^d/i.test(value)) {
                output = LRS_TYPE_DECREASE;
            } else if (/^b/i.test(value)) {
                output = LRS_TYPE_BOTH;
            } else if (/^r/i.test(value)) {
                output = LRS_TYPE_RAMP;
            } else if (/^f/i.test(value)) {
                output = LRS_TYPE_FT;
            } else if (/t/i.test(value)) {
                output = LRS_TYPE_TURNBACK;
            }
        } else if (typeof value === "number" && (value >= 1 && value <= 4) || (value === 8 || value === 16)) {
            output = value;
        } else {
            throw new Error("Invalid value");
        }

        return output;
    }

    var output = {
        getLrsTypeValue: getLrsTypeValue,
        /** 
         * Route is increase only.
         * @constant 
         * @type{number}
         * @default 1
         * 
         */
        LRS_TYPE_INCREASE: LRS_TYPE_INCREASE,
        /** 
         * Route is decrease only
         * @constant
         * @type{number}
         * @default 2
         */
        LRS_TYPE_DECREASE: LRS_TYPE_DECREASE,
        /** 
         * Route is both increase and decrease.
         * @constant
         * @type{number}
         * @default 3 ({@link LRS_TYPE_INCREASE} | {@link LRS_TYPE_DECREASE} )
         */
        LRS_TYPE_BOTH: LRS_TYPE_BOTH,
        /** 
         * Route is a ramp.
         * @constant
         * @type{number}
         * @default 4
         */
        LRS_TYPE_RAMP: LRS_TYPE_RAMP,
        /** 
         * Route is a ferry terminal.
         * @constant
         * @type{number}
         * @default 8
         */
        LRS_TYPE_FT: LRS_TYPE_FT,

        /** 
         * Route is a turnback.
         * @constant
         * @type{number}
         * @default 16
         */
        LRS_TYPE_TURNBACK: LRS_TYPE_TURNBACK
    };

    return output;
}));