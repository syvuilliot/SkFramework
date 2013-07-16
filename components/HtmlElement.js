define([
	"compose/compose",
	"../utils/ObservableObject",
	"../utils/Destroyable",

], function(
	compose,
	ObservableObject,
	Destroyable
){
	var WithDefaultGetterSetterForHtmlElement = function(){
		this._Getter = function(prop){
			return this.domNode[prop];
		};
		this._Setter = function(prop, value){
			this.domNode[prop] = value;
		};
		this._Detector = function(prop){
			return this.domNode.hasOwnProperty(prop);
		};
		this._Remover = function(prop){
			// delete this[prop]; // we can't do this on an HtmlElement, that breaks it
		};
		this._domNodeGetter = function(){
			return this.domNode;
		};
	};

	var HtmlElement = compose(
		ObservableObject,
		Destroyable,
		WithDefaultGetterSetterForHtmlElement,
		function(args){
			this._tag = args.tag;
			this.createRendering();
			// TODO: remove le "setEach" non explicite
			if (args) {
				this.setEach(args);
			}
		}, {
			createRendering: function(){
				this.domNode = document.createElement(this._tag);
			},
		}
	);

	return HtmlElement;

});