import {BlueshellState} from './BlueshellState';
import {ParentNode} from './Parent';
import {PrivateNodeStorage, BaseNode} from './BaseNode';

/**
 * Checks if the passed in object exposes a list of children.
 * @param node Node to check
 */
export function isParentNode<S extends BlueshellState, E>(
	node: any
): node is ParentNode<S, E> {
	return !!node.getChildren;
}

/**
 * Sets the event counter of the nocde and any child nodes to indicate
 * the node has been visited for this event
 * @param pStorage Private node storage containing current eventCounter
 * @param state The state holding the node storage
 * @param node The node to set
 */
export function setEventCounter<S extends BlueshellState, E>(
	pStorage: PrivateNodeStorage,
	state: S,
	node: BaseNode<S, E>
) {
	const nodeStorage = node.getNodeStorage(state);
	if (nodeStorage.lastEventSeen !== undefined) {
		nodeStorage.lastEventSeen = pStorage.eventCounter;
		if (isParentNode(node)) {
			node.getChildren().forEach((child) => {
				setEventCounter(pStorage, state, child);
			});
		}
	}
}

/**
 * Clears the last event seen property of node and all of node's children
 * @param node The node to clear
 * @param state The state holding the node storage
 */
export function clearChildEventSeen<S extends BlueshellState, E>(node: BaseNode<S, E>, state: S) {
	if (isParentNode(node)) {
		node.getChildren().forEach((child: any) => {
			clearChildEventSeen(child, state);
		});
	}
	const nodeStorage = node.getNodeStorage(state);
	nodeStorage.lastEventSeen = undefined;
}
