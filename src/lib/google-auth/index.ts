import { OAuth2Client } from "google-auth-library";
import { env } from "../../config/env";

export const googleAuth = new OAuth2Client(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    env.GOOGLE_REDIRECT_URI
);
