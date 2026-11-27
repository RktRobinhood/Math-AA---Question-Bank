// Independent Gaussian elimination on the displayed coefficient matrix, not the
// generator's known line direction or its linear-offset construction.
function solve(T, rows, constants) {
  const A = rows.map((r, i) => [...r, constants[i]]);
  for (let j = 0; j < 3; j++) {
    let k = j;
    for (let m = j + 1; m < 3; m++) if (Math.abs(A[m][j]) > Math.abs(A[k][j])) k = m;
    T.require(Math.abs(A[k][j]) > 1e-9, "three supplied equations have a unique solution");
    [A[j], A[k]] = [A[k], A[j]];
    const divisor = A[j][j];
    A[j] = A[j].map(x => x / divisor);
    for (let m = 0; m < 3; m++) if (m !== j) {
      const scale = A[m][j];
      A[m] = A[m].map((x, i) => x - scale * A[j][i]);
    }
  }
  return A.map(r => r[3]);
}
export default {
  "t3-ahl-line-plane/translated-third-plane/equation": (q, T) => {
    const { normals, rhs, q: original, shift, observed, targetAxis, want } = q.params;
    const baseline = solve(T, normals, rhs);
    T.require(baseline.every((x, i) => Math.abs(x - original[i]) < 1e-9), "claimed original point lies on every plane");
    T.require(shift !== 0 && observed !== targetAxis && want !== original[targetAxis], "both asks move the intersection and focus on different axes");
    const after = solve(T, normals, [rhs[0], rhs[1], rhs[2] + shift]);
    const sliceNormal = [0, 0, 0]; sliceNormal[targetAxis] = 1;
    const target = solve(T, [normals[0], normals[1], sliceNormal], [rhs[0], rhs[1], want]);
    const requiredK = normals[2].reduce((total, x, i) => total + x * target[i], 0);
    // The third normal stays fixed; the stated k must be the absolute new RHS, not its change.
    T.require(Math.abs(solve(T, normals, [rhs[0], rhs[1], requiredK])[targetAxis] - want) < 1e-9,
      "new RHS produces the requested coordinate");
    return { a: after[observed], b: requiredK };
  }
};
