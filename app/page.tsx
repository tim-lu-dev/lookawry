'use client';

import Image from 'next/image';

import QueryComp from "./queryComp";
import ConnectComp from "./connectComp";

import { useEffect, useRef} from "react";
import useLocalStorage from "./useLocalStorage";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "sonner";
export default function Home() {
  const { connection, setConnection, results, setResults, modelPath } = useLocalStorage();

  const copyToClipboard = async (text: string) => {
    const res = await navigator.clipboard.writeText(text);
    toast.success(`"${text}" has been copied to your clipboard.`);
  }
  
  const scrollRef = useRef<HTMLDivElement>(null); 
    // Automatically scroll to the bottom when results change
    useEffect(() => {
        if (scrollRef.current) {
          setTimeout(() => {
            scrollRef.current?.scrollTo({
              top: scrollRef.current.scrollHeight,
              behavior: 'smooth', // Add smooth scrolling
            });
          }, 100); 
        }
    }, [results]);  // This will trigger whenever `results` changes

  return (
    <div className="w-screen h-screen flex flex-col justify-evenly items-center overflow-hidden">
      <header className="w-full flex text-start gap-2 full items-center pl-8 py-4 shadow-sm">

        <ConnectComp connection={connection} setConnection={setConnection} />
        
        
      </header>
      {
        (!results || results.length <= 0) && <div className="flex justify-center gap-4 items-center w-full p-12 flex-grow max-w-[1920px]">
          <div>
            <Image width={560} height={560} className="h-56 w-56" src="/icon.png" alt="icon"/>
            </div>
          <div className="max-w-[800px]">
          <div className=" font-bold text-5xl font-mono">
            Look Awry is a quick and easy database query tool.
          </div>
          <div className="my-4 font-mono flex flex-col gap-4">
          <div>
            1. Start by making a connection to your database with connection string.
          </div>
          <div>
            2. Choose a local ai model in .gguf format.
          </div>
          <div>
            3. Start asking database today!
          </div>
          </div>
          
          </div>
          </div>
      }
      {
        results && results.length > 0 && <ScrollArea viewportRef={scrollRef} className=" w-full p-12 flex-grow max-w-[1920px]">
        {
    results.map((resultObj, index) => (
      
      <div key={index}>
        <Separator className="my-10" />
        {/* Display the message */}
          {/* {
            (resultObj.date|| true) && <div className="message text-muted-foreground text-xs">2024-12-10</div>
          } */}
          {
            resultObj.question && <div className="message"><strong>Question:</strong> {resultObj.question}</div>
          }
          {
            resultObj.sql && <div className="message"><strong>SQL:</strong> {resultObj.sql} <Button className="h-6 px-2 ml-4" onClick={() => copyToClipboard(resultObj.sql)}>Copy</Button></div>
          }
        
  
        {/* Only render the table if there's data */}
        {Array.isArray(resultObj.data) && resultObj.data.length > 0 && (
          <div className="m-4 p-10 bg-zinc-50 rounded-lg border">
          <Table className="overflow-hidden">
  
            {/* Table Header */}
            <TableHeader>
              <TableRow>
                {Object.keys(resultObj.data[0]).map((key) => (
                  <TableHead key={key} className="w-[100px]">{key}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
  
            {/* Table Body */}
            <TableBody>
              {resultObj.data.map((line:unknown, lineIndex) => (
                <TableRow key={lineIndex}>
                  {typeof line === 'object' && line !== null && Object.entries(line).map(([key, value]) => (
                    <TableCell key={key} className="font-medium">{(typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') ? value : 'N/A'}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
  
            <TableFooter>
              {/* Add any footer content here */}
            </TableFooter>
          </Table>
          </div>
        )}
      </div>
    ))
  }
  
        </ScrollArea>
      }
      
      <footer className="p-4 w-max-[960px]">
        <QueryComp connection={connection} setConnection={setConnection} results={results} setResults={setResults} />
      </footer>
    </div>

  );
}
