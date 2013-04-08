define([
	"ksf/utils/constructor",
	"dojo/dom-class",
], function(
	ctr,
	domClass
){
	return ctr(function PlacerWithIdClass(args){
		this._placer = args.placer;
		this._regitry = args.registry;
		// TODO: injecter le styler
	}, {
		// when a domNode is placed, add its id as a css class
		put: function(cmp, parent, options){
			var res = this._placer.put(cmp, parent, options);
			if (res) {
				domClass.add(cmp, this._regitry.getId(cmp));
			}
			return res;
		},
		set: function(cmp, parent, options){
			return this._placer.set(cmp, parent, options);
		},
		//remove the css class added at placement to clean up the domNode
		remove: function(cmp, parent, options){
			var res = this._placer.remove(cmp, parent, options);
			if (res){
				domClass.remove(cmp, this._regitry.getId(cmp));
			}
			return res;
		}
	});
});