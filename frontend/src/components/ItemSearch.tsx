import { useState, useEffect, useRef } from 'react';
import { GitLabItem } from '@/lib/types';
import GitLabItemCard from '@/components/GitLabItemCard';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Search } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';

export default function ItemSearch({
	initialQuery = '',
	initialState = 'all',
	initialSortOrder = 'relevance'
}) {
	const [query, setQuery] = useState(initialQuery);
	const [itemState, setItemState] = useState(initialState);
	const [sortOrder, setSortOrder] = useState(initialSortOrder);

	const [results, setResults] = useState<GitLabItem[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState('');
	const abortControllerRef = useRef<AbortController | null>(null);

	const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

	// Add a toggle function for expansion
	const toggleExpand = (id: string, v: boolean | unknown) => {
		setExpandedItems(prev => ({
			...prev,
			[id]: typeof v === 'boolean' ? v : !prev[id]
		}));
	};

	// Fetch search results using AbortController
	const fetchSearchResults = async (searchQuery: string, state: string, sortOrder: string) => {
		if (!searchQuery.trim() && state === 'all' && sortOrder === 'relevance') {
			console.log('Empty query, no need to fetch');
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
				`/api/v1/items/search?q=${encodeURIComponent(searchQuery)}&state=${state}&sort=${sortOrder}`,
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
		fetchSearchResults(query, itemState, sortOrder);

		// Cleanup function to abort any pending requests when component unmounts
		return () => {
			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
			}
		};
	}, [query, itemState, sortOrder]);

	// When loading the page, fetch empty query with newest items
	useEffect(() => {
		if (!query.trim()) {
			fetchSearchResults(query, 'opened', 'newest');
		}
	}, []);

	return (
		<div className="w-full h-screen flex flex-col items-center p-6">
			<div className="w-full">
				<h1 className="text-2xl font-bold mb-6 text-center">PathFlux Search</h1>

				{/* Search input */}
				<div className="relative flex items-center w-full">
					<div className="relative flex-grow">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
						<Input
							autoFocus
							placeholder="Search items..."
							className="pl-10 w-full pr-8"
							value={query}
							onChange={(e) => setQuery(e.target.value)}
						/>
						{isLoading && (
							<div className="absolute right-3 top-1/2 -translate-y-1/2">
								<div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
							</div>
						)}
					</div>

					<Select value={sortOrder} onValueChange={setSortOrder}>
						<SelectTrigger className="w-[140px] flex-shrink-0">
							<SelectValue placeholder="Relevance" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="relevance">Relevance</SelectItem>
							<SelectItem value="newest">Newest</SelectItem>
						</SelectContent>
					</Select>

					<Select
						value={itemState}
						onValueChange={setItemState}
					>
						<SelectTrigger className="w-[140px] flex-shrink-0">
							<SelectValue placeholder="All states" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">
								<div className="flex items-center">
									<div className="h-2 w-2 rounded-full bg-[#8c8c8c] mr-2"></div>
									All states
								</div>
							</SelectItem>
							<SelectItem value="opened">
								<div className="flex items-center">
									<div className="h-2 w-2 rounded-full bg-[#1aaa55] mr-2"></div>
									Open
								</div>
							</SelectItem>
							<SelectItem value="closed">
								<div className="flex items-center">
									<div className="h-2 w-2 rounded-full bg-[#db3b21] mr-2"></div>
									Closed
								</div>
							</SelectItem>
							<SelectItem value="merged">
								<div className="flex items-center">
									<div className="h-2 w-2 rounded-full bg-[#6e49cb] mr-2"></div>
									Merged
								</div>
							</SelectItem>
						</SelectContent>
					</Select>
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
							<ul>
								{results.map((item) => (
									(
										<li key={item.id} className="hover:bg-accent/50 transition-colors">
											<GitLabItemCard
												item={item}
												expanded={expandedItems[item.id]}
												setExpanded={(v) => toggleExpand(item.id, v)} />
											{results.indexOf(item) !== results.length - 1 && <Separator key={'sep'+item.id} />}
										</li>
									)
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
