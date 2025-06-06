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
import { ToolsMenu, UpMenu } from "./tools-menu";
import ComputationAnalysisBox from "./ComputationAnalysisBox";
import DataTransformationBox from "./DataTransformationBox";
import { BoxType, EdgeType, LLMEvents, LLMEventStatus } from "../constants";
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
import { TrillGenerator } from "../TrillGenerator";
import { useLLMContext } from "../providers/LLMProvider";
import html2canvas from "html2canvas";

import './MainCanvas.css';
import FloatingBox from "./FloatingBox";
import { WorkflowGoal } from "./tools-menu/WorkflowGoal";
import LLMChat from "./LLMChat";
import UniDirectionalEdge from "./edges/UniDirectionalEdge";

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

    const [isDragging, setIsDragging] = useState(false);
    const [startPos, setStartPos] = useState<any>(null);
    const [boundingBox, setBoundingBox] = useState<any>(null);

    useEffect(() => {
        const handleMouseDown = (e: any) => {
            if (e.shiftKey && e.button === 0) {
                setStartPos({ x: e.clientX, y: e.clientY });
            setIsDragging(true);
            }
        };
        
        const handleMouseMove = (e: any) => {
            if (!isDragging || !startPos) return;
            const currentPos = { x: e.clientX, y: e.clientY };
            setBoundingBox({
                start_x: startPos.x,
                start_y: startPos.y,
                end_x: currentPos.x,
                end_y: startPos.y,
            });
        };
        
        const handleMouseUp = () => {
            setIsDragging(false);
        };

        document.addEventListener("mousedown", handleMouseDown);
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);

        return () => {
            document.removeEventListener("mousedown", handleMouseDown);
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isDragging, startPos, boundingBox]);

    const { onContextMenu, showMenu, menuPosition } = useRightClickMenu();
    const { createCodeNode } = useCode();
    const { openAIRequest, llmEvents, addNewEvent, setCurrentEventPipeline } = useLLMContext();
   
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
    objectEdgeTypes[EdgeType.UNIDIRECTIONAL_EDGE] = UniDirectionalEdge;

    const edgeTypes = useMemo(() => objectEdgeTypes, []);

    const reactFlow = useReactFlow();
    const { setDashBoardMode, updatePositionWorkflow, updatePositionDashboard, workflowNameRef, workflowGoal } = useFlowContext();

    const [selectedEdgeId, setSelectedEdgeId] = useState<string>(""); // can only remove selected edges
    
    const [dashboardOn, setDashboardOn] = useState<boolean>(false); 

    const [isComponentsSelected, setIsComponentsSelected] = useState<boolean>(false); 

    // Selecting boxes to generate explanation
    const [selectedComponents, setSelectedComponents] = useState<any>({});

    const [floatingBoxes, setFloatingBoxes] = useState<any>({});

    const captureScreenshot = async (): Promise<string | null> => {
        const screenshotTarget = document.getElementsByClassName("react-flow__renderer")[0] as HTMLElement;

        if (!screenshotTarget) return null;
    
        return new Promise((resolve) => {
            html2canvas(screenshotTarget).then((canvas) => {
                canvas.toBlob((blob) => {
                    if (blob) {
                        const url = URL.createObjectURL(blob);
                        resolve(url); // Return the URL
                    } else {
                        resolve(null);
                    }
                });
            });
        });
    }

    const generateExplanation = async (_: React.MouseEvent<HTMLButtonElement>) => {

        // Take a screenshot for the explanation
        let image_url = await captureScreenshot();

        let trill_spec = TrillGenerator.generateTrill(selectedComponents.nodes, selectedComponents.edges, workflowNameRef.current, workflowGoal);

        let text = JSON.stringify(trill_spec)

        openAIRequest("default_preamble", "explanation_prompt", text).then((response: any) => {
            console.log("Response:", response);

            setFloatingBoxes((prevFloatingBoxes: any) => {
                let uniqueId = crypto.randomUUID()+"";
                
                return {
                    ...prevFloatingBoxes,
                    [uniqueId]: {
                        title: "Explanation from "+workflowNameRef.current,
                        imageUrl: image_url,
                        markdownText: response.result
                    }
                }
            });
        })
        .catch((error: any) => {
            console.error("Error:", error);
        });
    }

    const generateDebug = async (_: React.MouseEvent<HTMLButtonElement>) => {
        // Take a screenshot for the debugging
        let image_url = await captureScreenshot();

        let trill_spec = TrillGenerator.generateTrill(selectedComponents.nodes, selectedComponents.edges, workflowNameRef.current, workflowGoal);

        let text = JSON.stringify(trill_spec) + "\n\n" + ""

        openAIRequest("default_preamble", "debug_prompt", text).then((response: any) => {
            console.log("Response:", response);

            setFloatingBoxes((prevFloatingBoxes: any) => {
                let uniqueId = crypto.randomUUID()+"";
                
                return {
                    ...prevFloatingBoxes,
                    [uniqueId]: {
                        title: "Debugging "+workflowNameRef.current,
                        imageUrl: image_url,
                        markdownText: response.result
                    }
                }
            });
        })
        .catch((error: any) => {
            console.error("Error:", error);
        });

    }

    // Delete a floating box from the list based on the id
    const deleteFloatingBox = (id: string) => {
        setFloatingBoxes((prevFloatingBoxes: any) => {
            const newFloatingBoxes = { ...prevFloatingBoxes };
            delete newFloatingBoxes[id];
            return newFloatingBoxes;
        });
    }

    return (
        <div style={{ width: "100vw", height: "100vh" }} onContextMenu={onContextMenu}>

            {Object.keys(floatingBoxes).map((key, index) => (
                <FloatingBox
                    key={key}
                    title={floatingBoxes[key].title}
                    imageUrl={floatingBoxes[key].imageUrl}
                    markdownText={floatingBoxes[key].markdownText}
                    onClose={() => {deleteFloatingBox(key)}}
                />
            ))}
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

                            if(allowed && llmEvents.length > 0){
                                alert("Wait a few seconds, we are still processing requests.");
                                allowed = false;
                                break
                            }else if(allowed){
                                for(const node of nodes){
                                    if(node.id == change.id){
                                        if(node.data != undefined && node.data.goal != "" && node.data.goal != undefined){
                                            setCurrentEventPipeline("Deleting a node with Subtask");
                                            
                                            addNewEvent({
                                                type: LLMEvents.DELETE_SUBTASK,
                                                status: LLMEventStatus.NOTDONE,
                                                data: ""
                                            })
                                        }
                                    }
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

                    let allowedEdges: Edge[] = [];

                    for(const edge of edges){
                        if(selectedEdgeId == edge.id){
                            allowedEdges.push(edge);
                        }
                    }

                    return onEdgesDelete(allowedEdges);
                }}
                selectionKeyCode="Shift"
                onSelectionChange={(selection) => {
                    let all_x = [];
                    let all_y = [];
                
                    setSelectedComponents(selection);

                    for(const node of selection.nodes){
                        all_x.push(node.position.x);
                        all_y.push(node.position.y);    
                    }

                    if(selection.nodes.length + selection.edges.length > 1){ // There is more than one element selected
                        setIsComponentsSelected(true);
                    }else{
                        setIsComponentsSelected(false);
                    }
                }}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                isValidConnection={isValidConnection}
                connectionMode={ConnectionMode.Loose}
                fitView
            >
                <WorkflowGoal />
                <UserMenu />
                <LLMChat />
                <ToolsMenu />
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
                <Background color="fbfcf6" />
                <Controls />
                { isComponentsSelected ? (
                    <button
                        id={"explainButton"}
                        style={{
                            bottom: "50px",
                            left: "45%",
                            position: "absolute",
                            zIndex: 10,
                            padding: "8px 16px",
                            backgroundColor: "rgb(29, 56, 83)",
                            color: "rgb(251, 252, 246)",
                            border: "none",
                            fontWeight: "bold",
                            borderRadius: "4px",
                            cursor: "pointer",
                        }}
                        onClick={generateExplanation}
                    >
                        Explain
                    </button>
                ) : null}

                { isComponentsSelected ? (
                    <button
                        style={{
                            bottom: "50px",
                            left: "50%",
                            position: "absolute",
                            zIndex: 10,
                            padding: "8px 16px",
                            backgroundColor: "rgb(29, 56, 83)",
                            color: "rgb(251, 252, 246)",
                            border: "none",
                            borderRadius: "4px",
                            fontWeight: "bold",
                            cursor: "pointer",
                        }}
                        onClick={generateDebug}
                    >
                        Debug
                    </button>
                ) : null}

            </ReactFlow>

        </div>
    );
}

