<script>
  import { onMount } from "svelte";
  // Svelte 5 runes syntax
  let elections = [
    { id: 1, name: "Education Reform" },
    { id: 2, name: "Healthcare Policy" },
    { id: 3, name: "Environmental Protection" },
    { id: 4, name: "Infrastructure Investment" },
    { id: 5, name: "Tax Reform" },
  ];

  // Constants
  const TOTAL_CREDITS = 100; // Square root of total voting power
  const MAX_POINTS_PER_ELECTION = 20;
  const GRAPH_HEIGHT = 300;
  const POINT_RADIUS = 15;
  const BAR_WIDTH = 60;

  // Create state variables with runes
  let points = $state(
    elections.map((e) => ({
      id: e.id,
      value: TOTAL_CREDITS / elections.length,
      x: 0,
      y: 0,
      isDragging: false,
    })),
  );

  let totalSquared = $state(0);
  let totalCredits = $state(0);
  let activeElection = $state(null);

  // Calculate positions for points
  $effect(() => {
    // Update positions based on values
    points = points.map((point, index) => {
      const x = (window.innerWidth / (elections.length + 1)) * (index + 1);
      const y =
        GRAPH_HEIGHT - (point.value / MAX_POINTS_PER_ELECTION) * GRAPH_HEIGHT;
      return { ...point, x, y };
    });

    // Calculate totals
    totalSquared = points.reduce((sum, p) => sum + Math.pow(p.value, 2), 0);
    totalCredits = points.reduce((sum, p) => sum + p.value, 0);
  });

  // Handle pointer down (start dragging)
  function handlePointerDown(id) {
    points = points.map((p) => {
      if (p.id === id) {
        return { ...p, isDragging: true };
      }
      return p;
    });
    activeElection = id;
  }

  // Handle pointer move (dragging)
  function handlePointerMove(event) {
    if (!activeElection) return;

    const graphRect = document.getElementById("graph").getBoundingClientRect();

    // Get the point being dragged
    let updatedPoints = [...points];
    const draggedIndex = updatedPoints.findIndex(
      (p) => p.id === activeElection,
    );

    if (draggedIndex !== -1) {
      // Calculate the new Y position based on mouse
      const newY = Math.max(
        0,
        Math.min(GRAPH_HEIGHT, event.clientY - graphRect.top),
      );

      // Convert Y position to value
      const newValue = Math.max(
        0,
        ((GRAPH_HEIGHT - newY) / GRAPH_HEIGHT) * MAX_POINTS_PER_ELECTION,
      );

      // Update the dragged point
      updatedPoints[draggedIndex] = {
        ...updatedPoints[draggedIndex],
        y: newY,
        value: newValue,
      };

      // Calculate sum of squares of all points
      const sumOfSquares = updatedPoints.reduce(
        (sum, p) => sum + Math.pow(p.value, 2),
        0,
      );
      const draggedSquared = Math.pow(updatedPoints[draggedIndex].value, 2);
      const otherSum = sumOfSquares - draggedSquared;

      if (otherSum > 0) {
        const targetSum = TOTAL_CREDITS * TOTAL_CREDITS;
        const targetOtherSum = targetSum - draggedSquared;
        const scaleFactor =
          targetOtherSum > 0 ? Math.sqrt(targetOtherSum / otherSum) : 0;

        // Scale other points to maintain quadratic constraint
        for (let i = 0; i < updatedPoints.length; i++) {
          if (i !== draggedIndex) {
            const scaledValue = updatedPoints[i].value * scaleFactor;
            const newY =
              GRAPH_HEIGHT -
              (scaledValue / MAX_POINTS_PER_ELECTION) * GRAPH_HEIGHT;
            updatedPoints[i] = {
              ...updatedPoints[i],
              value: scaledValue,
              y: newY,
            };
          }
        }
      }

      // Update state
      points = updatedPoints;
    }
  }

  // Handle pointer up (stop dragging)
  function handlePointerUp() {
    points = points.map((p) => ({ ...p, isDragging: false }));
    activeElection = null;
  }

  // Calculate votes (squared points) for each election
  function getVotes(value) {
    return Math.round(Math.pow(value, 2));
  }

  // Get bar height based on votes
  function getBarHeight(value) {
    const votes = getVotes(value);
    // Scale to reasonable height, max 250px
    return Math.min(250, votes * 2.5);
  }
  onMount(() => {
    // Handle window resize
    let windowWidth = $state(window.innerWidth);

    function handleResize() {
      windowWidth = window.innerWidth;
    }
  });
