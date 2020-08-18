/**
 * Created by josh on 1/10/16.
 */
import {
	BlueshellState,
	NodeStorage,
	rc,
	ResultCode,
	BaseNode,
	isParentNode,
} from '../models';
import {TreePublisher, TreeNonPublisher} from '../utils';

/**
 * Interface that defines what is stored in private node storage at the root
 */
export interface PrivateNodeStorage {
	debug: boolean;
	eventCounter: number|undefined;
}

/**
 * Base class of all Nodes.
 * @author Joshua Chaitin-Pollak
 */
export class Base<S extends BlueshellState, E> implements BaseNode<S, E> {
	private _parent: string;

	// Hard to properly type this since the static can't
	// inherit the types from this generic class.  This static is
	// here because it's difficult to inject this functionality
	// into blueshell in the current form, but this is maybe
	// marginally better than a global
	static treePublisher: TreePublisher<any, any> = new TreeNonPublisher();

	public static registerTreePublisher<S extends BlueshellState, E>(publisher: TreePublisher<S, E>): void {
		Base.treePublisher = publisher;
	}

	/**
	 * @constructor
	 * @param name The name of the Node. If no name is given, the name of the Class will be used.
	 */
	constructor(public readonly name: string = '') {
		if (!this.name) {
			this.name = this.constructor.name;
		}

		this._parent = '';
	}

	/**
	 * Handles the Event, and invokes `onEvent(state, event)`
	 * @param state The state when the event occured.
	 * @param event The event to handle.
	 * @protected
	 */
	public handleEvent(state: S, event: E): ResultCode {
		state.nodePath = this.path;
		this._beforeEvent(state, event);

		const passed = this.precondition(state, event);
		if (!passed) {
			return rc.FAILURE;
		}

		try {
			Base.treePublisher.publishResult(state, event, false);
			const result = this.onEvent(state, event);
			return this._afterEvent(result, state, event);
		} catch (err) {
			state.errorReason = err;

			if (this.getDebug(state)) {
				console.error('Error: ', err.stack); // eslint-disable-line no-console
			}

			return rc.ERROR;
		}
	}

	/**
	 * Return an empty object
	 * @ignore
	 * @param state
	 * @param event
	 */
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	protected _beforeEvent(state: S, event: E) {
		const pStorage = this._privateStorage(state);
		const nodeStorage = this.getNodeStorage(state);

		// If this is the root node, increment the event counter
		if (!this._parent) {
			pStorage.eventCounter = ++pStorage.eventCounter || 1;
		}

		// Reset the lastResult unless it was previously RUNNING and we're not a parent
		if (nodeStorage.lastResult !== rc.RUNNING || isParentNode(this)) {
			nodeStorage.lastResult = '';
		}

		// Record the last event we've seen
		// console.log('%s: incrementing event counter %s, %s',
		//	this.path, nodeStorage.lastEventSeen,  pStorage.eventCounter);
		nodeStorage.lastEventSeen = pStorage.eventCounter;

		return {};
	}

	/**
	 * Logging
	 * @ignore
	 * @param res
	 * @param state
	 * @param event
	 */
	protected _afterEvent(res: ResultCode, state: S, event: E): ResultCode {
		if (this.getDebug(state)) {
			console.log(this.path, ' => ', event, ' => ', res); // eslint-disable-line no-console
		}

		const storage = this.getNodeStorage(state);

		// Cache our results for the next iteration
		storage.lastResult = res;

		return res;
	}

	/**
	 * Return true if this Node should proceed handling the event. false otherwise.
	 * @param state
	 * @param event
	 */
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	protected precondition(state: S, event: E): boolean {
		return true;
	}

	/**
	 * Invoked when there is a new event.
	 * @param state
	 * @param event
	 * @return Result. Must be rc.SUCCESS, rc.FAILURE, or rc.RUNNING
	 */
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	protected onEvent(state: S, event: E): ResultCode {
		return rc.SUCCESS;
	}

	public set parent(path: string) {
		this._parent = path;
	}

	public get path() {
		return (!!this._parent ? `${this._parent}_` : '') + this.name;
	}

	/**
	 * Returns storage unique to this Node, keyed on the Node's path.
	 * @param state
	 */
	public getNodeStorage(state: S): NodeStorage {
		const path = this.path;
		const blueshell = this._privateStorage(state);

		blueshell[path] = blueshell[path] || {};
		return blueshell[path];
	}

	/**
	 * Resets the storage unique to this Node, via the Node's path.
	 * If this node is a parent, then also reset all children.
	 * @param state
	 */
	public resetNodeStorage(state: S) {
		if (isParentNode(this)) {
			for (const child of this.getChildren()) {
				child.resetNodeStorage(state);
			}
		}
		const path = this.path;
		const blueshell = this._privateStorage(state);

		blueshell[path] = {};
		return blueshell[path];
	}

	/**
	 * @ignore
	 * @param state
	 */
	protected _privateStorage(state: S) {
		state.__blueshell = state.__blueshell || {};

		return state.__blueshell;
	}

	public getDebug(state: S) {
		return this._privateStorage(state).debug;
	}

	public getTreeEventCounter(state: S) {
		return this._privateStorage(state).eventCounter;
	}

	/**
	 * Getter for the previous event seen.
	 * @param state
	 */
	public getLastEventSeen(state: S) {
		return this.getNodeStorage(state).lastEventSeen;
	}

	/**
	 * Getter for the result of the last handled Event.
	 * @param state
	 */
	public getLastResult(state: S) {
		return this.getNodeStorage(state).lastResult;
	}

	public get symbol(): string {
		return '';
	}
}
