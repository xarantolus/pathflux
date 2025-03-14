import { Suspense, lazy } from "react"

// Lazy load the editor and its dependencies
const RichTextEditorBundle = lazy(() =>
	Promise.all([
		import('reactjs-tiptap-editor'),
		import('reactjs-tiptap-editor/extension-bundle')
	]).then(([richTextEditor, extensionBundle]) => {
		const RichTextEditor = richTextEditor.default;
		const { BaseKit, Bold, BulletList, Heading, Italic, History, HorizontalRule, CodeBlock, Code } = extensionBundle;
		return {
			default: (props: any) => {
				const extensions = [
					BaseKit.configure({
						placeholder: {
							placeholder: 'Type something...',
						},
						trailingNode: false,
						dropcursor: false,
						bubble: false,
						characterCount: false,
						focus: false,
						gapcursor: false,
						selection: false,
						textBubble: false,
					}),
					Heading,
					Bold,
					Italic,
					BulletList,
					History,
					HorizontalRule,
					Code,
					CodeBlock.configure({
						defaultTheme: 'aurora-x',
						languages: [
							"rust",
							"cpp",
							"python",
							"json",
							"bash",
						],
					}),
				];

				return <RichTextEditor {...props} extensions={extensions} />;
			}
		};
	})
);

// Define comprehensive props interface that matches the underlying editor
interface RichTextEditorProps {
	content: string;
	onChangeContent: (content: string) => void;
	disabled?: boolean;
	className?: string;
	style?: React.CSSProperties;
	placeholder?: string;
	autoFocus?: boolean;
	readOnly?: boolean;
	[key: string]: any; // Allow any additional props
}

export const LazyRichTextEditor = ({
	content,
	onChangeContent,
	disabled,
	className,
	style,
	placeholder,
	...rest
}: RichTextEditorProps) => {
	return (
		<div className="flex flex-col h-full w-full">
			<Suspense fallback={
				<div className="flex items-center justify-center h-full w-full">
					<div className="animate-pulse">Loading editor...</div>
				</div>
			}>
				<RichTextEditorBundle
					output='html'
					content={content}
					onChangeContent={onChangeContent}
					disabled={disabled}
					className={className}
					style={{
						height: '100%',
						maxHeight: '100%',
						...style
					}}
					placeholder={placeholder || 'Type something...'}
					{...rest}
				/>
			</Suspense>
		</div>
	);
};

export default LazyRichTextEditor;
