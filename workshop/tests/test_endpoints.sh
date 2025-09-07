# Test the monthly average endpoint for Seville in June
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
RESET='\033[0m' # No Color

test_endpoint() {
    local url=$1
    local expected_status=$2
    local description=$3

    printf "[TEST] %-60s" "${description}"
    actual_status=$(curl -o /dev/null -s -w "%{http_code}" ${url})
    if [ "${actual_status}" -eq "${expected_status}" ]; then
        printf "${GREEN}[PASS]${RESET}\n"
    else
        printf "${RED}[FAIL]${RESET}\n\t- Expected: ${expected_status}, Got: ${actual_status}\n"
    fi
}

echo -e "${YELLOW}Running comprehensive endpoint tests...${RESET}\n"

# Test the root endpoint (now serves UI)
test_endpoint "http://localhost:8000/" 200 "root endpoint (UI)"

# Test the countries endpoint
test_endpoint "http://localhost:8000/countries" 200 "countries endpoint"

# Test valid monthly average endpoints with actual data from weather.json
test_endpoint "http://localhost:8000/countries/England/London/January" 200 "monthly average for London in January"
test_endpoint "http://localhost:8000/countries/Spain/Seville/June" 200 "monthly average for Seville in June"
test_endpoint "http://localhost:8000/countries/France/Paris/December" 200 "monthly average for Paris in December"
test_endpoint "http://localhost:8000/countries/Germany/Berlin/July" 200 "monthly average for Berlin in July"
test_endpoint "http://localhost:8000/countries/Portugal/Lisbon/August" 200 "monthly average for Lisbon in August"
test_endpoint "http://localhost:8000/countries/Portugal/Porto/March" 200 "monthly average for Porto in March"
test_endpoint "http://localhost:8000/countries/Italy/Montepulciano/September" 200 "monthly average for Montepulciano in September"
test_endpoint "http://localhost:8000/countries/Peru/Lima/May" 200 "monthly average for Lima in May"

# Test edge cases for months
test_endpoint "http://localhost:8000/countries/England/London/January" 200 "monthly average for January"
test_endpoint "http://localhost:8000/countries/England/London/December" 200 "monthly average for December"

# Test error cases - these should return 500 due to KeyError exceptions
test_endpoint "http://localhost:8000/countries/InvalidCountry/InvalidCity/January" 500 "invalid country/city combination"
test_endpoint "http://localhost:8000/countries/England/InvalidCity/January" 500 "invalid city"
test_endpoint "http://localhost:8000/countries/England/London/InvalidMonth" 500 "invalid month name"
test_endpoint "http://localhost:8000/nonexistent" 404 "non-existent endpoint"

# Test case sensitivity - these should work if the API handles case insensitivity
test_endpoint "http://localhost:8000/countries/england/london/january" 500 "lowercase country/city/month names"
test_endpoint "http://localhost:8000/countries/ENGLAND/LONDON/JANUARY" 500 "uppercase country/city/month names"

echo -e "\n${YELLOW}Test suite completed.${RESET}"
