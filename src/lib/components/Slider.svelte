<script lang="ts">
	import { onMount } from "svelte";

	// Props received from App.svelte
	let {
		option,
		value_normalized,
		index,
		onSliderDragStart,
		onSliderValueChangeDuringDrag,
		isCurrentlyDraggingThis,
	} = $props();

	// Constants (could also be passed as props or imported from a shared file)
	const VOTE_MIN_NORMALIZED = -1.0;
	const VOTE_MAX_NORMALIZED = 1.0;
	const VOTE_RANGE = VOTE_MAX_NORMALIZED - VOTE_MIN_NORMALIZED;
	const DISPLAY_PRECISION = 2;

	// DOM element references for calculations
	let trackEl: HTMLDivElement;
	let handleEl: HTMLDivElement;

	// Utility function
	function clamp(value: number, min: number, max: number) {
		return Math.min(Math.max(value, min), max);
	}

	// Fallback/default values for when elements are not yet rendered or have no dimensions
	const APPROX_HANDLE_HEIGHT = 32; // Corresponds to CSS height for .slider-handle
	const FALLBACK_HANDLE_TOP = `calc(50% - ${APPROX_HANDLE_HEIGHT / 2}px)`;
	const FALLBACK_BAR_TOP = "50%";
	const FALLBACK_BAR_HEIGHT = "0px";
	const POSITIVE_BAR_COLOR = "#60a5fa"; // Tailwind blue-400
	const NEGATIVE_BAR_COLOR = "#f87171"; // Tailwind red-400

	// --- Reactive Style Calculations ---

	// Shared calculation: Y-coordinate of handle's center relative to track's top.
	// Returns null if track dimensions are not yet available.
	let currentHandleHeight = $state(0);
	let currentTrackHeight = $state(0);

	const handleCenterYFromTop = $derived.by(() => {
		const percent_of_range_for_position =
			(value_normalized - VOTE_MIN_NORMALIZED) / VOTE_RANGE;
		return currentTrackHeight * (1 - percent_of_range_for_position);
	});

	// Style for Handle Top
	const handleStyleTop = $derived.by(() => {
		const clamped_handle_y = clamp(
			currentHandleHeight / 2,
			0,
			currentTrackHeight - currentHandleHeight,
		);
		return `${clamped_handle_y}px`;
	});

	// Style for Bar Top
	const barStyleTop = $derived.by(() => {
		const _ = value_normalized;
		const currentTrackHeight = trackEl?.offsetHeight;
		const hCenterY = handleCenterYFromTop;

		if (
			currentTrackHeight == null ||
			currentTrackHeight === 0 ||
			hCenterY == null
		) {
			return FALLBACK_BAR_TOP;
		}

		const zeroPointY = currentTrackHeight / 2;
		let barTopPx;
		let barHeightPx; // Needed for accurate clamping of barTopPx
		if (value_normalized >= 0) {
			barTopPx = hCenterY;
			barHeightPx = Math.max(0, zeroPointY - hCenterY);
		} else {
			barTopPx = zeroPointY;
			barHeightPx = Math.max(0, hCenterY - zeroPointY);
		}
		return `${clamp(barTopPx, 0, currentTrackHeight - barHeightPx)}px`;
	});

	// Style for Bar Height
	const barStyleHeight = $derived.by(() => {
		const _ = value_normalized;
		const currentTrackHeight = trackEl?.offsetHeight;
		const hCenterY = handleCenterYFromTop;

		if (
			currentTrackHeight == null ||
			currentTrackHeight === 0 ||
			hCenterY == null
		) {
			return FALLBACK_BAR_HEIGHT;
		}
		const zeroPointY = currentTrackHeight / 2;
		let barHeightPx;
		if (value_normalized >= 0) {
			barHeightPx = Math.max(0, zeroPointY - hCenterY);
		} else {
			barHeightPx = Math.max(0, hCenterY - zeroPointY);
		}
		return `${clamp(barHeightPx, 0, currentTrackHeight)}px`;
	});

	// Local handler to pass necessary info to parent
	function localOnDragStart(event: MouseEvent | TouchEvent) {
		onSliderDragStart(event, index, trackEl); // Pass trackEl for getBoundingClientRect in parent
	}

	// Local handler for immediate value change (e.g., click on track)
	function localOnValueChange(event: MouseEvent | TouchEvent) {
		onSliderValueChangeDuringDrag(event, index, trackEl);
	}
</script>

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
		onmousedown={(e) => {
			localOnDragStart(e);
			localOnValueChange(e);
		}}
		ontouchstart={(e) => {
			localOnDragStart(e);
			localOnValueChange(e);
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
			style:top={barStyleTop}
			style:height={barStyleHeight}
			style:background-color={value_normalized >= 0
				? POSITIVE_BAR_COLOR
				: NEGATIVE_BAR_COLOR}
		></div>
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="slider-handle"
			bind:this={handleEl}
			bind:offsetHeight={currentHandleHeight}
			style:top={handleStyleTop}
			class:dragging={isCurrentlyDraggingThis}
			onmousedown={localOnDragStart}
			ontouchstart={localOnDragStart}
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
		transform: translateX(-50%);
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
		background-color: #2563eb; /* blue-600 */
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
