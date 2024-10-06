"use client";

import { useEffect, useState } from "react";

// Define the Config type
export interface Config {
    id: number;
    db_type: string;
    connection_string: string;
    ai_cli_path: string,
    ai_model_path: string;
    sql_knowledge: string;
}
export interface Result {
    err: string,
    msg: string,
    data: unknown;
    sql: string;
    question: string;
}
// Utility to get all Configs from Local Storage
const getAllConfigs = (): Config[] => {
    const configs = localStorage.getItem('configs');
    return configs ? JSON.parse(configs) : [];
};

// Utility to get all model path from Local Storage
const getModelPath = () => {
    const path = localStorage.getItem('modelPath');
    if (path) {
        return path;
    }
    return "";
};

// Utility to get the largest id from the current list and return id + 1 for insertion
const getNextId = (configs: Config[]): number => {
    const maxId = configs.reduce((max, config) => (config.id > max ? config.id : max), 0);
    return maxId + 1;
};
// Custom hook to manage Configs in Local Storage
const useLocalStorage = () => {
    const [modelPath, setModelPath] = useState<string>("");
    const [results, setResults ] = useState<Result[]>([]);
    const [Configs, setConfigs] = useState<Config[]>([]);
    const [connection,setConnection] = useState<Config | null>(null);
    const [selectedConfig, setSelectedConfig] = useState<Config>({
        id: 0,
        db_type: "",
        connection_string: "",
        ai_cli_path: "",
        ai_model_path: "",
        sql_knowledge: "",
      });
    const [onEdit, setOnEdit] = useState<boolean>(false)

    // Load Configs from Local Storage on component mount
    useEffect(() => {
        setConfigs(getAllConfigs());
        setModelPath(getModelPath());
    }, []);

    const updateModelPath = (path: string) => {
        setModelPath(path)
        localStorage.setItem('modelPath', path);
    }
    /**
     * Upsert function to insert or update a Config
     * If the Config exists, update it; if not, insert it.
     */
    const upsertConfig = (newConfig: Config | null) => {
        if (!newConfig) {
            return false;
        }
        const currentConfigs = getAllConfigs();
        if (newConfig.id == 0) {
            // Insert new Config with the next available ID
            newConfig.id = getNextId(currentConfigs);
            currentConfigs.push({ ...newConfig });
        } else {
            const existingConfigIndex = currentConfigs.findIndex(Config => Config.id === newConfig.id);
            if (existingConfigIndex >= 0) {
                // Update existing Config
                currentConfigs[existingConfigIndex] = { ...currentConfigs[existingConfigIndex], ...newConfig };
            } 
        }
        localStorage.setItem('configs', JSON.stringify(currentConfigs));
        setConfigs(currentConfigs);
    };

    /**
     * Delete a Config by its id
     */
    const deleteConfig = (id: number) => {
        const updatedConfigs = Configs.filter(Config => Config.id !== id);
        localStorage.setItem('configs', JSON.stringify(updatedConfigs));
        setConfigs(updatedConfigs);
    };

    /**
     * Get all Configs from the current state
     */
    const getConfigs = (): Config[] => {
        return Configs;
    };

    return { connection, setConnection, modelPath, results, setResults, selectedConfig, setSelectedConfig, onEdit, setOnEdit, Configs, upsertConfig,updateModelPath, deleteConfig, getConfigs };
};

export default useLocalStorage;