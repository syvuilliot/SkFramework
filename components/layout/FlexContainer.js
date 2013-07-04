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
		this._config = [];

		this._vertical = !args || args.orientation != 'horizontal';
		this.bounds = args && args.bounds || {};
	}, {
		setContent: function(children) {
			this._config = [];
			this.domNode.innerHTML = "";
			children.forEach(function(childAndOptions) {
				this.addChild(childAndOptions[0], childAndOptions[1]);
			}.bind(this));
			this.render();
		},

		addChild: function(child, options) {
			this.domNode.appendChild(child.domNode);
			this._config.add([child, options]);
		},

		removeChild: function(child, options) {
			this.domNode.removeChild(child.domNode);
			var found;
			if (this._config.some(function(childAndOptions) {
				found = childAndOptions;
				return childAndOptions[0] == child;
			})) {
				this._config.delete(found);
			}
		},

		render: function() {
			DomNode.prototype.render.apply(this, arguments);

			var fixedDim = 0;
			var flexChildren = [];

			this._config.forEach(function(childAndOptions) {
				var child = childAndOptions[0],
					options = childAndOptions[1];
				child.domNode.style.display = this._vertical ? 'block' : 'inline-block';
				child.domNode.style.verticalAlign = 'top';
				child.domNode.style.boxSizing = 'border-box';
				child.domNode.style.MozBoxSizing = 'border-box';

				if (options && options.flex) {
					flexChildren.add(childAndOptions);
				} else {
					var preferredSize = child.preferredSize();
					var childHeight = preferredSize.height;
					var childWidth = preferredSize.width;
					fixedDim += this._vertical ? childHeight : childWidth;
					if (this._vertical) {
						child.bounds = {
							width: this.bounds.width,
							height: childHeight
						};
					} else {
						child.bounds = {
							height: this.bounds.height,
							width: childWidth
						};
					}
					child.render && child.render();
				}
			}.bind(this));

			var flexDim = ((this._vertical ? this.domNode.clientHeight : this.domNode.clientWidth) - fixedDim) / flexChildren.length;

			flexChildren.forEach(function(childAndOptions) {
				var child = childAndOptions[0],
					options = childAndOptions[1];
				if (this._vertical) {
					child.bounds = {
						height: flexDim,
						width: options && !(options.width == 'auto') && this.bounds.width
					};
				} else {
					child.bounds = {
						height: options && !(options.height == 'auto') && this.bounds.height,
						width: flexDim
					};
				}
				child.render && child.render();
			}.bind(this));
		}
	});
});