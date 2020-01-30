import {BlueshellState} from './BlueshellState';
import {ResultCode} from '../utils/resultCodes';

/**
 * Interface that defines what is stored in private node storage at the root
 */
export interface PrivateNodeStorage {
	debug: boolean;
	eventCounter: number|undefined;
}

/**
 * Interface that defines what is stored in node storage for a particular node
 * Note: a node is free to store additional properties by casting this as an any.
 */
export interface NodeStorage {
	lastEventSeen: number|undefined;
	lastResult: string|undefined;
	running: number|undefined;
}

/**
 * Base interface for all Nodes
 */
export interface BaseNode<S extends BlueshellState, E> {
	parent: string;
	path: string;
	symbol: string;

	getLastEventSeen(state: S): number|undefined;
	getLastResult(state: S): string|undefined;
	getNodeStorage(state: S): NodeStorage;
	_privateStorage(state: S): PrivateNodeStorage;
	handleEvent(state: S, event: E): ResultCode;
}
