define([
	'teststack!object',
	'teststack/chai!assert',
	'../Registry',
], function(
	registerSuite,
	assert,
	ComponentsRegistry
) {
	var reg, sub1, sub2, sub3;

	registerSuite({
		name : "Sub-components management",
		beforeEach : function() {
			reg = new ComponentsRegistry();
			sub1 = {};
			sub2 = {};
			sub3 = {};
		},
		"add one component without name": function(){
			reg.add(sub1);
			assert(reg.has(sub1));
			assert(reg.length === 1);
		},
		"add one component with a name and get it": function(){
			reg.add(sub1, "sub1");
			assert.equal(reg.get('sub1'), sub1);
			assert(reg.has(sub1));
			// assert.equal(reg._sub1, sub1);
			assert(reg.length === 1);
		},
		"add many components without name": function(){
			var cmps = [sub1, sub2, sub3];
			reg.addEach(cmps);
			cmps.forEach(function(cmp){
				assert(reg.has(cmp));
			});
			assert(reg.length === 3);
		},
		"add many components with names": function(){
			var cmps = {
				"sub1": sub1,
				"sub2": sub2,
				"sub3": sub3
			};
			reg.addEach(cmps);
			Object.keys(cmps).forEach(function (k) {
				assert.equal(reg.get(k), cmps[k]);
			});
			assert(reg.length === 3);
		},
		"unknown components don't get returned": function(){
			reg.add(sub1);
			assert(!reg.get('sub1'));
			assert(!reg.get(sub2));
		},
/*		"get component id": function(){
			reg.add(sub1, "sub1");
			assert.equal(reg._getComponentId(sub1), 'sub1');
			reg.add(sub2);
			assert(reg._getComponentId(sub2) === undefined);
			assert(reg._getComponentId({}) === undefined);
		},
*/		"register and cancel one binding without name": function(){
			reg.add(sub1);
			reg.add(sub2);
			var binding1Canceled = false;
			reg.addBindings([sub1, sub2], function(){
				binding1Canceled = true;
			});
			assert(reg._bindings.length === 1); // one entry
			reg.unbind(sub1);
			assert(binding1Canceled);
			assert(reg._bindings.length === 0);
		},
		"register and cancel an array of bindings without name": function(){
			reg.add(sub1);
			reg.add(sub2);
			var binding2Canceled = false;
			var binding3Canceled = false;
			reg.addBindings([sub1, sub2], [
				function(){ binding2Canceled = true;},
				function(){ binding3Canceled = true;},
			]);
			assert(reg._bindings.length === 1);
			reg.unbind(sub2);
			assert(binding2Canceled);
			assert(binding3Canceled);
			assert(reg._bindings.length === 0);
		},
		"register and cancel many bindings without name": function(){
			reg.add(sub1);
			reg.add(sub2);
			var binding1Canceled = false;
			reg.addBindings(sub1, function(){
				binding1Canceled = true;
			});
			assert(reg._bindings.length === 1);
			var binding2Canceled = false;
			var binding3Canceled = false;
			reg.addBindings(sub1, [
				{remove: function(){ binding2Canceled = true;}},
				{cancel: function(){ binding3Canceled = true;}},
			]);
			assert(reg._bindings.length === 2);
			reg.unbind(sub1);
			assert(binding1Canceled);
			assert(binding2Canceled);
			assert(binding3Canceled);
			assert(reg._bindings.length === 0);
		},
		"register and cancel bindings with names": function(){
			reg.add(sub1);
			reg.add(sub2);
			var binding1Canceled = false;
			reg.addBindings([sub1, sub2], function(){
				binding1Canceled = true;
			}, "binding1");
			var binding2Canceled = false;
			var binding3Canceled = false;
			reg.addBindings([sub1, sub2], [
				function(){ binding2Canceled = true;},
				function(){ binding3Canceled = true;},
			], "binding2and3");
			assert(reg._bindings.length === 2);
			reg.unbind(sub1, "binding1");
			assert(binding1Canceled);
			assert(!binding2Canceled);
			assert(!binding3Canceled);
			assert(reg._bindings.length === 1);
			reg.unbind(sub2, "binding2and3");
			assert(binding2Canceled);
			assert(binding3Canceled);
			assert(reg._bindings.length === 0);
		},
		"register and cancel all bindings with names": function(){
			reg.add(sub1);
			reg.add(sub2);
			var binding1Canceled = false;
			reg.addBindings([sub1, sub2], function(){
				binding1Canceled = true;
			}, "binding1");
			var binding2Canceled = false;
			var binding3Canceled = false;
			reg.addBindings(sub1, [
				function(){ binding2Canceled = true;},
				function(){ binding3Canceled = true;},
			], "binding2and3");
			assert(reg._bindings.length === 2);
			reg.unbind(sub1);
			assert(binding1Canceled);
			assert(binding2Canceled);
			assert(binding3Canceled);
			assert(reg._bindings.length === 0);
		},
		"remove one component without name": function(){
			reg.add(sub1);
			reg.add(sub2);
			reg.add(sub3);
			reg.addBindings(sub1, function(){});
			reg.addBindings(sub2, function(){});
			assert(reg.length === 3);
			assert(reg._bindings.length === 2);
			reg.remove(sub1);
			assert(!reg.has(sub1));
			assert(reg.length === 2);
			assert(reg._bindings.length === 1);
		},
		"remove one component by name": function(){
			reg.add(sub1, "sub1");
			reg.addEach([sub2, sub3]);
			reg.addBindings("sub1", function(){});
			reg.addBindings(sub2, function(){});
			assert(reg.length === 3);
			assert(reg._bindings.length === 2);
			// assert.equal(reg._sub1, sub1);
			reg.remove("sub1");
			assert(!reg.has("sub1"));
			assert(reg.length === 2);
			assert(reg._bindings.length === 1);
			// assert.equal(reg._sub1, undefined);
		},
		"remove many components without name": function(){
			reg.addEach([sub1, sub2, sub3]);
			reg.addBindings(sub1, function(){});
			reg.addBindings(sub2, function(){});
			assert(reg.length === 3);
			assert(reg._bindings.length === 2);
			reg.removeEach([sub1, sub2]);
			assert(!reg.has(sub1));
			assert(!reg.has(sub2));
			assert(reg.length === 1);
			assert(reg._bindings.length === 0);
		},
		"remove many components by name": function(){
			reg.add(sub1, "sub1");
			reg.addEach({
				"sub2" : sub2,
				"sub3" : sub3
			});
			reg.addBindings("sub1", function(){});
			reg.addBindings(sub2, function(){});
			assert(reg.length === 3);
			assert(reg._bindings.length === 2);
			reg.removeEach(["sub1", "sub2"]);
			assert(!reg.has("sub1"));
			assert(!reg.has("sub2"));
			assert(reg.length === 1);
			assert(reg._bindings.length === 0);
		},
/*		"destroy reg component": function(){
			reg.add(sub1);
			reg.add([sub2, sub3]);
			reg.addBindings(sub1, function(){});
			reg.addBindings(sub2, function(){});
			assert(reg.length === 3);
			assert(reg._bindings.length === 2);
			reg.destroy();
			assert(reg.length === 0);
			assert(reg._bindings.length === 0);
		},
*/		"don't add an anonymous component twice": function(){
			reg.add(sub1);
			assert.throw(function(){reg.add(sub1);}, "A value can not be added twice");
			assert(reg.length === 1);
		},
		"don't add a named component twice": function(){
			reg.add(sub1, "sub1");
			assert.throw(function(){reg.add(sub1, "sub2");}, "A value can not be added twice");
			assert(reg.length === 1);
		},


	});


});