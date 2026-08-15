import confetti from 'canvas-confetti'

export function fireGoalConfetti() {
  confetti({
    particleCount: 120,
    spread: 80,
    origin: { y: 0.6 },
    colors: ['#C8B89A', '#EDE0D4', '#D4893A', '#7DAA96', '#F5EFE6'],
  })
  // Fire again after 300ms for double burst
  setTimeout(
    () =>
      confetti({
        particleCount: 60,
        spread: 120,
        origin: { y: 0.5 },
        colors: ['#C8B89A', '#EDE0D4', '#D4893A'],
      }),
    300
  )
}
