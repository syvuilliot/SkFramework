define([
	'teststack!object',
	'teststack/chai!assert',
	'dojo/_base/declare',
	'../Component',
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
			assert(main._componentsRegistry.length === 1);
		},
		"add one component with a name and get it": function(){
			main._addComponent(sub1, "sub1");
			assert.equal(main._getComponent('sub1'), sub1);
			assert(main._componentsRegistry.has(sub1));
			assert.equal(main._sub1, sub1);
			assert(main._componentsRegistry.length === 1);
		},
		"add many components without name": function(){
			var comps = main._addComponents([sub1, sub2, sub3]);
			assert(main._componentsRegistry.has(sub1));
			assert(main._componentsRegistry.has(sub2));
			assert(main._componentsRegistry.has(comps[2]));
			assert(main._componentsRegistry.length === 3);
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
			assert(main._componentsRegistry.length === 3);
		},
		"unknown components don't get returned": function(){
			main._addComponent(sub1);
			assert(!main._getComponent('sub1'));
			assert(!main._getComponent(sub2));
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
			assert(main._bindingsRegistry.length === 1);
			assert(main._bindingsRegistry.get(sub1).length === 1);
			main._unbindComponent(sub1);
			assert(binding1Canceled);
			assert(main._bindingsRegistry.length === 0);
		},
		"register and cancel an array of bindings without name": function(){
			main._addComponent(sub1);
			var binding2Canceled = false;
			var binding3Canceled = false;
			main._registerBindings(sub1, [
				function(){ binding2Canceled = true;},
				function(){ binding3Canceled = true;},
			]);
			assert(main._bindingsRegistry.length === 1);
			assert(main._bindingsRegistry.get(sub1).length === 1);
			main._unbindComponent(sub1);
			assert(binding2Canceled);
			assert(binding3Canceled);
			assert(main._bindingsRegistry.length === 0);
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
				{remove: function(){ binding2Canceled = true;}},
				{cancel: function(){ binding3Canceled = true;}},
			]);
			assert(main._bindingsRegistry.length === 1);
			assert(main._bindingsRegistry.get(sub1).length === 1);
			main._unbindComponent(sub1);
			assert(binding1Canceled);
			assert(binding2Canceled);
			assert(binding3Canceled);
			assert(main._bindingsRegistry.length === 0);
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
			assert(main._bindingsRegistry.length === 0);
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
			assert(main._bindingsRegistry.get(sub1).length === 2); // "binding1" and "binding2&3"
			main._unbindComponent(sub1);
			assert(binding1Canceled);
			assert(binding2Canceled);
			assert(binding3Canceled);
			assert(main._bindingsRegistry.length === 0);
		},
		"remove one component without name": function(){
			main._addComponent(sub1);
			main._addComponents([sub2, sub3]);
			main._registerBindings(sub1, function(){});
			main._registerBindings(sub2, function(){});
			assert(main._componentsRegistry.length === 3);
			assert(main._bindingsRegistry.length === 2);
			main._deleteComponent(sub1);
			assert(!main._componentsRegistry.has(sub1));
			assert(main._componentsRegistry.length === 2);
			assert(main._bindingsRegistry.length === 1);
		},
		"remove one component by name": function(){
			main._addComponent(sub1, "sub1");
			main._addComponents([sub2, sub3]);
			main._registerBindings("sub1", function(){});
			main._registerBindings(sub2, function(){});
			assert(main._componentsRegistry.length === 3);
			assert(main._bindingsRegistry.length === 2);
			assert.equal(main._sub1, sub1);
			main._deleteComponent("sub1");
			assert(!main._componentsRegistry.has("sub1"));
			assert(main._componentsRegistry.length === 2);
			assert(main._bindingsRegistry.length === 1);
			assert.equal(main._sub1, undefined);
		},
		"remove many components without name": function(){
			main._addComponent(sub1);
			main._addComponents([sub2, sub3]);
			main._registerBindings(sub1, function(){});
			main._registerBindings(sub2, function(){});
			assert(main._componentsRegistry.length === 3);
			assert(main._bindingsRegistry.length === 2);
			main._deleteComponents([sub1, sub2]);
			assert(!main._componentsRegistry.has(sub1));
			assert(!main._componentsRegistry.has(sub2));
			assert(main._componentsRegistry.length === 1);
			assert(main._bindingsRegistry.length === 0);
		},
		"remove many components by name": function(){
			main._addComponent(sub1, "sub1");
			main._addComponents({
				"sub2" : sub2,
				"sub3" : sub3
			});
			main._registerBindings("sub1", function(){});
			main._registerBindings(sub2, function(){});
			assert(main._componentsRegistry.length === 3);
			assert(main._bindingsRegistry.length === 2);
			main._deleteComponents(["sub1", "sub2"]);
			assert(!main._componentsRegistry.has("sub1"));
			assert(!main._componentsRegistry.has("sub2"));
			assert(main._componentsRegistry.length === 1);
			assert(main._bindingsRegistry.length === 0);
		},
		"destroy main component": function(){
			main._addComponent(sub1);
			main._addComponents([sub2, sub3]);
			main._registerBindings(sub1, function(){});
			main._registerBindings(sub2, function(){});
			assert(main._componentsRegistry.length === 3);
			assert(main._bindingsRegistry.length === 2);
			main.destroy();
			assert(main._componentsRegistry.length === 0);
			assert(main._bindingsRegistry.length === 0);
		},
		"don't add an anonymous component twice": function(){
			main._addComponent(sub1);
			assert.throw(function(){main._addComponent(sub1);}, "This component is already registered");
			assert(main._componentsRegistry.length === 1);
		},
		"don't add a named component twice": function(){
			main._addComponent(sub1, "sub1");
			assert.throw(function(){main._addComponent(sub1, "sub2");}, "This component is already registered");
			assert(main._componentsRegistry.length === 1);
		},


	});

	var sub2BindingCanceled = false;
	var MyComponent = declare(Component, {
		constructor: function(){
			this._addComponentFactories({
				sub1: function(){
					return new Component();
				},
				sub2: function(){
					return new Component();
				}
			});
		},
		_bindings: {
			sub2: function(){
				return function(){
					sub2BindingCanceled = true;
				};
			},

		}
	});

	registerSuite({
		name : "Declarative components creation with bindings",
		beforeEach : function() {
			main = new MyComponent();
			sub2BindingCanceled = false;
		},
		"add one component without binding": function(){
			main._addComponent("sub1");
			assert(main._componentsRegistry.length === 1);
			assert(main._bindingsRegistry.length === 0);
			assert(main._getComponent("sub1"));
		},
		"remove one component without binding": function(){
			main._addComponent("sub1");
			main._deleteComponent("sub1");
			assert(main._componentsRegistry.length === 0);
			assert(main._bindingsRegistry.length === 0);
			assert(!main._getComponent("sub1"));
		},
		"add one component with binding": function(){
			main._addComponent("sub2");
			assert(main._componentsRegistry.length === 1);
			assert(main._bindingsRegistry.length === 1);
			assert(main._getComponent("sub2"));
			assert(!sub2BindingCanceled);
		},
		"remove one component with binding": function(){
			main._addComponent("sub2");
			main._deleteComponent("sub2");
			assert(main._componentsRegistry.length === 0);
			assert(main._bindingsRegistry.length === 0);
			assert(!main._getComponent("sub2"));
			assert(sub2BindingCanceled);
		},
	});

});