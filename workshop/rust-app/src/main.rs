use axum::{
    extract::Path,
    http::StatusCode,
    response::{Json, Html},
    routing::get,
    Router,
};
use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tokio::net::TcpListener;
use tower_http::services::ServeDir;
use utoipa::OpenApi;

#[derive(Debug, Deserialize, Serialize, Clone, utoipa::ToSchema)]
struct MonthlyTemperature {
    /// High temperature for the month
    high: i32,
    /// Low temperature for the month  
    low: i32,
}

type CityData = HashMap<String, MonthlyTemperature>;
type CountryData = HashMap<String, CityData>;
type WeatherData = HashMap<String, CountryData>;

static WEATHER_DATA: Lazy<WeatherData> = Lazy::new(|| {
    load_weather_data().expect("Failed to load weather data")
});

#[derive(OpenApi)]
#[openapi(
    paths(root, countries, monthly_average),
    components(schemas(MonthlyTemperature)),
    tags(
        (name = "weather", description = "Weather API endpoints")
    ),
    info(
        title = "Weather API",
        description = "Historical weather data API",
        version = "1.0.0"
    )
)]
struct ApiDoc;

fn load_weather_data() -> anyhow::Result<WeatherData> {
    let data_path = "../python-app/webapp/weather.json";
    let contents = std::fs::read_to_string(data_path)?;
    let data: WeatherData = serde_json::from_str(&contents)?;
    Ok(data)
}

#[utoipa::path(
    get,
    path = "/",
    responses(
        (status = 200, description = "Main weather application UI")
    ),
    tag = "weather"
)]
async fn root() -> Html<String> {
    match std::fs::read_to_string("static/index.html") {
        Ok(content) => Html(content),
        Err(_) => Html("<h1>Error loading UI</h1>".to_string())
    }
}

#[utoipa::path(
    get,
    path = "/countries",
    responses(
        (status = 200, description = "List of available countries", body = Vec<String>)
    ),
    tag = "weather"
)]
async fn countries() -> Json<Vec<String>> {
    let country_list: Vec<String> = WEATHER_DATA.keys().cloned().collect();
    Json(country_list)
}

#[utoipa::path(
    get,
    path = "/countries/{country}/{city}/{month}",
    responses(
        (status = 200, description = "Monthly temperature data", body = MonthlyTemperature),
        (status = 500, description = "Country, city, or month not found")
    ),
    params(
        ("country" = String, Path, description = "Country name"),
        ("city" = String, Path, description = "City name"),
        ("month" = String, Path, description = "Month name")
    ),
    tag = "weather"
)]
async fn monthly_average(
    Path((country, city, month)): Path<(String, String, String)>,
) -> Result<Json<MonthlyTemperature>, StatusCode> {
    let country_data = WEATHER_DATA.get(&country).ok_or(StatusCode::INTERNAL_SERVER_ERROR)?;
    let city_data = country_data.get(&city).ok_or(StatusCode::INTERNAL_SERVER_ERROR)?;
    let month_data = city_data.get(&month).ok_or(StatusCode::INTERNAL_SERVER_ERROR)?;
    
    Ok(Json(month_data.clone()))
}

async fn api_docs() -> Html<&'static str> {
    Html(r#"
    <!DOCTYPE html>
    <html>
    <head>
        <title>Weather API Documentation</title>
        <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@3.25.0/swagger-ui.css" />
    </head>
    <body>
        <div id="swagger-ui"></div>
        <script src="https://unpkg.com/swagger-ui-dist@3.25.0/swagger-ui-bundle.js"></script>
        <script>
        const ui = SwaggerUIBundle({
            url: '/api-docs/openapi.json',
            dom_id: '#swagger-ui',
            presets: [
                SwaggerUIBundle.presets.apis,
                SwaggerUIBundle.presets.standalone
            ]
        });
        </script>
    </body>
    </html>
    "#)
}

async fn openapi_spec() -> Json<utoipa::openapi::OpenApi> {
    Json(ApiDoc::openapi())
}

fn create_app() -> Router {
    Router::new()
        .route("/", get(root))
        .route("/countries", get(countries))
        .route("/countries/:country/:city/:month", get(monthly_average))
        .route("/api-docs", get(api_docs))
        .route("/api-docs/openapi.json", get(openapi_spec))
        .nest_service("/static", ServeDir::new("static"))
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let app = create_app();
    let listener = TcpListener::bind("0.0.0.0:8000").await?;
    
    println!("Weather API server starting on http://0.0.0.0:8000");
    axum::serve(listener, app).await?;
    
    Ok(())
}
