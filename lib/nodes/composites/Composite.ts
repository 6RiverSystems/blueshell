'use strict';

import {ResultCodes} from '../../utils/ResultCodes';
import {Base} from '../Base';

export class Composite<State> extends Base<State> {

	children: Array<Base<State>>;

	latched: boolean;

	constructor(name: string, children: Array<Base<State>>, latched = false) {
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

	onRun(state: State): Promise<ResultCodes> {

		let storage = this.getNodeStorage(state);

		let firstChild = 0;

		if (this.shouldLatch(state)) {
			firstChild = storage.running !== undefined ? storage.running : 0;
		}

		// Reset running
		storage.running = undefined;

		return this.runChild(state, firstChild);
	}

	protected runChild(state: State, i: number): Promise<ResultCodes> {
		throw new Error('This is an abstract method - please override.');
	}

	shouldLatch(state: State) {
		return this.latched;
	}

	resetNodeStorage(state: State) {
		super.resetNodeStorage(state);

		for (let child of this.children) {
			child.resetNodeStorage(state);
		}
	}

}
