define([
	"dojo/_base/declare",
	"dojo/_base/lang",
	"SkFramework/widgets/Widget",
], function(declare, lang, Widget){
	return declare([Widget], {
		//the property name used to set the item on each itemView instance
		itemPropName: "item",
/*		children: {
			title: {
				type: DomFragment,
				params: {
					tag: "h1",
				}
			}
		},
*/		constructor: function(){
			//sub set of children : only the children corresponding to a data item
			this._itemsChildren = {};
		},
		_setItemsAttr: function(items){
			//for test only
			this.emit("start rendering items");

			this.items = items;
			items.forEach(function(item, index){
				var itemViewParams = this.itemViewParams || {};
				itemViewParams[this.itemPropName] = item;
				var itemChild = new this.itemViewType(itemViewParams);
				this._itemsChildren[item.id] = itemChild;
				this.addChild(itemChild, index);
			}.bind(this));

			//for test only
			this.emit("finished rendering items");
		}
	});
});