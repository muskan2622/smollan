<main>
  <div class="documentation">
   <div class="section">
      <h2>GITHUB REPOSITORY LINK</h2>
      <p>https://github.com/muskan2622/smollan</p>
    </div>
    <h1>OpenWeatherMap API Documentation</h1>
    <div class="section">
      <h2>API Overview</h2>
      <p>The OpenWeatherMap API is a powerful tool for accessing current weather data and forecasts for various locations around the world. It provides developers with access to a wide range of weather-related information, including temperature, humidity, wind speed, atmospheric pressure, and more.</p>
    </div>
    <div class="section">
      <h2>Usage</h2>
      <p>To use the OpenWeatherMap API, you need to sign up for an API key, which allows you to access the data. The API key is typically included as a query parameter in the API requests to authenticate your access.</p>
    </div>
    <div class="section">
      <h2>Endpoint</h2>
      <p>The main endpoint for accessing weather data is:</p>
      <pre>http://api.openweathermap.org/data/2.5/weather</pre>
    </div>
    <div class="section">
      <h2>Parameters</h2>
      <ul>
        <li><strong>q:</strong> The city name and country code separated by a comma (e.g., "Mantilly,FR"). This parameter specifies the location for which you want to retrieve weather data.</li>
        <li><strong>appid:</strong> Your API key obtained from OpenWeatherMap. This parameter authenticates your access to the API.</li>
      </ul>
    </div>
    <div class="section">
      <h2>Response</h2>
      <p>The API response is in JSON format and includes various weather-related parameters such as temperature, humidity, wind speed, weather description, and more.</p>
    </div>
    <div class="section">
      <h2>List of Countries Supported</h2>
      <p>Please the end points to search for the country.</p>
    </div>
  </div>
</main>

<style>
  /* Styles for the documentation */
  main {
    background-color: #3b586c;
    color: white;
    padding: 20px;
  }

  .documentation {
    max-width: 800px;
    margin: 0 auto;
  }

  .section {
    margin-bottom: 20px;
  }

  h1, h2 {
    color: white;
  }
</style>

