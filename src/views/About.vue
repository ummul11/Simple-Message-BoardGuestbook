<template>
  <div class="about">
    <h1>About Stacks Guestbook</h1>
    <div class="about-content">
      <section>
        <h2>What is Stacks Guestbook?</h2>
        <p>
          Stacks Guestbook is a decentralized message board built on the Stacks blockchain. 
          It allows users to leave messages, like other messages, and interact with the 
          blockchain in a simple and intuitive way.
        </p>
        <p>
          This application demonstrates how to build decentralized applications (dApps) 
          that leverage blockchain technology for data persistence and user authentication,
          while maintaining a familiar and user-friendly interface.
        </p>
      </section>
      
      <section>
        <h2>How it Works</h2>
        <p>
          When you connect your Stacks wallet, you can post messages to the blockchain. 
          These messages are stored permanently and cannot be altered or deleted. 
          Other users can view your messages and like them, creating a permanent 
          record of interactions.
        </p>
      </section>
      
      <section>
        <h2>Technology Stack</h2>
        <ul>
          <li><strong>Frontend:</strong> Vue.js 3 with Composition API</li>
          <li><strong>State Management:</strong> Vuex 4</li>
          <li><strong>Routing:</strong> Vue Router 4</li>
          <li><strong>Blockchain:</strong> Stacks</li>
          <li><strong>Smart Contracts:</strong> Clarity</li>
          <li><strong>Authentication:</strong> Stacks Connect</li>
          <li><strong>API Calls:</strong> Axios</li>
        </ul>
      </section>
      
      <section>
        <h2>About Stacks Blockchain</h2>
        <p>
          <a href="https://www.stacks.co/" target="_blank" rel="noopener noreferrer">Stacks</a> 
          is a layer-1 blockchain solution that is connected to Bitcoin. It brings smart contracts 
          and decentralized apps to Bitcoin. These apps are open and modular, meaning developers 
          can build on each other's apps, creating endless possibilities.
        </p>
        <p>
          Stacks uses the <a href="https://clarity-lang.org/" target="_blank" rel="noopener noreferrer">Clarity</a> 
          programming language for smart contracts. Clarity is designed to be secure, predictable, and 
          directly analyzable to reduce the risk of bugs and exploits.
        </p>
      </section>
      
      <section>
        <h2>Privacy & Security</h2>
        <p>
          All messages posted to the guestbook are public and visible to anyone. 
          Your wallet address is associated with your messages, but no other personal 
          information is collected or stored.
        </p>
      </section>
    </div>
  </div>
</template>

<script>
export default {
  name: 'About'
};
</script>

<style scoped>
.about {
  background-color: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

h1 {
  color: #5546FF;
  margin-top: 0;
  border-bottom: 1px solid #eee;
  padding-bottom: 1rem;
}

.about-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

section {
  margin-bottom: 1rem;
}

h2 {
  color: #333;
  font-size: 1.3rem;
  margin-bottom: 0.5rem;
}

p {
  line-height: 1.6;
  color: #555;
}

ul {
  padding-left: 1.5rem;
  line-height: 1.6;
  color: #555;
}

li {
  margin-bottom: 0.5rem;
}
</style>