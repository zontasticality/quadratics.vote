<script lang="ts">
	let {
		option, // option data
		value_normalized, // from -1 to 1
		index, // for sending back events
		onSliderDragStart, // callback to trigger drag start
		onSliderValueChangeDuringDrag, // callback while dragging
		isCurrentlyDraggingThis, // parent must track if we are currently dragging this slider
	} = $props();

	const DISPLAY_PRECISION = 2; // precision to display vote & credit amounts
	const SLIDER_HANDLE_CLAMP_PADDING = 10; // padding from top or bottom of slider to prevent overrun

	// DOM element references for calculations
	let trackEl: HTMLDivElement;

	// Utility functions
	const mapRange = (
		value: number,
		inMin: number,
		inMax: number,
		outMin: number,
		outMax: number,
	) => {
		return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
	};
	const clamp = (v: number, min: number, max: number) =>
		Math.min(Math.max(v, min), max);

	// Fallback/default values for when elements are not yet rendered or have no dimensions
	const POSITIVE_BAR_COLOR = "#60a5fa"; // Tailwind blue-400
	const NEGATIVE_BAR_COLOR = "#f87171"; // Tailwind red-400

	// --- Reactive Style Calculations ---

	// Shared calculation: Y-coordinate of handle's center relative to track's top
	let currentTrackHeight = $state(0);
	const barMiddlePointY = $derived(currentTrackHeight / 2);

	// y-coord estimation where the visual center of the slider handle should be, relative to the top of the entire slider div
	const handleCenterYFromTop = $derived(
		mapRange(value_normalized, -1, 1, currentTrackHeight, 0),
	);
</script>

<!-- Note: We are making a custom slider because browser-default ones are too finnicky to style and manipulate -->
<div class="slider-wrapper flex flex-col items-center space-y-1 relative">
	<div
		class="option-label text-sm text-gray-600 font-medium h-10 flex items-center justify-center"
	>
		{option.name}
	</div>
	<div
		class="slider-track"
		bind:this={trackEl}
		bind:offsetHeight={currentTrackHeight}
		onmousedown={(event) => {
			onSliderDragStart(event, index, trackEl);
			onSliderValueChangeDuringDrag(event, index, trackEl);
		}}
		ontouchstart={(event) => {
			onSliderDragStart(event, index, trackEl);
			onSliderValueChangeDuringDrag(event, index, trackEl);
		}}
		role="slider"
		aria-valuemin="-100"
		aria-valuemax="100"
		aria-valuenow={value_normalized * 100}
		aria-label={option.name}
		aria-orientation="vertical"
		tabindex="0"
	>
		<div class="zero-line-visual"></div>
		<div
			class="value-bar"
			style:top={`${value_normalized >= 0 ? handleCenterYFromTop : barMiddlePointY}px`}
			style:height={`${Math.abs(handleCenterYFromTop - barMiddlePointY)}px`}
			style:background-color={value_normalized >= 0
				? POSITIVE_BAR_COLOR
				: NEGATIVE_BAR_COLOR}
		></div>
		<!-- Custom slider handle, need to set  -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="slider-handle"
			style:top={`${clamp(handleCenterYFromTop, SLIDER_HANDLE_CLAMP_PADDING, currentTrackHeight - SLIDER_HANDLE_CLAMP_PADDING)}px`}
			class:dragging={isCurrentlyDraggingThis}
			onmousedown={(event) => {
				onSliderDragStart(event, index, trackEl);
			}}
			ontouchstart={(event) => {
				onSliderDragStart(event, index, trackEl);
			}}
		></div>
	</div>
	<div class="vote-value-display">
		Vote: {(value_normalized * 100).toFixed(DISPLAY_PRECISION)}%
	</div>
	<div class="vote-value-display">
		Credit: {(value_normalized * value_normalized * 100).toFixed(
			DISPLAY_PRECISION,
		)}%
	</div>
</div>

<!-- Styles for .slider-wrapper, .option-label, etc. are global in App.svelte -->
<!-- If Slider.svelte had unique styles, they would go here. -->

<style>
	.slider-track {
		width: 24px;
		height: 250px;
		background-color: #e5e7eb; /* gray-200 */
		border-radius: 6px;
		position: relative;
		cursor: grab;
		touch-action: none; /* Important for touch interactions on slider */
	}
	.slider-handle {
		width: 32px;
		height: 32px;
		background-color: #3b82f6; /* blue-500 */
		border-radius: 50%;
		position: absolute;
		left: 50%;
		transform: translate(-50%, -50%);
		cursor: grab;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		border: 2px solid white;
		z-index: 10;
		transition: background-color 0.15s ease-in-out;
	}
	.slider-handle:hover {
		background-color: #60a5fa; /* blue-400 */
	}
	.slider-handle.dragging {
		/* Applied via class:dragging in Slider.svelte */
		background-color: #8aafff; /* blue-600 */
	}
	.value-bar {
		position: absolute;
		left: 50%;
		transform: translateX(-50%);
		width: 16px;
		border-radius: 4px;
		z-index: 5;
	}
	.zero-line-visual {
		position: absolute;
		left: -4px;
		right: -4px;
		top: 50%;
		height: 2px;
		background-color: #9ca3af; /* gray-400 */
		z-index: 6;
		transform: translateY(-1px);
	}
	.option-label {
		width: 80px;
		word-wrap: break-word;
		text-align: center;
	}
	.vote-value-display {
		margin-top: 4px;
		font-size: 0.875rem; /* text-sm */
		color: #4b5563; /* gray-600 */
		font-weight: 500; /* medium */
		height: 20px;
		text-align: center;
		width: 120px; /* prevent resizing while dragging */
	}
</style>
