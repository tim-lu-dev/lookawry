use std::str::FromStr;

use bigdecimal::BigDecimal;
use serde_json::Value;
use sqlx::error::Error;
use sqlx::{mysql::MySqlRow, postgres::PgRow, sqlite::SqliteRow, Column, Row, TypeInfo};
use rust_decimal::Decimal;  // Use Decimal from rust_decimal crate

pub struct SQLiteParser;

impl SQLiteParser {
    pub async fn json(row: &SqliteRow) -> Result<Value, Error> {
        let mut json_object = serde_json::Map::new();

        for column in row.columns() {
            let column_name = column.name();
            let column_type = column.type_info().name();

            let value = match column_type {
                "INTEGER" => {
                    let val: i64 = row.try_get(column_name)?;
                    Value::Number(val.into())
                }
                "TEXT" => {
                    let val: String = row.try_get(column_name)?;
                    Value::String(val)
                }
                "REAL" => {
                    let val: f64 = row.try_get(column_name)?;
                    Value::Number(serde_json::Number::from_f64(val).unwrap())
                }
                "BOOLEAN" => {
                    let val: bool = row.try_get(column_name)?;
                    Value::Bool(val)
                }
                "DATE" => {
                    let val: Option<chrono::NaiveDate> = row.try_get(column_name)?;
                    val.map_or(Value::Null, |v| Value::String(v.to_string()))
                }
                "DATETIME" => {
                    let val: String = row.try_get(column_name)?;
                    Value::String(val.to_string())
                }
                _ => {
                    Value::Null
                }
            };
            json_object.insert(column_name.to_string(), value);
        }

        Ok(Value::Object(json_object))
    }
}

pub struct PostgresParser;

impl PostgresParser {
    pub async fn json(row: &PgRow) -> Result<Value, Error> {
        let mut json_object = serde_json::Map::new();
    
        for column in row.columns() {
            let column_name = column.name();
            let column_type = column.type_info().name();
            
            let value = match column_type {
                "INT4" => {
                    let val: Option<i32> = row.try_get(column_name)?;
                    val.map_or(Value::Null, |v| Value::Number(v.into()))
                }
                "INT2" => {
                    let val: Option<i16> = row.try_get(column_name)?;
                    val.map_or(Value::Null, |v| Value::Number(v.into()))
                }
                "INT8" => {
                    let val: Option<i64> = row.try_get(column_name)?;
                    val.map_or(Value::Null, |v| Value::Number(v.into()))
                }
                "VARCHAR" | "TEXT" | "CHAR" | "NAME" => {
                    let val: Option<String> = row.try_get(column_name)?;
                    val.map_or(Value::Null, Value::String)
                }
                "FLOAT4" | "FLOAT8" => {
                    let val: Option<f64> = row.try_get(column_name)?;
                    val.map_or(Value::Null, |v| Value::Number(serde_json::Number::from_f64(v).unwrap()))
                }
                "BOOL" => {
                    let val: Option<bool> = row.try_get(column_name)?;
                    val.map_or(Value::Null, Value::Bool)
                }
                "TIMESTAMPTZ" | "TIMESTAMP" => {
                    let val: Option<String> = row.try_get(column_name)?;
                    val.map_or(Value::Null, Value::String)
                }
                "DATE" => {
                    let val: Option<chrono::NaiveDate> = row.try_get(column_name)?;
                    val.map_or(Value::Null, |v| Value::String(v.to_string()))
                }
                "UUID" => {
                    let val: Option<String> = row.try_get(column_name)?;
                    val.map_or(Value::Null, Value::String)
                }
                "JSONB" => {
                    let val: Option<serde_json::Value> = row.try_get(column_name)?;
                    val.unwrap_or(Value::Null)
                }
                "BYTEA" => {
                    let val: Option<Vec<u8>> = row.try_get(column_name)?;
                    val.map_or(Value::Null, |v| Value::String(base64::encode(v)))
                }
                "NUMERIC" => {
                    let val: Option<i64> = row.try_get(column_name)?;
                    val.map_or(Value::Null, |v| Value::Number(v.into()))
                }
                "ARRAY" => {
                    let val: Option<Vec<String>> = row.try_get(column_name)?;
                    val.map_or(Value::Null, |v| Value::Array(v.into_iter().map(Value::String).collect()))
                }
                _ => {
                    Value::Null
                }
            };
    
            json_object.insert(column_name.to_string(), value);
        }
    
        Ok(Value::Object(json_object))
    }
}

pub struct MySQLParser;

impl MySQLParser {
    pub async fn json(row: &MySqlRow) -> Result<Value, Error> {
        let mut json_object = serde_json::Map::new();

        for column in row.columns() {
            let column_name = column.name();
            let column_type = column.type_info().name();
            let value = match column_type {
                "INT" => {
                    let val: Option<i32> = row.try_get(column_name)?;  // Handle NULL as Option<i32>
                    val.map_or(Value::Null, |v| Value::Number(v.into()))
                }
                "VARCHAR" | "TEXT" | "ENUM" => {
                    let val: Option<String> = row.try_get(column_name)?;  // Handle NULL as Option<String>
                    val.map_or(Value::Null, Value::String)
                }
                "FLOAT" | "DOUBLE" => {
                    let val: Option<f64> = row.try_get(column_name)?;  // Handle NULL as Option<f64>
                    val.map_or(Value::Null, |v| Value::Number(serde_json::Number::from_f64(v).unwrap()))
                }
                "DECIMAL" => {
                    let val: Option<Decimal> = row.try_get(column_name)?;  // Handle NULL as Option<f64>
                    val.map_or(Value::Null, |v| Value::String(serde_json::to_string(&v).unwrap()))
                }
                "BOOL" => {
                    let val: Option<bool> = row.try_get(column_name)?;  // Handle NULL as Option<bool>
                    val.map_or(Value::Null, Value::Bool)
                }
                "DATETIME" => {
                    let val: Option<String> = row.try_get(column_name)?;  // Handle NULL as Option<String>
                    val.map_or(Value::Null, Value::String)
                }
                "DATE" => {
                    let val: Option<chrono::NaiveDate> = row.try_get(column_name)?;  // Handle NULL as Option<chrono::NaiveDate>
                    val.map_or(Value::Null, |v| Value::String(v.to_string()))
                }
                _ => {
                    Value::Null
                }
            };

            json_object.insert(column_name.to_string(), value);
        }

        Ok(Value::Object(json_object))
    }
}
