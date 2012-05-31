define([
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dijit/_WidgetBase",
	"dojo/Evented",
	"dojo/on",
	"dijit/_Container",
], function(declare, lang, Widget, Evented, on, _Container){
	return declare([Widget, /*Evented,*/ _Container], {
		constructor: function(){
			this._children = {};
		},
		buildRendering: function(){
			this.inherited(arguments);
			if(this.children){
				Object.keys(this.children).forEach(function(childId){
					var childConfig = this.children[childId];
					var child = new childConfig.type(childConfig.params);
					this.addChild(child, childConfig.index);
					this._children[childId] = child;
					if (childConfig.events){
						Object.keys(childConfig.events).forEach(function(eventId){
							var handlerId = childConfig.events[eventId];
							//bind handler on this.domNode instead of this (the widget instance) to benefit from DOM events bubbling
							on(child.domNode, eventId, this[handlerId].bind(this));
							// child.on(eventId, this[handlerId].bind(this));
						}.bind(this));
					}
				}.bind(this));
			}
		},
		getChild: function(childId){
			return this._children[childId];
		},
	});
});