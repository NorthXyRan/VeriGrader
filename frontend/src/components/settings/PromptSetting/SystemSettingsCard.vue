<template>
  <div class="prompt-card">
    <div class="card-content">
      <div class="card-badge">SYSTEM SETTINGS</div>

      <div class="apple-features">
        <div class="apple-feature">
          <div class="feature-icon">
            <el-icon><User /></el-icon>
          </div>
          <div class="feature-content">
            <h4>Grader Role</h4>
            <p>{{ promptData.role }}</p>
          </div>
        </div>

        <div class="apple-feature">
          <div class="feature-icon">
            <el-icon><Document /></el-icon>
          </div>
          <div class="feature-content">
            <h4>Task Description</h4>
            <p>{{ promptData.task_description }}</p>
          </div>
        </div>

        <div class="apple-feature">
          <div class="feature-icon">
            <el-icon><Trophy /></el-icon>
          </div>
          <div class="feature-content">
            <h4>Scoring Policy</h4>
            <p>{{ promptData.scoring_policy }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Document, Trophy, User } from '@element-plus/icons-vue'

interface Props {
  promptData: {
    role: string
    task_description: string
    scoring_policy: string
  }
}

defineProps<Props>()
</script>

<style scoped>
.apple-features {
  display: flex;
  flex-direction: column;
  gap: 24px;
  flex: 1;
}

.apple-feature {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.apple-feature:last-child {
  border-bottom: none;
}

.feature-icon {
  width: 44px;
  height: 44px;
  background: linear-gradient(135deg, #007aff 0%, #5856d6 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
  flex-shrink: 0;
}

.feature-content h4 {
  font-size: 20px;
  font-weight: 600;
  color: #1d1d1f;
  line-height: 1.2;
  margin: 0 0 6px 0;
  font-family:
    -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif;
}

.feature-content p {
  font-size: 18px;
  font-weight: 400;
  color: #515154;
  line-height: 1.4;
  margin: 0;
  font-family:
    -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif;
}
</style>
