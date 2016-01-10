'use strict';

var Node = require('./Node');

class CompositeNode extends Node {

	constructor(name, children) {
		super(name);

		console.log(`${name} constructed with ${children.length} children`);
		this.children = children;
	}
}

module.exports = CompositeNode;
