import {BlueshellState} from './BlueshellState';
import {ParentNode} from './Parent';

/**
 * Checks if the passed in object exposes a list of children.
 * @param node Node to check
 */
export function isParentNode<S extends BlueshellState, E>(
	node: any
): node is ParentNode<S, E> {
	return !!node.getChildren;
}

