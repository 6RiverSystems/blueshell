/**
 * Created by josh on 1/10/16.
 */
import {BlueshellState} from './BlueshellState';
import {resultCodes as rc, ResultCode} from '../utils/resultCodes';

/**
 * Base class of all Nodes.
 * @author Joshua Chaitin-Pollak
 */
export class Base<S extends BlueshellState, E> {
	private _parent: string;

	/**
	 * @constructor
	 * @param name The name of the Node. If no name is given, the name of the Class will be used.
	 */
	constructor(public readonly name: string = '') {
		if (!this.name) {
			this.name = this.constructor.name;
		}

		this._parent = '';
	}

	/**
	 * Handles the Event, and invokes `onEvent(state, event)`
	 * @param state The state when the event occured.
	 * @param event The event to handle.
	 * @protected
	 */
	handleEvent(state: S, event: E): ResultCode {
		this._beforeEvent(state, event);

		const passed = this.precondition(state, event);
		if (!passed) {
			return rc.FAILURE;
		}

		try {
			const result = this.onEvent(state, event);

			return this._afterEvent(result, state, event);
		} catch (err) {
			state.errorReason = err;

			if (this.getDebug(state)) {
				console.error('Error: ', err.stack); // eslint-disable-line no-console
			}

			return rc.ERROR;
		}
	}

	/**
	 * Return nothing
	 * @ignore
	 * @param state
	 * @param event
	 */
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	_beforeEvent(state: S, event: E) {
		const pStorage = this._privateStorage(state);
		const nodeStorage = this.getNodeStorage(state);

		// If this is the root node, increment the event counter
		if (!this._parent) {
			pStorage.eventCounter = ++pStorage.eventCounter || 1;
		}

		// Record the last event we've seen
		// console.log('%s: incrementing event counter %s, %s',
		//	this.path, nodeStorage.lastEventSeen,  pStorage.eventCounter);
		nodeStorage.lastEventSeen = pStorage.eventCounter;

		return {};
	}

	/**
	 * Logging
	 * @ignore
	 * @param res
	 * @param state
	 * @param event
	 */
	_afterEvent(res: ResultCode, state: S, event: E): ResultCode {
		if (this.getDebug(state)) {
			console.log(this.path, ' => ', event, ' => ', res); // eslint-disable-line no-console
		}

		const storage = this.getNodeStorage(state);

		// Cache our results for the next iteration
		storage.lastResult = res;

		return res;
	}

	/**
	 * Return true if this Node should proceed handling the event. false otherwise.
	 * @param state
	 * @param event
	 */
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	precondition(state: S, event: E): boolean {
		return true;
	}

	/**
	 * Invoked when there is a new event.
	 * @param state
	 * @param event
	 * @return Result. Must be rc.SUCCESS, rc.FAILURE, or rc.RUNNING
	 */
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	onEvent(state: S, event: E): ResultCode {
		return rc.SUCCESS;
	}

	set parent(path: string) {
		this._parent = path;
	}

	get path() {
		return (this._parent ? this._parent + '_' : '') + this.name;
	}

	/**
	 * Returns storage unique to this Node, keyed on the Node's path.
	 * @param state
	 */
	public getNodeStorage(state: S) {
		const path = this.path;
		const blueshell = this._privateStorage(state);

		blueshell[path] = blueshell[path] || {};
		return blueshell[path];
	}

	/**
	 * Resets the storage unique to this Node, via the Node's path.
	 * @param state
	 */
	resetNodeStorage(state: S) {
		const path = this.path;
		const blueshell = this._privateStorage(state);

		blueshell[path] = {};
		return blueshell[path];
	}

	/**
	 * @ignore
	 * @param state
	 */
	_privateStorage(state: S) {
		state.__blueshell = state.__blueshell || {};

		return state.__blueshell;
	}

	getDebug(state: S) {
		return this._privateStorage(state).debug;
	}

	getTreeEventCounter(state: S) {
		return this._privateStorage(state).eventCounter;
	}

	/**
	 * Getter for the previous event seen.
	 * @param state
	 */
	getLastEventSeen(state: S) {
		return this.getNodeStorage(state).lastEventSeen;
	}

	/**
	 * Getter for the result of the last handled Event.
	 * @param state
	 */
	getLastResult(state: S) {
		return this.getNodeStorage(state).lastResult;
	}

	get symbol(): string {
		return '';
	}
}
