define([
	'intern!object',
	'intern/chai!assert',
	'ksf/utils/IndexedSet',
	"../LazyRegistry",
	"../MultiFactories",
	'../BindingManager',
	'../BindingFactories',
	'collections/Map',
], function(
	registerSuite,
	assert,
	IndexedSet,
	LazyRegistry,
	MultiFactories,
	BindingManager,
	BindingFactories,
	Map
) {
	var components, bindings, factories, componentsFactories, componentsRegistry, componentsFactory, bindingFactories;
	var sub2Binding1Created = false;
	var sub2Binding1Canceled = false;
	var sub2Binding2Created = false;
	var sub2Binding2Canceled = false;
	var sub2and3BindingCreated = false;
	var sub2and3BindingCanceled = false;
	var sub1FactoryCalledCount, sub2FactoryCalledCount, sub3FactoryCalledCount;
	var sub1FactoryDestroyedCount, sub2FactoryDestroyedCount, sub3FactoryDestroyedCount;
	var sub1 = {name: "sub1"};
	var sub2 = {name: "sub2"};
	var sub3 = {name: "sub3"};

	registerSuite({
		name : "Declarative components creation with bindings",
		beforeEach : function() {
			componentsRegistry = new IndexedSet();
			componentsFactories = new Map({
				"sub1": {
					create: function(){
						sub1FactoryCalledCount++;
						return sub1;
					},
					destroy: function(cmp){
						sub1FactoryDestroyedCount++;
					},
				},
				"sub2": {
					create: function(){
						sub2FactoryCalledCount++;
						return sub2;
					},
					destroy: function(cmp){
						sub2FactoryDestroyedCount++;
					},
				},
				"sub3": {
					create: function(){
						sub3FactoryCalledCount++;
						return sub3;
					},
					destroy: function(cmp){
						sub3FactoryDestroyedCount++;
					},
				},
			});
			componentsFactory = new MultiFactories({
				factories: componentsFactories
			});
			components = new LazyRegistry({
				registry: componentsRegistry,
				factory: componentsFactory,
			});
			bindings = new BindingManager({
				components: componentsRegistry,
			});
			bindingFactories = new BindingFactories({
				components: componentsRegistry,
				bindings: bindings,
			});

			bindingFactories.add("sub2", function(s2){
				assert(s2 === sub2);
				sub2Binding1Created = true;
				sub2Binding2Created = true;
				return [
					function(){
						sub2Binding1Canceled = true;
					},
					function(){
						sub2Binding2Canceled = true;
					},
				];
			});
			bindingFactories.add(["sub2", "sub3"], function(s2, s3){
				assert(s2 === sub2);
				assert(s3 === sub3);
				sub2and3BindingCreated = true;
				return function(){
					sub2and3BindingCanceled = true;
				};
			});
			sub2Binding1Created = false;
			sub2Binding2Created = false;
			sub2and3BindingCreated = false;
			sub2Binding1Canceled = false;
			sub2Binding2Canceled = false;
			sub2and3BindingCanceled = false;
			sub1FactoryCalledCount = sub2FactoryCalledCount = sub3FactoryCalledCount = 0;
			sub1FactoryDestroyedCount = sub2FactoryDestroyedCount= sub2FactoryDestroyedCount = 0;
		},
		"get one component without binding many times": function(){
			components.get("sub1");
			var cmp = components.get("sub1");
			assert.equal(components._usersCount.get(cmp), 2);
			assert.equal(sub1FactoryCalledCount, 1);
			assert.equal(sub2FactoryCalledCount, 0);
			assert.equal(sub3FactoryCalledCount, 0);
			assert.equal(cmp.name, "sub1");
			assert(componentsRegistry.has(cmp));
			assert(componentsRegistry.hasKey("sub1"));
			assert(!sub2Binding1Created);
			assert(!sub2Binding2Created);
			assert(!sub2and3BindingCreated);
			components.release("sub1");
			assert.equal(components._usersCount.get(cmp), 1);
		},
		"get one component with binding": function(){
			components.get("sub2");
			var cmp = components.get("sub2");
			assert.equal(components._usersCount.get(cmp), 2);
			assert.equal(sub1FactoryCalledCount, 0);
			assert.equal(sub2FactoryCalledCount, 1);
			assert.equal(sub3FactoryCalledCount, 0);
			assert.equal(cmp.name, "sub2");
			assert(componentsRegistry.has(cmp));
			assert(componentsRegistry.hasKey("sub2"));
			assert(sub2Binding1Created);
			assert(sub2Binding2Created);
			assert(!sub2and3BindingCreated);
			components.release("sub2");
			assert.equal(components._usersCount.get(cmp), 1);
		},
		"remove one component with binding": function(){
			var cmp = components.get("sub2");
			components.release("sub2");
			assert.equal(components._usersCount.get(cmp), undefined);
			assert.equal(sub2FactoryDestroyedCount, 1);
			assert.equal(sub1FactoryCalledCount, 0);
			assert.equal(sub2FactoryCalledCount, 1);
			assert.equal(sub3FactoryCalledCount, 0);
			assert(sub2Binding1Canceled);
			assert(sub2Binding2Canceled);
			assert(!sub2and3BindingCanceled);
		},
	});

});