/**
 * Created by josh on 1/10/16.
 */
import {BlueshellState} from './BlueshellState';
import {resultCodes as rc} from '../utils/resultCodes';

export class Base<S extends BlueshellState, E> {
	private _parent: string;

	constructor(public readonly name: string = '') {
		if (!this.name) {
			this.name = this.constructor.name;
		}

		this._parent = '';
	}

	handleEvent(state: S, event: E): string {

		this._beforeEvent(state, event)
		const passed = this.precondition(state, event);

		if (!passed) {
			return rc.FAILURE;
		}

		try {
			const result = this.onEvent(state, event);

			return this._afterEvent(result, state, event);
		}
		catch(err) {
			state.errorReason = err;

			if (this.getDebug(state)) {
				console.error('Error: ', err.stack); // eslint-disable-line no-console
			}

			return rc.ERROR;
		}
	}

	// Return nothing
	_beforeEvent(state: S, event: E) {

		let pStorage = this._privateStorage(state);
		let nodeStorage = this.getNodeStorage(state);

		// If this is the root node, increment the event counter
		if (!this._parent) {
			pStorage.eventCounter = ++pStorage.eventCounter || 1;
		}

		// Record the last event we've seen
		//console.log('%s: incrementing event counter %s, %s',
		//	this.path, nodeStorage.lastEventSeen,  pStorage.eventCounter);
		nodeStorage.lastEventSeen = pStorage.eventCounter;

		return {};
	}

	// Logging
	_afterEvent(res: string, state: S, event: E): string {

		if (this.getDebug(state)) {
			console.log(this.path, ' => ', event, ' => ', res);  // eslint-disable-line no-console
		}

		let storage = this.getNodeStorage(state);

		// Cache our results for the next iteration
		storage.lastResult = res;

		return res;
	}

	// Return true if we should proceed, false otherwise
	precondition(state: S, event: E): boolean {
		return true;
	}

	// Return results
	onEvent(state: S, event: E): string {

		return rc.SUCCESS;
	}

	set parent(path: string) {
		this._parent = path;
	}

	get path() {
		return (this._parent ? this._parent + '_' : '') + this.name;
	}

	/*
	 * Returns storage unique to this node, keyed on the node's path.
	 */
	public getNodeStorage(state: S) {
		let path = this.path;
		let blueshell = this._privateStorage(state);

		blueshell[path] = blueshell[path] || {};
		return blueshell[path];
	}

	resetNodeStorage(state: S) {
		let path = this.path;
		let blueshell = this._privateStorage(state);

		blueshell[path] = {};
		return blueshell[path];
	}

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

	getLastEventSeen(state: S) {
		return this.getNodeStorage(state).lastEventSeen;
	}

	getLastResult(state: S) {
		return this.getNodeStorage(state).lastResult;
	}
}
