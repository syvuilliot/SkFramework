define([
	'dojo/_base/declare',
	'dojo/dom',	'dojo/dom-construct',	'put-selector/put',
	'../utils/string',
	'./Component',	'./_Placing'
], function(
	declare,
	dom,		domConstruct,			put,
	str,
	Component,		_Placing
) {
	var isDomCmp = function(cmp) {
		return cmp instanceof DomComponent;
	};

	/*
	 * Component using a DOM-node as view
	 */
	var DomComponent = declare([Component, _Placing], {
		domNode: null,
		domTag: "div",
		domAttrs: null,

		/*
		 * Whether or not this component is part of the main DOM tree
		 */
		inDom: false,

		width: undefined,
		height: undefined,

		constructor: function() {
			if (!this.domNode) {
				this.domNode = this.domAttrs ? put(this.domTag, this.domAttrs) : put(this.domTag);
			} else if (this.domNode.parentNode) {
				this.set('inDom', true);
			}
		},

		_addComponent: function(cmp, id) {
			var comp = this.inherited(arguments);
			if (isDomCmp(comp)) {
				// add CSS class matching the component id, hyphenated
				if (id) {
					comp.addClass(str.hyphenate(id));
				}
			}
			return comp;
		},

		/*
		 * Insert component's view into its own DOM-node
		 */
		_insertComponentIntoDom: function(component, options) {
			if (isDomCmp(component)) {
				domConstruct.place(component.domNode, this.domNode, options);
			}
		},

		/*
		 * Detach component's view from its own DOM-node
		 */
		_detachComponentFromDom: function (component) {
			if (isDomCmp(component)) {
				this.domNode.removeChild(component.domNode);
			}
		},

		/*
		 * Place sub-components' views in its own view
		 *
		 * @param {Component}	component	Component instance
		 * @param {Integer|String}		options		Placement options (TODO: to be specified)
		 */
		_doPlaceComponent: function(component, options) {
			this._insertComponentIntoDom(component, options);
			this._setComponentInDom(component, this.inDom);
			this._childSizeChanged();
		},

		/*
		 * Unplace sub-components' views from its own view
		 *
		 * @param {Component}	component	Component instance
		 */
		_doUnplaceComponent: function(component) {
			this._detachComponentFromDom(component);
			this._setComponentInDom(component, false);
			this._childSizeChanged();
		},

		/*
		 * Process sizing of a sub-component
		 */
		_sizeComponent: function(component) {
			if (isDomCmp(component)) {
				component.updateSize();
			}
		},

		/*
		 * Inform sub-component whether it is part of the main DOM tree
		 */
		_setComponentInDom: function(component, value) {
			if (isDomCmp(component)) {
				component.inDom = value;
				if (value) {
					// listen for size changes on child
					this._bindComponent(component, component.on('sizechange', this._childSizeChanged.bind(this)), 'sizechange');
				} else {
					this._unbindComponent(component, 'sizechange');
				}
			}
		},

		/*
		 * Public methods
		 */


		/*
		 * Add a CSS class to DOM node
		 */
		addClass: function(className) {
			this.domTag += '.' + className;
			put(this.domNode, '.' + className);
		},

		/*
		 * Remove a CSS class from DOM node
		 */
		removeClass: function(className) {
			this.domTag = this.domTag.replace(new RegExp('\.' + className + '(\..*)*$'), '$1');
			put(this.domNode, '!.' + className);
		},

		_childSizeChanged: function() {
			if (this._sizing) { return; }

			this.updateSize(false);
			this._updateChildrenSize();
		},

		_updateChildrenSize: function() {
			this._sizing = true;
			var c;
			for (c = 0; c < this._placedComponents.length; c += 1) {
				this._sizeComponent(this._placedComponents[c]);
			}
			this._sizing = false;
		},

		/*
		 * Self-sizing
		 */
		updateSize: function(sizeDescendants) {
			if (this._sizing || ! this.inDom) { return; }

			sizeDescendants = (sizeDescendants === undefined) ? true : sizeDescendants;
			var c,
				sizeChanged = false,
				newWidth = this.domNode.offsetWidth,
				newHeight = this.domNode.offsetHeight;

			if (this.width !== newWidth) {
				this.width = newWidth;
				sizeChanged = true;
			}
			if (this.height !== newHeight) {
				this.height = newHeight;
				sizeChanged = true;
			}

			if (sizeChanged) {
				if (sizeDescendants) {
					this._updateChildrenSize();
				}
				this.emit('sizechange');
			}
		}
	});

	Object.defineProperty(DomComponent.prototype, "domNode", {
		set: function(node) {
			this._domNode = dom.byId(node);
		},
		get: function(){
			return this._domNode;
		},
	});
	Object.defineProperty(DomComponent.prototype, "inDom", {
		set: function(value) {
			if (value === undefined) {
				value = true;
			}
			if (value !== this.inDom) {
				this._inDom = value;
				// Inform subcomponents of the new state
				var c;
				for (c = 0; c < this._placedComponents.length; c += 1) {
					this._setComponentInDom(this._placedComponents[c], value);
				}
				if (value) {
					this.updateSize(false);
				}
			}
		},
		get: function(){
			return this._inDom ? true : false;
		}
	});
	return DomComponent;
});