define([
	'dojo/_base/declare',
	'SkFramework/component/DomComponent',	'SkFramework/component/Container',
	'SkFramework/component/_WithDomNode',	'SkFramework/component/_WithDijit',
    'SkFramework/component/Presenter',
    'SkFramework/utils/binding',
    "put-selector/put",
], function(
	declare,
	DomComponent,							Container,
	_WithDom,								_WithDijit,
	PresenterBase,
	binding,
	put
){
	var Presenter = declare([PresenterBase], {
		constructor: function(){
		},
		_valueSetter: function(value){
			this.value = value;
		},
	});

	return declare([DomComponent, _WithDom, _WithDijit], {
		domAttrs: {
		},
		constructor: function(params) {
			//create presenter
			this._presenter = new Presenter();

			//register components
			this._addComponents({
				subComponent: new SubComponent(),
			});

			//bind components to presenter
			var $ = this._components;
			this._bindComponents({
				subComponent: [
					new binding.Value(this._presenter, $.subComponent, {
						sourceProp: "someValue",
						targetProp: "value"
					}),
				],
			});

			//place components views
			this._placeComponent($.containerComponent.addChildren([
				$.containedComponent,
			]));
			this._placeComponent('subComponent');
		}
	});
});