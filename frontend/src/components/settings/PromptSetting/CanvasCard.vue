<template>
  <div class="prompt-card">
    <div class="canvas-content">
      <h2 class="canvas-title">Making Grading Easier, Faster, Simpler and More Accurate.</h2>
      <img :src="pikachuIcon" alt="Pikachu grading illustration" class="canvas-pikachu" />
    </div>
  </div>
</template>

<script setup lang="ts">
import pikachuIcon from '@/assets/icons/pikachu.svg'
</script>

<style scoped>
.canvas-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  height: 100%;
  padding: 32px 20px 20px 20px;
  gap: 20px;
}

.canvas-title {
  font-size: 36px;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.02em;
  font-family:
    -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif;
  max-width: 90%;

  background: linear-gradient(135deg, #007aff 0%, #5856d6 50%, #af52de 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.canvas-pikachu {
  width: 90%;
  max-width: 500px;
  height: auto;
  animation: gentle-bounce 1.5s ease-in-out infinite;
  margin-top: 36px;
}

@keyframes gentle-bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-15px);
  }
}

@media (max-width: 1200px) {
  .canvas-content {
    padding: 24px 20px;
    gap: 16px;
  }

  .canvas-title {
    font-size: 24px;
  }

  .canvas-pikachu {
    width: 95%;
  }
}
</style>
