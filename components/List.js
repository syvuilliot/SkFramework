define([
	"ksf/utils/constructor",
	"collections/map",
	"ksf/component/placement/Manager",
	'ksf/component/placement/samples/DomInDom',
	"ksf/utils/binding",
], function(
	ctr,
	Map,
	PlacementManager,
	DomInDom,
	binding
){

	var LazyComponentsManager = ctr(function(factory){
		this._components = new Map();
		this._usersCount = new Map();
		this._factory = factory;
	}, {
		get: function(id){
			var cmp = this._components.get(id) || this._factory.create(id);
			this._usersCount.set(cmp, (this._usersCount.get(cmp) || 0)+1);
			return cmp;
		},
		release: function(id){
			var cmp = this._components.get(id);
			var count = (this._usersCount.get(cmp) || 0)-1;
			if (count <=0){
				this._usersCount.delete(cmp);
				this._factory.destroy(id);
			} else {
				this._usersCount.set(cmp, count);
			}
		},
	});

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