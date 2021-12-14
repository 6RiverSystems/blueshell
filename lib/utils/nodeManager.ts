/* eslint-disable no-console */

import {BaseNode, BlueshellState, isParentNode} from '../models';
import {Server} from 'ws';
import {Session, Debugger} from 'inspector';

// Map key that is the path property of a bt node
type NodePathKey = string;
// Map key that is the class plus method name of a bt node method
type ClassMethodNameKey = string;

// the two parts of a ClassMethodNameKey - the className is the class the method comes from
// which might be a super class
interface NodeMethodInfo {
	className: string;
	methodName: string;
}

// the information about a breakpoint from one node on a particular class/method
interface BreakpointData {
	nodePath: string;
	condition?: string;
	nodeName?: string;
	nodeParent?: string;
}

// the information about a breakpoint set on a particular class/method (for 1 or more nodes)
interface BreakpointInfo {
	methodInfo: NodeMethodInfo,
	breakpointId?: Debugger.BreakpointId;
	breakpoints: Map<NodePathKey, BreakpointData>,
}

// the information for the methods available for a particuliar node as well as the node name and parent
interface NodeMethodsInfo {
	listOfMethods: NodeMethodInfo[];
	nodeName: string;
	nodeParent: string;
}

// Manages information about what nodes are available in the BT for debugging (nodes must be registered
// when they become available and unregistered when they are no longer available)
export class NodeManager<S extends BlueshellState, E> {
	// maps node path to the bt node for that path
	private nodePathMap: Map<NodePathKey, BaseNode<S, E>> = new Map();
	// maps class/method to the breakpoint info for any breakpoints set on that class/method
	private breakpointInfoMap: Map<ClassMethodNameKey, BreakpointInfo> = new Map();
	// websocket server to communicate with the tool setting/removing breakpoints on bt nodes
	private server: Server|undefined;
	// node inspection session
	private session = new Session();
	// singleton instance of the manager
	private static instance: NodeManager<BlueshellState, any>|null = null;

	private constructor() {
		(<any>global).breakpointMethods = new Map<string, Function>();
		this.session.connect();
	}

	// Runs the web socket server that listens for commands from a client to query/set/remove breakpoints
	public runServer() {
		this.session.post('Debugger.enable', () => {});

		if (process.env.NODE_ENV !== 'test') {
			this.server = new Server({
				host: 'localhost',
				port: 8990,
			});

			// should be empty but clear everything for good measure
			this.breakpointInfoMap.forEach((breakpointInfo, nodePathAndMethodName) => {
				this.session.post('Debugger.removeBreakpoint', {
					breakpointId: breakpointInfo.breakpointId,
				}, () => {
					this.breakpointInfoMap.delete(nodePathAndMethodName);
				});
			});
			this.breakpointInfoMap.clear();
			(<any>global).breakpointMethods.clear();

			// setup the connection handler
			this.server.on('connection', (clientSocket) => {
				// send the current cached breakpoints to the client if the client reconnects
				this.breakpointInfoMap.forEach((breakpointInfo) => {
					breakpointInfo.breakpoints.forEach((breakpoint) => {
						clientSocket.send(JSON.stringify({
							request: 'placeBreakpoint',
							nodePath: breakpoint.nodePath,
							methodName: breakpointInfo.methodInfo.methodName,
							nodeName: breakpoint.nodeName,
							nodeParent: breakpoint.nodeParent,
							condition: breakpoint.condition,
							success: true,
						}));
					});
				});

				clientSocket.on('message', (data: string) => {
					const dataObj = JSON.parse(data);
					// message should always have a request and nodePath
					const request = dataObj.request;
					const nodePath = dataObj.nodePath;
					switch (request) {
					// client is requesting the methods for a given node path
					case 'getMethodsForNode': {
						const methodInfo = this.getMethodsForNode(nodePath);

						clientSocket.send(JSON.stringify({
							request: 'getMethodsForNode',
							nodePath,
							...methodInfo,
						}));

						break;
					}
					// client is requesting to add (or modify) a breakpoint for a given node path/method
					case 'placeBreakpoint': {
						const methodName = dataObj.methodName;
						const condition = dataObj.condition;

						this.setBreakpoint(nodePath, methodName, condition, (success) => {
							const node = this.nodePathMap.get(nodePath);
							const nodeName = node?.name;
							const nodeParent = node?.parent;

							clientSocket.send(JSON.stringify({
								request: 'placeBreakpoint',
								nodePath: node?.path,
								methodName,
								nodeName,
								nodeParent,
								condition,
								success,
							}));
						});

						break;
					}
					// client is requesting to remove a breakpoint by node path and method name
					case 'removeBreakpoint': {
						const methodName = dataObj.methodName;
						this.removeBreakpoint(nodePath, methodName, (success) => {
							const node = this.nodePathMap.get(nodePath);
							const nodeName = node?.name;
							const nodeParent = node?.parent;
							clientSocket.send(JSON.stringify({
								request: 'removeBreakpoint',
								nodePath: node?.path,
								methodName,
								success,
							}));
						});

						break;
					}
					default:
						throw new Error(`Unknown request type: ${dataObj.request}`);
					}
				});
			});
		}
	}

