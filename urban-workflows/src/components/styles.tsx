import React, { ReactNode, useState, useEffect } from "react";
import CSS from "csstype";
import { Dropdown } from "react-bootstrap";

import { useFlowContext } from "../providers/FlowProvider";
import { Box, NodeRemoveChange } from "reactflow";

import { CommentsList, IComment } from "./comments/CommentsList";
import { useRightClickMenu } from "../hook/useRightClickMenu";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faComments, faCircle, faCircleDot } from "@fortawesome/free-solid-svg-icons";
import { useUserContext } from "../providers/UserProvider";
import { useLLMContext } from "../providers/LLMProvider";

import Col from 'react-bootstrap/Col';
import Nav from 'react-bootstrap/Nav';
import Row from 'react-bootstrap/Row';
import {
    faGear,
    faCircleInfo,
    faCirclePlay,
    faCopy,
    faFloppyDisk,
    faSquareMinus,
    faMinus,
    faUpRightAndDownLeftFromCenter,
    faMagnifyingGlassChart,
    faSquareRootVariable,
    faBroom,
    faDownload,
    faUpload,
    faServer,
    faDatabase,
    faRepeat,
    faCodeMerge,
    faImage,
    faTable,
    faFont,
    faCube,
    faChartLine,
    faCirclePlus,
    faTriangleExclamation,
    faAnglesUp,
    faMagnifyingGlass
} from "@fortawesome/free-solid-svg-icons";
import { AccessLevelType, BoxType, LLMEvents, LLMEventStatus, SupportedType } from "../constants";
import './styles.css';
import { Template, useTemplateContext } from "../providers/TemplateProvider";
import { useCode } from "../hook/useCode";
import { ConnectionValidator } from "../ConnectionValidator";
import { TrillGenerator } from "../TrillGenerator";

