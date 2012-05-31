define([
	"dojo/_base/declare",
	"dojo/_base/lang",
	"SkFramework/widgets/Widget",
	"SkFramework/controller/_ListRenderer",
], function(declare, lang, Widget, _ListRenderer){
	return declare([Widget, _ListRenderer], {
		//the property name used to set the item on each itemView instance : "item" by default
		itemPropName: "item",

		//just to remember that a list can also have other children than item children
/*		children: {
			title: {
				type: DomFragment,
				params: {
					tag: "h1",
				}
			}
		},
*/
		addItem: function(item, index){
			var child = new this.itemViewType(this.itemViewParams);
			this.addChild(child, index);
			child.set(this.itemPropName, item);
			return child;
		},
		
		updateItem : function(item, from, to, child){
			child.set(this.itemPropName, item);
			return child;
		},
		
		removeItem: function(item, index, child){
			return child.destroyRecursive();
		},

	});
});