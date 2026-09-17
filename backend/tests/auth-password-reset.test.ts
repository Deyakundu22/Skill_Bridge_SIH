import test from "node:test";
import assert from "node:assert/strict";

import pool from "../src/config/db.ts";
import {
  createCaptchaChallenge,
  verifyCaptchaAnswer,
} from "../src/controllers/auth.controller.ts";

test("captcha challenge generates a valid question and answer", async () => {
  const challenge = createCaptchaChallenge();

  assert.ok(challenge.id);
  assert.match(challenge.question, /\d+\s*[+\-*/]?\s*\d+/);
  assert.equal(typeof challenge.answer, "number");
  assert.equal(verifyCaptchaAnswer(challenge.id, challenge.answer), true);
  assert.equal(verifyCaptchaAnswer(challenge.id, challenge.answer + 1), false);

  await pool.end();
});
