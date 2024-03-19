<script>
	  import Navbar from './Navbar.svelte';
	  import WeatherApp from './WeatherApp.svelte';
	  import About from './About.svelte';
</script>

<main>
 <Navbar title="Smollan India Private Limited"/>
 <WeatherApp/>
<About/>
	
</main>

<style>
	main {
		text-align: center;
		margin: 0 auto;
	}

	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>