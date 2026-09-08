import { createFileRoute } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { SideNav } from "@/components/SideNav";

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
import { useAuth } from "@/providers/Auth";

export const Route = createFileRoute("/admin/")({ component: AdminDashboard });

function AdminDashboard() {
	const { user } = useAuth();
	const [admins, setAdmins] = useState<AdminRecord[]>([]);
	const [loading, setLoading] = useState(true);
	const [inviteEmail, setInviteEmail] = useState("");
	const [inviting, setInviting] = useState(false);
	const [inviteMsg, setInviteMsg] = useState<string | null>(null);

	async function load() {
		setLoading(true);
		try {
			setAdmins(await fetchAdmins());
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
		<div className="flex min-h-screen flex-col lg:flex-row">
			<SideNav />
			<main
				id="admin-dashboard"
				className="w-full min-w-0 max-w-4xl flex-1 space-y-10 px-4 py-8 sm:px-6 lg:px-8"
			>
				<div className="space-y-1">
					<h1 className="text-2xl font-semibold">Admin</h1>
					<p className="text-sm text-muted-foreground">
						Control who can add and edit clips.
					</p>
				</div>

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
		</div>
	);
}
