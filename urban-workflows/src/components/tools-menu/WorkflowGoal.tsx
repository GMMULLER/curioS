import React, { useState, useEffect } from "react";
import CSS from "csstype";
import { useLLMContext } from "../../providers/LLMProvider";
import { useFlowContext } from "../../providers/FlowProvider";
import { TrillGenerator } from "../../TrillGenerator";
import { useCode } from "../../hook/useCode";

export function WorkflowGoal({ }: { }) {
    const { openAIRequest } = useLLMContext();
    const { nodes, edges, workflowNameRef, suggestionsLeft, workflowGoal, setWorkflowGoal, eraseSuggestions, flagBasedOnKeyword } = useFlowContext();
    const { loadTrill } = useCode();
    const [segments, setSegments] = useState<any>([]);
    const [highlights, setHighlights] = useState<any>({});
    const [tooltip, setTooltip] = useState({ visible: false, text: "", x: 0, y: 0, color: "" });

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

    const generateSuggestion = async (highlights: any) => {

        eraseSuggestions();

        let trill_spec = TrillGenerator.generateTrill(nodes, edges, workflowNameRef.current);

        try {

            let result = await openAIRequest("workflow_suggestions_preamble", "Target dataflow: " + JSON.stringify(trill_spec) + "\n" + " Highlighted keywords: " + JSON.stringify(highlights) + "\n" + "The user goal is: "+workflowGoal+" ");

            console.log("result", result);

            let clean_result = result.result.replaceAll("```json", "");
            clean_result = clean_result.replaceAll("```", "");

            let parsed_result = JSON.parse(clean_result);
            parsed_result.dataflow.name = workflowNameRef.current;

            loadTrill(parsed_result, true);
        } catch (error) {
            console.error("Error communicating with LLM", error);
            alert("Error communicating with LLM");
        }
    }

    const cancelSuggestions = () => {
        eraseSuggestions();
    }

    const parseKeywords = async (goal: string) => {
        try {

            if(goal == "")
                return

            let result = await openAIRequest("syntax_analysis_preamble", goal);

            console.log("result", result);

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

            console.log("result", result);

            setWorkflowGoal(result.result);

        } catch (error) {
            console.error("Error communicating with LLM", error);
            alert("Error communicating with LLM");
        }

    }

    // Every time the task changes keywords need to be parsed again
    useEffect(() => {
        parseKeywords(workflowGoal);
    }, [workflowGoal])

    return (
        <>
            {/* Editable Workflow Goal */}
            <div style={workflowGoalContainer}>
                
                <div style={{border: "1px solid #ccc", borderRadius: "4px", width: "600px", overflowY: "auto", height: "150px", padding: "5px", display: "flex", justifyContent: "center", alignItems: "center"}}>
                    {workflowGoal == "" ?
                        <p style={{marginBottom: "0px", opacity: 0.7, fontSize: "20px"}}>Interact with the LLM to define your goal</p> : 
                        <p style={goalStyle}>
                            {/* {segments.map((item: any, index: any) => (
                                item
                            ))} */}
                            {segments.map((part: any, index: any) =>
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
                {workflowGoal != "" ?
                    suggestionsLeft > 0 ? 
                        <button style={button} onClick={cancelSuggestions}>Cancel suggestions</button> :
                        <button style={button} onClick={() => {generateSuggestion(highlights)}}>Generate suggestions</button>
                    : null
                }

                <button onClick={() => {refreshTask(workflowGoal, highlights)}}>Refresh task</button>

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
 

