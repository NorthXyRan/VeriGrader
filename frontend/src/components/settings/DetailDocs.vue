<template>
  <div class="page-container">
    <div class="base-card base-card--rounded-large docs-container">
      <div class="card-content">
        <div class="docs-header">
          <h1 class="docs-title">User Guide</h1>
          <p class="docs-subtitle">A practical guide to VeriGrader</p>
        </div>

        <div class="docs-main">
          <div class="section">
            <h2>Quick Start</h2>
            <p>
              VeriGrader combines LLM-assisted assessment with instructor review. Follow this
              workflow to grade a set of open-ended responses.
            </p>
            <div class="workflow-steps">
              <div class="step">
                <div class="step-number">1</div>
                <div class="step-content">
                  <h3>Upload and grade</h3>
                  <p>Upload the questions, reference answers, and student responses.</p>
                </div>
              </div>
              <div class="step">
                <div class="step-number">2</div>
                <div class="step-content">
                  <h3>Review a sample</h3>
                  <p>
                    Inspect several AI-generated results, correct the labels and reasoning, and save
                    representative examples.
                  </p>
                </div>
              </div>
              <div class="step">
                <div class="step-number">3</div>
                <div class="step-content">
                  <h3>Refine the results</h3>
                  <p>
                    Re-grade with the curated examples and repeat the review until the results are
                    reliable.
                  </p>
                </div>
              </div>
              <div class="step">
                <div class="step-number">4</div>
                <div class="step-content">
                  <h3>View the report</h3>
                  <p>Inspect score distributions and export the final grading results.</p>
                </div>
              </div>
            </div>
          </div>

          <div class="section">
            <h2>System Overview</h2>
            <p>
              The system keeps instructors in control while using an LLM to accelerate initial
              grading, explanation generation, and iterative refinement.
            </p>
          </div>

          <div class="section">
            <h2>Core Features</h2>
            <div class="features-grid">
              <div class="feature-item">
                <div class="feature-icon">🤖</div>
                <div class="feature-content">
                  <h3>AI-assisted grading</h3>
                  <p>Structured assessment through an OpenAI-compatible LLM API</p>
                </div>
              </div>
              <div class="feature-item">
                <div class="feature-icon">📊</div>
                <div class="feature-content">
                  <h3>Quality indicators</h3>
                  <p>Color-coded review priorities and quality-aware sorting</p>
                </div>
              </div>
              <div class="feature-item">
                <div class="feature-icon">✏️</div>
                <div class="feature-content">
                  <h3>Instructor annotation</h3>
                  <p>Editable highlights, rationales, and scores</p>
                </div>
              </div>
              <div class="feature-item">
                <div class="feature-icon">🧠</div>
                <div class="feature-content">
                  <h3>Few-shot refinement</h3>
                  <p>Reusable gold-standard papers and rationale examples</p>
                </div>
              </div>
            </div>
          </div>

          <div class="section help-section">
            <h2>Need Help?</h2>
            <div class="help-content">
              <p>See the repository README for setup instructions and technical details.</p>
              <div class="contact-info">
                <div class="contact-item">
                  <span class="contact-icon">📖</span>
                  <span>Documentation</span>
                </div>
                <div class="contact-item">
                  <span class="contact-icon">👥</span>
                  <span>Support</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts"></script>

<style scoped>
@import '../../assets/card-styles.css';

.docs-container {
  min-height: calc(100vh - 140px);
  max-width: 95%;
  margin: 0 auto;
}

.docs-header {
  text-align: center;
  margin-bottom: 48px;
  padding-bottom: 32px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.docs-title {
  font-size: 36px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 16px 0;
  font-family:
    -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif;
  letter-spacing: -0.02em;
}

.docs-subtitle {
  font-size: 18px;
  color: var(--text-secondary);
  margin: 0;
  font-family:
    -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif;
  opacity: 0.8;
}

.docs-main {
  line-height: 1.7;
}

.section {
  margin-bottom: 48px;
  position: relative;
}

.section h2 {
  font-size: 28px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 20px 0;
  font-family:
    -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif;
  letter-spacing: -0.01em;
}

.section p {
  font-size: 17px;
  color: var(--text-muted);
  margin: 0 0 20px 0;
  font-family:
    -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif;
  line-height: 1.6;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 24px;
  margin-top: 24px;
}

.feature-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 24px;
  background: rgba(0, 0, 0, 0.02);
  border-radius: var(--border-radius-card);
  transition: var(--transition-base);
}

.feature-item:hover {
  background: rgba(0, 0, 0, 0.04);
  transform: translateY(-2px);
}

.feature-icon {
  font-size: 24px;
  flex-shrink: 0;
  margin-top: 2px;
}

.feature-content h3 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px 0;
  font-family:
    -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif;
}

.feature-content p {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.5;
}

.workflow-steps {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-top: 24px;
}

.step {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  padding: 24px;
  background: linear-gradient(135deg, rgba(0, 122, 255, 0.05), rgba(175, 82, 222, 0.05));
  border-radius: var(--border-radius-card);
  border-left: 4px solid #007aff;
  transition: var(--transition-base);
}

.step:hover {
  background: linear-gradient(135deg, rgba(0, 122, 255, 0.08), rgba(175, 82, 222, 0.08));
  transform: translateX(4px);
}

.step-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: #007aff;
  color: white;
  border-radius: 50%;
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
  margin-top: 2px;
}

.step-content h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px 0;
  font-family:
    -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif;
}

.step-content p {
  font-size: 15px;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.5;
}

.help-section {
  background: linear-gradient(135deg, rgba(255, 149, 0, 0.05), rgba(255, 59, 48, 0.05));
  padding: 32px;
  border-radius: var(--border-radius-card-large);
  border: 1px solid rgba(255, 149, 0, 0.2);
}

.help-content p {
  margin-bottom: 24px;
}

.contact-info {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: var(--border-radius-small);
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  transition: var(--transition-base);
}

.contact-item:hover {
  background: rgba(255, 255, 255, 0.8);
  transform: translateY(-1px);
}

.contact-icon {
  font-size: 16px;
}

@media (max-width: 768px) {
  .docs-title {
    font-size: 28px;
  }

  .docs-subtitle {
    font-size: 16px;
  }

  .section h2 {
    font-size: 24px;
  }

  .features-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .contact-info {
    flex-direction: column;
    gap: 12px;
  }

  .step {
    padding: 20px 16px;
  }

  .help-section {
    padding: 24px 20px;
  }
}

@media (max-width: 480px) {
  .docs-title {
    font-size: 24px;
  }

  .section {
    margin-bottom: 32px;
  }

  .section h2 {
    font-size: 20px;
  }

  .feature-item {
    padding: 16px;
    gap: 12px;
  }

  .step {
    gap: 16px;
    padding: 16px;
  }

  .step-number {
    width: 28px;
    height: 28px;
    font-size: 12px;
  }
}
</style>
