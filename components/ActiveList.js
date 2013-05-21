define([
	"ksf/utils/constructor",
	"./List",
	"frb/observe",
	"frb/bind",
	"collections/map",
], function(
	ctr,
	List,
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
		this._rows.on("added", this.onRowAdded.bind(this));
		// observer la collection pour mettre à null selectedItem s'il est supprimé de la collection
		observe(this, "_items.rangeChange()", function(index, addedItems, removedItems){
			if (removedItems.indexOf(this.activeItem) >= 0 ){
				this.activeItem = null;
			}
		});
		// observe la vue pour supprimer les observer lorsque les lignes sont supprimées
		this._rows.on("deleted", this.onRowRemoved.bind(this));
	}, {
		updateView: function(activeItem){
			// unactive current active row
			this.activeRow && this._setter.unset(this.activeRow, this._activeRowReturn);
			this._activeRowReturn = null;
			// activate new active row if it exists
			var activeRow = activeItem && this._rows.get(activeItem);
			if (activeRow){
				this.activeRow = activeRow;
				this._activeRowReturn = this._setter.set(this.activeRow);
			}
		},
		onRowAdded: function(row) {
			this._listenerReturns.set(row.key, this._listener.add(row.value, function(){
				this.activeItem = row.key;
			}.bind(this)));
			// et on en profite aussi pour vérifier si la ligne ajoutée ne correspond pas à activeItem au cas où elle n'existait pas lorsque selectedItem a été modifié
			if (row.key === this.activeItem){
				this.updateView(row.key);
			}
		},
		onRowRemoved: function(row){
			this._listener.remove(row.value, this._listenerReturns.get(row.key));
			this._listenerReturns.delete(row.key);
		},
		destroy: function() {},
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