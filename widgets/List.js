define([
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dijit/_WidgetBase",
	"dojo/Evented",
	"dojo/on",
	"../controller/_ListRenderer",
	"dijit/_Container",
], function(declare, lang, Widget, Evented, on, _ListRenderer, _Container){
	return declare([Widget, Evented, _ListRenderer, _Container], {
		addItem: function(item){
			var itemView = this.renderItem(item);
			this.addChild(itemView);
			Object.keys(this.eventsMap).forEach(function(key){
				var value = this.eventsMap[key];
				on(itemView, key, this[value]);
			}.bind(this));
			return itemView;
		},
	});
});