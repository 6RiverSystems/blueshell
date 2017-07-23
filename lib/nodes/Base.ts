'use strict';

import {ResultCodes} from '../utils/ResultCodes';

export class Base<State> {

	name: string;

	_parent: string;

	constructor(name?: string) {
		this.name = name || this.constructor.name;
		this._parent = '';
	}

	run(state: State): Promise<ResultCodes> {
		return Promise.resolve(this._beforeRun(state))
		.then(() => this.precondition(state))
			.then((passed) => {
				if (!passed) {
					return ResultCodes.FAILURE;
				}

				return this.onRun(state);
			})
		.catch(err => {
			(<any>state).errorReason = err;

			if (this.getDebug(state)) {
				console.error('Error: ', err.stack); // eslint-disable-line no-console
			}

			return ResultCodes.ERROR;
		})
		.then(res => {
			return this._afterRun(res, state);
		});
	}

	// Return nothing
	private _beforeRun(state: State) {

		let pStorage = this._privateStorage(state);

		// If this is the root node, increment the event counter
		if (!this._parent) {
			pStorage.runCounter = ++pStorage.runCounter || 1;
		}

		return {};
	}

	// Logging
	private _afterRun(res: any, state: State) {

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
	precondition(state: State): boolean {
		return true;
	}

	// Return results
	onRun(state: State): Promise<ResultCodes> {
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
		const path = this.path;
		const blueshell = this._privateStorage(state);

		blueshell[path] = blueshell[path] || {};
		return blueshell[path];
	}

	resetNodeStorage(state: State) {
		const path = this.path;
		const blueshell = this._privateStorage(state);

		blueshell[path] = {};
		return blueshell[path];
	}

	private _privateStorage(state: State) {
		const mutableState = state as any;

		mutableState.__blueshell = mutableState.__blueshell || {};

		return mutableState.__blueshell;
	}

	getDebug(state: State) {
		return this._privateStorage(state).debug;
	}

	getTreeEventCounter(state: State) {
		return this._privateStorage(state).runCounter;
	}

	getLastResult(state: State) {
		return this.getNodeStorage(state).lastResult;
	}
}
