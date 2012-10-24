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
			this._render();
			this._bind();
		},
		
		_render: function(){
			this.domNode = domConstruct.create(this.tag, this.domNodeAttrs);

		},

		_bind: function() {
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

		placeAt: function(refComponent, position) {
			//use addChild method from parent if available (skComponent, dijit). In case of dijit parent, the children should also be a dijit
			if (refComponent.addChild){
				refComponent.addChild(this, position);
				return;
			}
			//if refComponent is a domNode
			if (refComponent instanceof HTMLElement || typeof refComponent === "string") {
				domConstruct.place(this.domNode, refComponent, position);
				return;
			}
		},


	});
});
