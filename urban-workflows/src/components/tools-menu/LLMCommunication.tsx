import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import CSS from "csstype";
import { useFlowContext } from "../../providers/FlowProvider";
import { TrillGenerator } from "../../TrillGenerator";
import { useCode } from "../../hook/useCode";
import { useLLMContext } from "../../providers/LLMProvider";

export function LLMCommunication() {
  const [textInput, setTextInput] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { nodes, edges, workflowNameRef } = useFlowContext();
  const { loadTrill } = useCode();
  const { openAIRequest } = useLLMContext();

  const handleTextInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTextInput(event.target.value);
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setImageFile(event.target.files[0]);
    }
  };

  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        if (e.target && e.target.result) {
          img.src = e.target.result as string;
        }
      };

      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Canvas context not available"));
          return;
        }

        const maxWidth = 1000;
        const maxHeight = 1000;
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = (height / width) * maxWidth;
            width = maxWidth;
          } else {
            width = (width / height) * maxHeight;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        const resizedImage = canvas.toDataURL("image/jpeg");
        resolve(resizedImage);
      };

      img.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!textInput && !imageFile) {
      alert("Please provide either text, an image, or both.");
      return;
    }

    try {
      setIsSubmitting(true);

      let imageString = "";
      if (imageFile) {
        imageString = await resizeImage(imageFile);
      }

      let trill_spec = TrillGenerator.generateTrill(nodes, edges, workflowNameRef.current);

      let result = await openAIRequest("default_preamble", JSON.stringify(trill_spec) + textInput + "\n" + "**OUTPUT THE SPECIFICATION IN THE EXACT FORMAT SPECIFIED IN THE JSON. MAKE SURE TO NOT OUTPUT ANY OTHER TEXT OR EXPLANATION ABOUT YOUR OUTPUT. ALWAYS SCAPE BREAK LINES AND TABS INSIDE CONTENT FIELD AND DO NOT USE TRIPLE QUOTES** ");
      
      console.log("result", result);
      console.log(result.result);
      loadTrill(JSON.parse(result.result));
    } catch (error) {
      console.error("Error generating trill:", error);
      alert("Failed to generating trill. Try modifying your prompt");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mt-4" style={llmContainerStyle}>
      <h2 className="mb-4">LLM Communication</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="textInput" className="form-label">
            Enter Text:
          </label>
          <input
            type="text"
            className="form-control"
            id="textInput"
            value={textInput}
            onChange={handleTextInputChange}
          />
        </div>

        <div className="mb-3">
          <label htmlFor="imageInput" className="form-label">
            Upload Image:
          </label>
          <input
            type="file"
            className="form-control"
            id="imageInput"
            accept="image/*"
            onChange={handleImageChange}
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit"}
        </button>
      </form>
    </div>
  );
}

const llmContainerStyle: CSS.Properties = {
  position: "fixed",
  zIndex: 100,
  top: "400px",
  width: "200px",
  textAlign: "center",
  height: "35px",
  right: "50px",
  backgroundColor: "white",
  fontWeight: "bold",
  color: "#888787",
  borderRadius: "4px",
  cursor: "pointer", 
  outline: "none",
  padding: "5px",
};