import {Parent, setEventCounter} from './Parent';
import {BlueshellState, ResultCode, resultCodes, BaseNode} from '../models';

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
	            private _children: BaseNode<S, E>[],
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
	protected _beforeEvent(state: S, event: E) {
		const res = super._beforeEvent(state, event);
		const nodeStorage = this.getNodeStorage(state);
		const pStorage = this._privateStorage(state);
		const running = (nodeStorage.running !== undefined) ? nodeStorage.running : -1;
		this.getChildren().forEach((child, i) => {
			if (i < running) {
				// set event counter for each child before our latch point so they are registered
				// as participating in this event (using the previous results)
				setEventCounter(pStorage, state, child);
			}	// else do nothing with the running node or nodes after latch point
		});
		return res;
	}

	/**
	 * Logging
	 * @ignore
	 * @param res
	 * @param state
	 * @param event
	 */
	protected _afterEvent(res: ResultCode, state: S, event: E): ResultCode {
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
	protected onEvent(state: S, event: E): ResultCode {
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
	protected abstract handleChild(state: S, event: E, i: number): ResultCode;
}
