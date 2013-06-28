define([
	'ksf/utils/constructor',
	'put-selector/put'
], function(
	ctr,
	put
) {
	return ctr(function(args) {
		this.domNode = put(args || 'div');
	}, {
		render: function() {
			this.domNode.style.width = this.bounds && this.bounds.width && (this.bounds.width + 'px'),
			this.domNode.style.height = this.bounds && this.bounds.height && (this.bounds.height + 'px');
		}
	});
});