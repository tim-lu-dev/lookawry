use std::fmt;

use serde::Deserialize;

#[derive(Debug, Deserialize, Clone)]
pub enum DbType {
    MySQL,
    PostgreSQL,
    SQLite,
}

// Implement the Display trait for DbType
impl fmt::Display for DbType {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        let db_str = match self {
            DbType::MySQL => "MySQL",
            DbType::PostgreSQL => "PostgreSQL",
            DbType::SQLite => "SQLite",
        };
        write!(f, "{}", db_str)
    }
}

#[derive(Debug, Deserialize, Clone)]
pub struct Config {
    pub db_type: DbType,
    pub connection_string: String,
    pub ai_cli_path: String,
    pub ai_model_path: String,
    pub sql_knowledge: String,
}
