import "firebase-admin";
import { Firestore, Timestamp } from "@google-cloud/firestore";

declare module "firebase-admin" {
	namespace credential {
		function cert(serviceAccountPathOrObject: any): any;
		function applicationDefault(): any;
		function refreshToken(refreshTokenPathOrObject: any): any;
	}

	namespace firestore {
		export { Timestamp };
	}

	function firestore(): Firestore;
}
