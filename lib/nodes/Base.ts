/**
 * Created by josh on 1/10/16.
 */
'use strict';

import {
	EventCode,
	BehaviorCode
} from '../utils/ResultCodes';

export class Base {

	children: Array<Base>;
	name: string;
	_parent: string;

	constructor(name?: string) {
		this.name = name || this.constructor.name;
		this._parent = '';
	}

	handleEvent(state: any, event: any): Promise<EventCode> {
		return Promise.resolve(this._beforeEvent(state, event))
			.then(() => {
				return this.onEvent(state, event);
			})
			.then((result: EventCode) => {
				if (!this._parent) {
					// Run the behavior tree now that the events have been handled.
					return this.run(state)
						.then(() => Promise.resolve(EventCode.CONTINUE));
				} else {
					return result;
				}
			})
			.catch((err: Error) => {
				state.errorReason = err;

				if (this.getDebug(state)) {
					console.error('Error: ', err.stack); // eslint-disable-line no-console
				}

				return EventCode.ERROR;
			})
			.then((res: EventCode) => {
				return this._afterEvent(res, state, event);
			});
	}

	run(state: any): Promise<BehaviorCode> {
		return this.onRun(state);
	}

	// Return nothing
	private _beforeEvent(state: any, event: any) {

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
	private _afterEvent(res: any, state: any, event: any) {

		if (this.getDebug(state)) {
			console.log(this.path, ' => ', event, ' => ', res);  // eslint-disable-line no-console
		}

		let storage = this.getNodeStorage(state);

		// Cache our results for the next iteration
		storage.lastResult = res;

		return res;
	}

	// Handle the event and modify the state (mutate), and by default propogate the event to the next node
	onEvent(state: any, event: any): Promise<EventCode> {
		return Promise.resolve(EventCode.CONTINUE);
	}

	// Return the behavior state of the action
	onRun(state: any): Promise<BehaviorCode> {
		return Promise.resolve(BehaviorCode.SUCCESS);
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
	getNodeStorage(state: any) {
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
