define([
	'teststack!object',
	'teststack/chai!assert',
	'ksf/utils/IndexedSet',
	'../BindingsManager',
], function(
	registerSuite,
	assert,
	IndexedSet,
	BindingsManager
) {
	var bindings, reg, sub1, sub2, sub3;
	registerSuite({
		name: "basics",
		beforeEach: function(){
			reg = new IndexedSet();
			sub1 = {name: "sub1"};
			sub2 = {name: "sub2"};
			sub3 = {name: "sub3"};
			reg.addEach([sub1, sub2, sub3]);
			bindings = new BindingsManager({
				components: reg,
			});
		},
		"register and cancel one binding without name": function(){
			var binding1Canceled = false;
			bindings.add([sub1, sub2], function(){
				binding1Canceled = true;
			});
			assert(bindings._bindings.length === 1); // one entry
			bindings.unbind(sub1);
			assert(binding1Canceled);
			assert(bindings._bindings.length === 0);
		},
		"register and cancel an array of bindings without name": function(){
			var binding2Canceled = false;
			var binding3Canceled = false;
			bindings.add([sub1, sub2], [
				function(){ binding2Canceled = true;},
				function(){ binding3Canceled = true;},
			]);
			assert(bindings._bindings.length === 1);
			bindings.unbind(sub2);
			assert(binding2Canceled);
			assert(binding3Canceled);
			assert(bindings._bindings.length === 0);
		},
		"register and cancel many bindings without name": function(){
			var binding1Canceled = false;
			bindings.add(sub1, function(){
				binding1Canceled = true;
			});
			assert(bindings._bindings.length === 1);
			var binding2Canceled = false;
			var binding3Canceled = false;
			bindings.add(sub1, [
				{remove: function(){ binding2Canceled = true;}},
				{cancel: function(){ binding3Canceled = true;}},
			]);
			assert(bindings._bindings.length === 2);
			bindings.unbind(sub1);
			assert(binding1Canceled);
			assert(binding2Canceled);
			assert(binding3Canceled);
			assert(bindings._bindings.length === 0);
		},
		"register and cancel bindings with names": function(){
			var binding1Canceled = false;
			bindings.add([sub1, sub2], function(){
				binding1Canceled = true;
			}, "binding1");
			var binding2Canceled = false;
			var binding3Canceled = false;
			bindings.add([sub1, sub2], [
				function(){ binding2Canceled = true;},
				function(){ binding3Canceled = true;},
			], "binding2and3");
			assert(bindings._bindings.length === 2);
			bindings.unbind(sub1, "binding1");
			assert(binding1Canceled);
			assert(!binding2Canceled);
			assert(!binding3Canceled);
			assert(bindings._bindings.length === 1);
			bindings.unbind(sub2, "binding2and3");
			assert(binding2Canceled);
			assert(binding3Canceled);
			assert(bindings._bindings.length === 0);
		},
		"register and cancel all bindings with names": function(){
			var binding1Canceled = false;
			bindings.add([sub1, sub2], function(){
				binding1Canceled = true;
			}, "binding1");
			var binding2Canceled = false;
			var binding3Canceled = false;
			bindings.add(sub1, [
				function(){ binding2Canceled = true;},
				function(){ binding3Canceled = true;},
			], "binding2and3");
			assert(bindings._bindings.length === 2);
			bindings.unbind(sub1);
			assert(binding1Canceled);
			assert(binding2Canceled);
			assert(binding3Canceled);
			assert(bindings._bindings.length === 0);
		},
		"remove one component": function(){
			var binding1Canceled = false;
			bindings.add(sub1, function(){
				binding1Canceled = true;
			});
			var binding2Canceled = false;
			bindings.add(sub2, function(){
				binding2Canceled = true;
			});
			assert(bindings._bindings.length === 2);
			reg.remove(sub1);
			assert(bindings._bindings.length === 1);
			assert(binding1Canceled);
			assert(!binding2Canceled);
		},
		"remove many components": function(){
			var binding1Canceled = false;
			bindings.add(sub1, function(){
				binding1Canceled = true;
			});
			var binding2Canceled = false;
			bindings.add(sub2, function(){
				binding2Canceled = true;
			});
			assert(bindings._bindings.length === 2);
			reg.removeEach([sub1, sub2]);
			assert(bindings._bindings.length === 0);
			assert(binding1Canceled);
			assert(binding2Canceled);
		},
		"remove all components": function(){
			var binding1Canceled = false;
			bindings.add(sub1, function(){
				binding1Canceled = true;
			});
			var binding2Canceled = false;
			bindings.add(sub2, function(){
				binding2Canceled = true;
			});
			assert(bindings._bindings.length === 2);
			reg.removeAll();
			assert(bindings._bindings.length === 0);
			assert(binding1Canceled);
			assert(binding2Canceled);
		},
		"destroy": function(){
			var binding1Canceled = false;
			bindings.add(sub1, function(){
				binding1Canceled = true;
			});
			assert(bindings._bindings.length === 1);
			bindings.destroy(); // stop observing components registry
			reg.removeAll();
			assert(bindings._bindings.length === 1);
			assert(!binding1Canceled);
		}


	});


});