import { BoxType } from "./constants";

export class TrillGenerator {

    static generateTrill(nodes: any, edges: any, name: string){
    
        let trill = {
            dataflow: {
                nodes: [] as any,
                edges: [] as any,
                name: name
            }
        }

        for(const node of nodes){
            let trill_node: any = {};

            trill_node.id = node.data.nodeId;
            trill_node.type = node.type;
            trill_node.x = node.position.x;
            trill_node.y = node.position.y;

            if(node.data.code != undefined){
                trill_node.content = node.data.code;
            }

            if(node.data.output != undefined && node.data.output.code != ""){ // Only add if the output is not empty
                trill_node.output = {...node.data.output};
            } 

            if(node.data.out != undefined)
                trill_node.out = node.data.out;
            
            if(node.data.in != undefined)
                trill_node.in = node.data.in;

            if(node.data.goal != undefined)
                trill_node.goal = node.data.goal;

            if(node.data.keywords != undefined){
                if(trill_node.metadata == undefined)
                    trill_node.metadata = {};

                trill_node.metadata.keywords = node.data.keywords;
            }

            trill.dataflow.nodes.push(trill_node)
        }

        for(const edge of edges){
            let trill_edge: any = {};

            if(edge.type == "BIDIRECTIONAL_EDGE"){ // This is an interaction edge
                trill_edge.type = "Interaction"
            }

            trill_edge.id = edge.id;
            trill_edge.source = edge.source;
            trill_edge.target = edge.target;

            if(edge.data != undefined && edge.data.keywords != undefined){
                if(trill_edge.metadata == undefined)
                    trill_edge.metadata = {};

                trill_edge.metadata.keywords = edge.data.keywords;
            }

            trill.dataflow.edges.push(trill_edge);
        }

        return trill
    
    }

}
