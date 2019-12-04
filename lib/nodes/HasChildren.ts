import {Base, BaseNode} from './Base';
import {BlueshellState} from './BlueshellState';

/**
 * Interface for a node that exposes a list of children.
 * Note: because you can't have an abstract getter/property, getChildren is just a normal method.
 */
export interface HasChildrenNode<S extends BlueshellState, E> extends BaseNode<S, E> {
	getChildren(): Base<S, E>[];
}

/**
 * Checks if the passed in Node exposes a list of children.
 * @param node Node to check
 */
export function isHasChildrenNode<S extends BlueshellState, E>(
	node: BaseNode<S, E>
): node is HasChildrenNode<S, E> {
	return !!(<any>node).getChildren;
}

/**
 * Base class for all nodes that expose a list of children.
 * Primarily used to support the visualization of the behavior tree
 * using dotTree or archyTree
 *
 * @author Mark Asdoorian
 */
export abstract class HasChildren<S extends BlueshellState, E> extends Base<S, E> implements HasChildrenNode<S, E> {
	/**
	 * @constructor
	 * @param name
	 */
	constructor(name: string) {
		super(name);
	}

	/**
	 * Initializes the parent of our list of children.  Only required to be called if you know your children
	 * at construction time.  If your children are dynamic, then you are responsible for setting their parent
	 * properly when they are created.
	 * @param children list of children to init (can't call getChildren() yet because this is called from the constructor)
	 */
	initChildren(children: Base<S, E>[]) {
		for (const child of children) {
			child.parent = this.name;
		}
	}

	abstract getChildren(): Base<S, E>[];

	/**
	 * Sets the parent of this Node, and all children Nodes.
	 * @override
	 */
	set parent(parent: string) {
		super.parent = parent;

		for (const child of this.getChildren()) {
			child.parent = `${parent}_${this.name}`;
		}
	}

	/**
	 * Resets Node Storage for this node and all children.
	 * @override
	 * @param state
	 */
	resetNodeStorage(state: S) {
		super.resetNodeStorage(state);

		for (const child of this.getChildren()) {
			child.resetNodeStorage(state);
		}
	}
}
