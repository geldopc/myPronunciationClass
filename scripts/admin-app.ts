import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { applicationDefault, cert, initializeApp } from "firebase-admin/app";
import { type Firestore, getFirestore } from "firebase-admin/firestore";

const HERE = dirname(fileURLToPath(import.meta.url));
const KEY_PATH = join(HERE, "serviceAccount.json");
const ADC_PATH = join(
	homedir(),
	".config",
	"gcloud",
	"application_default_credentials.json"
);
const DEFAULT_PROJECT_ID = "mypronunciationclass-99f2d";

/* Two ways in, because organisations can forbid the first one:
   constraints/iam.disableServiceAccountKeyCreation blocks generating a
   service account key at all, and Application Default Credentials from
   `gcloud auth application-default login` authenticate as the user instead. */
export function initAdminApp(): Firestore {
	if (existsSync(KEY_PATH)) {
		initializeApp({
			credential: cert(JSON.parse(readFileSync(KEY_PATH, "utf-8"))),
		});
		return getFirestore();
	}

	const hasAdc =
		Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS) || existsSync(ADC_PATH);
	if (!hasAdc) {
		throw new Error(
			[
				"No credentials found. Use either:",
				`  1. a service account key at ${KEY_PATH}`,
				"  2. gcloud auth application-default login",
				"",
				"Option 2 needs no key, so it works where organisation policy",
				"forbids creating service account keys.",
			].join("\n")
		);
	}

	initializeApp({
		credential: applicationDefault(),
		projectId:
			process.env.FIREBASE_PROJECT_ID ??
			process.env.GOOGLE_CLOUD_PROJECT ??
			DEFAULT_PROJECT_ID,
	});
	return getFirestore();
}