// Box Container
export const BoxContainer = ({
    data,
    children,
    nodeId,
    templateData,
    code,
    promptDescription,
    updateTemplate,
    promptModal,
    user,
    setOutputCallback,
    sendCodeToWidgets,
    output,
    boxWidth,
    boxHeight,
    noContent,
    setTemplateConfig,
    disableComments = false,
    handleType,
    styles = {}
}: {
    data: any
    children: ReactNode;
    nodeId: string;
    templateData: any;
    code?: string;
    promptDescription: any;
    updateTemplate?: any;
    promptModal?: any;
    user?: any;
    setOutputCallback: any;
    sendCodeToWidgets?: any;
    output?: {code: string, content: string};
    boxWidth?: number;
    boxHeight?: number;
    noContent?: boolean;
    setTemplateConfig?: any;
    disableComments?: boolean;
    styles?: CSS.Properties;
    handleType?: string;
}) => {
    const { openAIRequest, llmEvents, addNewEvent, setCurrentEventPipeline, currentEventPipeline, consumeEvent } = useLLMContext();
    const { nodes, edges, workflowNameRef, updateDefaultCode, onNodesChange, setPinForDashboard, acceptSuggestion, updateDataNode, workflowGoal } = useFlowContext();
    const { getTemplates, deleteTemplate } = useTemplateContext();
    const { createCodeNode, loadTrill } = useCode();
    const [showComments, setShowComments] = useState(false);
    const [goal, setGoal] = useState(data.goal);
    const [expectedInputType, setExpectedInputType] = useState(data.in);
    const [expectedOutputType, setExpectedOutputType] = useState(data.out);
    const [comments, setComments] = useState<IComment[]>([]);
    const [pinnedToDashboard, setPinnedToDashboard] = useState<boolean>(false);
    const [currentBoxWidth, setCurrentBoxWidth] = useState<number | undefined>(boxWidth);
    const [currentBoxHeight, setCurrentBoxHeight] = useState<number | undefined>(boxHeight);
    const { showMenu, menuPosition, onContextMenu } = useRightClickMenu();
    const [minimized, setMinimized] = useState(data.nodeType == BoxType.MERGE_FLOW);
    const [showWarnings, setShowWarnings] = useState<boolean>(false);
    const [isSubtasksOpen, setIsSubtasksOpen] = useState(false);
    const [isConnectionLeftOpen, setIsConnectionLeftOpen] = useState(false);
    const [isConnectionRightOpen, setIsConnectionRightOpen] = useState(false);

    const generateSubtaskFromExec = async (node_content: string, node_type: BoxType, current_task: string) => {
        try {
            let result = await openAIRequest("default_preamble", "new_subtask_from_exec_prompt", " Node content: " + node_content + "\n" + "Node type: " + node_type + " Task: " + current_task);
            
            console.log("generateSubtaskFromExec result", result);

            let new_subtask = result.result;

            setGoal(new_subtask);
            updateDataGoal(new_subtask);
        } catch (error) {
            console.error("Error communicating with LLM", error);
            alert("Error communicating with LLM");
        }
    }

    useEffect(() => {
        setGoal(data.goal);
    }, [data.goal]);

    useEffect(() => {

        if(data.output != undefined && data.output.code == 'success'){
            setExpectedOutputType(data.output.outputType);
        }

        if(data.input != undefined && data.input != ""){
            try {
                let parsed_input = JSON.parse(data.input);

                let dataType = parsed_input.dataType;
                
                if(dataType == 'int' || dataType == 'str' || dataType == 'float' || dataType == 'bool')
                    setExpectedInputType(SupportedType.VALUE)
                else if(dataType == 'list')
                    setExpectedInputType(SupportedType.LIST)
                else if(dataType == 'dict')
                    setExpectedInputType(SupportedType.JSON)
                else if(dataType == 'dataframe')
                    setExpectedInputType(SupportedType.DATAFRAME)
                else if(dataType == 'geodataframe')
                    setExpectedInputType(SupportedType.GEODATAFRAME)
                else if(dataType == 'raster')
                    setExpectedInputType(SupportedType.RASTER)
                else if(dataType == 'outputs')
                    setExpectedInputType("MULTIPLE")

            } catch (error) {
                console.error("Invalid input type", error);
            }
        }

    }, [data.output, data.input])

    useEffect(() => {
        if(boxWidth == undefined){
            setCurrentBoxWidth(560);
        }

        if(boxHeight == undefined){
            setCurrentBoxHeight(280);
        }

        const resizer = document.getElementById(nodeId+"resizer") as HTMLElement;
        const resizable = document.getElementById(nodeId+"resizable") as HTMLElement;

        resizer.addEventListener('mousedown', initResize, false);

        function initResize(e: any) {
            window.addEventListener('mousemove', resize, false);
            window.addEventListener('mouseup', stopResize, false);
        }

        function resize(e: any) {
            resizable.style.width = (e.clientX - resizable.offsetLeft) + 'px';
            resizable.style.height = (e.clientY - resizable.offsetTop) + 'px';
            setCurrentBoxWidth(e.clientX - resizable.offsetLeft);
            setCurrentBoxHeight(e.clientY - resizable.offsetTop);
        }

        function stopResize(e: any) {
            window.removeEventListener('mousemove', resize, false);
            window.removeEventListener('mouseup', stopResize, false);
        }
    }, []);

    const deleteComment = (commentId: number) => {
        setComments(comments.filter((comment) => comment.id !== commentId));
    };
  
    const toggleResolveComment = (commentId: number) => {
        setComments(
          comments.map((comment) => {
            if (comment.id === commentId) {
              comment.resolved = !comment.resolved;
            }
            return comment;
          })
        );
    };
  
    // const handleCloseMenu = () => {
    //     setShowMenu(false);
    //     document.removeEventListener("click", handleCloseMenu);
    // };

    const onDelete = () => {
        const change: NodeRemoveChange = {
            id: nodeId,
            type: "remove",
        };

        onNodesChange([change]);
    };

    const addComment = (comment: IComment) => {
        setComments([...comments, comment]);
    };

    const options = disableComments
    ? [{ name: "Delete", action: onDelete }]
    : [
        { name: "Delete", action: onDelete },
        {
          name: showComments ? "Hide Comments" : "Show Comments",
          action: () => setShowComments(!showComments),
        },
      ];
  
    const updatePin = (nodeId: string, value: boolean) => {
        setPinnedToDashboard(!value)
        setPinForDashboard(nodeId, !value);
    }

    const boxIconTranslation = (boxType: BoxType) => {
        if (boxType == BoxType.COMPUTATION_ANALYSIS) {
            return faMagnifyingGlassChart
        } else if (boxType == BoxType.CONSTANTS) {
            return faSquareRootVariable
        } else if (boxType == BoxType.DATA_CLEANING) {
            return faBroom
        } else if (boxType == BoxType.DATA_EXPORT) {
            return faDownload
        } else if (boxType == BoxType.DATA_LOADING) {
            return faUpload
        } else if (boxType == BoxType.DATA_POOL) {
            return faServer
        } else if (boxType == BoxType.DATA_TRANSFORMATION) {
            return faDatabase
        } else if (boxType == BoxType.FLOW_SWITCH) {
            return faRepeat
        } else if (boxType == BoxType.MERGE_FLOW) {
            return faCodeMerge
        } else if (boxType == BoxType.VIS_IMAGE) {
            return faImage
        } else if (boxType == BoxType.VIS_TABLE) {
            return faTable
        } else if (boxType == BoxType.VIS_TEXT) {
            return faFont
        } else if (boxType == BoxType.VIS_UTK) {
            return faCube
        } else if (boxType = BoxType.VIS_VEGA) {
            return faChartLine
        }
        return faCopy;
    }

    const boxNameTranslation = (boxType: BoxType) => {
        if (boxType == BoxType.COMPUTATION_ANALYSIS) {
            return "Computation Analysis"
        } else if (boxType == BoxType.CONSTANTS) {
            return "Constants"
        } else if (boxType == BoxType.DATA_CLEANING) {
            return "Data Cleaning"
        } else if (boxType == BoxType.DATA_EXPORT) {
            return "Data Export"
        } else if (boxType == BoxType.DATA_LOADING) {
            return "Data Loading"
        } else if (boxType == BoxType.DATA_POOL) {
            return "Data Pool"
        } else if (boxType == BoxType.DATA_TRANSFORMATION) {
            return "Data Transformation"
        } else if (boxType == BoxType.FLOW_SWITCH) {
            return "Flow Switch"
        } else if (boxType == BoxType.MERGE_FLOW) {
            return "Merge Flow"
        } else if (boxType == BoxType.VIS_IMAGE) {
            return "Image"
        } else if (boxType == BoxType.VIS_TABLE) {
            return "Table"
        } else if (boxType == BoxType.VIS_TEXT) {
            return "Text"
        } else if (boxType == BoxType.VIS_UTK) {
            return "UTK"
        } else if (boxType = BoxType.VIS_VEGA) {
            return "Vega-Lite"
        }
    }

    const handleChangeExpectedInputType = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setExpectedInputType(event.target.value as SupportedType);
    };

    const handleChangeExpectedOutputType = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setExpectedOutputType(event.target.value as SupportedType);
    };

    const generateConnectionSuggestions = async (nodes: any, edges: any, workflowNameRef: any, workflowGoal: string, inOrOut: string) => {

        let trill_spec = TrillGenerator.generateTrill(nodes, edges, workflowNameRef.current, workflowGoal);

        try {
    
            let result = await openAIRequest("default_preamble", "new_connection_prompt", "Dataflow task: " + workflowGoal + "\n nodeId: " + nodeId + "\n Subtask: " + goal + "\n Your suggested nodes will be connected to the: " + inOrOut + "\n Current Trill: " + JSON.stringify(trill_spec));

            let clean_result = result.result.replaceAll("```json", "").replaceAll("```python", "");
            clean_result = clean_result.replaceAll("```", "");

            console.log("generateConnectionSuggestions result", clean_result);

            let parsed_result = JSON.parse(clean_result);
            parsed_result.dataflow.name = workflowNameRef.current;

            parsed_result.dataflow.edges = [];

            for(const node of parsed_result.dataflow.nodes){
                if(inOrOut == "input"){
                    parsed_result.dataflow.edges.push({
                        id: "reactflow__" + node.id + "_" + nodeId + "_1",
                        source: node.id,
                        target: nodeId
                    }); 
                }else if(inOrOut == "output"){
                    parsed_result.dataflow.edges.push({
                        id: "reactflow__" + nodeId + "_" + node.id + "_1",
                        source: nodeId,
                        target: node.id
                    });  
                }
            }

            loadTrill(parsed_result, "connection");
        } catch (error) {
            console.error("Error communicating with LLM", error);
            alert("Error communicating with LLM");
        }

    }

    const generateContentNode = async (nodes: any, edges: any, workflowNameRef: any, goal: string, workflowGoal: string) => {

        const isConfirmed = window.confirm("Are you sure you want to proceed? This will overwrite the node's content.");
    
        if(isConfirmed){

            let trill_spec = TrillGenerator.generateTrill(nodes, edges, workflowNameRef.current, workflowGoal);

            try {

                for(const node of trill_spec.dataflow.nodes){ // reseting the content of the node before sending to the LLM
                    if(node.id == nodeId){
                        node.content = "";
                    }
                }

                let result = await openAIRequest("default_preamble", "new_content_prompt", "Current Trill: " + JSON.stringify(trill_spec) + "\n" + " Node ID: " + nodeId + "\n" + "Subtask: "+goal+" Task: " + "\n" + workflowGoal);
    
                let clean_result = result.result.replaceAll("```json", "").replaceAll("```python", "");
                clean_result = clean_result.replaceAll("```", "");

                console.log("generateContentNode result", clean_result);

                updateDefaultCode(nodeId, clean_result);

            } catch (error) {
                console.error("Error communicating with LLM", error);
                alert("Error communicating with LLM");
            }
        }

    }

    const clickGenerateContentNode = () => {
        if(llmEvents.length > 0){
            alert("Wait a few seconds, we are still processing requests.")
        }else{

            setCurrentEventPipeline("Generate content for node");

            addNewEvent({
                type: LLMEvents.GENERATE_CONTENT_NODE,
                status: LLMEventStatus.NOTDONE,
                data: nodeId
            });

        }
    }

    useEffect(() => {
        if(llmEvents.length > 0){
            if(llmEvents[0].type == LLMEvents.GENERATE_CONTENT_NODE && llmEvents[0].status == LLMEventStatus.NOTDONE && llmEvents[0].data == nodeId){
                consumeEvent({type: LLMEvents.GENERATE_CONTENT_NODE, status: LLMEventStatus.PROCESSING, data: nodeId});
            }else if(llmEvents[0].type == LLMEvents.GENERATE_CONTENT_NODE && llmEvents[0].status == LLMEventStatus.PROCESSING && llmEvents[0].data == nodeId){
                generateContentNode(nodes, edges, workflowNameRef, goal, workflowGoal)
            }
        }
    }, [llmEvents]);

    useEffect(() => {
        if(llmEvents.length > 0){
            if(llmEvents[0].type == LLMEvents.GENERATE_CONTENT_NODE && llmEvents[0].status == LLMEventStatus.PROCESSING && llmEvents[0].data == nodeId){
                consumeEvent({type: LLMEvents.GENERATE_CONTENT_NODE, status: LLMEventStatus.DONE, data: nodeId});
                TrillGenerator.addNewVersionProvenance(nodes, edges, workflowNameRef.current, workflowGoal, currentEventPipeline);
            }
        }
    }, [nodes]);

    const updateDataGoal = (goal: string) => {
        if(data.goal != goal){

            setCurrentEventPipeline("Directly editing a Subtask");

            addNewEvent({
                type: LLMEvents.EDIT_SUBTASK,
                status: LLMEventStatus.NOTDONE,
                data: goal
            });

            let newData = {...data}; 
            newData.goal = goal; 
            updateDataNode(nodeId, newData);
        }
    }

    return (
        <>
            <div id={nodeId+"resizer"} className={"resizer nowheel nodrag"} style={{...((data.suggestionType != "none" && data.suggestionType != undefined) ? {pointerEvents: "none"} : {})}}></div>
            {data.suggestionAcceptable ?
                <button style={{...buttonAcceptSuggestion, ...(llmEvents.length > 0 ? {opacity: "60%", pointerEvents: "none"} : {})}} onClick={() => {acceptSuggestion(nodeId)}}>Accept Suggestion</button> :
                null
            }

            {!minimized ?
                <button style={{border: "none", background: "none", color: "#1d3853", ...(isSubtasksOpen ? openSubtasksButton : closedSubtasksButton), ...(llmEvents.length > 0 ? {opacity: "60%"} : {})}} onClick={() => setIsSubtasksOpen(!isSubtasksOpen)}>
                    <FontAwesomeIcon icon={faAnglesUp} style={{...(isSubtasksOpen ? {} : {transform: "rotate(180deg)"})}} />
                </button> : null            
            }

            {!minimized && isSubtasksOpen ?
                <div style={{...goalInput, ...(currentBoxWidth ? {width: (currentBoxWidth-4)+"px"} : {}), ...((data.suggestionType != "none" && data.suggestionType != undefined) ? {opacity: "50%", pointerEvents: "none"} : {})}} className={"nodrag"}>
                    <label htmlFor={nodeId+"_goal_box_input"}>Subtask: </label>
                    <input id={nodeId+"_goal_box_input"} type={"text"} style={{width: "65%", border: "none", background: "transparent", color: "rgb(251, 252, 246)", borderBottom: "1px solid rgb(46, 91, 136)"}} value={goal} onBlur={() => {updateDataGoal(goal)}} onChange={(value: any) => {if(llmEvents.length > 0){alert("Wait a few seconds, we are still processing requests.")}else{setGoal(value.target.value)}}}/>
                    {data.nodeType != BoxType.VIS_UTK ? <button style={buttonStyle} onClick={clickGenerateContentNode} >Get code</button> : null}
                </div> : null
            }

            {!minimized && data.warnings != undefined && data.warnings.length > 0 ?
                <div style={{display: "flex", flexDirection: "row", position: "absolute", bottom: "-45px", right: "20px", ...((data.suggestionType != "none" && data.suggestionType != undefined) ? {opacity: "50%"} : {})}}>   
                    <FontAwesomeIcon style={{fontSize: "24px", color: "#e8c548"}} icon={faTriangleExclamation} onMouseEnter={() => {setShowWarnings(true)}} onMouseLeave={() => {setShowWarnings(false)}} />
                    <ul style={{padding: "5px", backgroundColor: "white", border: "1px solid black", zIndex: 300, position: "fixed", width: "300px", height: "200px", marginLeft: "30px", overflowY: "auto", ...(showWarnings ? {} : {display: "none"})}}>
                        {   
                            data.warnings.map((warning: string, index: number) => (
                                <li key={nodeId+"_warning_"+index} ><p>{warning}</p></li>
                            ))
                        }
                    </ul> 
                </div> : null
            }

            {/* {!minimized ?
                <FontAwesomeIcon style={{fontSize: "24px", color: "rgb(46, 91, 136)", position: "absolute", bottom: "-80px", right: "15px"}} icon={faMagnifyingGlass} /> : null
            } */}

            {!minimized && (handleType == "in/out" || handleType == "in") ?
                <button style={{border: "none", background: "none", color: "#1d3853", ...(isConnectionLeftOpen ? openConnectionLeftButton : closedConnectionLeftButton), ...(llmEvents.length > 0 ? {opacity: "60%"} : {})}} onClick={() => setIsConnectionLeftOpen(!isConnectionLeftOpen)}>
                    <FontAwesomeIcon icon={faAnglesUp} style={{...(isConnectionLeftOpen ? {transform: "rotate(90deg)"} : {transform: "rotate(270deg)"})}} />
                </button> : null            
            }

            {!minimized && (handleType == "in/out" || handleType == "out") ?
                <button style={{border: "none", background: "none", color: "#1d3853", ...(isConnectionRightOpen ? openConnectionRightButton : closedConnectionRightButton), ...(llmEvents.length > 0 ? {opacity: "60%"} : {})}} onClick={() => setIsConnectionRightOpen(!isConnectionRightOpen)}>
                    <FontAwesomeIcon icon={faAnglesUp} style={{...(isConnectionRightOpen ? {transform: "rotate(270deg)"} : {transform: "rotate(90deg)"})}} />
                </button> : null            
            }

            {!minimized && isConnectionLeftOpen && (handleType == "in/out" || handleType == "in") ?
                <div style={inputTypeSelect}>
                    <select id={nodeId+"_expected_box_input_type"} value={expectedInputType} onChange={handleChangeExpectedInputType}>
                        {Object.values(SupportedType).map((type) => {

                            if(ConnectionValidator._inputTypesSupported[data.nodeType].includes(type))
                                return <option key={type} value={type}>
                                    {type}
                                </option>
                            else
                                return null
                        })}
                        <option value="MUTLIPLE">MULTIPLE</option>
                        <option value="DEFAULT">EXPECTED INPUT</option>
                    </select>
                </div> : null
            }

            {!minimized && isConnectionLeftOpen && (handleType == "in/out" || handleType == "in") && !(data.suggestionType != "none" && data.suggestionType != undefined) ?
                <FontAwesomeIcon style={newInConnectionStyle} icon={faCirclePlus} onClick={() => {generateConnectionSuggestions(nodes, edges, workflowNameRef, goal, "input")}} /> : null
            }

            {
                !minimized && isConnectionRightOpen && (handleType == "in/out" || handleType == "out") ?
                <div style={outputTypeSelect}>
                    <select id={nodeId+"_expected_box_output_type"} value={expectedOutputType} onChange={handleChangeExpectedOutputType}>
                        {Object.values(SupportedType).map((type) => {

                            if(ConnectionValidator._outputTypesSupported[data.nodeType].includes(type))
                                return <option key={type} value={type}>
                                    {type}
                                </option>
                            else
                                return null
                        })}
                        <option value="MUTLIPLE">MULTIPLE</option>
                        <option value="DEFAULT">EXPECTED OUTPUT</option>
                    </select>
                </div> : null
            }

            {!minimized && isConnectionRightOpen && (handleType == "in/out" || handleType == "out") && !(data.suggestionType != "none" && data.suggestionType != undefined) ?
                <FontAwesomeIcon style={newOutConnectionStyle} icon={faCirclePlus} onClick={() => {generateConnectionSuggestions(nodes, edges, workflowNameRef, goal, "output")}} /> : null
            }

            <div id={nodeId+"resizable"} className={"resizable"} style={{...boxContainerStyles, ...styles, width: currentBoxWidth+"px", height: currentBoxHeight+"px", ...(minimized ? {display: "none"} : {}), ...((data.suggestionType != "none" && data.suggestionType != undefined) ? {opacity: 0.5, borderWidth: "2px", borderStyle: "dashed", pointerEvents: "none"} : {}), ...(data.suggestionAcceptable ? {borderColor: "#1d3853"} : {}), ...(data.keywordHighlighted ? {backgroundColor: "rgb(29, 56, 83)"} : {})}} onContextMenu={onContextMenu}>
                {
                    !noContent ? 
                    <Row style={{ width: "95%", marginBottom: "2px", paddingBottom: "2px", marginLeft: "auto", marginRight: "auto", borderBottom: "1px solid rgba(107, 107, 107, 0.3)" }}>
                        <p style={{...{ textAlign: "center", marginBottom: 0, fontSize: "12px", fontWeight: "bold", position:"fixed", top: "10px", left: 0 }, ...(data.keywordHighlighted ? {color: "rgb(251, 252, 246)"} : {color: "#888787"})}}>{boxNameTranslation(data.nodeType)}{templateData.name != undefined ? " - " + templateData.name : null}</p>

                        <ul style={{listStyle: "none", padding: 0, display: "flex", margin: 0, justifyContent: "flex-end", zIndex: 5}}>
                            {promptModal != undefined && user != undefined && templateData.id != undefined && templateData.custom && user != null && user.type == "programmer" ? <li style={{marginLeft: "10px"}}><FontAwesomeIcon onClick={() => { promptModal() }} icon={faGear} style={{...iconStyle, ...(data.keywordHighlighted ? {color: "rgb(251, 252, 246)"} : {color: "#888787"})}} /></li> : null}
                            <li style={{marginLeft: "10px"}}><FontAwesomeIcon onClick={() => { promptDescription() }} icon={faCircleInfo} style={{...iconStyle, ...(data.keywordHighlighted ? {color: "rgb(251, 252, 246)"} : {color: "#888787"})}} /></li>
                            <li style={{marginLeft: "10px"}}><FontAwesomeIcon
                                    icon={faComments}
                                    style={{...iconStyle, ...(data.keywordHighlighted ? {color: "rgb(251, 252, 246)"} : {color: "#888787"})}}
                                    onClick={() => setShowComments(!showComments)}
                                /></li>
                            {updateTemplate != undefined && user != undefined && code != undefined && templateData.id != undefined && templateData.custom && code != templateData.code && user != null && user.type == "programmer" ? 
                            <li style={{marginLeft: "10px"}}>
                                <FontAwesomeIcon icon={faFloppyDisk} style={{...iconStyle, ...(data.keywordHighlighted ? {color: "rgb(251, 252, 246)"} : {color: "#888787"})}} onClick={() => { updateTemplate({ ...templateData, code: code }) }} />
                            </li> : null}

                        </ul>

                            
                    </Row> : null
                } 

                {children}

                <Row  style={{...{ width: "32%", marginRight: "auto", marginLeft: "10px", marginTop: "4px"}, ...((data.suggestionType != "none" && data.suggestionType != undefined) ? {pointerEvents: "none"} : {})}}>
                    {sendCodeToWidgets != undefined ? <Row style={{alignItems: "center"}}>
                        <Col md={2}><FontAwesomeIcon className={"nowheel nodrag"} icon={faCirclePlay} style={{...{cursor: "pointer", fontSize: "27px", color: "rgb(35, 198, 134)"}, ...(llmEvents.length > 0 ? {opacity: "60%", pointerEvents: "none"} : {})}} onClick={() => {
                            setOutputCallback({code: "exec", content: ""});
                            sendCodeToWidgets(code); // will resolve markers
                            generateSubtaskFromExec((code ? code : ""), data.nodeType, workflowGoal);
                        }} /></Col>
                        {
                            output != undefined ? <Col md={3} className="d-flex align-items-center" style={{paddingLeft: "19px"}}>
                                <p style={{fontSize: "10px", textAlign: "center", marginBottom: 0}}>
                                    {output.code == "success" ? <span style={{color: "green"}}>Done</span> : output.code == "exec" ? "..." : output.code == "error" ? <span style={{color: "red"}}>Error</span> : ""}
                                </p>
                            </Col>
                            : null
                        }
                        {/* <Col md={3}> */}
                        {promptModal != undefined && user != undefined && user != null && user.type == "programmer" ? 
                        <Col md={3}>
                            <Dropdown>
                                <Dropdown.Toggle style={{ fontSize: "9px", backgroundColor: "rgb(35, 198, 134)", border: "none", color: "rgb(251, 252, 246)", fontWeight: "bold", padding: "6px 10px" }}>
                                    Templates
                                </Dropdown.Toggle>

                                <Dropdown.Menu style={{padding: "5px", fontSize: "9px", overflowY: "auto", maxHeight: "200px"}}>
                                    {user != null && user.type == "programmer" ? <Dropdown.Item style={{ padding: 0 }} onClick={() => { promptModal(true) }}>+ New Template</Dropdown.Item> : null}

                                    {getTemplates(data.nodeType as BoxType, false).length > 0 ? <>
                                        <Dropdown.Divider style={{ padding: 0 }} />
                                        <Dropdown.ItemText style={{ padding: 0, fontWeight: "bold" }}>Default Templates</Dropdown.ItemText>
                                        {getTemplates(data.nodeType as BoxType, false).map((template: Template, index: number) => {
                                            if((template.accessLevel == AccessLevelType.PROGRAMMER && user != null && user.type == "expert") || (template.accessLevel != AccessLevelType.ANY && user == null)){
                                                return null                            
                                            }else{
                                                return <Dropdown.Item key={"templates_modal_content_default_"+data.nodeType+index+nodeId} style={template.accessLevel == AccessLevelType.PROGRAMMER ? buttonStyleProgrammer : template.accessLevel == AccessLevelType.EXPERT ? buttonStyleExpert : buttonStyleAny} onClick={() => {setTemplateConfig(template)}}>{template.name}</Dropdown.Item>
                                            }
                                        })}
                                    </> : null}

                                    {getTemplates(data.nodeType as BoxType, true).length > 0 ? <>
                                        <Dropdown.Divider style={{ padding: 0 }} />
                                        <Dropdown.ItemText style={{ padding: 0, fontWeight: "bold" }}>Custom Templates</Dropdown.ItemText>
                                        {getTemplates(data.nodeType as BoxType, true).map((template: Template, index: number) => {
                                            if((template.accessLevel == AccessLevelType.PROGRAMMER && user != null && user.type == "expert") || (template.accessLevel != AccessLevelType.ANY && user == null)){
                                                return null                            
                                            }else{
                                                return <Dropdown.Item style={{ padding: 0 }} key={"templates_modal_content_custom_"+data.nodeType+index+nodeId} onClick={() => {setTemplateConfig(template)}}><span style={template.accessLevel == AccessLevelType.PROGRAMMER ? buttonStyleProgrammer : template.accessLevel == AccessLevelType.EXPERT ? buttonStyleExpert : buttonStyleAny} >{template.name}</span><FontAwesomeIcon onClick={() => {deleteTemplate(template.id)}} icon={faSquareMinus} style={{color: "#888787", padding: 0, marginLeft: "5px"}} /></Dropdown.Item>
                                            }
                                        })}
                                    </> : null}

                                </Dropdown.Menu>

                            </Dropdown>
                        </Col> : null}
                        {/* </Col> */}
                    </Row> : null
                    }
                </Row>

                {
                    pinnedToDashboard ? <FontAwesomeIcon icon={faCircleDot} style={{...{ color: "red", cursor: "pointer", fontSize: "10px", position: "fixed", top: "12px", left: "10px", zIndex: 11 }, ...((data.suggestionType != "none" && data.suggestionType != undefined) ? {pointerEvents: "none"} : {})}} onClick={() => { updatePin(nodeId, pinnedToDashboard) }} /> : <FontAwesomeIcon style={{...(data.keywordHighlighted ? {color: "rgb(251, 252, 246)"} : {color: "888"}), ...{ cursor: "pointer", fontSize: "10px", position: "fixed", top: "12px", left: "10px", zIndex: 11 }, ...((data.suggestionType != "none" && data.suggestionType != undefined) ? {pointerEvents: "none"} : {})}} icon={faCircle} onClick={() => { updatePin(nodeId, pinnedToDashboard) }} />
                }

                {
                    !(data.suggestionType != "none" && data.suggestionType != undefined) ?
                    <RightClickMenu
                        menuPosition={menuPosition}
                        showMenu={showMenu}
                        options={options}
                    /> : null
                }
                
            </div>

            {showComments && (
                  <CommentsList
                    comments={comments}
                    addComment={addComment}
                    deleteComment={deleteComment}
                    toggleResolveComment={toggleResolveComment}
                  />
            )}

            {
                minimized ? 
                <div style={{...{width: currentBoxWidth+"px", height: currentBoxHeight+"px", backgroundColor: "white", boxShadow: "rgba(0, 0, 0, 0.35) 0px 5px 15px", borderRadius: "10px", padding: "5px", justifyContent: "center", display: "flex",  alignItems: "center"}, ...((data.suggestionType != "none" && data.suggestionType != undefined) ? {pointerEvents: "none"} : {})}}>
                    <FontAwesomeIcon icon={boxIconTranslation(data.nodeType)} style={{...iconStyle, fontSize: "23px"}} />
                </div> :
                null
            }

            <FontAwesomeIcon icon={(!minimized ? faMinus : faUpRightAndDownLeftFromCenter)} style={{...(data.keywordHighlighted ? {color: "rgb(251, 252, 246)"} : {color: "#888787"}), ...iconStyle, position: "fixed", ...(minimized ?{top: "5px", left: "5px"} : {left: "50px", top: "12px"}), fontSize: "10px", zIndex: 8, ...((data.suggestionType != "none" && data.suggestionType != undefined) ? {pointerEvents: "none"} : {}) }} onClick={() => { 
                if(data.nodeType != BoxType.MERGE_FLOW){
                    if(!minimized){
                        setCurrentBoxWidth(70);
                        setCurrentBoxHeight(40);
                    }else{
                        if(boxWidth == undefined){
                            setCurrentBoxWidth(560);
                        }else{
                            setCurrentBoxWidth(boxWidth);
                        }
                
                        if(boxHeight == undefined){
                            setCurrentBoxHeight(280);
                        }else{
                            setCurrentBoxHeight(boxHeight);
                        }
                    }
                }
                
                if(data.nodeType == BoxType.MERGE_FLOW){
                    setMinimized(true);
                }else{
                    setMinimized(!minimized);
                }

            }} /> 
        </>

    );
};

