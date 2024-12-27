<script lang="ts">
	import {
		elections,
		userVotes,
		filters,
		reservedAntiVote,
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
				if ($filters.search) {
					match = match &&
						(election.title
							.toLowerCase()
							.includes($filters.search.toLowerCase()) ||
							election.description
								.toLowerCase()
								.includes($filters.search.toLowerCase()));
				}
				if ($filters.tags.length > 0) {
					match =
						match &&
						election.tags.some((tag) =>
							$filters.tags.includes(tag),
						);
				}
				if ($filters.type != "all") {
					match = match && election.type === $filters.type;
				}
				return match;
			});
		},
	);

	// Calculate widths of election list items based on userVotes and reservedAntiVote
	const electionWidths = derived(
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
	);
</script>

<div class="main-view">
	<div class="toolbar">
		<FilterToolbar />
	</div>
	
	<div class="graph-container">
		<p>Test</p>
	</div>
	<div class="election-list">
		{#each $filteredElections as election (election.id)}
		<button
			class="election-list-item"
			title={election.title}
			aria-label={election.title}
		>
			<p>{election.title}</p>
		</button>
		{/each}
	</div>
</div>

<style>
	.main-view {
		display: flex;
		flex-direction: column;
		height: 100vh;
	}
	.toolbar {
		padding: 10px
	}

	.graph-container {
		flex-grow: 0.5; /* Take up most of the space */
		border: 1px solid #ccc;
		margin-bottom: 10px;
	}

	.election-list {
		flex-grow: 0.5;
		display: flex;
		flex-direction: row;
		overflow-x: auto;
		width: 100%;
		height: 100px; /* Fixed height for the list */
		align-items: center; /* Vertically center items */
		gap: 0; /* No space between items */
	}

	.election-list-item {
		background-color: #FFFFFF;
		height: 100%; /* fill container */
		flex: 1;
		justify-content: center; /* Center horizontally */
		align-items: center; /* Center vertically */
		transition: width 0.3s ease; /* Smooth width transitions */
		min-width: 0;
		border: none;
	}

	.election-list-item:hover {
		background-color: #e0e0e0;
	}
</style>
