define([
	'teststack!object',
	'teststack/chai!assert',
	'../Registry',
], function(
	registerSuite,
	assert,
	Registry
) {
	var reg;
	var values;

	registerSuite({
		name : "Registry without id property",
		beforeEach : function() {
			reg = new Registry();
			values = [
				0,
				{},
				"",
			];
			values.forEach(function(v){
				reg.add(v);
			});
		},
		"has": function(){
			values.forEach(function(v){
				assert(reg.has(v));
			});
		},
		"hasId": function(){
			assert(reg.hasId(undefined));
			assert(!reg.hasId(null));
		},
		"getValues": function(){
			assert.deepEqual(reg.getValues(undefined), values);
		},
	});
	registerSuite({
		name : "Registry with unique id property",
		beforeEach : function() {
			reg = new Registry();
			values = {
				v0: 0,
				v1: {},
				v2: "",
			};
			Object.keys(values).forEach(function(k){
				reg.add(values[k], k);
			});
		},
		"has": function(){
			Object.keys(values).forEach(function(k){
				assert(reg.has(values[k]));
			});
		},
		"getId": function(){
			Object.keys(values).forEach(function(k){
				assert(reg.getId(values[k]) === k);
			});
		},
		"hasId": function(){
			Object.keys(values).forEach(function(k){
				assert(reg.hasId(k));
			});
		},
		"getValues": function(){
			Object.keys(values).forEach(function(k){
				assert.deepEqual(reg.getValues(k), [values[k]]);
			});
		},
	});

	var childParentPairs;

	registerSuite({
		name : "Registry with non unique id property",
		beforeEach : function() {
			reg = new Registry();
			childParentPairs = [
				["1"],
				["11", "1"],
				["12", "1"],
				["13", "1"],
				["121", "12"],
				["122", "12"],
				["1221", "122"],
				["1222", "122"],
				["12221", "1222"],
			];
			childParentPairs.forEach(function(pair){
				reg.add(pair[0], pair[1]);
			});
		},
		"has": function(){
			childParentPairs.forEach(function(pair){
				assert(reg.has(pair[0]));
			});
		},
		"get parent": function(){
			childParentPairs.forEach(function(pair){
				assert(reg.getId(pair[0]) === pair[1]);
			});
		},
		"get children": function(){
			// childParentPairs.forEach(function(pair){
			// 	console.log("children of", pair[1], reg.getValues(pair[1]).toArray());
			// });
			assert.deepEqual(reg.getValues(), ["1"]);
			assert.deepEqual(reg.getValues("1"), ["11", "12", "13"]);
			assert.deepEqual(reg.getValues("11"), []);
			assert.deepEqual(reg.getValues("12"), ["121", "122"]);
		},

	});

});