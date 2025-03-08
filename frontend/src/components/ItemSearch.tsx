import { useState, useEffect, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, ExternalLink, ChevronDown, ChevronUp, Bug, GitMerge, Bookmark, CircleDot, FileText } from "lucide-react";
import Markdown from '@/components/Markdown';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from './ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';

// Define the structure of a search result item based on the example
interface SearchItem {
	id: string;
	group_id: number;
	kind: string;
	web_url: string;
	slug: string;
	labels: {
		id: number;
		name: string;
		color: string;
		description: string;
		description_html: string;
		text_color: string;
	}[];
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

export default function ItemSearch({
	initialQuery = '',
	initialState = 'all',
	initialSortOrder = 'newest'
}) {
	const [query, setQuery] = useState(initialQuery);
	const [itemState, setItemState] = useState(initialState);
	const [sortOrder, setSortOrder] = useState(initialSortOrder);

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
	const fetchSearchResults = async (searchQuery: string, state: string) => {
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
		fetchSearchResults(query, itemState);

		// Cleanup function to abort any pending requests when component unmounts
		return () => {
			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
			}
		};
	}, [query, itemState, sortOrder]);

	// Get icon based on item kind
	const getKindIcon = (kind: string, state: string) => {
		let color = '#8c8c8c';  // Default light gray
		switch (state) {
			case 'opened':
				color = '#1aaa55';  // GitLab green for open items
				break;
			case 'closed':
				if (kind === 'merge_request') {
					color = '#db3b21';  // GitLab red for closed MRs
				} else {
					color = '#1f78d1';  // GitLab blue for closed issues
				}
				break;
			case 'merged':
				color = '#6e49cb';  // GitLab purple for merged
				break;
			default:
				color = '#8c8c8c';  // Light gray for default state
				break;
		}

		let getIcon = () => {
		switch (kind) {
			case 'issue':
				return <Bug className="h-6 w-6" color={color} />
			case 'merge_request':
				return <GitMerge className="h-6 w-6" color={color} />;
			case 'epic':
				return <Bookmark className="h-6 w-6" color={color} />;
			case 'note':
				return <CircleDot className="h-6 w-6" color={color} />;
			default:
				return <FileText className="h-6 w-6" color={color} />;
		}
	}

		return (
			<TooltipProvider>
				<Tooltip delayDuration={300}>
					<TooltipTrigger>
						{getIcon()}
					</TooltipTrigger>
					<TooltipContent side="top" align="center" className="px-3 py-1.5 text-xs font-medium">
						{kind} - {state}
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		);
	};

	return (
		<div className="w-full h-screen flex flex-col items-center p-6">
			<div className="w-full">
				<h1 className="text-2xl font-bold mb-6 text-center">PathFlux Search</h1>

				{/* Search input */}
				<div className="relative flex items-center w-full">
					<div className="relative flex-grow">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
						<Input
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
									<li key={item.id} className="hover:bg-accent/50 transition-colors">
										<div className="relative">
											<a
												href={item.web_url}
												target="_blank"
												rel="noopener noreferrer"
												className="flex items-center justify-between p-2 w-full"
											>
												<span className="pr-2">{getKindIcon(item.kind, item.state)}</span>
												<div className="flex flex-col w-full overflow-hidden">
													{/* Title row with ID and timestamp */}
													<div className="flex items-start justify-between gap-2">
														<span className="font-medium break-words">{item.title}</span>
													</div>

													{/* Metadata row */}
													<div className="flex flex-wrap items-center text-xs text-muted-foreground mt-1 gap-x-4">
														{/* Path */}
														<span className="truncate max-w-[200px]">{item.slug}</span>

														{/* Dates */}
														{item.updated_at !== item.created_at && (
															<span>
																Updated: {new Date(item.updated_at).toLocaleString()}
															</span>
														)}
													</div>

													{/* Labels */}
													{item.labels && item.labels.length > 0 && (
														<div className="flex flex-wrap gap-1 mt-1">
															{item.labels.map((label, i) => {
																// Check if label is an object or string
																const labelName = typeof label === 'string' ? label : label.name;
																const labelColor = typeof label === 'object' && label.color ? label.color : null;
																const textColor = typeof label === 'object' && label.text_color ? label.text_color : null;

																return (
																	<Badge
																		key={typeof label === 'object' && label.id ? label.id : i}
																		style={{
																			backgroundColor: labelColor ? `#${labelColor}` : undefined,
																			color: textColor ? `#${textColor}` : undefined
																		}}
																		variant="secondary"
																	>
																		{labelName}
																	</Badge>
																);
															})}
														</div>
													)}
												</div>

												{/* Involved users */}
												{item.involved_users && item.involved_users.length > 0 && (
													<TooltipProvider>
														<Tooltip>
															<TooltipTrigger asChild>
																<div className="flex -space-x-2 ml-2">
																	{item.involved_users.slice(0, 3).map(user => (
																		<Avatar key={user.id} className="h-6 w-6 border border-border">
																			<AvatarImage
																				src={user.avatar_url}
																				alt={user.name || user.username}
																			/>
																			<AvatarFallback className="text-xs">
																				{(user.name || user.username || "").charAt(0).toUpperCase()}
																			</AvatarFallback>
																		</Avatar>
																	))}
																	{item.involved_users.length > 3 && (
																		<Avatar className="h-6 w-6 border border-border bg-muted">
																			<AvatarFallback className="text-xs bg-muted">
																				+{item.involved_users.length - 3}
																			</AvatarFallback>
																		</Avatar>
																	)}
																</div>
															</TooltipTrigger>
															<TooltipContent>
																{item.involved_users.map(user => user.name || user.username).join(', ')}
															</TooltipContent>
														</Tooltip>
													</TooltipProvider>
												)}

												<div className="flex items-center ml-2">
													{/* Expand button */}
													<Button
														variant="ghost"
														size="icon"
														onClick={(e) => item.description ? toggleExpand(item.id, e) : null}
														className={cn(item.description ? '' : 'invisible', 'h-8 w-8 flex-shrink-0')}
														aria-label={expandedItems[item.id] ? "Collapse description" : "Expand description"}
														tabIndex={item.description ? 0 : -1}
													>
														{expandedItems[item.id] ? (
															<ChevronUp className="h-4 w-4" />
														) : (
															<ChevronDown className="h-4 w-4" />
														)}
													</Button>
													<ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
												</div>
											</a>

											{/* Expandable description */}
											{expandedItems[item.id] && item.description && (
												<div className="px-4 pb-4 pt-0">
															<Markdown
																content={item.description}
																className="prose dark:prose-invert max-w-none prose-sm text-foreground/80"
															/>
												</div>
											)}
										</div>
										{/* Add separator between items instead of using divide-y */}
										{results.indexOf(item) !== results.length - 1 && <Separator />}
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
