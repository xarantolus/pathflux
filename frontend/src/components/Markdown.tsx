import React from 'react';
import DOMPurify from 'dompurify';
import {marked} from 'marked';

interface MarkdownProps extends React.HTMLAttributes<HTMLDivElement> {
	content: string;
}
const sanitize = (content: string, markdown: boolean = true) => {
	if (markdown && isMarkdown(content)) {
		content = marked(content, {
			gfm: true,
		}) as string;
	}

	return DOMPurify.sanitize(content, {
		ALLOWED_TAGS: ['mark', 'p', 'strong', 'em', 'ul', 'li', 'code', 'pre', 'blockquote', 'h1', 'h2', 'h3']
	})
	// fix <mark> tags getting escaped in code blocks
	.replace(/&lt;(\/?)mark&gt;/g, '<$1mark>')
	// Makes some weirdly rendered lists ok again
	.replace(/<li>\s*<p>/g, '<li>')
	.replace(/<\/p>\s*<\/li>/g, '</li>')
	// Remove lines that contain only whitespace
	.replace(/^\s*[\r\n]+/gm, '\n')
	// Place <br> elements instead of newlines, except when the elemnt is already a block element
	.replace(/(?<!<\/(?:p|li|blockquote|h1|h2|h3)>)\n+(?!<\/?(?:p|li|blockquote|h1|h2|h3)>)/g, '<br>')
}

const isMarkdown = (content: string) => {
	// Simple check for markdown content
	return /[*_~`]/.test(content);
}

const Markdown: React.FC<MarkdownProps> = ({ content, className, ...props }) => {
	const sanitizedContent = sanitize(content);

	return (
		<div
			dangerouslySetInnerHTML={{ __html: sanitizedContent }}
			className={`overflow-auto break-words ${className || ''}`}
			{...props}
		/>
	);
};

export default Markdown;
