import { Switch, Textarea } from '@heroui/react';

import { LoadingButton } from '../loading-button/loading-button';

export function ChatInput(props: {
  loading: boolean;
  setLoading: (value: boolean) => void;
  inputText: string;
  setInputText: (text: string) => void;
  onSubmit: (value: any) => any;
  useContext: boolean;
  setUseContext: (value: boolean) => void;
}) {
  const { loading, setLoading, inputText, setInputText, onSubmit, useContext, setUseContext } =
    props;

  return (
    <div className="h-full w-full flex flex-row items-end justify-center p-5">
      <Textarea
        endContent={
          <div className="flex flex-col items-center justify-center gap-2">
            <LoadingButton loading={loading} text="Submit" onClick={onSubmit} />
            <Switch
              isSelected={useContext}
              size="sm"
              onValueChange={() => setUseContext(!useContext)}
            >
              Context Search
            </Switch>
          </div>
        }
        label="Knowledge RAG Input"
        placeholder="Enter a Question to build a Knowledge Graph or get Information about Person, Vessles or Locations"
        value={inputText}
        onValueChange={(value: string) => setInputText(value)}
      />
    </div>
  );
}
