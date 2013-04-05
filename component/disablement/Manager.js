define([
	"ksf/utils/constructor",
	"dojo/aspect",
	"collections/set",
], function(
	ctr,
	aspect,
	Set
){
	return ctr(function DisablementManager(args){
		this._registry = args.registry;
		this._actionners = args.actionners;
		this._disabled = new Set();
		this._observers = {};
		// bind to registry : when a component is deleted remove it from our list
		this._observers.registryDelete = aspect.before(this._registry, "delete", function(cmp){
			this._disabled.remove(cmp);
		}.bind(this));


	}, {
		// add the component to the list of components we have to maintain in a diabled state
		add: function(cmp){
			cmp = this._registry.get(cmp); // map id to component if necessary
			if (this.has(cmp)){
				return false;
			}
			var success = this.process(cmp, true);
			if (success) {this._disabled.add(cmp);}
			return success;
		},
		remove: function(cmp){
			cmp = this._registry.get(cmp); // map id to component if necessary
			if (!this.has(cmp)){
				return false;
			}
			var success = this.process(cmp, false);
			if (success) {this._disabled.remove(cmp);}
			return success;
		},
		has: function(cmp){
			cmp = this._registry.get(cmp); // map id to component if necessary
			return this._disabled.has(cmp);
		},
		get: function(){
			return this._disabled.toArray();
		},
		// we will try to disable all of cmps that are not already disabled
		// and to enable those which were disabled but are not in the new list
		set: function(cmps){
			cmps = cmps.map(this._registry.get, this._registry); // map id to component if necessary
			cmps.forEach(this.add, this);
			this._disabled.forEach(function(cmp){
				if (cmps.indexOf(cmp) === -1){
					this.remove(cmp);
				}
			}, this);
		},
		// choose the right disabler and apply it on cmp
		// this implementation try each actionner until one respond with true, which means it sucessfully done the action
		process: function(cmp, disable){
			return this._actionners.every(function(actionner){
				return actionner(cmp, disable);
			});
		},
		destroy: function(){
			// this._observers.registryCreate.cancel();
			this._observers.registryDelete.cancel();
		}
	});
});