define([
	'compose',
	'ksf/dom/composite/Composite',
	'ksf/base/Destroyable',
	'ksf/utils/destroy',
	'ksf/dom/proxyEvent',
	'ksf/collections/OrderableSet',
	'./List',
	'./dom/HtmlElement',
	'./dom/layout/HtmlContainerIncremental',
], function(
	compose,
	Composite,
	Destroyable,
	destroy,
	proxyEvent,
	OrderableSet,
	List,
	HtmlElement,
	HtmlContainer
){

	var HtmlContainerWhichEmitChanged = compose(
		HtmlContainer,
		proxyEvent.changed
	);

	/**
	Component that uses native <select> html element for displaying a list of items as text and selecting one item
	Known bug: in chrome, the native <select> element automatically select the first item when inserted in dom without emiting a 'change' event. So we have to ensure to insert this Select component in dom before to set the 'options'
	*/
	return compose(
		Composite,
		function(args){
			var self = this;
			this.set('options', args && args.options || new OrderableSet());

			var selectComponent = new HtmlContainerWhichEmitChanged('select');

			this._component = new List({
				container: selectComponent,
				factory: function(item){
					var option = new HtmlElement('option');
					if (args && args.labelProp){
						option.own(option.setR('text', item.getR(args.labelProp)));
					} else {
						option.set('text', item);
					}
					return option;
				},
			});
			this._component.setR('content', this.getR('options'));
			selectComponent.bind('selectedIndex', this, 'selected', {
				convert: function(item){
					return self.get('options').indexOf(item);
				},
				revert: function(index){
					return self.get('options').get(index);
				},
			});

			// hack for keeping view in sync when options are changed
			this.getR('options').flatMapLatest(function(options) {
				return options.asReactive();
			}).onValue(function() {
				selectComponent.set('selectedIndex', self.get('options').indexOf(self.get('selected')));
			});

		}, {
			_applyStyle: function() {
				this.style.forEach(function(value, category) {
					this._component.style.set(category, value);
				}, this);
			},

			createRendering: function() {
				this._applyStyle();
				this.set('domNode', this._component.get('domNode'));
			},

			updateRendering: function() {
				this._applyStyle();
			},
			destroy: function(){
				Destroyable.prototype.destroy.call(this);
				destroy(this._component);
			},

		}
	);
});