'use strict';

let Composite = require('./Composite');

class Decorator extends Composite {

	constructor(name, child) {
		super(name, [child]);
	}

	get child() {
		return this.children[0];
	}

	onEvent(state, event) {
		// Passthrough
		return this.child.handleEvent(state, event);
	}

}

module.exports = Decorator;
