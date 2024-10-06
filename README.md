# Look Awry

[![Version](https://img.shields.io/badge/version-0.0.1-blue.svg)]()
[![License](https://img.shields.io/badge/license-MIT-green.svg)]()
[![Platforms](https://img.shields.io/badge/platforms-Windows%20%7C%20macOS%20%7C%20Linux-orange.svg)]()

Look Awry is an open-source application that leverages local AI technology to retrieve data from your SQL databases using natural language queries. Inspired by philosopher Slavoj Žižek's book, the name "Look Awry" signifies a different approach to database interaction—no need for writing SQL statements; just ask your question, and get results at a glance.

## Table of Contents

- [Features](#features)
- [Motivation](#motivation)
- [About the Name](#about-the-name)
- [Installation](#installation)
- [Usage](#usage)
- [Supported Databases](#supported-databases)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgments](#acknowledgments)
- [Contact](#contact)

## Features

- **Natural Language Interface**: Query your databases using plain English.
- **Local AI Processing**: All AI computations are performed locally, ensuring your data remains private.
- **Lightweight**: Utilizes the Phi3 model via the [llama.cpp](https://github.com/ggerganov/llama.cpp) inference engine, requiring minimal hardware resources.
- **Cross-Platform Support**: Available on Windows, macOS, and Linux.
- **Modern Stack**:
  - **Backend**: Rust with Tauri
  - **Frontend**: Next.js, Tailwind CSS, [shadcn UI](https://ui.shadcn.com/) components

## Motivation

Developed to gain deeper insights into database-driven information systems, Look Awry aims to simplify data querying by removing the complexity of SQL syntax. By transforming natural language questions into SQL queries, it provides a user-friendly interface for both developers and non-technical users to interact with databases efficiently.

This tool emphasizes privacy and ease of use, running entirely on your local machine without reliance on external cloud services.

## About the Name

The name "Look Awry" is inspired by Slavoj Žižek's book, representing a tool that offers a different perspective on database querying. Instead of traditional methods requiring SQL syntax, Look Awry allows you to glance at your data by asking vague or broad questions, making data retrieval more intuitive and accessible.

## Installation

Visit the [Releases](https://github.com/yourusername/look-awry/releases) page to download the latest version for your platform.

- **Windows**: `LookAwryInstaller.exe`
- **macOS**: `LookAwry.dmg`
- **Linux**: `LookAwry.AppImage`

## Usage

1. **Launch the Application**: Start Look Awry on your computer.
2. **Set Up a Connection**:
   - Enter your database connection string.
   - Provide the database "knowledge" (schema description). This can be your database's initialization scripts with `CREATE TABLE` statements.
3. **Ask Your Question**:
   - Input your query in natural language.
4. **View Results**:
   - The application generates the appropriate SQL query and displays the data retrieved.

## Supported Databases

- **PostgreSQL**
- **MySQL**
- **SQLite**

*Planned future support for:*

- **DuckDB** (for CSV files)
- **MongoDB**

## Roadmap

- **Database Support Expansion**: Adding support for DuckDB and MongoDB.
- **Model Optimization**: Exploring other efficient AI models to enhance performance.
- **Feature Enhancements**: Improving user experience and adding more functionalities based on community feedback.

## Contributing

Contributions are welcome! If you'd like to help improve Look Awry, please follow these steps:

1. Fork the repository.
2. Create your feature branch: `git checkout -b feature/YourFeature`.
3. Commit your changes: `git commit -am 'Add some feature'`.
4. Push to the branch: `git push origin feature/YourFeature`.
5. Open a pull request.

For major changes, please open an issue first to discuss what you would like to change.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgments

- **[llama.cpp](https://github.com/ggerganov/llama.cpp)**: For the inference engine enabling AI-powered SQL generation.
- **Phi3 Model**: The lightweight AI model utilized in this project.
- **[shadcn UI](https://ui.shadcn.com/)**: For providing a suite of UI components.

## Contact

For support or inquiries, please open an issue on the repository or reach out via [email@example.com](mailto:email@example.com).

---

Thank you for your interest in Look Awry! We hope this tool enhances your database interaction experience. If you find it useful, please consider starring the repository and sharing it with others.
