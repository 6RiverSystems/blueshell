import { Base } from "../nodes/Base";
import { BlueshellState } from "../models";
import { Server } from "http";

export class NodeIdMap {
    private nodeMap: Map<string, Base<BlueshellState, any>> = new Map();
    // private server: Server;

    private static instance: NodeIdMap|null = null;
    private constructor() {
        // this.server = new Server({
        //     host: 'localhost',
        //     port: 10002,
        // });
        // this.server.on('open', function open() {
        //     console.log('connected!!');
        // });
           
        // this.server.on('message', function incoming(data) {
        //     console.log(`got message: ${data}`);
        // });
    }

    public static getInstance(): NodeIdMap {
        if(!this.instance) {
            this.instance = new NodeIdMap();
        }
        return this.instance;
    }

    clearMap() {
        this.nodeMap.clear();
    }
    
    public addNode(id: string, node: Base<BlueshellState, any>) {
        if(this.nodeMap.has(id)) {
            throw new Error(`Key ${id} already exists! Cannot add new node.`);
        }
        else {
            this.nodeMap.set(id, node);
        }
    }

}