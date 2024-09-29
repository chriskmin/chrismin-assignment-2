document.addEventListener('DOMContentLoaded', () => {
	const plotArea = document.getElementById('plot-area');
	const numClustersInput = document.getElementById('num-clusters');
	const initMethodSelect = document.getElementById('init-method');

	let dataset = generateRandomDataset();
	let centroids = [];
	let assignments = [];
	let previousCentroids = [];
	let manualInitMode = false;
	let manualCentroidCount = 0;

	// Listener for initialization method
	initMethodSelect.addEventListener('change', () => {
		const initMethod = initMethodSelect.value;

		// If "Manual" is selected, activate manual mode
		if (initMethod === 'manual') {
			manualInitMode = true;
			manualCentroidCount = 0;
			alert('Click on the plot area to select centroids');
		} else {
			manualInitMode = false;
		}
	});

	// Listeners for the buttons
	document.getElementById('new-dataset').addEventListener('click', () => {
		dataset = generateRandomDataset();
		centroids = [];
		assignments = [];
		manualInitMode = false;
		manualCentroidCount = 0;
		drawPlot();
	});
	document.getElementById('step').addEventListener('click', () => {
		if (centroids.length === 0) {
			initializeCentroids();
		} else {
			assignClusters();
			updateCentroids();
		}
		drawPlot();
	});
	document.getElementById('converge').addEventListener('click', () => {
		if (centroids.length === 0) {
			initializeCentroids();
		}
		while (!isConverged()) {
			assignClusters();
			updateCentroids();
		}
		drawPlot();
	});
	document.getElementById('reset').addEventListener('click', () => {
		centroids = [];
		assignments = [];
		manualInitMode = false;
		manualCentroidCount = 0;
		drawPlot();
	});

	// Listen for clicks on the plot area for manual centroid initialization
	plotArea.addEventListener('click', (event) => {
		if (manualInitMode) {
			const k = parseInt(numClustersInput.value);
			if (manualCentroidCount < k) {
				const rect = plotArea.getBoundingClientRect();
				const x = event.clientX - rect.left;
				const y = event.clientY - rect.top;

				centroids.push({ x: x, y: y });
				manualCentroidCount++;

				if (manualCentroidCount === k) {
					manualInitMode = false; 
					alert('All centroids selected, now proceed with clustering');
				}

				drawPlot();
			}
		}
	});

	/*********************************************************************************************/
	// Initialize Centroids based on the selected method
	function initializeCentroids() {
    const k = parseInt(numClustersInput.value);
    centroids = [];

    const initMethod = initMethodSelect.value;

    if (initMethod === 'manual') {
			manualInitMode = true;
			manualCentroidCount = 0;
			alert('Click on the plot area to select centroids');
    } else if (initMethod === 'farthest') {
			// Farthest First Initialization
			// Pick the first random centroid
			const firstCentroid = dataset[Math.floor(Math.random() * dataset.length)];
			centroids.push({ ...firstCentroid });

			// For each remaining centroid, find the farthest point from the nearest centroid
			while (centroids.length < k) {
				let farthestPoint = null;
				let maxDistance = -Infinity;

				dataset.forEach(point => {
					// Find the distance to the nearest centroid for this point
					const minDistanceToCentroid = centroids.reduce((minDistance, centroid) => {
						const distance = Math.hypot(point.x - centroid.x, point.y - centroid.y);
						return Math.min(minDistance, distance);
					}, Infinity);

					// If this point is farther than any previously found, update farthestPoint
					if (minDistanceToCentroid > maxDistance) {
						maxDistance = minDistanceToCentroid;
						farthestPoint = point;
					}
				});

				// Add the farthest point found as the next centroid
				centroids.push({ ...farthestPoint });
			}
    } else if (initMethod === 'random') {
			// Random Initialization
			for (let i = 0; i < k; i++) {
				const randomPoint = dataset[Math.floor(Math.random() * dataset.length)];
				centroids.push({ ...randomPoint });
			}
    } else if (initMethod === 'kmeans++') {
			// KMeans++ Initialization
			centroids.push(dataset[Math.floor(Math.random() * dataset.length)]); // Add first random centroid
			while (centroids.length < k) {
				const distances = dataset.map(point => {
					// Calculate the distance to the closest centroid
					const minDistance = centroids.reduce((minDist, centroid) => {
						const distance = Math.hypot(point.x - centroid.x, point.y - centroid.y);
						return Math.min(minDist, distance);
					}, Infinity);
					return minDistance;
				});

				// Pick the next centroid probabilistically based on distance
				const totalDistance = distances.reduce((sum, d) => sum + d, 0);
				const randomValue = Math.random() * totalDistance;
				let cumulativeDistance = 0;
				for (let i = 0; i < dataset.length; i++) {
					cumulativeDistance += distances[i];
					if (cumulativeDistance >= randomValue) {
						centroids.push({ ...dataset[i] });
						break;
					}
				}
      }
    }
    drawPlot();	
	}

	function generateRandomDataset() {
		const data = [];
		for (let i = 0; i < 300; i++) {
			data.push({
				x: Math.random() * plotArea.clientWidth - 1,
				y: Math.random() * plotArea.clientHeight - 1
			});
		}
		return data;
	}

	function assignClusters() {
		assignments = dataset.map(point => {
			let closestIndex = 0;
			let minDistance = Infinity;
			centroids.forEach((centroid, index) => {
				const distance = Math.hypot(point.x - centroid.x, point.y - centroid.y);
				if (distance < minDistance) {
					minDistance = distance;
					closestIndex = index;
				}
			});
			return closestIndex;
		});
	}

	function updateCentroids() {
		previousCentroids = centroids.map(centroid => ({ ...centroid }));
		const k = centroids.length;
		const sums = Array(k).fill(0).map(() => ({ x: 0, y: 0, count: 0 }));

		dataset.forEach((point, index) => {
			const cluster = assignments[index];
			sums[cluster].x += point.x;
			sums[cluster].y += point.y;
			sums[cluster].count += 1;
		});

		sums.forEach((sum, index) => {
			if (sum.count > 0) {
				centroids[index].x = sum.x / sum.count;
				centroids[index].y = sum.y / sum.count;
			}
		});
	}

	function isConverged() {
		return centroids.every((centroid, index) => {
			const prev = previousCentroids[index];
			return centroid.x === prev.x && centroid.y === prev.y;
		});
	}

	function drawPlot() {
		plotArea.innerHTML = '';
		dataset.forEach((point, index) => {
			const dot = document.createElement('div');
			dot.style.position = 'absolute';
			dot.style.width = '5px';
			dot.style.height = '5px';
			dot.style.backgroundColor = assignments[index] !== undefined ? `hsl(${assignments[index] * 360 / centroids.length}, 100%, 50%)` : 'black';
			dot.style.borderRadius = '50%';
			dot.style.left = `${point.x}px`;
			dot.style.top = `${point.y}px`;
			plotArea.appendChild(dot);
		});
		centroids.forEach(centroid => {
			const center = document.createElement('div');
			center.style.position = 'absolute';
			center.style.width = '10px';
			center.style.height = '10px';
			center.style.backgroundColor = 'red';
			center.style.borderRadius = '50%';
			center.style.left = `${centroid.x}px`;
			center.style.top = `${centroid.y}px`;
			plotArea.appendChild(center);
		});
	}

	drawPlot();
});
