define([
	'doh/runner',
	'../Component'
],
function(
	doh,
	Component
){
    doh.register("Testing components", [
	    {
		    name: "Routing of properties to internal presenter",
	        setUp: function() {
	        	this.component = new Component();
	        	this.component.ownProp = "ownValue";
	        },
	        runTest: function() {
	        	this.component.set('prop1', "value1");
	        	doh.is(this.component.get('prop1'), "value1");
	        	doh.is(this.component._presenter.get('prop1'), "value1");
	        	doh.is(this.component.get('ownProp'), "ownValue");
	        	doh.is(this.component._presenter.get('ownProp'), undefined);
	        }
	    },
	    {
		    name: "Sub-components",
	        setUp: function() {
	        	this.main = new Component();
	        	this.sub1 = new Component();
	        	this.main._addComponents({
	        		sub1: this.sub1,
	        		sub2: this.sub2,
	        		sub3: this.sub3
	        	});
	        	this.main._bindComponents({
	        		sub1: {	// Fake binding
	        			remove: function() {
	        				this.sub1BindingRemoved = true;
	        			}.bind(this)
	        		}, 
	        		sub2: [{	// Fake binding
	        			remove: function() {
	        				this.sub2BindingRemoved = true;
	        			}.bind(this)
	        		}], 
	        		sub3: {	// Fake binding
	        			remove: function() {
	        				this.sub3BindingRemoved = true;
	        			}.bind(this)
	        		}
	        	});
	        },
	        runTest: function() {
	        	doh.is(this.main._getComponent('sub1'), this.sub1, "sub1 registered");
	        	doh.f(this.main._getComponent('unknown'), "unknown component don't get returned");
	        	doh.is(this.main._getComponentId(this.sub1), 'sub1', "find out component's id");
	        	doh.f(this.main._getComponentId('unknown'), "unknown id don't get returned");
	        	doh.f(this.main._getComponentId(this.main), "asking for unknown component's id returns nothing");
	        	// Remove sub1
	        	this.main._deleteComponent(this.sub1);
	        	doh.f(this.main._getComponent('sub1'), "sub1 has correctly been removed");
	        	doh.f(this.main._bindings.sub1, "sub1's binding has correctly been removed");
	        	doh.t(this.sub1BindingRemoved, "sub1's binding has correctly been deactivated");
	        	// Remove sub2
	        	this.main._deleteComponent('sub2');
	        	doh.f(this.main._getComponent('sub2'), "sub2 has correctly been removed");
	        	doh.f(this.main._bindings.sub2, "sub2's binding has correctly been removed");
	        	doh.t(this.sub2BindingRemoved, "sub2's binding has correctly been deactivated");
	        	// Destroy main component
	        	this.main.destroy();
	        	doh.f(this.main._getComponent('sub3'), "sub3 has been removed");
	        	doh.f(this.main._bindings.sub3, "sub3's binding has been removed");
	        	doh.t(this.sub3BindingRemoved, "sub3's binding has correctly been deactivated");
	        },
	    }
    ]);
});