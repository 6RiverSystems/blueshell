/**
 * Created by josh on 1/10/16.
 */
'use strict';

class Base {

	constructor(name) {
		this.name = name;
		this._parent = '';
	}

	handleEvent(state, event) {
		console.log(`${this.name} called with event`, event);

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
	getStorage(state) {
		let path = this.path;
		let blueshell = state.__blueshell = state.__blueshell || {};

		blueshell[path] = blueshell[path] || {};
		return blueshell[path];
	}

}

module.exports = Base;
