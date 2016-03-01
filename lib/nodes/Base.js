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

		return Promise.resolve(this.beforeEvent(state, event))
			.then(() => {
				return this.onEvent(state, event);
			})
			.catch(reason => {
				state.errorReason = reason;

				if (this.getDebug(state)) {
					console.log('Error: ', reason.stack);
				}

				return {
					result: 'ERROR',
					state
				};
			})
			.then(res => {
				return this.afterEvent(res, event);
			});
	}

	// Return nothing
	beforeEvent(state, event) {

		return {};
	}

	// Return results
	onEvent(state, event) {

		return {
			result: 'SUCCESS',
			state
		};
	}

	// Logging
	afterEvent(res, event) {

		if (this.getDebug(res.state)) {
			console.log(this.path, ' => ', event, ' => ', res.result);
		}

		let storage = this.getStorage(res.state);

		// Cache our results for the next iteration
		storage.lastResult = res.result;

		return res;
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
	getStorage(state) {
		let path = this.path;
		let blueshell = state.__blueshell = state.__blueshell || {};

		blueshell[path] = blueshell[path] || {};
		return blueshell[path];
	}

	getDebug(state) {
		let blueshell = state.__blueshell = state.__blueshell || {};

		return blueshell.debug;
	}

}

module.exports = Base;
