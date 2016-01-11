'use strict';

var Base = require('./Base');

class Composite extends Base {

	constructor(name, children) {
		super(name);

		console.log(`${name} constructed with ${children.length} children`);
		this.children = children;

		for (let child of this.children) {
			child.parent = this.path;
		}
	}
}

module.exports = Composite;
