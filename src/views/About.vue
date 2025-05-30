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
          <li><strong>Frontend:</strong> Vue.js</li>
          <li><strong>Blockchain:</strong> Stacks</li>
          <li><strong>Smart Contracts:</strong> Clarity</li>
          <li><strong>Authentication:</strong> Stacks Connect</li>
        </ul>
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