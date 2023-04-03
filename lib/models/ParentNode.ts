import { BaseNode } from './BaseNode';
import { BlueshellState } from './BlueshellState';

/**
 * NOTE: this file is separate from Parent.ts so that Base can reference items from here
 * and not import Parent.  Since Parent must import Base, Base cannot import Parent as that would
 * setup a circular import, which isn't allowed.  See
 * https://stackoverflow.com/questions/43176006/typeerror-class-extends-value-undefined-is-not-a-function-or-null
 */

/**
 * Interface for a node that exposes a list of children.
 * Note: because you can't have an abstract getter/property, getChildren is just a normal method.
 */
export interface ParentNode<S extends BlueshellState, E> extends BaseNode<S, E> {
	getChildren(): BaseNode<S, E>[];
}

/**
 * Checks if the passed in object exposes a list of children.
 * @param node Node to check
 */
export function isParentNode<S extends BlueshellState, E>(node: any): node is ParentNode<S, E> {
	return !!node.getChildren;
}
