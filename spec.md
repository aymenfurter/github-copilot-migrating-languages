# Weather API Migration Specification: Python to Rust

## Overview

This specification outlines the migration of a FastAPI weather service to Rust. The application serves historical weather data through REST endpoints, providing temperature information for various cities worldwide.

### Application Components

| Component | Description | Current Implementation | Target Implementation |
|-----------|-------------|----------------------|---------------------|
| **Web Server** | HTTP server handling requests | FastAPI + Uvicorn | Axum + Tokio |
| **Data Layer** | Weather data storage & access | JSON file + Python dict | JSON file + Rust HashMap |
| **API Endpoints** | REST API routes | FastAPI decorators | Axum route handlers |
| **Error Handling** | HTTP error responses | FastAPI exception handling | Axum error responses |
| **Documentation** | OpenAPI/Swagger docs | FastAPI auto-generation | Utoipa crate |
| **Testing** | Endpoint validation | Shell scripts + curl | Same shell scripts |

### Current Python Application Structure

```
webapp/
├── main.py           # FastAPI app with 3 endpoints
├── weather.json      # Historical weather data
└── static/
    └── openapi.json  # API documentation
```

**Endpoints:**
- `GET /` → Redirect to `/docs` (301)
- `GET /countries` → List of available countries (200)
- `GET /countries/{country}/{city}/{month}` → Monthly temperature data (200/500)

## Key Migration Principles

1. **Exact Behavioral Compatibility**: All HTTP status codes and JSON responses must match
2. **Performance-First**: Leverage Rust's speed with lazy data loading and efficient parsing
3. **Test-Driven**: Use existing shell tests as validation for each endpoint migration
4. **Incremental Approach**: Migrate endpoints one-by-one (redirect → countries → monthly data)

## Implementation Tasks

### Setup & Foundation
1. **Create Rust project structure**
   - Initialize `workshop/rust-app/` directory
   - Run `cargo init` to create `Cargo.toml` and `src/main.rs`
   - Configure dependencies in `Cargo.toml`: axum, tokio, serde, serde_json, once_cell, anyhow

2. **Data layer implementation**
   - Define `WeatherData` struct matching `weather.json` structure
   - Define `MonthlyTemperature` struct for high/low temperature pairs
   - Implement JSON deserialization with serde derives
   - Create data loading function that reads `../python-app/webapp/weather.json`
   - Set up lazy static initialization using `once_cell::sync::Lazy`

3. **Basic server setup**
   - Configure Tokio runtime in `main.rs`
   - Set up Axum router with placeholder handlers
   - Configure server to listen on `0.0.0.0:8000`
   - Create basic error handling structure

### Endpoint Migration
4. **Root endpoint (`/`)**
   - Implement redirect handler returning 301 status to `/docs`
   - Test with `curl -I http://localhost:8000/`

5. **Countries endpoint (`/countries`)**
   - Extract country keys from loaded weather data HashMap
   - Return JSON array of country names
   - Test with existing shell script: `countries` test case

6. **Monthly average endpoint (`/countries/{country}/{city}/{month}`)**
   - Implement path parameter extraction for country, city, month
   - Access nested HashMap structure: `data[country][city][month]`
   - Handle missing keys by returning HTTP 500 (matching Python KeyError behavior)
   - Test with all shell script test cases for valid and invalid combinations

### Integration & Validation  
7. **Error handling alignment**
   - Ensure case-sensitive matching (reject lowercase country names with 500)
   - Verify 404 responses for non-existent routes
   - Validate all error scenarios pass `workshop/tests/test_endpoints.sh`

8. **Build system integration**
   - Update `workshop/rust-app/Makefile` with `run` target using `cargo run`
   - Ensure server starts on same host/port as Python version
   - Test `make run` command functionality

9. **Documentation setup**
   - Add `utoipa` dependency for OpenAPI generation
   - Create `/docs` endpoint serving generated OpenAPI specification
   - Verify docs accessibility matches FastAPI behavior

### Validation
10. **Full test suite execution**
    - Run complete `workshop/tests/test_endpoints.sh` against Rust server
    - Verify all 16 test cases pass with identical status codes
    - Compare JSON response formats with Python version