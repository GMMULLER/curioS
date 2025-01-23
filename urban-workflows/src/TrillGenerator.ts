import { BoxType } from "./constants";

export class TrillGenerator {

    static generateTrill(nodes: any, edges: any){
    
        let node_type_translation = (nodeType: BoxType) => {
            switch(nodeType) {
                case BoxType.DATA_LOADING:
                    return "Data Loading"
                    break;
                case BoxType.DATA_EXPORT:
                    return "Data Export"
                    break;
                case BoxType.DATA_CLEANING:
                    return "Data Cleaning"
                    break;
                case BoxType.DATA_TRANSFORMATION:
                    return "Data Transformation"
                    break;
                case BoxType.COMPUTATION_ANALYSIS:
                    return "Computation Analysis"
                    break;
                case BoxType.VIS_VEGA:
                    return "Vega-Lite"
                    break;
                case BoxType.MERGE_FLOW:
                    return "Merge Flow"
                    break;
                default:
                    return ""
            }
        }

        let trill = {
            dataflow: {
                nodes: [] as any,
                edges: [] as any
            }
        }

        for(const node of nodes){
            let trill_node: any = {};

            trill_node.id = node.data.nodeId;
            trill_node.type = node_type_translation(node.type);

            if(node.data.code != undefined){
                trill_node.content = node.data.code;
            }

            trill.dataflow.nodes.push(trill_node)
        }

        for(const edge of edges){
            let trill_edge: any = {};

            if(edge.type == "BIDIRECTIONAL_EDGE"){ // This is an interaction edge
                trill_edge.type = "Interaction"
            }

            trill_edge.source = edge.source;
            trill_edge.target = edge.target;
        }

        
        return trill
    
    }

}
