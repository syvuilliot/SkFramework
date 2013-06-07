define([
	"collections/set",
], function(
	Set
){
	// The value for this property is a Set collection created at installation time
	// The property is read only : another value cannot be set after installation (but the content of the value can be changed)
	var WithValueIsSet = function(args){
		var set = this.set;
		var install = this.install;
		this.install = function(rsc, arg){
			install.call(this);
			set.call(this, rsc, new Set());
			if (arguments.length === 2){
				this.set(rsc, arg);
			}
		};
		// the value is read only, so the set method does not change the value of the property
		// it only changes the content of the value (as an helper method)
		this.set = function(rsc, items){
			var collection = this.get(rsc);
			items = new Set(items);
			var added = items.difference(collection);
			var removed = collection.difference(items);
			collection.deleteEach(removed);
			collection.addEach(added);
		};
		// do we have to expose add and remove methods on the propertyManager ?
/*		this.add = function(rsc, item){
			var value = this.get(rsc);
			return value.add(item);
		};
		this.remove = function(rsc, item){
			var value = this.get(rsc);
			return value.delete(item);
		};
*/	};
	return WithValueIsSet;
});