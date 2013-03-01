define([
	'dojo/_base/declare',
	'../../component/DomComponent',	'../../component/Container',
	'../../component/_WithDomNode',	'../../component/_WithDijit',
    '../../component/Presenter',
    '../../utils/binding',
    "put-selector/put"
], function(
	declare,
	DomComponent,							Container,
	_WithDom,								_WithDijit,
	PresenterBase,
	binding,
	put
){
	return declare([DomComponent, _WithDom, _WithDijit], {
		domTag: 'div.component',
		
		_presenter: function() {
			return new (declare([PresenterBase], {
				constructor: function(){
				},
				_titleSetter: function(value){
					this.title = value;
				}
			}))();
		},
		
		constructor: function(params) {
			// declare components
			this._addComponents({
				container: new (declare([Container, _WithDom]))()
			});
			
			this._components = {
				subComponent: function() { return put('h1'); }
			};

			//bind components to presenter
			this._bindComponents({
				subComponent: function() {
					return [
						new binding.Value(this, this._subComponent, {
							sourceProp: "title",
							targetProp: "innerHTML"
						})
					];
				}
			});

			//place components views
			this._placeComponents([
				{'container': ['subComponent']}
			]);
		}
	});
});