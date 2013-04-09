define([
	'ksf/utils/constructor'
], function(
	ctr
) {
	return ctr(function StyleManager(args) {
		this._registry = args.registry;
		this.styler = args.styler;
		this._component = args.component;
	}, {
		set: function(style) {
			var cmp = this._registry.get(this._component);
			if (!cmp) { throw "Cannot style, unknown component"; }

			this._style && this.styler.remove(cmp, this._style);
			this.styler.add(cmp, style);
			this._style = style;
		}
	});
});