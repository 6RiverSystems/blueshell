'use strict';

import {ResultCodes} from '../../utils/ResultCodes';

export class Action<State> {

	name: string;
	_parent: string;

	constructor(name?: string) {
		this.name = name || this.constructor.name;
		this._parent = '';
	}

	handleEvent(state: State): Promise<ResultCodes> {
		return Promise.resolve(this._beforeEvent(state))
		.then(() => this.precondition(state))
			.then((passed) => {
				if (!passed) {
					return ResultCodes.FAILURE;
				}

				return this.onEvent(state);
			})
		.catch(err => {
			(<any>state).errorReason = err;

			if (this.getDebug(state)) {
				console.error('Error: ', err.stack); // eslint-disable-line no-console
			}

			return ResultCodes.ERROR;
		})
		.then(res => {
			return this._afterEvent(res, state);
		});
	}

	// Return nothing
	private _beforeEvent(state: State) {

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
	private _afterEvent(res: any, state: State) {

		if (this.getDebug(state)) {
			console.log(this.path, ' => ', ' => ', res);  // eslint-disable-line no-console
		}

		let storage = this.getNodeStorage(state);

		// Cache our results for the next iteration
		storage.lastResult = res;

		if (res !== ResultCodes.RUNNING) {
			this.deactivate(state);
		}

		return res;
	}

	// Return true if we should proceed, false otherwise
	precondition(state: State) {
		return true;
	}

	// Return results
	onEvent(state: State): Promise<ResultCodes> {
		return Promise.resolve(ResultCodes.SUCCESS);
	}

	deactivate(state: State) {
		//no-op
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
	getNodeStorage(state: State) {
		let path = this.path;
		let blueshell = this._privateStorage(state);

		blueshell[path] = blueshell[path] || {};
		return blueshell[path];
	}

	resetNodeStorage(state: State) {
		let path = this.path;
		let blueshell = this._privateStorage(state);

		blueshell[path] = {};
		return blueshell[path];
	}

	private _privateStorage(state: State) {
		let mutableState = (<any>state);

		mutableState.__blueshell = mutableState.__blueshell || {};

		return (<any>state).__blueshell;
	}

	getDebug(state: State) {
		return this._privateStorage(state).debug;
	}

	getTreeEventCounter(state: State) {
		return this._privateStorage(state).eventCounter;
	}

	getLastEventSeen(state: State) {
		return this.getNodeStorage(state).lastEventSeen;
	}

	getLastResult(state: State) {
		return this.getNodeStorage(state).lastResult;
	}
}
