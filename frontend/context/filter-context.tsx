"use client";

import { FilterContextType } from "@/types/filter-context-type";
import {createContext, useContext, useState, ReactNode, useEffect} from "react";

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({children}: {children: ReactNode}){
    const [selectedNodeTypes, setSelectedNodeTypes] = useState<string[]>([]);
    const [selectedNodeDegrees, setSelectedNodeDegrees] = useState<number[]>([])
    const [selectedEdgeTypes, setSelectedEdgeTypes] = useState<string[]>([]);

    useEffect(()=>{
        console.log(selectedNodeTypes, selectedNodeDegrees, selectedEdgeTypes);
    },[selectedNodeTypes, selectedNodeDegrees, selectedEdgeTypes])

    return(
        <FilterContext.Provider
            value={{
                selectedNodeTypes,
                setSelectedNodeTypes,
                selectedNodeDegrees,
                setSelectedNodeDegrees,
                selectedEdgeTypes,
                setSelectedEdgeTypes,
            }}
        >
          {children}
        </FilterContext.Provider>
    )

}

export function useFilterContext(){
    const context = useContext(FilterContext);
    if(!context){
        throw new Error("useFilterContext must be used within a FilterProvider")
    }
    return context;
}