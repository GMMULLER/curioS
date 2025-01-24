import React, { useEffect, useState } from "react";
import CSS from "csstype";
import FileUpload from "./FileUpload";
import './UpMenu.css';

export function UpMenu({ setDashBoardMode, setDashboardOn, dashboardOn }: { setDashBoardMode: (mode: boolean) => void; setDashboardOn: (mode: boolean) => void; dashboardOn: boolean }) {
    const [workflowName, setWorkflowName] = useState("Untitled Workflow");
    const [isEditing, setIsEditing] = useState(false);
    const [fileMenuOpen, setFileMenuOpen] = useState(false);

    const handleNameChange = (e: any) => {
        setWorkflowName(e.target.value);
    };

    const handleNameBlur = () => {
        setIsEditing(false);
    };

    const handleKeyPress = (e: any) => {
        if (e.key === "Enter") {
            setIsEditing(false);
        }
    };

    return (
        <>
            {/* Top Menu Bar */}
            <div className="nowheel nodrag" style={menuBar}>
                <button style={button}>Back to Projects</button>
                <div style={dropdownWrapper}>
                    <button
                        style={button}
                        onClick={() => setFileMenuOpen((prev) => !prev)}
                    >
                        File
                    </button>
                    {fileMenuOpen && (
                        <div style={dropdownMenu}>
                            <button style={dropdownItem}>New Workflow</button>
                            <button style={dropdownItem}>Export as Trill</button>
                            <button style={dropdownItem}>Load Trill</button>
                        </div>
                    )}
                </div>
                <FileUpload style={button} />
                <button style={{...button, ...(dashboardOn ? {boxShadow: "0px 0px 5px 0px red"} : {boxShadow: "0px 0px 5px 0px black"})}} onClick={() => {setDashBoardMode(!dashboardOn); setDashboardOn(!dashboardOn);}}>Dashboard Mode</button>
            </div>
            {/* Editable Workflow Name */}
            <div style={workflowNameContainer}>
                {isEditing ? (
                    <input
                        type="text"
                        value={workflowName}
                        onChange={handleNameChange}
                        onBlur={handleNameBlur}
                        onKeyPress={handleKeyPress}
                        autoFocus
                        style={input}
                    />
                ) : (
                    <h1
                        style={workflowNameStyle}
                        onClick={() => setIsEditing(true)}
                    >
                        {workflowName}
                    </h1>
                )}
            </div>
            {/* <button  style={{...(dashboardOn ? {boxShadow: "0px 0px 5px 0px red"} : {boxShadow: "0px 0px 5px 0px black"})}} >Dashboard mode</button> */}

        </>

    );
}

const menuBar: CSS.Properties = {
    position: "fixed",
    top: 0,
    display: "flex",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    padding: "10px",
    borderBottom: "1px solid #ccc",
    zIndex: 100,
};

const button: CSS.Properties = {
    margin: "0 10px",
    padding: "8px 12px",
    cursor: "pointer",
    backgroundColor: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
};

const dropdownMenu: CSS.Properties = {
    position: "absolute",
    top: "100%",
    left: "0",
    backgroundColor: "#fff",
    border: "1px solid #ccc",
    boxShadow: "0 2px 5px rgba(0, 0, 0, 0.2)",
    zIndex: 100,
};

const dropdownItem: CSS.Properties = {
    display: "block",
    padding: "8px 12px",
    width: "150px",
    textAlign: "left",
    cursor: "pointer",
    backgroundColor: "#fff",
    border: "none",
    borderBottom: "1px solid #eee",
};

const workflowNameContainer: CSS.Properties = {
    marginTop: "20px",
    textAlign: "center",
    zIndex: 80,
    top: "60px",
    left: "50px",
    position: "fixed",
};

const workflowNameStyle: CSS.Properties = {
    fontSize: "24px",
    cursor: "pointer",
};

const input: CSS.Properties = {
    fontSize: "24px",
    textAlign: "center",
    border: "1px solid #ccc",
    borderRadius: "4px",
    padding: "5px",
};

const dropdownWrapper: CSS.Properties = {
  position: "relative"
};
