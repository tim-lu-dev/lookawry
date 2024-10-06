pub mod config;
pub mod errors;
pub mod row_parser;

use config::{Config, DbType};
use errors::AppError;

use regex::Regex;

use serde_json::Value as JsonValue;

use sqlx::mysql::MySqlRow;
use sqlx::postgres::PgRow;
use sqlx::sqlite::SqliteRow;
use sqlx::{MySql, Pool, Postgres, Row, Sqlite};
use tauri::App;

use core::str;
use std::io::{BufRead, Read, Write};
use std::process::Stdio;
use std::time::{Duration, Instant};
use std::{fmt, thread};

use tokio::io::{AsyncBufReadExt, AsyncReadExt, AsyncWriteExt, BufReader};
use tokio::process::Command;
pub struct Engine {
    pool: Option<DatabasePool>,
    config: Option<Config>,
    ai_process: Option<std::process::Child>,
}

enum DatabasePool {
    MySQL(Pool<MySql>),
    PostgreSQL(Pool<Postgres>),
    SQLite(Pool<Sqlite>),
}

impl Engine {
    pub fn new() -> Self {
        let engine = Engine {
            pool: None,
            config: None,
            ai_process: None,
        };
        // let _connection = engine.load_config(config).await?;
        // let _ai = engine.load_ai_process();
        engine
    }
    pub fn load_ai_process(&mut self) -> Result<String, AppError> {
        if let Some(ref mut config) = self.config {
            config.ai_cli_path = String::from("binaries/llama/llama-cli.exe");
            config.ai_model_path = String::from("binaries/phi3.gguf");

            // Build the prompt string using the available config values
            let mut prompt = String::new();
            prompt.push_str("You are a helpful assistant. You will generate proper SQL statements for me based on the question user asked. For running in ");
            prompt.push_str(&config.db_type.to_string());

            // Spawn the AI process using the config values
            let ai_process = std::process::Command::new(&config.ai_cli_path)
                .arg("-m")
                .arg(&config.ai_model_path)
                .arg("-p")
                .arg(format!("{}", prompt))
                .arg("-n")
                .arg("128")
                .arg("-cnv")
                .stdin(Stdio::piped())
                .stdout(Stdio::piped())
                .stderr(Stdio::piped())
                .spawn();
            match ai_process {
                Ok(mut child) => {
                    // Borrow stdout mutably without taking ownership
                    if let Some(stdout) = &mut child.stdout {
                        let mut stdout_reader = std::io::BufReader::new(stdout);
                        let mut line = String::new();
                        let _ = stdout_reader.read_line(&mut line);
                    }

                    self.ai_process = Some(child);
                    Ok("ok".to_string())
                }
                Err(e) => {
                    Err(AppError::EngineExecutionError(e.to_string()))
                }
            }
        } else {
            Err(AppError::ConfigError(
                "Configuration is missing. Cannot start AI process.".to_string(),
            ))
        }
    }

    pub fn talk_to_ai(&mut self, question: String) -> Result<String, AppError> {
        if let Some(config) = &self.config {
            let mut prompt = String::new();

            prompt.push_str(
                "<|system|>You are a helpful assistant based on the following knowledge: ",
            );
            prompt.push_str(config.sql_knowledge.as_str());
            prompt.push_str(". You will generate proper SQL statements for ");
            prompt.push_str(config.db_type.to_string().as_str());
            prompt.push_str(".<|end|>");
            prompt.push_str("<|user|>");
            prompt.push_str(question.as_str());
            prompt.push_str("<|end|>");
            prompt.push_str(".<|assistant|>");

            // Spawn the AI process using the config values
            let ai_process = std::process::Command::new(&config.ai_cli_path)
                .arg("-m")
                .arg(&config.ai_model_path)
                .arg("-p")
                .arg(format!("{}", prompt))
                .arg("-n".to_string())
                .arg("128".to_string())
                .stdin(Stdio::piped())
                .stdout(Stdio::piped())
                .stderr(Stdio::piped())
                .spawn();
            let mut result = String::new();
            match ai_process {
                Ok(mut child) => {
                    if let Some(stdout) = child.stdout.take() {
                        let reader = std::io::BufReader::new(stdout);
                        for line in reader.lines() {
                            match line {
                                Ok(content) => {
                                    result = result + " " + &content;
                                }
                                Err(e) => return Err(AppError::EngineExecutionError(e.to_string()))
                            }
                        }
                    };
                }
                Err(e) => {
                    return Err(AppError::EngineExecutionError(
                        "Ai engine cannot start.".to_string(),
                    ));
                }
            }
            Ok(result)
        } else {
            return Err(AppError::ConfigError("Config not valid.".to_string()));
        }
    }

