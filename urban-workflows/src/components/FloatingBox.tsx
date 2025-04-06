import React, { useEffect, useRef, useState } from "react";
import Draggable from "react-draggable";
import ReactMarkdown from "react-markdown";

interface FloatingBoxProps {
  title: string;
  imageUrl: string;
  markdownText: string;
  onClose: () => void;
}

const FloatingBox: React.FC<FloatingBoxProps> = ({
  title,
  imageUrl,
  markdownText,
  onClose,
}) => {

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
            x: Math.min(startPos.x, currentPos.x),
            y: Math.min(startPos.y, currentPos.y),
            width: Math.abs(startPos.x - currentPos.x),
            height: Math.abs(startPos.y - currentPos.y),
            });
        };
        
        const handleMouseUp = () => {
            setIsDragging(false);
            console.log("Bounding Box:", boundingBox);
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

  const componentRef = useRef<HTMLDivElement>(null);

  const blobUrlToBase64 = async (blobUrl: any) => {
    const response = await fetch(blobUrl); // Fetch the Blob
    const blob = await response.blob(); // Convert response to Blob

    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result); // Get Base64 string
        reader.readAsDataURL(blob); // Convert Blob to Base64
    });
  };

  const exportToMarkdown = async (filename: string, content: string) => {

    let image_base64 = await blobUrlToBase64(imageUrl);

    let content_w_image = "![Workflow]("+image_base64+")  \n"+content;

    const blob = new Blob([content_w_image], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename.endsWith(".md") ? filename : filename + ".md"; // Ensure .md extension
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
  };

  return (
    <Draggable 
        handle=".drag-handle"
        defaultPosition={{x: 50, y: 500}}
    >
      <div style={{backgroundColor: "rgb(251, 252, 246)", zIndex: 300, position: "absolute", boxShadow: "rgba(0, 0, 0, 0.1) 0px 0px 50px", padding: "10px", height: "500px", width: "450px", borderRadius: "10px", fontFamily: "Rubik"}}>
        {/* Draggable Header */}
        <div className="drag-handle cursor-move" style={{height: "50px", width: "100%", cursor: "move", backgroundColor: "rgb(29, 56, 83)", color: "rgb(251, 252, 246)", display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: "12px"}}>
          <span style={{fontWeight: "bold"}}>{title}</span>
          <button onClick={onClose} style={{border: "none", background: "none", fontWeight: "bold", color: "rgb(251, 252, 246)"}}>
            X
          </button>
        </div>

        {/* Content */}
        <div ref={componentRef} className="p-2" style={{overflowY: "auto", height: "370px", border: "1px solid #00000030", marginTop: "10px"}}>
          {imageUrl && <img src={imageUrl} style={{textAlign: "center", border: "1px solid rgb(29, 56, 83)", display: "block", marginLeft: "auto", marginRight: "auto"}} width={"360px"} height={"200px"} className="w-full rounded-lg mb-2" />}
          <div className="prose max-w-none">
            <ReactMarkdown>{markdownText}</ReactMarkdown>
          </div>
        </div>

        {/* Export Button */}
        <div className="mt-2">
          <button onClick={() => {exportToMarkdown(title, markdownText)}} style={{border: "none", backgroundColor: "rgb(29, 56, 83)", color: "rgb(251, 252, 246)", padding: "5px"}}>
            Export to Markdown
          </button>
        </div>
      </div>
    </Draggable>
  );
};

export default FloatingBox;
