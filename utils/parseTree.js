define([
], function(
) {
	function isTree(item) {
		return Array.isArray(item) && item.length === 2 && Array.isArray(item[1]);
	}

	var parseTree = function(node, callback, parent) {
		if (isTree(node)) {
			callback(node[0], parent);
			node[1].forEach(function(child){
				parseTree(child, callback, node[0]);
			});
		} else {
			callback(node, parent);
		}
	};
	return parseTree;
});