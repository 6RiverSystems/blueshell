import {Base, PrivateNodeStorage} from './Base';
import {BlueshellState} from './BlueshellState';
import {ResultCode, resultCodes} from '../utils/resultCodes';
import {isParentNode, Parent} from './Parent';

function setEventCounter<S extends BlueshellState, E>(pStorage: PrivateNodeStorage, state: S, node: Base<S, E>) {
	const nodeStorage = node.getNodeStorage(state);
	if (nodeStorage.lastEventSeen !== undefined) {
		nodeStorage.lastEventSeen = pStorage.eventCounter;
		if (isParentNode(node)) {
			node.getChildren().forEach((child) => {
				setEventCounter(pStorage, state, child);
			});
		}
	}
}

/**
 * Base class for all Composite Nodes (nodes which have an array of children).
 * Includes support for latching and keeping track of running status.
 * @author Joshua Chaitin-Pollak
 */
export abstract class Composite<S extends BlueshellState, E> extends Parent<S, E> {
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
		this.initChildren(_children);
	}

	getChildren() {
		return this._children;
	}

	get latched() {
		return this._latched;
	}

	/**
	 * Return an empty object
	 * @ignore
	 * @param state
	 * @param event
	 */
	_beforeEvent(state: S, event: E) {
		const res = super._beforeEvent(state, event);
		const nodeStorage = this.getNodeStorage(state);
		const pStorage = this._privateStorage(state);
		const running = (nodeStorage.running !== undefined) ? nodeStorage.running : -1;
		this.getChildren().forEach((child, i) => {
			if (i < running) {
				// set event counter for each child before our latch point so they are registered
				// as participating in this event (using the previous results)
				setEventCounter(pStorage, state, child);
			} else if (i > running) {
				// clear the result from our children since this a new execution of this Composite
				// and this child is not latched
				const childStorage = child.getNodeStorage(state);
				childStorage.lastResult = '';
				childStorage.lastEventSeen = undefined;
			}	// else do nothing with the running node (@@@ will show as blue in btv instead of yellow)
		});
		// clear our last result since we're processing a new event
		nodeStorage.lastResult = '';
		return res;
	}

	/**
	 * Logging
	 * @ignore
	 * @param res
	 * @param state
	 * @param event
	 */
	_afterEvent(res: ResultCode, state: S, event: E): ResultCode {
		res = super._afterEvent(res, state, event);

		if (this.latched) {
			const storage = this.getNodeStorage(state);
			// clear latched status if the node is no longer running after processing the event
			if (storage.running !== undefined && res !== resultCodes.RUNNING) {
				storage.running = undefined;
			}
		}

		return res;
	}

	/**
	 * Invokes `handleChild` for each child.
	 * @override
	 * @param state
	 * @param event
	 */
	onEvent(state: S, event: E): ResultCode {
		const storage = this.getNodeStorage(state);

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

	/**
	 * @abstract
	 * @param state
	 * @param event
	 * @param i
	 */
	abstract handleChild(state: S, event: E, i: number): ResultCode;
}
