import axios from 'axios';


const forecastEndpoint = (params: {cityName: any; days: any}) =>
  `https://api.weatherapi.com/v1/forecast.json?key=${process.env.WEATHER_API}&q=${params.cityName}&days=${params.days}&aqi=no&alerts=no`;
const locationsEndpoint = (params: {cityName: any}) =>
  `https://api.weatherapi.com/v1/search.json?key=${process.env.WEATHER_API}&q=${params.cityName}`;

const apiCall = async (endpoint: string) => {
  const options = {
    method: 'GET',
    url: endpoint,
  };

  try {
    const response = await axios(options);
    return response.data;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const fetchWeatherForecast = (params: any) => {
  return apiCall(forecastEndpoint(params));
};

export const fetchLocations = (params: any) => {
  return apiCall(locationsEndpoint(params));
};
