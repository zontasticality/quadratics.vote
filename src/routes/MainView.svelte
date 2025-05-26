<script lang="ts">
	import Slider from "./Slider.svelte";

	// --- Configuration ---
	const MAX_TOTAL_CREDITS = 1.0; // Normalized total credits (1.0 = 100%)
	const VOTE_MIN_NORMALIZED = -1.0; // -100%
	const VOTE_MAX_NORMALIZED = 1.0; // +100%
	const OPTIONS_DATA = [
		// This is static configuration data
		{ id: "option1", name: "Project A" },
		{ id: "option2", name: "Initiative B" },
		{ id: "option3", name: "Proposal C" },
		{ id: "option4", name: "Plan D" },
		{ id: "option5", name: "Concept E" },
	];
	const DISPLAY_PRECISION = 2;
	const INTERNAL_PRECISION = 6;
	const EPSILON = 0.000001;

	// --- State ---
	let optionValues_normalized = $state(OPTIONS_DATA.map(() => 0.0));

	let isDragging = $state<boolean>(false);
	let draggedSliderIndex = $state<number>(-1);
	let initialDragValues_normalized = $state<number[]>([]); // Snapshot during drag
	let activeTrackEl: HTMLDivElement | null; // DOM element of the track being dragged

	let showMessageModal = $state(false);
	let messageModalTitle = $state("Notification");
	let messageModalText = $state("Message goes here.");

	// --- DOM Elements (Refs) ---
	let curveSvgEl: SVGSVGElement; // bind:this

	// --- Utility Functions ---
	function clamp(value: number, min: number, max: number) {
		return Math.min(Math.max(value, min), max);
	}

	// --- Derived State ---
	const totalSpentCredits_normalized: number = $derived(
		optionValues_normalized.reduce((sum, val) => sum + val * val, 0),
	);

	let availableCredits_normalized: number = $derived.by(() => {
		let avail = MAX_TOTAL_CREDITS - totalSpentCredits_normalized;
		if (avail < 0 && avail > -EPSILON) return 0.0;
		return avail;
	});

	// --- Slider Drag Logic ---
	function handleSliderValueChange(
		event: MouseEvent | TouchEvent,
		sliderIndex: number,
		trackEl: HTMLElement,
	) {
		const rect = trackEl.getBoundingClientRect();
		let clientY =
			"touches" in event ? event.touches[0].clientY : event.clientY;
		const y_on_track = clamp(clientY - rect.top, 0, rect.height);

		const percent_of_track_from_top = y_on_track / rect.height;
		let targetSliderValue_normalized =
			VOTE_MAX_NORMALIZED -
			percent_of_track_from_top *
				(VOTE_MAX_NORMALIZED - VOTE_MIN_NORMALIZED);
		targetSliderValue_normalized = parseFloat(
			targetSliderValue_normalized.toFixed(INTERNAL_PRECISION),
		);
		targetSliderValue_normalized = clamp(
			targetSliderValue_normalized,
			VOTE_MIN_NORMALIZED,
			VOTE_MAX_NORMALIZED,
		);

		let currentAttemptValues_normalized = [...initialDragValues_normalized]; // Work on a copy of initial state
		currentAttemptValues_normalized[sliderIndex] =
			targetSliderValue_normalized;

		const cost_of_dragged_slider =
			targetSliderValue_normalized * targetSliderValue_normalized;

		let cost_of_others_at_initial = 0;
		for (let i = 0; i < initialDragValues_normalized.length; i++) {
			if (i === sliderIndex) continue;
			cost_of_others_at_initial +=
				initialDragValues_normalized[i] *
				initialDragValues_normalized[i];
		}

		const total_tentative_cost =
			cost_of_dragged_slider + cost_of_others_at_initial;
		let finalAttemptValues_normalized;

		if (total_tentative_cost <= MAX_TOTAL_CREDITS + EPSILON) {
			finalAttemptValues_normalized = currentAttemptValues_normalized;
		} else {
			let max_permissible_cost_for_others =
				MAX_TOTAL_CREDITS - cost_of_dragged_slider;
			let tempValues = [...currentAttemptValues_normalized]; // Make a mutable copy

			if (max_permissible_cost_for_others < -EPSILON) {
				const sign = Math.sign(targetSliderValue_normalized) || 1;
				const capped_abs_value = Math.sqrt(MAX_TOTAL_CREDITS);
				tempValues[sliderIndex] = parseFloat(
					(sign * capped_abs_value).toFixed(INTERNAL_PRECISION),
				);
				for (let i = 0; i < tempValues.length; i++) {
					if (i !== sliderIndex) tempValues[i] = 0.0;
				}
			} else {
				if (max_permissible_cost_for_others < 0)
					max_permissible_cost_for_others = 0;
				const SumSq_initial_others = cost_of_others_at_initial;

				if (SumSq_initial_others <= EPSILON) {
					if (cost_of_dragged_slider > MAX_TOTAL_CREDITS) {
						// Should be caught by above
						const sign =
							Math.sign(targetSliderValue_normalized) || 1;
						tempValues[sliderIndex] = parseFloat(
							(sign * Math.sqrt(MAX_TOTAL_CREDITS)).toFixed(
								INTERNAL_PRECISION,
							),
						);
					}
				} else {
					const scaling_factor_sq =
						max_permissible_cost_for_others / SumSq_initial_others;
					const scaling_factor = Math.sqrt(
						Math.max(0, scaling_factor_sq),
					);

					for (let i = 0; i < tempValues.length; i++) {
						if (i !== sliderIndex) {
							tempValues[i] = parseFloat(
								(
									initialDragValues_normalized[i] *
									scaling_factor
								).toFixed(INTERNAL_PRECISION),
							);
						}
					}
				}
			}
			finalAttemptValues_normalized = tempValues;
		}
		// Update the $state array. Assigning a new array is the Svelte 5 way.
		optionValues_normalized = finalAttemptValues_normalized.map((v) =>
			parseFloat(v.toFixed(INTERNAL_PRECISION)),
		);
	}

	function onSliderDragStart(
		event: MouseEvent | TouchEvent,
		sliderIdx: number,
		trackElRef: HTMLDivElement,
	) {
		event.preventDefault();
		isDragging = true;
		draggedSliderIndex = sliderIdx;
		initialDragValues_normalized = [...optionValues_normalized]; // Snapshot current values
		activeTrackEl = trackElRef; // Store the DOM element of the track
	}

	// --- Global Event Listeners for Dragging ---
	const onDocumentMouseMove = (e: MouseEvent | TouchEvent) => {
		if (!isDragging || draggedSliderIndex === -1 || !activeTrackEl) return;
		e.preventDefault(); // Important for touchmove to prevent scrolling
		handleSliderValueChange(e, draggedSliderIndex, activeTrackEl);
	};

	const onDocumentMouseUp = () => {
		if (!isDragging) return;

		isDragging = false;
		// draggedSliderIndex = -1; // Keep for potential class removal if needed, reset later
		// activeTrackEl = null; // Reset after use

		let finalSpent = totalSpentCredits_normalized; // Use derived value
		if (finalSpent > MAX_TOTAL_CREDITS + EPSILON) {
			console.warn(
				`Correcting minor overspend: ${finalSpent} > ${MAX_TOTAL_CREDITS}. Re-normalizing...`,
			);
			let newValues;
			if (finalSpent > EPSILON) {
				const scaleCorrection = Math.sqrt(
					MAX_TOTAL_CREDITS / finalSpent,
				);
				newValues = optionValues_normalized.map((v) =>
					parseFloat(
						(v * scaleCorrection).toFixed(INTERNAL_PRECISION),
					),
				);
			} else {
				newValues = optionValues_normalized.map(() => 0.0);
			}
			optionValues_normalized = newValues;
		}

		// Ensure no value is -0.0 after all operations
		optionValues_normalized = optionValues_normalized.map((v) =>
			v === 0 && Object.is(v, -0) ? 0.0 : v,
		);

		draggedSliderIndex = -1; // Fully reset drag state
		activeTrackEl = null;
	};

	$effect(() => {
		if (isDragging) {
			document.addEventListener("mousemove", onDocumentMouseMove);
			document.addEventListener("mouseup", onDocumentMouseUp);
			document.addEventListener("touchmove", onDocumentMouseMove, {
				passive: false,
			});
			document.addEventListener("touchend", onDocumentMouseUp);
		}
		return () => {
			// Cleanup global listeners
			document.removeEventListener("mousemove", onDocumentMouseMove);
			document.removeEventListener("mouseup", onDocumentMouseUp);
			document.removeEventListener("touchmove", onDocumentMouseMove);
			document.removeEventListener("touchend", onDocumentMouseUp);
		};
	});

	// --- Curve Drawing ---
	function drawCurve() {
		if (!curveSvgEl) return;

		const points: { x: number; y: number }[] = [];
		const svgRect = curveSvgEl.getBoundingClientRect();

		// Query for rendered slider wrappers. Relies on current DOM structure.
		const renderedSliderWrappers = document.querySelectorAll(
			"#slidersContainer .slider-wrapper",
		);

		if (
			renderedSliderWrappers.length === 0 ||
			svgRect.width === 0 ||
			svgRect.height === 0
		) {
			curveSvgEl.innerHTML = "";
			return;
		}

		const firstSliderTrack =
			renderedSliderWrappers[0]?.querySelector(".slider-track");
		if (!firstSliderTrack) {
			curveSvgEl.innerHTML = "";
			return;
		}

		const firstTrackRect = firstSliderTrack.getBoundingClientRect();
		// Y coordinate in SVG representing the "zero vote" line (middle of the slider tracks)
		const svgZeroY =
			firstTrackRect.top - svgRect.top + firstTrackRect.height / 2;

		renderedSliderWrappers.forEach((sliderWrapper) => {
			const handle = sliderWrapper.querySelector(".slider-handle");
			if (!handle) return;

			const sliderWrapperRect = sliderWrapper.getBoundingClientRect();
			const centerX =
				sliderWrapperRect.left -
				svgRect.left +
				sliderWrapperRect.width / 2;

			const handleRect = handle.getBoundingClientRect();
			// Y coordinate of the center of the handle in SVG space
			const handleCenterY =
				handleRect.top - svgRect.top + handleRect.height / 2;
			points.push({ x: centerX, y: handleCenterY });
		});

		if (points.length < 1) {
			curveSvgEl.innerHTML = "";
			return;
		}

		let linePathData = `M ${points[0].x} ${points[0].y}`;
		if (points.length > 1) {
			for (let i = 0; i < points.length - 1; i++) {
				const p0 = points[i];
				const p1 = points[i + 1];
				const cp1x = (p0.x + p1.x) / 2;
				const cp1y = p0.y;
				const cp2x = (p0.x + p1.x) / 2;
				const cp2y = p1.y;
				linePathData += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
			}
		}

		let positiveFillPathData = `M ${points[0].x} ${svgZeroY}`;
		let negativeFillPathData = `M ${points[0].x} ${svgZeroY}`;
		let hasPositiveFill = false;
		let hasNegativeFill = false;

		for (let i = 0; i < points.length; ++i) {
			const p = points[i];
			if (p.y < svgZeroY - EPSILON) {
				// Point is above zero line (positive vote)
				positiveFillPathData += ` L ${p.x} ${p.y}`;
				negativeFillPathData += ` L ${p.x} ${svgZeroY}`;
				hasPositiveFill = true;
			} else if (p.y > svgZeroY + EPSILON) {
				// Point is below zero line (negative vote)
				negativeFillPathData += ` L ${p.x} ${p.y}`;
				positiveFillPathData += ` L ${p.x} ${svgZeroY}`;
				hasNegativeFill = true;
			} else {
				// Point is on (or very near) zero line
				positiveFillPathData += ` L ${p.x} ${svgZeroY}`;
				negativeFillPathData += ` L ${p.x} ${svgZeroY}`;
			}
		}

		positiveFillPathData += ` L ${points[points.length - 1].x} ${svgZeroY} Z`;
		negativeFillPathData += ` L ${points[points.length - 1].x} ${svgZeroY} Z`;

		let pathsHTML = "";
		if (hasPositiveFill) {
			pathsHTML += `<path d="${positiveFillPathData}" fill="#60a5fa" fill-opacity="0.3"/>`; // Light blue fill
		}
		if (hasNegativeFill) {
			pathsHTML += `<path d="${negativeFillPathData}" fill="#f87171" fill-opacity="0.3"/>`; // Light red fill
		}
		// Orange line connecting handle centers
		pathsHTML += `<path d="${linePathData}" stroke="#fb923c" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;

		curveSvgEl.innerHTML = pathsHTML;
	}

	$effect(() => {
		// This $effect will run after DOM updates caused by optionValues_normalized changes.
		// It explicitly tracks optionValues_normalized to re-run drawCurve.
		const _ = optionValues_normalized.slice(); // Track changes to array content
		if (curveSvgEl) {
			drawCurve();
		}
	});
</script>

<svelte:head>
	<title>Quadratic Voting Visualizer</title>
	<script src="https://cdn.tailwindcss.com"></script>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link
		rel="preconnect"
		href="https://fonts.gstatic.com"
		crossorigin="anonymous"
	/>
	<link
		href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<svelte:window on:resize={drawCurve} />

<div
	class="bg-gray-100 text-gray-800 flex flex-col items-center justify-center min-h-screen p-4 selection:bg-blue-200"
>
	<div
		class="w-full max-w-6xl bg-white p-6 rounded-xl shadow-2xl flex flex-col lg:flex-row lg:space-x-6"
	>
		<div class="flex-grow">
			<header class="flex justify-between items-center mb-6">
				<h1 class="text-2xl sm:text-3xl font-bold text-gray-700">
					Quadratic Voting
				</h1>
				<div
					id="creditsDisplay"
					class="text-xl sm:text-2xl font-semibold px-4 py-2 rounded-lg shadow"
					class:bg-blue-100={availableCredits_normalized >= -EPSILON}
					class:text-blue-700={availableCredits_normalized >=
						-EPSILON}
					class:bg-red-100={availableCredits_normalized < -EPSILON}
					class:text-red-700={availableCredits_normalized < -EPSILON}
				>
					Credits: <span id="creditsValue"
						>{(availableCredits_normalized * 100).toFixed(
							DISPLAY_PRECISION,
						)}%</span
					>
				</div>
			</header>

			<div id="visualizationArea" class="relative mb-2 h-40 sm:h-48">
				<svg
					bind:this={curveSvgEl}
					width="100%"
					height="100%"
					class="absolute top-0 left-0"
				></svg>
			</div>

			<div
				id="slidersContainer"
				class="flex justify-around items-start space-x-2 sm:space-x-4 relative"
			>
				{#each OPTIONS_DATA as option, index (option.id)}
					<Slider
						{option}
						value_normalized={optionValues_normalized[index]}
						{index}
						{onSliderDragStart}
						onSliderValueChangeDuringDrag={handleSliderValueChange}
						isCurrentlyDraggingThis={isDragging &&
							draggedSliderIndex === index}
					/>
				{/each}
			</div>

			<div
				class="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-600"
			>
				<p><strong class="font-semibold">How to use:</strong></p>
				<ul class="list-disc list-inside ml-4 mt-2 space-y-1">
					<li>
						Drag sliders to cast votes (-100% to +100%). Votes cost
						credits quadratically (vote<sup>2</sup>).
					</li>
					<li>
						Total credits available is 100%. Moving sliders towards
						0% reclaims credits.
					</li>
					<li>
						If you attempt to exceed 100% total credits, other votes
						will be reduced to compensate.
					</li>
					<li>
						The curve visualizes the allocation. Details are in the
						sidebar.
					</li>
				</ul>
			</div>
		</div>

		<aside
			class="sidebar mt-6 lg:mt-0 bg-gray-50 p-4 rounded-lg border border-gray-200 shadow"
		>
			<h2 class="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">
				Vote Allocation
			</h2>
			<div id="sidebarContent" class="space-y-3">
				{#each OPTIONS_DATA as option, index (option.id)}
					{@const voteVal_normalized = optionValues_normalized[index]}
					{@const creditsConsumed_normalized =
						voteVal_normalized * voteVal_normalized}
					<div
						class="p-3 bg-white rounded-md shadow-sm border border-gray-200"
					>
						<h4 class="font-semibold text-gray-700">
							{option.name}
						</h4>
						<p class="text-sm text-gray-600">
							Vote Value: <span class="font-medium"
								>{(voteVal_normalized * 100).toFixed(
									DISPLAY_PRECISION,
								)}%</span
							>
						</p>
						<p class="text-sm text-gray-500">
							Credits Used: <span class="font-medium"
								>{(creditsConsumed_normalized * 100).toFixed(
									DISPLAY_PRECISION,
								)}%</span
							>
						</p>
					</div>
				{/each}
			</div>
		</aside>
	</div>

	{#if showMessageModal}
		<div
			id="messageModal"
			class="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center p-4 z-50"
		>
			<div class="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
				<h3
					id="messageModalTitle"
					class="text-lg font-semibold mb-2 text-gray-800"
				>
					{messageModalTitle}
				</h3>
				<p id="messageModalText" class="text-gray-600 mb-4">
					{messageModalText}
				</p>
				<button
					id="messageModalClose"
					class="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-150"
					onclick={() => (showMessageModal = false)}
				>
					OK
				</button>
			</div>
		</div>
	{/if}
</div>

<style>
	:global(body) {
		/* Targeting body globally */
		font-family: "Inter", sans-serif;
		overscroll-behavior: none;
	}
	/* These styles are effectively global because they are not scoped by a Svelte class hash */

	#visualizationArea {
		position: relative;
		z-index: 1;
	}
	#slidersContainer {
		position: relative;
		z-index: 2;
	}
	.sidebar {
		width: 280px;
		/* max-height: 600px; */
		overflow-y: auto;
	}
</style>
