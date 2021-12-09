import {BaseNode, BlueshellState, isParentNode} from '../models';
import {Server} from 'ws';
import {Session, Debugger} from 'inspector';

interface BreakpointInfo {
	breakpointId: Debugger.BreakpointId;
	methodName: string;
	nodePath: string;
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
						success: true,
					}));
				});

				clientSocket.on('message', (data: string) => {
					const dataObj = JSON.parse(data);
					const request = dataObj.request;
					const nodePath = dataObj.nodePath;
					switch (request) {
					case 'getMethodsForNode': {
						const listOfMethods: string[] = this.getMethodsForNode(nodePath);

						clientSocket.send(JSON.stringify({
							request: 'getMethodsForNode',
							nodePath,
							listOfMethods,
						}));

						break;
					}
					case 'placeBreakpoint': {
						const conditional = dataObj.conditional;
						const methodName = dataObj.methodName;

						this.setBreakpoint(nodePath, methodName, conditional, (success) => {
							const node = this.nodePathMap.get(nodePath);
							clientSocket.send(JSON.stringify({
								request: 'placeBreakpoint',
								nodePath: node!.path,
								methodName,
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
		const node = this.nodePathMap.get(nodePath);
		const key = `${node!.path}::${methodName}`;
		const breakpointId = this.breakpointInfoMap.get(key);

		if (breakpointId) {
			this.session.post('Debugger.removeBreakpoint', {
				breakpointId,
			}, () => {
				this.breakpointInfoMap.delete(key);
			});
		}
		(<any>global).breakpointMethods.delete(key);
	}

	private setBreakpoint(nodePath: string, methodName: string, condition: string, callback: (success: boolean) => void) {
		if (!this.nodePathMap.has(nodePath)) {
			console.error(`Attempting to set breakpoint on node ${nodePath}\
				in method: ${methodName} but node does not exist.`);
			callback(false);
		} else {
			const node = this.nodePathMap.get(nodePath);

			const key = `${node!.path}::${methodName}`;
			if (!(<any>global).breakpointMethods.get(key)) {
				(<any>global).breakpointMethods.set(key, (<any>node)[methodName].bind(node));

				this.session.post('Runtime.evaluate', {expression: `global.breakpointMethods.get('${key}')`},
				 (err, {result}) => {
						if (err) {
						/* eslint no-console: ["error", { allow: ["error"] }] */
							console.error('Error in Runtime.evaluate', err);
							callback(false);
							return;
						}
						const objectId = result.objectId;

						this.session.post('Runtime.getProperties', {objectId}, (err, result) => {
							if (err) {
							/* eslint no-console: ["error", { allow: ["error"] }] */
								console.error('Error in Runtime.getProperties', err);
								callback(false);
								return;
							}

							const funcObjId = (<any>result).internalProperties[0].value.objectId;

							this.session.post('Debugger.setBreakpointOnFunctionCall', {
								objectId: funcObjId,
								condition: `this.path === '${node!.path}'`,
							},
							(err, result) => {
								if (err) {
								/* eslint no-console: ["error", { allow: ["error"] }] */
									console.error('Error in Debugger.setBreakpointOnFunctionCall', err);
									callback(false);
									return;
								}
								if (!result) {
									console.error('Got no result in Debugger.setBreakpointOnFunctionCall');
									callback(false);
									return;
								}
								this.breakpointInfoMap.set(key, {
									breakpointId: (result as any).breakpointId, // HACK: types are not defined
									methodName,
									nodePath
								});	
								callback(true);
							});
						});
					});
			}

			// let methodMap = this.breakpointMethods.get(nodeId);
			// if(!methodMap){
			//     methodMap = new Map();
			//     this.breakpointMethods.set(nodeId, methodMap);
			// }

			// let methodObj = methodMap.get(methodName);
			// // if we haven't set a breakpoint on this method yet
			// if(!methodObj) {
			//     let originalMethod = (<any>node)[methodName];
			//     let breakpointMethod = this.generateBreakpointMethod(node!, originalMethod);
			//     methodObj = {
			//         originalMethod: originalMethod,
			//         breakpointMethod: breakpointMethod
			//     };

			//     // assign the reference on the object to the breakpoint method
			//     (<any>node)[methodName] = breakpointMethod;
			// }
			// // if we've already set a breakpoint in this node's method, just update the breakpointMethod reference
			// else {
			//     let breakpointMethod = this.generateBreakpointMethod(node!, methodObj.originalMethod);
			//     methodObj.breakpointMethod = breakpointMethod;

			//     // assign the reference on the object to the breakpoint method
			//     (<any>node)[methodName] = breakpointMethod;
			// }
		}
	}

	private getMethodsForNode(nodePath: string): string[] {
		if (!this.nodePathMap.has(nodePath)) {
			throw new Error(`Requesting methods for node path: ${nodePath} which does not exist`);
		} else {
			let node = this.nodePathMap.get(nodePath);
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

			return Array.from(setOfMethods);
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