	// Returns the list of methods (and which class they are inherited from) for the
	// bt node specified by the nodePath.  Methods are sorted alphabetically
	private getMethodsForNode(nodePath: string): NodeMethodsInfo {
		if (!this.nodePathMap.has(nodePath)) {
			throw new Error(`Requesting methods for node path: ${nodePath} which does not exist`);
		} else {
			let node = this.nodePathMap.get(nodePath)!;
			const nodeName = node.name;
			const nodeParent = node.parent;
			const setOfMethods: Set<string> = new Set();
			const methodsData: NodeMethodInfo[] = [];
			do {
				const methods = Object.getOwnPropertyNames(node).filter((prop) => {
					const nodePropDescriptor = Object.getOwnPropertyDescriptor(node, prop);
					// if the prop name is a getter or setter, if we simply just check that it's a function
					// that will end up invoking the getter or setter, which could lead to a crash
					if (nodePropDescriptor && (nodePropDescriptor.get || nodePropDescriptor.set)) {
						return true;
					}
					return typeof (node as any)[prop] === 'function';
				});
				const className = node.constructor.name;
				methods.forEach((methodName) => {
					// de-duplicate any inherited methods
					if (!setOfMethods.has(methodName)) {
						setOfMethods.add(methodName);
						methodsData.push({methodName, className});
					}
				});
				// climb up the inheritance tree until we get to Object
				node = Object.getPrototypeOf(node);
			} while (!!node && node.constructor.name !== 'Object');

			return {
				listOfMethods: methodsData.sort((a, b) => {
					if (a.methodName < b.methodName) {
						return -1;
					}
					if (a.methodName > b.methodName) {
						return 1;
					}
					return 0;
				}),
				nodeName,
				nodeParent
			};
		}
	}