export const iconStyle: CSS.Properties = {
    cursor: "pointer",
    fontSize: "14px"
};

const boxContainerStyles: CSS.Properties = {
    position: "relative",
    backgroundColor: "rgb(251, 252, 246)",
    boxShadow: "rgba(0, 0, 0, 0.1) 0px 0px 50px",
    fontFamily: "Rubik",
    borderRadius: "10px",
    padding: "5px"
};

interface RightClickMenuProps {
    showMenu: boolean;
    menuPosition: { x: number; y: number };
    options: { name: string; action: () => void }[];
    style?: any;
}

export const RightClickMenu: React.FC<RightClickMenuProps> = ({
    showMenu,
    menuPosition = { x: 0, y: 0 },
    options,
    style = {},
}) => {
  return (
    <Dropdown show={showMenu} drop="end" style={style}>
      <Dropdown.Menu
        style={{
          position: "fixed",
          top: menuPosition.y,
          left: menuPosition.x,
          transform: "translate(0, 0)",
        }}
      >
        {options.map((option) => (
          <Dropdown.Item key={option.name} onClick={option.action}>
            {option.name}
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
};
    
const boxContentStyle: CSS.Properties = {
    backgroundColor: "white"
};

export const buttonStyle: CSS.Properties = {
    backgroundColor: "rgb(251, 252, 246)",
    color: "rgb(29, 56, 83)",
    padding: "3px 10px",
    marginLeft: "5px",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    outline: "none"
}

const buttonStyleProgrammer: CSS.Properties = {
    color: "#d66800",
    padding: 0
}

const buttonStyleExpert: CSS.Properties = {
    color: "#0044d6",
    padding: 0
}

const buttonStyleAny: CSS.Properties = {
    color: "#545353",
    padding: 0
}

const buttonAcceptSuggestion: CSS.Properties = {
    position: "absolute",
    top: "-50px",
    cursor: "pointer",
    backgroundColor: "rgb(29, 56, 83)",
    color: "rgb(251, 252, 246)",
    fontFamily: "Rubik",
    padding: "6px 10px",
    fontWeight: "bold",
    border: "none",
    borderRadius: "4px",
};

const newInConnectionStyle: CSS.Properties = {
    position: "absolute",
    left: "-105px",
    fontSize: "25px",
    top: "calc(50% - 50px)",
    color: "rgb(29, 56, 83)"
};

const newOutConnectionStyle: CSS.Properties = {
    position: "absolute",
    right: "-100px",
    fontSize: "25px",
    top: "calc(50% - 50px)",
    color: "rgb(29, 56, 83)"
};

const goalInput: CSS.Properties = {
    position: "absolute",
    bottom: "-50px",
    left: "2px",
    backgroundColor: "rgb(29, 56, 83)",
    color: "rgb(251, 252, 246)",
    borderRadius: "0 0 10px 10px",
    fontFamily: "Rubik",
    paddingTop: "10px",
    height: "60px",
    display: "flex", 
    justifyContent: "center",
    alignItems: "center"
}

const inputTypeSelect: CSS.Properties = {
    position: "absolute",
    left: "-160px",
    fontSize: "13px",
    top: "calc(50% - 13px)",
    fontFamily: "Rubik",
    color: "rgb(29, 56, 83)"
}

const outputTypeSelect: CSS.Properties = {
    position: "absolute",
    right: "-160px",
    fontSize: "13px",
    top: "calc(50% - 13px)",
    fontFamily: "Rubik",
    color: "rgb(29, 56, 83)"
}

const openSubtasksButton: CSS.Properties = {
    position: "absolute",
    bottom: "-80px",
    left: "calc(50% - 12px)"
}

const closedSubtasksButton: CSS.Properties = {
    position: "absolute",
    bottom: "-25px",
    left: "calc(50% - 12px)"
}

const openConnectionLeftButton: CSS.Properties = {
    position: "absolute",
    left: "-190px",
    top: "calc(50% - 12px)"
}

const closedConnectionLeftButton: CSS.Properties = {
    position: "absolute",
    left: "-35px",
    top: "calc(50% - 12px)"
}

const openConnectionRightButton: CSS.Properties = {
    position: "absolute",
    right: "-190px",
    top: "calc(50% - 12px)"
}

const closedConnectionRightButton: CSS.Properties = {
    position: "absolute",
    right: "-35px",
    top: "calc(50% - 12px)"
}
