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
		name : "Registering without key",
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
		"hasKey": function(){
			assert(reg.hasKey(undefined));
			assert(!reg.hasKey(null));
		},
		"getValues": function(){
			assert.deepEqual(reg.getValues(undefined), values);
		},
		"length": function(){
			assert(reg.length === 3);
		},
		"remove": function(){
			values.forEach(function(v){
				reg.remove(v);
				assert(!reg.has(v));
			});
			assert(reg.length === 0);
		},
		"add twice": function(){
			values.forEach(function(v){
				assert.throw(function(){
					reg.add(v);
				}, "A value can not be added twice");
			});
		},
	});
	registerSuite({
		name : "Registering with unique keys",
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
		"getKey": function(){
			Object.keys(values).forEach(function(k){
				assert(reg.getKey(values[k]) === k);
			});
		},
		"hasKey": function(){
			Object.keys(values).forEach(function(k){
				assert(reg.hasKey(k));
			});
		},
		"getValues": function(){
			Object.keys(values).forEach(function(k){
				assert.deepEqual(reg.getValues(k), [values[k]]);
			});
		},
		"length": function(){
			assert(reg.length === 3);
		},
		"remove": function(){
			Object.keys(values).forEach(function(k){
				reg.remove(values[k]);
				assert(!reg.has(values[k]));
				assert(!reg.hasKey(k));
			});
			assert(reg.length === 0);
		},
	});

	var childParentPairs;

	registerSuite({
		name : "Registering with non unique keys",
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
		"getKey": function(){
			childParentPairs.forEach(function(pair){
				assert(reg.getKey(pair[0]) === pair[1]);
			});
		},
		"getValues": function(){
			assert.deepEqual(reg.getValues(), ["1"]);
			assert.deepEqual(reg.getValues("1"), ["11", "12", "13"]);
			assert.deepEqual(reg.getValues("11"), []);
			assert.deepEqual(reg.getValues("12"), ["121", "122"]);
		},
		"length": function(){
			assert(reg.length === 9);
		},
	});

});