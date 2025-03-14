import { Button } from "@/components/ui/button"
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import { useState } from "react"
import LazyRichTextEditor from "./TextEditor"
import { Loader2 } from "lucide-react" // Import Loader icon
import { cn } from "@/lib/utils" // Make sure you have this utility

export interface DialogDemoProps {
	content: string
}

export const TextEditDialog = ({
	content,
	error,
	open = false,
	isLoading = false,
	onSave,
}: {
	content: string,
	error?: string,
	open?: boolean,
	isLoading?: boolean,
	onSave?: (content: string) => void,
}) => {
	const [value, setValue] = useState<string | undefined>(("<p>" + content + "</p>\n").repeat(50));

	const handleSave = () => {
		if (onSave && value) {
			onSave(value);
		}
	};

	return (
		<Dialog open={open} modal>
			<DialogContent className="w-full max-w-[95vw] sm:max-w-[90vw] md:max-w-[80vw] lg:max-w-[80vw]">
				<DialogHeader className="shrink-0">
					<DialogTitle>Edit Text</DialogTitle>
				</DialogHeader>

				<div className="relative max-h-[80vh] flex-1 min-h-0 border border-input rounded-md overflow-hidden">
					<LazyRichTextEditor
						content={value ?? ''}
						onChangeContent={setValue}
						disabled={isLoading}
					/>
				</div>

				<DialogFooter className="shrink-0 flex justify-between items-center mt-4">
					{/* Error display on the left */}
					<div className="text-sm text-destructive">
						{error && <p className="m-0">{error}</p>}
					</div>

					{/* Save button with loading state */}
					<Button
						onClick={handleSave}
						disabled={isLoading}
						className={cn(isLoading && "opacity-80")}
					>
						{isLoading ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Saving...
							</>
						) : "Save changes"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
