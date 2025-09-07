class WeatherApp {
    constructor() {
        this.weatherData = {};
        this.countries = [];
        this.initializeElements();
        this.bindEvents();
        this.loadCountries();
    }

    initializeElements() {
        this.countrySelect = document.getElementById('country-select');
        this.citySelect = document.getElementById('city-select');
        this.monthSelect = document.getElementById('month-select');
        this.getWeatherBtn = document.getElementById('get-weather');
        this.weatherDisplay = document.getElementById('weather-display');
        this.loading = document.getElementById('loading');
    }

    bindEvents() {
        this.countrySelect.addEventListener('change', () => this.onCountryChange());
        this.citySelect.addEventListener('change', () => this.onCityChange());
        this.monthSelect.addEventListener('change', () => this.validateForm());
        this.getWeatherBtn.addEventListener('click', () => this.getWeatherData());
    }

    async loadCountries() {
        try {
            this.showLoading();
            const response = await fetch('/countries');
            if (!response.ok) throw new Error('Failed to load countries');
            
            this.countries = await response.json();
            this.populateCountrySelect();
            
            // Load full weather data for city/month population
            await this.loadWeatherData();
        } catch (error) {
            this.showError('Failed to load countries: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    async loadWeatherData() {
        try {
            // We need to load the full weather.json to get cities and months
            // Since there's no direct endpoint, we'll build it from API calls
            this.weatherData = {};
            
            for (const country of this.countries) {
                try {
                    // Try to get some sample data to understand the structure
                    // For now, we'll populate this when user selects country
                    this.weatherData[country] = {};
                } catch (e) {
                    // Skip countries we can't access
                    console.warn(`Could not load data for ${country}`);
                }
            }
        } catch (error) {
            console.error('Error loading weather data:', error);
        }
    }

    populateCountrySelect() {
        this.countrySelect.innerHTML = '<option value="">Select a country</option>';
        
        this.countries.sort().forEach(country => {
            const option = document.createElement('option');
            option.value = country;
            option.textContent = country;
            this.countrySelect.appendChild(option);
        });
        
        this.countrySelect.disabled = false;
    }

    async onCountryChange() {
        const country = this.countrySelect.value;
        
        if (!country) {
            this.resetCitySelect();
            this.resetMonthSelect();
            return;
        }

        try {
            this.showLoading();
            // We need to discover cities by trying different endpoints
            // For now, let's use known cities from the weather data
            const cities = await this.discoverCities(country);
            this.populateCitySelect(cities);
        } catch (error) {
            this.showError('Failed to load cities for ' + country);
            this.resetCitySelect();
        } finally {
            this.hideLoading();
        }
    }

    async discoverCities(country) {
        // Known cities from the weather.json structure
        // In a real app, we'd have an endpoint for this
        const knownCities = {
            'England': ['London'],
            'Spain': ['Seville'],
            'France': ['Paris'],
            'Germany': ['Berlin'],
            'Portugal': ['Lisbon', 'Porto'],
            'Italy': ['Montepulciano'],
            'Peru': ['Lima']
        };

        return knownCities[country] || [];
    }

    populateCitySelect(cities) {
        this.citySelect.innerHTML = '<option value="">Select a city</option>';
        
        cities.forEach(city => {
            const option = document.createElement('option');
            option.value = city;
            option.textContent = city;
            this.citySelect.appendChild(option);
        });
        
        this.citySelect.disabled = false;
        this.resetMonthSelect();
    }

    async onCityChange() {
        const country = this.countrySelect.value;
        const city = this.citySelect.value;
        
        if (!country || !city) {
            this.resetMonthSelect();
            return;
        }

        try {
            this.showLoading();
            const months = await this.discoverMonths(country, city);
            this.populateMonthSelect(months);
        } catch (error) {
            this.showError('Failed to load months for ' + city);
            this.resetMonthSelect();
        } finally {
            this.hideLoading();
        }
    }

    async discoverMonths(country, city) {
        // All months that are available in the data
        const allMonths = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];

        // In a real app, we'd check which months have data
        // For now, we'll assume all months are available
        return allMonths;
    }

    populateMonthSelect(months) {
        this.monthSelect.innerHTML = '<option value="">Select a month</option>';
        
        months.forEach(month => {
            const option = document.createElement('option');
            option.value = month;
            option.textContent = month;
            this.monthSelect.appendChild(option);
        });
        
        this.monthSelect.disabled = false;
        this.validateForm();
    }

    resetCitySelect() {
        this.citySelect.innerHTML = '<option value="">Select a country first</option>';
        this.citySelect.disabled = true;
        this.resetMonthSelect();
    }

    resetMonthSelect() {
        this.monthSelect.innerHTML = '<option value="">Select a city first</option>';
        this.monthSelect.disabled = true;
        this.validateForm();
    }

    validateForm() {
        const country = this.countrySelect.value;
        const city = this.citySelect.value;
        const month = this.monthSelect.value;
        
        this.getWeatherBtn.disabled = !(country && city && month);
    }

    async getWeatherData() {
        const country = this.countrySelect.value;
        const city = this.citySelect.value;
        const month = this.monthSelect.value;

        if (!country || !city || !month) return;

        try {
            this.showLoading();
            const response = await fetch(`/countries/${country}/${city}/${month}`);
            
            if (!response.ok) {
                if (response.status === 500) {
                    throw new Error('No weather data available for this location/month combination');
                }
                throw new Error('Failed to fetch weather data');
            }
            
            const data = await response.json();
            this.displayWeatherData(data, country, city, month);
        } catch (error) {
            this.showError('Error: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    displayWeatherData(data, country, city, month) {
        this.weatherDisplay.innerHTML = `
            <h2>Weather in ${city}, ${country}</h2>
            <div class="temperature-card">
                <h3>${month} Temperature Data</h3>
                <div class="temp-values">
                    <div class="temp-item">
                        <div class="label">High Temperature</div>
                        <div class="value">${data.high}</div>
                        <div class="unit">°C</div>
                    </div>
                    <div class="temp-item">
                        <div class="label">Low Temperature</div>
                        <div class="value">${data.low}</div>
                        <div class="unit">°C</div>
                    </div>
                </div>
            </div>
        `;
    }

    showError(message) {
        this.weatherDisplay.innerHTML = `
            <h2>Error</h2>
            <div class="error">
                <h3>⚠️ Something went wrong</h3>
                <p>${message}</p>
            </div>
        `;
    }

    showLoading() {
        this.loading.style.display = 'flex';
    }

    hideLoading() {
        this.loading.style.display = 'none';
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new WeatherApp();
});