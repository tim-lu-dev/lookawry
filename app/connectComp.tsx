import React, { useState } from "react"
import { open as tauriOpen } from '@tauri-apps/api/dialog';

import { Button } from "../components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from "../components/ui/dialog"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import useLocalStorage, { Config } from "./useLocalStorage"
import { Router } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "../components/ui/select"

import ConfigsComp from "./configsComp"
import { toast } from "sonner"

/**
 * ConnectComp component handles database connection settings,
 * file selection for the AI model, and allows users to create or update configurations.
 */
const ConnectComp = ({ connection, setConnection }: { connection: Config | null, setConnection: (config: Config) => void }) => {
    const { Configs, deleteConfig, selectedConfig, setSelectedConfig, onEdit, setOnEdit, upsertConfig } = useLocalStorage();
    const [open, setOpen] = useState<boolean>(false);

    // Handlers for setting form values
    const sqlKnowledgeHandler = (e: { target: { value: string } }) => {
        setSelectedConfig((prev: Config) => ({
            ...prev,
            sql_knowledge: e.target.value
        }))
    }
    const connectionStringHandler = (e: { target: { value: string } }) => {
        setSelectedConfig((prev: Config) => ({
            ...prev,
            connection_string: e.target.value
        }))
    }

    /**
     * Opens a file selection dialog and sets the AI model path if selected.
     */
    const handleFileSelect = async () => {
        try {
            const selectedFilePath = await tauriOpen({
                multiple: false,
                filters: [{ name: 'All Files', extensions: ['gguf'] }],
            });
            const filePath = Array.isArray(selectedFilePath) ? selectedFilePath[0] : selectedFilePath;
            if (filePath) {
                setSelectedConfig((prevConfig: Config) => ({
                    ...prevConfig,
                    ai_model_path: filePath,
                }));
            }
        } catch (error) {
            console.error('Error selecting file: ', error);
        }
    };

    /**
     * Saves the current configuration to local storage and resets the form.
     * Validates required fields before saving.
     */
    const save = () => {
        if (!selectedConfig.db_type) {
            toast.error("Please choose a database type.");
            return;
        }
        if (!selectedConfig.connection_string) {
            toast.error("Please provide a database connection string.");
            return;
        }
        if (!selectedConfig.ai_model_path) {
            toast.error("Please choose a valid AI model file.");
            return;
        }
        upsertConfig(selectedConfig); // Save or update the config
        setSelectedConfig({
            id: 0,
            db_type: "",
            connection_string: "",
            ai_model_path: "",
            ai_cli_path: "",
            sql_knowledge: "",
        }); // Reset the form
        setOnEdit(false)
        toast.success("Config information has been saved.");
    };

    /**
     * Prepares the form for creating a new configuration.
     */
    const newConfig = () => {
        setSelectedConfig({
            id: 0,
            db_type: "",
            connection_string: "",
            ai_model_path: "",
            ai_cli_path: "",
            sql_knowledge: "",
        });
        setOnEdit(true)
    }

    return (
        <Dialog open={open} onOpenChange={(signal: boolean) => { setOpen(signal); setOnEdit(false); }}>
            <DialogTrigger asChild>
                <div className="flex text-center items-center hover:cursor-pointer">
                    {/* Display connection status */}
                    {connection ? <Router className="text-green-500 h-4 w-4 mr-4" /> : <Router className="text-red-500 h-4 w-4 mr-4" />}
                    <Button variant="outline">Connect</Button>
                </div>
            </DialogTrigger>
            <DialogTitle />
            <DialogContent className="pb-6 gap-10 sm:max-w-[800px]">
                {/* Component for displaying existing configurations */}
                <ConfigsComp setOpen={setOpen} setConnection={setConnection} deleteConfig={deleteConfig} configs={Configs} onEdit={onEdit} setOnEdit={setOnEdit} setSelectedConfig={setSelectedConfig} />
                
                {/* Form for creating or updating a configuration */}
                {onEdit && (
                    <div className="grid gap-4">
                        <div className="items-center gap-4">
                            {selectedConfig.id == 0 ? <div className="font-bold text-lg mb-4">Create a connection</div> : <div className="font-bold text-lg mb-4">Update a connection</div>}
                            
                            {/* Database Type Selector */}
                            <Label htmlFor="connection_string" className="text-right">Database Type:</Label>
                            <Select value={selectedConfig.db_type} onValueChange={(e) => setSelectedConfig(prev => ({ ...prev, db_type: e }))}>
                                <SelectTrigger className="w-[280px]">
                                    <SelectValue placeholder="Select a database type:" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>Database:</SelectLabel>
                                        <SelectItem value="MySQL">MySQL</SelectItem>
                                        <SelectItem value="PostgreSQL">PostgreSQL</SelectItem>
                                        <SelectItem value="SQLite">SQLite</SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Connection String Input */}
                        <div className="items-center gap-4">
                            <Label htmlFor="connection_string" className="text-right">Connection String:</Label>
                            <Input id="connection_string" value={selectedConfig.connection_string} onChange={connectionStringHandler} placeholder="" className="col-span-3" />
                            <p className="text-muted-foreground text-xs mt-2">Please provide the connection string for the database.</p>
                        </div>

                        {/* AI Model File Selector */}
                        <div className='flex items-center'>
                            <Button variant="outline" onClick={handleFileSelect}>Choose AI Model</Button>
                            {selectedConfig.ai_model_path && <div className='ml-4 text-xs text-muted-foreground'>{selectedConfig.ai_model_path} </div>}
                        </div>

                        {/* Optional SQL Knowledge Input */}
                        {/* Hide it now for simplicity */}
                        {/* <div className="items-center gap-4">
                            <Label htmlFor="username" className="text-right">SQL Knowledge (Optional)</Label>
                            <Textarea value={selectedConfig.sql_knowledge} onChange={sqlKnowledgeHandler} id="username" className="col-span-3" />
                            <p className="text-muted-foreground text-xs mt-2">Optional: Provide any knowledge about the database for better performance.</p>
                        </div> */}
                    </div>
                )}

                {/* Save or Create New Config */}
                <DialogFooter>
                    {onEdit ? <Button onClick={save}>Save</Button> : <Button onClick={newConfig}>New</Button>}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default ConnectComp;
