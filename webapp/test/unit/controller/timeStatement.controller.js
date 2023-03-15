/*global QUnit*/

sap.ui.define([
	"nmsp/time_st/controller/timeStatement.controller"
], function (Controller) {
	"use strict";

	QUnit.module("timeStatement Controller");

	QUnit.test("I should test the timeStatement controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
