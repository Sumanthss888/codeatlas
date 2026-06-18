"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import type { RepoFile } from "@/app/page";
import {
  Sparkles,
  Layers,
  Search,
  Activity,
  ArrowRight,
  Maximize2,
  RefreshCw,
  Folder,
  Eye,
  FileCode,
  AlertCircle,
  Link,
  ChevronRight,
  HelpCircle,
  ZoomIn,
  ZoomOut,
  X
} from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

type Props = {
  files: RepoFile[];
  activeFile: string | null;
  onFileSelect: (filePath: string) => void;
  onSendMessage: (content: string) => void;
};

interface GraphNode {
  id: string; // absolute file path
  name: string; // file name
  role: string;
  color: string;
  size: number;
}

interface GraphEdge {
  source: string;
  target: string;
}

interface NodePosition {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

// ─── 1. Import Analysis Layer (Client-Side) ───────────────────────────
function resolvePath(currentFilePath: string, importPath: string, allPaths: string[]): string | null {
  if (!importPath.startsWith(".")) {
    // Resolve absolute path aliases (e.g. "@/components/Sidebar" -> "src/components/Sidebar")
    if (importPath.startsWith("@/")) {
      const aliasPath = importPath.slice(2);
      const resolved = findFileMatch("src/" + aliasPath, allPaths);
      if (resolved) return resolved;
    }
    return null;
  }

  // Resolve relative path
  const parts = currentFilePath.split("/");
  parts.pop(); // remove filename to get directory parts
  
  const importParts = importPath.split("/");
  for (const part of importParts) {
    if (part === ".") {
      continue;
    } else if (part === "..") {
      parts.pop();
    } else {
      parts.push(part);
    }
  }

  const resolvedBase = parts.join("/");
  return findFileMatch(resolvedBase, allPaths);
}

function findFileMatch(basePath: string, allPaths: string[]): string | null {
  if (allPaths.includes(basePath)) return basePath;

  const extensions = [
    ".tsx",
    ".ts",
    ".jsx",
    ".js",
    ".json",
    ".md",
    "/index.tsx",
    "/index.ts",
    "/index.jsx",
    "/index.js"
  ];
  for (const ext of extensions) {
    const pathWithExt = basePath + ext;
    if (allPaths.includes(pathWithExt)) return pathWithExt;
  }

  return null;
}

function extractImports(filePath: string, content: string, allPaths: string[]): string[] {
  const imports: string[] = [];
  const ext = filePath.split(".").pop()?.toLowerCase();

  if (["ts", "tsx", "js", "jsx"].includes(ext || "")) {
    // JS/TS import regexes
    const importRegex = /import\s+(?:(?:\*|[\w\s{},]*)\s+from\s+)?['"]([^'"]+)['"]/g;
    const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
    const exportRegex = /export\s+(?:(?:\*|[\w\s{},]*)\s+from\s+)?['"]([^'"]+)['"]/g;
    
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    while ((match = requireRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    while ((match = exportRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
  } else if (ext === "py") {
    // Python imports regexes
    const importRegex1 = /^\s*import\s+([a-zA-Z0-9_\.]+)/gm;
    const importRegex2 = /^\s*from\s+([a-zA-Z0-9_\.]+)\s+import/gm;
    const relImportRegex = /^\s*from\s+\.([a-zA-Z0-9_\.]*)\s+import/gm;

    let match;
    while ((match = importRegex1.exec(content)) !== null) {
      imports.push(match[1].replace(/\./g, "/"));
    }
    while ((match = importRegex2.exec(content)) !== null) {
      imports.push(match[1].replace(/\./g, "/"));
    }
    while ((match = relImportRegex.exec(content)) !== null) {
      const pathPart = match[1] ? "/" + match[1].replace(/\./g, "/") : "";
      imports.push("." + pathPart);
    }
  }
  
  const resolvedPaths: string[] = [];
  imports.forEach((imp) => {
    const resolved = resolvePath(filePath, imp, allPaths);
    if (resolved && resolved !== filePath) {
      resolvedPaths.push(resolved);
    }
  });

  return Array.from(new Set(resolvedPaths));
}

// ─── 2. Node Classification ───────────────────────────────────────────
function classifyNode(filePath: string): { role: string; color: string; size: number } {
  const name = filePath.split("/").pop() || "";
  const ext = name.split(".").pop()?.toLowerCase() || "";
  
  if (filePath.includes("route.ts") || filePath.includes("api/")) {
    return { role: "API Route", color: "#e63946", size: 26 };
  }
  if (filePath.includes("page.tsx") || filePath.includes("layout.tsx")) {
    return { role: "Page / Layout", color: "#ffb703", size: 28 };
  }
  if (filePath.includes("components/")) {
    return { role: "UI Component", color: "#4361EE", size: 24 };
  }
  if (filePath.includes("hooks/") || name.startsWith("use")) {
    return { role: "React Hook", color: "#7209B7", size: 22 };
  }
  if (filePath.includes("context/") || filePath.includes("store/")) {
    return { role: "State Manager", color: "#f72585", size: 23 };
  }
  if (ext === "md" || filePath.includes("docs/")) {
    return { role: "Documentation", color: "#2a9d8f", size: 20 };
  }
  if (name === "package.json" || name.includes("config") || name.startsWith("tsconfig")) {
    return { role: "Configuration", color: "#6c757d", size: 22 };
  }
  if (ext === "json") {
    return { role: "Data / JSON", color: "#00b4d8", size: 20 };
  }
  if (ext === "ts" || ext === "tsx") {
    return { role: "TypeScript Code", color: "#3178c6", size: 24 };
  }
  if (ext === "js" || ext === "jsx") {
    return { role: "JavaScript Code", color: "#f1e05a", size: 24 };
  }
  
  return { role: "Module File", color: "#adb5bd", size: 22 };
}

// ─── 3. Layout Engines ──────────────────────────────────────────────────
function runForceLayout(
  nodes: GraphNode[],
  edges: GraphEdge[],
  width = 800,
  height = 550,
  iterations = 100
): Record<string, { x: number; y: number }> {
  const positions: Record<string, NodePosition> = {};
  
  // Initialize in a circle
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(centerX, centerY) * 0.7;
  
  nodes.forEach((node, idx) => {
    const angle = (idx / nodes.length) * 2 * Math.PI;
    positions[node.id] = {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
      vx: 0,
      vy: 0,
    };
  });

  const k = 70; // Spring equilibrium length
  const repForce = 8000; // Node repulsion
  const attrForce = 0.08; // Spring strength
  const centerForce = 0.01; // Gravity to center

  for (let iter = 0; iter < iterations; iter++) {
    // 1. Repulsion forces between node pairs
    for (let i = 0; i < nodes.length; i++) {
      const nodeA = nodes[i];
      const posA = positions[nodeA.id];
      for (let j = i + 1; j < nodes.length; j++) {
        const nodeB = nodes[j];
        const posB = positions[nodeB.id];
        
        const dx = posA.x - posB.x;
        const dy = posA.y - posB.y;
        const distSq = dx * dx + dy * dy + 0.1;
        const dist = Math.sqrt(distSq);
        
        if (dist < 400) {
          const force = repForce / distSq;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          
          posA.vx += fx;
          posA.vy += fy;
          posB.vx -= fx;
          posB.vy -= fy;
        }
      }
    }

    // 2. Attraction along edges
    edges.forEach((edge) => {
      const posA = positions[edge.source];
      const posB = positions[edge.target];
      if (!posA || !posB) return;
      
      const dx = posA.x - posB.x;
      const dy = posA.y - posB.y;
      const dist = Math.sqrt(dx * dx + dy * dy) + 0.1;
      
      const force = attrForce * (dist - k);
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      
      posA.vx -= fx;
      posA.vy -= fy;
      posB.vx += fx;
      posB.vy += fy;
    });

    // 3. Update positions & apply damping
    nodes.forEach((node) => {
      const pos = positions[node.id];
      
      // Center pull
      const dcx = centerX - pos.x;
      const dcy = centerY - pos.y;
      pos.vx += dcx * centerForce;
      pos.vy += dcy * centerForce;

      pos.x += pos.vx;
      pos.y += pos.vy;
      
      pos.vx *= 0.65;
      pos.vy *= 0.65;
    });
  }

  const result: Record<string, { x: number; y: number }> = {};
  nodes.forEach((node) => {
    result[node.id] = {
      x: positions[node.id].x,
      y: positions[node.id].y,
    };
  });
  return result;
}

function runHierarchicalLayout(
  nodes: GraphNode[],
  width = 800,
  ySpacing = 130
): Record<string, { x: number; y: number }> {
  const result: Record<string, { x: number; y: number }> = {};
  const centerX = width / 2;

  // Group by path depth
  const depthGroups: Record<number, string[]> = {};
  nodes.forEach((node) => {
    const depth = node.id.split("/").length;
    if (!depthGroups[depth]) depthGroups[depth] = [];
    depthGroups[depth].push(node.id);
  });

  Object.entries(depthGroups).forEach(([depthStr, ids]) => {
    const depth = parseInt(depthStr, 10);
    const y = 80 + (depth - 1) * ySpacing;
    ids.sort(); // sort alphabetically for grouping

    const count = ids.length;
    const xSpacing = 160;
    const layerWidth = (count - 1) * xSpacing;
    const startX = centerX - layerWidth / 2;
    
    ids.forEach((id, idx) => {
      const x = count === 1 ? centerX : startX + idx * xSpacing;
      result[id] = { x, y };
    });
  });

  return result;
}

// ─── Component ──────────────────────────────────────────────────────────
export default function ArchitectureMap({
  files,
  activeFile,
  onFileSelect,
  onSendMessage,
}: Props) {
  const shouldReduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  // States
  const [layoutType, setLayoutType] = useState<"force" | "hierarchical">("force");
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Zoom / Pan states
  const [scale, setScale] = useState(0.85);
  const [offset, setOffset] = useState({ x: 60, y: 40 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // 1. Process Nodes and Edges from Codebase
  const { nodes, edges } = useMemo(() => {
    const allPaths = files.map((f) => f.filePath);
    
    const graphNodes = files.map((f) => {
      const name = f.filePath.split("/").pop() || "";
      const classification = classifyNode(f.filePath);
      return {
        id: f.filePath,
        name,
        role: classification.role,
        color: classification.color,
        size: classification.size,
      };
    });

    const graphEdges: GraphEdge[] = [];
    files.forEach((f) => {
      if (f.content) {
        const fileImports = extractImports(f.filePath, f.content, allPaths);
        fileImports.forEach((target) => {
          graphEdges.push({ source: f.filePath, target });
        });
      }
    });

    return { nodes: graphNodes, edges: graphEdges };
  }, [files]);

  // 2. Positions computation (Force vs Hierarchical)
  const positions = useMemo(() => {
    if (layoutType === "hierarchical") {
      return runHierarchicalLayout(nodes, 800, 140);
    }
    return runForceLayout(nodes, edges, 800, 550, 120);
  }, [nodes, edges, layoutType]);

  // 3. Synchronize selected node when activeFile changes from external (sidebar click etc)
  useEffect(() => {
    if (activeFile && positions[activeFile]) {
      setSelectedNode(activeFile);
      // Center the graph view on this node
      const pos = positions[activeFile];
      setOffset({
        x: 400 - pos.x * scale,
        y: 275 - pos.y * scale,
      });
    }
  }, [activeFile, positions]);

  // 4. Focus/Isolation Filter
  const visibleNodes = useMemo(() => {
    if (!isFocusMode || !selectedNode) return nodes;

    const related = new Set<string>();
    related.add(selectedNode);

    edges.forEach((edge) => {
      if (edge.source === selectedNode) related.add(edge.target);
      if (edge.target === selectedNode) related.add(edge.source);
    });

    return nodes.filter((n) => related.has(n.id));
  }, [nodes, edges, isFocusMode, selectedNode]);

  const visibleEdges = useMemo(() => {
    if (!isFocusMode || !selectedNode) return edges;
    return edges.filter(
      (edge) => edge.source === selectedNode || edge.target === selectedNode
    );
  }, [edges, isFocusMode, selectedNode]);

  // 5. Node Connection Helpers (degree counts)
  const nodeConnections = useMemo(() => {
    const importsMap: Record<string, string[]> = {}; // files this file imports
    const dependentsMap: Record<string, string[]> = {}; // files that import this

    nodes.forEach((n) => {
      importsMap[n.id] = [];
      dependentsMap[n.id] = [];
    });

    edges.forEach((edge) => {
      if (importsMap[edge.source]) importsMap[edge.source].push(edge.target);
      if (dependentsMap[edge.target]) dependentsMap[edge.target].push(edge.source);
    });

    return { importsMap, dependentsMap };
  }, [nodes, edges]);

  // 6. Architectural Insights Computation
  const insights = useMemo(() => {
    if (nodes.length === 0) return null;

    let mostConnected = "";
    let maxConnectedCount = -1;

    let utilityHub = "";
    let maxInDegree = -1;

    let entryPoint = "";
    let maxOutDegree = -1;

    nodes.forEach((node) => {
      const inD = nodeConnections.dependentsMap[node.id]?.length || 0;
      const outD = nodeConnections.importsMap[node.id]?.length || 0;
      const totalDegree = inD + outD;

      if (totalDegree > maxConnectedCount) {
        maxConnectedCount = totalDegree;
        mostConnected = node.id;
      }

      if (inD > maxInDegree) {
        maxInDegree = inD;
        utilityHub = node.id;
      }

      // Entry point: has imports, but few/no dependents
      if (outD > maxOutDegree && inD === 0) {
        maxOutDegree = outD;
        entryPoint = node.id;
      }
    });

    // Fallback if no clean entry point
    if (!entryPoint) {
      nodes.forEach((node) => {
        const inD = nodeConnections.dependentsMap[node.id]?.length || 0;
        const outD = nodeConnections.importsMap[node.id]?.length || 0;
        if (outD > maxOutDegree && inD <= 1) {
          maxOutDegree = outD;
          entryPoint = node.id;
        }
      });
    }

    return {
      mostConnected: { path: mostConnected, name: mostConnected.split("/").pop() || "", count: maxConnectedCount },
      utilityHub: { path: utilityHub, name: utilityHub.split("/").pop() || "", count: maxInDegree },
      entryPoint: { path: entryPoint, name: entryPoint.split("/").pop() || "", count: maxOutDegree },
    };
  }, [nodes, nodeConnections]);

  // 7. Drag Pan handlers
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button !== 0) return; // Left click only
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 8. Zoom wheel handler
  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const factor = 1.1;
    const nextScale = e.deltaY < 0 ? scale * factor : scale / factor;
    const clampedScale = Math.max(0.15, Math.min(nextScale, 3));
    
    // Zoom relative to pointer
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const dx = mouseX - offset.x;
      const dy = mouseY - offset.y;
      
      setOffset({
        x: mouseX - dx * (clampedScale / scale),
        y: mouseY - dy * (clampedScale / scale),
      });
      setScale(clampedScale);
    }
  };

  // Zoom buttons
  const zoomIn = () => {
    const nextScale = Math.min(scale * 1.2, 3);
    setScale(nextScale);
  };

  const zoomOut = () => {
    const nextScale = Math.max(scale / 1.2, 0.15);
    setScale(nextScale);
  };

  // Centering & Resets
  const resetView = () => {
    setScale(0.85);
    setOffset({ x: 60, y: 40 });
  };

  const fitToScreen = () => {
    if (visibleNodes.length === 0) return;
    
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    visibleNodes.forEach((n) => {
      const pos = positions[n.id];
      if (pos) {
        if (pos.x < minX) minX = pos.x;
        if (pos.x > maxX) maxX = pos.x;
        if (pos.y < minY) minY = pos.y;
        if (pos.y > maxY) maxY = pos.y;
      }
    });

    const padding = 60;
    const graphW = maxX - minX + padding * 2;
    const graphH = maxY - minY + padding * 2;

    const containerW = containerRef.current?.clientWidth || 800;
    const containerH = containerRef.current?.clientHeight || 550;

    const nextScaleX = containerW / graphW;
    const nextScaleY = containerH / graphH;
    const nextScale = Math.max(0.2, Math.min(nextScaleX, nextScaleY, 1.5));

    const graphCenterX = (minX + maxX) / 2;
    const graphCenterY = (minY + maxY) / 2;

    setOffset({
      x: containerW / 2 - graphCenterX * nextScale,
      y: containerH / 2 - graphCenterY * nextScale,
    });
    setScale(nextScale);
  };

  // Selected Node Connections
  const selectedNodeImports = selectedNode ? nodeConnections.importsMap[selectedNode] || [] : [];
  const selectedNodeDependents = selectedNode ? nodeConnections.dependentsMap[selectedNode] || [] : [];

  // Search Results filtering
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const lowerQ = searchQuery.toLowerCase();
    return nodes.filter(
      (n) => n.name.toLowerCase().includes(lowerQ) || n.id.toLowerCase().includes(lowerQ)
    );
  }, [nodes, searchQuery]);

  const selectAndCenterNode = (nodeId: string) => {
    setSelectedNode(nodeId);
    onFileSelect(nodeId); // Sync back to explorer
    setSearchQuery("");

    // Center view smoothly
    const pos = positions[nodeId];
    if (pos) {
      setOffset({
        x: 400 - pos.x * scale,
        y: 275 - pos.y * scale,
      });
    }
  };

  // Connection highlighting on hover/select
  const isHighlightedNode = (nodeId: string) => {
    if (!selectedNode && !hoveredNode) return true; // normal visibility
    const focusId = hoveredNode || selectedNode;

    if (nodeId === focusId) return true;
    
    // Direct link highlight
    const isImported = nodeConnections.importsMap[focusId!]?.includes(nodeId);
    const isDependent = nodeConnections.dependentsMap[focusId!]?.includes(nodeId);
    return isImported || isDependent;
  };

  const isHighlightedEdge = (edge: GraphEdge) => {
    if (!selectedNode && !hoveredNode) return true;
    const focusId = hoveredNode || selectedNode;
    return edge.source === focusId || edge.target === focusId;
  };

  const getEdgeStroke = (edge: GraphEdge) => {
    const isHovered = hoveredNode === edge.source || hoveredNode === edge.target;
    const isSelected = selectedNode === edge.source || selectedNode === edge.target;

    if (isHovered) return "var(--accent-color)";
    if (isSelected) return "var(--accent-color)";
    return "var(--border-strong)";
  };

  const getEdgeOpacity = (edge: GraphEdge) => {
    if (!selectedNode && !hoveredNode) return 0.25;
    return isHighlightedEdge(edge) ? 0.75 : 0.08;
  };

  const selectedNodeDetails = useMemo(() => {
    if (!selectedNode) return null;
    return nodes.find((n) => n.id === selectedNode) || null;
  }, [selectedNode, nodes]);

  return (
    <div className="repo-overview-container glass-panel animate-fade-in" style={{ padding: 0 }}>
      {/* Top Header toolbar */}
      <div className="overview-header" style={{ padding: "12px 20px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <div className="overview-sparkle-pill" style={{ marginBottom: 0 }}>
            <Link size={11} className="sparkle-icon" />
            <span>Interactive Atlas</span>
          </div>
          <h2 className="overview-heading" style={{ fontSize: "16px" }}>Architecture Map</h2>
        </div>

        {/* Layout selector and toggles */}
        <div className="theme-switch-group" style={{ gap: "4px", padding: "3px" }}>
          <button
            onClick={() => setLayoutType("force")}
            className={`theme-switch-btn ${layoutType === "force" ? "active" : ""}`}
            style={{ padding: "4px 10px" }}
            title="Spring force arrangement layout"
          >
            Force Directed
          </button>
          <button
            onClick={() => setLayoutType("hierarchical")}
            className={`theme-switch-btn ${layoutType === "hierarchical" ? "active" : ""}`}
            style={{ padding: "4px 10px" }}
            title="Horizontal folder-depth layers layout"
          >
            Hierarchical
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div
        ref={containerRef}
        className="architecture-map-viewport"
        style={{
          position: "relative",
          flex: 1,
          width: "100%",
          overflow: "hidden",
          background: "var(--bg-base)",
          cursor: isDragging ? "grabbing" : "grab",
        }}
      >
        {/* SVG Canvas Map */}
        <svg
          width="100%"
          height="100%"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          style={{ position: "absolute", inset: 0 }}
        >
          {/* Subtle dots grid overlay matching Sonoma aesthetics */}
          <defs>
            <pattern
              id="atlas-grid"
              width={40 * scale}
              height={40 * scale}
              patternUnits="userSpaceOnUse"
              x={offset.x}
              y={offset.y}
            >
              <circle cx="2" cy="2" r="1" fill="var(--border-strong)" opacity="0.35" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#atlas-grid)" pointerEvents="none" />

          <g transform={`translate(${offset.x}, ${offset.y}) scale(${scale})`}>
            {/* ── DRAW EDGES ── */}
            <g className="edges-layer">
              {visibleEdges.map((edge, idx) => {
                const sourcePos = positions[edge.source];
                const targetPos = positions[edge.target];

                if (!sourcePos || !targetPos) return null;

                const isPathSelected = selectedNode === edge.source || selectedNode === edge.target;
                
                return (
                  <g key={`${edge.source}-${edge.target}-${idx}`}>
                    {/* Visual Edge connection line */}
                    <line
                      x1={sourcePos.x}
                      y1={sourcePos.y}
                      x2={targetPos.x}
                      y2={targetPos.y}
                      stroke={getEdgeStroke(edge)}
                      strokeWidth={isPathSelected ? 1.5 : 1}
                      opacity={getEdgeOpacity(edge)}
                      style={{ transition: "stroke 0.2s, opacity 0.2s" }}
                    />
                    
                    {/* Import flow direction arrow marker on edge */}
                    {isPathSelected && (
                      <circle
                        r="3"
                        fill="var(--accent-color)"
                        opacity="0.8"
                      >
                        <animateMotion
                          dur="3s"
                          repeatCount="indefinite"
                          path={`M ${sourcePos.x} ${sourcePos.y} L ${targetPos.x} ${targetPos.y}`}
                        />
                      </circle>
                    )}
                  </g>
                );
              })}
            </g>

            {/* ── DRAW NODES ── */}
            <g className="nodes-layer">
              {visibleNodes.map((node) => {
                const pos = positions[node.id];
                if (!pos) return null;

                const isSelected = selectedNode === node.id;
                const isHovered = hoveredNode === node.id;
                const isHighlighted = isHighlightedNode(node.id);
                
                return (
                  <g
                    key={node.id}
                    transform={`translate(${pos.x}, ${pos.y})`}
                    onClick={(e) => {
                      e.stopPropagation();
                      selectAndCenterNode(node.id);
                    }}
                    onMouseEnter={() => setHoveredNode(node.id)}
                    onMouseLeave={() => setHoveredNode(null)}
                    style={{ cursor: "pointer" }}
                  >
                    {/* Node glow indicator for selection */}
                    {isSelected && (
                      <circle
                        r={node.size + 8}
                        fill="transparent"
                        stroke="var(--accent-color)"
                        strokeWidth="1.5"
                        strokeDasharray="4 3"
                        className="animate-spin"
                        style={{ transformOrigin: "center", animationDuration: "10s" }}
                      />
                    )}

                    {/* Outer ring */}
                    <circle
                      r={node.size}
                      fill="var(--bg-surface)"
                      stroke={isSelected ? "var(--accent-color)" : isHovered ? "var(--text-primary)" : "var(--border-default)"}
                      strokeWidth={isSelected ? 2 : 1}
                      opacity={isHighlighted ? 1 : 0.12}
                      className="glass-panel"
                      style={{
                        transition: "stroke 0.2s, stroke-width 0.2s, opacity 0.2s",
                        boxShadow: "var(--shadow-card)",
                      }}
                    />

                    {/* Dot representing language color */}
                    <circle
                      r="4.5"
                      cx={0}
                      cy={-node.size + 1}
                      fill={node.color}
                      opacity={isHighlighted ? 1 : 0.15}
                    />

                    {/* Node Icon */}
                    <g transform="translate(-6, -6)">
                      <FileCode
                        size={12}
                        style={{
                          color: isSelected ? "var(--accent-color)" : "var(--text-secondary)",
                          opacity: isHighlighted ? 0.85 : 0.15,
                        }}
                      />
                    </g>

                    {/* Node text labels */}
                    {scale > 0.4 && (
                      <text
                        y={node.size + 14}
                        textAnchor="middle"
                        fill="var(--text-primary)"
                        fontSize="10.5px"
                        fontWeight={isSelected ? 600 : 500}
                        opacity={isHighlighted ? 0.9 : 0.1}
                        style={{
                          fontFamily: "var(--font-mono-family)",
                          pointerEvents: "none",
                        }}
                      >
                        {node.name}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          </g>
        </svg>

        {/* Floating Controller panel (Bottom Right) */}
        <div
          className="glass-panel"
          style={{
            position: "absolute",
            bottom: "16px",
            right: "16px",
            padding: "4px",
            borderRadius: "10px",
            display: "flex",
            flexDirection: "row",
            gap: "2px",
            zIndex: 15,
          }}
        >
          <button
            onClick={zoomIn}
            className="theme-switch-btn"
            style={{ padding: "6px" }}
            title="Zoom In"
          >
            <ZoomIn size={14} />
          </button>
          <button
            onClick={zoomOut}
            className="theme-switch-btn"
            style={{ padding: "6px" }}
            title="Zoom Out"
          >
            <ZoomOut size={14} />
          </button>
          <button
            onClick={fitToScreen}
            className="theme-switch-btn"
            style={{ padding: "6px" }}
            title="Fit graph contents on screen"
          >
            <Maximize2 size={14} />
          </button>
          <button
            onClick={resetView}
            className="theme-switch-btn"
            style={{ padding: "6px" }}
            title="Reset position and zoom"
          >
            <RefreshCw size={13} />
          </button>
        </div>

        {/* Search Panel (Top Left) */}
        <div
          style={{
            position: "absolute",
            top: "12px",
            left: "16px",
            zIndex: 15,
            width: "240px",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          <div className="sidebar-search-wrapper" style={{ width: "100%", background: "var(--bg-glass)", border: "1px solid var(--border-strong)" }}>
            <span className="sidebar-search-icon">
              <Search size={12} />
            </span>
            <input
              type="text"
              className="sidebar-search-input"
              placeholder="Search file node..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Autocomplete Search popup */}
          <AnimatePresence>
            {searchQuery && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                className="glass-panel"
                style={{
                  maxHeight: "180px",
                  overflowY: "auto",
                  borderRadius: "8px",
                  padding: "4px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "2px",
                }}
              >
                {searchResults.length > 0 ? (
                  searchResults.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => selectAndCenterNode(n.id)}
                      className="command-palette-item"
                      style={{
                        padding: "6px 8px",
                        textAlign: "left",
                        fontSize: "12px",
                        background: "transparent",
                        border: "none",
                        color: "var(--text-secondary)",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "var(--accent-color-soft)";
                        e.currentTarget.style.color = "var(--accent-color)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = "var(--text-secondary)";
                      }}
                    >
                      <div className="command-palette-item-text">{n.name}</div>
                      <div className="command-palette-item-subtitle" style={{ fontSize: "10px", marginLeft: 0 }}>
                        {n.id}
                      </div>
                    </button>
                  ))
                ) : (
                  <div style={{ padding: "8px", fontSize: "11px", color: "var(--text-muted)", textAlign: "center" }}>
                    No matching nodes found
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Floating Architectural Insights Panel (Bottom Left) */}
        {!selectedNode && insights && (
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            className="overview-card glass-panel"
            style={{
              position: "absolute",
              bottom: "16px",
              left: "16px",
              width: "250px",
              padding: "12px",
              zIndex: 14,
              minHeight: "auto",
            }}
          >
            <div className="card-header" style={{ gap: "6px" }}>
              <Layers size={13} className="card-header-icon text-accent" />
              <h3 style={{ fontSize: "12px" }}>Architectural Hotspots</h3>
            </div>
            <div className="card-content" style={{ marginTop: "8px", fontSize: "11.5px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <div>
                  <span style={{ color: "var(--text-muted)" }}>Entry Point:</span>
                  <button
                    onClick={() => selectAndCenterNode(insights.entryPoint.path)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--accent-color)",
                      fontFamily: "var(--font-mono-family)",
                      fontWeight: 600,
                      cursor: "pointer",
                      paddingLeft: "4px",
                    }}
                    title={insights.entryPoint.path}
                  >
                    {insights.entryPoint.name}
                  </button>
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)" }}>Large Hub:</span>
                  <button
                    onClick={() => selectAndCenterNode(insights.utilityHub.path)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--accent-color)",
                      fontFamily: "var(--font-mono-family)",
                      fontWeight: 600,
                      cursor: "pointer",
                      paddingLeft: "4px",
                    }}
                    title={insights.utilityHub.path}
                  >
                    {insights.utilityHub.name}
                  </button>
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)" }}>Most Connected:</span>
                  <button
                    onClick={() => selectAndCenterNode(insights.mostConnected.path)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--accent-color)",
                      fontFamily: "var(--font-mono-family)",
                      fontWeight: 600,
                      cursor: "pointer",
                      paddingLeft: "4px",
                    }}
                    title={insights.mostConnected.path}
                  >
                    {insights.mostConnected.name}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Detail Pane / Floating Node card (Right Side overlay) */}
      <AnimatePresence>
        {selectedNodeDetails && (
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: 20 }}
            className="overview-card glass-panel"
            style={{
              position: "absolute",
              top: "70px",
              right: "16px",
              bottom: "70px",
              width: "280px",
              zIndex: 20,
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              minHeight: "auto",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.4)",
            }}
          >
            {/* Header / Title */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div style={{ minWidth: 0 }}>
                <span
                  style={{
                    backgroundColor: selectedNodeDetails.color + "22",
                    color: selectedNodeDetails.color === "var(--text-secondary)" ? "var(--text-primary)" : selectedNodeDetails.color,
                    fontSize: "9px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    padding: "2px 8px",
                    borderRadius: "99px",
                    border: `1px solid ${selectedNodeDetails.color}35`,
                  }}
                >
                  {selectedNodeDetails.role}
                </span>
                <h3
                  style={{
                    fontSize: "15px",
                    fontWeight: 600,
                    marginTop: "6px",
                    fontFamily: "var(--font-mono-family)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={selectedNodeDetails.name}
                >
                  {selectedNodeDetails.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="overview-close-btn"
                style={{ width: "22px", height: "22px", flexShrink: 0 }}
                title="Deselect node"
              >
                <X size={12} />
              </button>
            </div>

            {/* Path details */}
            <div style={{ fontSize: "11px", color: "var(--text-muted)", lineBreak: "anywhere" }}>
              <span style={{ fontWeight: 600, display: "block" }}>Canonical Path:</span>
              {selectedNodeDetails.id}
            </div>

            {/* In/Out counts */}
            <div style={{ display: "flex", gap: "10px" }}>
              <div className="metric-item glass-panel" style={{ flex: 1, padding: "8px", background: "var(--bg-secondary)" }}>
                <span className="metric-value" style={{ fontSize: "15px" }}>{selectedNodeImports.length}</span>
                <span className="metric-label" style={{ fontSize: "8px" }}>Imports</span>
              </div>
              <div className="metric-item glass-panel" style={{ flex: 1, padding: "8px", background: "var(--bg-secondary)" }}>
                <span className="metric-value" style={{ fontSize: "15px" }}>{selectedNodeDependents.length}</span>
                <span className="metric-label" style={{ fontSize: "8px" }}>Dependents</span>
              </div>
            </div>

            {/* Focus / Isolate Mode */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500 }}>Isolate Connections</span>
              <button
                onClick={() => setIsFocusMode(!isFocusMode)}
                className={`theme-switch-btn ${isFocusMode ? "active" : ""}`}
                style={{ padding: "4px 10px" }}
              >
                {isFocusMode ? "Focus Active" : "Focus Mode"}
              </button>
            </div>

            {/* Dependency list or dependents list preview */}
            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
              {selectedNodeImports.length > 0 && (
                <div>
                  <span className="section-subtitle" style={{ marginBottom: "4px" }}>Imports from ({selectedNodeImports.length})</span>
                  <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                    {selectedNodeImports.map((imp) => (
                      <button
                        key={imp}
                        onClick={() => selectAndCenterNode(imp)}
                        style={{
                          textAlign: "left",
                          fontSize: "10.5px",
                          fontFamily: "var(--font-mono-family)",
                          background: "var(--bg-secondary)",
                          border: "1px solid var(--border-subtle)",
                          borderRadius: "4px",
                          padding: "3px 6px",
                          color: "var(--text-secondary)",
                          cursor: "pointer",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {imp.split("/").pop()}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedNodeDependents.length > 0 && (
                <div>
                  <span className="section-subtitle" style={{ marginBottom: "4px", marginTop: "8px" }}>Imported by ({selectedNodeDependents.length})</span>
                  <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                    {selectedNodeDependents.map((dep) => (
                      <button
                        key={dep}
                        onClick={() => selectAndCenterNode(dep)}
                        style={{
                          textAlign: "left",
                          fontSize: "10.5px",
                          fontFamily: "var(--font-mono-family)",
                          background: "var(--bg-secondary)",
                          border: "1px solid var(--border-subtle)",
                          borderRadius: "4px",
                          padding: "3px 6px",
                          color: "var(--text-secondary)",
                          cursor: "pointer",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {dep.split("/").pop()}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions Footer */}
            <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
              <button
                onClick={() => {
                  onFileSelect(selectedNodeDetails.id);
                  // Highlight in explorer by trigger sidebar action
                }}
                className="quick-action-button"
                style={{ padding: "6px 12px" }}
              >
                <span className="action-button-left">
                  <Folder size={11} />
                  <span className="action-label" style={{ fontSize: "11px" }}>Locate in Explorer</span>
                </span>
                <ChevronRight size={11} />
              </button>
              <button
                onClick={() => {
                  const prompt = `Explain this file and its role in the architecture: ${selectedNodeDetails.id}`;
                  onSendMessage(prompt);
                }}
                className="quick-action-button"
                style={{ padding: "6px 12px" }}
              >
                <span className="action-button-left">
                  <HelpCircle size={11} />
                  <span className="action-label" style={{ fontSize: "11px" }}>Explain File</span>
                </span>
                <ChevronRight size={11} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
