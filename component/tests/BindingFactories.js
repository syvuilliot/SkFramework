define([
	'teststack!object',
	'teststack/chai!assert',
	'ksf/utils/IndexedSet',
	'../BindingManager',
	'../BindingFactories',
], function(
	registerSuite,
	assert,
	IndexedSet,
	BindingManager,
	BindingFactories
) {
	var components, bindings, factories, sub1, sub2, sub3;
	var sub2Binding1Created = false;
	var sub2Binding1Canceled = false;
	var sub2Binding2Created = false;
	var sub2Binding2Canceled = false;
	var sub2and3BindingCreated = false;
	var sub2and3BindingCanceled = false;

	registerSuite({
		name : "Declarative components creation with bindings",
		beforeEach : function() {
			components = new IndexedSet({
				keyProperty: "name",
			});
			bindings = new BindingManager({
				components: components,
			});
			factories = new BindingFactories({
				components: components,
				bindings: bindings,
			});
			sub1 = {name: "sub1"};
			sub2 = {name: "sub2"};
			sub3 = {name: "sub3"};

			factories.add("sub2", function(s2){
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
			factories.add(["sub2", "sub3"], function(s2, s3){
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
		},
		"add one component without binding": function(){
			components.add(sub1);
			assert(!sub2Binding1Created);
			assert(!sub2Binding2Created);
			assert(!sub2and3BindingCreated);
		},
		"add one component with binding": function(){
			components.add(sub2);
			assert(sub2Binding1Created);
			assert(sub2Binding2Created);
			assert(!sub2and3BindingCreated);
		},
		"remove one component with binding": function(){
			components.add(sub2);
			components.remove(sub2);
			assert(sub2Binding1Canceled);
			assert(sub2Binding2Canceled);
			assert(!sub2and3BindingCanceled);
		},
		"add many components with binding": function(){
			components.add(sub2);
			components.add(sub3);
			assert(sub2Binding1Created);
			assert(sub2Binding2Created);
			assert(sub2and3BindingCreated);
		},
		"remove many components with bindings": function(){
			components.add(sub2);
			components.add(sub3);
			components.remove(sub3);
			assert(!sub2Binding1Canceled);
			assert(!sub2Binding2Canceled);
			assert(sub2and3BindingCanceled);
		},
	});

});