<script lang="ts">
	import { filters } from "$lib/stores";
	import { AppBar } from "@skeletonlabs/skeleton";

	const sortByOptions = ["newest", "oldest", "mostVotes", "deadline"];
	const electionTypes = ["binary", "pick-n", "number"];

	function handleTagChange(event: Event) {
		const selectedTag = (event.target as HTMLInputElement).value;
		if ($filters.tags.includes(selectedTag)) {
			$filters.tags = $filters.tags.filter((tag) => tag !== selectedTag);
		} else {
			$filters.tags = [...$filters.tags, selectedTag];
		}
		filters.set($filters);
	}

	function handleSearchChange(event: Event) {
		$filters.search = (event.target as HTMLInputElement).value;
		filters.set($filters);
	}
</script>

<AppBar>
	<label for="sort-by">Sort By:</label>
	<select id="sort-by" bind:value={$filters.sortBy}>
		{#each sortByOptions as option}
			<option value={option}>{option}</option>
		{/each}
	</select>

	<label for="election-type">Type:</label>
	<select class="select" id="election-type" bind:value={$filters.type}>
		<option value="all">all</option>
		{#each electionTypes as type}
			<option value={type}>{type}</option>
		{/each}
	</select>

	<label for="tags">Tags:</label>
	<input
		type="text"
		id="tags"
		placeholder="Enter tags separated by commas"
		on:change={handleTagChange}
	/>

	<label for="search">Search:</label>
	<input
		type="text"
		id="search"
		value={$filters.search}
		on:input={handleSearchChange}
	/>
</AppBar>
