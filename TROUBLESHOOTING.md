# 🔧 Troubleshooting Guide - GoGreen Club Platform

## Common Issues & Solutions

---

## 🚨 Installation Issues

### Issue: `npm install` fails
**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### Issue: Node version incompatible
**Solution:**
```bash
# Check Node version (need v18+)
node --version

# Update Node via Homebrew
brew upgrade node
```

---

## 🔥 Firebase Issues

### Issue: "Firebase not initialized"
**Symptoms:** App crashes on load, console shows Firebase errors

**Solution:**
1. Check `.env` file exists in root directory
2. Verify all Firebase config values are correct
3. Restart dev server: `npm run dev`
4. Clear browser cache

```bash
# Verify .env file
cat .env

# Should show:
# VITE_FIREBASE_API_KEY=...
# VITE_FIREBASE_AUTH_DOMAIN=...
# etc.
```

### Issue: "Firebase project not found"
**Solution:**
```bash
# Login to Firebase
firebase login

# List projects
firebase projects:list

# Use correct project
firebase use YOUR_PROJECT_ID
```

### Issue: Cloud Functions not deploying
**Symptoms:** `firebase deploy --only functions` fails

**Solution:**
1. Check billing is enabled (Blaze plan required)
2. Verify Node version in `functions/package.json` matches your system
3. Install dependencies in functions folder:
```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

---

## 🔐 Authentication Issues

### Issue: Google Sign-In not working
**Solution:**
1. Go to Firebase Console → Authentication
2. Verify Google provider is enabled
3. Add authorized domains:
   - `localhost` (for development)
   - Your production domain
4. Check OAuth consent screen is configured

### Issue: "User not found" after signup
**Solution:**
- Cloud Function may not have run
- Check Functions logs:
```bash
firebase functions:log
```
- Manually assign role:
```bash
firebase functions:shell
admin.auth().setCustomUserClaims('USER_UID', { role: 'member', admin: false })
```

### Issue: Can't access admin dashboard
**Symptoms:** Redirected to member dashboard even as admin

**Solution:**
1. Verify custom claims are set:
```bash
firebase functions:shell
admin.auth().getUser('USER_UID').then(user => console.log(user.customClaims))
```
2. Should show: `{ role: 'admin', admin: true }`
3. If not, set manually:
```bash
admin.auth().setCustomUserClaims('USER_UID', { role: 'admin', admin: true })
```
4. User must logout and login again for claims to refresh

---

## 🗄️ Firestore Issues

### Issue: "Permission denied" when reading/writing
**Solution:**
1. Deploy Firestore rules:
```bash
firebase deploy --only firestore:rules
```
2. Check rules in Firebase Console → Firestore → Rules
3. Verify user is authenticated
4. Check custom claims are correct

### Issue: Data not showing in dashboard
**Solution:**
1. Check browser console for errors
2. Verify collection names match:
   - `users`
   - `events`
   - `posts`
   - `impactReports`
3. Add test data via Firebase Console
4. Check Firestore indexes (may need to create)

### Issue: "Missing or insufficient permissions"
**Solution:**
- User may not have correct role
- Check AuthContext is providing user data
- Verify ProtectedRoute is working
- Check Firestore rules allow the operation

---

## 📦 Storage Issues

### Issue: Image upload fails
**Solution:**
1. Deploy Storage rules:
```bash
firebase deploy --only storage
```
2. Check file size (max 5MB by default)
3. Verify file type is allowed (images only)
4. Check browser console for specific error

### Issue: Images not displaying
**Solution:**
1. Check `coverImageUrl` field in Firestore
2. Verify URL is accessible (open in new tab)
3. Check CORS settings in Storage rules
4. Ensure image was uploaded successfully

---

## 🎨 UI/Styling Issues

### Issue: Tailwind classes not working
**Solution:**
1. Verify `tailwind.config.js` exists
2. Check `index.css` has Tailwind directives:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```
3. Restart dev server
4. Clear browser cache

### Issue: Logo not showing
**Solution:**
1. Verify logo exists at `public/logo.png`
2. Check file name is exactly `logo.png` (case-sensitive)
3. Clear browser cache
4. Check browser console for 404 errors

### Issue: Responsive design broken
**Solution:**
1. Check Tailwind breakpoints in `tailwind.config.js`
2. Test in browser dev tools (responsive mode)
3. Verify viewport meta tag in `index.html`

---

## 🔄 Routing Issues

### Issue: 404 on page refresh
**Symptoms:** Works on first load, 404 on refresh

**Solution:**
- This is expected in development
- In production, Firebase Hosting handles this via `firebase.json` rewrites
- For local testing, always navigate via app links

### Issue: Protected routes not working
**Solution:**
1. Check `ProtectedRoute.jsx` is wrapping routes
2. Verify `AuthContext` is providing `currentUser`
3. Check user is logged in
4. Verify custom claims for admin routes

