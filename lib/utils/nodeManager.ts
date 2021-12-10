/* eslint-disable no-console */

import {BaseNode, BlueshellState, isParentNode} from '../models';
import {Server} from 'ws';
import {Session, Debugger} from 'inspector';

interface BreakpointInfo {
	breakpointId: Debugger.BreakpointId;
	methodName: string;
	nodePath: string;
	nodeName?: string;
	nodeParent?: string;
}

interface NodeMethodInfo {
	listOfMethods: string[],
	nodeName: string,
	nodeParent: string,
}

export class NodeManager<S extends BlueshellState, E> {
	private nodePathMap: Map<string, BaseNode<S, E>> = new Map();
	// private nodeIdMap: Map<string, BaseNode<S, E>> = new Map();

	private breakpointInfoMap: Map<string, BreakpointInfo> = new Map();
	private server: Server|undefined;

	private session = new Session();

	private static instance: NodeManager<BlueshellState, any>|null = null;
	private constructor() {
		(<any>global).breakpointMethods = new Map<string, Function>();

		this.session.connect();
	}

	public runServer() {
		this.session.post('Debugger.enable', () => {
		});


		if (process.env.NO_SERVER !== 'true') {
			this.server = new Server({
				host: 'localhost',
				port: 10001,
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

			this.server.on('connection', (clientSocket) => {
				// send the current cached breakpoints to the client

				this.breakpointInfoMap.forEach((breakpointInfo) => {
					clientSocket.send(JSON.stringify({
						request: 'placeBreakpoint',
						nodePath: breakpointInfo.nodePath,
						methodName: breakpointInfo.methodName,
						nodeName: breakpointInfo.nodeName,
						nodeParent: breakpointInfo.nodeParent,
						success: true,
					}));
				});

				clientSocket.on('message', (data: string) => {
					const dataObj = JSON.parse(data);
					const request = dataObj.request;
					const nodePath = dataObj.nodePath;
					switch (request) {
					case 'getMethodsForNode': {
						const methodInfo = this.getMethodsForNode(nodePath);

						clientSocket.send(JSON.stringify({
							request: 'getMethodsForNode',
							nodePath,
							...methodInfo,
						}));

						break;
					}
					case 'placeBreakpoint': {
						const conditional = dataObj.conditional;
						const methodName = dataObj.methodName;

						this.setBreakpoint(nodePath, methodName, conditional, (success) => {
							const node = this.nodePathMap.get(nodePath);
							const nodeName = node?.name;
							const nodeParent = node?.parent;
							clientSocket.send(JSON.stringify({
								request: 'placeBreakpoint',
								nodePath: node?.path,
								methodName,
								nodeName,
								nodeParent,
								success,
							}));
						});

						break;
					}
					case 'removeBreakpoint': {
						const methodName = dataObj.methodName;

						this.removeBreakpoint(nodePath, methodName);

						break;
					}
					default:
						throw new Error(`Unknown request type: ${dataObj.request}`);
					}
				});
			});
		}
	}

	private removeBreakpoint(nodePath: string, methodName: string) {
		const key = `${nodePath}::${methodName}`;

		console.log(`NodeManager - remove breakpoint for: ${key}`);
		const breakpointInfo = this.breakpointInfoMap.get(key);

		if (breakpointInfo) {
			console.log(`NodeManager - remove breakpoint - found breakpoint id: ${breakpointInfo.breakpointId} for: ${key}`);
			this.session.post('Debugger.removeBreakpoint', {
				breakpointId: breakpointInfo.breakpointId,
			}, (err: Error|null) => {
				if (err) {
					console.error(`NodeManager - remove breakpoint - error removing breakpoint for: ${key}`, err);
				} else {
					console.log(`NodeManager - remove breakpoint - removed breakpoint successfully for: ${key}`);
					this.breakpointInfoMap.delete(key);
					(<any>global).breakpointMethods.delete(key);
				}
			});
		} else {
			console.log(`NodeManager - remove breakpoint - did not find breakpoint id for: ${key}`);
			(<any>global).breakpointMethods.delete(key);
		}
	}

	private setBreakpoint(nodePath: string, methodName: string, condition: string, callback: (success: boolean) => void) {
		const key = `${nodePath}::${methodName}`;
		console.log(`NodeManager - set breakpoint: ${key}`);
		if (!this.nodePathMap.has(nodePath)) {
			console.error(`NodeManager - set breakpoint - Attempting to set breakpoint for ${key}\
				but node does not exist.`);
			callback(false);
		} else {
			const node = this.nodePathMap.get(nodePath);

			if (!(<any>global).breakpointMethods.get(key)) {
				(<any>global).breakpointMethods.set(key, (<any>node)[methodName].bind(node));

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

							this.session.post('Debugger.setBreakpointOnFunctionCall', {
								objectId: funcObjId,
								condition: `this.path === '${node!.path}' && ${condition}`,
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
								this.breakpointInfoMap.set(key, {
									breakpointId: (result as any).breakpointId, // HACK: types are not defined
									methodName,
									nodePath,
									nodeName: node?.name,
									nodeParent: node?.parent,
								});
								callback(true);
							});
						});
					});
			} else {
				console.error(`NodeManager - set breakpoint - breakpoint already exists: ${key}`);
			}
		}
	}

	private getMethodsForNode(nodePath: string): NodeMethodInfo {
		if (!this.nodePathMap.has(nodePath)) {
			throw new Error(`Requesting methods for node path: ${nodePath} which does not exist`);
		} else {
			let node = this.nodePathMap.get(nodePath)!;
			const nodeName = node.name;
			const nodeParent = node.parent;
			const setOfMethods: Set<string> = new Set();
			do {
				const methods = Object.getOwnPropertyNames(node);
				methods.forEach((method) => {
					// de-duplicate any inherited methods
					if (!setOfMethods.has(method) &&
						this.getMethodType(node!, method)
					) {
						setOfMethods.add(method);
					}
				});
				// climb up the inheritance tree
			} while (node = Object.getPrototypeOf(node));

			return {listOfMethods: Array.from(setOfMethods).sort(), nodeName, nodeParent};
		}
	}

	private getMethodType(node: BaseNode<S, E>, methodName: string) {
		try {
			return typeof (<any>node)[methodName] === 'function';
		} catch (ex) {
			// if we catch an error, it's likely because we called a property and it threw
			// in which case it's a method and we should return false to reflect that
			return false;
		}
	}

	public static getInstance<S extends BlueshellState, E>(): NodeManager<S, E> {
		if (!this.instance) {
			this.instance = new NodeManager();
		}
		return this.instance;
	}

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

	public removeNode(node: BaseNode<S, E>) {
		if (isParentNode(node)) {
			node.getChildren().forEach((child) => {
				this.removeNode(child);
			});
		}
		this.nodePathMap.delete(node.path);
	}

	public getNode(path: string): BaseNode<S, E>|undefined {
		return this.nodePathMap.get(path);
	}

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
