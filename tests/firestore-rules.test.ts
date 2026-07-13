import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing"
import { deleteDoc, doc, getDoc, setDoc } from "firebase/firestore"
import { readFileSync } from "node:fs"
import { afterAll, beforeAll, describe, it } from "vitest"

let env: RulesTestEnvironment

const describeRules = process.env.FIRESTORE_EMULATOR_HOST ? describe : describe.skip

describeRules("firestore rules", () => {
  beforeAll(async () => {
    env = await initializeTestEnvironment({
      projectId: "demo-mpc",
      firestore: { rules: readFileSync("firestore.rules", "utf8"), host: "127.0.0.1", port: 8080 },
    })
  })

  afterAll(async () => {
    await env.cleanup()
  })

  it("lets a user read/write their own doc but not another's", async () => {
    const ada = env.authenticatedContext("ada").firestore()
    await assertSucceeds(setDoc(doc(ada, "users/ada"), { displayName: "Ada" }))
    await assertFails(getDoc(doc(ada, "users/bob")))
  })

  it("allows public read of shares but forbids forging another uid", async () => {
    const ada = env.authenticatedContext("ada").firestore()
    const anon = env.unauthenticatedContext().firestore()
    await assertSucceeds(setDoc(doc(ada, "shares/s1"), { uid: "ada", snapshot: {} }))
    await assertSucceeds(getDoc(doc(anon, "shares/s1")))
    await assertFails(setDoc(doc(ada, "shares/s2"), { uid: "bob", snapshot: {} }))
  })

  it("lets the owner delete their own share but forbids a non-owner", async () => {
    const ada = env.authenticatedContext("ada").firestore()
    const bob = env.authenticatedContext("bob").firestore()

    await assertSucceeds(setDoc(doc(ada, "shares/s3"), { uid: "ada", snapshot: {} }))
    await assertFails(deleteDoc(doc(bob, "shares/s3")))
    await assertSucceeds(deleteDoc(doc(ada, "shares/s3")))
  })
})
