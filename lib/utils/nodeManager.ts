/* eslint-disable no-console */

import { EventEmitter } from 'events';
import { Session } from 'inspector';
import util from 'util';

import Websocket from 'ws';

import { RuntimeWrappers, Utils } from './nodeManagerHelper';
import {
	NodePathKey,
	ClassMethodNameKey,
	BreakpointInfo,
	NodeMethodsInfo,
} from './nodeManagerTypes';
import { BaseNode, BlueshellState, isParentNode } from '../models';

export class DuplicateNodeAdded extends Error {
	constructor(path: string) {
		super(`Key ${path} already exists! Cannot add new node.`);
	}
}

export class APIFunctionNotFound extends Error {
	constructor(apiFunction: string) {
		super(`Unknown request type: ${apiFunction}`);
	}
}

export interface INodeManager<S extends BlueshellState, E> {
	// Starts the server
	runServer(): void;
	// Shuts down the debug server
	shutdown(): Promise<void>;

	// adds a behavior tree node (and all its children) to be considered for debugging (setting/removing breakpoints)
	addNode(node: BaseNode<S, E>): void;

	// Removes a bt node (and all its children) to be considered for debugging (setting/removing breakpoints)
	removeNode(node: BaseNode<S, E>): void;

	// Given a node path, return the bt node we have cached for that path
	getNode(path: string): BaseNode<S, E> | undefined;
}

