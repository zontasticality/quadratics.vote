<script lang="ts">
	import Option from "./Option.svelte";

	let totalBudget = 100;

	let options = $state([
		{ id: 1, name: "Option A", description: "The As are the best!", votes: 0 },
		{ id: 2, name: "Option B", description: "The Bs are the best!", votes: 0 },
		{ id: 3, name: "Option C", description: "The Cs are the best!", votes: 0 },
	]);

	let totalCost = $derived(
		options.reduce((acc, option) => acc + option.votes ** 2, 0),
	);
	let remainingBudget = $derived(totalBudget - totalCost);
</script>

<main>
	<h1>Quadratic Voting</h1>
	<p>Total Budget: {totalBudget} votes</p>
	<p>Total Cost: {totalCost}</p>
	<p>Remaining Budget: {remainingBudget}</p>

	<div class="options">
		{#each options as option}
			<Option
				bind:votes={option.votes}
				id={option.id}
				name={option.name}
				description={option.description}
			/>
		{/each}
	</div>
	{#if remainingBudget > 0}
		<p>You still have {remainingBudget} credits to spend.</p>
	{/if}
	{#if remainingBudget < 0}
		<p>You have over-spent by {-remainingBudget} credits!</p>
	{/if}
	<button disabled={remainingBudget < 0}>Submit Vote!</button>
</main>

<style>
	main {
		padding: 2rem;
		font-family: Arial, sans-serif;
	}
	.options {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
</style>
