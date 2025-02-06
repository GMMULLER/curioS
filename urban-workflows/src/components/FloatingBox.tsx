import React, { useCallback, useEffect, useRef, useState } from "react";
import Draggable from "react-draggable";
import ReactMarkdown from "react-markdown";
// import { Button } from "@/components/ui/button";
// import { X } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import zIndex from "@mui/material/styles/zIndex";

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

  const exportToPDF = async () => {
    if (componentRef.current) {
      const canvas = await html2canvas(componentRef.current, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 10, 10, pdfWidth - 20, pdfHeight);
      pdf.save(`${title}.pdf`);
    }
  };



  return (
    <Draggable 
        handle=".drag-handle"
        defaultPosition={{x: 50, y: 500}}
    >
      <div style={{backgroundColor: "white", zIndex: 300, position: "absolute", boxShadow: "0px 0px 5px 0px black", padding: "10px", height: "500px", width: "400px"}}>
        {/* Draggable Header */}
        <div className="drag-handle cursor-move" style={{height: "50px", width: "100%", cursor: "move", backgroundColor: "lightblue"}}>
          <span style={{fontWeight: "bold"}}>{title}</span>
          <button onClick={onClose}>
            X
            {/* <X className="w-5 h-5" /> */}
          </button>
        </div>

        {/* Content */}
        <div ref={componentRef} className="p-2" style={{overflowY: "auto", height: "360px"}}>
          {imageUrl && <img src={imageUrl} className="w-full rounded-lg mb-2" />}
          <div className="prose max-w-none">
            <ReactMarkdown>{markdownText}</ReactMarkdown>
          </div>
        </div>

        {/* Export Button */}
        <div className="mt-4">
          <button onClick={exportToPDF} className="w-full bg-blue-600 text-white">
            Export to PDF
          </button>
        </div>
      </div>
    </Draggable>
  );
};

export default FloatingBox;
