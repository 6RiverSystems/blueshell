'use strict';

var Base = require('./Base');

class Composite extends Base {

	constructor(name, children, latched) {
		super(name);

		console.log(`${name} constructed with ${children.length} children`);
		this.children = children;
		this.latched = latched;

		for (let child of this.children) {
			child.parent = this.name;
		}
	}

	set parent(parent) {
		this._parent = parent;

		for (let child of this.children) {
			child.parent = parent + '.' + this.name;
		}
	}

	onEvent(state, event) {

		let storage = this.getNodeStorage(state);

		let firstChild = 0;

		// Support for latched composites - ignored if not latched
		// wrapped for clarity - not programmatically necessary
		if (this.latched) {
			firstChild = storage.running !== undefined ? storage.running : 0;

			// Reset running
			storage.running = undefined;
		}

		return this.handleChild(storage, state, event, firstChild);
	}

	handleChild(storage, state, event, i) {
		throw new Error('This is an abstract method - please override.');
	}

}

module.exports = Composite;
