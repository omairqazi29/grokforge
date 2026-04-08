import requests
from requests.exceptions import ConnectionError, HTTPError, RequestException, Timeout
import logging
from tenacity import retry, retry_if_exception, retry_if_exception_type, stop_after_attempt, wait_exponential

logger = logging.getLogger(__name__)

def log_before_sleep(retry_state):
    logger.warning(
        f"Retrying weather API request #{retry_state.attempt_number} "
        f"after {retry_state.outcome.exception()} - "
        f"sleeping {retry_state.next_action.sleep:.1f}s"
    )

class WeatherClient:
    def __init__(
        self,
        api_key: str,
        base_url: str = "https://api.openweathermap.org/data/2.5",
        timeout: float = 10.0
    ):
        self.api_key = api_key
        self.base_url = base_url
        self.timeout = timeout

    @retry(
        stop=stop_after_attempt(6),
        wait=wait_exponential(multiplier=2, min=1, max=60),
        retry=retry_if_exception_type((ConnectionError, Timeout, RequestException))
             | retry_if_exception(
                 lambda exc: isinstance(exc, HTTPError)
                 and (
                     getattr(exc.response, 'status_code', 0) == 429
                     or getattr(exc.response, 'status_code', 0) >= 500
                 )
             ),
        before_sleep=log_before_sleep,
    )
    def get_weather(self, city: str) -> dict:
        """
        Fetch current weather data for a city.
        """
        url = f"{self.base_url}/weather"
        params = {
            "q": city,
            "appid": self.api_key,
            "units": "metric"
        }
        response = requests.get(url, params=params, timeout=self.timeout)
        response.raise_for_status()
        return response.json()
