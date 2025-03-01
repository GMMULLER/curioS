import React, { useState } from "react";
import CSS from "csstype";
import FileUpload from "./FileUpload";
import './UpMenu.css';
import { TrillGenerator } from "../../TrillGenerator";
import { useFlowContext } from "../../providers/FlowProvider";
import { useCode } from "../../hook/useCode";

export function UpMenu({ setDashBoardMode, setDashboardOn, dashboardOn }: { setDashBoardMode: (mode: boolean) => void; setDashboardOn: (mode: boolean) => void; dashboardOn: boolean }) {
    const [isEditing, setIsEditing] = useState(false);
    const [fileMenuOpen, setFileMenuOpen] = useState(false);
    const { nodes, edges, workflowNameRef, setWorkflowName } = useFlowContext();
    const { loadTrill } = useCode();

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

    const exportTrill = (e:any) => {
        let trill_spec = TrillGenerator.generateTrill(nodes, edges, workflowNameRef.current);
        
        const jsonString = JSON.stringify(trill_spec, null, 2);

        const blob = new Blob([jsonString], { type: 'application/json' });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = workflowNameRef.current+'.json';

        document.body.appendChild(link);

        link.click();

        document.body.removeChild(link);
    }

    const handleFileUpload = (e:any) => {
        const file = e.target.files[0]; // Get the selected file

        if (file && file.type === 'application/json') {
            const reader = new FileReader();
    
            reader.onload = (e:any) => {
                try {
                    const jsonContent = JSON.parse(e.target.result);

                    console.log('Uploaded JSON content:', jsonContent);
                    loadTrill(jsonContent);
                } catch (err) {
                    console.error('Invalid JSON file:', err);
                }
            };
    
            reader.onerror = (e:any) => {
                console.error('Error reading file:', e.target.error);
            };
    
            reader.readAsText(file);
        } else {
            console.error('Please select a valid .json file.');
        }
    }

    const loadTrillFile = (e:any) => {
        const fileInput = document.getElementById('loadTrill') as HTMLElement;
        fileInput.click();
    }


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
                            <button style={dropdownItem} onClick={exportTrill}>Export as Trill</button>
                            <div>
                                <button style={dropdownItem} onClick={loadTrillFile}>Load Trill</button>
                                <input type="file" accept=".json" id="loadTrill" style={{ display: 'none' }} onChange={handleFileUpload}/>
                            </div>
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
                        value={workflowNameRef.current}
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
                        {workflowNameRef.current}
                    </h1>
                )}
            </div>

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
