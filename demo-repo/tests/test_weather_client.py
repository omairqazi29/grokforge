import pytest
from unittest.mock import Mock, patch, MagicMock
import requests
from src.weather_client import WeatherClient

class TestWeatherClient:
    @pytest.fixture
    def client(self):
        return WeatherClient(api_key="fake_key")

    @patch("requests.get")
    def test_get_weather_success(self, mock_get, client):
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"main": {"temp": 20.0}}
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response

        result = client.get_weather("London")

        mock_get.assert_called_once()
        assert result["main"]["temp"] == 20.0

    @patch("requests.get")
    def test_retries_on_connection_error(self, mock_get, client):
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"main": {"temp": 20.0}}
        mock_response.raise_for_status.return_value = None

        mock_get.side_effect = [requests.exceptions.ConnectionError(), mock_response]

        result = client.get_weather("London")

        assert mock_get.call_count == 2
        assert result["main"]["temp"] == 20.0

    @patch("requests.get")
    def test_raises_after_max_retries(self, mock_get, client):
        mock_get.side_effect = [requests.exceptions.ConnectionError()] * 6

        with pytest.raises(requests.exceptions.ConnectionError):
            client.get_weather("London")

        assert mock_get.call_count == 6

    @patch("requests.get")
    def test_no_retry_on_400(self, mock_get, client):
        mock_response = Mock()
        mock_response.status_code = 400
        mock_response.raise_for_status.side_effect = requests.exceptions.HTTPError(
            response=mock_response
        )
        mock_get.return_value = mock_response

        with pytest.raises(requests.exceptions.HTTPError):
            client.get_weather("London")

        mock_get.assert_called_once()

    @patch("requests.get")
    def test_retries_on_429(self, mock_get, client):
        mock_response_429 = Mock()
        mock_response_429.status_code = 429
        exc_429 = requests.exceptions.HTTPError(response=mock_response_429)

        mock_response_ok = Mock()
        mock_response_ok.status_code = 200
        mock_response_ok.json.return_value = {"main": {"temp": 20.0}}
        mock_response_ok.raise_for_status.return_value = None

        mock_get.side_effect = [exc_429, mock_response_ok]

        result = client.get_weather("London")

        assert mock_get.call_count == 2
        assert result["main"]["temp"] == 20.0

    @patch("requests.get")
    def test_logs_retries(self, mock_get, client, caplog):
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"main": {"temp": 20.0}}
        mock_response.raise_for_status.return_value = None

        mock_get.side_effect = [
            requests.exceptions.ConnectionError("test"),
            mock_response,
        ]

        result = client.get_weather("London")

        assert mock_get.call_count == 2
        assert "Retrying weather API request #1" in caplog.text
        assert result["main"]["temp"] == 20.0
