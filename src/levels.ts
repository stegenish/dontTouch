export type Rect = {
  x: number
  y: number
  width: number
  height: number
}

export type Level = {
  name: string
  obstacles: Rect[]
}

export const board = {
  width: 900,
  height: 520,
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function makeLevel(levelNumber: number): Level {
  const obstacleCount = Math.min(4 + Math.floor((levelNumber - 1) / 4), 9)
  const obstacleWidth = Math.max(46 - Math.floor(levelNumber / 4), 28)
  const gapHeight = Math.max(188 - levelNumber * 4, 94)
  const firstX = 170
  const lastX = 710
  const spacing = (lastX - firstX) / Math.max(obstacleCount - 1, 1)

  const obstacles = Array.from({ length: obstacleCount }).flatMap((_, index) => {
    const wave = Math.sin(levelNumber * 1.7 + index * 2.15)
    const gapCenter = clamp(260 + wave * 125, 110, 410)
    const gapTop = clamp(gapCenter - gapHeight / 2, 28, board.height - gapHeight - 28)
    const gapBottom = gapTop + gapHeight
    const x = Math.round(firstX + spacing * index)
    const redBlocks: Rect[] = []

    if (gapTop > 0) {
      redBlocks.push({
        x,
        y: 0,
        width: obstacleWidth,
        height: Math.round(gapTop),
      })
    }

    if (gapBottom < board.height) {
      redBlocks.push({
        x,
        y: Math.round(gapBottom),
        width: obstacleWidth,
        height: board.height - Math.round(gapBottom),
      })
    }

    return redBlocks
  })

  return {
    name: `Nivå ${levelNumber}`,
    obstacles,
  }
}

export const levels: Level[] = Array.from({ length: 25 }, (_, index) =>
  makeLevel(index + 1),
)
