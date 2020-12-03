import { Base } from "../nodes/Base";
import { BlueshellState } from "../models";
import {Server} from 'ws';
import {Session, url, Debugger} from 'inspector';


(<any>Function.prototype).getUrl = function(){
    console.log('this function', this);
    return new Error().stack;
};

export class NodeManager {
    private nodePathMap: Map<string, Base<BlueshellState, any>> = new Map();
    private nodeIdMap: Map<string, Base<BlueshellState, any>> = new Map();
    // node id => { methodName => { originalMethod, breakpointMethod } }
    // private breakpointMethods: Map<string, Map<string, { originalMethod: Function, breakpointMethod: Function}>> = new Map();
    private breakpointIdMap: Map<string, Debugger.BreakpointId> = new Map();
    private server: Server;

    private session = new Session();

    private scriptIdMap: Map<string, Debugger.ScriptParsedEventDataType> = new Map();

    private static instance: NodeManager|null = null;
    private constructor() {

        (<any>global).breakpointMethods = new Map<string, Function>();

        this.session.connect();
        const debuggingUrl = url();

        this.session.post("Debugger.enable", (err: any, params: any)=>{
        });
        
        // this.session.on('Debugger.paused', ({ params }) => {
        //     console.log('debug params: ', params);
        //     console.log(params.hitBreakpoints);
        //     // debugger;
        // });
        
        // this.session.on('Debugger.scriptParsed', ({params})=>{
        //     if(params.url){
        //         console.log('script parsed params: ', params);
        //         this.scriptIdMap.set(params.url, params);
        //     }
        // });
            


        this.server = new Server({
            host: 'localhost',
            port: 10001,
        });
        this.server.on('connection', (clientSocket)=>{
            console.log('connected!!');

            this.breakpointIdMap.forEach((breakpointId, nodePathAndMethodName)=>{
                this.session.post('Debugger.removeBreakpoint', {
                    breakpointId: breakpointId
                }, ()=>{
                    this.breakpointIdMap.delete(nodePathAndMethodName);
                });
            });
            this.breakpointIdMap.clear();
            // (<any>global).breakpointMethods.forEach((method: Function, nodePath: string)=>{
                
            //     this.session.post('Debugger.removeBreakpoint', {
            //         breakpointId: breakpointId
            //     }, ()=>{
            //         this.breakpointIdMap.delete(nodePath);
            //     });
            // });
            // should be empty but good measure
            (<any>global).breakpointMethods.clear();

            clientSocket.on('message', (data: string)=>{

                const dataObj = JSON.parse(data);
                const request = dataObj.request;
                const nodeId = dataObj.nodeId;
                switch(request) {
                    case 'getMethodsForNode': {

                        let listOfMethods: string[] = this.getMethodsForNode(nodeId);

                        clientSocket.send(JSON.stringify({
                            request: 'getMethodsForNode',
                            nodeId: nodeId,
                            listOfMethods: listOfMethods
                        }));
                        
                        break;
                    }
                    case 'placeBreakpoint': {
                        const conditional = dataObj.conditional;
                        const methodName = dataObj.methodName;

                        this.setBreakpoint(nodeId, methodName, conditional, (success)=>{  
                            let node = this.nodeIdMap.get(nodeId);                      
                            clientSocket.send(JSON.stringify({
                                request: 'placeBreakpoint',
                                nodeId: nodeId,
                                nodePath: node!.path,
                                methodName: methodName,
                                success: success
                            }));  
                        });

                        break;
                    }
                    case 'removeBreakpoint': {
                        const methodName = dataObj.methodName;

                        this.removeBreakpoint(nodeId, methodName);

                        break;
                    }
                    default:
                        throw new Error(`Unknown request type: ${dataObj.request}`);
                }
                console.log(`got message: ${data}`);
            });
    
        });
           
    }

