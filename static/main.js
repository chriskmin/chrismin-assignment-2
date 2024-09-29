document.addEventListener('DOMContentLoaded', () => {
	const plotContainer = document.getElementById('plot-area');
	const clusterInput = document.getElementById('num-clusters');
	const methodSelect = document.getElementById('init-method');

	let dataPoints = generateRandomData();
	let centers = [];
	let clusterAssignments = [];
	let oldCenters = [];
	let manualMode = false;
	let selectedCentroidCount = 0;

	methodSelect.addEventListener('change', () => {
		const selectedMethod = methodSelect.value;

		if (selectedMethod === 'manual') {
			manualMode = true;
			selectedCentroidCount = 0;
			alert('Click on the plot area to select centroids');
		} else {
			manualMode = false;
		}
	});

	document.getElementById('new-dataset').addEventListener('click', () => {
		dataPoints = generateRandomData();
		centers = [];
		clusterAssignments = [];
		manualMode = false;
		selectedCentroidCount = 0;
		drawGraph();
	});
	document.getElementById('step').addEventListener('click', () => {
		if (centers.length === 0) {
			initiateCenters();
		} else {
			assignClusters();
			updateCenters();
		}
		drawGraph();
	});
	document.getElementById('converge').addEventListener('click', () => {
		if (centers.length === 0) {
			initiateCenters();
		}
		while (!hasConverged()) {
			assignClusters();
			updateCenters();
		}
		drawGraph();
	});
	document.getElementById('reset').addEventListener('click', () => {
		centers = [];
		clusterAssignments = [];
		manualMode = false;
		selectedCentroidCount = 0;
		drawGraph();
	});

	plotContainer.addEventListener('click', (event) => {
		if (manualMode) {
			const numClusters = parseInt(clusterInput.value);
			if (selectedCentroidCount < numClusters) {
				const rect = plotContainer.getBoundingClientRect();
				const x = event.clientX - rect.left;
				const y = event.clientY - rect.top;

				centers.push({ x: x, y: y });
				selectedCentroidCount++;

				if (selectedCentroidCount === numClusters) {
					manualMode = false;
					alert('All centroids selected, now proceed with clustering');
				}

				drawGraph();
			}
		}
	});

	function initiateCenters() {
		const numClusters = parseInt(clusterInput.value);
		centers = [];
		const selectedMethod = methodSelect.value;

		if (selectedMethod === 'manual') {
			manualMode = true;
			selectedCentroidCount = 0;
			alert('Click on the plot area to select centroids');
		} else if (selectedMethod === 'farthest') {
			const firstCentroid = dataPoints[Math.floor(Math.random() * dataPoints.length)];
			centers.push({ ...firstCentroid });

			while (centers.length < numClusters) {
				let farthestPoint = null;
				let maxDistance = -Infinity;

				dataPoints.forEach(point => {
					const nearestDistance = centers.reduce((minDist, center) => {
						const distance = Math.hypot(point.x - center.x, point.y - center.y);
						return Math.min(minDist, distance);
					}, Infinity);

					if (nearestDistance > maxDistance) {
						maxDistance = nearestDistance;
						farthestPoint = point;
					}
				});

				centers.push({ ...farthestPoint });
			}
		} else if (selectedMethod === 'random') {
			for (let i = 0; i < numClusters; i++) {
				const randomPoint = dataPoints[Math.floor(Math.random() * dataPoints.length)];
				centers.push({ ...randomPoint });
			}
		} else if (selectedMethod === 'kmeans++') {
			centers.push(dataPoints[Math.floor(Math.random() * dataPoints.length)]);
			while (centers.length < numClusters) {
				const distances = dataPoints.map(point => {
					const nearestDistance = centers.reduce((minDist, center) => {
						const distance = Math.hypot(point.x - center.x, point.y - center.y);
						return Math.min(minDist, distance);
					}, Infinity);
					return nearestDistance;
				});

				const totalDistance = distances.reduce((sum, d) => sum + d, 0);
				const randomValue = Math.random() * totalDistance;
				let cumulativeDistance = 0;
				for (let i = 0; i < dataPoints.length; i++) {
					cumulativeDistance += distances[i];
					if (cumulativeDistance >= randomValue) {
						centers.push({ ...dataPoints[i] });
						break;
					}
				}
			}
		}
		drawGraph();	
	}

	function generateRandomData() {
		const data = [];
		for (let i = 0; i < 300; i++) {
			data.push({
				x: Math.random() * plotContainer.clientWidth - 1,
				y: Math.random() * plotContainer.clientHeight - 1
			});
		}
		return data;
	}

	function assignClusters() {
		clusterAssignments = dataPoints.map(point => {
			let closestIndex = 0;
			let minDistance = Infinity;
			centers.forEach((center, index) => {
				const distance = Math.hypot(point.x - center.x, point.y - center.y);
				if (distance < minDistance) {
					minDistance = distance;
					closestIndex = index;
				}
			});
			return closestIndex;
		});
	}

	function updateCenters() {
		oldCenters = centers.map(center => ({ ...center }));
		const k = centers.length;
		const sums = Array(k).fill(0).map(() => ({ x: 0, y: 0, count: 0 }));

		dataPoints.forEach((point, index) => {
			const cluster = clusterAssignments[index];
			sums[cluster].x += point.x;
			sums[cluster].y += point.y;
			sums[cluster].count += 1;
		});

		sums.forEach((sum, index) => {
			if (sum.count > 0) {
				centers[index].x = sum.x / sum.count;
				centers[index].y = sum.y / sum.count;
			}
		});
	}

	function hasConverged() {
		return centers.every((center, index) => {
			const prev = oldCenters[index];
			return center.x === prev.x && center.y === prev.y;
		});
	}

	function drawGraph() {
		plotContainer.innerHTML = '';
		dataPoints.forEach((point, index) => {
			const dot = document.createElement('div');
			dot.style.position = 'absolute';
			dot.style.width = '5px';
			dot.style.height = '5px';
			dot.style.backgroundColor = clusterAssignments[index] !== undefined ? `hsl(${clusterAssignments[index] * 360 / centers.length}, 100%, 50%)` : 'black';
			dot.style.borderRadius = '50%';
			dot.style.left = `${point.x}px`;
			dot.style.top = `${point.y}px`;
			plotContainer.appendChild(dot);
		});
		centers.forEach(center => {
			const centerDot = document.createElement('div');
			centerDot.style.position = 'absolute';
			centerDot.style.width = '10px';
			centerDot.style.height = '10px';
			centerDot.style.backgroundColor = 'red';
			centerDot.style.borderRadius = '50%';
			centerDot.style.left = `${center.x}px`;
			centerDot.style.top = `${center.y}px`;
			plotContainer.appendChild(centerDot);
		});
	}

	drawGraph();
});
