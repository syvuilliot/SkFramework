define([
	'teststack!object',
	'teststack/chai!assert',
	'dojo/_base/declare',
	'../Component'
], function(
	registerSuite,
	assert,
	declare,
	Component
) {
	var main, sub1, sub2, sub3;

	registerSuite({
		name : "Sub-components management",
		beforeEach : function() {
			main = new Component();
			sub1 = new Component();
			sub2 = new Component();
			sub3 = function() { return new Component(); };
		},
		"add one component without name": function(){
			main._addComponent(sub1);
			assert(main._componentsRegistry.has(sub1));
		},
		"add one component with a name and get it": function(){
			main._addComponent(sub1, "sub1");
			assert.equal(main._getComponent('sub1'), sub1);
			assert(main._componentsRegistry.has(sub1));
			assert.equal(main._sub1, sub1);
		},
		"add many components without name": function(){
			var comps = main._addComponents([sub1, sub2, sub3]);
			assert(main._componentsRegistry.has(sub1));
			assert(main._componentsRegistry.has(sub2));
			assert(main._componentsRegistry.has(comps[2]));
		},
		"add many components with names": function(){
			var comps = main._addComponents({
				"sub1": sub1,
				"sub2": sub2,
				"sub3": sub3
			});
			assert.equal(main._getComponent('sub1'), sub1);
			assert.equal(main._getComponent('sub2'), sub2);
			assert.equal(main._getComponent('sub3'), comps.sub3);
		},
		"unknown component don't get returned": function(){
			assert(!main._getComponent('unknown'));
		},
		"get component id": function(){
			main._addComponent(sub1, "sub1");
			assert.equal(main._getComponentId(sub1), 'sub1');
			main._addComponent(sub2);
			assert(main._getComponentId(sub2) === undefined);
			assert(main._getComponentId(new Component()) === undefined);
		},
		"register and cancel one bindings without name": function(){
			main._addComponent(sub1);
			var binding1Canceled = false;
			main._registerBindings(sub1, function(){
				binding1Canceled = true;
			});
			main._unbindComponent(sub1);
			assert(binding1Canceled);
		},
		"register and cancel an array of bindings without name": function(){
			main._addComponent(sub1);
			var binding2Canceled = false;
			var binding3Canceled = false;
			main._registerBindings(sub1, [
				function(){ binding2Canceled = true;},
				function(){ binding3Canceled = true;},
			]);
			main._unbindComponent(sub1);
			assert(binding2Canceled);
			assert(binding3Canceled);
		},
		"register and cancel many bindings without name": function(){
			main._addComponent(sub1);
			var binding1Canceled = false;
			main._registerBindings(sub1, function(){
				binding1Canceled = true;
			});
			assert(main._bindingsRegistry.get(sub1).length === 1);
			var binding2Canceled = false;
			var binding3Canceled = false;
			main._registerBindings(sub1, [
				function(){ binding2Canceled = true;},
				function(){ binding3Canceled = true;},
			]);
			assert(main._bindingsRegistry.get(sub1).length === 1);
			main._unbindComponent(sub1);
			assert(binding1Canceled);
			assert(binding2Canceled);
			assert(binding3Canceled);
			assert(main._bindingsRegistry.get(sub1).length === 0);
		},
		"register and cancel bindings with names": function(){
			main._addComponent(sub1);
			var binding1Canceled = false;
			main._registerBindings(sub1, function(){
				binding1Canceled = true;
			}, "binding1");
			var binding2Canceled = false;
			var binding3Canceled = false;
			main._registerBindings(sub1, [
				function(){ binding2Canceled = true;},
				function(){ binding3Canceled = true;},
			], "binding2and3");
			assert(main._bindingsRegistry.get(sub1).length === 2);
			main._unbindComponent(sub1, "binding1");
			assert(binding1Canceled);
			assert(!binding2Canceled);
			assert(!binding3Canceled);
			assert(main._bindingsRegistry.get(sub1).length === 1);
			main._unbindComponent(sub1, "binding2and3");
			assert(binding2Canceled);
			assert(binding3Canceled);
			assert(main._bindingsRegistry.get(sub1).length === 0);
		},
		"register and cancel all bindings with names": function(){
			main._addComponent(sub1);
			var binding1Canceled = false;
			main._registerBindings(sub1, function(){
				binding1Canceled = true;
			}, "binding1");
			var binding2Canceled = false;
			var binding3Canceled = false;
			main._registerBindings(sub1, [
				function(){ binding2Canceled = true;},
				function(){ binding3Canceled = true;},
			], "binding2and3");
			assert(main._bindingsRegistry.get(sub1).length === 2);
			main._unbindComponent(sub1);
			assert(binding1Canceled);
			assert(binding2Canceled);
			assert(binding3Canceled);
			assert(main._bindingsRegistry.get(sub1).length === 0);
		},
	});

/*
			// Remove sub1
			this.main._deleteComponent(this.sub1);

			doh.f(this.main._getComponent('sub1'), "sub1 has correctly been removed");
			doh.is(this.main._sub1, undefined, "sub1's private attribute has been removed");
			doh.f(this.main._bindings.sub1, "sub1's binding has correctly been removed");
			doh.t(this.sub1BindingRemoved, "sub1's binding has correctly been deactivated");
			// Remove sub2
			this.main._deleteComponent('sub2');

			doh.f(this.main._registeredComponents.sub2, "sub2 has correctly been removed");
			doh.is(this.main._sub2, 'occupied', "'_sub2' private attribute still there");
			doh.f(this.main._bindings.sub2, "sub2's binding has correctly been removed");
			doh.t(this.sub2BindingRemoved, "sub2's binding has correctly been deactivated");

			// Destroy main component
			this.main.destroy();

			doh.f(this.main._getComponent('sub3'), "sub3 has been removed");
			doh.f(this.main._bindings.sub3, "sub3's binding has been removed");
			doh.t(this.sub3BindingRemoved, "sub3's binding has correctly been deactivated");
		}
	}]);
*/
});