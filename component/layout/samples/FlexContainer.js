define([
	'dojo/_base/declare',
	'collections/map',
	'./DomPlacer'
], function(
	declare,
	Map,
	DomPlacer
) {
	var FlexContainer = declare([], {
		constructor: function() {
			this._children = new Map();
			this._placer = new DomPlacer();

			this.root = document.createElement('div');
		},

		put: function(child, options) {
			this._children.add(options, child);
			this.layout();
		},
		
		set: function(child, options) {
			this._children.set(child, options);
			this.layout();
		},

		remove: function(child) {
			this._placer.remove(child, this.root);
			this._children.delete(child);
			this.layout();
		},

		layout: function() {
			var flexHeight = this.height,
				flexChild;
			// Process flex height
			this._children.items().forEach(function(item) {
				var child = item[0],
					attr = item[1];
				if (attr === 'flex') {
					flexChild = child;
				} else {
					flexHeight -= attr;
					this._placer.put(child, this.root, {
						background: '#CCC',
						height: attr + 'px'
					});
				}
			}.bind(this));
			this._placer.put(flexChild, this.root, {
				height: flexHeight + 'px',
				background: '#AFA'
			});
		}
	});

	Object.defineProperty(FlexContainer.prototype, 'height', {
		set: function(value) {
			this._height = value;
			this.layout();
		},
		get: function() {
			return this._height;
		}
	});
	return FlexContainer;
});