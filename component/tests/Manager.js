define([
	'teststack!object',
	'teststack/chai!assert',
	'../Manager',
], function(
	registerSuite,
	assert,
	ComponentsManager
) {
	var mng, sub1, sub2, sub3;
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
				assert(sub2 === mng.get("sub2"));
				assert(sub3 === mng.get("sub3"));
				return function(){
					sub2and3BindingCanceled = true;
				};
			});
			sub2Binding1Canceled = false;
			sub2Binding2Canceled = false;
			sub2and3BindingCanceled = false;
		},
		"add one component without binding": function(){
			mng.create("sub1");
			assert(mng._componentsRegistry.length === 1);
			assert(mng._componentsRegistry._bindings.length === 0);
			assert(mng.get("sub1"));
		},
		"remove one component without binding": function(){
			mng.create("sub1");
			mng.delete("sub1");
			assert(mng._componentsRegistry.length === 0);
			assert(mng._componentsRegistry._bindings.length === 0);
			assert(!mng.get("sub1"));
		},
		"add one component with binding": function(){
			mng.create("sub2");
			assert(mng._componentsRegistry.length === 1);
			assert(mng._componentsRegistry._bindings.length === 1);
			assert(mng.get("sub2"));
			assert(!sub2Binding1Canceled);
			assert(!sub2Binding2Canceled);
		},
		"remove one component with binding": function(){
			mng.create("sub2");
			mng.delete("sub2");
			assert(mng._componentsRegistry.length === 0);
			assert(mng._componentsRegistry._bindings.length === 0);
			assert(!mng.get("sub2"));
			assert(sub2Binding1Canceled);
			assert(sub2Binding2Canceled);
		},
		"add many components with binding": function(){
			mng.createEach(["sub3", "sub2"]);
			assert(mng._componentsRegistry.length === 2);
			assert(mng._componentsRegistry._bindings.length === 2); //binding for sub2 alone and binding between sub2 and sub3
			assert(!mng.get("sub1"));
			assert(mng.get("sub2"));
			assert(mng.get("sub3"));
			assert(!sub2Binding1Canceled);
			assert(!sub2Binding2Canceled);
		},
		"remove many components with bindings": function(){
			mng.createEach(["sub3", "sub2"]);
			mng.delete("sub3");
			assert(mng._componentsRegistry.length === 1);
			assert(mng._componentsRegistry._bindings.length === 1); //binding for sub2 alone
			assert(!mng.get("sub1"));
			assert(mng.get("sub2"));
			assert(!mng.get("sub3"));
			assert(!sub2Binding1Canceled);
			assert(!sub2Binding2Canceled);
			assert(sub2and3BindingCanceled);
		},
	});

});