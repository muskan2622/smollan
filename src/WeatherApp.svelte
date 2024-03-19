<script>
  import { writable } from 'svelte/store';

  // Define state variables
  let searchQuery = '';
  let weatherData = null;
  let errorMessage = '';

  // Function to handle search
  async function searchLocation() {
    try {
      // Fetch weather data based on search query
      const response = await fetch(`http://api.openweathermap.org/data/2.5/weather?q=${searchQuery}&appid=c685801635d2b619a59a4b856f94f36b`);
      const data = await response.json();
      
      // Store weather data
      weatherData = data;
      errorMessage = ''; // Reset error message if successful
    } catch (error) {
      console.error('Error fetching weather data:', error);
      errorMessage = 'Error fetching weather data. Please try again later.';
      weatherData = null;
    }
  }
</script>

<div class="background-image">
  <main class="weather-app">
   <h1>To match the endpoints search for London or Mantilly</h1>
    <!-- Search bar -->
    <div class="search-bar">
      <input type="text" placeholder="Enter city name or zip code" bind:value={searchQuery}>
      <button on:click={searchLocation}>Search</button>
    </div>

    <!-- Display weather data -->
    {#if weatherData}
      <div class="weather-info">
        <h2>{weatherData.name}, {weatherData.sys.country}</h2>
        <p>Temperature: {weatherData.main.temp}°C</p>
        <p>Description: {weatherData.weather[0].description}</p>
        <p>Wind Speed: {weatherData.wind.speed} m/s</p>
        <p>Humidity: {weatherData.main.humidity}%</p>
        <!-- You can add UV index if provided by the API -->
      </div>
    {:else if errorMessage}
      <p>{errorMessage}</p>
    {/if}
  </main>
</div>


<style>
  /* Add your CSS styles here */
  .background-image {
    background-image: url('https://m-cdn.phonearena.com/images/article/152061-wide-two_1200/Google-adds-weather-integration-to-the-Clock-app-on-some-Pixel-models.jpg');
    background-size: cover;
    background-position: center;
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .weather-app {
    padding: 20px;
    background-color: rgba(255, 255, 255, 0.7); /* Add transparency to the background */
    border-radius: 10px;
    box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
  }

  .search-bar {
    margin-bottom: 20px;
  }

  .search-bar input {
    padding: 10px;
    font-size: 16px;
    width: 300px;
    margin-right: 10px;
  }

  .search-bar button {
    padding: 10px 20px;
    font-size: 16px;
    background-color: #333;
    color: #fff;
    border: none;
    border-radius: 5px;
    cursor: pointer;
  }

  .weather-info {
    background-color: #f0f0f0;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
  }
</style>
