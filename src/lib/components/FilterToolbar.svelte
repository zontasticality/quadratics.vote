<script lang="ts">
	import { filters, electionFilterOptions, sortByOptions } from "$lib/stores";
	import { AppBar } from "@skeletonlabs/skeleton";
	import { RadioGroup, RadioItem } from "@skeletonlabs/skeleton";

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

<label for="sort-by">Sort By:</label>

<RadioGroup>
	{#each sortByOptions as option, i}
		<RadioItem bind:group={$filters.sortBy} name="justify" value={option}>{option}</RadioItem>
	{/each}
</RadioGroup>

<label for="election-type">Type:</label>
<select class="select" id="election-type" bind:value={$filters.type}>
	<option value="all">all</option>
	{#each electionFilterOptions as type}
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
