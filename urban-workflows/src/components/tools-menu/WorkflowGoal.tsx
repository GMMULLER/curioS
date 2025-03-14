import React, { useState, useEffect } from "react";
import CSS from "csstype";
import { useLLMContext } from "../../providers/LLMProvider";
import { useFlowContext } from "../../providers/FlowProvider";
import { TrillGenerator } from "../../TrillGenerator";
import { useCode } from "../../hook/useCode";

export function WorkflowGoal({ }: { }) {
    const { openAIRequest } = useLLMContext();
    const { nodes, edges, workflowNameRef, suggestionsLeft, workflowGoal, triggerTaskRefresh, updateWarnings, updateSubtasks, setTriggerTaskRefresh, setWorkflowGoal, eraseWorkflowSuggestions, flagBasedOnKeyword, cleanCanvas, triggerSuggestionsGeneration, updateKeywords, setTriggerSuggestionsGeneration } = useFlowContext();
    const { loadTrill } = useCode();
    const [isEditing, setIsEditing] = useState(false);
    const [segments, setSegments] = useState<any>([]);
    const [highlights, setHighlights] = useState<any>({});
    const [tooltip, setTooltip] = useState({ visible: false, text: "", x: 0, y: 0, color: "" });
    const [loading, setLoading] = useState(false);
    const [tempWorkflowGoal, setTempWorkflowGoal] = useState(workflowGoal);

    const typeColors: any = {
        Action: "#e6b1b1",
        Dataset: "#b1b5e6",
        Where: "#b1e6c0",
        About: "#e6e6b1",
        Interaction: "#d7b1e6",
        Source: "#e6cdb1",
        Connection: "#e6b1d3",
        Content: "#dedede"
    };

    const generateSuggestion = async (highlights: any, skipConfirmation?: boolean) => {

        let isConfirmed = false;

        if(!skipConfirmation)
            isConfirmed = window.confirm("Are you sure you want to proceed? This will clear your entire board.");
        
        if (isConfirmed || skipConfirmation) {
            setLoading(true);

            cleanCanvas();

            let trill_spec = TrillGenerator.generateTrill(nodes, edges, workflowNameRef.current);
    
            try {
    
                let result = await openAIRequest("workflow_suggestions_preamble", "Target dataflow: " + JSON.stringify(trill_spec) + "\n" + " Highlighted keywords: " + JSON.stringify(highlights) + "\n" + "The user goal is: "+workflowGoal+" ");
    
                console.log("result", result);
    
                let clean_result = result.result.replaceAll("```json", "");
                clean_result = clean_result.replaceAll("```", "");
    
                let parsed_result = JSON.parse(clean_result);
                parsed_result.dataflow.name = workflowNameRef.current;
    
                loadTrill(parsed_result, "workflow");
            } catch (error) {
                console.error("Error communicating with LLM", error);
                alert("Error communicating with LLM");
            } finally {
                setLoading(false);
            }
        }
    }

    const getNewHighlightsBinding = async (nodes: any, edges:any, workflowName: string, current_keywords: any) => {
        let trill_spec = TrillGenerator.generateTrill(nodes, edges, workflowName);

        let copy_trill = {...trill_spec};

        if(copy_trill.dataflow && copy_trill.dataflow.nodes){
            for(const node of copy_trill.dataflow.nodes){
                if(node.metadata && node.metadata.keywords)
                    delete node.metadata.keywords
            }
        }

        if(copy_trill.dataflow && copy_trill.dataflow.edges){
            for(const edge of copy_trill.dataflow.edges){
                if(edge.metadata && edge.metadata.keywords)
                    delete edge.metadata.keywords
            }
        }

        setLoading(true);

        try {
            let result = await openAIRequest("keywords_binding_preamble", " Current keywords: " + JSON.stringify(current_keywords) + "\n" + "Trill specification: " + JSON.stringify(trill_spec));

            console.log("getNewHighlightsBinding result", result);

            let clean_result = result.result.replaceAll("```json", "");
            clean_result = clean_result.replaceAll("```", "");

            let parsed_result = JSON.parse(clean_result);
            parsed_result.dataflow.name = workflowNameRef.current;

            updateKeywords(parsed_result); // Update keywords on the nodes and edges
        } catch (error) {
            console.error("Error communicating with LLM", error);
            alert("Error communicating with LLM");
        } finally {
            setLoading(false);
        }

    }

    useEffect(() => { // When a new task, from LLMChat, was processed there is a need to generate suggestions 

        if(triggerSuggestionsGeneration){
            generateSuggestion(highlights, true); // Also update keywords on the nodes and edges
            setTriggerSuggestionsGeneration(false);
        }else{
            getNewHighlightsBinding(nodes, edges, workflowNameRef.current, highlights)
        }

    }, [highlights]) 

    const cancelSuggestions = () => {
        eraseWorkflowSuggestions();
    }

    const parseKeywords = async (goal: string) => {
        try {

            if(goal == "")
                return

            let result = await openAIRequest("syntax_analysis_preamble", goal);

            console.log("parseKeywords result", result);

            let highlights = JSON.parse(result.result);

            const regex = new RegExp(`(${Object.keys(highlights).join("|")})`, "gi");
            const parts = goal.split(regex);

            let highlights_with_index: any = {};

            let keywords = Object.keys(highlights);

            for(let i = 0; i < keywords.length; i++){
                highlights_with_index[keywords[i]] = {
                    type: highlights[keywords[i]],
                    index: i
                };
            }

            setHighlights(highlights_with_index);
            setSegments(parts);

        } catch (error) {
            console.error("Error communicating with LLM", error);
            alert("Error communicating with LLM");
        }
    }

    // Based on the current state of the workflow generates a new task that better reflects what is being done by the user
    const refreshTask = async (current_task: string, current_keywords: any) => {

        try {
            let trill_spec = TrillGenerator.generateTrill(nodes, edges, workflowNameRef.current);

            let result = await openAIRequest("task_refresh_preamble", "Current Task: " + current_task + "\n" + " Current keywords: " + JSON.stringify(current_keywords) + "\n" + "Trill specification: " + JSON.stringify(trill_spec));

            console.log("refreshTask result", result);

            setWorkflowGoal(result.result);

        } catch (error) {
            console.error("Error communicating with LLM", error);
            alert("Error communicating with LLM");
        }

    }

    const handleGoalChange = (e: any) => {
        setTempWorkflowGoal(e.target.value);
    };

    const handleNameBlur = () => {
        setIsEditing(false);

        if(tempWorkflowGoal != workflowGoal){
            getNewSubtasks(tempWorkflowGoal);
            setWorkflowGoal(tempWorkflowGoal);
        }
    };

    const getNewSubtasks = async (current_task: string) => { // Based on the changes that the user made on the task reflect it to the subtasks

        console.log("current_task", current_task);

        try {
            let trill_spec = TrillGenerator.generateTrill(nodes, edges, workflowNameRef.current);

            let result = await openAIRequest("new_subtasks_preamble", "Current Task: " + current_task + "\n" + "Trill specification: " + JSON.stringify(trill_spec));

            console.log("result", result);

            updateSubtasks(trill_spec);

        } catch (error) {
            console.error("Error communicating with LLM", error);
            alert("Error communicating with LLM");
        }

    }

    // Every time the task changes keywords need to be parsed again
    useEffect(() => {
        setTempWorkflowGoal(workflowGoal);
        parseKeywords(workflowGoal);
    }, [workflowGoal])

    const generateWarnings = async (goal: string, nodes: any, edges: any, workflowNameRef: any) => {
        try{

            let trill_spec = TrillGenerator.generateTrill(nodes, edges, workflowNameRef.current);

            console.log("trill_spec", trill_spec);

            let result_warnings = await openAIRequest("evaluate_coherence_subtasks_preamble", "Task: " + goal + " \n Current Trill: " + JSON.stringify(trill_spec));

            console.log("warnings result", result_warnings);

            let clean_result_warnings = result_warnings.result.replaceAll("```json", "").replaceAll("```python", "");
            clean_result_warnings = clean_result_warnings.replaceAll("```", "");

            let parsed_result_warnings = JSON.parse(clean_result_warnings);

            updateWarnings(parsed_result_warnings);

        }catch(error){
            console.error("Error communicating with LLM", error);
            alert("Error communicating with LLM");
        }
    }

    useEffect(() => { // If nodes changed it might mean that their subtask changed and we need to refresh the task
        if(triggerTaskRefresh){
            setTriggerTaskRefresh(false);
            refreshTask(workflowGoal, highlights);
            generateWarnings(workflowGoal, nodes, edges, workflowNameRef);
        }
    }, [nodes]);

    return (
        <>
            {/* Editable Workflow Goal */}
            <div style={workflowGoalContainer}>
                
                <div style={{border: "1px solid #ccc", borderRadius: "4px", width: "600px", overflowY: "auto", height: "150px", padding: "5px", display: "flex", justifyContent: "center", alignItems: "center"}}>
                    {workflowGoal == "" ?
                        <p style={{marginBottom: "0px", opacity: 0.7, fontSize: "20px"}}>Interact with the LLM to define your goal</p> : 
                        <p style={goalStyle} onClick={() => setIsEditing(true)}>
                            {/* {segments.map((item: any, index: any) => (
                                item
                            ))} */}
                            {isEditing ? 
                                <textarea style={{width: "100%", height: "100%"}} autoFocus value={tempWorkflowGoal} onChange={handleGoalChange} onBlur={handleNameBlur}></textarea>
                            : 
                                segments.map((part: any, index: any) =>
                                    highlights[part] ? (
                                        <span key={index+"_span_text_goal"} style={{ backgroundColor: typeColors[highlights[part]["type"]], fontWeight: "bold", padding: "2px", marginRight: "4px", borderRadius: "5px", cursor: "default"}}
                                            onMouseEnter={(e) => {
                                                setTooltip({
                                                    visible: true,
                                                    text: highlights[part]["type"],
                                                    x: e.clientX + 10,
                                                    y: e.clientY + 10,
                                                    color: typeColors[highlights[part]["type"]]
                                                });

                                                flagBasedOnKeyword(highlights[part]["index"]);
                                            }}
                                            onMouseMove={(e) => {
                                                setTooltip(prev => ({ ...prev, x: e.clientX + 10, y: e.clientY + 10, color: typeColors[highlights[part]["type"]]}));
                                            }}
                                            onMouseLeave={(e) => {
                                                setTooltip({ visible: false, text: "", x: 0, y: 0, color: "" });
                                            
                                                flagBasedOnKeyword();
                                            }}
                                        >
                                            {part}
                                            
                                        </span>
                                    ) : (
                                    part
                                    )
                                )}
                        </p>
                    }   
                </div>
                {!loading ?
                    workflowGoal != "" ?
                        suggestionsLeft > 0 ? 
                            <button style={button} onClick={cancelSuggestions}>Cancel suggestions</button> :
                            <button style={button} onClick={() => {generateSuggestion(highlights)}}>Generate suggestions</button>
                        : null : <button style={button}>...</button>
                }

                {tooltip.visible && (
                    <div style={{...{
                        position: "relative",
                        padding: "5px",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                        boxShadow: "0px 0px 5px rgba(0,0,0,0.2)",
                        zIndex: 1000
                    }, ...(tooltip.color != "" ? {backgroundColor: tooltip.color} : {})}}>
                        {tooltip.text}
                    </div>
                )}

                
            </div>
        </>

    );
}

const workflowGoalContainer: CSS.Properties = {
    marginTop: "20px",
    textAlign: "center",
    zIndex: 100,
    left: "50%",
    transform: "translateX(-50%)",
    position: "fixed",
    display: "flex",
    flexDirection: "column"
};

const goalStyle: CSS.Properties = {
    width: "100%",
    height: "100%",
    fontSize: "16px",
    marginBottom: "0",
    fontWeight: "bold",
    textAlign: "center",
    borderRadius: "4px",
    padding: "5px",
    lineHeight: "1.9"
};

const button: CSS.Properties = {
    backgroundColor: "rgb(0, 123, 255)",
    border: "none",
    color: "white",
    padding: "5px",
    borderRadius: "5px"
};
 

