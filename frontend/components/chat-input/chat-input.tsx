import { Textarea } from "@heroui/react";
import { LoadingButton } from "../loading-button/loading-button";


export function ChatInput(props:{
    loading: boolean,
    setLoading: (value: boolean) => void
    inputText: string,
    setInputText: (text: string) => void
    onSubmit: (value: any) => any
}){
    const { loading, setLoading, inputText, setInputText, onSubmit} = props;

    return (
        <div className="h-full w-full flex flex-row items-end justify-center p-5">
            <Textarea 
                label="Knowledge RAG Input" 
                placeholder="Enter a Question to build a Knowledge Graph or get Information about Person, Vessles or Locations" 
                value={inputText}
                onValueChange={(value:string) => setInputText(value)}
                endContent={
                    <LoadingButton
                loading={loading}
                text="Submit"
                onClick={onSubmit}
            />
                }
            />
        
        </div>
    )
}