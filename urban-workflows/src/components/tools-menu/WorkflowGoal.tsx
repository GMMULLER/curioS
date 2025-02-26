import React, { useState, useEffect } from "react";
import CSS from "csstype";
import { useLLMContext } from "../../providers/LLMProvider";
import { useFlowContext } from "../../providers/FlowProvider";
import { TrillGenerator } from "../../TrillGenerator";
import { useCode } from "../../hook/useCode";

export function WorkflowGoal({ }: { }) {
    const [workflowGoal, setWorkflowGoal] = useState("");
    const [suggestionsOn, setSuggestionsOn] = useState(false);
    const { openAIRequest } = useLLMContext();
    const { nodes, edges, workflowNameRef, eraseSuggestions } = useFlowContext();
    const { loadTrill } = useCode();

    const handleNameChange = (e: any) => {
        setWorkflowGoal(e.target.value);
    };

    const generateSuggestion = async () => {

        eraseSuggestions();

        let trill_spec = TrillGenerator.generateTrill(nodes, edges, workflowNameRef.current);

        try {

            let result = await openAIRequest("workflow_suggestions_preamble", JSON.stringify(trill_spec) + "\n" + "Your task is, based on the dataflow the user built, suggest a set of nodes and connections to accomplish his goal. The user goal is: "+workflowGoal+" **OUPUT A TRILL JSON SPECIFICATION AND NOTHING ELSE. OUTPUT THE NEW NODES AND CONNECTIONS YOU WANT TO ADD, BUT DO NOT REPEAT THE EXISTING NODES AND CONNECTIONS. DO NOT INCLUDE CONTENT FOR THE NODES. FOR EACH NODE OUTPUT A 'goal' FIELD TO SPECIFY WHAT THE NODE SHOULD DO. ALSO INCLUDE 'out' TO INDICATE THE TYPE OF DATA THE NODE SHOULD OUTPUT. DO NOT USE THE EXAMPLE WORKFLOW**");

            let clean_result = result.result.replaceAll("```json", "");
            clean_result = clean_result.replaceAll("```", "");

            let parsed_result = JSON.parse(clean_result);
            parsed_result.dataflow.name = workflowNameRef.current;

            loadTrill(parsed_result, true);

            setSuggestionsOn(true);

        } catch (error) {
            console.error("Error communicating with LLM", error);
            alert("Error communicating with LLM");
        }
    }

    const cancelSuggestions = () => {
        setSuggestionsOn(false);
        eraseSuggestions();
    }

    return (
        <>
            {/* Editable Workflow Goal */}
            <div style={workflowGoalContainer}>
                <input
                    type="text"
                    value={workflowGoal}
                    onChange={handleNameChange}
                    autoFocus
                    style={input}
                    placeholder="What is your goal?"
                />

                {suggestionsOn? 
                    <button style={button} onClick={cancelSuggestions}>Cancel suggestions</button> :
                    <button style={button} onClick={generateSuggestion}>Generate suggestions</button>
                }

                
            </div>
        </>

    );
}

const workflowGoalContainer: CSS.Properties = {
    marginTop: "20px",
    textAlign: "center",
    zIndex: 100,
    left: "calc(50% - 175px)",  
    textAnchor: "middle",
    position: "fixed",
    display: "flex",
    flexDirection: "column"
};

const input: CSS.Properties = {
    fontSize: "20px",
    marginBottom: "10px",
    width: "350px",
    textAlign: "center",
    border: "1px solid #ccc",
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
 

