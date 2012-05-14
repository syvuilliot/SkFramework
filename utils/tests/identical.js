define([
	"doh/runner",
	"../identical",
], function(doh, identical){

doh.register("identical tests", {
	//"numbers"
	//"strings"
	//arrays of strings
	"objects": function(t){
		var a = {a:"test", b:"retest"};
		var b = {b:"retest", a:"test"};
		t.t(identical(a, b));
	},
	"nested objects": function(t){
		var a = {a:"test", b:{ba:"test", bb:"retest"}};
		var b = {b:{bb:"retest", ba:"test"}, a:"test"};
		t.t(identical(a, b));
	},
	"array of objects order relevant": function(t){
		var a = {name:"toto", age:30};
		var b = {name:"titi", age:20};
		t.t(identical([a, b], [a, b]));
		t.f(identical([b, a], [a, b]));
	},
	"array of objects order irrelevant": function(t){
		var a = {name:"toto", age:30};
		var b = {name:"titi", age:20};
		t.t(identical([a, b], [a, b], true));
		t.t(identical([b, a], [a, b], true));
	},

});

});