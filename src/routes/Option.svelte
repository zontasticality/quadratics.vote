<script lang="ts">
    import Counter from "./Counter.svelte";

	let {id, name, description, votes = $bindable(0)} = $props();
</script>

<div class="option">
	<h1>{name}</h1>
	<p>{description}</p>
	<Counter bind:count={votes} />
	<p>Cost: {votes ** 2}</p>
</div>

<style>
</style>
