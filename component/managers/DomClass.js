define([
	'ksf/utils/constructor',
	'collections/shim-array'
], function(
	ctr
) {
	return ctr(function DomClassManager(args) {
		this.registry = args.registry;
		this.styler = args.styler;
		this.componentId = args.componentId;

		this._styleList = [];
		this._onHandlers = [
			this.registry.on('added', function(cmp) {
				if (cmp.key === this.componentId) {
					this._component = cmp.value;
					this._styleList.forEach(this._apply.bind(this));
				}
			}.bind(this)),
			this.registry.on('removed', function(cmp) {
				if (cmp.key === this.componentId) {
					this._styleList.forEach(this._unapply.bind(this));
					this._component = undefined;
				}
			}.bind(this))
		];
	}, {
		get: function() {
			return this._styleList;
		},

		set: function(styles) {
			// remove previous styles
			this._styleList.forEach(this.remove.bind(this));

			// apply new styles
			styles.forEach(this.add.bind(this));
		},

		_apply: function(style) {
			this.styler.add(this._component, style);
		},

		_unapply: function(style) {
			this.styler.remove(this._component, style);
		},

		add: function(style) {
			this._styleList.add(style);
			if (this._component) {
				this._apply(style);
			}
		},

		remove: function(style) {
			if (this._styleList.delete(style) && this._component) {
				this._unapply(style);
			}
		},

		destroy: function() {
			this._onHandlers.forEach(function(handler) {
				handler.remove();
			});
		}
	});
});