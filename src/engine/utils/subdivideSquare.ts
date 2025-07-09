function subdivideSquare(
  tiles: number,
  width: number
): { vertices: number[]; indices: number[] } {
  const tileWidth = width / tiles;
  const centringAdjustment = 0.5 * (1 - 1 / tiles) * width;
  const meshStart = -tileWidth - centringAdjustment;
  const newVertices: number[] = [];
  const indices: number[] = [];

  const vertexCount = (tiles + 1) ** 2;

  for (let i = 0; i < vertexCount; i++) {
    const row = Math.floor(i / (tiles + 1));
    const column = i - (tiles + 1) * row;
    newVertices.push(
      meshStart + column * tileWidth,
      0,
      meshStart + row * tileWidth
    );
  }

  for (let x = 0; x < tiles; x++) {
    for (let y = 0; y < tiles; y++) {
      const currentRowOffset = y * (tiles + 1);
      const nextRowOffset = (y + 1) * (tiles + 1);
      indices.push(
        currentRowOffset + x + 1,
        nextRowOffset + x + 1,
        nextRowOffset + x
      );
      indices.push(
        currentRowOffset + x,
        currentRowOffset + x + 1,
        nextRowOffset + x
      );
    }
  }

  return {
    vertices: newVertices,
    indices,
  };
}

export { subdivideSquare };
