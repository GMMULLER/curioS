import React, { useState, useEffect } from "react";
import CSS from "csstype";
import { useLLMContext } from "../../providers/LLMProvider";
import { useFlowContext } from "../../providers/FlowProvider";
import { TrillGenerator } from "../../TrillGenerator";
import { useCode } from "../../hook/useCode";

export function WorkflowGoal({ }: { }) {
    const { openAIRequest } = useLLMContext();
    const { nodes, edges, workflowNameRef, suggestionsLeft, workflowGoal, eraseSuggestions, setWorkflowGoal } = useFlowContext();
    const { loadTrill } = useCode();

    // const handleNameChange = (e: any) => {
    //     setWorkflowGoal(e.target.value);
    // };

    const generateSuggestion = async () => {

        eraseSuggestions();

        let trill_spec = TrillGenerator.generateTrill(nodes, edges, workflowNameRef.current);

        try {

            let result = await openAIRequest("workflow_suggestions_preamble", JSON.stringify(trill_spec) + "\n" + "Your task is, based on the dataflow the user built, suggest a set of nodes and connections to accomplish his goal. The user goal is: "+workflowGoal+" **OUPUT A TRILL JSON SPECIFICATION AND NOTHING ELSE. ADD NODES AND EDGES TO THE DATAFLOW OF THE USER. DO NOT CHANGE IDs. CONSIDER EXPECTED 'in' AND 'out' INFORMATION IN EACH NODE. MAKE SURE YOU ADD THE 'dataflow' ATTRIBUTE. DO NOT INCLUDE CONTENT FOR THE NODES. FOR EACH NODE OUTPUT A 'goal' FIELD TO SPECIFY WHAT THE NODE SHOULD DO. ALSO INCLUDE 'out' and 'in' TO INDICATE THE TYPE OF DATA THE NODE SHOULD RECEIVE AND OUTPUT. DO NOT USE THE EXAMPLE WORKFLOW**");

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

    return (
        <>
            {/* Editable Workflow Goal */}
            <div style={workflowGoalContainer}>
                
                <div style={{border: "1px solid #ccc", borderRadius: "4px", width: "600px", overflowY: "auto", height: "150px", padding: "5px", display: "flex", justifyContent: "center", alignItems: "center"}}>
                    {workflowGoal == "" ?
                        <p style={{marginBottom: "0px", opacity: 0.7, fontSize: "20px"}}>Interact with the LLM to define your goal</p> : <p style={goalStyle}>{workflowGoal}</p>
                    }   
                </div>
                {workflowGoal != "" ?
                    suggestionsLeft > 0 ? 
                        <button style={button} onClick={cancelSuggestions}>Cancel suggestions</button> :
                        <button style={button} onClick={generateSuggestion}>Generate suggestions</button>
                    : null
                }

                
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
};

const button: CSS.Properties = {
    backgroundColor: "rgb(0, 123, 255)",
    border: "none",
    color: "white",
    padding: "5px",
    borderRadius: "5px"
};
 

