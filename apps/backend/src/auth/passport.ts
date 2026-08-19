import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { env } from '../config/env';
import { UserRepository } from '../repositories/UserRepository';
import { logger } from '../config/logger';

export function configurePassport() {
  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: env.GOOGLE_CLIENT_ID,
          clientSecret: env.GOOGLE_CLIENT_SECRET,
          callbackURL: env.GOOGLE_CALLBACK_URL
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const googleId = profile.id;
            const email = profile.emails && profile.emails[0] ? profile.emails[0].value : '';
            const name = profile.displayName || profile.name?.givenName || 'User';
            const avatarUrl = profile.photos && profile.photos[0] ? profile.photos[0].value : undefined;

            if (!email) {
              return done(new Error('Google profile did not return an email address'), undefined);
            }

            const user = await UserRepository.upsertGoogleUser({
              googleId,
              email,
              name,
              avatarUrl
            });

            // Automatically create / update the Google SMTP sender for this user using Google OAuth
            const { SenderRepository } = await import('../repositories/SenderRepository');
            await SenderRepository.upsertGoogleOAuthSender({
              userId: user.id,
              email,
              displayName: name,
              oauth2AccessToken: accessToken,
              oauth2RefreshToken: refreshToken
            });

            return done(null, user);
          } catch (error) {
            logger.error({ error }, 'Google OAuth Strategy error');
            return done(error as Error, undefined);
          }
        }
      )
    );
    logger.info('Google OAuth 2.0 Passport strategy initialized');
  } else {
    logger.warn('GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET missing. Google OAuth redirect will fall back to local dev user login.');
  }
}
