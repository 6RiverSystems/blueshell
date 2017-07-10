'use strict';

import {Base} from './Base';
import {
	EventCode,
	BehaviorCode
} from '../utils/ResultCodes';

export class Composite extends Base {
	latched: boolean;

	constructor(name: string, children: Array<Base>, latched = false) {
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

	onEvent(state: any, event: any): Promise<EventCode> {
		return this.handleChildEvent(state, event, 0);
	}

	onRun(state: any): Promise<BehaviorCode> {
		let storage = this.getNodeStorage(state);

		let firstChild = 0;

		// Support for latched composites - ignored if not latched
		// wrapped for clarity - not programmatically necessary
		if (this.latched) {
			firstChild = storage.running !== undefined ? storage.running : 0;

			// Reset running
			storage.running = undefined;
		}

		return this.handleChildBehavior(state, firstChild);
	}

	handleChildEvent(state: any, event: any, i: number): Promise<EventCode> {
		// If we finished all processing without failure return success.
		if (i >= this.children.length) {
			return Promise.resolve(EventCode.CONTINUE);
		}

		let child = this.children[i];

		return child.handleEvent(state, event)
			.then((res: EventCode) => {
				if (res === EventCode.HANDLED) {
					return Promise.resolve(res);
				}
				else if (res === EventCode.CONTINUE) {
					// Call the next child
					return this.handleChildEvent(state, event, ++i);
				} else {
					return Promise.reject(res);
				}
			});
	}

	handleChildBehavior(state: any, i: number): Promise<BehaviorCode> {
		throw new Error('This is an abstract method - please override.');
	}

	resetNodeStorage(state: any) {
		super.resetNodeStorage(state);

		for (let child of this.children) {
			child.resetNodeStorage(state);
		}
	}
}
