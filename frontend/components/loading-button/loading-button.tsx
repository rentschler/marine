import { Button } from "@heroui/react";
import { Send } from "lucide-react"


export function LoadingButton(props:{
    loading: boolean,
    text: string,
    onClick: (value: any) => any 
}){
    const {loading, text, onClick} = props;

    return(
        <>
        {
            !loading ? 
            <Button 
                color="primary"
                startContent={<Send/>}
                onPress={onClick}    
            >
                {text}
            </Button>
            :
            <Button 
                isLoading 
                color="primary"
                >
                Loading
            </Button>
        }
        </>
    )
}