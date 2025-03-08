import React from 'react';
import DOMPurify from 'dompurify';
import {marked} from 'marked';

interface MarkdownProps extends React.HTMLAttributes<HTMLDivElement> {
	content: string;
}
const sanitize = (content: string) => {
	content = marked(content, {
		gfm: true,
	}) as string;

	return DOMPurify.sanitize(content, {
		ALLOWED_TAGS: [
			'mark', 'p', 'strong', 'em', 'ul', 'li', 'code', 'pre', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
			// tables etc.
			'table', 'thead', 'tbody', 'tr', 'th', 'td', "input", "br"
		],
	})
	// fix <mark> tags getting escaped in code blocks
	.replace(/&lt;(\/?)mark&gt;/g, '<$1mark>')
	// Makes some weirdly rendered lists ok again
	.replace(/<li>\s*<p>/g, '<li>')
	.replace(/<\/p>\s*<\/li>/g, '</li>')
	// Remove lines that contain only whitespace
	.replace(/^\s*[\r\n]+/gm, '\n')
	// delete repeated <br>
	.replace(/(<br>)+/g, '<br>')
}

const Markdown: React.FC<MarkdownProps> = ({ content, className, ...props }) => {
	const sanitizedContent = sanitize(content);

	return (
		<div
			dangerouslySetInnerHTML={{ __html: sanitizedContent }}
			className={`markdown overflow-auto break-words ${className || ''}`}
			{...props}
		/>
	);
};

export default Markdown;
