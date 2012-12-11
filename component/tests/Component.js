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
	        	this.main._sub2 = "occupied";
	        	
	        	this.sub1 = new Component();
	        	this.unknown = new Component();

	        	this.main._addComponents({
	        		sub1: this.sub1,
	        		sub2: new Component(),
	        		sub3: new Component()
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
	        	this.main._placeComponents(['sub1', 'sub2', 'sub3']);
	        },
	        runTest: function() {
	        	doh.is(this.main._getComponent('sub1'), this.sub1, "sub1 registered");
	        	doh.is(this.main._sub1, this.sub1, "sub1 accessible with private attribute");
	        	doh.is(this.main._sub2, 'occupied', "'_sub2' private attribute previously set, not overwritten");
	        	doh.f(this.main._getComponent('unknown'), "unknown component don't get returned");
	        	doh.is(this.main._getComponentId(this.sub1), 'sub1', "find out component's id");
	        	doh.f(this.main._getComponentId('unknown'), "unknown id don't get returned");
	        	doh.f(this.main._getComponentId(this.unknown), "asking for id of an unknown component returns nothing");
	        	doh.is(this.main._placement, [this.sub1, this.main._getComponent('sub2'), this.main._sub3], "Subcomponents placed");
	        	// Remove sub1
	        	this.main._deleteComponent(this.sub1);
	        	doh.f(this.main._getComponent('sub1'), "sub1 has correctly been removed");
	        	doh.is(this.main._sub1, undefined, "sub1's private attribute has been removed");
	        	doh.f(this.main._bindings.sub1, "sub1's binding has correctly been removed");
	        	doh.t(this.sub1BindingRemoved, "sub1's binding has correctly been deactivated");
	        	doh.is(this.main._placement, [this.main._getComponent('sub2'), this.main._sub3], "sub1 unplaced");
	        	// Remove sub2
	        	this.main._deleteComponent('sub2');
	        	doh.f(this.main._getComponent('sub2'), "sub2 has correctly been removed");
	        	doh.is(this.main._sub2, 'occupied', "'_sub2' private attribute still there");
	        	doh.f(this.main._bindings.sub2, "sub2's binding has correctly been removed");
	        	doh.t(this.sub2BindingRemoved, "sub2's binding has correctly been deactivated");
	        	doh.is(this.main._placement, [this.main._sub3], "sub2 unplaced");
	        	// Destroy main component
	        	this.main.destroy();
	        	doh.f(this.main._getComponent('sub3'), "sub3 has been removed");
	        	doh.f(this.main._bindings.sub3, "sub3's binding has been removed");
	        	doh.t(this.sub3BindingRemoved, "sub3's binding has correctly been deactivated");
	        	doh.is(this.main._placement, [], "All subcomponents unplaced");
	        },
	    }
    ]);
});