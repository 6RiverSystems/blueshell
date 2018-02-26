import {Base} from './Base';
import {BlueshellState} from './BlueshellState';

export class Composite<S extends BlueshellState, E> extends Base<S, E> {

	constructor(name: string,
	            private _children: Base<S, E>[],
	            private _latched: boolean = false) {
		super(name);

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

	get children() {
		return this._children;
	}

	get latched() {
		return this._latched;
	}

	onEvent(state: S, event: E): Promise<string> {

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

	handleChild(state: S, event: E, i: number): Promise<string> {
		throw new Error('This is an abstract method - please override.');
	}

	resetNodeStorage(state: S) {
		super.resetNodeStorage(state);

		for (let child of this.children) {
			child.resetNodeStorage(state);
		}
	}
}
