# Auction

A React and Vite auction website backed by Firebase Authentication and Cloud Firestore.

## Requirements

- Node.js 20.19+ or 22.12+
- npm
- A Firebase project

## 1. Set up Firebase

1. Create a project in the [Firebase Console](https://console.firebase.google.com/).
2. Register a **Web app** in the project and copy its Firebase configuration.
3. In **Authentication → Sign-in method**, enable:
   - **Email/Password** for admin accounts.
   - **Anonymous** for team and projector visitors.
4. In **Firestore Database**, create a database.
5. From the project root, deploy this app's Firestore security rules:

   ```powershell
   npx firebase-tools login
   npx firebase-tools deploy --only firestore:rules --project YOUR_FIREBASE_PROJECT_ID
   ```

   Replace `YOUR_FIREBASE_PROJECT_ID` with the project ID shown in Firebase project settings.

6. Create an admin account under **Authentication → Users → Add user**. Copy its UID.
7. In **Firestore Database → Data**, create a collection named `admins`. Add a document whose **document ID is exactly the admin user's UID**. The document may contain any field, for example `role: "admin"`.

   Admin pages check for this document, and the security rules use it to authorize admin actions.

## 2. Configure the app

In the project root, create a file named `.env.local` and add the values from the Firebase web app configuration:

```env
VITE_FB_API_KEY=your-api-key
VITE_FB_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FB_PROJECT_ID=your-project-id
VITE_FB_APP_ID=your-app-id
```

Do not commit `.env.local`; local environment files are ignored by Git.

## 3. Install and run locally

Open a terminal in the project folder and run:

```powershell
npm install
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

## 4. Use the website

- **Admin** (`/admin`): sign in with the Firebase admin email and password. Add teams, categories, and tools, then use the live controls to run the auction.
- **Team** (`/`): open the site in a browser, choose a team, and enter the login code configured for that team.
- **Projector** (`/screen`): show the current tool and latest bids.
- **Summary** (`/summary`): view team totals and inventory. Admins can clear the summary to reset the auction.

## Other commands

```powershell
npm run build    # Create a production build in dist/
npm run preview  # Preview the production build locally
npm run lint     # Run ESLint
```

To publish the built site with Firebase Hosting, first configure Hosting for this project to serve the `dist` directory, then run:

```powershell
npm run build
npx firebase-tools deploy --only hosting --project YOUR_FIREBASE_PROJECT_ID
```
