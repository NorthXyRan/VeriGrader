<template>
  <div class="home-container">
    <div class="features-section">
      <div class="section-header">
        <h2>Choose your workflow</h2>
        <p>Start with uploading your files, then proceed to intelligent grading and analysis</p>
      </div>

      <div class="features-grid">
        <button type="button" class="feature-card upload-card" @click="openPage('uploading')">
          <div class="card-visual">
            <div class="visual-bg upload-bg">
              <div class="visual-icon">
                <el-icon><Upload /></el-icon>
              </div>
            </div>
          </div>
          <div class="card-info">
            <div class="feature-badge new">Start Here</div>
            <h3>File Upload</h3>
            <p>
              Upload questions, reference answers, and student responses, then start AI grading.
            </p>
            <div class="feature-highlights">
              <span>Student responses use JSON</span>
              <span>TXT and DOCX files can be parsed by the LLM</span>
              <span>JSON provides the fastest upload path</span>
            </div>
          </div>
        </button>

        <button type="button" class="feature-card grading-card" @click="openPage('grading')">
          <div class="card-visual">
            <div class="visual-bg grading-bg">
              <div class="visual-icon">
                <el-icon><EditPen /></el-icon>
              </div>
            </div>
          </div>
          <div class="card-info">
            <div class="feature-badge featured">AI Powered</div>
            <h3>Intelligent Grading</h3>
            <p>
              Combine LLM grading, few-shot examples, and instructor review for consistent results.
            </p>
            <div class="feature-highlights">
              <span>Few-shot learning</span>
              <span>Scoring-point matching</span>
              <span>Instructor annotation</span>
            </div>
          </div>
        </button>

        <button type="button" class="feature-card analysis-card" @click="openPage('result')">
          <div class="card-visual">
            <div class="visual-bg analysis-bg">
              <div class="visual-icon">
                <el-icon><DataAnalysis /></el-icon>
              </div>
            </div>
          </div>
          <div class="card-info">
            <div class="feature-badge insights">Analytics</div>
            <h3>Result Analysis</h3>
            <p>Review finalized grading results, summary statistics, and quality indicators.</p>
            <div class="feature-highlights">
              <span>Final results</span>
              <span>Summary statistics</span>
              <span>Report export</span>
            </div>
          </div>
        </button>
      </div>
    </div>

    <div class="secondary-section">
      <div class="section-header">
        <h2>Key capabilities</h2>
        <p>Advanced features designed for educational professionals</p>
      </div>

      <div class="capabilities-grid">
        <div class="capability-card">
          <div class="capability-icon">
            <el-icon><Star /></el-icon>
          </div>
          <h4>Few-shot Learning</h4>
          <p>Learn from grading examples to maintain consistency across evaluations</p>
        </div>

        <div class="capability-card">
          <div class="capability-icon">
            <el-icon><Document /></el-icon>
          </div>
          <h4>Smart Annotation</h4>
          <p>Highlight and categorize answer segments with intelligent suggestions</p>
        </div>

        <div class="capability-card">
          <div class="capability-icon">
            <el-icon><TrendCharts /></el-icon>
          </div>
          <h4>Performance Insights</h4>
          <p>Track grading accuracy, efficiency, and student performance trends</p>
        </div>
      </div>
    </div>

    <div class="usage-section">
      <div class="section-header">
        <h2>Suggested workflow</h2>
        <p>Optimize your workflow with our recommended approach</p>
      </div>

      <div class="usage-card">
        <div class="usage-icon">
          <el-icon><Guide /></el-icon>
        </div>
        <div class="usage-content">
          <h3>Review before scaling</h3>
          <p>
            Upload the required files and grade a small set of responses first. Review their labels,
            reference-answer matches, scores, and rationales. Save reliable results as examples,
            then use them to grade the remaining responses consistently.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  DataAnalysis,
  Document,
  EditPen,
  Guide,
  Star,
  TrendCharts,
  Upload,
} from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const openPage = (path: 'uploading' | 'grading' | 'result') => {
  router.push(`/${path}`)
}
</script>

<style scoped>
.home-container {
  max-width: 1320px;
  margin: var(--shell-gutter) auto;
  margin-inline: var(--shell-gutter);
  overflow: hidden;
  background: #fbfbfd;
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-soft);
}

@media (min-width: 1400px) {
  .home-container {
    margin-inline: auto;
  }
}

.features-section {
  padding: 56px 48px 64px;
}

.section-header {
  margin-bottom: 40px;
  text-align: center;
}

.section-header h2 {
  margin: 0 0 12px;
  color: #1d1d1f;
  font-size: 40px;
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.1;
}

.section-header p {
  max-width: 640px;
  margin: 0 auto;
  color: #6e6e73;
  font-size: 18px;
  line-height: 1.5;
}

