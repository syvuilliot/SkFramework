define([
	'dojo/_base/declare',
	'SkFramework/component/DomComponent',	'SkFramework/component/Container',
	'SkFramework/component/_WithDomNode',	'SkFramework/component/_WithDijit',
	'SkFramework/component/Presenter',
	'SkFramework/utils/binding',
	"put-selector/put",
	"dojo/on",
	'frb/bind',
	"SkFramework/components/repeater/Repeater",
	"SkFramework/components/objectRenderer/ObjectRenderer",

], function(
	declare,
	DomComponent,							Container,
	_WithDom,								_WithDijit,
	PresenterBase,
	binding,
	put,
	on,
	bind,
	Repeater,
	ObjectRenderer
){
	var Presenter = declare([PresenterBase], {
		constructor: function(){
		},
		_valueSetter: function(value){
			//TODO: test that value is a collection
			this.value = value;
		},
		_configSetter: function(config){
			this.config = config;
		}
	});


	var BodyCell = declare(DomComponent, {
		domTag: "td",
		constructor: function(params){
			if (params.renderer){
				var renderer = new params.renderer(params.rendererArgs);
				this._addComponent(renderer, "renderer");
				this._placeComponent(renderer);
				this._cancelValueBinding = bind(renderer._presenter, params.rendererValueProp || "value", {
					"<->": "value",
					source: this._presenter,
				});
			} else {
				this._cancelValueBinding = bind(this, "domNode.innerHTML", {"<-": "_presenter.value"});

			}
		},
		destroy: function(){
			this._cancelValueBinding();
			this.inherited(arguments);
		},
	});

	var BodyRow = declare(ObjectRenderer, {
			domTag: "tr",
			createComponent: function(configLine){
				return new BodyCell({
					renderer: configLine.renderer,
					rendererArgs: configLine.rendererArgs,
				});
			},
			constructor: function(){
				this.own(on(this.domNode, "click", function(){
					this.emit("selected");
				}.bind(this)));
			},
	});

	var TableBody = declare(Repeater, {
		domTag: "tbody",
		componentConstructor: BodyRow,
		_addItemComponent : function(value, index){
			this.inherited(arguments);
			//create binding between this._presenter.config and component._presenter.config
			var row = this._componentsCollection[index];
			var cancelConfigBinding = bind(row._presenter, "config", {
				"<-": "config",
				source: this._presenter
			});
			var bindingRemover = {
				remove: function(){cancelConfigBinding();},
			};
			this._bindComponent(row, bindingRemover);
			// selection behavior
			// TODO: move into a separate mixin
			this.own(on(row, "selected", function(){
				this.select(row);
			}.bind(this)));
		},
		select: function(value){
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

	});

	return declare([DomComponent, _WithDom, _WithDijit], {
		domTag: "table",
		constructor: function() {
			//create presenter
			this._presenter = new Presenter();
			//register components
			this._addComponents({
				head: new declare([DomComponent, Container], {domTag: "thead"})(),
				headRow: new Repeater({
					domTag: "tr",
					componentConstructorArguments: {
						domTag: "th",
					}
				}),
				body: new TableBody(),
			});

			//bind components to presenter
			var $ = this._components;
			var cancelHeadRowValueBinding = bind($.headRow._presenter, "value", {
				source: this._presenter,
				"<-": "config.map{label}",
			});
			var cancelBodyValueBinding = bind($.body._presenter, "value", {
				source: this._presenter,
				"<-": "value",
			});
			var cancelBodyConfigBinding = bind($.body._presenter, "config", {
				source: this._presenter,
				"<-": "config",
			});
			var cancelBodySelectedBinding = bind($.body._presenter, "selected", {
				source: this._presenter,
				"<->": "selected",
			});
			var cancelBodySelectedIndexBinding = bind($.body._presenter, "selectedIndex", {
				source: this._presenter,
				"<->": "selectedIndex",
			});

			this._bindComponents({
				headRow: {
					remove: function(){cancelHeadRowValueBinding();},
				},
				body: {
					remove: function(){
						cancelBodyValueBinding();
						cancelBodyConfigBinding();
						cancelBodySelectedBinding();
						cancelBodySelectedIndexBinding();
					}
				}
			});

			//place components views
			this._placeComponent($.head.addChildren([
				$.headRow,
			]));
			this._placeComponent($.body);
		},
		select: function(index){
			return this._components.body.select(index);
		}

	});
});