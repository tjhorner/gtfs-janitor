const colors = [
  "#FF8A4C", // Orange
  "#B388FF", // Purple
  "#60c771", // Green
  "#b8962f", // Yellow
  "#e1346d", // Pink
  "#42cddf", // Blue
  "#a1a1a1", // Gray
]

export function getColor(index: number) {
  return colors[index % colors.length]
}