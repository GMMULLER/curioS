import { useCallback } from "react";
import { Node } from "reactflow";
import { v4 as uuid } from "uuid";

import { IInteraction, IOutput, useFlowContext } from "../providers/FlowProvider";
import { PythonInterpreter } from "../PythonInterpreter";
import { usePosition } from "./usePosition";
import { Template } from "../providers/TemplateProvider";
import { AccessLevelType, BoxType } from "../constants";

const pythonInterpreter = new PythonInterpreter();

type CreateCodeNodeOptions = {
    nodeId?: string;
    code?: string;
    description?: string;
    templateId?: string;
    templateName?: string;
    accessLevel?: AccessLevelType;
    customTemplate?: boolean;
    position?: { x: number; y: number };
    suggestion?: boolean;
    goal?: string;
    inType?: string;
    out?: string;
    keywords?: number[];
};

interface IUseCode {
    createCodeNode: (boxType: string, options?: CreateCodeNodeOptions) => void;
    loadTrill: (trill: any, loadAsSuggestions?: boolean) => void;
}

export function useCode(): IUseCode {
    const { addNode, setOutputs, setInteractions, applyNewPropagation, applyNewOutput, loadParsedTrill } = useFlowContext();
    const { getPosition } = usePosition();

    const outputCallback = useCallback(
        (nodeId: string, output: string) => {
            applyNewOutput({nodeId: nodeId, output: output});
        },
        [setOutputs]
    );

    const interactionsCallback = useCallback((interactions: any, nodeId: string) => {
        setInteractions((prevInteractions: IInteraction[]) => {
            let newInteractions: IInteraction[] = [];
            let newNode = true;

            for(const interaction of prevInteractions){
                if(interaction.nodeId == nodeId){
                    newInteractions.push({nodeId: nodeId, details: interactions, priority: 1});
                    newNode = false;
                }else{
                    newInteractions.push({...interaction, priority: 0});
                }
            }

            if(newNode)
                newInteractions.push({nodeId: nodeId, details: interactions, priority: 1});

            return newInteractions;
        })
    }, [setInteractions]);

    const loadTrill = (trill: any, loadAsSuggestions?: boolean) => {

        let nodes = [];
        let edges = [];

        for(const node of trill.dataflow.nodes){
            let x = node.x;
            let y = node.y;

            if(x == undefined || y == undefined){
                let position = getPosition();
                x = position.x + 800;
                y = position.y;
            }

            let nodeMeta: any = {
                nodeId: node.id, 
                code: node.content, 
                position: {x: x, y: y}
            }

            if(node.goal != undefined)
                nodeMeta.goal = node.goal;

            if(node.in != undefined)
                nodeMeta.inType = node.in;

            if(node.out != undefined)
                nodeMeta.out = node.out;

            if(node.metadata != undefined && node.metadata.keywords != undefined)
                nodeMeta.keywords = node.metadata.keywords;

            if(loadAsSuggestions)
                nodeMeta.suggestion = true;

            nodes.push(generateCodeNode(node.type, nodeMeta));

        }

        for(const edge of trill.dataflow.edges){

            let add_edge: any = {
                id: edge.id,
                markerEnd: {type: "arrow"},
                source: edge.source,
                sourceHandle: "out",
                target: edge.target,
                targetHandle: "in"
            }

            if(loadAsSuggestions){
                add_edge.data = {}
                add_edge.data.suggestion = true;
            }

            if(edge.type == "Interaction"){
                add_edge.markerStart = {type: "arrow"};
                add_edge.sourceHandle = "in/out";
                add_edge.targetHandle = "in/out";
                add_edge.type = "BIDIRECTIONAL_EDGE";
            }

            edges.push(add_edge);
        }

        loadParsedTrill(trill.dataflow.name, nodes, edges, !loadAsSuggestions, loadAsSuggestions); // if loading as suggestion deactivate provenance and merge
    }

    const generateCodeNode = useCallback((boxType: string, options: CreateCodeNodeOptions = {}) => {
        const {
            nodeId = uuid(),
            code = undefined,
            description = undefined,
            templateId = undefined,
            templateName = undefined,
            accessLevel = undefined,
            customTemplate = undefined,
            position = getPosition(),
            suggestion = false,
            goal = "",
            inType = "DEFAULT",
            out = "DEFAULT",
            keywords = []
        } = options;

        const node: Node = {
            id: nodeId,
            type: boxType,
            position,
            data: {
                nodeId: nodeId,
                pythonInterpreter: pythonInterpreter,
                defaultCode: code,
                description,
                templateId,
                templateName,
                accessLevel,
                hidden: false,
                nodeType: boxType,
                customTemplate,
                suggestion,
                goal,
                in: inType,
                out,
                input: "",
                keywords,
                outputCallback,
                interactionsCallback,
                propagationCallback: applyNewPropagation,
            },
        };

        return node;

    }, [addNode, outputCallback, getPosition]);

    const createCodeNode = useCallback((boxType: string, options: CreateCodeNodeOptions = {}) => {
        let node = generateCodeNode(boxType, options);
        addNode(node, undefined, true);
    }, [addNode, outputCallback, getPosition]);

    return { createCodeNode, loadTrill };
}
