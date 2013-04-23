define([
	"ksf/utils/constructor",
	"./List",
	"dojo/aspect",
	"frb/observe",
	"frb/bind",
	"collections/map",
], function(
	ctr,
	List,
	aspect,
	observe,
	bind,
	Map
){

	var ActiveItemManager = ctr(function(args){
		this.activeItem = args.activeItem;
		this._items = args.items;
		this._rows = args.rows;
		this._listener = args.listener;
		this._listenerReturns = new Map();
		this._setter = args.setter;
		this.activeRow = null;
		// observe selectedItem pour mettre à jour la vue
		this.updateView(this.activeItem);
		observe(this, "activeItem", this.updateView.bind(this));
		// observe la vue pour mettre à jour "selectedItem"
		aspect.after(this._rows, "add", this.onRowAdded.bind(this), true);
		// observer la collection pour mettre à null selectedItem s'il est supprimé de la collection
		observe(this, "_items.rangeChange()", function(index, addedItems, removedItems){
			if (removedItems.indexOf(this.activeItem) >= 0 ){
				this.activeItem = null;
			}
		});
		// observe la vue pour supprimer les observer lorsque les lignes sont supprimées
		aspect.after(this._rows, "delete", this.onRowRemoved.bind(this), true);
	}, {
		updateView: function(activeItem){
			// unactive current active row
			this.activeRow && this._setter.unset(this.activeRow, this._activeRowReturn);
			this._activeRowReturn = null;
			// active new active row
			if (activeItem){
				this.activeRow = this._rows.get(activeItem);
				this._activeRowReturn = this._setter.set(this.activeRow);
			}
		},
		onRowAdded: function(row){
			var item = this._rows.getId(row);
			this._listenerReturns.set(row, this._listener.add(row, function(){
				this.activeItem = item;
			}.bind(this)));
			// et on en profite aussi pour vérifier si la ligne ajoutée ne correspond pas à activeItem au cas où elle n'existait pas lorsque selectedItem a été modifié
			if (item === this.activeItem){
				this.updateView(item);
			}
		},
		onRowRemoved: function(row){
			this._listener.remove(row, this._listenerReturns.get(row));
			this._listenerReturns.delete(row);
		},
		destroy: function(){
		},
	});


	return ctr(List, function(args){
		List.apply(this, arguments);
		this._activeItemManager = new ActiveItemManager({
			activeItem: args.activeItem,
			items: args.value,
			rows: this._rows,
			listener: args.activeListener,
			setter: args.activeSetter,
		});
		bind(this._activeItemManager, "items", {
			"<->": "value", source: this,
		});
		bind(this._activeItemManager, "activeItem", {
			"<->": "activeItem", source: this,
		});
	});

});