const colors = [
  "#FF8A4C", // Orange
  "#B388FF", // Purple
  "#8BEF9B", // Green
  "#FFD966", // Yellow
  "#FFA7C4", // Pink
  "#80DEEA", // Blue
  "#E0E0E0", // Gray
]

export function getColor(index: number) {
  return colors[index % colors.length]
}