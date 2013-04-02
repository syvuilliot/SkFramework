define([
	'ksf/utils/constructor',
	'./UIComponent',
	'./placement/samples/KsDomInDom',
	'./placement/samples/DomInKsDom',
	'./placement/samples/DomInDom',
], function(
	ctr,
	UIComponent,
	KsDomInDom,
	DomInKsDom,
	DomInDom
) {

	return ctr(UIComponent, function DomComponent(){
		UIComponent.apply(this, arguments);
		[new DomInDom(), new KsDomInDom(), new DomInKsDom()].forEach(this._placement.addPlacer, this._placement);
		this._components.addComponentFactory("domNode", function(){
			return document.createElement(this._domTag || "div");
		}.bind(this));
	}, {
		get domNode() {
			return this._components.get("domNode") || this._components.create("domNode");
		},
	});

});
