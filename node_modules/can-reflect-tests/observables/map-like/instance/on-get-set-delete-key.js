var QUnit = require("steal-qunit");
var canReflect = require("can-reflect");

module.exports = function(name, makeInstance) {

    QUnit.test(name+" onKeyValue, setKeyValue, getKeyValue, deleteKeyValue, getOwnKeys", function(){
        var instance = makeInstance();

        var onKeyValues = [];
        QUnit.notOk( canReflect.isBound(instance), "not bound");
        canReflect.onKeyValue(instance,"prop",function(value){
            onKeyValues.push(value);
        });

        QUnit.ok( canReflect.isBound(instance), "bound");

        canReflect.setKeyValue(instance,"prop", "FIRST");
        canReflect.getOwnKeys(instance,["prop"], ".getOwnKeys has set prop");

        QUnit.equal( canReflect.getKeyValue(instance,"prop"), "FIRST", ".getKeyValue");

        canReflect.deleteKeyValue(instance,"prop");

        QUnit.equal( canReflect.getKeyValue(instance,"prop"), undefined, ".deleteKeyValue made it undefined");

        QUnit.deepEqual(onKeyValues,["FIRST", undefined], "onKeyValue");
        QUnit.deepEqual( canReflect.getOwnEnumerableKeys(instance) , [], ".getOwnKeys loses deleted prop");
    });

};
