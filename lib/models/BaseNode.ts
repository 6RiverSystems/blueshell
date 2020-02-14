import {BlueshellState, NodeStorage, ResultCode} from '../models';

/**
 * Base interface for all Nodes
 */
export interface BaseNode<S extends BlueshellState, E> {
	name: string;
	parent: string;
	path: string;
	symbol: string;

	handleEvent(state: S, event: E): ResultCode;
	getLastEventSeen(state: S): number|undefined;
	getTreeEventCounter(state: S): number|undefined;
	getLastResult(state: S): string|undefined;
	getNodeStorage(state: S): NodeStorage;
	resetNodeStorage(state: S): void;
}
