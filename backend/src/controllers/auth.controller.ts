import crypto from "crypto";
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import {
  signInSchema,
  signUpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../schemas/auth.schema.js";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import type { User } from "../types/user.type.js";

type CaptchaChallenge = {
  answer: number;
  expiresAt: number;
  prompt: string;
};

const captchaStore = new Map<string, CaptchaChallenge>();

const ensurePasswordResetTable = async (): Promise<void> => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      token_hash VARCHAR(255) NOT NULL UNIQUE,
      expires_at DATETIME NOT NULL,
      used_at DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_password_reset_tokens_user_id (user_id),
      INDEX idx_password_reset_tokens_expires_at (expires_at),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
};

export const createCaptchaChallenge = (): {
  id: string;
  question: string;
  answer: number;
  image: string;
} => {
  const left = Math.floor(Math.random() * 9) + 2;
  const right = Math.floor(Math.random() * 9) + 2;
  const operators = ["+", "-", "*"] as const;
  const operator = operators[Math.floor(Math.random() * operators.length)];

  let answer = 0;
  let question = "";

  switch (operator) {
    case "+":
      question = `${left} + ${right}`;
      answer = left + right;
      break;
    case "-":
      question = `${left + right} - ${left}`;
      answer = right;
      break;
    case "*":
      question = `${left} * ${right}`;
      answer = left * right;
      break;
    default:
      question = `${left} + ${right}`;
      answer = left + right;
      break;
  }

  const id = crypto.randomUUID();
  const svgText = `${question} = ?`;
  const svgMarkup = `
    <svg xmlns="http://www.w3.org/2000/svg" width="420" height="120" viewBox="0 0 420 120">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#0ea5e9"/>
          <stop offset="55%" stop-color="#2563eb"/>
          <stop offset="100%" stop-color="#10b981"/>
        </linearGradient>
      </defs>
      <rect width="420" height="120" rx="18" fill="url(#bg)"/>
      <circle cx="45" cy="32" r="10" fill="rgba(255,255,255,0.25)"/>
      <circle cx="370" cy="92" r="16" fill="rgba(255,255,255,0.2)"/>
      <path d="M0 100 C90 75, 140 110, 240 80 S360 56, 420 80 L420 120 L0 120 Z" fill="rgba(255,255,255,0.12)"/>
      <g font-family="Arial, sans-serif" fill="#ffffff" font-weight="700">
        <text x="210" y="70" text-anchor="middle" font-size="34" letter-spacing="1">${svgText}</text>
      </g>
      <g font-family="Arial, sans-serif" fill="rgba(255,255,255,0.9)" font-weight="600">
        <text x="210" y="96" text-anchor="middle" font-size="14">SkillBridge secure check</text>
      </g>
    </svg>
  `;

  const image = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgMarkup)}`;
  captchaStore.set(id, {
    answer,
    expiresAt: Date.now() + 5 * 60 * 1000,
    prompt: question,
  });

  return { id, question, answer, image };
};

export const verifyCaptchaAnswer = (
  challengeId: string,
  submittedAnswer: string | number,
): boolean => {
  if (!challengeId) return false;

  const challenge = captchaStore.get(challengeId);
  if (!challenge) return false;

  if (Date.now() > challenge.expiresAt) {
    captchaStore.delete(challengeId);
    return false;
  }

  const numericAnswer = Number(submittedAnswer);
  if (!Number.isFinite(numericAnswer)) {
    return false;
  }

  const isValid = numericAnswer === challenge.answer;
  if (isValid) {
    captchaStore.delete(challengeId);
  }

  return isValid;
};

export const getCaptcha = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const challenge = createCaptchaChallenge();
    res.status(200).json({
      success: true,
      captcha: {
        id: challenge.id,
        question: challenge.question,
        image: challenge.image,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Unable to generate captcha challenge",
    });
  }
};

export const forgotPassword = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const result = forgotPasswordSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message:
          result.error.issues[0]?.message || "Invalid password reset request.",
      });
      return;
    }

    const { email, captchaId, captchaAnswer } = result.data;

    if (!verifyCaptchaAnswer(captchaId, captchaAnswer)) {
      res.status(400).json({
        success: false,
        message: "Captcha verification failed. Please try again.",
      });
      return;
    }

    await ensurePasswordResetTable();

    const normalizedEmail = String(email).trim().toLowerCase();
    const [rows] = await pool.query<User[]>(
      `SELECT id, name, email, username FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1`,
      [normalizedEmail],
    );

    const user = rows && rows.length > 0 ? rows[0] : null;

    const genericMessage =
      "If an account exists for this email, password reset instructions have been generated.";

    if (!user) {
      res.status(200).json({
        success: true,
        message: genericMessage,
      });
      return;
    }

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");

    await pool.query(`DELETE FROM password_reset_tokens WHERE user_id = ?`, [
      user.id,
    ]);
    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)`,
      [user.id, tokenHash, expiresAt],
    );

    const frontendOrigin = (
      process.env.FRONTEND_URL || "http://localhost:5173"
    ).replace(/\/$/, "");
    const resetUrl = `${frontendOrigin}/?resetToken=${encodeURIComponent(token)}`;

    res.status(200).json({
      success: true,
      message:
        "Password reset instructions are ready. For this environment, use the reset token below.",
      resetToken: token,
      resetUrl,
      expiresInMinutes: 15,
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error: any) {
    console.error("Forgot password controller error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while processing password reset request",
    });
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const result = resetPasswordSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message:
          result.error.issues[0]?.message || "Invalid password reset payload.",
      });
      return;
    }

    const { token, password } = result.data;
    const tokenHash = crypto
      .createHash("sha256")
      .update(token.trim())
      .digest("hex");

    await ensurePasswordResetTable();

    const [tokenRows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM password_reset_tokens WHERE token_hash = ? AND used_at IS NULL AND expires_at > NOW() LIMIT 1`,
      [tokenHash],
    );

    if (!tokenRows || tokenRows.length === 0) {
      res.status(400).json({
        success: false,
        message: "Reset token is invalid or expired.",
      });
      return;
    }

    const resetRecord = tokenRows[0];
    const [userRows] = await pool.query<User[]>(
      `SELECT id FROM users WHERE id = ? LIMIT 1`,
      [resetRecord.user_id],
    );

    if (!userRows || userRows.length === 0) {
      res.status(404).json({
        success: false,
        message: "Associated user account no longer exists.",
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(`UPDATE users SET password = ? WHERE id = ?`, [
      hashedPassword,
      resetRecord.user_id,
    ]);
    await pool.query(
      `UPDATE password_reset_tokens SET used_at = NOW() WHERE id = ?`,
      [resetRecord.id],
    );
    await pool.query(
      `DELETE FROM password_reset_tokens WHERE user_id = ? AND id != ?`,
      [resetRecord.user_id, resetRecord.id],
    );

    res.status(200).json({
      success: true,
      message:
        "Password reset successfully. You can now sign in with your new password.",
    });
  } catch (error: any) {
    console.error("Reset password controller error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while resetting password",
    });
  }
};

export const signIn = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = signInSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: result.error.issues[0]?.message || "Invalid login input.",
      });
      return;
    }

    const { identifier, password, captchaId, captchaAnswer } = result.data;

    if (!verifyCaptchaAnswer(captchaId, captchaAnswer)) {
      res.status(400).json({
        success: false,
        message: "Captcha verification failed. Please try again.",
      });
      return;
    }

    const sql = `
      SELECT * FROM users
      WHERE username = ? OR email = ?
    `;

    const [rows] = await pool.query<User[]>(sql, [identifier, identifier]);

    if (!rows || rows.length === 0) {
      res.status(401).json({
        success: false,
        message: "Invalid username/email or password",
      });
      return;
    }

    const user: User = rows[0];
    const storedPassword = user.password || (user as any).password_hash;
    const passwordMatch = await bcrypt.compare(password, storedPassword);

    if (!passwordMatch) {
      res.status(401).json({
        success: false,
        message: "Invalid username/email or password",
      });
      return;
    }

    const jwtSecret =
      process.env.JWT_SECRET || "skillbridge_super_jwt_secret_2026";

    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      jwtSecret,
      {
        expiresIn: "7d",
      },
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        username: user.username || user.name,
        email: user.email,
        role: user.role,
        is_verified: user.is_verified,
      },
    });
  } catch (error: any) {
    console.error("SignIn controller error:", error);
    res.status(500).json({
      success: false,
      message:
        "Server error during sign in: " +
        (error.message || "Database query failed"),
    });
  }
};

export const signUp = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = signUpSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message:
          result.error.issues[0]?.message || "Invalid registration input.",
      });
      return;
    }

    const { name, username, email, password, role, captchaId, captchaAnswer } =
      result.data;
    const lowerRole = role.trim().toLowerCase();

    if (!verifyCaptchaAnswer(captchaId, captchaAnswer)) {
      res.status(400).json({
        success: false,
        message: "Captcha verification failed. Please try again.",
      });
      return;
    }

    if (lowerRole === "admin") {
      res.status(400).json({
        success: false,
        message: "Admin accounts cannot be registered publicly.",
      });
      return;
    }

    // STRICT UNIVERSITY / INSTITUTION VERIFICATION
    let validInstitutionId: number | null = null;
    const inputInstitutionId =
      req.body.institution_id || req.body.institutionId;
    const inputInstitutionName =
      req.body.institution_name ||
      req.body.institutionName ||
      req.body.university;

    if (
      [
        "student",
        "faculty",
        "academician",
        "institution",
        "institute",
      ].includes(lowerRole)
    ) {
      if (!inputInstitutionId && !inputInstitutionName) {
        res.status(400).json({
          success: false,
          message: "University / Institution is required for account creation.",
        });
        return;
      }

      let checkInstSql = `SELECT id, name, verification_status FROM institutions WHERE 1=0`;
      const queryParams: any[] = [];

      if (inputInstitutionId) {
        checkInstSql += ` OR id = ?`;
        queryParams.push(inputInstitutionId);
      }
      if (inputInstitutionName) {
        checkInstSql += ` OR LOWER(name) = LOWER(?) OR LOWER(code) = LOWER(?)`;
        queryParams.push(
          String(inputInstitutionName).trim(),
          String(inputInstitutionName).trim(),
        );
      }

      const [instRows] = await pool.query<RowDataPacket[]>(
        checkInstSql,
        queryParams,
      );

      if (!instRows || instRows.length === 0) {
        res.status(400).json({
          success: false,
          message:
            "Selected university/institution is not registered in our database. Registration is strictly permitted only for institutions existing in our database.",
        });
        return;
      }

      validInstitutionId = instRows[0].id;
    }

    const checkSql = `
      SELECT id FROM users
      WHERE username = ? OR email = ?
    `;

    const [existing] = await pool.query<any[]>(checkSql, [username, email]);

    if (existing && existing.length > 0) {
      res.status(409).json({
        success: false,
        message: "Username or email already exists",
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const insertSql = `
      INSERT INTO users (name, username, email, password, role, institution_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const [insertResult] = await pool.query<ResultSetHeader>(insertSql, [
      name,
      username,
      email,
      hashedPassword,
      role,
      validInstitutionId,
    ]);

    const userId = insertResult.insertId;

    if (lowerRole === "student") {
      try {
        await pool.query(
          `INSERT INTO student_profiles (user_id, institution_id, verification_status) 
           VALUES (?, ?, 'pending')
           ON DUPLICATE KEY UPDATE institution_id=VALUES(institution_id)`,
          [userId, validInstitutionId],
        );
      } catch (err) {
        console.warn("Notice: Default student profile auto-seed error:", err);
      }
    }

    if (lowerRole === "industry") {
      try {
        const companyName =
          req.body.companyName || req.body.company_name || name;
        const companyType =
          req.body.companyType || req.body.company_type || null;
        const industrySector =
          req.body.industrySector || req.body.industry_sector || null;
        const description = req.body.description || null;
        const website = req.body.website || null;
        const location = req.body.location || null;
        const contactEmail =
          req.body.contactEmail || req.body.contact_email || email;
        const phone = req.body.phone || null;
        const logo = req.body.logo || null;

        await pool.query(
          `INSERT INTO industry_profiles 
            (user_id, company_name, company_type, industry_sector, description, website, location, contact_email, phone, logo, verification_status) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
           ON DUPLICATE KEY UPDATE user_id=user_id`,
          [
            userId,
            companyName,
            companyType,
            industrySector,
            description,
            website,
            location,
            contactEmail,
            phone,
            logo,
          ],
        );
      } catch (err) {
        console.warn("Notice: Industry profile auto-creation error:", err);
      }
    }

    const jwtSecret =
      process.env.JWT_SECRET || "skillbridge_super_jwt_secret_2026";

    const token = jwt.sign(
      {
        id: userId,
        username,
        email,
        role,
      },
      jwtSecret,
      { expiresIn: "7d" },
    );

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      token,
      user: {
        id: userId,
        name,
        username,
        email,
        role,
      },
    });
  } catch (error: any) {
    console.error("SignUp controller error:", error);
    res.status(500).json({
      success: false,
      message:
        "Server error during account creation: " +
        (error.message || "Database insert failed"),
    });
  }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const userId = req.user.id;
    const [results] = await pool.query<RowDataPacket[]>(
      `SELECT u.id, u.name, u.username, u.email, u.role, u.institution_id, u.created_at,
              i.name AS institution_name, COALESCE(i.verification_status, 'approved') AS institution_verification_status
       FROM users u
       LEFT JOIN institutions i ON u.institution_id = i.id
       WHERE u.id = ?`,
      [userId],
    );

    if (!results || results.length === 0) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    const userData = results[0];
    const lowerRole = String(userData.role).toLowerCase();

    if (lowerRole === "student") {
      const [spResults] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM student_profiles WHERE user_id = ?`,
        [userId],
      );
      res.status(200).json({
        success: true,
        user: userData,
        student_profile:
          spResults && spResults.length > 0 ? spResults[0] : null,
      });
    } else if (lowerRole === "industry") {
      const [cResults] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM industry_profiles WHERE user_id = ?`,
        [userId],
      );
      res.status(200).json({
        success: true,
        user: userData,
        company_profile: cResults && cResults.length > 0 ? cResults[0] : null,
      });
    } else {
      res.status(200).json({
        success: true,
        user: userData,
      });
    }
  } catch (error: any) {
    res
      .status(500)
      .json({ success: false, message: "Server error fetching user" });
  }
};
