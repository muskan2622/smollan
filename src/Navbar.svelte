<!-- Navbar.svelte -->

<script>
  export let title;
  export let logoPath = "/logo-white.svg"; // Default logo path
</script>

<nav class="navbar">
  <!-- Logo -->
  <img src={logoPath} alt="Logo" class="logo">
  
  <!-- Title -->
  <h1>{title}</h1>
  
  <!-- Navigation Links -->
  <ul class="nav-links">
    <li><a href="./Forecast">Forecasts</a></li>
    <li><a href="#">Maps</a></li>
    <li><a href="#">Alerts</a></li>
    <li><a href="#">Life</a></li>
    <li><a href="#">News & Videos</a></li>
    <li><a href="#">Cameras</a></li>
    <li><a href="#">Air Quality</a></li>
    <li><a href="#">Hurricane</a></li>
  </ul>
</nav>

<style>
  /* Add your navbar styles here */
  .navbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 20px;
    background-color: #3b586c;
    color: #fff;
  }

  .logo {
    width: 40px; /* Adjust the width as needed */
    height: auto;
    margin-right: 10px; /* Add spacing between logo and title */
  }

  .nav-links {
    display: flex;
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .nav-links li {
    margin-right: 20px; /* Add spacing between navigation items */
  }

  .nav-links li:last-child {
    margin-right: 0; /* Remove margin for the last navigation item */
  }

  .nav-links li a {
    color: #fff;
    text-decoration: none;
    font-size: 16px;
  }

  .nav-links li a:hover {
    text-decoration: underline;
  }

  /* Responsive Styles */
  @media (max-width: 768px) {
    .navbar {
      flex-direction: column;
      align-items: flex-start;
    }

    .logo {
      margin-bottom: 10px; /* Add spacing between logo and title in mobile view */
    }

    .nav-links {
      margin-top: 10px; /* Add spacing between title and navigation links in mobile view */
    }

    .nav-links li {
      margin-right: 0; /* Remove margin between navigation items in mobile view */
      margin-bottom: 10px; /* Add spacing between navigation items in mobile view */
    }
  }
</style>
