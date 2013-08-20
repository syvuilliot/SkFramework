define([
	'compose',
	'bacon',
	'./List'
], function(
	compose,
	Bacon,
	List
){
	return compose(
		List,
		function(){
			this.bind("activeContentElement", this, 'active', {
				convert: function(item){
					var items = this.get('value');
					var itemIndex = items && items.indexOf(item);
					return itemIndex > -1 ? this.get('content').get(itemIndex) : undefined;
				},
				revert: function(contentElement){
					var content = this.get('content');
					var index = content && content.indexOf(contentElement);
					return index > -1 ? this.get('value').get(index) : undefined;
				},
			});
			this.bindSelection("activeContentElement", this.get("content"), "active");
		}
	);
});