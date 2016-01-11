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
			let res = runningChild.handleEvent(state, event);

			if (res.result !== 'RUNNING') {
				storage.running = false;
			}

			return res;
		} else {
			for (let child of this.children) {
				console.log(child.name, 'processing ', event);

				let res = child.handleEvent(state, event);

				if (res.result !== 'FAILURE') {
					console.log(child.name, ' processed ', event);

					if (res.result === 'RUNNING') {
						storage.running = child.name;
					}

					return res;
				}

			}
		}

		// If we finished all processing without success return failure.
		return {
			result: 'FAILURE',
			state
		};
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

		return;
	}
}

module.exports = Selector;
