'use client';

import { Config } from "./useLocalStorage";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";

/**
 * ConfigComp component handles displaying, editing, and connecting to
 * saved configurations, as well as deleting them.
 */
const ConfigComp = ({ 
  configs, onEdit, setOnEdit, setOpen, setSelectedConfig, deleteConfig, setConnection 
}: { 
  configs: Config[], 
  onEdit: boolean, 
  setOnEdit: (status: boolean) => void, 
  setOpen: (status: boolean) => void, 
  setSelectedConfig: (config: Config) => void, 
  deleteConfig: (id: number) => void, 
  setConnection: (config: Config) => void 
}) => {
  const [loading, setLoading] = useState<boolean>(false);

  /**
   * Connect to the selected config's database by invoking a backend API.
   */
  const connectConfig = async (config: Config) => {
    setLoading(true);
    try {
      const { invoke } = await import("@tauri-apps/api");
      const res = await invoke<string>('connect_config', { data: JSON.stringify(config) });
      setConnection(config);
      toast.success("Database connection has been established.");
      setLoading(false);
      setOpen(false); // Close the dialog after successful connection
    } catch (e) {
      setLoading(false);
      toast.error("Database connection cannot be established. " + JSON.stringify(e));
    }
  };

  /**
   * Edit an existing config by loading its data into the form for editing.
   */
  const editConfig = (id: number) => {
    const config = configs.filter(config => config.id === id);
    if (!config || config.length < 1) {
      toast.error("Cannot find this config.");
      return "err";
    }
    setSelectedConfig(config[0]);
    setOnEdit(true); // Open edit mode
  };

  return (
    <div>
      {/* Display list of saved configs if not in edit mode */}
      {!onEdit && (
        <ScrollArea className="max-h-96 h-full w-full pr-6" viewportRef={null}>
          <div className="flex flex-col gap-4 justify-start">
            {/* Display message if no configs are available */}
            {configs.length === 0 && "No connection stored, please start by creating a new one."}

            {/* Render each config in a card layout */}
            {configs.length > 0 && configs.map((config: Config) => (
              <Card key={config.id} className="w-full pt-2">
                <CardContent>
                  <p className="font-bold">{config.db_type}</p>
                  <p>{config.connection_string}</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {config.sql_knowledge.length > 300
                      ? config.sql_knowledge.slice(0, 300) + ".."
                      : config.sql_knowledge}
                  </p>
                  <p>{config.ai_model_path}</p>
                </CardContent>
                <CardFooter className="flex justify-between gap-2">
                  {/* Connect Button */}
                  <div>
                    <Button 
                      disabled={loading} 
                      variant="outline" 
                      onClick={() => connectConfig(config)}
                    >
                      Connect
                      <Spinner show={loading} className="ml-2" size="xsmall" />
                    </Button>
                  </div>

                  {/* Edit and Delete Buttons */}
                  <div>
                    <Button 
                      disabled={loading} 
                      variant="link" 
                      onClick={() => editConfig(config.id)}
                    >
                      Edit
                    </Button>
                    <Button 
                      disabled={loading} 
                      variant="link" 
                      className="hover:text-red-500" 
                      onClick={() => {
                        deleteConfig(config.id);
                        toast.warning("Config information has been deleted.");
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default ConfigComp;