	// Uses the node inspector to set a breakpoint using the specified node and the details in breakpointInfo
	private _setBreakpoint(
		key: string,
		node: BaseNode<S, E>,
		breakpointInfo: BreakpointInfo,
		callback: (success: boolean) => void
	) {
		const nodeName = node.name;
		// find the class in the inheritance chain which contains the method or property
		while (node &&
				!Object.getOwnPropertyDescriptor(node, breakpointInfo.methodInfo.methodName)) {
			node = Object.getPrototypeOf(node);
		}
		// if we climbed to the top of the inheritance chain and still can't find the method or property, return failure
		if (!node || !Object.getOwnPropertyDescriptor(node, breakpointInfo.methodInfo.methodName)) {
			console.error(
				`Could not find method ${breakpointInfo.methodInfo.methodName} in inheritance chain for ${nodeName}`);
			callback(false);
			return;
		}

		const methodPropertyDescriptor = Object.getOwnPropertyDescriptor(node, breakpointInfo.methodInfo.methodName);
		// special case getters/setters
		if (methodPropertyDescriptor!.get) {
			(<any>global).breakpointMethods.set(key, methodPropertyDescriptor!.get.bind(node));
		} else if (methodPropertyDescriptor!.set) {
			(<any>global).breakpointMethods.set(key, methodPropertyDescriptor!.set.bind(node));
		} else {
			(<any>global).breakpointMethods.set(key, (<any>node)[breakpointInfo.methodInfo.methodName].bind(node));
		}

		this.session.post('Runtime.evaluate', {expression: `global.breakpointMethods.get('${key}')`},
			(err, {result}) => {
			 if (err) {
				 console.error(`NodeManager - set breakpoint - Error in Runtime.evaluate for: ${key}`, err);
				 callback(false);
				 return;
			 }
			 console.log(`NodeManager - set breakpoint - got result from Runtime.evaluate for: ${key}`);
			 const objectId = result.objectId;

			 this.session.post('Runtime.getProperties', {objectId}, (err, result) => {
				 if (err) {
					 console.error(`NodeManager - set breakpoint - Error in Runtime.getProperties for ${key}`, err);
					 callback(false);
					 return;
				 }
				 console.log(`NodeManager - set breakpoint - got result from Runtime.getProperties for: ${key}`);
				 const funcObjId = (<any>result).internalProperties[0].value.objectId;

				 // build up the condition for each node that has a breakpoint at this class/method
				 let condition = '';
				 let first = true;
				 [...breakpointInfo.breakpoints].forEach(([key, breakpointData]) => {
					 if (first) {
							first = false;
					 } else {
						 condition = condition + ' || ';
					 }
					 condition = condition +
						`(this.path === '${breakpointData.nodePath}'` +
						 (!!breakpointData.condition ? ` && ${breakpointData.condition}` : '')
						 + ')';
				 });

				 // do the magic!
				 this.session.post('Debugger.setBreakpointOnFunctionCall', {
					 objectId: funcObjId,
					 condition,
				 },
				 (err, result) => {
					 if (err) {
						 console.error(`NodeManager - set breakpoint - Error in \
							 Debugger.setBreakpointOnFunctionCall for: ${key}`, err);
						 callback(false);
						 return;
					 }
					 if (!result) {
						 console.error(`NodeManager - set breakpoint - Got no result in \
							 Debugger.setBreakpointOnFunctionCall for: ${key}`);
						 callback(false);
						 return;
					 }
					 console.log(`NodeManager - set breakpoint - breakpoint set successfully: ${key}`);
					 breakpointInfo.breakpointId = (result as any).breakpointId; // HACK: types are not defined
					 callback(true);
				 });
			 });
		 });
	}

	// Returns the NodeMethodInfo for the method in the specified node
	private getNodeMethodInfo(node: BaseNode<S, E>, methodName: string) {
		return this.getMethodsForNode(node.path).listOfMethods.find((method) => method.methodName === methodName);
	}

