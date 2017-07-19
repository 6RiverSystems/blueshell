'use strict';

import {ResultCodes} from '../utils/ResultCodes';

export class Action {

	children: Array<Action>;
	name: string;
	_parent: string;

	constructor(name?: string) {
		this.name = name || name;
		this._parent = '';
	}

	handleEvent(state: any, event: any): Promise<ResultCodes> {
		return Promise.resolve(this._beforeEvent(state, event))
		.then(() => this.precondition(state, event))
			.then((passed) => {
				if (!passed) {
					return ResultCodes.FAILURE;
				}

				return this.onEvent(state, event);
			})
		.catch(err => {
			state.errorReason = err;

			if (this.getDebug(state)) {
				console.error('Error: ', err.stack); // eslint-disable-line no-console
			}

			return ResultCodes.ERROR;
		})
		.then(res => {
			return this._afterEvent(res, state, event);
		});
	}

	// Return nothing
	protected _beforeEvent(state: any, event: any) {

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
	protected _afterEvent(res: any, state: any, event: any) {

		if (this.getDebug(state)) {
			console.log(this.path, ' => ', event, ' => ', res);  // eslint-disable-line no-console
		}

		let storage = this.getNodeStorage(state);

		// Cache our results for the next iteration
		storage.lastResult = res;

		if (res !== ResultCodes.RUNNING) {
			this.deactivate(state, event);
		}

		return res;
	}

	// Return true if we should proceed, false otherwise
	precondition(state: any, event: any) {
		return true;
	}

	// Return results
	onEvent(state: any, event: any): Promise<ResultCodes> {
		return Promise.resolve(ResultCodes.SUCCESS);
	}

	deactivate(state: any, event: any) {
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
	protected getNodeStorage(state: any) {
		let path = this.path;
		let blueshell = this._privateStorage(state);

		blueshell[path] = blueshell[path] || {};
		return blueshell[path];
	}

	resetNodeStorage(state: any) {
		let path = this.path;
		let blueshell = this._privateStorage(state);

		blueshell[path] = {};
		return blueshell[path];
	}

	private _privateStorage(state: any) {
		state.__blueshell = state.__blueshell || {};

		return state.__blueshell;
	}

	getDebug(state: any) {
		return this._privateStorage(state).debug;
	}

	getTreeEventCounter(state: any) {
		return this._privateStorage(state).eventCounter;
	}

	getLastEventSeen(state: any) {
		return this.getNodeStorage(state).lastEventSeen;
	}

	getLastResult(state: any) {
		return this.getNodeStorage(state).lastResult;
	}
}
