"use client";

import { Options } from "@/types/options-types";
import { useEffect, useState } from "react"
import { Button, Divider, Slider, Spinner } from "@heroui/react";



export function FilterDashboard(){

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | undefined>(undefined);

    const [optionsValues, setOptionsValues] = useState<Options| undefined>(undefined);

    const [selectedNodeTypes, setSelectedNodeTypes] = useState<string[]>([]);
    const [selectedEdgeTypes, setSelectedEdgeTypes] = useState<string[]>([]);


    useEffect(() => {
        async function loadOptions(){
            setLoading(true)
            try{
                const response = await fetch("/api/options")
                if (!response.ok){
                    throw new Error("Failed to fetch filter options")
                }
                const options: Options =  await response.json();
                setOptionsValues(options);
                setLoading(false);
            } catch (e){
                console.error(e)
                setLoading(false)
                setError("Error while fetching filter options.")
            }
        }

        loadOptions();
    }, [])
    return(
        <div className ="h-full w-full flex items-center justify-center">
            {
                loading ?
                (
                    <Spinner/>
                )
                : 
                (
                    <div className="flex flex-col items-start jusify-start w-full h-full px-6 gap-3">
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">
                            Graph Filters
                        </h1>
                        <Divider/>
                        <label className="text-sm font-medium text-gray-700">Node Types</label>
                        <div className="flex flex-wrap gap-3 w-full">
                            {optionsValues?.type.map((nodeType) => {
                                const isSelected = selectedNodeTypes.includes(nodeType);
                                return (
                                    <Button
                                        key={nodeType}
                                        color="primary"
                                        variant={isSelected ? "solid" : "bordered"}
                                        onClick={() => {
                                            setSelectedNodeTypes(prev =>
                                                isSelected
                                                    ? prev.filter(t => t !== nodeType)
                                                    : [...prev, nodeType]
                                            );
                                        }}
                                    >
                                        {nodeType}
                                    </Button>
                                );
                            })}
                        </div>

                        <Slider
                        className="w-full"
                        label="Node Degree"
                        defaultValue={[optionsValues?.max_degree as number, optionsValues?.min_degree as number]}
                        maxValue={optionsValues?.max_degree as number}
                        minValue={optionsValues?.min_degree as number}
                        step={1}
                    />

                    <Divider/>
                    <label className="text-sm font-medium text-gray-700">Edge Types</label>
                        <div className="flex flex-wrap gap-3 w-full">
                            {optionsValues?.edge_types.map((edgeType) => {
                                const isSelected = selectedEdgeTypes.includes(edgeType);
                                return (
                                    <Button
                                        key={edgeType}
                                        color="primary"
                                        variant={isSelected ? "solid" : "bordered"}
                                        onClick={() => {
                                            setSelectedEdgeTypes(prev =>
                                                isSelected
                                                    ? prev.filter(t => t !== edgeType)
                                                    : [...prev, edgeType]
                                            );
                                        }}
                                    >
                                        {edgeType}
                                    </Button>
                                );
                            })}
                        </div>
                    </div>
                )
            }
        </div>
    )
}