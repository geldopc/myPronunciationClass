import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as admin from "firebase-admin";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(
	readFileSync(join(__dirname, "serviceAccount.json"), "utf-8")
);

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const FROM = "admins";
const TO = "teachers";

const apply = process.argv.includes("--apply");
const cleanup = process.argv.includes("--cleanup");

type Doc = { id: string; data: Record<string, unknown> };

async function read(collection: string): Promise<Doc[]> {
	const snap = await db.collection(collection).get();
	return snap.docs.map((d) => ({ id: d.id, data: d.data() }));
}

/* Firestore Timestamps serialize to a stable {_seconds,_nanoseconds} pair, so
   both sides compare byte for byte once the keys are ordered. */
function normalize(data: Record<string, unknown>): string {
	return JSON.stringify(
		Object.keys(data)
			.sort()
			.map((k) => [k, data[k]])
	);
}

function findPending(source: Doc[], target: Doc[]): Doc[] {
	const byId = new Map(target.map((d) => [d.id, d]));
	return source.filter((d) => {
		const twin = byId.get(d.id);
		return !twin || normalize(twin.data) !== normalize(d.data);
	});
}

async function runCleanup(source: Doc[], target: Doc[]): Promise<void> {
	const pending = findPending(source, target);
	if (pending.length > 0) {
		console.error(
			`Refusing to delete — ${pending.length} doc(s) are not copied yet:`
		);
		for (const d of pending) console.error(`  ${d.id}`);
		console.error("Run the copy first, verify the app, then --cleanup.");
		process.exitCode = 1;
		return;
	}

	if (!apply) {
		console.log(
			`Dry run — would delete ${source.length} doc(s) from "${FROM}". Re-run with --apply --cleanup.`
		);
		return;
	}

	const batch = db.batch();
	for (const d of source) batch.delete(db.collection(FROM).doc(d.id));
	await batch.commit();
	console.log(`Deleted ${source.length} doc(s) from "${FROM}".`);
}

async function runCopy(source: Doc[], target: Doc[]): Promise<void> {
	const pending = findPending(source, target);
	if (pending.length === 0) {
		console.log(`"${TO}" already matches "${FROM}" — nothing to do.`);
		return;
	}

	for (const d of pending) {
		console.log(`  ${d.id}  status=${String(d.data.status)}`);
	}

	if (!apply) {
		console.log(
			`Dry run — would copy ${pending.length} doc(s) into "${TO}". Re-run with --apply.`
		);
		return;
	}

	const batch = db.batch();
	for (const d of pending) {
		batch.set(db.collection(TO).doc(d.id), d.data, { merge: true });
	}
	await batch.commit();
	console.log(`Copied ${pending.length} doc(s) into "${TO}".`);
}

async function main(): Promise<void> {
	const [source, target] = await Promise.all([read(FROM), read(TO)]);
	console.log(
		`${FROM}: ${source.length} doc(s)   ${TO}: ${target.length} doc(s)`
	);

	if (source.length === 0) {
		console.log(`Nothing in "${FROM}" — nothing to migrate.`);
		return;
	}

	if (cleanup) {
		await runCleanup(source, target);
		return;
	}
	await runCopy(source, target);
}

main().catch((err: unknown) => {
	console.error(err);
	process.exitCode = 1;
});
