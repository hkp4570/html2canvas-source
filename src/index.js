"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var html2canvas = function (element, options) {
    if (options === void 0) { options = {}; }
    return renderElement(element, options);
};
exports.default = html2canvas;
var renderElement = function (element, opts) {
    console.log(element, opts);
    return 'renderElement';
};