// Manages information about what nodes are available in the BT for debugging (nodes must be registered
// when they become available and unregistered when they are no longer available)
export class NodeManager<S extends BlueshellState, E>
	extends EventEmitter
	implements INodeManager<S, E>
{
	// maps node path to the bt node for that path
	private nodePathMap: Map<NodePathKey, BaseNode<S, E>> = new Map();
	// maps class/method to the breakpoint info for any breakpoints set on that class/method
	private breakpointInfoMap: Map<ClassMethodNameKey, BreakpointInfo> = new Map();
	// websocket server to communicate with the tool setting/removing breakpoints on bt nodes
	private server: Websocket.Server | undefined;
	// node inspection session
	private session = new Session();
	// singleton instance of the manager
	private static instance: NodeManager<BlueshellState, any> | null = null;

	private constructor() {
		super();
		(<any>global).breakpointMethods = new Map<string, Function>();
		this.session.connect();
	}

	// Runs the web socket server that listens for commands from a client to query/set/remove breakpoints
	public runServer() {
		this.session.post('Debugger.enable', () => {});

		this.server = new Websocket.Server({
			host: 'localhost',
			port: 8990,
		});

		// should be empty but clear everything for good measure
		this.breakpointInfoMap.forEach(async (breakpointInfo, nodePathAndMethodName) => {
			try {
				await RuntimeWrappers.removeBreakpointFromFunction(this.session, breakpointInfo);
				this.breakpointInfoMap.delete(nodePathAndMethodName);
			} catch (err) {
				console.error('Failed to remove breakpoint', err);
			}
		});
		this.breakpointInfoMap.clear();
		(<any>global).breakpointMethods.clear();

		// setup the connection handler
		this.server.on('connection', (clientSocket) => {
			// send the current cached breakpoints to the client if the client reconnects
			this.breakpointInfoMap.forEach((breakpointInfo) => {
				breakpointInfo.breakpoints.forEach((breakpoint) => {
					clientSocket.send(
						JSON.stringify({
							request: 'placeBreakpoint',
							nodePath: breakpoint.nodePath,
							methodName: breakpointInfo.methodInfo.methodName,
							nodeName: breakpoint.nodeName,
							nodeParent: breakpoint.nodeParent,
							condition: breakpoint.condition,
							success: true,
						}),
					);
				});
			});

			clientSocket.on('message', async (data: string) => {
				try {
					const dataObj = JSON.parse(data);
					// message should always have a request and nodePath
					const request = dataObj.request;
					const nodePath = dataObj.nodePath;
					switch (request) {
						// client is requesting the methods for a given node path
						case 'getMethodsForNode': {
							let methodInfo: NodeMethodsInfo | undefined;
							let success = true;
							try {
								methodInfo = this.getMethodsForNode(nodePath);
							} catch {
								success = false;
							}

							clientSocket.send(
								JSON.stringify({
									request: 'getMethodsForNode',
									success,
									nodePath,
									...methodInfo,
								}),
							);

							break;
						}
						// client is requesting to add (or modify) a breakpoint for a given node path/method
						case 'placeBreakpoint': {
							const methodName = dataObj.methodName;
							const condition = dataObj.condition;

							const success = await this.setBreakpoint(nodePath, methodName, condition);
							const node = this.nodePathMap.get(nodePath);
							const nodeName = node?.name;
							const nodeParent = node?.parent;

							clientSocket.send(
								JSON.stringify({
									request: 'placeBreakpoint',
									nodePath: node?.path,
									methodName,
									nodeName,
									nodeParent,
									condition,
									success,
								}),
							);

							break;
						}
						// client is requesting to remove a breakpoint by node path and method name
						case 'removeBreakpoint': {
							const methodName = dataObj.methodName;
							const success = await this.removeBreakpoint(nodePath, methodName);
							const node = this.nodePathMap.get(nodePath);

							clientSocket.send(
								JSON.stringify({
									request: 'removeBreakpoint',
									nodePath: node?.path,
									methodName,
									success,
								}),
							);
							break;
						}
						default:
							clientSocket.send(
								JSON.stringify({
									request: dataObj.request,
									success: false,
									err: new APIFunctionNotFound(dataObj.request).message,
								}),
							);
					}
				} catch (e) {
					console.error('Got exception while handling message in NodeManager', e);
				}
			});
		});
	}

	// Returns the list of methods (and which class they are inherited from) for the
	// bt node specified by the nodePath.  Methods are sorted alphabetically
	private getMethodsForNode(nodePath: string): NodeMethodsInfo {
		if (!this.nodePathMap.has(nodePath)) {
			throw new Error(`Requesting methods for node path: ${nodePath} which does not exist`);
		} else {
			const node = this.nodePathMap.get(nodePath)!;
			const nodeName = node.name;
			const nodeParent = node.parent;
			const listOfMethods = Utils.getMethodInfoForObject(node);

			return {
				listOfMethods,
				nodeName,
				nodeParent,
			};
		}
	}

	// Uses the node inspector to set a breakpoint using the specified node and the details in breakpointInfo
	private async _setBreakpoint(key: string, node: BaseNode<S, E>, breakpointInfo: BreakpointInfo) {
		const nodeName = node.name;
		let propertyName = breakpointInfo.methodInfo.methodName;
		// special case getters/setters
		const getOrSetMatch = propertyName.match(/^(get|set) (.+)$/);
		if (!!getOrSetMatch) {
			propertyName = getOrSetMatch[2];
		}

		// find the class in the inheritance chain which contains the method or property
		while (node && !Object.getOwnPropertyDescriptor(node, propertyName)) {
			node = Object.getPrototypeOf(node);
		}
		// if we climbed to the top of the inheritance chain and still can't find the method or property, return failure
		if (!node || !Object.getOwnPropertyDescriptor(node, propertyName)) {
			throw new Error(`Could not find method ${propertyName} in inheritance chain for ${nodeName}`);
		}

		// special case getters/setters
		if (!!getOrSetMatch) {
			const getOrSet = getOrSetMatch[1];
			const methodPropertyDescriptor = Object.getOwnPropertyDescriptor(node, propertyName);
			if (!methodPropertyDescriptor) {
				throw new Error(
					`Could not find method property descriptor for ${breakpointInfo.methodInfo.methodName} ` +
						`in ${breakpointInfo.methodInfo.className}`,
				);
			}
			if (getOrSet === 'get') {
				if (!methodPropertyDescriptor.get) {
					throw new Error(
						`get is undefined for ${propertyName} in ${breakpointInfo.methodInfo.className}`,
					);
				}
				(<any>global).breakpointMethods.set(key, methodPropertyDescriptor.get.bind(node));
			} else {
				// getOrSet === 'set'
				if (!methodPropertyDescriptor.set) {
					throw new Error(
						`set is undefined for ${propertyName} in ${breakpointInfo.methodInfo.className}`,
					);
				}
				(<any>global).breakpointMethods.set(key, methodPropertyDescriptor.set.bind(node));
			}
		} else {
			// not a getter/setter function
			(<any>global).breakpointMethods.set(
				key,
				(<any>node)[breakpointInfo.methodInfo.methodName].bind(node),
			);
		}

		const objectId = await RuntimeWrappers.getObjectIdFromRuntimeEvaluate(this.session, key);
		const functionObjectId = await RuntimeWrappers.getFunctionObjectIdFromRuntimeProperties(
			this.session,
			objectId,
		);

		// build up the condition for each node that has a breakpoint at this class/method
		const condition = Utils.createConditionString(Array.from(breakpointInfo.breakpoints.values()));

		await RuntimeWrappers.setBreakpointOnFunctionCall(
			this.session,
			functionObjectId,
			condition,
			breakpointInfo,
		);
	}

	// Returns the NodeMethodInfo for the method in the specified node
	private getNodeMethodInfo(node: BaseNode<S, E>, methodName: string) {
		return this.getMethodsForNode(node.path).listOfMethods.find(
			(method) => method.methodName === methodName,
		);
	}

	// Sets a breakpoint on the specified method for the specified node with an optional additional condition.
	// If there's already a breakpoint for the class/method, then it removes that breakpoint before calling
	// _setBreakpoint which will create the breakpoint with the new details provided as input here
	private async setBreakpoint(nodePath: string, methodName: string, breakpointCondition: string) {
		const debugString = `${nodePath}::${methodName}`;
		if (!this.nodePathMap.has(nodePath)) {
			console.error(
				`NodeManager - set breakpoint - Attempting to set breakpoint for ${debugString} ` +
					`but node does not exist`,
			);
			return false;
		} else {
			const node = this.nodePathMap.get(nodePath)!;
			const className = this.getNodeMethodInfo(node, methodName)?.className;
			if (!className) {
				console.error(
					`NodeManager - set breakpoint - Attempting to set breakpoint for ${debugString} ` +
						`but method does not exist`,
				);
				return false;
			} else {
				const key = `${className}::${methodName}`;
				let breakpointInfo = this.breakpointInfoMap.get(key);
				let first = false;
				if (!breakpointInfo) {
					// initialize breakpoint info if this is the first time we have a breakpoint for the class/method
					breakpointInfo = {
						methodInfo: { className, methodName },
						breakpoints: new Map(),
					};
					first = true;
				}
				const bp = breakpointInfo.breakpoints.get(nodePath);
				if (!bp || bp.condition !== breakpointCondition) {
					// either breakpoint on this node doesn't exist or the condition has changed, so proceed
					breakpointInfo!.breakpoints.set(nodePath, {
						nodePath,
						condition: breakpointCondition,
						nodeName: node.name,
						nodeParent: node.parent,
					});
					try {
						if (!first) {
							// breakpoint exists for this class/method, need to remove it and then re-create it
							await RuntimeWrappers.removeBreakpointFromFunction(this.session, breakpointInfo);
							await this._setBreakpoint(key, node, breakpointInfo!);
						} else {
							// breakpoint doesn't exist, so just create it
							await this._setBreakpoint(key, node, breakpointInfo!);
							this.breakpointInfoMap.set(key, breakpointInfo!);
						}
						return true;
					} catch (err) {
						console.error('Got error setting breakpoint', err);
						return false;
					}
				} else {
					console.error(`NodeManager - set breakpoint - breakpoint already exists: ${key}`);
					return false;
				}
			}
		}
	}

	// Remove the breakpoint for the given node/method.  This will handle if there are other
	// breakpoints set for the same method on the same class the node is inheriting the method from
	private async removeBreakpoint(nodePath: string, methodName: string) {
		const node = this.nodePathMap.get(nodePath);
		if (!node) {
			console.error(`NodeManager - remove breakpoint - node does not exist ${nodePath}`);
			return false;
		}
		const methodInfo = this.getNodeMethodInfo(node, methodName);
		if (!methodInfo) {
			console.error(
				`NodeManager - remove breakpoint - method ${methodName} does not exist on node ${nodePath}`,
			);
			return false;
		}
		const key = `${methodInfo.className}::${methodInfo.methodName}`;
		const keyAndPath = `${key}/${nodePath}`;
		const breakpointInfo = this.breakpointInfoMap.get(key);

		if (breakpointInfo) {
			const breakpointData = breakpointInfo.breakpoints.get(nodePath);
			if (breakpointData) {
				try {
					await RuntimeWrappers.removeBreakpointFromFunction(this.session, breakpointInfo);
					breakpointInfo.breakpoints.delete(nodePath);
					if (breakpointInfo.breakpoints.size === 0) {
						// this was the only breakpoint set for the key
						this.breakpointInfoMap.delete(key);
						(<any>global).breakpointMethods.delete(key);
					} else {
						await this._setBreakpoint(
							key,
							this.nodePathMap.get([...breakpointInfo.breakpoints][0][1].nodePath)!,
							breakpointInfo,
						);
					}
					return true;
				} catch (err) {
					console.error('Got error removing breakpoint', err);
					return false;
				}
			} else {
				console.error(
					`NodeManager - remove breakpoint - did not find breakpoint for path: ${keyAndPath}`,
				);
				return false;
			}
		} else {
			console.error(
				`NodeManager - remove breakpoint - did not find breakpoint id at all: ${keyAndPath}`,
			);
			(<any>global).breakpointMethods.delete(key);
			return false;
		}
	}

	// Returns the singleton instance
	public static getInstance<S extends BlueshellState, E>(): INodeManager<S, E> {
		if (!this.instance) {
			this.instance = new NodeManager();
		}
		return this.instance;
	}
	public static reset() {
		this.instance = null;
	}

	// Adds a bt node (and all its children) to be considered for debugging (setting/removing breakpoints)
	public addNode(node: BaseNode<S, E>) {
		const path = node.path;
		if (this.nodePathMap.has(path)) {
			throw new DuplicateNodeAdded(path);
		} else {
			this.nodePathMap.set(path, node);
		}
		if (isParentNode(node)) {
			node.getChildren().forEach((child) => {
				this.addNode(child);
			});
		}
	}

	// Removes a bt node (and all its children) to be considered for debugging (setting/removing breakpoints)
	public removeNode(node: BaseNode<S, E>) {
		if (isParentNode(node)) {
			node.getChildren().forEach((child) => {
				this.removeNode(child);
			});
		}
		this.nodePathMap.delete(node.path);
	}

	// Given a node path, return the bt node we have cached for that path
	public getNode(path: string): BaseNode<S, E> | undefined {
		return this.nodePathMap.get(path);
	}

	// Shuts down the debug server
	public async shutdown() {
		if (this.server) {
			await util.promisify(this.server.close.bind(this.server));
		}
	}
}
