import test from "node:test";
import assert from "node:assert/strict";

import {
  createCaptchaChallenge,
  verifyCaptchaAnswer,
} from "../src/controllers/auth.controller.ts";
import { verifyEmailTokenSchema } from "../src/schemas/auth.schema.ts";

test("captcha challenge generates a valid answer and is rejected once wrong", () => {
  const challenge = createCaptchaChallenge();

  assert.ok(challenge.id);
  assert.match(challenge.question, /\d+\s*[+\-*/]?\s*\d+/);
  assert.equal(typeof challenge.answer, "number");
  assert.equal(verifyCaptchaAnswer(challenge.id, challenge.answer), true);
  assert.equal(verifyCaptchaAnswer(challenge.id, challenge.answer + 1), false);
});

test("email verification token schema accepts valid values and rejects invalid ones", () => {
  const valid = verifyEmailTokenSchema.safeParse({ token: "a".repeat(64) });
  assert.equal(valid.success, true);

  const invalid = verifyEmailTokenSchema.safeParse({ token: "short" });
  assert.equal(invalid.success, false);
});
