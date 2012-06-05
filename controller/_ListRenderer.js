define([
	'dojo/_base/declare',
], function(declare) {
	// module:
	// summary:
	//		Mixin to render a list of items. The items list must have a forEach method and can have an observe method for live rendering

	return declare([], {
		items: null,
		observeHandle: null,
		observeUpdates: true, //if "false", only observe add and remove notifications from items list
				
		constructor: function(){
			this.byItemId = {};
		},

		_setItemsAttr: function(items){
			if (this.observeHandle){this.observeHandle.cancel();}
			this.removeAllItems();
			this.items = items;
			//rendering of initial items
			items.forEach(function(item){
				var child = this.addItem(item);
				this.byItemId[item.getIdentity()] = {
					item: item,
					//TODO: index: 
					child: child,
				};
			}.bind(this));
			//observation of items changes if available
			if (items.observe){
				this.observeHandle = this.items.observe(function(item, removedFrom, insertedInto){
					var child, itemId = item.getIdentity();
					if (removedFrom > -1 && insertedInto > -1){
						child = this.updateItem(item, removedFrom, insertedInto, this.byItemId[itemId].child);
						this.byItemId[itemId] = {
							item: item,
							index: insertedInto,
							child: child,
						};
					}
					else {
						if (insertedInto == -1){
							this.removeItem(item, removedFrom, this.byItemId[itemId].child);
							delete this.byItemId[itemId];
						}
						if (removedFrom == -1){
							child = this.addItem(item, insertedInto);
							this.byItemId[itemId] = {
								item: item,
								index: insertedInto,
								child: child,
							};
						}
					}
				}.bind(this), this.observeUpdates);
			}
		},
				
		addItem: function(item, index){},
		
		updateItem : function(item, from, to, child){ //est-ce une bonne idée d'envoyer également le "child" ?
			this.removeItem(item, from, child);
			return this.addItem(item, to);
		},
		
		removeItem: function(item, index, child){}, //est-ce une bonne idée d'envoyer également le "child" ?
		
		removeAllItems: function(){
			Object.keys(this.byItemId).forEach(function(itemId){
				var itemRefs = this.byItemId[itemId];
				this.removeItem(itemRefs.item, itemRefs.index, itemRefs.child);
				delete this.byItemId[itemId];
			}.bind(this));
		},
		
		uninitialize: function(){ //called by _WidgetBase destroy()
			this.inherited(arguments);
			if (this.observeHandle){this.observeHandle.cancel();}
		}
	});
	
});
