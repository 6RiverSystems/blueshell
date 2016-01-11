'use strict';

var Base = require('./Base');

class Decorator extends Base {

	constructor(name, child, transform) {
		super(name);

		this.child = child;
		this.transform = transform;
	}

	handleEvent(state, event) {
		console.log(`${this.name} called with event`, event);

		return this.transform(
			this.child(state, event)
		);
	}
}

module.exports = Decorator;
