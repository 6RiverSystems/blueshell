/**
 * Created by josh on 1/18/16.
 */
'use strict';

let rc = require('./../utils/ResultCodes');
let Composite = require('./Composite');

class Selector extends Composite {

	// Recursively sends the event to each child until one of them returns
	// success or running. If we exhaust all the children, return failure.
	handleChild(state, event, i) {

		let storage = this.getNodeStorage(state);

		// If we finished all processing without success return failure.
		if (i >= this.children.length) {
			return Promise.resolve(rc.FAILURE);
		}

		let child = this.children[i];

		return child.handleEvent(state, event)
		.then(res => this._afterChild(res, state, event))
		.then(([res, state_, event_]) => {
			if (res !== rc.FAILURE) {

				if (this.latched && res === rc.RUNNING) {
					storage.running = i;
				}

				return res;
			} else {
				return this.handleChild(state_, event_, ++i);
			}
		});
	}

	_afterChild(res, state, event) {
		return [res, state, event];
	}

}

module.exports = Selector;
