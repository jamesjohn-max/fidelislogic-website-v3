// An import cycle between modules passes jest and `craco build` but kills the dev server:
// React Refresh reads a module's exports as it evaluates, and a re-exported const from the
// half-initialised side of a cycle is still in its TDZ ("Cannot access 'X' before
// initialization", blank page). This fails the suite instead. See roomPlannerShared.js.
const fs = require("fs");
const path = require("path");

const SRC = path.resolve(__dirname, "..");
const EXTENSIONS = ["", ".js", ".jsx", "/index.js", "/index.jsx"];
// Static imports and re-exports only: `import x from "./a"`, `export { x } from "./a"`, `import "./a"`.
// Anchored to a line start so commented-out imports are ignored; dynamic import() is lazy and exempt.
const STATIC_IMPORT = /^\s*(?:(?:import|export)\s[^;'"]*?from\s*|import\s*)['"]([^'"]+)['"]/gm;

const listFiles = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    return e.isDirectory() ? listFiles(full) : /\.jsx?$/.test(e.name) ? [full] : [];
  });

const resolveImport = (from, spec) => {
  if (!spec.startsWith(".")) return null; // a package; cannot cycle back into src
  const base = path.resolve(path.dirname(from), spec);
  return EXTENSIONS.map((ext) => base + ext).find((f) => fs.existsSync(f) && fs.statSync(f).isFile()) ?? null;
};

const buildGraph = () => {
  const graph = new Map();
  listFiles(SRC).forEach((file) => {
    const deps = [...fs.readFileSync(file, "utf8").matchAll(STATIC_IMPORT)].map((m) => resolveImport(file, m[1])).filter(Boolean);
    graph.set(file, [...new Set(deps)]);
  });
  return graph;
};

// Tarjan's strongly-connected components: any component of 2+ files, or a file importing
// itself, is a cycle.
export function findCycles(graph) {
  let counter = 0;
  const index = new Map(), low = new Map(), onStack = new Set(), stack = [], cycles = [];
  const visit = (v) => {
    index.set(v, counter); low.set(v, counter); counter += 1;
    stack.push(v); onStack.add(v);
    (graph.get(v) ?? []).forEach((w) => {
      if (!index.has(w)) { visit(w); low.set(v, Math.min(low.get(v), low.get(w))); }
      else if (onStack.has(w)) low.set(v, Math.min(low.get(v), index.get(w)));
    });
    if (low.get(v) === index.get(v)) {
      const scc = [];
      let w;
      do { w = stack.pop(); onStack.delete(w); scc.push(w); } while (w !== v);
      if (scc.length > 1 || (graph.get(v) ?? []).includes(v)) cycles.push(scc.reverse());
    }
  };
  [...graph.keys()].forEach((v) => { if (!index.has(v)) visit(v); });
  return cycles;
}

describe("import cycles", () => {
  it("finds a cycle when there is one", () => {
    const graph = new Map([["a", ["b"]], ["b", ["c"]], ["c", ["a"]], ["d", ["a"]]]);
    expect(findCycles(graph).map((c) => [...c].sort())).toEqual([["a", "b", "c"]]);
  });

  it("leaves frontend/src free of import cycles", () => {
    const names = (cycle) => cycle.map((f) => path.relative(SRC, f)).join(" -> ");
    const graph = buildGraph();
    // Guard against the scan silently finding no imports (a broken regex would pass vacuously).
    expect([...graph.values()].flat().length).toBeGreaterThan(50);
    const cycles = findCycles(graph);
    expect(cycles.map(names)).toEqual([]);
  });
});
