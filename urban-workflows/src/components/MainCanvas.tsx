import "reactflow/dist/style.css";
import React, { useMemo, useState, useEffect } from "react";
import ReactFlow, {
    Background,
    ConnectionMode,
    Controls,
    Edge,
    EdgeChange,
    NodeChange,
    XYPosition,
    useReactFlow,
} from "reactflow";

import { useFlowContext } from "../providers/FlowProvider";
import { ToolsMenu, LLMCommunication, UpMenu } from "./tools-menu";
import ComputationAnalysisBox from "./ComputationAnalysisBox";
import DataTransformationBox from "./DataTransformationBox";
import { BoxType, EdgeType } from "../constants";
import DataLoadingBox from "./DataLoadingBox";
import VegaBox from "./VegaBox";
import TextBox from "./TextBox";
import DataExportBox from "./DataExportBox";
import DataCleaningBox from "./DataCleaning";
import FlowSwitchBox from "./FlowSwitch";
import UtkBox from "./UtkBox";
import TableBox from "./TableBox";
import ImageBox from "./ImageBox";
import ConstantBox from "./ConstantBox";
import { UserMenu } from "./login/UserMenu";
import DataPoolBox from "./DataPoolBox";
import BiDirectionalEdge from "./edges/BiDirectionalEdge";
import MergeFlowBox from "./MergeFlowBox";
import { RightClickMenu } from "./styles";
import CommentsBox from "./CommentsBox";
import { useRightClickMenu } from "../hook/useRightClickMenu";
import { useCode } from "../hook/useCode";
import { useProvenanceContext } from "../providers/ProvenanceProvider";
import { buttonStyle } from "./styles";

import './MainCanvas.css';

export function MainCanvas() {
    const {
        nodes,
        edges,
        onNodesChange,
        onEdgesChange,
        onConnect,
        isValidConnection,
        onEdgesDelete,
        onNodesDelete,
    } = useFlowContext();

    const { onContextMenu, showMenu, menuPosition } = useRightClickMenu();
    const { createCodeNode } = useCode();
   
    let objectTypes: any = {};
    objectTypes[BoxType.COMPUTATION_ANALYSIS] = ComputationAnalysisBox;
    objectTypes[BoxType.DATA_TRANSFORMATION] = DataTransformationBox;
    objectTypes[BoxType.DATA_LOADING] = DataLoadingBox;
    objectTypes[BoxType.VIS_VEGA] = VegaBox;
    objectTypes[BoxType.VIS_TEXT] = TextBox;
    objectTypes[BoxType.DATA_EXPORT] = DataExportBox;
    objectTypes[BoxType.DATA_CLEANING] = DataCleaningBox;
    objectTypes[BoxType.FLOW_SWITCH] = FlowSwitchBox;
    objectTypes[BoxType.VIS_UTK] = UtkBox;
    objectTypes[BoxType.VIS_TABLE] = TableBox;
    objectTypes[BoxType.VIS_IMAGE] = ImageBox;
    objectTypes[BoxType.CONSTANTS] = ConstantBox;
    objectTypes[BoxType.DATA_POOL] = DataPoolBox;
    objectTypes[BoxType.MERGE_FLOW] = MergeFlowBox;

    const nodeTypes = useMemo(() => objectTypes, []);

    let objectEdgeTypes: any = {};
    objectEdgeTypes[EdgeType.BIDIRECTIONAL_EDGE] = BiDirectionalEdge;

    const edgeTypes = useMemo(() => objectEdgeTypes, []);

    const reactFlow = useReactFlow();
    const { setDashBoardMode, updatePositionWorkflow, updatePositionDashboard } = useFlowContext();

    const [selectedEdgeId, setSelectedEdgeId] = useState<string>(""); // can only remove selected edges
    
    const [dashboardOn, setDashboardOn] = useState<boolean>(false); 

    return (
        <div style={{ width: "100vw", height: "100vh" }} onContextMenu={onContextMenu}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={(changes: NodeChange[]) => {

                    let allowedChanges: NodeChange[] = [];

                    let edges = reactFlow.getEdges();

                    for (const change of changes) {
                        let allowed = true;

                        if(change.type == "remove"){
                            for (const edge of edges) {
                                if (edge.source == change.id || edge.target == change.id){
                                    alert("Connect boxes cannot be removed. Remove the edges first");
                                    allowed = false;
                                    break
                                }
                            }
                        }

                        if(change.type == "position" && change.position != undefined && change.position.x != undefined){
                            if(dashboardOn)
                                updatePositionDashboard(change.id, change);
                            else
                                updatePositionWorkflow(change.id, change);
                        }

                        if(allowed)
                            allowedChanges.push(change);
                    }

                    onNodesDelete(allowedChanges);
                    return onNodesChange(allowedChanges);
                }}
                onEdgesChange={(changes: EdgeChange[]) => {
                    let selected = "";
                    let allowedChanges = [];

                    for(const change of changes){
                        if(change.type == "select" && change.selected == true){
                            setSelectedEdgeId(change.id);
                            selected = change.id;
                        }else if(change.type == "select"){
                            setSelectedEdgeId("");
                            selected = "";
                        }
                    }

                    for(const change of changes){
                        if(change.type == "remove" && (selected == change.id || selectedEdgeId == change.id)){
                            allowedChanges.push(change);
                        }else if(change.type != "remove"){
                            allowedChanges.push(change);
                        }
                    }

                    return onEdgesChange(allowedChanges);
                }}
                onEdgesDelete={(edges: Edge[]) => {
                
                    console.log("edges", edges);

                    let allowedEdges: Edge[] = [];

                    for(const edge of edges){
                        if(selectedEdgeId == edge.id){
                            allowedEdges.push(edge);
                        }
                    }

                    return onEdgesDelete(allowedEdges);
                }}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                isValidConnection={isValidConnection}
                connectionMode={ConnectionMode.Loose}
                fitView
            >
                <UserMenu />
                <ToolsMenu />
                <LLMCommunication />
                <UpMenu 
                    setDashBoardMode={setDashBoardMode}
                    setDashboardOn={setDashboardOn}
                    dashboardOn={dashboardOn}
                />
                <RightClickMenu
                  showMenu={showMenu}
                  menuPosition={menuPosition}
                  options={[
                    {
                      name: "Add comment box",
                      action: () => createCodeNode("COMMENTS"),
                    },
                  ]}
                />
                <Background />
                <Controls />
            </ReactFlow>
        </div>
    );
}

