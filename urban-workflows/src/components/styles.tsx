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
    faChartLine
} from "@fortawesome/free-solid-svg-icons";
import { AccessLevelType, BoxType, SupportedType } from "../constants";
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
    const { openAIRequest } = useLLMContext();
    const { nodes, edges, workflowNameRef, updateDefaultCode, onNodesChange, setPinForDashboard, acceptSuggestion, updateDataNode, setTriggerTaskRefresh, workflowGoal } = useFlowContext();
    const { getTemplates, deleteTemplate } = useTemplateContext();
    const { createCodeNode } = useCode();
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

    const generateSubtaskFromExec = async (node_content: string, node_type: BoxType, current_task: string) => {
        try {
            let result = await openAIRequest("new_subtask_from_exec_preamble", " Node content: " + node_content + "\n" + "Node type: " + node_type + " Task: " + current_task);
            
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

        if(data.output != undefined && data.output.code == 'success'){

            if(goal == "") // If subtask is empty generate it based on the content of the node after execution
                generateSubtaskFromExec((code ? code : ""), data.nodeType, workflowGoal);

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
            setCurrentBoxWidth(525);
        }

        if(boxHeight == undefined){
            setCurrentBoxHeight(267);
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

    const generateConnectionSuggestions = () => {

        let baseNode: any = {
            id: nodeId,
            type: boxNameTranslation(data.nodeType),
            content: code
            
        };

        if(data.goal != undefined)
            baseNode.goal = data.goal;
        
        if(data.in != undefined)
            baseNode.in = data.in;

        if(data.out != undefined)
            baseNode.out = data.out;


        // TODO: Based on this node recommend...
    }

    const generateContentNode = async (nodes: any, edges: any, workflowNameRef: any, goal: string, workflowGoal: string) => {

        const isConfirmed = window.confirm("Are you sure you want to proceed? This will overwrite the node's content.");
    
        if(isConfirmed){

            let trill_spec = TrillGenerator.generateTrill(nodes, edges, workflowNameRef.current);

            try {
    
                let result = await openAIRequest("new_content_preamble", "Current Trill: " + JSON.stringify(trill_spec) + "\n" + " Node ID: " + nodeId + "\n" + "Subtask: "+goal+" Task: " + "\n" + workflowGoal);
    
                let clean_result = result.result.replaceAll("```json", "").replaceAll("```python", "");;
                clean_result = clean_result.replaceAll("```", "");

                console.log("generateContentNode result", clean_result);
    
                updateDefaultCode(nodeId, clean_result);

            } catch (error) {
                console.error("Error communicating with LLM", error);
                alert("Error communicating with LLM");
            }
        }

    }

    const updateDataGoal = (goal: string) => {
        if(data.goal != goal){
            let newData = {...data}; 
            newData.goal = goal; 
            updateDataNode(nodeId, newData);
            setTriggerTaskRefresh(true); // When the subtask is update the task should be updated
        }
    }

    return (
        <>
            <div id={nodeId+"resizer"} className={"resizer nowheel nodrag"} style={{...(data.suggestion ? {pointerEvents: "none"} : {})}}></div>
            {data.suggestionAcceptable ?
                <button style={buttonAcceptSuggestion} onClick={() => {acceptSuggestion(nodeId)}}>Accept Suggestion</button> :
                null
            }

            {!minimized ?
                <div style={{...goalInput, ...(data.suggestion ? {opacity: "50%", pointerEvents: "none"} : {})}} className={"nodrag"}>
                    <label htmlFor={nodeId+"_goal_box_input"}>Subtask: </label>
                    <input id={nodeId+"_goal_box_input"} type={"text"} placeholder={"Describe the subtask"} style={{width: "240px"}} value={goal} onBlur={() => {updateDataGoal(goal)}} onChange={(value: any) => {setGoal(value.target.value)}}/>
                    <button style={buttonStyle} onClick={() => {generateContentNode(nodes, edges, workflowNameRef, goal, workflowGoal)}} >Generate code</button>
                </div> : null
            }

            {!minimized && (handleType == "in/out" || handleType == "out") ?
                <button style={buttonGetConnectionSuggestions} onClick={generateConnectionSuggestions}>+</button> : null
            }

            {!minimized && (handleType == "in/out" || handleType == "in") ?
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

            {
                !minimized && (handleType == "in/out" || handleType == "out") ?
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

            <div id={nodeId+"resizable"} className={"resizable"} style={{...boxContainerStyles, ...styles, width: currentBoxWidth+"px", height: currentBoxHeight+"px", ...(minimized ? {display: "none"} : {}), ...(data.suggestion ? {opacity: 0.5, borderWidth: "2px", borderStyle: "dashed", pointerEvents: "none"} : {}), ...(data.suggestionAcceptable ? {borderColor: "orange"} : {}), ...(data.keywordHighlighted ? {backgroundColor: "#373737"} : {})}} onContextMenu={onContextMenu}>
                {
                    !noContent ? 
                    <Row style={{ width: "95%", marginBottom: "2px", paddingBottom: "2px", marginLeft: "auto", marginRight: "auto", borderBottom: "1px solid rgba(107, 107, 107, 0.3)" }}>
                        <p style={{...{ textAlign: "center", marginBottom: 0, fontSize: "12px", fontWeight: "bold", position:"fixed", top: "10px", left: 0 }, ...(data.keywordHighlighted ? {color: "white"} : {color: "#888787"})}}>{boxNameTranslation(data.nodeType)}{templateData.name != undefined ? " - " + templateData.name : null}</p>

                        <ul style={{listStyle: "none", padding: 0, display: "flex", margin: 0, justifyContent: "flex-end", zIndex: 5}}>
                            {promptModal != undefined && user != undefined && templateData.id != undefined && templateData.custom && user != null && user.type == "programmer" ? <li style={{marginLeft: "10px"}}><FontAwesomeIcon onClick={() => { promptModal() }} icon={faGear} style={{...iconStyle, ...(data.keywordHighlighted ? {color: "white"} : {color: "#888787"})}} /></li> : null}
                            <li style={{marginLeft: "10px"}}><FontAwesomeIcon onClick={() => { promptDescription() }} icon={faCircleInfo} style={{...iconStyle, ...(data.keywordHighlighted ? {color: "white"} : {color: "#888787"})}} /></li>
                            <li style={{marginLeft: "10px"}}><FontAwesomeIcon
                                    icon={faComments}
                                    style={{...iconStyle, ...(data.keywordHighlighted ? {color: "white"} : {color: "#888787"})}}
                                    onClick={() => setShowComments(!showComments)}
                                /></li>
                            {updateTemplate != undefined && user != undefined && code != undefined && templateData.id != undefined && templateData.custom && code != templateData.code && user != null && user.type == "programmer" ? 
                            <li style={{marginLeft: "10px"}}>
                                <FontAwesomeIcon icon={faFloppyDisk} style={{...iconStyle, ...(data.keywordHighlighted ? {color: "white"} : {color: "#888787"})}} onClick={() => { updateTemplate({ ...templateData, code: code }) }} />
                            </li> : null}

                        </ul>

                            
                    </Row> : null
                } 

                {children}

                <Row  style={{...{ width: "30%", marginRight: "auto", marginLeft: "10px", marginTop: "4px"}, ...(data.suggestion ? {pointerEvents: "none"} : {})}}>
                    {sendCodeToWidgets != undefined ? <Row>
                        <Col md={2}><FontAwesomeIcon className={"nowheel nodrag"} icon={faCirclePlay} style={{cursor: "pointer", fontSize: "27px", color: "#0d6efd"}} onClick={() => {
                            setOutputCallback({code: "exec", content: ""});
                            sendCodeToWidgets(code); // will resolve markers
                        }} /></Col>
                        {
                            output != undefined ? <Col md={3} className="d-flex align-items-center">
                                <p style={{fontSize: "10px", textAlign: "center", marginBottom: 0}}>
                                    {output.code == "success" ? <span style={{color: "green"}}>Done</span> : output.code == "exec" ? "Executing..." : output.code == "error" ? <span style={{color: "red"}}>Error</span> : ""}
                                </p>
                            </Col>
                            : null
                        }
                        {/* <Col md={3}> */}
                        {promptModal != undefined && user != undefined && user != null && user.type == "programmer" ? 
                        <Col md={3}>
                            <Dropdown>
                                <Dropdown.Toggle variant="primary" style={{ fontSize: "9px" }}>
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
                    pinnedToDashboard ? <FontAwesomeIcon icon={faCircleDot} style={{...{ color: "red", cursor: "pointer", fontSize: "10px", position: "fixed", top: "12px", left: "10px", zIndex: 11 }, ...(data.suggestion ? {pointerEvents: "none"} : {})}} onClick={() => { updatePin(nodeId, pinnedToDashboard) }} /> : <FontAwesomeIcon style={{...(data.keywordHighlighted ? {color: "white"} : {color: "888"}), ...{ cursor: "pointer", fontSize: "10px", position: "fixed", top: "12px", left: "10px", zIndex: 11 }, ...(data.suggestion ? {pointerEvents: "none"} : {})}} icon={faCircle} onClick={() => { updatePin(nodeId, pinnedToDashboard) }} />
                }

                {
                    !data.suggestion ?
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
                <div style={{...{width: currentBoxWidth+"px", height: currentBoxHeight+"px", backgroundColor: "white", boxShadow: "rgba(0, 0, 0, 0.35) 0px 5px 15px", borderRadius: "10px", padding: "5px", justifyContent: "center", display: "flex",  alignItems: "center"}, ...(data.suggestion ? {pointerEvents: "none"} : {})}}>
                    <FontAwesomeIcon icon={boxIconTranslation(data.nodeType)} style={{...iconStyle, fontSize: "23px"}} />
                </div> :
                null
            }

            <FontAwesomeIcon icon={(!minimized ? faMinus : faUpRightAndDownLeftFromCenter)} style={{...(data.keywordHighlighted ? {color: "white"} : {color: "#888787"}), ...iconStyle, position: "fixed", ...(minimized ?{top: "5px", left: "5px"} : {left: "50px", top: "12px"}), fontSize: "10px", zIndex: 8, ...(data.suggestion ? {pointerEvents: "none"} : {}) }} onClick={() => { 
                if(data.nodeType != BoxType.MERGE_FLOW){
                    if(!minimized){
                        setCurrentBoxWidth(70);
                        setCurrentBoxHeight(40);
                    }else{
                        if(boxWidth == undefined){
                            setCurrentBoxWidth(525);
                        }else{
                            setCurrentBoxWidth(boxWidth);
                        }
                
                        if(boxHeight == undefined){
                            setCurrentBoxHeight(267);
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
    backgroundColor: "white",
    boxShadow: "rgba(0, 0, 0, 0.35) 0px 5px 15px",
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
    backgroundColor: "transparent",
    color: "#545353",
    border: "1px solid #545353",
    padding: "4px 8px",
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
    padding: "8px 12px",
    cursor: "pointer",
    backgroundColor: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
};

const buttonGetConnectionSuggestions: CSS.Properties = {
    position: "absolute",
    top: "calc(50% - 14px)",
    right: "-50px",
    fontSize: "14px",
    backgroundColor: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
};

const goalInput: CSS.Properties = {
    position: "absolute",
    bottom: "-50px"
}

const inputTypeSelect: CSS.Properties = {
    position: "absolute",
    left: "-160px",
    fontSize: "14px",
    top: "calc(50% - 14px)"
}

const outputTypeSelect: CSS.Properties = {
    position: "absolute",
    right: "-160px",
    fontSize: "14px",
    top: "calc(50% - 14px)"
}
