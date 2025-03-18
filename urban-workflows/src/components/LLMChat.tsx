import React, { useState, useEffect } from "react";
import { useLLMContext } from "../providers/LLMProvider";
import { useFlowContext } from "../providers/FlowProvider";
import CSS from "csstype";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faAnglesUp,
    faBroom
} from "@fortawesome/free-solid-svg-icons";
import ReactMarkdown from "react-markdown";
import { TrillGenerator } from "../TrillGenerator";
import { LLMEvents, LLMEventStatus } from "../constants";

const ChatComponent = () => {
    const { openAIRequest, addNewEvent, llmEvents, consumeEvent, setCurrentEventPipeline } = useLLMContext();
    const { setWorkflowGoal, cleanCanvas, workflowNameRef } = useFlowContext();
    const [messages, setMessages] = useState<{ role: string; text: string }[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(true);

    const handleSendMessage = async () => {
        if (!input.trim()) return;

        const userMessage = { role: "user", text: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setLoading(true);

        try {

            const response = await openAIRequest("chat_preamble", input, "ChatComponent");
            const aiMessage = { role: "ai", text: response.result };
            setMessages((prev) => [...prev, aiMessage]);
        } catch (error) {
            console.error("Error fetching response:", error);
        } finally {
            setLoading(false);
        }
    };

    // Check if the goal was already output by the LLM. Return undefined if goal is not there or the goal itself.
    const checkForGoal = (message: string) => {
        const regex = /\*\*(.*?)\*\*/g;

        if(message.toLowerCase().includes("task")){
            const matches = [...message.matchAll(regex)].map(match => match[1]);

            if(matches.length > 0)
                return matches [0]

            return null;
        }

        return null;
    }

    const cleanOpenAIChat = () => {
        setLoading(false);
        setMessages([]);
            
        fetch(process.env.BACKEND_URL+"/cleanOpenAIChat?chatId=ChatComponent", {
            method: "GET"
        });
    }

    const applyGoal = (task: string) => {

        if(llmEvents.length == 0){ // Check if it will start a new chain of LLM events
            const isConfirmed = window.confirm("Are you sure you want to proceed? This will clear your entire board.");
    
            if (isConfirmed) {
                setCurrentEventPipeline("Applying Task from LLM");

                addNewEvent({
                    type: LLMEvents.APPLY_TASK,
                    data: checkForGoal(task) as string,
                    status: LLMEventStatus.NOTDONE
                });
            }
        }else{
            alert("Wait a few seconds, we are still processing requests.")
        }

    }

    useEffect(() => {
        if(llmEvents.length > 0){
            if(llmEvents[0].type == LLMEvents.APPLY_TASK){

                let event = {...llmEvents[0]};

                consumeEvent({type: LLMEvents.GENERATE_HIGHLIGHTS_RESET, status: LLMEventStatus.NOTDONE, data: checkForGoal(event.data) as string}); // Consume current event and replace it with a new one in the same position
                
                cleanCanvas();
                setWorkflowGoal(checkForGoal(event.data) as string);
            }
        }
    }, [llmEvents]);


    useEffect(() => {
        cleanOpenAIChat();
    }, []);

    return (
        <div>
            {/* Toggle Button */}
            <button style={{...toggleButton, ...(isOpen ? openButton : {})}} onClick={() => setIsOpen(!isOpen)}>
                LLM <FontAwesomeIcon icon={faAnglesUp} style={{...(isOpen ? {transform: "rotate(90deg)"} : {transform: "rotate(270deg)"})}} />
            </button>
            {/* Sidebar */}
            <div style={{...sidebar, ...(isOpen ? openSidebar : {})}}>
                <div style={{display: "flex", width: "100%", height: "50px", justifyContent: "center", alignItems: "center", borderBottom: "1px solid black", flexDirection: "row"}}>
                    <p style={{margin: 0, fontWeight: "bold", marginRight: "15px"}}>LLM Assistant</p>
                    <FontAwesomeIcon icon={faBroom} style={{cursor: "pointer"}} title={"Clean chat"} onClick={cleanOpenAIChat} />
                </div>
                <div style={{overflowY: "auto", height: "100%", paddingTop: "10px", paddingBottom: "10px"}}>
                    {messages.map((msg, index) => (
                        <div key={index} style={{...messagesBackground, ...(msg.role === "user" ? {backgroundColor: "rgb(0, 123, 255)"} : {backgroundColor: "#424242"})}} className={`mb-2 p-2 rounded ${msg.role === "user" ? "bg-blue-100 text-right" : "bg-gray-200"}`}>
                            <ReactMarkdown>{msg.text}</ReactMarkdown>
                            {msg.role != "user" && checkForGoal(msg.text)?
                                <button style={applyGoalStyle} onClick={() => {applyGoal(msg.text)}}>Apply task</button> : null
                            }
                        </div>
                    ))}
                </div>
                <div style={inputDiv}>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if(e.key === "Enter"){
                                handleSendMessage()
                            }}}
                        placeholder="Type your message..."
                        disabled={loading}
                        style={inputStyle}
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={loading}
                        style={sendButtonStyle}
                    >
                        {loading ? "..." : "Send"}
                    </button>
                </div>
            </div>
        </div>
    );
};

const inputDiv: CSS.Properties =  {
    display: "flex",
    justifyContent: "center",
    marginBottom: "10px"
}

const inputStyle: CSS.Properties =  {
    padding: "5px"
}

const sendButtonStyle: CSS.Properties =  {
    border: "none",
    marginLeft: "5px",
    backgroundColor: "rgb(0, 123, 255)",
    color: "white",
    fontWeight: "bold",
    borderRadius: "4px"
}

const applyGoalStyle: CSS.Properties =  {
    border: "none",
    marginLeft: "5px",
    marginTop: "3px",
    marginBottom: "5px",
    backgroundColor: "rgb(0, 123, 255)",
    color: "white",
    fontWeight: "bold",
    borderRadius: "4px"
}

const sidebar: CSS.Properties =  {
    position: "fixed",
    top: 0,
    right: "-350px",
    width: "350px",
    height: "100vh",
    zIndex: 200,
    padding: "5px",
    backgroundColor: "white",
    border: "1px solid black",
    transition: "right 0.3s ease-in-out",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between"
}
  
const openSidebar: CSS.Properties = {
    right: 0
}

const openButton: CSS.Properties = {
    right: "350px"
}
  
const toggleButton: CSS.Properties = {
    position: "fixed",
    top: "0",
    right: 0,
    padding: "10px 20px",
    zIndex: 200,
    background: "rgb(0, 123, 255)",
    color: "white",
    fontWeight: "bold",
    border: "none",
    cursor: "pointer",
    transition: "right 0.3s ease-in-out"
}

const messagesBackground: CSS.Properties = {
    borderRadius: "4px",
    padding: "5px",
    color: "white"
}

export default ChatComponent;