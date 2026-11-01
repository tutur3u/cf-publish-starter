// A tiny bit of JavaScript: count button clicks and show the current year.
let count = 0
document.getElementById('btn').addEventListener('click', () => {
  count += 1
  document.getElementById('count').textContent = count
})
document.getElementById('year').textContent = new Date().getFullYear()
