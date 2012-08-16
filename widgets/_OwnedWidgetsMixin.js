define([
	"dojo/_base/declare",
	"dijit/registry",
], function(declare, registry){
	return declare(null, {
		//mixin of dijit/_WidgetBase to allow easier insertion of owned widgets (widgets that are part of the private implementation of this)
		//it also allow a declarative way to insert this owned widgets at creation time (replacing/complementing use of _WidgetsInTemplateMixin)
		//if used with "_TemplatedMixin" and "_WidgetsInTemplateMixin" it must be mixed after them 
		buildRendering: function(){
			this.inherited(arguments);
			if(this.ownedWidgetsDeclaration){
				Object.keys(this.ownedWidgetsDeclaration).forEach(function(widgetName){
					var widgetDecl = this.ownedWidgetsDeclaration[widgetName];
					var widget = new widgetDecl.type(widgetDecl.params);
					var node = this[widgetDecl.node] || this[widgetName + "Node"]; //nodeName must be a dojo-attach-point
					var eventsMap = {};
					if(widgetDecl.events){
						Object.keys(widgetDecl.events).forEach(function(eventName){
							var methodName = widgetDecl.events[eventName];
							eventsMap[eventName]=this[methodName];
						}.bind(this));
					}
					this[widgetName] = this.addOwnedWidget(widget, node, eventsMap);
				}.bind(this));
			}
		},
		addOwnedWidget: function(widget, node, eventsMap){
			//insert ownedWidget in this.domNode
			widget.placeAt(node, "replace");
			//bind events
			if (eventsMap){
				Object.keys(eventsMap).forEach(function(eventName){
					var callback = eventsMap[eventName];
					widget.on(eventName, callback.bind(this));//call the cb in context of this
				}.bind(this));
			}
			//start owned widget if this is already started
			if(this._started){
				widget.startup();
			}
			return widget;
		},
		removeOwnedWidget: function(widget){

		},
		getOwnedWidgets: function(){
			return registry.findWidgets(this.domNode, this.containerNode);
		},
		startup: function(){
			//start owned widgets before this
			this.getOwnedWidgets().forEach(function(widget){
				if(!widget._destroyed){
					widget.startup();
				}
			});
			this.inherited(arguments);
		},
	});
});