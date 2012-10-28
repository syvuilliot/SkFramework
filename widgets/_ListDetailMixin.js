define([
	'dojo/_base/declare',
	'./_OwnedWidgetsMixin'
], function(declare, Owner) {
	return declare(Owner, {
		
		_setListViewAttr: function(listView){
			this.listView = listView;
			this.addOwnedWidget(listView, this.listViewNode);
			listView.watch("activeItem", function(prop, oldValue, currentValue){
				this.set("activeItem", currentValue);
			}.bind(this));
		},
		_setDetailViewAttr: function(detailView){
			this.detailView = detailView;
			this.addOwnedWidget(detailView, this.detailViewNode);
		},

		_setItemsAttr: function(items){
			this.set("activeItem", undefined);
			this.listView && this.listView.set("items", items);
		},
		_setActiveItemAttr: function(item){
			this.activeItem = item;
			this.listView && this.listView.set("activeItem", item);
			this.detailView && this.detailView.set("item", item);
		},


	});
	
});
