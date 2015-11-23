'use strict';

var Promise = require('bluebird');
var test = require('tape');

exports.suite = function (wrapper) {
	var API = Object.create(null);
	var before = function () {};
	var after = function () {};
	var testRunner = null;

	API.before = function (fn) {
		before = fn;
	};

	API.after = function (fn) {
		after = fn;
	};

	API.test = function (fn) {
		testRunner = fn;
	};

	wrapper(API);

	Promise.resolve()
		.then(function runBefore() {
			return before();
		})
		.then(function runTests() {
			return testRunner(test);
		})
		.then(function runAfter() {
			return after();
		})
		.catch(function (err) {
			console.error('Uncaught Error in test suite:');
			console.error(err.stack || err.message || err);
			process.exit(1);
		});
};
