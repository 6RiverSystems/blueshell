import {Base, BaseNode} from './Base';
import {BlueshellState} from './BlueshellState';

/**
 * Interface for a node that exposes a list of children.
 * Note: because you can't have an abstract getter/property, getChildren is just a normal method.
 */
export interface ParentNode<S extends BlueshellState, E> extends BaseNode<S, E> {
	getChildren(): Base<S, E>[];
}

/**
 * Base class for all nodes that expose a list of children.
 * Primarily used to support the visualization of the behavior tree
 * using dotTree or archyTree
 *
 * @author Mark Asdoorian
 */
export abstract class Parent<S extends BlueshellState, E> extends Base<S, E> implements ParentNode<S, E> {
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
	 * Note: this repeats code from set parent() because at construction time, this.children will not return
	 * anything (this isn't this yet), which is why we have to pass children in as a parameter
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
			child.parent = this.path;
		}
	}
}
