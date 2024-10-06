use std::path::PathBuf;
use crate::config::Config;
use crate::errors::AppError;
use walkdir::WalkDir;

pub fn read_sql_files(path :String ) -> Result<String, AppError> {
    let mut sql_data = String::new();
    let sql_path = PathBuf::from(path);
    for entry in WalkDir::new(sql_path) {
        let entry = entry.map_err(|e| AppError::SqlReadError(e.to_string()))?;
        if entry.file_type().is_file() {
            let file_content = std::fs::read_to_string(entry.path())?;
            sql_data.push_str(&file_content);
            sql_data.push('\n');
        }
    }
    Ok(sql_data)
}
