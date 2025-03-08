import { Badge } from '@/components/ui/badge';
import React from 'react';

interface Label {
	id?: string | number;
	name?: string;
	color?: string;
	text_color?: string;
}

interface LabelsProps {
	labels: (Label | string)[];
	className?: string;
}

const Labels: React.FC<LabelsProps> = ({ labels, className = '' }) => {
	if (!labels || labels.length === 0) return null;

	return (
		<div className={`flex flex-wrap gap-1 ${className}`}>
			{labels.map((label, i) => {
				// Check if label is an object or string
				const labelName = typeof label === 'string' ? label : label.name;
				const labelColor = typeof label === 'object' && label.color ? label.color : null;
				const textColor = typeof label === 'object' && label.text_color ? label.text_color : null;
				const labelId = typeof label === 'object' && label.id ? label.id : i;

				// Check if label contains :: and should be split
				if (labelName && labelName.includes('::')) {
					const [prefix, suffix] = labelName.split('::').map(part => part.trim());

					return (
						<div key={labelId} className="flex items-center gap-0.5">
							<Badge
								style={{
									backgroundColor: labelColor ? `#${labelColor}` : undefined,
									color: textColor ? `#${textColor}` : undefined,
									borderTopRightRadius: 0,
									borderBottomRightRadius: 0,
									opacity: 0.8
								}}
								variant="secondary"
								className="rounded-r-none"
							>
								{prefix}
							</Badge>
							<Badge
								style={{
									backgroundColor: labelColor ? `#${labelColor}` : undefined,
									color: textColor ? `#${textColor}` : undefined,
									borderTopLeftRadius: 0,
									borderBottomLeftRadius: 0
								}}
								variant="secondary"
								className="rounded-l-none"
							>
								{suffix}
							</Badge>
						</div>
					);
				}

				return (
					<Badge
						key={labelId}
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
	);
};

export default Labels;
