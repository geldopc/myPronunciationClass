import { createFileRoute, Link } from "@tanstack/react-router";
import { Pencil, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { TopBar } from "@/components/TopBar";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	type AdminRecord,
	fetchAdmins,
	inviteAdmin,
	revokeAdmin,
} from "@/lib/admin";
import { fetchLessons, fetchPhrases, type Lesson } from "@/lib/lessons";
import { useAuth } from "@/providers/Auth";

export const Route = createFileRoute("/admin/")({ component: AdminDashboard });

type LessonRow = Lesson & { phraseCount: number };

function AdminDashboard() {
	const { user } = useAuth();
	const [lessons, setLessons] = useState<LessonRow[]>([]);
	const [admins, setAdmins] = useState<AdminRecord[]>([]);
	const [loading, setLoading] = useState(true);
	const [inviteEmail, setInviteEmail] = useState("");
	const [inviting, setInviting] = useState(false);
	const [inviteMsg, setInviteMsg] = useState<string | null>(null);

	async function load() {
		setLoading(true);
		try {
			const [rawLessons, rawAdmins] = await Promise.all([
				fetchLessons(),
				fetchAdmins(),
			]);
			const rows = await Promise.all(
				rawLessons.map(async (l) => {
					const phrases = await fetchPhrases(l.id);
					return { ...l, phraseCount: phrases.length };
				})
			);
			setLessons(rows);
			setAdmins(rawAdmins);
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
			await inviteAdmin(inviteEmail.trim(), user.uid);
			setInviteMsg(
				"Invite saved. They'll be promoted when they log in with that Google account."
			);
			setInviteEmail("");
			await load();
		} catch {
			setInviteMsg("Failed to send invite.");
		} finally {
			setInviting(false);
		}
	}

	async function handleRevoke(email: string) {
		if (!window.confirm(`Revoke admin access for ${email}?`)) return;
		await revokeAdmin(email);
		await load();
	}

	return (
		<>
			<TopBar />
			<main
				id="admin-dashboard"
				className="container mx-auto max-w-4xl space-y-10 px-4 py-8"
			>
				<h1 className="text-2xl font-semibold">Admin</h1>

				{/* Lessons panel */}
				<section className="space-y-4">
					<div className="flex items-center justify-between">
						<h2 className="text-lg font-medium">Lessons</h2>
						<Button asChild size="sm">
							<Link to="/admin/lessons/new">New lesson</Link>
						</Button>
					</div>

					{loading ? (
						<p className="text-sm text-muted-foreground">Loading…</p>
					) : lessons.length === 0 ? (
						<p className="text-sm text-muted-foreground">No lessons yet.</p>
					) : (
						<div className="overflow-x-auto rounded-lg border border-border">
							<table className="w-full text-sm">
								<thead>
									<tr className="border-b border-border bg-muted/40">
										<th className="px-4 py-2 text-left font-medium">Lesson</th>
										<th className="px-4 py-2 text-center font-medium">
											Phrases
										</th>
										<th className="px-4 py-2" />
									</tr>
								</thead>
								<tbody>
									{lessons.map((lesson) => (
										<tr
											key={lesson.id}
											className="border-b border-border last:border-0 hover:bg-muted/20"
										>
											<td className="flex items-center gap-3 px-4 py-3">
												{lesson.thumbnailUrl && (
													<img
														src={lesson.thumbnailUrl}
														alt={lesson.title}
														className="h-10 w-16 rounded object-cover"
													/>
												)}
												<span className="font-medium">{lesson.title}</span>
											</td>
											<td className="px-4 py-3 text-center text-muted-foreground">
												{lesson.phraseCount}
											</td>
											<td className="px-4 py-3 text-right">
												<Button asChild size="sm" variant="ghost">
													<Link
														to="/admin/lessons/$lessonId"
														params={{ lessonId: lesson.id }}
													>
														<Pencil />
														Edit clips
													</Link>
												</Button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</section>

				{/* Team panel */}
				<section className="space-y-4">
					<h2 className="text-lg font-medium">Team</h2>

					{!loading && admins.length > 0 && (
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
									{admins.map((admin) => (
										<tr
											key={admin.email}
											className="border-b border-border last:border-0 hover:bg-muted/20"
										>
											<td className="px-4 py-3">{admin.email}</td>
											<td className="px-4 py-3">
												<Badge
													variant={
														admin.status === "active" ? "default" : "outline"
													}
												>
													{admin.status}
												</Badge>
											</td>
											<td className="px-4 py-3 text-muted-foreground">
												{admin.invitedBy}
											</td>
											<td className="px-4 py-3 text-right">
												<Button
													size="sm"
													variant="ghost"
													disabled={admin.email === user?.email}
													onClick={() => handleRevoke(admin.email)}
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
							<Label htmlFor="invite-email">Invite admin</Label>
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
							{inviting ? "Sending…" : "Send invite"}
						</Button>
						{inviteMsg && (
							<p className="text-xs text-muted-foreground">{inviteMsg}</p>
						)}
					</form>
				</section>
			</main>
		</>
	);
}
