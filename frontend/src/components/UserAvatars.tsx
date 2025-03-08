import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

interface User {
	id: string | number;
	name?: string;
	username?: string;
	avatar_url?: string;
}

interface UserAvatarsProps {
	users: User[];
	maxDisplayed?: number;
	size?: 'sm' | 'md' | 'lg';
}

const UserAvatars: React.FC<UserAvatarsProps> = ({
	users,
	maxDisplayed = 5,
	size = 'md'
}) => {
	maxDisplayed = Math.max(1, maxDisplayed-1);
	if (!users || users.length === 0) return null;

	const avatarSizeClass = {
		sm: 'h-5 w-5',
		md: 'h-6 w-6',
		lg: 'h-8 w-8'
	}[size];

	const textSizeClass = {
		sm: 'text-[10px]',
		md: 'text-xs',
		lg: 'text-sm'
	}[size];

	const userShortName = (user: User) => {
		let split = (user.name || user.username || "").split(' ');

		return split.length > 1 ? `${split[0].charAt(0)}${split[split.length - 1].charAt(0)}` : split[0].charAt(0);
	}

	// Determine how many avatars to display
	const remainingCount = users.length - maxDisplayed;
	// If there's just 1 extra user, show them instead of "+1"
	const displayCount = remainingCount === 1 ? maxDisplayed + 1 : maxDisplayed;
	// Only show the +N indicator if there are at least 2 users remaining
	const showRemainingIndicator = remainingCount > 1;

	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<div className="flex -space-x-2">
						{users.slice(0, displayCount).map(user => (
							<Avatar key={user.id} className={`${avatarSizeClass} border border-border`}>
								<AvatarImage
									src={user.avatar_url}
									alt={user.name || user.username || "User"}
								/>
								<AvatarFallback className={textSizeClass}>
									{userShortName(user) || "U"}
								</AvatarFallback>
							</Avatar>
						))}
						{showRemainingIndicator && (
							<Avatar className={`${avatarSizeClass} border border-border bg-muted`}>
								<AvatarFallback className={`${textSizeClass} bg-muted`}>
									+{users.length - displayCount}
								</AvatarFallback>
							</Avatar>
						)}
					</div>
				</TooltipTrigger>
				<TooltipContent>
					{users.map(user => user.name || user.username).join(', ')}
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
};

export default UserAvatars;
