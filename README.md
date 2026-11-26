# VeriGrader: Open-ended Structured Question Assessment with Human-LLM Collaboration (CHI '26)

<p align="center">
  <a href="https://doi.org/10.1145/3772318.3791034"><img alt="ACM CHI '26" src="https://img.shields.io/badge/ACM_CHI-'26-FF6B5E?labelColor=493657"></a>
  <a href="LICENSE"><img alt="MIT License" src="https://img.shields.io/badge/License-MIT-00B8A9?labelColor=493657"></a>
</p>


Official implementation of **“Open-ended Structured Question Assessment with Human-LLM Collaboration”**, accepted at [ACM CHI 2026](https://doi.org/10.1145/3772318.3791034). [[Website](https://northxyran.github.io/VeriGrader/)] [[Video](https://youtu.be/cE8lAvIZVAQ)]

## Overview

VeriGrader is a human-LLM collaborative system for grading open-ended structured questions (OSQs). It uses an LLM to divide each student response into fine-grained pieces, align them with reference scoring points, classify them as correct, wrong, or unclear, and generate grading rationales. Instructors can inspect and revise these results through linked response, answer, and rationale views, then reuse confirmed results as few-shot examples for subsequent grading.

<p align="center">
  <img src="docs/images/interface.jpg" alt="VeriGrader's coordinated grading interface" width="100%">
</p>

<p align="center"><em>VeriGrader's coordinated interface for point-level inspection and correction.</em></p>

## Contributions

- We conduct stakeholder interviews and analyze graded exam papers to distill the grading practices and then compile requirements of human–AI collaboration for OSQ assessment.
- We develop a prototype system, VeriGrader, the first system supporting instructor-LLM collaborative OSQ grading. VeriGrader frees instructors from tedious manual response segmentation, scoring point mapping, and semantic judgment, while retaining their agency to inspect, correct grading results, and guide LLMs, thus achieving credible, reliable, consistent, and efficient OSQ grading.
- Empirical validation of VeriGrader in real-world educational contexts, demonstrating its advantages in grading efficiency, accuracy, consistency, and instructor agency, alongside an exploration of future potential and directions for transparent AI support in high-stakes assessment and beyond.

## Implementation

VeriGrader is implemented as a browser-based application using Vue 3, TypeScript, Vite, Pinia, and Element Plus. It communicates with an OpenAI-compatible LLM endpoint and stores working data locally in the browser.

The main workflow is:

1. Upload OSQs, reference answers with scoring points, and student responses; initial LLM grading starts automatically after validation.
2. The LLM segments and classifies response pieces and generates rationales.
3. Review the response, matched scoring point, and rationale in coordinated panels.
4. Correct or confirm results and save selected cases as few-shot exemplars.
5. Regrade selected responses and export the final results.

A fully synthetic upload example and the accepted JSON schemas are available in [`examples/`](examples/README.md).

The [project page](https://northxyran.github.io/VeriGrader/) embeds an [interactive demo](https://northxyran.github.io/VeriGrader/demo/) of the grading workspace with a synthetic Numerical Analysis midterm: four structured questions (interpolation vs. approximation, bisection vs. Newton's method, explicit vs. implicit Euler, direct vs. iterative linear solvers) answered by twelve students. You can inspect and correct pre-graded responses and use One, Problem, or All to regrade them. The demo loads prepared model results in the browser and needs no API key.

To run the prototype locally:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Configure the following variables in `frontend/.env`:

```dotenv
VITE_API_KEY=your-api-key
VITE_API_URL=https://your-openai-compatible-endpoint/v1/chat/completions
```

Model names and generation settings can be changed in `frontend/src/config/api.ts`. Because this research prototype calls the LLM endpoint from the browser, use it locally and do not deploy it publicly with a real API key.

### Build the project page and demo

The GitHub Pages site has two parts: the project page in `site/` at the root, and the demo app under `demo/`.

```bash
bash scripts/build-pages.sh    # assembles site/ and builds the demo into site/dist/demo
node scripts/serve-site.mjs    # preview at http://localhost:4173/VeriGrader/
```

The Pages build of the app excludes the local `VITE_` environment variables. Publish the contents of `site/dist/` to the root of the `gh-pages` branch. The project page combines `site/index.html` with section files in `site/sections/` and assets in `site/assets/`.

## Citation

If you find this work useful, please cite:

```bibtex
@inproceedings{lin2026verigrader,
  author    = {Lin, Fengyan and Lin, Yanna and Cao, Kai and Deng, Zikun and Cai, Yi},
  title     = {Open-ended Structured Question Assessment with Human-LLM Collaboration},
  booktitle = {Proceedings of the 2026 CHI Conference on Human Factors in Computing Systems},
  series    = {CHI '26},
  pages     = {1--21},
  publisher = {ACM},
  year      = {2026},
  doi       = {10.1145/3772318.3791034}
}
```
