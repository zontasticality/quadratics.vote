<script lang="ts">
	import { filters, electionFilterOptions, sortByOptions } from "$lib/stores";
	import { RadioGroup, RadioItem } from "@skeletonlabs/skeleton";
</script>

<form class="flex flex-col md:flex-row gap-3">
	<!-- <div
		class="inline-flex items-center space-x-1 rounded-full border border-black p-0"
	>
		{#each sortByOptions as option}
			<label class="cursor-pointer">
				<input
					type="radio"
					name="sort-by"
					value={option}
					class="sr-only peer"
				/>
				<span
					class="rounded-full px-4 py-2 text-sm text-gray-600
			   hover:bg-gray-100 peer-checked:bg-blue-600 peer-checked:text-white
			   transition-colors"
				>
					{option}
				</span>
			</label>
		{/each}
	</div> -->

	<div class="p-3">
		<RadioGroup>
			{#each sortByOptions as option, i}
				<RadioItem
					bind:group={$filters.sortBy}
					name="justify"
					value={option}>{option}</RadioItem
				>
			{/each}
		</RadioGroup>
	</div>
	<div class="p-3">
		<RadioGroup>
			{#each electionFilterOptions as option, i}
				<RadioItem
					bind:group={$filters.type}
					name="justify"
					value={option}>{option}</RadioItem
				>
			{/each}
		</RadioGroup>
	</div>

	<div class="p-6 w-100">
		<input
			type="text"
			placeholder="Search Elections"
			class="input"
			bind:value={$filters.search}
		/>
	</div>
</form>
