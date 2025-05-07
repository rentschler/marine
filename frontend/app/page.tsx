"use client";
import { CustomLink } from "@/components/ui/link";

export default function Home() {



  return (
    <>
      <div className="flex flex-col items-center justify-center gap-4">
        <CustomLink href="/" className="my-auto">Home</CustomLink>
        <CustomLink href="/graph" className="my-auto">Graph View</CustomLink>
        <CustomLink href="/example" className="my-auto">Example View</CustomLink>


      </div>

    </>
  );
}
