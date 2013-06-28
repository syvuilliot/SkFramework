define([
	"ksf/utils/constructor",
	'./DomNode',
	"collections/map",
	"ksf/component/layout/Tree",
	'ksf/component/layout/samples/DomInDom',
	"ksf/utils/binding",
	'ksf/utils/IndexedSet',
	"ksf/component/_RegistryWithFactory",
], function(
	ctr,
	DomNode,
	Map,
	PlacementManager,
	DomInDom,
	binding,
	IndexedSet,
	_RegistryWithFactory
){

	return ctr(DomNode, function(args){
		DomNode.call(this, args && args.domNode || 'ul');
		this.value = args.value;
		// rows registry
		this._rows = new IndexedSet();
		// make it lazy
		_RegistryWithFactory.call(this._rows, {
			factory: args.factory
		});
		_RegistryWithFactory.applyPrototype.call(this._rows);

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