.features-grid,
.capabilities-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
}

.feature-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  overflow: hidden;
  padding: 0;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: var(--radius-xl);
  background: #ffffff;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  color: inherit;
  cursor: pointer;
  font: inherit;
  text-align: left;
  transition:
    box-shadow 0.25s ease,
    transform 0.25s ease;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.1);
}

.feature-card:focus-visible {
  outline: 3px solid rgba(0, 122, 255, 0.5);
  outline-offset: 3px;
}

.card-visual {
  height: 168px;
  overflow: hidden;
}

.visual-bg {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.upload-bg {
  background: rgba(255, 159, 10, 0.14);
}

.grading-bg {
  background: rgba(255, 100, 130, 0.14);
}

.analysis-bg {
  background: rgba(218, 143, 255, 0.16);
}

.visual-icon {
  color: rgba(0, 0, 0, 0.22);
  font-size: 56px;
  transition: transform 0.3s ease;
}

.feature-card:hover .visual-icon {
  transform: scale(1.06);
}

.card-info {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 32px 28px 28px;
}

.feature-badge {
  position: absolute;
  top: -13px;
  left: 28px;
  padding: 5px 12px;
  border-radius: var(--radius-pill);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  color: white;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.feature-badge.new {
  background: rgb(255, 159, 10);
}

.feature-badge.featured {
  background: rgb(255, 100, 130);
}

.feature-badge.insights {
  background: rgb(191, 112, 240);
}

.feature-card h3 {
  margin: 0 0 10px;
  color: #1d1d1f;
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.feature-card p {
  margin: 0 0 20px;
  color: #515154;
  font-size: 15px;
  line-height: 1.6;
}

.feature-highlights {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.feature-highlights span {
  position: relative;
  padding-left: 18px;
  color: #515154;
  font-size: 14px;
  line-height: 1.45;
}

.feature-highlights span::before {
  content: '';
  position: absolute;
  top: 0.6em;
  left: 2px;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #a1a1a6;
}

.secondary-section {
  padding: 64px 48px;
  background: #f5f5f7;
}

.capability-card {
  padding: 32px 28px;
  border: 1px solid rgba(0, 0, 0, 0.04);
  border-radius: var(--radius-lg);
  background: #ffffff;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
  text-align: center;
  transition:
    box-shadow 0.25s ease,
    transform 0.25s ease;
}

.capability-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.07);
}

.capability-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  margin: 0 auto 20px;
  border-radius: 16px;
  background: linear-gradient(135deg, #007aff 0%, #5e5ce6 100%);
  color: white;
  font-size: 26px;
}

.capability-card h4 {
  margin: 0 0 8px;
  color: #1d1d1f;
  font-size: 18px;
  font-weight: 600;
}

.capability-card p {
  margin: 0;
  color: #6e6e73;
  font-size: 15px;
  line-height: 1.55;
}

.usage-section {
  padding: 64px 48px 72px;
  background: #fbfbfd;
}

.usage-card {
  display: flex;
  align-items: center;
  gap: 32px;
  max-width: 960px;
  margin: 0 auto;
  padding: 36px 40px;
  border: 1px solid rgba(0, 0, 0, 0.04);
  border-radius: var(--radius-xl);
  background: #ffffff;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.05);
}

.usage-icon {
  display: flex;
  flex: 0 0 80px;
  align-items: center;
  justify-content: center;
  height: 80px;
  border-radius: 22px;
  background: linear-gradient(135deg, #bf5af2 0%, #ff2d55 100%);
}

.usage-icon .el-icon {
  color: white;
  font-size: 38px;
}

.usage-content {
  flex: 1;
}

.usage-content h3 {
  margin: 0 0 10px;
  color: #1d1d1f;
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.usage-content p {
  margin: 0;
  color: #515154;
  font-size: 16px;
  line-height: 1.65;
}

@media (max-width: 1100px) {
  .features-grid {
    grid-template-columns: minmax(0, 1fr);
    max-width: 560px;
    margin: 0 auto;
  }
}

@media (max-width: 900px) {
  .capabilities-grid {
    grid-template-columns: minmax(0, 1fr);
    max-width: 560px;
    margin: 0 auto;
  }
}

@media (max-width: 760px) {
  .features-section,
  .secondary-section,
  .usage-section {
    padding: 40px 18px;
  }

  .section-header {
    margin-bottom: 28px;
  }

  .section-header h2 {
    font-size: 30px;
  }

  .section-header p {
    font-size: 16px;
  }

  .card-visual {
    height: 128px;
  }

  .usage-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
    padding: 28px 22px;
  }

  .usage-icon {
    flex-basis: 64px;
    width: 64px;
    height: 64px;
    border-radius: 18px;
  }

  .usage-icon .el-icon {
    font-size: 30px;
  }
}
</style>
