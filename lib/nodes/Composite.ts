import {Base} from './Base';
import {BlueshellState} from './BlueshellState';
import { ResultCode } from '../utils/resultCodes';

/**
 * Base class for all Composite Nodes (nodes which have children).
 * @author Joshua Chaitin-Pollak
 */
export class Composite<S extends BlueshellState, E> extends Base<S, E> {
	/**
	 * @constructor
	 * @param name
	 * @param _children Children Nodes.
	 * @param _latched
	 */
	constructor(name: string,
	            private _children: Base<S, E>[],
	            private _latched: boolean = false) {
		super(name);

		for (let child of this.children) {
			child.parent = this.name;
		}
	}

	/**
	 * Sets the parent of this Node, and all children Nodes.
	 * @override
	 */
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

	/**
	 * Invokes `handleChild` for each child.
	 * @override
	 * @param state
	 * @param event
	 */
	async onEvent(state: S, event: E): Promise<ResultCode> {
		let storage = this.getNodeStorage(state);

		let firstChild = 0;

		// Support for latched composites - ignored if not latched
		// wrapped for clarity - not programmatically necessary
		if (this.latched) {
			firstChild = storage.running !== undefined ? storage.running : 0;

			// Reset running
			storage.running = undefined;
		}

		return await this.handleChild(state, event, firstChild);
	}

	/**
	 * @abstract
	 * @param state
	 * @param event
	 * @param i
	 */
	handleChild(state: S, event: E, i: number): Promise<ResultCode> {
		throw new Error('This is an abstract method - please override.');
	}

	/**
	 * Resets Node Storage for this node and all children.
	 * @override
	 * @param state
	 */
	resetNodeStorage(state: S) {
		super.resetNodeStorage(state);

		for (let child of this.children) {
			child.resetNodeStorage(state);
		}
	}
}
