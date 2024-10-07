'use client';

import React, { useState } from "react";
import { Textarea } from "../components/ui/textarea"
import { Button } from "../components/ui/button"
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "../components/ui/card"
import { toast } from "sonner"
import { Spinner } from '../components/ui/spinner';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "../components/ui/tabs"
import { Config, Result } from "./useLocalStorage";
import { PlugZap } from "lucide-react";

/**
 * QueryComp component allows users to interact with the database
 * through asking questions, generating SQL queries, and executing SQL directly.
 * It handles loading states and error handling for each operation.
 */
const QueryComp = ({ setResults, connection }: {
        connection: Config | null,
        setConnection: (config: Config) => void,
        results: Result[],
        setResults: React.Dispatch<React.SetStateAction<Result[]>>
    }) => {
    
    const [loading, setLoading] = useState<boolean>(false);
    const [queryTab, setQueryTab] = useState<string>("ask");
    const [sql, setSql] = useState<string>("");
    const [question, setQuestion] = useState<string>("");

    // Handler for setting the question from the input
    const questionHandler = (e: { target: { value: React.SetStateAction<string>; }; }) => {
        setQuestion(e.target.value)
    }

    // Handler for setting the SQL query from the input
    const sqlHandler = (e: { target: { value: React.SetStateAction<string>; }; }) => {
        setSql(e.target.value)
    }

    /**
     * Function to ask a question and retrieve results from the database.
     * It invokes the backend API to process the question.
     */
    const ask = async () => {
        setLoading(true);

        if (!connection) {
            setLoading(false);
            toast.error("Error: Please connect to a database first before any query operation!")
            return;
        }
        if (!connection.ai_model_path) {
            setLoading(false);
            toast.error("Error: Please choose an AI model file before asking!")
            return;
        }
        try {
            const { invoke } = await import("@tauri-apps/api");

            const res = await invoke<string>('ask', { data: JSON.stringify(connection), question: question });
            const json: Result = JSON.parse(res) as Result;

            setResults((prevResults: Result[]) => [...prevResults, json]);
            setLoading(false);

            if (Array.isArray(json.data)) {
                toast.info("Success! Retrieved " + json.data.length + " lines of data.")
            }
        } catch (e) {
            const msg = Object.entries(e as { [key: string]: string }).map(([key, value]) => key + " : " + value).join(', ');
            setLoading(false);
            toast.error(msg)
        }
    }

    /**
     * Function to generate an SQL query from the given question using the AI model.
     */
    const ask_for_sql = async () => {
        setLoading(true);

        if (!connection) {
            setLoading(false);
            toast.error("Error: Please connect to a database first before any query operation!")
            return;
        }
        if (!connection.ai_model_path) {
            setLoading(false);
            toast.error("Error: Please choose an AI model file before asking!")
            return;
        }
        try {
            const { invoke } = await import("@tauri-apps/api");
            const res = await invoke<string>('ask_for_sql', { data: JSON.stringify(connection), question: question });
            const json: Result = JSON.parse(res) as Result;

            setSql(json.sql);
            setQueryTab("query");
            setResults((prevResults: Result[]) => [...prevResults, json]);
            setLoading(false);
            toast.info("Success! Retrieved query statement.")
        } catch (e) {
            const msg = Object.entries(e as { [key: string]: string }).map(([key, value]) => key + " : " + value).join(', ');
            setLoading(false);
            toast.error(msg)
        }
    }

    /**
     * Function to run a SQL query directly against the database.
     * Only SELECT queries are allowed for security reasons.
     */
    const query = async () => {
        setLoading(true);

        if (!connection) {
            toast.error("Error: Please connect to a database first before any query operation!")
            setLoading(false);
            return;
        }
        if (!sql.trim().toUpperCase().match(/^\s*SELECT\b/)) {
            setLoading(false);
            toast.error("Error: Please enter a valid SELECT query. Updates are not allowed!")
            return;
        }
        try {
            const { invoke } = await import("@tauri-apps/api");
            const res = await invoke<string>('query', { data: JSON.stringify(connection), sql: sql });
            const json: Result = JSON.parse(res) as Result;

            setResults((prevResults: Result[]) => [...prevResults, json]);
            setLoading(false);

            if (Array.isArray(json.data)) {
                toast.info("Success! Retrieved " + json.data.length + " lines of data.")
            }
        } catch (e) {
            const msg = Object.entries(e as { [key: string]: string }).map(([key, value]) => key + " : " + value).join(', ');
            setLoading(false);
            toast.error(msg)
        }
    }

    return (
        <div className="grid w-full gap-1.5 flex-0">
            <Tabs defaultValue="ask" className="w-screen lg:w-[640px] p-4" value={queryTab} onValueChange={setQueryTab}>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="ask">Ask</TabsTrigger>
                    <TabsTrigger value="query">Query</TabsTrigger>
                </TabsList>
                <TabsContent value="ask" >
                    <Card>
                        <CardHeader>
                            <CardTitle>Type in simple question to retrieve information from database.</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Textarea placeholder="Type your question here.." id="question" onChange={questionHandler} />
                        </CardContent>
                        <CardFooter className="gap-2">
                            <Button disabled={loading} onClick={ask}>Ask<Spinner show={loading} className="ml-2" size="xsmall" color="white"/></Button>
                            <Button disabled={loading} onClick={ask_for_sql}>Ask for SQL<Spinner show={loading} className="ml-2" size="xsmall" color="white"/></Button>
                        </CardFooter>
                    </Card>
                </TabsContent>
                <TabsContent value="query">
                    <Card>
                        <CardHeader>
                            <CardTitle>Use SQL query directly here</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Textarea placeholder="Your sql query goes here.." value={sql} onChange={sqlHandler} />
                        </CardContent>
                        <CardFooter>
                            <Button disabled={loading} onClick={query}>Query <Spinner show={loading} className="ml-2" size="xsmall" color="white"/></Button>
                        </CardFooter>
                    </Card>
                </TabsContent>
                {
                    connection && <div className="flex items-center">
                        <PlugZap className="h-4 text-green-500"/>
                        <p className="text-muted-foreground text-left text-sm m-1">
                            {"Connected to " + connection?.db_type}
                        </p>
                    </div>
                }
                {
                    !connection && <div className="flex items-center">
                    <PlugZap className="h-4 text-red-500"/>
                        <p className="text-muted-foreground text-left text-sm m-1">
                            Disconnected
                        </p>
                    </div>
                }
            </Tabs>
        </div>
    );
}

export default QueryComp;
