define([
	'dojo/_base/declare',
	'dojo/dom-construct'
], function(
	declare,
	domConstruct
) {
	/*
	* mixin to create a dom rendable component
	*/
	return declare([], {
		domNode: null,
		tag: "div",
		domNodeAttrs: null,

		postscript: function(params) {
			this.inherited(arguments);
			this.render();
			this.bind();
		},
		
		render: function(){
			this.domNode = domConstruct.create(this.tag, this.domNodeAttrs);

		},

		bind: function() {
			// Binding between Presenter and sub components
		},

		//helper to place subcomponents views in this view
		_append: function(component, option) {
			if (component instanceof HTMLElement) {
				domConstruct.place(component, this.domNode, option);
				return;
			}

			//skComponent or dijit component
			if (component.placeAt) {
				component.placeAt(this.domNode);
				if (component.startup){
					component.startup();
				}
				return;
			}
		},

		placeAt: function(refNode, option) {
			domConstruct.place(this.domNode, refNode, option);
		},

		destroy: function(){
			this._components.forEach(function(component){
				component.destroy();
			});
			this.inherited(arguments);
		},

	});
});
