 // Audio elements for sound effects
        const visitSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-positive-interface-beep-221.mp3');
        const completeSound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-achievement-bell-600.mp3');
        
        // Canvas setup
        const canvas = document.getElementById("graphCanvas");
        const ctx = canvas.getContext("2d");
        const logDiv = document.getElementById("log");
        const popupContent = document.getElementById("popupContent");
        const notification = document.getElementById("notification");
        
        let nodes = [], edges = [], selectedNode = null;
        let isAlgorithmRunning = false;
        
        // Initialize canvas with proper dimensions
        function initCanvas() {
            const container = canvas.parentElement;
            canvas.width = container.clientWidth;
            canvas.height = Math.min(container.clientWidth * 0.6, 500); // 3:2 aspect ratio max height 500px
            drawGraph();
        }
        
        // Handle canvas clicks with proper coordinate calculation
        canvas.addEventListener("click", function(event) {
            if (isAlgorithmRunning) return;
            
            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            
            let clickedNode = nodes.find(node => {
                return Math.hypot(node.x - x, node.y - y) < 20;
            });
            
            if (clickedNode) {
                if (selectedNode && selectedNode !== clickedNode) {
                    let weight = Math.floor(Math.random() * 10) + 1;
                    edges.push({ from: selectedNode, to: clickedNode, weight });
                    selectedNode = null;
                    logMessage(`Created edge from Node ${selectedNode?.id} to Node ${clickedNode.id} with weight ${weight}`);
                } else {
                    selectedNode = clickedNode;
                    logMessage(`Selected Node ${clickedNode.id} for edge creation`);
                }
            } else {
                const newNode = {
                    id: nodes.length + 1,
                    x: x,
                    y: y,
                    visited: false,
                    color: '#87CEEB'
                };
                nodes.push(newNode);
                logMessage(`Created new Node ${newNode.id} at (${Math.round(x)}, ${Math.round(y)})`);
            }
            drawGraph();
        });
        
        // Improved graph drawing with better edge weight display
        function drawGraph() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Draw edges with improved styling
            edges.forEach(edge => {
                const from = edge.from;
                const to = edge.to;
                
                // Calculate angle between nodes
                const angle = Math.atan2(to.y - from.y, to.x - from.x);
                
                // Adjust start and end points to node boundaries
                const startX = from.x + 20 * Math.cos(angle);
                const startY = from.y + 20 * Math.sin(angle);
                const endX = to.x - 20 * Math.cos(angle);
                const endY = to.y - 20 * Math.sin(angle);
                
                // Draw line
                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.lineTo(endX, endY);
                ctx.strokeStyle = edge.highlight ? '#9C27B0' : '#555';
                ctx.lineWidth = edge.highlight ? 3 : 2;
                ctx.stroke();
                
                // Draw arrowhead for directed edges
                const headLength = 15;
                ctx.beginPath();
                ctx.moveTo(endX, endY);
                ctx.lineTo(
                    endX - headLength * Math.cos(angle - Math.PI / 6),
                    endY - headLength * Math.sin(angle - Math.PI / 6)
                );
                ctx.lineTo(
                    endX - headLength * Math.cos(angle + Math.PI / 6),
                    endY - headLength * Math.sin(angle + Math.PI / 6)
                );
                ctx.closePath();
                ctx.fillStyle = edge.highlight ? '#9C27B0' : '#555';
                ctx.fill();
                
                // Draw weight with nice background
                const midX = (startX + endX) / 2;
                const midY = (startY + endY) / 2;
                
                // Offset the weight perpendicular to the edge
                const offset = 15;
                const weightX = midX + offset * Math.cos(angle + Math.PI / 2);
                const weightY = midY + offset * Math.sin(angle + Math.PI / 2);
                
                // Draw background for better readability
                ctx.font = "bold 14px Arial";
                const textWidth = ctx.measureText(edge.weight).width;
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.fillRect(weightX - textWidth/2 - 5, weightY - 12, textWidth + 10, 20);
                
                // Draw weight text
                ctx.fillStyle = edge.highlight ? '#9C27B0' : '#FF5722';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(edge.weight, weightX, weightY);
            });
            
            // Draw nodes with improved styling
            nodes.forEach(node => {
                // Shadow
                ctx.beginPath();
                ctx.arc(node.x, node.y, 22, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
                ctx.fill();
                
                // Node
                ctx.beginPath();
                ctx.arc(node.x, node.y, 20, 0, Math.PI * 2);
                ctx.fillStyle = node.visited ? (node.color || '#FFC107') : '#87CEEB';
                ctx.fill();
                
                // Border
                ctx.strokeStyle = node.visited ? '#333' : '#555';
                ctx.lineWidth = node.visited ? 3 : 2;
                ctx.stroke();
                
                // Label
                ctx.fillStyle = '#333';
                ctx.font = "bold 16px Arial";
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(node.id, node.x, node.y);
                
                // Highlight selected node
                if (node === selectedNode) {
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, 25, 0, Math.PI * 2);
                    ctx.strokeStyle = '#FF5722';
                    ctx.lineWidth = 3;
                    ctx.stroke();
                }
            });
        }
        
        // BFS implementation
        function startBFS() {
            if (isAlgorithmRunning) return;
            if (nodes.length === 0) {
                showNotification("Please create nodes first!");
                return;
            }
            
            isAlgorithmRunning = true;
            showAlgorithmInfo("BFS (Breadth-First Search)", 
                "BFS explores all neighbor nodes at the present depth before moving on to nodes at the next depth level. " +
                "It's useful for finding the shortest path in unweighted graphs and for web crawling.");
            
            resetNodeStates();
            logMessage("Starting BFS from Node 1");
            
            let queue = [nodes[0]];
            let visited = new Set();
            let steps = 0;
            
            function processNextNode() {
                if (queue.length === 0) {
                    algorithmComplete("BFS completed all reachable nodes!");
                    return;
                }
                
                let node = queue.shift();
                
                if (visited.has(node)) {
                    processNextNode();
                    return;
                }
                
                // Visit the node
                visited.add(node);
                node.visited = true;
                node.color = '#4CAF50';
                steps++;
                
                // Play sound and animate
                visitSound.play();
                drawGraph();
                logMessage(`Step ${steps}: Visiting Node ${node.id}`);
                
                // Find all neighbors
                edges.filter(e => e.from.id === node.id).forEach(edge => {
                    if (!visited.has(edge.to) && !queue.includes(edge.to)) {
                        queue.push(edge.to);
                        logMessage(`Adding Node ${edge.to.id} to queue`);
                    }
                });
                
                setTimeout(processNextNode, 1000);
            }
            
            processNextNode();
        }
        
        // DFS implementation
        function startDFS() {
            if (isAlgorithmRunning) return;
            if (nodes.length === 0) {
                showNotification("Please create nodes first!");
                return;
            }
            
            isAlgorithmRunning = true;
            showAlgorithmInfo("DFS (Depth-First Search)", 
                "DFS explores as far as possible along each branch before backtracking. " +
                "It's useful for topological sorting, solving puzzles with one solution, and detecting cycles.");
            
            resetNodeStates();
            logMessage("Starting DFS from Node 1");
            
            let stack = [nodes[0]];
            let visited = new Set();
            let steps = 0;
            
            function processNextNode() {
                if (stack.length === 0) {
                    algorithmComplete("DFS completed all reachable nodes!");
                    return;
                }
                
                let node = stack.pop();
                
                if (visited.has(node)) {
                    processNextNode();
                    return;
                }
                
                // Visit the node
                visited.add(node);
                node.visited = true;
                node.color = '#2196F3';
                steps++;
                
                // Play sound and animate
                visitSound.play();
                drawGraph();
                logMessage(`Step ${steps}: Visiting Node ${node.id}`);
                
                // Find all neighbors and push in reverse order for left-to-right traversal
                let neighbors = edges.filter(e => e.from.id === node.id).map(e => e.to);
                neighbors.reverse().forEach(neighbor => {
                    if (!visited.has(neighbor)) {
                        stack.push(neighbor);
                        logMessage(`Pushing Node ${neighbor.id} to stack`);
                    }
                });
                
                setTimeout(processNextNode, 1000);
            }
            
            processNextNode();
        }
        
        // Dijkstra's algorithm implementation
        function startDijkstra() {
            if (isAlgorithmRunning) return;
            if (nodes.length === 0) {
                showNotification("Please create nodes first!");
                return;
            }
            
            isAlgorithmRunning = true;
            showAlgorithmInfo("Dijkstra's Algorithm", 
                "Dijkstra's algorithm finds the shortest paths from a start node to all other nodes in a weighted graph. " +
                "It uses a priority queue to always expand the least-cost node. Works only with non-negative edge weights.");
            
            resetNodeStates();
            logMessage("Starting Dijkstra's Algorithm from Node 1");
            
            let distances = {};
            let previous = {};
            let visited = new Set();
            let priorityQueue = [{ node: nodes[0], cost: 0 }];
            
            nodes.forEach(node => {
                distances[node.id] = Infinity;
                previous[node.id] = null;
            });
            distances[nodes[0].id] = 0;
            
            let steps = 0;
            
            function processNextNode() {
                if (priorityQueue.length === 0) {
                    algorithmComplete("Dijkstra's algorithm completed!");
                    showShortestPaths(previous, distances);
                    return;
                }
                
                priorityQueue.sort((a, b) => a.cost - b.cost);
                let { node, cost } = priorityQueue.shift();
                
                if (visited.has(node)) {
                    processNextNode();
                    return;
                }
                
                // Visit the node
                visited.add(node);
                node.visited = true;
                node.color = '#9C27B0';
                steps++;
                
                // Play sound and animate
                visitSound.play();
                drawGraph();
                logMessage(`Step ${steps}: Visiting Node ${node.id} with current distance ${cost}`);
                
                // Update neighbors
                edges.filter(e => e.from.id === node.id).forEach(edge => {
                    const neighbor = edge.to;
                    const newCost = cost + edge.weight;
                    
                    if (newCost < distances[neighbor.id]) {
                        distances[neighbor.id] = newCost;
                        previous[neighbor.id] = node;
                        priorityQueue.push({ node: neighbor, cost: newCost });
                        logMessage(`Updated distance to Node ${neighbor.id}: ${newCost}`);
                    }
                });
                
                setTimeout(processNextNode, 1000);
            }
            
            processNextNode();
        }
        
        // Show shortest paths after Dijkstra's
        function showShortestPaths(previous, distances) {
            // Highlight shortest paths to all nodes
            nodes.forEach(node => {
                let current = node;
                while (current && previous[current.id]) {
                    // Highlight the edge that's part of the shortest path
                    const from = previous[current.id];
                    const edge = edges.find(e => e.from.id === from.id && e.to.id === current.id) || 
                                 edges.find(e => e.to.id === from.id && e.from.id === current.id);
                    if (edge) edge.highlight = true;
                    current = from;
                }
            });
            
            drawGraph();
            logMessage("Shortest paths highlighted in purple");
            
            // Show distances in a notification
            let message = "Shortest path distances from Node 1:\n";
            nodes.forEach(node => {
                message += `Node ${node.id}: ${distances[node.id]}\n`;
            });
            showNotification(message);
        }
        
        // Reset the graph
        function resetGraph() {
            if (isAlgorithmRunning) {
                showNotification("Please wait for the current algorithm to finish");
                return;
            }
            
            nodes = [];
            edges = [];
            selectedNode = null;
            logDiv.innerHTML = "";
            drawGraph();
            showNotification("Graph has been reset");
        }
        
        // Helper functions
        function resetNodeStates() {
            nodes.forEach(node => {
                node.visited = false;
                node.color = '#87CEEB';
            });
            edges.forEach(edge => {
                edge.highlight = false;
            });
            logDiv.innerHTML = "";
            drawGraph();
        }
        
        function logMessage(message) {
            const entry = document.createElement('div');
            entry.className = 'log-entry fade-in';
            entry.textContent = message;
            logDiv.appendChild(entry);
            logDiv.scrollTop = logDiv.scrollHeight;
        }
        
        function showAlgorithmInfo(title, content) {
            popupContent.innerHTML = `<h4>${title}</h4><p>${content}</p>`;
            document.getElementById('infoPopup').classList.add('visible');
        }
        
        function hidePopup() {
            document.getElementById('infoPopup').classList.remove('visible');
        }
        
        function showNotification(message) {
            notification.textContent = message;
            notification.classList.add('show');
            setTimeout(() => {
                notification.classList.remove('show');
            }, 5000);
        }
        
        function algorithmComplete(message) {
            isAlgorithmRunning = false;
            completeSound.play();
            showNotification(message + " 🎉");
            logMessage("Algorithm completed successfully!");
        }
        
        // Initialize the canvas when the window loads
        window.addEventListener('load', initCanvas);
        window.addEventListener('resize', initCanvas);