	// Sets a breakpoint on the specified method for the specified node with an optional additional condition.
	// If there's already a breakpoint for the class/method, then it removes that breakpoint before calling
	// _setBreakpoint which will create the breakpoint with the new details provided as input here
	private setBreakpoint(
		nodePath: string,
		methodName: string,
		breakpointCondition: string,
		callback: (success: boolean) => void
	) {
		const debugString = `${nodePath}::${methodName}`;
		if (!this.nodePathMap.has(nodePath)) {
			console.error(`NodeManager - set breakpoint - Attempting to set breakpoint for ${debugString}\
				but node does not exist.`);
			callback(false);
		} else {
			const node = this.nodePathMap.get(nodePath)!;
			const className = this.getNodeMethodInfo(node, methodName)?.className;
			if (!className) {
				console.error(`NodeManager - set breakpoint - Attempting to set breakpoint for ${debugString}\
					but method does not exist`);
			} else {
				const key = `${className}::${methodName}`;
				console.log(`NodeManager - set breakpoint: ${key}`);

				let breakpointInfo = this.breakpointInfoMap.get(key);
				let first = false;
				if (!breakpointInfo) {
					// initialize breakpoint info if this is the first time we have a breakpoint for the class/method
					breakpointInfo = {
						methodInfo: {className, methodName},
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
					if (!first) {
						// breakpoint exists for this class/method, need to remove it and then re-create it
						this.session.post('Debugger.removeBreakpoint', {
							breakpointId: breakpointInfo.breakpointId,
						}, (err: Error|null) => {
							if (err) {
								console.error(`NodeManager - remove breakpoint - error removing breakpoint for: ${key}`, err);
								callback(false);
							} else {
								console.log(`NodeManager - remove breakpoint - removed breakpoint successfully for: ${key}`);
								this._setBreakpoint(key, node, breakpointInfo!, (success) => {
									callback(success);
								});
							}
						});
					} else {
						// breakpoint doesn't exist, so just create it
						this._setBreakpoint(key, node, breakpointInfo!, (success) => {
							if (success) {
								this.breakpointInfoMap.set(key, breakpointInfo!);
							}
							callback(success);
						});
					}
				} else {
					console.error(`NodeManager - set breakpoint - breakpoint already exists: ${key}`);
					callback(false);
				}
			}
		}
	}

	// Remove the breakpoint for the given node/method.  This will handle if there are other
	// breakpoints set for the same method on the same class the node is inheriting the method from
	private removeBreakpoint(nodePath: string, methodName: string, callback: (success: boolean) => void) {
		const node = this.nodePathMap.get(nodePath);
		if (!node) {
			console.error(`NodeManager - remove breakpoint - node does not exist ${nodePath}`);
			callback(false);
			return;
		}
		const methodInfo = this.getNodeMethodInfo(node, methodName);
		if (!methodInfo) {
			console.error(`NodeManager - remove breakpoint - method ${methodName} does not exist on node ${nodePath}`);
			callback(false);
			return;
		}
		const key = `${methodInfo.className}::${methodInfo.methodName}`;
		const keyAndPath = `${key}/${nodePath}`;

		console.log(`NodeManager - remove breakpoint for: ${keyAndPath}`);
		const breakpointInfo = this.breakpointInfoMap.get(key);

		if (breakpointInfo) {
			const breakpointData = breakpointInfo.breakpoints.get(nodePath);
			if (breakpointData) {
				console.log(
					`NodeManager - remove breakpoint - found breakpoint id: ${breakpointInfo.breakpointId} for: ${keyAndPath}`);
				this.session.post('Debugger.removeBreakpoint', {
					breakpointId: breakpointInfo.breakpointId,
				}, (err: Error|null) => {
					if (err) {
						console.error(`NodeManager - remove breakpoint - error removing breakpoint for: ${keyAndPath}`, err);
						callback(false);
					} else {
						console.log(`NodeManager - remove breakpoint - removed breakpoint successfully for: ${keyAndPath}`);
						breakpointInfo.breakpoints.delete(nodePath);
						if (breakpointInfo.breakpoints.size === 0) {
							// this was the only breakpoint set for the key
							this.breakpointInfoMap.delete(key);
							(<any>global).breakpointMethods.delete(key);
						} else {
							this._setBreakpoint(
								key, this.nodePathMap.get([...breakpointInfo.breakpoints][0][1].nodePath)!, breakpointInfo, () => {});
						}
						callback(true);
					}
				});
			} else {
				console.log(`NodeManager - remove breakpoint - did not find breakpoint for path: ${keyAndPath}`);
				callback(false);
			}
		} else {
			console.log(`NodeManager - remove breakpoint - did not find breakpoint id at all: ${keyAndPath}`);
			callback(false);
			(<any>global).breakpointMethods.delete(key);
		}
	}

	// Returns the singleton instance
	public static getInstance<S extends BlueshellState, E>(): NodeManager<S, E> {
		if (!this.instance) {
			this.instance = new NodeManager();
		}
		return this.instance;
	}

	// Adds a bt node (and all its children) to be considered for debugging (setting/removing breakpoints)
	public addNode(node: BaseNode<S, E>) {
		const path = node.path;
		if (this.nodePathMap.has(path)) {
			throw new Error(`Key ${path} already exists! Cannot add new node.`);
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
	public getNode(path: string): BaseNode<S, E>|undefined {
		return this.nodePathMap.get(path);
	}

	// Shuts down the debug server
	public async shutdown() {
		return new Promise<void>((resolve, reject) => {
			if (this.server) {
				this.server.close((err) => {
					if (err) {
						reject(err);
					} else {
						resolve();
					}
				});
			} else {
				resolve();
			}
		});
	}
}
