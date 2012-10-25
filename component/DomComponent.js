define([
	'dojo/_base/declare',
	'dojo/dom-construct',
	'./Component'
], function(
	declare,
	domConstruct,
	Component
) {
	/*
	 * Component using a DOM-node as view
	 */
	var DomComponent = declare([Component], {
		domNode: null,
		domTag: "div",
		domAttrs: null,

		postscript: function(params) {
			this.inherited(arguments);
			this._render();
		},
		
		_render: function(){
			this.domNode = domConstruct.create(this.domTag, this.domAttrs);
		},

		/*
		 * Places sub-components' views in its own view (DOM-node)
		 */
		_append: function(component, options) {
			if (component instanceof DomComponent) {
				domConstruct.place(component.domNode, this.domNode, "last");
			}
		},
		_remove: function (component) {
			if (component instanceof HTMLElement) {
				this.domNode.removeChild(component); //this method doen't seem to exist in domConstruct
			} else {
				this.domNode.removeChild(component.domNode);
			}
		},

		placeAt: function(refComponent, position) {
			//if refComponent is a domNode
			if (refComponent instanceof HTMLElement || typeof refComponent === "string") {
				domConstruct.place(this.domNode, refComponent, position);
				return;
			}
			//if refComponent is a SkComponent, delegate to its "addChild" public method
			if (refComponent instanceof DomComponent) {
				refComponent.addChild(this, position);
			}
		},

		//do we need to do something "view related" on destroy ?
		//to my mind, it's up to the parent to remove us from its view but we don't have to do it in its place (it could have removing logic that we can't call since we don't know our parent component, only our parent domNode)
		//destroy should only "kill" the component === cancel binding handlers... this is what destroyable already do
/*		destroy: function(){
		}
*/

	});
	return DomComponent;
});
