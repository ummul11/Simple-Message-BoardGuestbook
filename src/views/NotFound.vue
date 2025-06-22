<template>
  <div class="not-found">
    <div class="not-found-content">
      <h1>404</h1>
      <h2>Page Not Found</h2>
      <p>The page you are looking for doesn't exist or has been moved.</p>
      <router-link to="/" class="home-button">Go to Home</router-link>
    </div>
  </div>
</template>

<script>
export default {
  name: 'NotFound'
};
</script>

<style scoped>
.not-found {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
  text-align: center;
}

.not-found-content {
  background-color: white;
  border-radius: 8px;
  padding: 3rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  max-width: 500px;
}

h1 {
  font-size: 5rem;
  color: #5546FF;
  margin: 0;
  line-height: 1;
}

h2 {
  margin-top: 0.5rem;
  margin-bottom: 1.5rem;
  color: #333;
}

p {
  margin-bottom: 2rem;
  color: #666;
}

.home-button {
  display: inline-block;
  background-color: #5546FF;
  color: white;
  padding: 0.8rem 1.5rem;
  border-radius: 4px;
  font-weight: 500;
  transition: background-color 0.3s;
  text-decoration: none;
}

.home-button:hover {
  background-color: #4035cc;
  text-decoration: none;
}
</style>