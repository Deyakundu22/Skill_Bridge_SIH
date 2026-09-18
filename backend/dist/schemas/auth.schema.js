import { z } from "zod";
export const signInSchema = z.object({
    identifier: z.string().min(1, "Username or email is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    captchaId: z.string().min(1, "Captcha challenge is required"),
    captchaAnswer: z
        .union([z.string(), z.number()])
        .transform((value) => Number(value))
        .refine((value) => Number.isFinite(value), {
        message: "Captcha answer is required",
    }),
});
export const signUpSchema = z.object({
    name: z.string().min(2).max(100),
    username: z
        .string()
        .min(3)
        .max(30)
        .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers and underscores"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6).max(100),
    captchaId: z.string().min(1, "Captcha challenge is required"),
    captchaAnswer: z
        .union([z.string(), z.number()])
        .transform((value) => Number(value))
        .refine((value) => Number.isFinite(value), {
        message: "Captcha answer is required",
    }),
    role: z.string().refine((val) => {
        const lower = val.trim().toLowerCase();
        return (lower !== "admin" &&
            [
                "student",
                "industry",
                "academician",
                "institution",
                "faculty",
                "institute",
            ].includes(lower));
    }, {
        message: "Admin accounts cannot be publicly registered. Allowed roles: student, industry, academician, institution.",
    }),
});
export const forgotPasswordSchema = z.object({
    email: z.string().email("A valid email is required"),
    captchaId: z.string().min(1, "Captcha challenge is required"),
    captchaAnswer: z
        .union([z.string(), z.number()])
        .transform((value) => Number(value))
        .refine((value) => Number.isFinite(value), {
        message: "Captcha answer is required",
    }),
});
export const resetPasswordSchema = z
    .object({
    token: z.string().min(20, "Reset token is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Confirmation password is required"),
})
    .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});
export const verifyEmailTokenSchema = z.object({
    token: z.string().min(20, "Verification token is required"),
});
