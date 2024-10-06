'use client';

import { Config } from "./useLocalStorage";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter
} from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";

const ConfigComp = ({ configs, onEdit, setOnEdit, setOpen, setSelectedConfig, deleteConfig, setConnection }: {
  configs: Config[],
  onEdit: boolean, 
  setOnEdit: (status:boolean) => void,
  setOpen:(status:boolean) => void,
  setSelectedConfig: (config: Config) => void,
  deleteConfig: (id: number) => void,
  setConnection: (config: Config) => void
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const connectConfig = async (config:Config) => {
    setLoading(true);
    try {
      const { invoke } = await import("@tauri-apps/api");
      const res = await invoke<string>('connect_config', { data: JSON.stringify(config) });
      setConnection(config);
      toast.success("Database connection has been established.");
      setLoading(false);
      setOpen(false);
    } catch (e) {
      setLoading(false);
      toast.error("Database connection cannot be established. " + JSON.stringify(e));
    }
  }
  const editConfig = (id:number) => {
    const config = configs.filter(config => config.id == id)
    if (!config || config.length < 1) {
      toast.error("Cannot find this config.");
      return "err"
    }
    setSelectedConfig(config[0])
    setOnEdit(true)
  }

  return (<div>
    {
      !onEdit && <ScrollArea className="max-h-96 h-full w-full pr-6 " viewportRef={null}>
      <div className="flex flex-col gap-4 justify-start">
        {!configs && "No connection stored, please start by create a new one."}
      {configs && configs.length > 0 && configs.map((config: Config) => (
        <Card key={config.id} className="w-full pt-2">
          <CardContent>
            <p className="font-bold">{config.db_type}</p>
            <p className="">{config.connection_string}</p>
            <p className="mt-2 text-sm text-muted-foreground">{
              config.sql_knowledge.length > 300
                ? config.sql_knowledge.slice(0, 300) + ".."
                : config.sql_knowledge}</p>
            <p className="">{config.ai_model_path}</p>
          </CardContent>
          <CardFooter className="flex justify-between gap-2">
            <div>
            <Button disabled={loading} variant="outline" onClick={() => connectConfig(config)}>Connect<Spinner show={loading} className="ml-2" size="xsmall"/></Button>
            </div>
            <div>
            <Button disabled={loading} variant="link" onClick={() => editConfig(config.id)}>Edit</Button>
            <Button disabled={loading} variant="link" className="hover:text-red-500" onClick={() => {deleteConfig(config.id);toast.warning("Config information has been deleted.")}}>Delete</Button>
            </div>
            </CardFooter>
        </Card>

      ))}
      </div>
      </ScrollArea>
    }
      
      
    


  </div>);
}

export default ConfigComp;