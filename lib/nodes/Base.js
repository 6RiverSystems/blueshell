/**
 * Created by josh on 1/10/16.
 */
'use strict';

class Base {

	constructor(name) {
		this.name = name || this.constructor.name;
		this._parent = '';
	}

	handleEvent(state, event) {

		return Promise.resolve(this._beforeEvent(state, event))
		.then(() => {
			return this.onEvent(state, event);
		})
		.catch(err => {
			state.errorReason = err;

			if (this.getDebug(state)) {
				console.log('Error: ', err.stack);
			}

			return {
				result: 'ERROR',
				state
			};
		})
		.then(res => {
			return this._afterEvent(res, event);
		});
	}

	// Return nothing
	_beforeEvent(state, event) {

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
	_afterEvent(res, event) {

		if (this.getDebug(res.state)) {
			console.log(this.path, ' => ', event, ' => ', res.result);
		}

		let storage = this.getNodeStorage(res.state);

		// Cache our results for the next iteration
		storage.lastResult = res.result;

		return res;
	}

	// Return results
	onEvent(state, event) {

		return {
			result: 'SUCCESS',
			state
		};
	}

	set parent(path) {
		this._parent = path;
	}

	get path() {
		return (this._parent ? this._parent + '.' : '') + this.name;
	}

	/*
	 * Returns storage unique to this node, keyed on the node's path.
	 */
	getNodeStorage(state) {
		let path = this.path;
		let blueshell = this._privateStorage(state);

		blueshell[path] = blueshell[path] || {};
		return blueshell[path];
	}

	resetNodeStorage(state) {
		let path = this.path;
		let blueshell = this._privateStorage(state);

		blueshell[path] = {};
		return blueshell[path];
	}

	_privateStorage(state) {
		state.__blueshell = state.__blueshell || {};

		return state.__blueshell;
	}

	getDebug(state) {
		return this._privateStorage(state).debug;
	}

	getTreeEventCounter(state) {
		return this._privateStorage(state).eventCounter;
	}

	getLastEventSeen(state) {
		return this.getNodeStorage(state).lastEventSeen;
	}

	getLastResult(state) {
		return this.getNodeStorage(state).lastResult;
	}
}

module.exports = Base;