</script>

<svelte:window on:resize={handleResize} />

<div class="container-fluid p-4 h-screen flex flex-col">
  <h1 class="text-3xl font-bold mb-4 text-center">Quadratic Voting System</h1>

  <div class="mb-4">
    <p class="text-lg">
      Total Credits: {totalCredits.toFixed(2)} / {TOTAL_CREDITS}
      (Squared: {totalSquared.toFixed(2)} / {TOTAL_CREDITS * TOTAL_CREDITS})
    </p>
    <p class="text-sm">
      Drag the points up and down to allocate your voting power. The system will
      automatically adjust other points to maintain the quadratic constraint.
    </p>
  </div>

  <div class="flex-grow flex flex-col">
    <!-- Graph Display -->
    <div class="relative flex-grow">
      <svg
        id="graph"
        width="100%"
        height={GRAPH_HEIGHT}
        class="bg-gray-100 border border-gray-300"
        on:pointermove={handlePointerMove}
        on:pointerup={handlePointerUp}
        on:pointerleave={handlePointerUp}
      >
        <!-- Grid lines -->
        {#each Array(5)
          .fill()
          .map((_, i) => i) as line}
          <line
            x1="0"
            y1={line * (GRAPH_HEIGHT / 4)}
            x2="100%"
            y2={line * (GRAPH_HEIGHT / 4)}
            stroke="#ccc"
            stroke-dasharray="4"
          />
          <text
            x="10"
            y={line * (GRAPH_HEIGHT / 4) - 5}
            class="text-xs fill-gray-500"
          >
            {MAX_POINTS_PER_ELECTION - line * (MAX_POINTS_PER_ELECTION / 4)}
          </text>
        {/each}

        <!-- Connecting lines between points -->
        {#if points.length > 0}
          <path
            d={`M ${points[0].x} ${points[0].y} ${points
              .slice(1)
              .map((p) => `L ${p.x} ${p.y}`)
              .join(" ")}`}
            stroke="#3b82f6"
            stroke-width="2"
            fill="none"
          />
        {/if}

        <!-- Points -->
        {#each points as point}
          <circle
            cx={point.x}
            cy={point.y}
            r={POINT_RADIUS}
            fill={point.isDragging ? "#2563eb" : "#3b82f6"}
            stroke="#fff"
            stroke-width="2"
            on:pointerdown={() => handlePointerDown(point.id)}
            style="cursor: ns-resize; touch-action: none;"
          />
          <text
            x={point.x}
            y={point.y}
            text-anchor="middle"
            dominant-baseline="middle"
            fill="white"
            font-weight="bold"
            pointer-events="none"
          >
            {point.value.toFixed(1)}
          </text>
        {/each}
      </svg>
    </div>

    <!-- Vertical Bars Display -->
    <div
      class="h-72 flex justify-around items-end pt-4 border-t border-gray-300"
    >
      {#each elections as election, i}
        <div class="flex flex-col items-center" style="width: {BAR_WIDTH}px;">
          <!-- Vote bar -->
          <div
            class="bg-blue-500 hover:bg-blue-600 transition-colors w-full flex items-end justify-center text-white font-bold"
            style="height: {getBarHeight(points[i].value)}px;"
          >
            {getVotes(points[i].value)}
          </div>

          <!-- Credits display -->
          <div class="text-sm mt-1 text-gray-600">
            {points[i].value.toFixed(1)} credits
          </div>

          <!-- Election name (rotated) -->
          <div class="mt-2 h-16 flex items-center">
            <div
              class="transform -rotate-45 origin-top-left whitespace-nowrap font-medium text-gray-800"
            >
              {election.name}
            </div>
          </div>
        </div>
      {/each}
    </div>
  </div>

  <div class="mt-4 p-4 bg-gray-100 rounded-lg">
    <h2 class="text-xl font-bold mb-2">How Quadratic Voting Works</h2>
    <p>
      In quadratic voting, the cost of votes increases quadratically. This
      means:
    </p>
    <ul class="list-disc pl-6 mt-2">
      <li>1 vote costs 1 credit</li>
      <li>2 votes cost 4 credits</li>
      <li>3 votes cost 9 credits</li>
      <li>And so on...</li>
    </ul>
    <p class="mt-2">
      This system encourages expressing preferences across many issues rather
      than going "all in" on a single issue.
    </p>
  </div>
</div>
