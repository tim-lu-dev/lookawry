
# Look Awry

[![Version](https://img.shields.io/badge/version-0.0.1-blue.svg)]()
[![License](https://img.shields.io/badge/license-MIT-green.svg)]()
[![Platforms](https://img.shields.io/badge/platforms-Windows%20%7C%20macOS%20%7C%20Linux-orange.svg)]()

![Logo](https://github.com/tim-lu-dev/lookawry/blob/main/screenshot.png)

Look Awry is an open-source application that leverages local AI technology to retrieve data from your SQL databases using natural language queries. Inspired by philosopher Slavoj Žižek's book, the name "Look Awry" represents a new approach to database interaction—no need to write SQL queries manually; simply ask your question, and get results instantly.

## Table of Contents

- [About the Name](#about-the-name)
- [Motivation](#motivation)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Supported Databases](#supported-databases)
- [Roadmap](#roadmap)
- [License](#license)
- [Acknowledgments](#acknowledgments)
- [Contact](#contact)

## About the Name

The name "Look Awry" is inspired by Slavoj Žižek's book, reflecting a tool that offers a different perspective on database querying. Instead of using traditional methods requiring precise SQL syntax, Look Awry allows you to interact with your data through intuitive natural language queries.

## Motivation

This project was developed with the idea of "Text to SQL" in mind. While there are services that use powerful cloud-based AI to achieve this, Look Awry is focused on privacy by running AI models locally. If you value privacy and want to avoid sending data to the cloud, this tool can help you achieve that.

The primary goal is to assist developers in quickly browsing their database with simple queries, without needing to write precise `SELECT` statements. It’s designed to be a user-friendly tool for development and monitoring purposes.

Note: Look Awry is not intended for commercial-grade data insights or deep data analysis. It’s currently being tested on lightweight open-source models like Microsoft’s Phi3.

## Features

- **Natural Language Interface**: Query your databases using plain English.
- **Local AI Processing**: All AI computations are performed locally, ensuring your data remains private.
- **Lightweight**: Powered by the [llama.cpp](https://github.com/ggerganov/llama.cpp) inference engine, requiring minimal hardware resources.
- **Cross-Platform Support**: Available on Windows, macOS, and Linux.
- **Multi-Database Support**: Works with MySQL, PostgreSQL, SQLite, and more in the future.
- **Modern Tech Stack**:
  - **Backend**: Rust with Tauri
  - **Frontend**: Next.js, Tailwind CSS, [shadcn UI](https://ui.shadcn.com/) components

## Installation

If you want to use the app without building it from source, visit the [Releases](https://github.com/tim-lu-dev/look-awry/releases) page to download the latest version for your platform. 

Supported platforms:
- Windows
- macOS
- Linux

### Performance Note for macOS:
On a MacBook Pro M1 with 16 GB of RAM and the Microsoft Phi3 engine, the app retrieves query results in around 10 seconds. Due to lack of access to an Nvidia GPU, the Windows and Linux builds are CPU-based and significantly slower. The macOS version (optimized for Apple Silicon) performs better, thanks to better support from `llama.cpp`.

### Building from Source:

1. Download the appropriate binary files from the [llama.cpp releases](https://github.com/ggerganov/llama.cpp/releases) page.
2. Extract the binaries into the `src-tauri/bin` folder. For example, you should have `src-tauri/bin/llama-cli.exe`.
3. Make sure you have a model in GGUF format to work with the `llama.cpp` engine. I recommend the [Microsoft Phi3 model](https://huggingface.co/microsoft/Phi-3-mini-4k-instruct-gguf/blob/main/Phi-3-mini-4k-instruct-fp16.gguf), which is the primary model tested with this app.
4. Run `npm install` to install all dependencies.
5. Start the app in development mode with:
   ```bash
   npm run tauri dev
   ```
6. Build the app for your platform with:
   ```bash
   npm run tauri build
   ```

## Usage

1. **Launch the Application**: Start Look Awry on your computer.
2. **Set Up a Connection**:
   - Select your database type.
   - Enter your database connection string.
3. **Choose a Model File**: 
   - Select a `.gguf` model file via the file browser.
4. **Ask a Question**:
   - Input a natural language query. The app will fetch the data for you.
5. **Get SQL Query**:
   - Input a natural language query to receive a corresponding SQL query.
6. **Run SQL Queries**:
   - Execute your SQL `SELECT` statement directly. (Note: Only `SELECT` statements are allowed—no `UPDATE`, `DELETE`, or other modification operations.)
7. **View Results**:
   - The app generates and runs the SQL query, then displays the retrieved data.

## Supported Databases

- **PostgreSQL**
- **MySQL**
- **SQLite**

*Planned future support for:*

- **DuckDB** (for handling CSV files)
- **MongoDB**

## Roadmap

- **Expanded Database Support**: Adding DuckDB and MongoDB.
- **Model Optimization**: Exploring more efficient AI models to improve performance.
- **Enhanced Features**: Continuous improvements in user experience and functionality based on community feedback.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more information.

## Acknowledgments

- **[llama.cpp](https://github.com/ggerganov/llama.cpp)**: For the inference engine that powers the AI-driven SQL generation.
- **Phi3 Model**: The lightweight AI model used in this project.
- **[shadcn UI](https://ui.shadcn.com/)**: For the modern UI components that make the app look great.

## Contact

For support or inquiries, feel free to open an issue on this repository or reach out via [tim.lu.dev@gmail.com](mailto:tim.lu.dev@gmail.com).

---

Thank you for your interest in Look Awry! We hope this tool enhances your database interaction experience. If you find it useful, please consider starring the repository and sharing it with others.
