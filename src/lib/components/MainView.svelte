<script lang="ts">
	import {
		elections,
		userVotes,
		filters,
		reservedAntiVote,
		type ElectionId,
		type UserVote,
	} from "$lib/stores";
	// import ElectionListItem from "./ElectionListItem.svelte";
	// import DistributionGraph from "./DistributionGraph.svelte";
	import FilterToolbar from "./FilterToolbar.svelte";
	import { derived } from "svelte/store";

	// Example derived store to filter elections based on current filters
	const filteredElections = derived(
		[elections, filters],
		([$elections, $filters]) => {
			return Object.values($elections).filter((election) => {
				let match = true;
				// apply search filter
				if ($filters.search) {
					match =
						match &&
						(election.title
							.toLowerCase()
							.includes($filters.search.toLowerCase()) ||
							election.description
								.toLowerCase()
								.includes($filters.search.toLowerCase()));
				}
				// apply tag filter
				if ($filters.tags.length > 0) {
					match =
						match &&
						election.tags.some((tag) =>
							$filters.tags.includes(tag),
						);
				}
				// apply type filter
				if ($filters.type != "all") {
					match = match && election.type === $filters.type;
				}
				return match;
			});
		},
	);

	// Calculate widths of election list items based on userVotes and reservedAntiVote
	/* const electionWidths = derived(
		[filteredElections, userVotes, reservedAntiVote],
		([$filteredElections, $userVotes, $reservedAntiVote]) => {
			const widths: Record<string, number> = {};
			const totalAllocated = Object.values($userVotes).reduce(
				(sum, vote) => sum + vote.distribution,
				0,
			);
			const remaining = 1 - totalAllocated - $reservedAntiVote;
			const numUnallocated = $filteredElections.filter(
				(election) => !$userVotes[election.id],
			).length;

			for (const election of $filteredElections) {
				if ($userVotes[election.id]) {
					widths[election.id] = Math.max(
						0,
						$userVotes[election.id].distribution,
					); // Prevent negative widths
				} else {
					widths[election.id] =
						remaining > 0 ? remaining / numUnallocated : 0;
				}
			}
			return widths;
		},
	); */
	// state object mapping election id to initial and current value
	const points = $state(
		Object.fromEntries(
			$filteredElections.map((election) => [
				election.id,
				{
					id: election.id,
					value: election.publicVoteDistribution,
				},
			]),
		),
	);
	// test print points
	console.log(points);
	let activePoint: ElectionId = $state("");
	// effect that interpolates all other points between initial and 0 based on value of active point
	// this is used to animate the graph when the user drags a dot on the graph

	/* function handleMouseDown(id: ElectionId) {
		activePoint = id;
		// interpolate value in points between initial and 0 based on active point
		let activeValue = points[activePoint];
		for (const point of points) {
			if ()
		}
	}

	function handleMouseMove(e) {
		if ($activePoint === null) return;

		const rect = e.currentTarget.getBoundingClientRect();
		const mouseY = e.clientY - rect.top;
		const newValue = Math.max(
			-1,
			Math.min(1, ((rect.height - mouseY) / rect.height) * 2 - 1),
		);

		let newPoints = $points.map((point) =>
			point.id === $activePoint ? { ...point, value: newValue } : point,
		);

		let sum = newPoints.reduce(
			(acc, point) => acc + Math.abs(point.value),
			0,
		);

		if (sum > 1) {
			const scaleFactor = 1 / sum;
			newPoints = newPoints.map((point) =>
				point.id !== $activePoint
					? { ...point, value: point.value * scaleFactor }
					: point,
			);

			// Revert other points to original positions if possible
			if ($originalPointsDuringDrag) {
				newPoints = newPoints.map((point) => {
					if (point.id !== $activePoint) {
						const originalPoint = $originalPointsDuringDrag.find(
							(p) => p.id === point.id,
						);
						if (originalPoint) {
							// Check if reverting to original keeps the total sum <= 1
							let tempPoints = newPoints.map((p) =>
								p.id === point.id ? originalPoint : p,
							);
							let tempSum = tempPoints.reduce(
								(acc, p) => acc + Math.abs(p.value),
								0,
							);
							if (tempSum <= 1) {
								return originalPoint;
							}
						}
					}
					return point;
				});
			}
		}
		points.set(newPoints);
	}

	function handleMouseUp() {
		activePoint.set(null);
		originalPointsDuringDrag.set(null);
	} */
</script>

<div class="flex flex-col h-screen">
	<div class="flex flex-row overflow-x-auto">
		<FilterToolbar />
	</div>
	<div class="overflow-x-auto flex flex-col h-full p-3">
		<div
			class="relative h-1/2 bg-gray-100 border border-gray-300 rounded-md"
		>
			{#each $filteredElections as election, i}{/each}
			<div
				class="absolute inset-0 border-t border-gray-400 h-px top-1/2"
			></div>
		</div>
		<!-- <div class="flex justify-between mt-2">
			{#each $filteredElections as election (election.id)}
				<div class="text-center">
					<div class="text-sm">Option {election.id + 1}</div>
					<div class="text-xs text-gray-500">
						{(points[election.id].value * 100).toFixed(0)}%
					</div>
				</div>
			{/each}
		</div> -->
		<div class="flex flex-row w-full h-1/2">
			{#each $filteredElections as election (election.id)}
				<button
					class="bg-white-600 basis-full hover:bg-slate-100 h-full"
					title={election.title}
					aria-label={election.title}
				>
					<p>{election.title}</p>
				</button>
			{/each}
		</div>
	</div>

	<!-- <div class="graph-container">
		<svg>
			{#each $filteredElections as election, idx}
				<div
					class="absolute w-2 h-2 rounded-full bg-blue-500 cursor-pointer"
					style="bottom: {((points[election.id].value + 1) / 2) *
						100}%; left: {(idx / (Object.keys(points).length - 1)) *
						100}%"
				></div>
			{/each}
		</svg>
	</div> -->
</div>

<style>
	.graph-container {
		flex-grow: 0.5; /* Take up most of the space */
		border: 1px solid #ccc;
		margin-bottom: 10px;
	}
</style>