    /// Load the config, initialize the database pool, and start the AI CLI process
    pub async fn load_config(&mut self, config: Config) -> Result<String, AppError> {
        //get config nice and clean
        self.config = Some(Config {
            ai_cli_path: config.ai_cli_path,
            ai_model_path: config.ai_model_path,
            sql_knowledge: config.sql_knowledge,
            db_type: config.db_type.clone(),
            connection_string: config.connection_string.clone(),
        });
        if let Some(config) = &mut self.config {
            match config.db_type {
                DbType::MySQL => {
                    let pool = Pool::<MySql>::connect(&config.connection_string)
                        .await
                        .map_err(|e| {
                            AppError::ConnectionError(format!("MySQL connection error: {}", e))
                        })?;
                    self.pool = Some(DatabasePool::MySQL(pool));
                    let knowledge = self.get_meta().await?;

                    // Re-borrow `self.config` mutably to update `sql_knowledge`
                    if let Some(config) = &mut self.config {
                        config.sql_knowledge += ". sql table and constrains information:";
                        config.sql_knowledge += &serde_json::to_string(&knowledge)
                            .map_err(|e| AppError::QueryError(e.to_string()))?
                            .to_string();
                    }
                },
                DbType::PostgreSQL => {
                    // Clone data needed after await
                    let connection_string = config.connection_string.clone();
                    let current_sql_knowledge = config.sql_knowledge.clone();

                    // Release mutable borrow of `config` before the await point
                    drop(config);

                    let pool = Pool::<Postgres>::connect(&connection_string)
                        .await
                        .map_err(|e| {
                            AppError::ConnectionError(format!("PostgreSQL connection error: {}", e))
                        })?;

                    self.pool = Some(DatabasePool::PostgreSQL(pool));

                    let knowledge = self.get_meta().await?;

                    // Re-borrow `self.config` mutably to update `sql_knowledge`
                    if let Some(config) = &mut self.config {
                        config.sql_knowledge += ". sql table and constrains information:";
                        config.sql_knowledge += &serde_json::to_string(&knowledge)
                            .map_err(|e| AppError::QueryError(e.to_string()))?
                            .to_string();
                    }
                },
                DbType::SQLite => {
                    let current_sql_knowledge = config.sql_knowledge.clone();
                    let pool = Pool::<Sqlite>::connect(&config.connection_string)
                        .await
                        .map_err(|e| {
                            AppError::ConnectionError(format!("SQLite connection error: {}", e))
                        })?;
                    self.pool = Some(DatabasePool::SQLite(pool));

                    let knowledge = self.get_meta().await?;

                    // Re-borrow `self.config` mutably to update `sql_knowledge`
                    if let Some(config) = &mut self.config {
                        config.sql_knowledge += ". sql table and constrains information:";
                        config.sql_knowledge += &serde_json::to_string(&knowledge)
                            .map_err(|e| AppError::QueryError(e.to_string()))?
                            .to_string();
                    }
                }
            }

            Ok("Config loaded.".to_string())
        } else {
            return Err(AppError::ConfigError("no config".to_string()));
        }
    }
    // Execute a query and return the result as JSON
    pub async fn query(&self, query: &str) -> Result<Vec<JsonValue>, AppError> {
        match &self.pool {
            Some(DatabasePool::MySQL(pool)) => {
                let rows: Vec<MySqlRow> = match sqlx::query(query).fetch_all(pool).await {
                    Ok(rows) => rows,
                    Err(e) => return Err(AppError::SqlReadError(e.to_string())),
                };

                let mut result = Vec::new();
                for row in rows {
                    let json_value = match row_parser::MySQLParser::json(&row).await {
                        Ok(value) => value,
                        Err(e) => return Err(AppError::SqlReadError(e.to_string())),
                    };
                    result.push(json_value);
                }
                Ok(result)
            }
            Some(DatabasePool::PostgreSQL(pool)) => {
                let rows: Vec<PgRow> = match sqlx::query(query).fetch_all(pool).await {
                    Ok(rows) => rows,
                    Err(e) => return Err(AppError::SqlReadError(e.to_string())),
                };

                let mut result = Vec::new();
                for row in rows {
                    let json_value = match row_parser::PostgresParser::json(&row).await {
                        Ok(value) => value,
                        Err(e) => return Err(AppError::SqlReadError(e.to_string())),
                    };
                    result.push(json_value);
                }
                Ok(result)
            }
            Some(DatabasePool::SQLite(pool)) => {
                let rows: Vec<SqliteRow> = match sqlx::query(query).fetch_all(pool).await {
                    Ok(rows) => rows,
                    Err(e) => return Err(AppError::SqlReadError(e.to_string())),
                };

                let mut result = Vec::new();
                for row in rows {
                    let json_value = match row_parser::SQLiteParser::json(&row).await {
                        Ok(value) => value,
                        Err(e) => return Err(AppError::SqlReadError(e.to_string())),
                    };
                    result.push(json_value);
                }
                Ok(result)
            }
            None => Err(AppError::ConnectionError(
                "No database connection established".to_string(),
            )),
        }
    }
    pub async fn get_meta(&self) -> Result<Vec<JsonValue>, AppError> {
        match &self.pool {
            Some(DatabasePool::PostgreSQL(pool)) => {
                self.query(
                    r#"SELECT 
                    c.table_name,
                    c.column_name,
                    c.data_type,
                    tc.constraint_type
                FROM 
                    information_schema.columns c
                LEFT JOIN 
                    information_schema.key_column_usage kcu
                    ON c.table_name = kcu.table_name 
                    AND c.column_name = kcu.column_name
                    AND c.table_schema = kcu.table_schema
                LEFT JOIN 
                    information_schema.table_constraints tc
                    ON kcu.constraint_name = tc.constraint_name
                    AND kcu.table_schema = tc.table_schema
                WHERE 
                    c.table_schema = 'public'
                ORDER BY 
                    c.table_name, 
                    c.ordinal_position;"#,
                )
                .await
            }
            Some(DatabasePool::MySQL(pool)) => {
                // Safely get a reference to the Config
                let config = self
                    .config
                    .as_ref()
                    .ok_or_else(|| AppError::ConfigError("No config found".to_string()))?;

                // Split the connection string to extract the database name
                let parts: Vec<&str> = config.connection_string.split('/').collect();
                let db_name = parts.last().ok_or_else(|| {
                    AppError::ConfigError("No database name in connection string".to_string())
                })?;

                // Clone db_name to own it and avoid lifetime issues
                let db_name = db_name.to_string();

                // Optional: Sanitize db_name to prevent SQL injection
                if !db_name.chars().all(|c| c.is_alphanumeric() || c == '_') {
                    return Err(AppError::ConfigError("Invalid database name".to_string()));
                }

                // Release the borrow on `config` before the async call
                drop(config);

                // Construct the query
                let query = format!(
                    r#"SELECT 
                        c.table_name,
                        c.column_name,
                        c.data_type,
                        tc.constraint_type
                    FROM 
                        information_schema.columns c
                    LEFT JOIN 
                        information_schema.key_column_usage kcu
                        ON c.table_name = kcu.table_name 
                        AND c.column_name = kcu.column_name
                        AND c.table_schema = kcu.table_schema
                    LEFT JOIN 
                        information_schema.table_constraints tc
                        ON kcu.constraint_name = tc.constraint_name
                        AND kcu.table_schema = tc.table_schema
                    WHERE 
                        c.table_schema = '{}'
                    ORDER BY 
                        c.table_name, 
                        c.ordinal_position;
                    "#,
                    db_name
                );

                // Perform the async query
                self.query(&query).await
            }
            Some(DatabasePool::SQLite(pool)) => {
                let mut lines = Vec::new();
                // Query to get all table names from the SQLite database
    match sqlx::query("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';").fetch_all(pool).await {
        Ok(res) => {
            // Iterate over each table name
            for row in res {
                let table_name: String = match row.try_get("name") {
                    Ok(name) => name,
                    Err(e) => return Err(AppError::QueryError(e.to_string()))
                };// Extract table name;
                
                // Query for each table's column info using PRAGMA table_info
                let query = format!("select name, type from pragma_table_info('{}')", table_name); 
                match sqlx::query(query.as_str()).fetch_all(pool).await {
                    Ok(table_info) => {
                        // Push each column's info into lines vector
                        for line in table_info {
                            let name: String = line.try_get("name").unwrap_or_default(); // Extract the name
                            let col_type: String = line.try_get("type").unwrap_or_default(); // Extract the type
                        
                            // Construct a serde_json::Value object (JSON-like object)
                            let column_info = serde_json::json!({
                                "table_name": table_name,
                                "name": name,
                                "type": col_type
                            });
                        
                            // Push the JSON object to the lines vector
                            lines.push(column_info);
                        }
                    },
                    Err(e) => {
                        return Err(AppError::QueryError(e.to_string())) // Handle errors
                    }
                }
            }
            // Return the collected list of lines (column info)
            Ok(lines)
        },
        Err(e) => {
            return Err(AppError::QueryError(e.to_string())) // Handle error in table name query
        }
    }
                // let list = match self.query("select name from table_list;").await {
                //     Ok(res) => {
                //         for name in res {
                //             match self.query(fmt("select name, type from pragma_table_info('{}')", name)?.as_str()).await {
                //                 Ok(line) => lines.push(line)
                //                 Err(e) => return Err(AppError::QueryError(e.to_string()))
                //             }
                //             lines.push(line)
                //         }
                //         return Ok(lines);
                //     },
                //     Err(e) => return Err(AppError::QueryError(e.to_string()))
                // };  
            }
            _ => return Err(AppError::QueryError("No such pool".to_string())),
        }
    }

