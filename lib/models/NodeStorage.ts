/**
 * Interface that defines what is stored in node storage for a particular node
 * Note: a node is free to store additional properties by casting this as an any.
 */
export interface NodeStorage {
	lastEventSeen: number | undefined;
	lastResult: string | undefined;
	running: number | undefined;
}
