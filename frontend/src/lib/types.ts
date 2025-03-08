
export interface Label {
	id: number;
	name: string;
	color: string;
	description: string;
	description_html: string;
	text_color: string;
}

export interface User {
	id: number;
	username: string;
	name: string;
	state: string;
	avatar_url: string;
	web_url: string;
}

// Merges attributes from issues, epics and merge requests
export interface GitLabItem {
	id: string;
	group_id: number;
	kind: string;
	web_url: string;
	slug: string;
	labels: Label[];
	title: string;
	description: string;
	involved_users: User[];
	iid: number;
	state: string;
	created_at: string;
	updated_at: string;
	closed_at: string | null;
}
