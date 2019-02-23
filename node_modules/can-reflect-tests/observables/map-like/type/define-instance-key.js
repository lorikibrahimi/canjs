var QUnit = require("steal-qunit");
var canSymbol = require("can-symbol");
var canReflect = require("can-reflect");

module.exports = function(name, makeType) {

    QUnit.test(name+" canReflect.defineInstanceKey", function(){
        var Type = makeType();
    	Type[canSymbol.for("can.defineInstanceKey")]("prop", {value: 0, configurable: true, writable: true, enumerable: true});



    	var t = new Type();
        QUnit.equal(canReflect.getKeyValue(t,"prop"), 0, "default value used");

        canReflect.setKeyValue(t,"prop","5");
    	t.prop = "5";
    	QUnit.equal(t.prop, "5", "value set");
    });

};
