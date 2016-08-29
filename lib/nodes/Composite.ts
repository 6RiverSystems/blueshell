'use strict';

import Base = require('./Base');
import ResultCodes = require('../utils/ResultCodes');

class Composite extends Base {

	children: any[];
	latched: boolean;

	constructor(name: string, children: any[], latched: boolean) {
		super(name);

		// console.log(`${name} constructed with ${children.length} children`);
		this.children = children;
		this.latched = latched;

		for (let child of this.children) {
			child.parent = this.name;
		}
	}

	set parent(parent: string) {
		super.parent = parent;

		for (let child of this.children) {
			child.parent = parent + '_' + this.name;
		}
	}

	onEvent(state: any, event: any): Promise<ResultCodes> {

		let storage = this.getNodeStorage(state);

		let firstChild = 0;

		// Support for latched composites - ignored if not latched
		// wrapped for clarity - not programmatically necessary
		if (this.latched) {
			firstChild = storage.running !== undefined ? storage.running : 0;

			// Reset running
			storage.running = undefined;
		}

		return this.handleChild(state, event, firstChild);
	}

	handleChild(state: any, event: any, i: number): Promise<ResultCodes> {
		throw new Error('This is an abstract method - please override.');
	}

	resetNodeStorage(state: any) {
		super.resetNodeStorage(state);

		for (let child of this.children) {
			child.resetNodeStorage(state);
		}
	}

}

export = Composite;