    private removeBreakpoint(nodeId: string, methodName: string) {
        let node = this.nodeIdMap.get(nodeId);
        const key = `${node!.path}::${methodName}`;
        const breakpointId = this.breakpointIdMap.get(key);

        if(breakpointId) {
            this.session.post('Debugger.removeBreakpoint', {
                breakpointId: breakpointId
            }, ()=>{
                this.breakpointIdMap.delete(key);
            });
        }
        (<any>global).breakpointMethods.delete(key);
    }

    private setBreakpoint(nodeId: string, methodName: string, condition: string, callback:(success:boolean)=>void) {
        if(!this.nodeIdMap.has(nodeId)) {
            throw new Error(`Attempting to set breakpoint on node ${nodeId} in method: ${methodName} but node does not exist.`);
        }
        else {
            let node = this.nodeIdMap.get(nodeId);

            // (<any>global).foo = (<any>node)[methodName].bind(node);
            const key = `${node!.path}::${methodName}`;
            if(!(<any>global).breakpointMethods.get(key)) {
                (<any>global).breakpointMethods.set(key, (<any>node)[methodName].bind(node));

                // this.session.post('Runtime.evaluate', { expression: `foo` }, (err, { result }) => {
                this.session.post('Runtime.evaluate', { expression: `global.breakpointMethods.get('${key}')` }, (err, { result }) => { 
                    if(err) {
                        console.error('Error in Runtime.evaluate', err);
                        callback(false);
                        return;
                    }
                    const objectId = result.objectId;

                    this.session.post('Runtime.getProperties', { objectId }, (err, result) => {
                        if(err) {
                            console.error('Error in Runtime.getProperties', err);
                            callback(false);
                            return;
                        }

                        const funcObjId = (<any>result).internalProperties[0].value.objectId;

                        this.session.post('Debugger.setBreakpointOnFunctionCall', {
                            objectId: funcObjId,
                            condition: `this.path === '${node!.path}'`
                        }, 
                        (err, result)=>{
                            if(err) {
                                console.error('Error in Debugger.setBreakpointOnFunctionCall', err);
                                callback(false);
                                return;
                            }
                            this.breakpointIdMap.set(key, result.breakpointId);
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

    private generateBreakpointMethod(node: Base<BlueshellState, any>, originalMethod: Function){
        return function(){
            debugger;
            originalMethod.bind(node, ...arguments)();
        }.bind(node);
    }

    private getMethodsForNode(nodeId: string): string[] {

        if(!this.nodeIdMap.has(nodeId)) {
            throw new Error(`Requesting methods for node ${nodeId} which does not exist`);
        }
        else {
            let node = this.nodeIdMap.get(nodeId);
            let setOfMethods: Set<string> = new Set();
            do {

                const methods = Object.getOwnPropertyNames(node);
                methods.forEach((method)=>{ 
                    // de-duplicate any inherited methods
                    if(!setOfMethods.has(method) && 
                        // node && 
                        // // only add methods
                        // typeof (<any>node)[method] === 'function'
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

    private getMethodType(node: Base<BlueshellState, any>, methodName: string) {
        try {
            return typeof (<any>node)[methodName] === 'function';
        }
        catch(ex){
            // if we catch an error, it's likely because we called a property and it threw
            // in which case it's a method and we should return false to reflect that
            return false;
        }
    }

    public static getInstance(): NodeManager {
        if(!this.instance) {
            this.instance = new NodeManager();
        }
        return this.instance;
    }

    public addNode(path: string, node: Base<BlueshellState, any>) {
        if(this.nodePathMap.has(path)) {
            throw new Error(`Key ${path} already exists! Cannot add new node.`);
        }
        else {
            this.nodePathMap.set(path, node);
            this.nodeIdMap.set(node.id, node);
        }
    }

    public removeNode(path: string) {
        this.nodePathMap.delete(path);
    }

    // public updateNode(path:string, node: Base<BlueshellState, any>) {
    //     this.nodePathMap.set(path, node);
    // }

    public getNode(path:string): Base<BlueshellState, any>|undefined {
        return this.nodePathMap.get(path);
    }
}