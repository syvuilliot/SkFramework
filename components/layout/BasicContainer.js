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
		this.setContent([]);
	}, {
		setContent: function(children) {
			this._children = [];
			this.domNode.innerHTML = '';
			children.forEach(function(childAndOptions) {
				this.addChild(childAndOptions[0], childAndOptions[1]);
			}.bind(this));
			this.render();
		},

		addChild: function(child) {
			this.domNode.appendChild(child.domNode || child);
			this._children.add(child);
		},

		removeChild: function(child) {
			this.domNode.removeChild(child.domNode || child);
			this._children.delete(child);
		},

		render: function() {
			this._children.forEach(function(child) {
				child.render && child.render();
			});
		}
	});
});