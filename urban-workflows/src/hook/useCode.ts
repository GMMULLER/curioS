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
    suggestion?: boolean
};

interface IUseCode {
    createCodeNode: (boxType: string, options?: CreateCodeNodeOptions) => void;
    loadTrill: (trill: any, loadAsSuggestions?: boolean) => void;
}

export function useCode(): IUseCode {
    const { addNode, setOutputs, setInteractions, applyNewPropagation, applyNewOutput, loadParsedTrill, workflowNameRef } = useFlowContext();
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

            if(loadAsSuggestions)
                nodes.push(generateCodeNode(node.type, {nodeId: node.id, code: node.content, position: {x: x, y: y}, suggestion: true}));
            else
                nodes.push(generateCodeNode(node.type, {nodeId: node.id, code: node.content, position: {x: x, y: y}}));
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

            if(loadAsSuggestions)
                add_edge.suggestion = true;

            if(edge.type == "Interaction"){
                add_edge.markerStart = {type: "arrow"};
                add_edge.sourceHandle = "in/out";
                add_edge.targetHandle = "in/out";
                add_edge.type = "BIDIRECTIONAL_EDGE";
            }

            edges.push(add_edge);
        }

        loadParsedTrill(trill.dataflow.name, nodes, edges);
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
                input: "",
                outputCallback,
                interactionsCallback,
                propagationCallback: applyNewPropagation,
            },
        };

        return node;

    }, [addNode, outputCallback, getPosition]);

    const createCodeNode = useCallback((boxType: string, options: CreateCodeNodeOptions = {}) => {
        let node = generateCodeNode(boxType, options);
        addNode(node);
    }, [addNode, outputCallback, getPosition]);

    return { createCodeNode, loadTrill };
}
