export const cookieOptions = () => {
  const isProd = process.env.NODE_ENV === "production" || !!process.env.VERCEL;
  return {
    httpOnly: true,
    secure: true,
    sameSite: isProd ? "none" : "lax",
    path: "/",
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  };
};
