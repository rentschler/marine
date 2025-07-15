import { Button } from '@heroui/react';
import { Send } from 'lucide-react';

export function LoadingButton(props: {
  loading: boolean;
  text: string;
  onClick: (value: any) => any;
  secondary?: boolean;
}) {
  const { loading, text, onClick, secondary = false } = props;

  return (
    <>
      {!loading ? (
        <Button color="primary" startContent={<Send />} onPress={onClick} 
          // variant={secondary ? 'solid' : 'flat'} 
          className={secondary ? 'text-xs' : ''}
            size={secondary ? 'sm' : 'md'}>
          {text}
        </Button>
      ) : (
        <Button isLoading color="primary">
          Loading
        </Button>
      )}
    </>
  );
}