---

## 🚀 Deployment Issues

### Issue: Build fails
**Symptoms:** `npm run build` shows errors

**Solution:**
1. Check for TypeScript/ESLint errors
2. Fix any import errors
3. Verify all dependencies are installed
4. Check Node version compatibility

### Issue: Deployed site shows blank page
**Solution:**
1. Check browser console for errors
2. Verify `.env` variables are set correctly
3. Check Firebase Hosting configuration in `firebase.json`
4. Ensure `dist` folder was created during build
5. Redeploy:
```bash
npm run build
firebase deploy --only hosting
```

### Issue: Functions not working in production
**Solution:**
1. Check Functions logs in Firebase Console
2. Verify billing is enabled
3. Check function region matches your setup
4. Redeploy functions:
```bash
firebase deploy --only functions
```

---

## 🐛 Runtime Errors

### Issue: "Cannot read property of undefined"
**Common causes:**
- Data not loaded yet (use loading states)
- Firestore document doesn't exist
- User not authenticated

**Solution:**
```javascript
// Add null checks
{userData?.greenPoints || 0}

// Use loading state
{loading ? <Spinner /> : <Dashboard />}

// Check authentication
{currentUser && <Component />}
```

### Issue: Infinite re-renders
**Solution:**
- Check `useEffect` dependencies
- Avoid setting state in render
- Use `useCallback` for functions passed as props

### Issue: State not updating
**Solution:**
- Check if you're mutating state directly
- Use spread operator for arrays/objects
- Verify `useState` is called correctly

---

## 📊 Performance Issues

### Issue: Slow page loads
**Solution:**
1. Optimize images (compress, use WebP)
2. Implement pagination for large lists
3. Use Firestore query limits
4. Add loading skeletons
5. Lazy load components

### Issue: Too many Firestore reads
**Solution:**
1. Implement caching with React state
2. Use `onSnapshot` for real-time data
3. Add pagination
4. Use Firestore indexes
5. Batch reads where possible

---

## 🔍 Debugging Tips

### Check Browser Console
```javascript
// Add debug logs
console.log('User:', currentUser);
console.log('Role:', userRole);
console.log('Is Admin:', isAdminUser);
```

### Check Firebase Console
1. **Authentication** → Verify users exist
2. **Firestore** → Check data structure
3. **Storage** → Verify files uploaded
4. **Functions** → Check logs for errors

### Check Network Tab
- Look for failed requests
- Check API responses
- Verify Firebase calls are succeeding

### Use React DevTools
- Install React DevTools extension
- Inspect component props and state
- Check Context values

---

## 🆘 Emergency Fixes

### Reset Everything
```bash
# Delete all local files
rm -rf node_modules package-lock.json .firebase

# Reinstall
npm install

# Redeploy
firebase deploy
```

### Reset Firebase Project
1. Go to Firebase Console
2. Project Settings → General
3. Scroll to "Your apps"
4. Delete and recreate app
5. Update `.env` with new config

### Reset User Role
```bash
firebase functions:shell

# Reset to member
admin.auth().setCustomUserClaims('USER_UID', { role: 'member', admin: false })

# Or promote to admin
admin.auth().setCustomUserClaims('USER_UID', { role: 'admin', admin: true })
```

---

## 📞 Getting Help

### Check Logs
```bash
# Firebase Functions logs
firebase functions:log

# Firestore debug mode
firebase firestore:debug

# Hosting logs
firebase hosting:channel:list
```

### Useful Commands
```bash
# Check Firebase CLI version
firebase --version

# Check Node version
node --version

# Check npm version
npm --version

# List Firebase projects
firebase projects:list

# Check current project
firebase use
```

### Resources
- [Firebase Documentation](https://firebase.google.com/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Vite Troubleshooting](https://vitejs.dev/guide/troubleshooting)

---

## ✅ Prevention Checklist

Before deploying:
- [ ] All environment variables set
- [ ] Firebase rules deployed
- [ ] Cloud Functions deployed
- [ ] Test data added
- [ ] First admin created
- [ ] All features tested locally
- [ ] Build succeeds without errors
- [ ] No console errors
- [ ] Responsive design tested
- [ ] Authentication flow tested

---

## 🎯 Quick Diagnostic

Run this checklist if something's not working:

1. ✅ Is `.env` file present and correct?
2. ✅ Are all dependencies installed?
3. ✅ Is Firebase project configured?
4. ✅ Are Firestore rules deployed?
5. ✅ Are Storage rules deployed?
6. ✅ Are Cloud Functions deployed?
7. ✅ Is user authenticated?
8. ✅ Does user have correct role?
9. ✅ Is data in Firestore?
10. ✅ Are there any console errors?

---

**Still stuck? Check the documentation files or Firebase Console logs!**

**Built with ❤️ for environmental impact**
