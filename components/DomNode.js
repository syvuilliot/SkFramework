define([
	'ksf/utils/constructor',
	'put-selector/put'
], function(
	ctr,
	put
) {
	return ctr(function(args) {
		if (arguments.length == 0 || arguments[0] === undefined) {
			this.domNode = put('div');
		} else {
			this.domNode = put.apply(null, arguments);
		}
	}, {
		render: function() {
			this.domNode.style.width = this.bounds && this.bounds.width && (this.bounds.width + 'px'),
			this.domNode.style.height = this.bounds && this.bounds.height && (this.bounds.height + 'px');
		},

		preferredSize: function() {
			var size,
				oldBounds = this.bounds;
			this.bounds = { height: null, width: null };
			this.render();
			size = {
				height: this.domNode.offsetHeight,
				width: this.domNode.offsetWidth
			};
			this.bounds = oldBounds;
			return size;
		}
	});
});