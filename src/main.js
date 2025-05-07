import './style.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import 'bootstrap-icons/font/bootstrap-icons.css'
import data from './assets/network-graph.json' 
import { generateColors } from './utils.js'

import Graph from "graphology";
import forceAtlas2 from 'graphology-layout-forceatlas2';
import Sigma from "sigma";

// Initialize the graph
const graph = new Graph();

// Get unique authors first
const uniqueAuthors = [...new Set(data.nodes.map(node => node.author))];

// Create color mapping with exact number of colors
const colors = generateColors(uniqueAuthors.length);
const authorColors = Object.fromEntries(
    uniqueAuthors.map((author, index) => [author, colors[index]])
);

// Add nodes from your data
data.nodes.forEach(node => {
    graph.addNode(node.id, {
        label: `${node.author}: ${node.work}`,
        x: node.x || Math.random(),
        y: node.y || Math.random(),
        size: node.size || 10,
        color: authorColors[node.author],
        url: node.url
        
    });
});

// Add edges from your data
data.edges.forEach(edge => {
  graph.addEdge(edge.source, edge.target, {
    size: edge.size || 1,
    color: edge.color || "#ccc"
  });
});

// Apply ForceAtlas2 layout
const settings = {
  iterations: 500,
  settings: {
    gravity: 1,
    scalingRatio: 10,
    strongGravityMode: true,
    slowDown: 2
  }
};

// Run the layout
forceAtlas2.assign(graph, settings);
// Create the renderer
const renderer = new Sigma(
  graph,
  document.getElementById("app")
);

// Add hover interactions
let hoveredNode = null;

renderer.on("clickNode", ({ node }) => {
  const nodeData = graph.getNodeAttributes(node);
  const url = nodeData.url;
  
  // Open the URL in a new tab
  if (url) {window.open(url, "_blank");}
}
);

// Update node states on hover
renderer.on("enterNode", ({ node }) => {
  hoveredNode = node;
  
  // Get connected nodes
  const connectedNodeIds = new Set([node]);
  graph.forEachNeighbor(node, (neighbor) => connectedNodeIds.add(neighbor));
  
  // Update node and edge states
  graph.forEachNode((node, attributes) => {
    graph.setNodeAttribute(
      node,
      "hidden",
      !connectedNodeIds.has(node)
    );
  });
});

// Reset on mouse leave
renderer.on("leaveNode", () => {
  hoveredNode = null;
  graph.forEachNode((node) => {
    graph.setNodeAttribute(node, "hidden", false);
  });
  graph.forEachEdge((edge) => {
    graph.setEdgeAttribute(edge, "hidden", false);
  });
});


const searchInput = document.getElementById("search-input");
const searchSuggestions = document.getElementById("suggestions");
const state = { searchQuery: "" };

searchSuggestions.innerHTML = graph
.nodes()
.map((node) => `<option value="${graph.getNodeAttribute(node, "label")}"></option>`)
.join("\n");

function setSearchQuery(query) {
  state.searchQuery = query;

  if (searchInput.value !== query) searchInput.value = query;

  if (query) {
    const lcQuery = query.toLowerCase();
    const suggestions = graph
      .nodes()
      .map((n) => ({ id: n, label: graph.getNodeAttribute(n, "label") }))
      .filter(({ label }) => label.toLowerCase().includes(lcQuery));

    // If we have a single perfect match, them we remove the suggestions, and
    // we consider the user has selected a node through the datalist
    // autocomplete:
    if (suggestions.length === 1 && suggestions[0].label === query) {
      state.selectedNode = suggestions[0].id;
      state.suggestions = undefined;

      // Move the camera to center it on the selected node:
      const nodePosition = renderer.getNodeDisplayData(state.selectedNode);
      renderer.getCamera().animate(nodePosition, {
        duration: 500,
      });
    }
    // Else, we display the suggestions list:
    else {
      state.selectedNode = undefined;
      state.suggestions = new Set(suggestions.map(({ id }) => id));
    }
  }
  // If the query is empty, then we reset the selectedNode / suggestions state:
  else {
    state.selectedNode = undefined;
    state.suggestions = undefined;
  }

  // Refresh rendering
  // You can directly call `renderer.refresh()`, but if you need performances
  // you can provide some options to the refresh method.
  // In this case, we don't touch the graph data so we can skip its reindexation
  renderer.refresh({
    skipIndexation: true,
  });
}
function setHoveredNode(node) {
  if (node) {
    state.hoveredNode = node;
    state.hoveredNeighbors = new Set(graph.neighbors(node));
  }

  if (!node) {
    state.hoveredNode = undefined;
    state.hoveredNeighbors = undefined;
  }

  // Refresh rendering
  renderer.refresh({
    // We don't touch the graph data so we can skip its reindexation
    skipIndexation: true,
  });
}

