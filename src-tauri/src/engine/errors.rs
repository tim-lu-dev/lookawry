use serde::Serialize;
use serde_json::json;
use thiserror::Error;

#[derive(Error, Debug, Serialize)]
pub enum AppError {
    #[error("Failed to use config information: {0}")]
    ConfigError(String),

    #[error("Failed to read SQL files: {0}")]
    SqlReadError(String),

    #[error("File IO error: {0}")]
    IOError(String),

    #[error("Failed to execute engine: {0}")]
    EngineExecutionError(String),

    #[error("Failed to query database: {0}")]
    QueryError(String),

    #[error("Failed to start server: {0}")]
    ServerError(String),

    #[error("Connection error: {0}")]
    ConnectionError(String),

    #[error("Execution error: {0}")]
    ExecutionError(String),

    #[error("Unknown error")]
    UnknownError,
}

// Implement From for std::io::Error so we can convert it to AppError::IOError
impl From<std::io::Error> for AppError {
    fn from(error: std::io::Error) -> Self {
        AppError::IOError(error.to_string()) // Map std::io::Error to AppError::IOError
    }
}

// Implement a method to convert the error into a JSON string
impl AppError {
    pub fn to_json(&self) -> String {
        let (err, msg) = match self {
            // Use `serde_json::json!` to create a JSON representation of the error
            AppError::ConfigError(msg) => ("ConfigError", msg.clone()),
            AppError::SqlReadError(msg) => ("SqlReadError", msg.clone()),
            AppError::IOError(msg) => ("IOError", msg.clone()),
            AppError::EngineExecutionError(msg) => ("EngineExecutionError", msg.clone()),
            AppError::QueryError(msg) => ("QueryError", msg.clone()),
            AppError::ServerError(msg) => ("ServerError", msg.clone()),
            AppError::ConnectionError(msg) => ("QueryError", msg.clone()),
            AppError::ExecutionError(msg) => ("ServerError", msg.clone()),
            AppError::UnknownError => ("UnknownError", "An unknown error occurred.".to_string()),
        };
        let json: serde_json::Value = json!({
            "err": err,
            "msg": msg
        });
        json.to_string()
    }
}

// Alias for Result that uses AppError as the error type
pub type Result<T> = std::result::Result<T, AppError>;
