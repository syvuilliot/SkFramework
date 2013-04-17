define([
	'ksf/utils/constructor',
	"frb/bind",
	'frb/bindings',
	"./CollectionRenderer",
	'ksf/component/DomComponent',
], function(
	ctr,
	bind,
	bindings,
	CollectionRenderer,
	DomComponent
){

	var BodyCell = ctr(function(configLine, item, index){
		this.domNode = document.createElement("td");
		this._renderer = configLine.renderer;
		this._cmp = this._renderer.create(item, index);
		this._renderer.place(this._cmp, this.domNode);
	},  {
		destroy: function(){
			this._renderer.unplace(this._cmp, this.domNode);
			this._renderer.destroy(this._cmp);
		},
	});

	var BodyRow = ctr(function BodyRow(item, index){
		this.domNode = document.createElement("tr");
		this._cells = new CollectionRenderer({
			container: this.domNode,
			renderer: {
				create: function(configLine){
					return new BodyCell(configLine, item, index);
				},
				destroy: function(cell){
					cell.destroy();
				},
				place: function(cmp, container, index){
					container.insertBefore(cmp.domNode, container.children[index]);
				},
				unplace: function(cmp, container, index){
					container.removeChild(cmp.domNode);
				},
			}
		});
	}, {
		set config(config){
			this._cells.collection = config;
		},
		destroy: function(){
			this._cells.destroy();
		}
/*		constructor: function(){
			this.own(on(this.domNode, "click", function(){
				this.emit("selected");
			}.bind(this)));
		},
*/	});

	var TableBody = ctr(function TableBody() {
		this.domNode = document.createElement("tbody");
		var body = this;
		this._rows = new CollectionRenderer({
			container: this.domNode,
			renderer: {
				create: function(item, index){
					return bindings.defineBinding(new BodyRow(item, index), "config", {
						"<-": "config",
						source: body,
					});
				},
				destroy: function(row){
					bindings.cancelBinding(row, "config");
					row.destroy();
				},
				place: function(cmp, container, index){
					container.insertBefore(cmp.domNode, container.children[index]);
				},
				unplace: function(cmp, container, index){
					container.removeChild(cmp.domNode);
				},
			}
		});
	}, {
		set items(items){
			this._rows.collection = items;
		},
		destroy: function(){
			this._rows.destroy();
		}
	});

/*select: function(value){
	var row;
	switch (typeof value){
		// search by index
		case "number":
			row = this._componentsCollection[value];
			break;
		// if object is a known row component
		case "object":
			if (this._componentsCollection.has(value)) {
				row = value;
				break;
			}
		// else try to find the value in the values collection
		default:
			var index = this.get(this.collectionProperty).indexOf(value);
			// if nothing is found, row is set to undefined whiwh equivalent to selected nothing
			row = index >= 0 ? this._componentsCollection[index] : undefined;
	}
	var oldSelectedRow = this.get("selectedRow");
	oldSelectedRow && put(oldSelectedRow.domNode, "!selected"); // remove selected class on old selected row
	this.set("selectedRow", row ? row : undefined);
	row && put(row.domNode, ".selected");
	// console.log("selected row", this.get("selectedRow"));
	this.set("selected", row ? row.get("value") : undefined);
	// console.log("selected value", this.get("selected"));
	this.set("selectedIndex", row ? this._componentsCollection.indexOf(row) : -1);
	// console.log("selected index", this.get("selectedIndex"));
}
*/

	return ctr(DomComponent, function Table() {
		DomComponent.apply(this, arguments);
		//register components
		this._factory.addEach({
			"head":  function(){
				return document.createElement("thead");
			},
			"headRow": function(){
				var headRow = new CollectionRenderer({
					container: document.createElement("tr"),
					renderer: {
						create: function(configLine){
							var th = document.createElement("th");
							th.innerHTML = configLine.title;
							return th;
						},
						destroy: function(){},
						place: function(cmp, container, index){
							container.insertBefore(cmp, container.children[index]);
						},
						unplace: function(cmp, container, index){
							container.removeChild(cmp);
						},
					}
				});
				headRow.domNode = headRow.container; // give it the domComponent interface
				return headRow;
			},
			"body": function(){
				return new TableBody();
			},
		});

		//bind components
		this._bindings.addEach([
			["headRow", function(headRow){
				return bind(headRow, "collection", {source: this, "<-": "config"});
			}.bind(this)],
			["body", function(body){
				return [
					bind(body, "items", {source: this,	"<-": "value"}),
					bind(body, "config", {source: this, "<-": "config"}),
					bind(body, "selection", {source: this,"<->": "selection"}),
					bind(body, "selectedIndex", {source: this,	"<->": "selectedIndex"}),
				];
			}.bind(this)],
		]);

		//place components views
		this._placement.set([
			["head", ["headRow"]],
			"body",
		]);
	}, {
		_domTag: "table",
		destroy: function(){
			// TODO: call this._components.deleteAll() that call "destroy" on components
			this._components.get("headRow").destroy();
			this._components.get("body").destroy();
		}
	});
});