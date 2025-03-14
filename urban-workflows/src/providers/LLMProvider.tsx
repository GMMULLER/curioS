import React, {
    createContext,
    useContext,
    ReactNode
} from "react";

interface LLMContextProps {
    openAIRequest: (preamble_file: string, text: string, chatOn?: string) => any;
}

export const LLMContext = createContext<LLMContextProps>({
    openAIRequest: () => {}
});

const LLMProvider = ({ children }: { children: ReactNode }) => {

    const openAIRequest = async (preamble_file: string, text: string, chatId?: string) => {

        let message: any = {preamble: preamble_file, text: text};

        if(chatId)
            message.chatId = chatId;

        const response = await fetch(`${process.env.BACKEND_URL}/openAI`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(message),
        });
    
          if (!response.ok) {
            throw new Error("Failed to submit data.");
          }
    
          const result = await response.json();
          return result;
    }

    return (
        <LLMContext.Provider
            value={{
                openAIRequest
            }}
        >
            {children}
        </LLMContext.Provider>
    );
};

export const useLLMContext = () => {
    const context = useContext(LLMContext);

    if (!context) {
        throw new Error("useLLMContext must be used within a LLMProvider");
    }

    return context;
};

export default LLMProvider;
