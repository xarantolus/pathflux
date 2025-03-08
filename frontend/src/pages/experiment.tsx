import { useState, useEffect, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { Progress } from '@/components/ui/progress';
import Markdown from '@/components/markdown';

// Define the structure of a search result item based on the example
interface SearchItem {
	id: string;
	group_id: number;
	kind: string;
	web_url: string;
	slug: string;
	labels: string[] | null;
	title: string;
	description: string;
	involved_users: {
		id: number;
		username: string;
		name: string;
		state: string;
		avatar_url: string;
		web_url: string;
	}[];
	iid: number;
	state: string;
	created_at: string;
	updated_at: string;
	closed_at: string | null;
}

export default function Experiment() {
	const [query, setQuery] = useState('');
	const [results, setResults] = useState<SearchItem[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState('');
	const abortControllerRef = useRef<AbortController | null>(null);

	const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

	// Add a toggle function for expansion
	const toggleExpand = (id: string, e: React.MouseEvent) => {
		e.preventDefault(); // Prevent the link from opening
		e.stopPropagation(); // Prevent event bubbling
		setExpandedItems(prev => ({
			...prev,
			[id]: !prev[id]
		}));
	};

	// Fetch search results using AbortController
	const fetchSearchResults = async (searchQuery: string) => {
		if (!searchQuery.trim()) {
			setResults([]);
			setIsLoading(false); // Still turn off loading for empty queries
			return;
		}

		// Cancel any ongoing requests without changing loading state
		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
		}

		// Create a new AbortController for this request
		const abortController = new AbortController();
		abortControllerRef.current = abortController;

		try {
			// Only set loading to true if it's not already true
			if (!isLoading) {
				setIsLoading(true);
			}
			setError('');

			const response = await fetch(
				`/api/v1/items/search?q=${encodeURIComponent(searchQuery)}`,
				{ signal: abortController.signal }
			);

			if (!response.ok) {
				throw new Error('Failed to fetch search results');
			}

			const data = await response.json();
			setResults(data);
		} catch (err) {
			// Don't set error if the request was aborted
			if (!(err instanceof DOMException && err.name === 'AbortError')) {
				setError('An error occurred while searching');
				console.error(err);
			} else {
				// Don't modify loading state for aborted requests
				return;
			}
		} finally {
			// Only set loading to false if this is the current controller and not an aborted request
			if (
				abortControllerRef.current === abortController &&
				!(abortControllerRef.current?.signal.aborted)
			) {
				setIsLoading(false);
				abortControllerRef.current = null;
			}
		}
	};

	// Immediately fetch results when query changes
	useEffect(() => {
		if (query) {
			fetchSearchResults(query);
		} else {
			setResults([]);
		}

		// Cleanup function to abort any pending requests when component unmounts
		return () => {
			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
			}
		};
	}, [query]);

	// Get icon based on item kind
	const getKindIcon = (kind: string) => {
		switch (kind) {
			case 'issue':
				return '🐛';
			case 'merge_request':
				return '🔄';
			case 'epic':
				return '📌';
			default:
				return '📄';
		}
	};

	return (
		<div className="w-full h-screen flex flex-col items-center p-6">
			<div className="w-full max-w-2xl">
				<h1 className="text-2xl font-bold mb-6 text-center">PathFlux Search</h1>

				{/* Search input */}
				<div className="relative flex items-center w-full">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Search items..."
						className="pl-10 w-full"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
					/>
					{isLoading && (
						<div className="absolute right-3 top-1/2 -translate-y-1/2">
							<div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
						</div>
					)}
				</div>

				{/* Error state */}
				{error && (
					<div className="text-destructive mt-4 text-center">
						{error}
					</div>
				)}

				{/* Results */}
				{results.length > 0 && (
					<Card className="mt-4">
						<CardContent className="p-0">
							<ul className="divide-y">
								{results.map((item) => (
									<li key={item.id} className="hover:bg-accent/50 transition-colors">
										<div className="relative">
											<a
												href={item.web_url}
												target="_blank"
												rel="noopener noreferrer"
												className="flex items-center justify-between p-4 w-full"
											>
												<div className="flex items-center gap-2 flex-grow overflow-hidden">
													<span className="flex-shrink-0">{getKindIcon(item.kind)}</span>
													<span className="font-medium truncate">{item.title}</span>
													<span className="text-xs text-muted-foreground flex-shrink-0">{item.slug}</span>
												</div>
												<div className="flex items-center">
													{item.description && (
														<button
															onClick={(e) => toggleExpand(item.id, e)}
															className="p-1 rounded-full hover:bg-muted mr-2"
															aria-label={expandedItems[item.id] ? "Collapse description" : "Expand description"}
														>
															{expandedItems[item.id] ? (
																<ChevronUp className="h-4 w-4 text-muted-foreground" />
															) : (
																<ChevronDown className="h-4 w-4 text-muted-foreground" />
															)}
														</button>
													)}
													<ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
												</div>
											</a>

											{/* Expandable description */}
											{expandedItems[item.id] && item.description && (
												<div className="px-4 pb-4 pt-0">
													<Markdown content={item.description}  className="bg-muted/30 p-3 rounded-md text-sm text-foreground/80 whitespace-pre-line" />
												</div>
											)}
										</div>
									</li>
								))}
							</ul>
						</CardContent>
					</Card>
				)}

				{/* No results state */}
				{!isLoading && query && results.length === 0 && (
					<div className="text-center mt-4 text-muted-foreground">
						No results found
					</div>
				)}
			</div>
		</div>
	);
}
