/*global define*/
/*jslint white:true, eqeq:true, regexp:true*/

define(function() {
	"use strict";
	
	/**
	 * Splits a Pascal-Case word into individual words separated by spaces. 
	 * @param {Object} word
	 * @returns {String}
	 */
	function splitPascalCase(word) {
		var wordRe = /($[a-z])|[A-Z][^A-Z]+/g;
		return word.match(wordRe).join(" ");
	}
	
	
	/**
	 * Splits a camelCase or PascalCase word into individual words separated by spaces. 
	 * @param {Object} word
	 * @returns {String}
	 */
	function splitCamelCase(word) {
		var output, i, l, capRe = /[A-Z]/;
		if (typeof(word) !== "string") {
			throw new Error("The \"word\" parameter must be a string.");
		}
		output = [];
		for (i = 0, l = word.length; i < l; i += 1) {
			if (i === 0) {
				output.push(word[i].toUpperCase());
			}
			else {
				if (i > 0 && capRe.test(word[i])) {
					output.push(" ");
				}
				output.push(word[i]);
			}
		}
		return output.join("");
	}
	
	/**
	 * Creates an HTML DL of the attributes of an esri.Graphic (or any object that has a property named attributes that is an object). 
	 * @param {Object} graphic An esri.Graphic (or any object that has a property named attributes that is an object).
	 * @param {Regex} [ignoreRe] Any attribute with a name matching this Regex will be omitted from the output DL.  If no RE is given, all properties will be included. 
	 * @returns {String}
	 */
	function graphicToList(graphic, ignoreRe) {
		var output, attributes = graphic.attributes, name;
		if (graphic != null && graphic.attributes != null) {
			output = ["<dl>"];
			for (name in attributes) {
				if (attributes.hasOwnProperty(name) && (ignoreRe == null || ignoreRe.exec(name) === null)) {
					output.push(["<dt>", splitPascalCase(name), "</dt>", "<dd>", attributes[name] || "(null)", "</dd>"].join(""));
				}
			}
			output.push("</dl>");
			output = output.join("");
		}
		return output;
	}
	
	return {
		graphicToList: graphicToList,
		splitPascalCase: splitPascalCase,
		splitCamelCase: splitCamelCase
	};
});
