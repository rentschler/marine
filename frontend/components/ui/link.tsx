import Link from 'next/link';
import { ReactNode } from 'react';

interface CustomLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
}

export const CustomLink: React.FC<CustomLinkProps> = ({
  href,
  children,
  className = 'text-blue-500 hover:text-blue-700 underline',
}) => {
  return (
    <Link className={className} href={href}>
      {children}
    </Link>
  );
};
