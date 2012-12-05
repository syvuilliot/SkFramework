define([
	'dojo/_base/declare',
	'SkFramework/component/DomComponent',	'SkFramework/component/Container',
	'SkFramework/component/_WithDomNode',	'SkFramework/component/_WithDijit',
	'SkFramework/component/Presenter',
	'SkFramework/utils/binding',
	"put-selector/put",
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
			}
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
		},

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

			this._bindComponents({
				headRow: {
					remove: function(){cancelHeadRowValueBinding();},
				},
				body: {
					remove: function(){
						cancelBodyValueBinding();
						cancelBodyConfigBinding();
					}
				}
			});

			//place components views
			this._placeComponent($.head.addChildren([
				$.headRow,
			]));
			this._placeComponent($.body);
		},

	});
});