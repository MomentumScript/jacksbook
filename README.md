# Jacksbook

A Facebook-style social app for Android, built with Expo (React Native) and Supabase.

**Features:** sign up / log in, a feed (Everyone or Following), text and photo posts, likes, comments, profiles with photo and bio, follow/unfollow.

## Get the app

Every push to `main` builds a new APK automatically (GitHub Actions → "Build Android APK").
Download it from the **[latest release](../../releases/tag/latest)** → `jacksbook.apk`, then open it on your phone to install.

## Backend

Supabase project `jacksbook` (database, logins, photo storage). Security is enforced with Row Level Security: everyone signed in can read, but people can only change their own posts, comments, likes, follows and photos.

## Develop

```bash
npm install
npx expo start
```
