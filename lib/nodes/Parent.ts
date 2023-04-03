import { Action, PrivateNodeStorage } from './Base';
import { BlueshellState, BaseNode, ParentNode, isParentNode } from '../models';

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
	node: BaseNode<S, E>,
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
export function clearEventSeenRecursive<S extends BlueshellState, E>(
	node: BaseNode<S, E>,
	state: S,
) {
	if (isParentNode(node)) {
		node.getChildren().forEach((child: any) => {
			clearEventSeenRecursive(child, state);
		});
	}
	const nodeStorage = node.getNodeStorage(state);
	nodeStorage.lastEventSeen = undefined;
}

/**
 * Base class for all nodes that expose a list of children.
 * Primarily used to support the visualization of the behavior tree
 * using dotTree or archyTree
 *
 * @author Mark Asdoorian
 */
export abstract class Parent<S extends BlueshellState, E>
	extends Action<S, E>
	implements ParentNode<S, E>
{
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
	public initChildren(children: BaseNode<S, E>[]) {
		for (const child of children) {
			child.parent = this.name;
		}
	}

	public abstract getChildren(): BaseNode<S, E>[];

	/**
	 * Sets the parent of this Node, and all children Nodes.
	 * @override
	 */
	public set parent(parent: string) {
		super.parent = parent;

		for (const child of this.getChildren()) {
			child.parent = this.path;
		}
	}

	public get parent() {
		return super.parent;
	}
}
