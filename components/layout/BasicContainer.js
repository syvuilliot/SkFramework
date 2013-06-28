define([
	'ksf/utils/constructor',
	'../DomNode',
	'collections/shim-array'
], function(
	ctr,
	DomNode
) {
	return ctr(DomNode, function(args) {
		DomNode.call(this, args && args.domNode);
		this._children = [];
	}, {
		addChild: function(child) {
			this.domNode.appendChild(child.domNode);
			this._children.add(child);
			this.render();
		},

		removeChild: function(child) {
			this.domNode.removeChild(child.domNode);
			this._children.delete(child);
			this.render();
		},

		render: function() {
			this._children.forEach(function(child) {
				child.render && child.render();
			});
		}
	});
});