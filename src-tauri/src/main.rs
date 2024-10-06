// Prevents additional console window on Windows in release, DO NOT REMOVE!!
// #![windows_subsystem = "console"]
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod engine;

use engine::{
    config::{Config, DbType},
    errors::AppError,
    Engine,
};
use serde::Deserialize;
use serde::Serialize;
use serde_json::Value;
use std::{
    env::consts::OS, io::{self, Write}, iter::Map, sync::Arc
};
use tauri::{command, App, State};
use tokio::sync::Mutex;

#[derive(Serialize, Deserialize)]
struct Response<T> {
    sql: String,
    question: String,
    data: T,
}

#[tauri::command]
async fn connect_config(
    engine: State<'_, Arc<Mutex<Engine>>>,  // Using Tauri State to access shared state
    data: String,
    handle: tauri::AppHandle,  // Added handle as parameter to resolve resources
) -> Result<String, AppError> {
    // Determine the platform
    let platform = OS;
    
    // Base file path
    let mut resource_file = "bin/llama-cli".to_string();
    
    // Append `.exe` if the platform is Windows
    if platform == "windows" {
        resource_file.push_str(".exe");
    }

    let resource_path = handle.path_resolver()
                .resolve_resource(&resource_file)
                .expect("failed to resolve resource");
    // Deserialize the incoming JSON data into a serde_json::Value
    let mut config: Config = match serde_json::from_str(&data) {
        Ok(config) => config,
        Err(e) => return Err(AppError::ConfigError(e.to_string())),
    };

    config.ai_cli_path = match resource_path.to_str() {
        Some(res) => res.to_string(),
        None => "".to_string()
    };

    // Access the engine and lock it for modification (using Tokio's Mutex)
    let mut engine = engine.lock().await; 
    match engine.load_config(config).await {
        Ok(_) => Ok("{\"msg\": \"success\"}".to_string()),
        Err(e) => return Err(AppError::ConfigError(e.to_string())),
    }
}

#[command]
async fn ask(
    engine: State<'_, Arc<Mutex<Engine>>>,
    question: String,
) -> Result<String, AppError> {
    let mut engine = engine.lock().await;

    //Get SQL from ai
    let sql = &mut engine
        .ask_for_sql(question.to_string())
        .await
        .map_err(|e| {
            AppError::EngineExecutionError(e.to_string())
        })?;

    //Running query and get result
    let result = engine.query(&sql.to_string()).await.map_err(|e| {
        AppError::QueryError(e.to_string())
    })?;

    let res = Response {
        question: question,
        sql: (&sql).to_string(),
        data: result,
    };
    let res_json = match serde_json::to_string(&res) {
        Ok(res) => res,
        Err(e) => return Err(AppError::ExecutionError(e.to_string())),
    };
    Ok(res_json)
}

#[command]
async fn ask_for_sql(
    engine: State<'_, Arc<Mutex<Engine>>>,
    data: String,
    question: String,
) -> Result<String, AppError> {
    let mut engine = engine.lock().await;
    // Log and propagate any errors
    let result = &mut engine
        .ask_for_sql(question.to_string())
        .await
        .map_err(|e| {
            AppError::EngineExecutionError(e.to_string())
        })?;

    let res = Response {
        question: question,
        sql: result.to_string(),
        data: (),
    };
    let res_json = match serde_json::to_string(&res) {
        Ok(res) => res,
        Err(e) => return Err(AppError::ExecutionError(e.to_string())),
    };
    Ok(res_json)
}

#[command]
async fn query(
    engine: State<'_, Arc<Mutex<Engine>>>,
    sql: String,
) -> Result<String, AppError> {
    let mut engine = engine.lock().await;
    // Log and propagate any errors
    let result = engine.query(&sql.to_string()).await.map_err(|e| {
        AppError::QueryError(e.to_string())
    })?;
    let res = Response {
        question: "".to_string(),
        sql: sql,
        data: result,
    };
    let res_json = match serde_json::to_string(&res) {
        Ok(res) => res,
        Err(e) => return Err(AppError::ExecutionError(e.to_string())),
    };
    Ok(res_json)
}
fn main() {
    let engine = Engine::new();
    let engine = Arc::new(Mutex::new(engine));

    tauri::Builder::default()
        .manage(engine.clone())
        .invoke_handler(tauri::generate_handler![
            connect_config,
            ask,
            ask_for_sql,
            query
        ])
        .run(tauri::generate_context!())
        .expect("error while running Tauri application");
}
