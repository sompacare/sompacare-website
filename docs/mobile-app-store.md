# Mobile App Store Launch

## Apps

| App | Folder | Bundle ID | Play package |
|-----|--------|-----------|--------------|
| Sompacare Nurse | `apps/mobile-nurse` | `com.sompacare.nurse` | `com.sompacare.nurse` |
| Sompacare Facility | `apps/mobile-facility` | `com.sompacare.facility` | `com.sompacare.facility` |

## Auth

Mobile apps use **Clerk** (same instance as web portals). Production API:

```
https://api.sompacare.com/api/v1
```

### Clerk Dashboard setup

1. **Native applications** → Add iOS + Android
2. **Allowed origins / redirect URLs:**
   - `sompacare-nurse://`
   - `sompacare-facility://`
3. Use the same `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` as web portals

### Local dev

```bash
cp apps/mobile-nurse/env.example apps/mobile-nurse/.env
cp apps/mobile-facility/env.example apps/mobile-facility/.env
# Paste Clerk publishable key from .env.platform
npm run dev --workspace=@sompacare/mobile-nurse
```

## EAS Build (Expo Application Services)

```bash
npm install -g eas-cli
eas login

# Nurse app
cd apps/mobile-nurse
eas build:configure
eas secret:create --name EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY --value pk_test_...
eas build --platform all --profile production

# Facility app
cd ../mobile-facility
eas secret:create --name EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY --value pk_test_...
eas build --platform all --profile production
```

## Submit to stores

### Apple (TestFlight → App Store)

1. Wait for Apple Developer welcome email
2. [App Store Connect](https://appstoreconnect.apple.com) → New App
3. `eas submit --platform ios --profile production`
4. TestFlight → internal testers → submit for review

### Google Play

1. Finish Play Console identity verification
2. Create app listing
3. `eas submit --platform android --profile production`
4. Internal testing → production

## Store listing checklist

- [ ] App icon 1024×1024
- [ ] Screenshots (iPhone + Android tablet)
- [ ] Privacy policy URL: `https://www.sompacare.com/privacy`
- [ ] App description
- [ ] Location permission justification (geofence clock-in)

## Link Clerk users to platform roles

After first mobile sign-in, link users to RBAC roles:

```bash
node scripts/link-clerk-user.mjs --email nurse@example.com
node scripts/link-facility-user.mjs --email facility@example.com
```
