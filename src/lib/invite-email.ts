import emailjs from "@emailjs/browser";

/* EmailJS rather than a server-side mailer: the app is a static SPA on
   GitHub Pages with no backend to keep a secret in. Its public key is
   designed to ship in the bundle; restrict the allowed origins in the
   EmailJS dashboard, since anyone who reads the bundle can use it. */
const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID as
	| string
	| undefined;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID as
	| string
	| undefined;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY as
	| string
	| undefined;

export type InviteEmail = {
	toEmail: string;
	invitedByName: string;
	appUrl: string;
};

export function isInviteEmailConfigured(): boolean {
	return Boolean(SERVICE_ID && TEMPLATE_ID && PUBLIC_KEY);
}

export function inviteAppUrl(): string {
	return `${window.location.origin}${import.meta.env.BASE_URL}`;
}

export async function sendInviteEmail(invite: InviteEmail): Promise<void> {
	if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
		throw new Error("EmailJS is not configured");
	}
	await emailjs.send(
		SERVICE_ID,
		TEMPLATE_ID,
		{
			to_email: invite.toEmail,
			invited_by: invite.invitedByName,
			app_url: invite.appUrl,
		},
		{ publicKey: PUBLIC_KEY }
	);
}
