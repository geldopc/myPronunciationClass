import { createFileRoute } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { PageShell } from "@/components/PageShell";
import { TopBar } from "@/components/TopBar";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	inviteAppUrl,
	isInviteEmailConfigured,
	sendInviteEmail,
} from "@/lib/invite-email";
import {
	fetchTeachers,
	inviteTeacher,
	revokeTeacher,
	type TeacherRecord,
} from "@/lib/teacher";
import { useAuth } from "@/providers/Auth";

export const Route = createFileRoute("/teachers/")({
	component: TeachersDashboard,
});

/* The button must not promise delivery the build cannot perform. */
const INVITE_LABEL = isInviteEmailConfigured()
	? { idle: "Send invite", busy: "Sending…" }
	: { idle: "Create invite", busy: "Creating…" };

const SIGN_IN_NOTE =
	"They become a teacher when they sign in with that Google account, and this list will show them as active.";

async function announceInvite(
	email: string,
	invitedByName: string
): Promise<string> {
	if (!isInviteEmailConfigured()) {
		return `Invite created for ${email}. Email is not configured, so tell them yourself. ${SIGN_IN_NOTE}`;
	}
	try {
		await sendInviteEmail({
			toEmail: email,
			invitedByName,
			appUrl: inviteAppUrl(),
		});
		return `Invite created and emailed to ${email}. ${SIGN_IN_NOTE}`;
	} catch {
		return `Invite created for ${email}, but the email could not be sent — tell them yourself. ${SIGN_IN_NOTE}`;
	}
}

function TeachersDashboard() {
	const { user } = useAuth();
	const [teachers, setTeachers] = useState<TeacherRecord[]>([]);
	const [loading, setLoading] = useState(true);
	const [inviteEmail, setInviteEmail] = useState("");
	const [inviting, setInviting] = useState(false);
	const [inviteMsg, setInviteMsg] = useState<string | null>(null);

	async function load() {
		setLoading(true);
		try {
			setTeachers(await fetchTeachers());
		} finally {
			setLoading(false);
		}
	}

	// biome-ignore lint/correctness/useExhaustiveDependencies: load once on mount
	useEffect(() => {
		void load();
	}, []);

	/* The Firestore record is the invite; the email only announces it. A
	   delivery failure must not cost the teacher their access, so the two
	   are reported separately and the record is written first. */
	async function handleInvite(e: React.FormEvent) {
		e.preventDefault();
		const email = inviteEmail.trim();
		if (!email || !user) return;
		setInviting(true);
		setInviteMsg(null);

		try {
			await inviteTeacher(email, user.uid);
		} catch {
			setInviteMsg("Failed to create invite.");
			setInviting(false);
			return;
		}

		setInviteEmail("");
		await load();
		setInviteMsg(await announceInvite(email, user.displayName));
		setInviting(false);
	}

	async function handleRevoke(email: string) {
		if (!window.confirm(`Revoke teacher access for ${email}?`)) return;
		await revokeTeacher(email);
		await load();
	}

	return (
		<>
			<TopBar />
			<PageShell id="teachers-dashboard" className="space-y-10">
				<div className="space-y-1">
					<h1 className="text-page-title font-semibold">Teachers</h1>
					<p className="text-sm text-muted-foreground">
						Control who can create and edit lessons.
					</p>
				</div>

				{/* Team panel */}
				<section className="space-y-4">
					<h2 className="text-lg font-medium">Team</h2>

					{!loading && teachers.length > 0 && (
						<div className="overflow-x-auto rounded-lg border border-border">
							<table className="w-full text-sm">
								<thead>
									<tr className="border-b border-border bg-muted/40">
										<th className="px-4 py-2 text-left font-medium">Email</th>
										<th className="px-4 py-2 text-left font-medium">Status</th>
										<th className="px-4 py-2 text-left font-medium">
											Invited by
										</th>
										<th className="px-4 py-2" />
									</tr>
								</thead>
								<tbody>
									{teachers.map((teacher) => (
										<tr
											key={teacher.email}
											className="border-b border-border last:border-0 hover:bg-muted/20"
										>
											<td className="px-4 py-3">{teacher.email}</td>
											<td className="px-4 py-3">
												<Badge
													variant={
														teacher.status === "active" ? "default" : "outline"
													}
												>
													{teacher.status}
												</Badge>
											</td>
											<td className="px-4 py-3 text-muted-foreground">
												{teacher.invitedBy}
											</td>
											<td className="px-4 py-3 text-right">
												<Button
													size="sm"
													variant="ghost"
													disabled={teacher.email === user?.email}
													onClick={() => handleRevoke(teacher.email)}
												>
													<Trash2 />
													Revoke
												</Button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}

					{/* Invite form */}
					<form
						onSubmit={handleInvite}
						className="flex max-w-sm flex-col gap-3"
					>
						<div className="space-y-1">
							<Label htmlFor="invite-email">Invite teacher</Label>
							<Input
								id="invite-email"
								type="email"
								placeholder="colleague@example.com"
								value={inviteEmail}
								onChange={(e) => setInviteEmail(e.target.value)}
							/>
						</div>
						<Button
							type="submit"
							size="sm"
							disabled={inviting || !inviteEmail.trim()}
						>
							{inviting ? INVITE_LABEL.busy : INVITE_LABEL.idle}
						</Button>
						{inviteMsg && (
							<p className="text-xs text-muted-foreground">{inviteMsg}</p>
						)}
					</form>
				</section>
			</PageShell>
		</>
	);
}
