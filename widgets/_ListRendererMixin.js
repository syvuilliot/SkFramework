define([
	'dojo/_base/declare',
	'lodash/lodash',
	'SkFramework/utils/harmony-collections',
], function(declare, _) {
	// module:
	// summary:
	//		Mixin to render a list of items. The items list must have a forEach method and can have an observe method for live rendering
	//		There is a default implementation of rendering items using parameters : itemWidgetType, itemWidgetProps, ...
	//		TODO: add events : itemAdded, itemRemoved, itemsSet, ...
	//		TODO: work with ordered store (that send "removeFrom" and "insertedInto" in the observe callback)
	return declare(null, {
		
		//Map from item to its representation (child). Use item.getIdentity() as the key, item directly otherwise
		itemsMap: null,
		//values used by the default this.renderItem()
		itemWidgetType: null,
		itemWidgetProps: null,
		itemWidgetSetProperty: "value", 
		itemWidgetAttachEvent: null, //map of eventName to callback name
		itemWidgetEventListener: null, //used to look for the callback function and to set the context of the call

		//for observable items
		observeHandle: null,
		observeUpdates: true, //if "false", only observe add and remove notifications from items list
				
		constructor: function(){
			this.reset();
		},

		_setItemsAttr: function(items){
			//remove all existing stuff
			this.reset();
			//initial rendering of items
			_(items).forEach(function(item, index){
				this.addItem(item, index);
			}.bind(this));
			//observation of items if available
			if (items.observe){
				this.observeHandle = items.observe(function(item, removedFrom, insertedInto){
					if (removedFrom > -1 && insertedInto > -1){
						this.updateItem(item, removedFrom, insertedInto);
					}
					else {
						if (insertedInto == -1){
							this.removeItem(item, removedFrom);
						}
						if (removedFrom == -1){
							this.addItem(item, insertedInto);
						}
					}
				}.bind(this), this.observeUpdates);
			}
		},
		_getItemsAttr: function(){
			//in the MVC principle, the view is not responsible for value (model) modification. So this function is just a way to get the value that this view is representing. And not to get a new value based on the current values of children widgets
			return this.value;
/*			var items = [];
			this.getChildren().forEach(function(child){
				items.push(child.get(this.itemWidgetSetProperty));
			}.bind(this));
			return items;
*/		},
		addItem: function(item, index){
			var widget = this.renderItem(item, index);
			this.addChild(widget);
			this.itemsMap.set(this.getItemIdentity(item), widget);
		},
		renderItem: function(item, index){
			var itemWidget = new this.itemWidgetType(this.itemWidgetProps);
			itemWidget.set(this.itemWidgetSetProperty, item, false);
			var listener = this.itemWidgetEventListener || this; //by default events listeners are registered on this
			if(this.itemWidgetAttachEvent){
				//bind each method of listener to item event in the context of listener
				Object.keys(this.itemWidgetAttachEvent).forEach(function(eventName){
					var methodName = this.itemWidgetAttachEvent[eventName];
					itemWidget.on(eventName, listener[methodName].bind(listener));
				}.bind(this));
			}
			if(this.itemWidgetWatch){
				//bind each method of listener to item state change in the context of listener
				Object.keys(this.itemWidgetWatch).forEach(function(prop){
					var methodName = this.itemWidgetWatch[prop];
					itemWidget.watch(prop, listener[methodName].bind(listener));
				}.bind(this));
			}
			return itemWidget;
		},
		
		updateItem : function(item, from, to, child){ //est-ce une bonne idée d'envoyer également le "child" ?
			this.removeItem(item, from, child);
			this.addItem(item, to);
		},
		
		removeItem: function(item){
			var child = this.itemsMap.get(this.getItemIdentity(item));
			child.destroy(); //child.destroyRecursive();
			this.itemsMap.delete_(item);
		},
		
		removeItems: function(){
			this.itemsMap = new Map();
			this.destroyDescendants();
		},
		reset: function(){
			if (this.observeHandle){this.observeHandle.remove();}
			this.removeItems();
		},
		getItemIdentity: function(item){
			return item.getIdentity ? item.getIdentity() : item;
		},
		destroy: function(){
			this.reset();
			this.inherited(arguments);
		}
		//TODO: use an optionnal "comparator" function to order children based on items
	});
	
});
