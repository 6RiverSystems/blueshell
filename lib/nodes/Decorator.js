'use strict';

var Composite = require('./Composite');

class Decorator extends Composite {

	constructor(name, child) {
		super(name, [child]);
	}

	get child() {
		return this.children[0];
	}

}

module.exports = Decorator;
