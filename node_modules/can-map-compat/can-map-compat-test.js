var DefineMap = require("can-define/map/map");
var ObserveObject = require("can-observe").Object;
var QUnit = require('steal-qunit');
var makeCompat = require('./can-map-compat').makeCompat;

function tests(typeName, createType) {
	QUnit.module('can-map-compat - ' + typeName + ' .attr()');

	QUnit.test("map.attr(key) gets a value", function() {
		var Type = makeCompat(createType());
		var map = new Type({ foo: "bar" });

		var val = map.attr("foo");
		QUnit.equal(val, "bar", "get the value");
	});

	QUnit.test("map.attr() supports nested value", function() {
		var Type = makeCompat(createType());
		var map = new Type({ parent: { child: 1 }});

		var val = map.attr("parent.child");
		QUnit.equal(val, 1, "Got a nested prop");
	});

	QUnit.test("map.attr() gets unwrapped version", function() {
		var Type = makeCompat(createType());
		var map = new Type({ foo: "bar", baz: "qux"});

		var obj = map.attr();
		QUnit.deepEqual(obj, { foo: "bar", baz: "qux"}, "Unwrapped correctly");
	});

	QUnit.test("map.attr({key:val}) does an assign", function() {
		var Type = makeCompat(createType());
		var map = new Type({ foo: "bar" });

		map.attr({ foo: "baz" });
		var val = map.attr("foo");
		QUnit.equal(val, "baz", "Value changed");
	});

	QUnit.test("map.attr({key:val}, true) does an update", function() {
		var Type = makeCompat(createType());
		var map = new Type({ foo: "bar", "baz": "qux" });

		map.attr({ foo: "baz" }, true);
		var val = map.attr();
		QUnit.deepEqual(val, { foo: "baz" }, "Removed other vals");
	});

	QUnit.test("map.attr(key, value) sets a value", function() {
		var Type = makeCompat(createType());
		var map = new Type({ foo: "bar" });

		var val = map.attr("foo", "baz").attr("foo");
		QUnit.equal(val, "baz", "value changed");
	});

	QUnit.test("map.attr(key, value) supports nested objects", function() {
		var Type = makeCompat(createType());
		var map  = new Type({ parent: { child: 1 }});

		var val = map.attr("parent.child", 2).attr("parent.child");
		QUnit.equal(val, 2, "Able to set nested values");
	});

	QUnit.module('can-map-compat - ' + typeName + ' .removeAttr()');

	QUnit.test("map.removeAttr(key) removes the key", function() {
		var Type = makeCompat(createType());
		var map = new Type({ foo: "bar" });

		var val = map.removeAttr("foo");
		QUnit.equal(val, "bar", "got the removed value");
		QUnit.deepEqual(map.attr(), {}, "No keys now");
	});
}

// DefineMap
tests("DefineMap", function(){
	return DefineMap.extend({});
});

// ObserveObject
tests("ObserveObject", function(){
	return ObserveObject.extend({});
});
