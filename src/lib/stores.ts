import { writable, type Writable } from 'svelte/store';

// Types
export type ElectionId = string; // UUID
export type UserId = string; // UUID

export interface ElectionOption {
	id: string;
	label: string;
	currentVotes: number; // Publicly visible aggregated votes (sqrt-transformed)
}

export interface BaseElection {
	id: ElectionId;
	title: string;
	description: string;
	type: "binary" | "pick-n" | "number";
	deadline?: Date; // Optional deadline
	tags: string[];
	publicVoteDistribution: number; // Publicly visible sqrt(proportion) 
}

export interface BinaryElection extends BaseElection {
	type: "binary";
	options: [ElectionOption, ElectionOption]; // Exactly two options
}

export interface PickNElection extends BaseElection {
	type: "pick-n";
	options: ElectionOption[];
	n: number; // Number of options to pick
}

export interface NumberElection extends BaseElection {
	type: "number";
	min: number;
	max: number;
	options: ElectionOption[]; // Each option is a discrete number
}

export type Election = BinaryElection | PickNElection | NumberElection;

// User-specific votes for an election (private)
export interface UserVote {
	electionId: ElectionId;
	distribution: number; // User's allocated proportion to this election (can be negative)
	optionAllocations: Record<string, number>; // For options within the election, key is optionId
}

// Dummy Data for Stores
const dummyElections: Record<ElectionId, Election> = {
	"uuid-1": {
		id: "uuid-1",
		title: "Should we build a new park?",
		description: "Vote on whether the city should invest in a new park.",
		type: "binary",
		deadline: new Date("2024-12-31"),
		tags: ["environment", "recreation"],
		options: [
			{ id: "option-1", label: "Yes", currentVotes: 0.6 },
			{ id: "option-2", label: "No", currentVotes: 0.4 },
		],
		publicVoteDistribution: 0,
	},
	"uuid-2": {
		id: "uuid-2",
		title: "City Council Election",
		description: "Vote for your preferred city council members.",
		type: "pick-n",
		deadline: new Date("2024-11-15"),
		tags: ["politics", "local"],
		options: [
			{ id: "option-3", label: "Alice", currentVotes: 0.5 },
			{ id: "option-4", label: "Bob", currentVotes: 0.3 },
			{ id: "option-5", label: "Carol", currentVotes: 0.2 },
		],
		n: 2,
		publicVoteDistribution: 0,
	},
	"uuid-3": {
		id: "uuid-3",
		title: "Set the speed limit for Main Street",
		description: "Determine the appropriate speed limit for Main Street.",
		type: "number",
		min: 25,
		max: 45,
		options: Array.from({ length: 21 }, (_, i) => ({
			id: `option-${i + 6}`,
			label: `${25 + i}`,
			currentVotes: 0,
		})), // Options from 25 to 45
		tags: ["traffic", "safety"],
		publicVoteDistribution: 0,
	},
};

const dummyUserVotes: Record<ElectionId, UserVote> = {
	"uuid-1": {
		electionId: "uuid-1",
		distribution: 0.6,
		optionAllocations: {
			"option-1": 0.8,
			"option-2": 0.2,
		},
	},
	"uuid-2": {
		electionId: "uuid-2",
		distribution: 0.3,
		optionAllocations: {
			"option-3": 0.5,
			"option-4": 0.5,
		},
	},
};

// Stores
export const elections: Writable<Record<ElectionId, Election>> = writable(
	dummyElections
);
export const userVotes: Writable<Record<ElectionId, UserVote>> = writable(
	dummyUserVotes
);
export const userId: Writable<UserId | null> = writable(null);
export const filters: Writable<{
	sortBy: "newest" | "oldest" | "mostVotes" | "deadline";
	tags: string[];
	search: string;
	type: "binary" | "pick-n" | "number" | "all";
}> = writable({
	sortBy: "newest",
	tags: [],
	search: "",
	type: "all",
});
export const reservedAntiVote: Writable<number> = writable(0.05);