    // Ask function that interacts with the AI process, extracts the SQL, and runs the query
    pub async fn ask(&mut self, question: String) -> Result<Vec<JsonValue>, AppError> {
        // Run the extracted SQL query and return the result
        let extracted_sql = &self.ask_for_sql(question).await?;
        self.query(&extracted_sql).await
    }

    // Ask function that interacts with the AI process, extracts the SQL
    pub async fn ask_for_sql(&mut self, question: String) -> Result<String, AppError> {
        let ai_response = match self.talk_to_ai(question) {
            Ok(res) => res,
            Err(e) => return Err(e),
        };

        // Filter and extract the SQL query from the AI response
        self.extract_sql(&ai_response)
    }
    // Helper function to extract the SQL query from the AI process result
    fn extract_sql(&self, response: &str) -> Result<String, AppError> {
        // Use a case-insensitive regex to capture the SQL between "select" and the first ";"
        let re = Regex::new(r"(?i)select.*?;")
            .map_err(|e| AppError::ExecutionError(format!("Failed to compile regex: {}", e)))?;

        if let Some(matched) = re.find(response) {
            Ok(matched.as_str().to_string())
        } else {
            Err(AppError::ExecutionError(
                "Failed to extract SQL query from AI response".to_string(),
            ))
        }
    }
}

// Tests for the sloppyview engine
#[cfg(test)]
mod tests {
    // Import everything from the outer scope of the module
    use super::*;
    const query :&str = "select table_name, column_name, data_type from information_schema.columns where table_schema = 'public' order by table_name, ordinal_position;";
    #[tokio::test]
    async fn test_engine_create() {
        let config = Config {
            db_type: DbType::PostgreSQL,
            connection_string: String::from("postgresql://postgres:976520@localhost:5432/test"),
            ai_cli_path: String::from("binaries/llama/llama-cli.exe"),
            ai_model_path: String::from("binaries/phi3.gguf"),
            sql_knowledge: "".to_string(),
        };

        // Await the result of the async `Engine::new` function
        let mut engine = Engine::new();
        engine
            .load_config(config)
            .await
            .expect("Failed to load config.");
        let result = engine
            .ask_for_sql("can u get me all data for students?".to_string())
            .await;
    }
}
