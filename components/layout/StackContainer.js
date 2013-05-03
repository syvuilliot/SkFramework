define([
	"ksf/utils/constructor",
	'collections/map',
	'ksf/component/layout/Tree',
	'ksf/component/layout/MultiPlacer',
	'ksf/component/layout/samples/KsDomIn',
	'ksf/component/layout/samples/InKsDom',
	'ksf/component/layout/samples/DomInDom',
	"collections/listen/property-changes",
], function(
	ctr,
	Map,
	PlacementManager,
	MultiPlacer,
	KsDomIn,
	InKsDom,
	DomInDom,
	PropertyChanges
){
	var afterChange = PropertyChanges.addOwnPropertyChangeListener;
	var beforeChange = PropertyChanges.addBeforeOwnPropertyChangeListener;

	return ctr(function(args){
		this.children = args.children || new Map(); //we can inject a children manager by id if we want
		this.domNode = args.domNode || document.createElement(args.domTag || "div");
		this._placement = new PlacementManager({
			placer: args.placer || new MultiPlacer([
				new DomInDom(),
				new KsDomIn(new DomInDom()),
				new InKsDom(new DomInDom()),
			]),
		});
		// on "activeChild" change, update view
		afterChange(this, "active", function(id){
			var child = this.children.get(id);
			this._placement.set([this.domNode, [child]]);
		}.bind(this));
		this.active = args.active;
		// on "children" mutations, update "activeChild" if it is removed
	}, {
		destroy: function(){
		}
	});
});