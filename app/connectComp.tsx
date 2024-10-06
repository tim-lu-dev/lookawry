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

const ConnectComp = ({ connection, setConnection }: { connection: Config | null, setConnection: (config: Config) => void }) => {
    const { Configs, deleteConfig, selectedConfig, setSelectedConfig, onEdit, setOnEdit, upsertConfig } = useLocalStorage();
    const [open, setOpen] = useState<boolean>(false);
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
    const handleFileSelect = async () => {
        try {
          // Open the file picker and retrieve the file path
          const selectedFilePath = await tauriOpen({
            multiple: false, // Only allow selecting one file
            filters: [{ name: 'All Files', extensions: ['gguf'] }],
          });
          const filePath = Array.isArray(selectedFilePath) 
            ? selectedFilePath[0]  // If it's an array, only take the first file selected here.
            : selectedFilePath; 
          // Set the selected file path (can be null if the user cancels the dialog)
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
    const save = () => { 
        if (!selectedConfig.db_type) {
            toast.error("Please choose a database type.");
            return;
        }
        if (!selectedConfig.connection_string) {
            toast.error("Please choose a database connection string.");
            return;
        }
        if (!selectedConfig.ai_model_path) {
            toast.error("Please choose a valid ai model file.");
            return;
        }
        upsertConfig(selectedConfig); // Use the upsertRecord method from the hook
        setSelectedConfig({
            id: 0,
            db_type: "",
            connection_string: "",
            ai_model_path: "",
            ai_cli_path:"",
            sql_knowledge: "",
        }); // Reset the form
        setOnEdit(false)
        toast.success("Config information has been saved.")
    };
    const newConfig = () => {
        setSelectedConfig({
            id: 0,
            db_type: "",
            connection_string: "",
            ai_model_path: "",
            ai_cli_path:"",
            sql_knowledge: "",
        });
        setOnEdit(true)
    }

    return (
        <Dialog open={open} onOpenChange={(signal:boolean) => { setOpen(signal);setOnEdit(false); }}>
            <DialogTrigger asChild>
                <div className="flex text-center items-center hover:cursor-pointer">
                    {
                        connection && <Router className="text-green-500 h-4 w-4 mr-4" />
                    }
                    {
                        !connection && <Router className="text-red-500 h-4 w-4 mr-4" />
                    }
                    <Button variant="outline">Connect</Button>
                </div>

            </DialogTrigger>
            <DialogTitle>
            </DialogTitle>
            <DialogContent className="pb-6 gap-10 sm:max-w-[800px]">
                <ConfigsComp setOpen={setOpen} setConnection={setConnection} deleteConfig={deleteConfig} configs={Configs} onEdit={onEdit} setOnEdit={setOnEdit} setSelectedConfig={setSelectedConfig} />
                {
                    onEdit && <div className="grid gap-4">
                        <div className="items-center gap-4">
                            {
                                selectedConfig.id == 0 && <div className=" font-bold text-lg mb-4">Create a connection</div>
                            }
                            {
                                selectedConfig.id != 0 && <div className=" font-bold text-lg mb-4">Update a connection</div>
                            }
                            <Label htmlFor="connection_string" className="text-right">
                                Database Type:
                            </Label>
                            <Select value={selectedConfig.db_type} onValueChange={(e) => setSelectedConfig(prev => ({ ...prev, db_type: e }))} >
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
                            </Select>                    </div>
                        <div className="items-center gap-4">
                            <Label htmlFor="connection_string" className="text-right">
                                Connection String:
                            </Label>
                            <Input id="connection_string" value={selectedConfig.connection_string} onChange={connectionStringHandler} placeholder="" className="col-span-3" />
                            <p className="text-muted-foreground text-xs mt-2">Please provide connection string for database connection.</p>
                        </div>
                        <div className='flex items-center'>
                            <Button variant="outline" onClick={handleFileSelect}>Choose Ai Model</Button>{ selectedConfig.ai_model_path && <div className='ml-4 text-xs text-muted-foreground'>{selectedConfig.ai_model_path} </div>}
                        </div>
                        <div className=" items-center gap-4">
                            <Label htmlFor="username" className="text-right">
                                SQL Knowledge (Optional)
                            </Label>
                            <Textarea value={selectedConfig.sql_knowledge} onChange={sqlKnowledgeHandler} id="username" className="col-span-3" />
                            <p className="text-muted-foreground text-xs mt-2">Leave it blank if you don&apos;t want to be bothered. Feel free to provide any knowledge about database for ideal performance.</p>
                        </div>
                    </div>
                }
                <DialogFooter className="">
                    {
                        onEdit && <Button onClick={save}>Save</Button>
                    }
                    {
                        !onEdit && <Button onClick={newConfig}>New</Button>
                    }
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )

}

export default ConnectComp;