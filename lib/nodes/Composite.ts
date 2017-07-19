'use strict';

import {ResultCodes} from '../utils/ResultCodes';
import {Event} from '../data/Event';
import {Action} from './Action';

export class Composite<State> extends Action<State> {

	latched: boolean;

	constructor(name: string, children: Array<Action<State>>, latched = false) {
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

	onEvent(state: State, event: Event): Promise<ResultCodes> {

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

	handleChild(state: State, event: Event, i: number): Promise<ResultCodes> {
		throw new Error('This is an abstract method - please override.');
	}

	resetNodeStorage(state: State) {
		super.resetNodeStorage(state);

		for (let child of this.children) {
			child.resetNodeStorage(state);
		}
	}

}
