export function initPage() {
  const nav = document.querySelector('.nav')
  const onScroll = () => nav?.classList.toggle('is-scrolled', window.scrollY > 8)
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })

  // Highlight the nav link of the section in view.
  const links = new Map(
    [...document.querySelectorAll('.nav__links a[href^="#"]')].map((a) => [a.hash.slice(1), a]),
  )
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        for (const a of links.values()) a.classList.remove('is-active')
        links.get(entry.target.id)?.classList.add('is-active')
      }
    },
    { rootMargin: '-45% 0px -50% 0px' },
  )
  for (const id of links.keys()) {
    const section = document.getElementById(id)
    if (section) sectionObserver.observe(section)
  }

  // Reveal elements once as they scroll into view.
  const revealObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        entry.target.classList.add('is-visible')
        revealObserver.unobserve(entry.target)
      }
    },
    { rootMargin: '0px 0px -8% 0px' },
  )
  document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el))

  // Copy buttons: data-copy="<selector of the element to copy>".
  document.querySelectorAll('[data-copy]').forEach((button) => {
    button.addEventListener('click', async () => {
      const text = document.querySelector(button.dataset.copy)?.textContent ?? ''
      try {
        await navigator.clipboard.writeText(text)
        button.textContent = 'Copied'
      } catch {
        button.textContent = 'Select and copy'
      }
      setTimeout(() => (button.textContent = 'Copy'), 1600)
    })
  })
}
