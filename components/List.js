define([
	"ksf/utils/constructor",
	"collections/map",
	"ksf/component/placement/Manager",
	'ksf/component/placement/samples/DomInDom',
	"ksf/utils/binding",
	"ksf/component/LazyComponentsManager",
], function(
	ctr,
	Map,
	PlacementManager,
	DomInDom,
	binding,
	LazyComponentsManager
){

	return ctr(function(args){
		this.domNode = args.domNode || document.createElement(args.domTag || "ul");
		this.value = args.value;
		this._rows = new LazyComponentsManager(args.factory);
		this._placement = [];
		this._placementManager = new PlacementManager({
			placer: args.placer || new DomInDom(),
		});
		this._valueBinding = binding.ReactiveMapping(this, this, {
			sourceProp: "value",
			addMethod: "_add",
			removeMethod: "_remove",
		});

	}, {
		_add: function(item, index){
			this._placement.splice(index, 0, this._rows.get(item));
			this._placementManager.set([this.domNode, this._placement]);
		},
		_remove: function(item, index){
			this._placement.splice(index, 1);
			this._rows.release(item); // we don't need this row any more
			this._placementManager.set([this.domNode, this._placement]);
		},

		destroy: function(){
			this._valueBinding.remove();
			this._placementManager.set([]);
			this._rows.deleteAll();
		},
	});

});