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
			.then(res => {
				return this.afterEvent(res, event);
			})
			.catch(err => {
				console.error(err, 'Something horrible has happened');
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
		console.log(this.path, ' => ', event, ' => ', res.result);

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

}

module.exports = Base;
