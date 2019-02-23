var QUnit = require("steal-qunit");
var canSymbol = require("can-symbol");
var canReflect = require("can-reflect");

module.exports = function(name, makeType) {

    QUnit.test(name+" canRelect.onInstancePatches with splice", function(){
        var Type = makeType();

        var calls = [];
        function handler(obj, patches) {
            calls.push([obj, patches]);
        }

        Type[canSymbol.for("can.onInstancePatches")](handler);

        var list = new Type([1,2]);
        list.splice(2,0,3);

        Type[canSymbol.for("can.offInstancePatches")](handler);
        list.splice(3,0,4);

        QUnit.deepEqual(calls,[
            [list,  [{type: "splice", index: 2, deleteCount: 0, insert: [3]} ] ]
        ]);
    });

};
