// Prevents additional console window on Windows in release mode, DO NOT REMOVE!!
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
    env::consts::OS,
    io::{self, Write},
    sync::Arc,
};
use tauri::{command, App, State};
use tokio::sync::Mutex;

#[derive(Serialize, Deserialize)]
struct Response<T> {
    sql: String,
    question: String,
    data: T,
}

/**
 * Command to connect to a database configuration.
 * This loads a configuration into the engine and resolves the AI CLI path.
 */
#[tauri::command]
async fn connect_config(
    engine: State<'_, Arc<Mutex<Engine>>>, // Shared engine state
    data: String,
    handle: tauri::AppHandle, // Tauri app handle for resolving resources
) -> Result<String, AppError> {
    // Determine the current platform (Windows, Linux, macOS)
    let platform = OS;

    // Set base CLI resource file path
    let mut resource_file = "bin/llama-cli".to_string();

    // Append `.exe` if the platform is Windows
    if platform == "windows" {
        resource_file.push_str(".exe");
    }

    // Resolve the AI CLI resource path
    let resource_path = handle
        .path_resolver()
        .resolve_resource(&resource_file)
        .expect("failed to resolve resource");

    // Deserialize the incoming JSON data into a Config object
    let mut config: Config = match serde_json::from_str(&data) {
        Ok(config) => config,
        Err(e) => return Err(AppError::ConfigError(e.to_string())),
    };

    // Set the AI CLI path
    config.ai_cli_path = match resource_path.to_str() {
        Some(res) => res.to_string(),
        None => "".to_string(),
    };

    // Lock the engine and load the configuration
    let mut engine = engine.lock().await;
    match engine.load_config(config).await {
        Ok(_) => Ok("{\"msg\": \"success\"}".to_string()),
        Err(e) => Err(AppError::ConfigError(e.to_string())),
    }
}

/**
 * Command to ask a question, retrieve an SQL query, and execute it.
 * Returns both the SQL query and its execution result.
 */
#[command]
async fn ask(engine: State<'_, Arc<Mutex<Engine>>>, question: String) -> Result<String, AppError> {
    let mut engine = engine.lock().await;

    // Generate SQL query from AI model based on the question
    let sql = &mut engine
        .ask_for_sql(question.to_string())
        .await
        .map_err(|e| AppError::EngineExecutionError(e.to_string()))?;

    // Execute the generated SQL query
    let result = engine
        .query(&sql.to_string())
        .await
        .map_err(|e| AppError::QueryError(e.to_string()))?;

    // Create response structure with the question, SQL query, and result
    let res = Response {
        question,
        sql: sql.to_string(),
        data: result,
    };

    // Serialize response into JSON
    let res_json = match serde_json::to_string(&res) {
        Ok(res) => res,
        Err(e) => return Err(AppError::ExecutionError(e.to_string())),
    };
    Ok(res_json)
}

/**
 * Command to ask for an SQL query based on a question without executing it.
 * Returns only the SQL query.
 */
#[command]
async fn ask_for_sql(
    engine: State<'_, Arc<Mutex<Engine>>>,
    data: String,
    question: String,
) -> Result<String, AppError> {
    let mut engine = engine.lock().await;

    // Generate SQL query from AI model based on the question
    let result = &mut engine
        .ask_for_sql(question.to_string())
        .await
        .map_err(|e| AppError::EngineExecutionError(e.to_string()))?;

    // Create response structure with the SQL query
    let res = Response {
        question,
        sql: result.to_string(),
        data: (),
    };

    // Serialize response into JSON
    let res_json = match serde_json::to_string(&res) {
        Ok(res) => res,
        Err(e) => return Err(AppError::ExecutionError(e.to_string())),
    };
    Ok(res_json)
}

/**
 * Command to execute a raw SQL query directly.
 * Returns the query result.
 */
#[command]
async fn query(engine: State<'_, Arc<Mutex<Engine>>>, sql: String) -> Result<String, AppError> {
    let mut engine = engine.lock().await;

    // Execute the SQL query
    let result = engine
        .query(&sql.to_string())
        .await
        .map_err(|e| AppError::QueryError(e.to_string()))?;

    // Create response structure with the SQL query and result
    let res = Response {
        question: "".to_string(),
        sql,
        data: result,
    };

    // Serialize response into JSON
    let res_json = match serde_json::to_string(&res) {
        Ok(res) => res,
        Err(e) => return Err(AppError::ExecutionError(e.to_string())),
    };
    Ok(res_json)
}

/**
 * Main entry point for the Tauri application.
 * Initializes the engine and registers commands.
 */
fn main() {
    // Create a new engine instance wrapped in Arc and Mutex for shared access
    let engine = Engine::new();
    let engine = Arc::new(Mutex::new(engine));

    // Initialize Tauri application and register commands
    tauri::Builder::default()
        .manage(engine.clone()) // Manage shared engine state
        .invoke_handler(tauri::generate_handler![
            connect_config,
            ask,
            ask_for_sql,
            query
        ]) // Register command handlers
        .run(tauri::generate_context!()) // Run the Tauri application
        .expect("error while running Tauri application");
}
