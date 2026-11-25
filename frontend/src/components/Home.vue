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
  max-width: 95%;
  margin: 20px auto;
  background: #fbfbfd;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif;
  border-radius: 30px;
}

.features-section {
  padding: 60px 80px 100px;
}

.section-header {
  text-align: center;
  margin-bottom: 80px;
}

.section-header h2 {
  font-size: 56px;
  font-weight: 600;
  color: #1d1d1f;
  margin: 0 0 24px 0;
  letter-spacing: -1px;
  line-height: 1.1;
}

.section-header p {
  font-size: 24px;
  color: #86868b;
  margin: 0;
  line-height: 1.5;
  max-width: 800px;
  margin: 0 auto;
  font-weight: 400;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 40px;
  margin-top: 60px;
}

.feature-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 30px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  position: relative;
  border: 1px solid rgba(0, 0, 0, 0.06);
  font: inherit;
  text-align: left;
}

.feature-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.12);
  background: rgba(255, 255, 255, 1);
}

.card-visual {
  height: 240px;
  position: relative;
  overflow: hidden;
}

.visual-bg {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.upload-bg {
  background: rgba(255, 159, 10, 0.15);
}

.grading-bg {
  background: rgba(255, 100, 130, 0.15);
}

.analysis-bg {
  background: rgba(218, 143, 255, 0.15);
}

.visual-icon {
  font-size: 72px;
  color: rgba(0, 0, 0, 0.2);
  transition: transform 0.4s ease;
}

.feature-card:hover .visual-icon {
  transform: scale(1.05);
}

.card-info {
  padding: 36px;
  position: relative;
}

.feature-badge {
  position: absolute;
  top: -14px;
  left: 36px;
  padding: 8px 16px;
  border-radius: 14px;
  font-size: 14px;
  font-weight: 600;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  letter-spacing: 0.5px;
}

.feature-badge.new {
  background: rgb(255, 159, 10);
}

.feature-badge.featured {
  background: rgb(255, 100, 130);
}

.feature-badge.insights {
  background: rgb(218, 143, 255);
}

.feature-card h3 {
  font-size: 32px;
  font-weight: 600;
  color: #1d1d1f;
  margin: 24px 0 20px 0;
  letter-spacing: -0.6px;
}

.feature-card p {
  font-size: 19px;
  color: #515154;
  line-height: 1.6;
  margin: 0 0 32px 0;
  font-weight: 400;
}

.feature-highlights {
  display: flex;
  flex-direction: column;
  gap: 14px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  padding-top: 24px;
}

.feature-highlights span {
  font-size: 17px;
  color: #515154;
  font-weight: 400;
  position: relative;
  padding-left: 24px;
}

.feature-highlights span::before {
  content: '•';
  position: absolute;
  left: 0;
  color: #86868b;
  font-size: 24px;
  line-height: 1;
}

.secondary-section {
  background: #f5f5f7;
  padding: 100px 80px;
}

.capabilities-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 40px;
  margin-top: 60px;
}

.capability-card {
  background: #ffffff;
  padding: 40px 36px;
  border-radius: 24px;
  text-align: center;
  transition: all 0.4s cubic-bezier(0.215, 0.61, 0.355, 1);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
  border: 1px solid rgba(0, 0, 0, 0.03);
}

.capability-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.08);
}

.capability-icon {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #007aff 0%, #5e5ce6 100%);
  border-radius: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 30px;
  font-size: 36px;
  color: white;
}

.capability-card h4 {
  font-size: 24px;
  font-weight: 600;
  color: #1d1d1f;
  margin: 0 0 16px 0;
}

.capability-card p {
  font-size: 18px;
  color: #86868b;
  line-height: 1.5;
  margin: 0;
}

.usage-section {
  padding: 100px 80px 140px;
  background: #fbfbfd;
  border-radius: 30px;
}

.usage-card {
  background: #ffffff;
  border-radius: 30px;
  padding: 60px;
  display: flex;
  align-items: center;
  gap: 50px;
  max-width: 1400px;
  margin: 0 auto;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.03);
  transition: all 0.4s cubic-bezier(0.215, 0.61, 0.355, 1);
}

.usage-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 35px 60px rgba(0, 0, 0, 0.08);
}

.usage-icon {
  flex: 0 0 120px;
  height: 120px;
  background: linear-gradient(135deg, #bf5af2 0%, #ff2d55 100%);
  border-radius: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.usage-icon .el-icon {
  font-size: 56px;
  color: white;
}

.usage-content {
  flex: 1;
}

.usage-content h3 {
  font-size: 32px;
  font-weight: 600;
  color: #1d1d1f;
  margin: 0 0 24px 0;
  letter-spacing: -0.5px;
}

.usage-content p {
  font-size: 20px;
  color: #515154;
  line-height: 1.6;
  margin: 0;
}

@media (max-width: 1800px) {
  .features-grid,
  .capabilities-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 32px;
  }

  .usage-card {
    flex-direction: row;
    text-align: center;
    padding: 50px;
  }
}

@media (max-width: 1200px) {
  .features-section {
    padding: 60px 40px 100px;
  }
  .secondary-section,
  .usage-section {
    padding: 100px 40px;
  }
}

@media (max-width: 1024px) {
  .features-grid {
    grid-template-columns: 1fr;
    gap: 32px;
  }

  .section-header h2 {
    font-size: 44px;
  }

  .section-header p {
    font-size: 20px;
  }
}

@media (max-width: 768px) {
  .features-section {
    padding: 40px 24px 80px;
  }
  .secondary-section,
  .usage-section {
    padding: 80px 24px;
  }

  .section-header h2 {
    font-size: 36px;
  }

  .capabilities-grid {
    grid-template-columns: 1fr;
    gap: 24px;
  }

  .feature-card h3 {
    font-size: 28px;
  }

  .usage-card {
    padding: 40px 24px;
  }

  .usage-icon {
    width: 80px;
    height: 80px;
    border-radius: 20px;
  }

  .usage-icon .el-icon {
    font-size: 40px;
  }
}

@media (max-width: 480px) {
  .section-header h2 {
    font-size: 32px;
  }

  .section-header p {
    font-size: 18px;
  }

  .feature-card p,
  .usage-content p {
    font-size: 17px;
  }

  .usage-content h3 {
    font-size: 26px;
  }
}
</style>
