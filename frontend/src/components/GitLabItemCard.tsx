import { GitLabItem } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Bug, GitMerge, Bookmark, CircleDot, FileText, ChevronUp, ChevronDown, ExternalLink } from 'lucide-react';
import React from 'react';
import Markdown from './Markdown';
import { Button } from './ui/button';
import UserAvatars from './UserAvatars';
import Labels from './Labels';

interface GitLabItemCardProps extends React.HTMLAttributes<HTMLDivElement> {
	item: GitLabItem;
	expanded: boolean;
	setExpanded: (value: boolean) => void;
}

const GitLabItemCard: React.FC<GitLabItemCardProps> = ({ item,
	expanded,
	setExpanded,
	...props
}) => {
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
		<div className="relative" {...props}>
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
						<Labels labels={item.labels} className="mt-1" />
					)}
				</div>

				{/* Involved users */}
				{item.involved_users && item.involved_users.length > 0 && (
					<div className="ml-2">
						<UserAvatars users={item.involved_users} maxDisplayed={3} size="md" />
					</div>
				)}

				<div className="flex items-center ml-2">
					{/* Expand button */}
					<Button
						variant="ghost"
						size="icon"
						onClick={(e) => { e.preventDefault(); item.description ? setExpanded(!expanded) : null }}
						className={cn(item.description ? '' : 'invisible', 'h-8 w-8 flex-shrink-0')}
						aria-label={expanded ? "Collapse description" : "Expand description"}
						tabIndex={item.description ? 0 : -1}
					>
						{expanded ? (
							<ChevronUp className="h-4 w-4" />
						) : (
							<ChevronDown className="h-4 w-4" />
						)}
					</Button>
					<ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
				</div>
			</a>

			{/* Expandable description */}
			{expanded && item.description && (
				<div className="px-4 pb-4 pt-0">
					<Markdown
						content={item.description}
						className="prose dark:prose-invert max-w-none prose-sm text-foreground/80"
					/>
				</div>
			)}
		</div>
	);
};

export default GitLabItemCard;
