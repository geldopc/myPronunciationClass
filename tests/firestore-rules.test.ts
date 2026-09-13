import { readFileSync } from "node:fs";
import {
	assertFails,
	assertSucceeds,
	initializeTestEnvironment,
	type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { deleteDoc, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { afterAll, beforeAll, describe, it } from "vitest";

let env: RulesTestEnvironment;

const describeRules = process.env.FIRESTORE_EMULATOR_HOST
	? describe
	: describe.skip;

describeRules("firestore rules", () => {
	beforeAll(async () => {
		env = await initializeTestEnvironment({
			projectId: "demo-mpc",
			firestore: {
				rules: readFileSync("firestore.rules", "utf8"),
				host: "127.0.0.1",
				port: 8080,
			},
		});
	});

	afterAll(async () => {
		await env.cleanup();
	});

	it("lets a user read/write their own doc but not another's", async () => {
		const ada = env.authenticatedContext("ada").firestore();
		await assertSucceeds(setDoc(doc(ada, "users/ada"), { displayName: "Ada" }));
		await assertFails(getDoc(doc(ada, "users/bob")));
	});

	it("allows public read of shares but forbids forging another uid", async () => {
		const ada = env.authenticatedContext("ada").firestore();
		const anon = env.unauthenticatedContext().firestore();
		await assertSucceeds(
			setDoc(doc(ada, "shares/s1"), { uid: "ada", snapshot: {} }),
		);
		await assertSucceeds(getDoc(doc(anon, "shares/s1")));
		await assertFails(
			setDoc(doc(ada, "shares/s2"), { uid: "bob", snapshot: {} }),
		);
	});

	it("lets an invited teacher read their own pending invite", async () => {
		await env.withSecurityRulesDisabled(async (ctx) => {
			await setDoc(doc(ctx.firestore(), "admins/invited@example.com"), {
				status: "invited",
				invitedBy: "system",
				invitedAt: 1,
				activatedAt: null,
			});
		});
		const invitee = env
			.authenticatedContext("invitee-uid", { email: "invited@example.com" })
			.firestore();
		await assertSucceeds(getDoc(doc(invitee, "admins/invited@example.com")));
	});

	it("lets an invited teacher accept the invite by activating it", async () => {
		await env.withSecurityRulesDisabled(async (ctx) => {
			await setDoc(doc(ctx.firestore(), "admins/accept@example.com"), {
				status: "invited",
				invitedBy: "system",
				invitedAt: 1,
				activatedAt: null,
			});
		});
		const invitee = env
			.authenticatedContext("accept-uid", { email: "accept@example.com" })
			.firestore();
		await assertSucceeds(
			updateDoc(doc(invitee, "admins/accept@example.com"), {
				status: "active",
				activatedAt: 2,
			})
		);
	});

	it("forbids a stranger from activating someone else's invite", async () => {
		await env.withSecurityRulesDisabled(async (ctx) => {
			await setDoc(doc(ctx.firestore(), "admins/victim@example.com"), {
				status: "invited",
				invitedBy: "system",
				invitedAt: 1,
				activatedAt: null,
			});
		});
		const attacker = env
			.authenticatedContext("attacker-uid", { email: "attacker@example.com" })
			.firestore();
		await assertFails(
			updateDoc(doc(attacker, "admins/victim@example.com"), {
				status: "active",
				activatedAt: 2,
			})
		);
	});

	it("forbids reading someone else's teacher record", async () => {
		await env.withSecurityRulesDisabled(async (ctx) => {
			await setDoc(doc(ctx.firestore(), "admins/other@example.com"), {
				status: "active",
				invitedBy: "system",
				invitedAt: 1,
				activatedAt: 2,
			});
		});
		const stranger = env
			.authenticatedContext("stranger-uid", { email: "stranger@example.com" })
			.firestore();
		await assertFails(getDoc(doc(stranger, "admins/other@example.com")));
	});

	it("lets the owner delete their own share but forbids a non-owner", async () => {
		const ada = env.authenticatedContext("ada").firestore();
		const bob = env.authenticatedContext("bob").firestore();

		await assertSucceeds(
			setDoc(doc(ada, "shares/s3"), { uid: "ada", snapshot: {} }),
		);
		await assertFails(deleteDoc(doc(bob, "shares/s3")));
		await assertSucceeds(deleteDoc(doc(ada, "shares/s3")));
	});
});
