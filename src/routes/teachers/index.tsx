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
	fetchTeachers,
	inviteTeacher,
	revokeTeacher,
	type TeacherRecord,
} from "@/lib/teacher";
import { useAuth } from "@/providers/Auth";

export const Route = createFileRoute("/teachers/")({
	component: TeachersDashboard,
});

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

	async function handleInvite(e: React.FormEvent) {
		e.preventDefault();
		if (!inviteEmail.trim() || !user) return;
		setInviting(true);
		setInviteMsg(null);
		try {
			await inviteTeacher(inviteEmail.trim(), user.uid);
			setInviteMsg(
				"Invite created. No email is sent — tell them yourself. They become a teacher when they sign in with that Google account, and this list will show them as active."
			);
			setInviteEmail("");
			await load();
		} catch {
			setInviteMsg("Failed to create invite.");
		} finally {
			setInviting(false);
		}
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
							{inviting ? "Creating…" : "Create invite"}
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
