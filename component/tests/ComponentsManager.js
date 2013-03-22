define([
	'teststack!object',
	'teststack/chai!assert',
	'../ComponentsManager',
], function(
	registerSuite,
	assert,
	ComponentsManager
) {
	var mng, sub1, sub2, sub3;

	registerSuite({
		name : "Sub-components management",
		beforeEach : function() {
			mng = new ComponentsManager();
			sub1 = {};
			sub2 = {};
			sub3 = {};
		},
		"add one component without name": function(){
			mng.addComponent(sub1);
			assert(mng._componentsRegistry.hasComponent(sub1));
			assert(mng._componentsRegistry.length === 1);
		},
		"add one component with a name and get it": function(){
			mng.addComponent(sub1, "sub1");
			assert.equal(mng._componentsRegistry.getComponent('sub1'), sub1);
			assert(mng._componentsRegistry.hasComponent(sub1));
			// assert.equal(mng._sub1, sub1);
			assert(mng._componentsRegistry.length === 1);
		},
		"add many components without name": function(){
			[sub1, sub2, sub3].forEach(function(cmp){
				mng.addComponent(cmp);
				assert(mng._componentsRegistry.hasComponent(cmp));
			});
			assert(mng._componentsRegistry.length === 3);
		},
		"add many components with names": function(){
			var cmps = {
				"sub1": sub1,
				"sub2": sub2,
				"sub3": sub3
			};
			Object.keys(cmps).forEach(function (k) {
				mng.addComponent(cmps[k], k);
				assert.equal(mng._componentsRegistry.getComponent(k), cmps[k]);
			});
			assert(mng._componentsRegistry.length === 3);
		},
		"unknown components don't get returned": function(){
			mng.addComponent(sub1);
			assert(!mng._componentsRegistry.getComponent('sub1'));
			assert(!mng._componentsRegistry.getComponent(sub2));
		},
/*		"get component id": function(){
			mng.addComponent(sub1, "sub1");
			assert.equal(mng._getComponentId(sub1), 'sub1');
			mng.addComponent(sub2);
			assert(mng._getComponentId(sub2) === undefined);
			assert(mng._getComponentId({}) === undefined);
		},
*/		"register and cancel one binding without name": function(){
			mng.addComponent(sub1);
			mng.addComponent(sub2);
			var binding1Canceled = false;
			mng.addBindings([sub1, sub2], function(){
				binding1Canceled = true;
			});
			assert(mng._componentsRegistry._bindings.length === 1); // one entry
			mng.unbindComponent(sub1);
			assert(binding1Canceled);
			assert(mng._componentsRegistry._bindings.length === 0);
		},
		"register and cancel an array of bindings without name": function(){
			mng.addComponent(sub1);
			mng.addComponent(sub2);
			var binding2Canceled = false;
			var binding3Canceled = false;
			mng.addBindings([sub1, sub2], [
				function(){ binding2Canceled = true;},
				function(){ binding3Canceled = true;},
			]);
			assert(mng._componentsRegistry._bindings.length === 1);
			mng.unbindComponent(sub2);
			assert(binding2Canceled);
			assert(binding3Canceled);
			assert(mng._componentsRegistry._bindings.length === 0);
		},
		"register and cancel many bindings without name": function(){
			mng.addComponent(sub1);
			mng.addComponent(sub2);
			var binding1Canceled = false;
			mng.addBindings(sub1, function(){
				binding1Canceled = true;
			});
			assert(mng._componentsRegistry._bindings.length === 1);
			var binding2Canceled = false;
			var binding3Canceled = false;
			mng.addBindings(sub1, [
				{remove: function(){ binding2Canceled = true;}},
				{cancel: function(){ binding3Canceled = true;}},
			]);
			assert(mng._componentsRegistry._bindings.length === 2);
			mng.unbindComponent(sub1);
			assert(binding1Canceled);
			assert(binding2Canceled);
			assert(binding3Canceled);
			assert(mng._componentsRegistry._bindings.length === 0);
		},
		"register and cancel bindings with names": function(){
			mng.addComponent(sub1);
			mng.addComponent(sub2);
			var binding1Canceled = false;
			mng.addBindings([sub1, sub2], function(){
				binding1Canceled = true;
			}, "binding1");
			var binding2Canceled = false;
			var binding3Canceled = false;
			mng.addBindings([sub1, sub2], [
				function(){ binding2Canceled = true;},
				function(){ binding3Canceled = true;},
			], "binding2and3");
			assert(mng._componentsRegistry._bindings.length === 2);
			mng.unbindComponent(sub1, "binding1");
			assert(binding1Canceled);
			assert(!binding2Canceled);
			assert(!binding3Canceled);
			assert(mng._componentsRegistry._bindings.length === 1);
			mng.unbindComponent(sub2, "binding2and3");
			assert(binding2Canceled);
			assert(binding3Canceled);
			assert(mng._componentsRegistry._bindings.length === 0);
		},
		"register and cancel all bindings with names": function(){
			mng.addComponent(sub1);
			mng.addComponent(sub2);
			var binding1Canceled = false;
			mng.addBindings([sub1, sub2], function(){
				binding1Canceled = true;
			}, "binding1");
			var binding2Canceled = false;
			var binding3Canceled = false;
			mng.addBindings(sub1, [
				function(){ binding2Canceled = true;},
				function(){ binding3Canceled = true;},
			], "binding2and3");
			assert(mng._componentsRegistry._bindings.length === 2);
			mng.unbindComponent(sub1);
			assert(binding1Canceled);
			assert(binding2Canceled);
			assert(binding3Canceled);
			assert(mng._componentsRegistry._bindings.length === 0);
		},
		"remove one component without name": function(){
			mng.addComponent(sub1);
			mng.addComponent(sub2);
			mng.addComponent(sub3);
			mng.addBindings(sub1, function(){});
			mng.addBindings(sub2, function(){});
			assert(mng._componentsRegistry.length === 3);
			assert(mng._componentsRegistry._bindings.length === 2);
			mng.removeComponent(sub1);
			assert(!mng._componentsRegistry.hasComponent(sub1));
			assert(mng._componentsRegistry.length === 2);
			assert(mng._componentsRegistry._bindings.length === 1);
		},
		"remove one component by name": function(){
			mng.addComponent(sub1, "sub1");
			mng.addComponents([sub2, sub3]);
			mng._registerBindings("sub1", function(){});
			mng._registerBindings(sub2, function(){});
			assert(mng._componentsRegistry.length === 3);
			assert(mng._bindingsRegistry.length === 2);
			assert.equal(mng._sub1, sub1);
			mng._deleteComponent("sub1");
			assert(!mng._componentsRegistry.has("sub1"));
			assert(mng._componentsRegistry.length === 2);
			assert(mng._bindingsRegistry.length === 1);
			assert.equal(mng._sub1, undefined);
		},
		"remove many components without name": function(){
			mng.addComponent(sub1);
			mng.addComponents([sub2, sub3]);
			mng._registerBindings(sub1, function(){});
			mng._registerBindings(sub2, function(){});
			assert(mng._componentsRegistry.length === 3);
			assert(mng._bindingsRegistry.length === 2);
			mng._deleteComponents([sub1, sub2]);
			assert(!mng._componentsRegistry.has(sub1));
			assert(!mng._componentsRegistry.has(sub2));
			assert(mng._componentsRegistry.length === 1);
			assert(mng._bindingsRegistry.length === 0);
		},
		"remove many components by name": function(){
			mng.addComponent(sub1, "sub1");
			mng.addComponents({
				"sub2" : sub2,
				"sub3" : sub3
			});
			mng._registerBindings("sub1", function(){});
			mng._registerBindings(sub2, function(){});
			assert(mng._componentsRegistry.length === 3);
			assert(mng._bindingsRegistry.length === 2);
			mng._deleteComponents(["sub1", "sub2"]);
			assert(!mng._componentsRegistry.has("sub1"));
			assert(!mng._componentsRegistry.has("sub2"));
			assert(mng._componentsRegistry.length === 1);
			assert(mng._bindingsRegistry.length === 0);
		},
		"destroy mng component": function(){
			mng.addComponent(sub1);
			mng.addComponents([sub2, sub3]);
			mng._registerBindings(sub1, function(){});
			mng._registerBindings(sub2, function(){});
			assert(mng._componentsRegistry.length === 3);
			assert(mng._bindingsRegistry.length === 2);
			mng.destroy();
			assert(mng._componentsRegistry.length === 0);
			assert(mng._bindingsRegistry.length === 0);
		},
		"don't add an anonymous component twice": function(){
			mng.addComponent(sub1);
			assert.throw(function(){mng.addComponent(sub1);}, "This component is already registered");
			assert(mng._componentsRegistry.length === 1);
		},
		"don't add a named component twice": function(){
			mng.addComponent(sub1, "sub1");
			assert.throw(function(){mng.addComponent(sub1, "sub2");}, "This component is already registered");
			assert(mng._componentsRegistry.length === 1);
		},


	});

	var sub2Binding1Canceled = false;
	var sub2Binding2Canceled = false;
	var sub2and3BindingCanceled = false;

	registerSuite({
		name : "Declarative components creation with bindings",
		beforeEach : function() {
			mng = new ComponentsManager();
			mng.addComponentFactory("sub1", function(){return {};});
			mng.addComponentFactory("sub2", function(){return {};});
			mng.addComponentFactory("sub3", function(){return {};});
			mng.addBindingsFactory("sub2", function(){
				return [
					function(){
						sub2Binding1Canceled = true;
					},
					function(){
						sub2Binding2Canceled = true;
					},
				];
			});
			mng.addBindingsFactory(["sub2", "sub3"], function(sub2, sub3){
				assert(sub2 === mng._getComponent("sub2"));
				assert(sub3 === mng._getComponent("sub3"));
				return function(){
					sub2and3BindingCanceled = true;
				};
			});
			sub2Binding1Canceled = false;
			sub2Binding2Canceled = false;
			sub2and3BindingCanceled = false;
		},
		"add one component without binding": function(){
			mng._addComponent("sub1");
			assert(mng._componentsRegistry.length === 1);
			assert(mng._bindingsRegistry.length === 0);
			assert(mng._getComponent("sub1"));
		},
		"remove one component without binding": function(){
			mng._addComponent("sub1");
			mng._deleteComponent("sub1");
			assert(mng._componentsRegistry.length === 0);
			assert(mng._bindingsRegistry.length === 0);
			assert(!mng._getComponent("sub1"));
		},
		"add one component with binding": function(){
			mng._addComponent("sub2");
			assert(mng._componentsRegistry.length === 1);
			assert(mng._bindingsRegistry.length === 1);
			assert(mng._getComponent("sub2"));
			assert(!sub2Binding1Canceled);
			assert(!sub2Binding2Canceled);
		},
		"remove one component with binding": function(){
			mng._addComponent("sub2");
			mng._deleteComponent("sub2");
			assert(mng._componentsRegistry.length === 0);
			assert(mng._bindingsRegistry.length === 0);
			assert(!mng._getComponent("sub2"));
			assert(sub2Binding1Canceled);
			assert(sub2Binding2Canceled);
		},
		"add many components with binding": function(){
			mng._addComponents(["sub3", "sub2"]);
			assert(mng._componentsRegistry.length === 2);
			assert(mng._bindingsRegistry.length === 2); //binding for sub2 alone and binding between sub2 and sub3
			assert(!mng._getComponent("sub1"));
			assert(mng._getComponent("sub2"));
			assert(mng._getComponent("sub3"));
			assert(!sub2Binding1Canceled);
			assert(!sub2Binding2Canceled);
		},
		"remove many components with bindings": function(){
			mng._addComponents(["sub3", "sub2"]);
			mng._deleteComponent("sub3");
			assert(mng._componentsRegistry.length === 1);
			assert(mng._bindingsRegistry.length === 1); //binding for sub2 alone
			assert(!mng._getComponent("sub1"));
			assert(mng._getComponent("sub2"));
			assert(!mng._getComponent("sub3"));
			assert(!sub2Binding1Canceled);
			assert(!sub2Binding2Canceled);
			assert(sub2and3BindingCanceled);
		},
	});

});