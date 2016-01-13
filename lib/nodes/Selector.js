/**
 * Created by josh on 1/10/16.
 */
'use strict';

var Composite = require('./Composite');

class Selector extends Composite {

	handleEvent(state, event) {

		let storage = this.getStorage(state);

		let runningChild = this.findRunningChild(storage.running);

		// if we are currently running a child, keep running it.
		if (runningChild) {
			let p = runningChild.handleEvent(state, event);

			return p.then(res => {
				if (res.result !== 'RUNNING') {
					storage.running = false;
				}

				return res;
			});

		} else {

			return this.loop(storage, state, event, 0);
		}
	}

	findRunningChild(running) {
		// if we are currently running a child, keep running it.
		if (running) {
			for (let child of this.children) {
				if (child.name === running) {
					return child;
				}
			}
		}

		return undefined;
	}

	// Recursively executes children until one of them returns
	// success or running. If we exhaust all the children, return failure.
	loop(storage, state, event, i) {

		// If we finished all processing without success return failure.
		if (i >= this.children.length) {
			return Promise.resolve({
				result: 'FAILURE',
				state
			});
		}

		let child = this.children[i];
		let p = child.handleEvent(state, event);

		return p.then(res => {
			if (res.result !== 'FAILURE') {
				console.log(child.name, ' processed ', event);

				if (res.result === 'RUNNING') {
					storage.running = child.name;
				}

				return res;
			} else {
				return this.loop(storage, state, event, ++i);
			}
		});
	}
}

module.exports = Selector;
