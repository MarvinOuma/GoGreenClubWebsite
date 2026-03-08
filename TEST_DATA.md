# Test Data for GoGreen Club Platform

## Quick Test Data Setup

Use Firebase Console to add this test data manually, or create a script.

### Sample Events (Collection: `events`)

```json
{
  "title": "Beach Cleanup Drive",
  "description": "Join us for a coastal cleanup initiative at Marina Beach",
  "date": "2024-02-15",
  "location": "Marina Beach",
  "participants": [],
  "maxParticipants": 50,
  "createdAt": "2024-01-20T10:00:00Z"
}

{
  "title": "Tree Plantation Drive",
  "description": "Plant 100 trees in the local park",
  "date": "2024-02-20",
  "location": "Central Park",
  "participants": [],
  "maxParticipants": 30,
  "createdAt": "2024-01-21T10:00:00Z"
}

{
  "title": "E-Waste Collection",
  "description": "Bring your old electronics for proper recycling",
  "date": "2024-02-25",
  "location": "College Campus",
  "participants": [],
  "maxParticipants": 100,
  "createdAt": "2024-01-22T10:00:00Z"
}
```

### Sample Blog Posts (Collection: `posts`)

```json
{
  "title": "Our First Tree Plantation Drive - A Success!",
  "content": "We planted 50 trees today with the help of 25 volunteers. The event was a huge success and we're planning more such drives in the future. Each tree planted is a step towards a greener tomorrow.",
  "authorName": "Admin Team",
  "coverImageUrl": "",
  "tags": ["events", "trees", "success"],
  "isPublished": true,
  "createdAt": "2024-01-15T10:00:00Z"
}

{
  "title": "5 Simple Ways to Reduce Plastic Usage",
  "content": "1. Carry reusable bags\n2. Use metal straws\n3. Buy in bulk\n4. Choose glass containers\n5. Say no to single-use plastics",
  "authorName": "Sarah Green",
  "coverImageUrl": "",
  "tags": ["tips", "plastic", "sustainability"],
  "isPublished": true,
  "createdAt": "2024-01-18T10:00:00Z"
}

{
  "title": "Understanding Carbon Footprint",
  "content": "Your carbon footprint is the total amount of greenhouse gases produced by your actions. Learn how to calculate and reduce yours.",
  "authorName": "Dr. Eco",
  "coverImageUrl": "",
  "tags": ["education", "carbon", "climate"],
  "isPublished": false,
  "createdAt": "2024-01-19T10:00:00Z"
}
```

### Sample User Profile (Collection: `users`)

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "branch": "Computer Science",
  "interests": ["recycling", "tree planting", "clean energy"],
  "greenPoints": 150,
  "role": "member",
  "createdAt": "2024-01-10T10:00:00Z"
}
```

### Sample Impact Report (Collection: `impactReports`)

```json
{
  "userId": "USER_UID_HERE",
  "activityType": "recycling",
  "amount": "5kg",
  "description": "Collected and recycled plastic bottles from campus",
  "status": "pending",
  "createdAt": "2024-01-20T10:00:00Z"
}

{
  "userId": "USER_UID_HERE",
  "activityType": "tree_planting",
  "amount": "3 trees",
  "description": "Planted trees in local park",
  "status": "approved",
  "greenPointsAwarded": 30,
  "createdAt": "2024-01-18T10:00:00Z"
}
```

## How to Add Test Data

### Option 1: Firebase Console (Recommended for beginners)

1. Go to Firebase Console → Firestore Database
2. Click "Start collection"
3. Enter collection name (e.g., `events`)
4. Add document with auto-generated ID
5. Copy-paste the JSON fields manually

### Option 2: Using Firebase Admin SDK (Advanced)

Create a script `scripts/seedData.js`:

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function seedData() {
  // Add events
  await db.collection('events').add({
    title: "Beach Cleanup Drive",
    description: "Join us for a coastal cleanup initiative",
    date: "2024-02-15",
    location: "Marina Beach",
    participants: [],
    createdAt: new Date()
  });

  // Add posts
  await db.collection('posts').add({
    title: "Our First Tree Plantation Drive",
    content: "We planted 50 trees today...",
    authorName: "Admin Team",
    tags: ["events", "trees"],
    isPublished: true,
    createdAt: new Date()
  });

  console.log('Test data added successfully!');
}

seedData();
```

Run with: `node scripts/seedData.js`

## Creating Your First Admin

After signing up through the app, use Firebase CLI:

```bash
firebase functions:shell

# In the shell:
admin.auth().setCustomUserClaims('PASTE_USER_UID_HERE', { 
  role: 'admin', 
  admin: true 
})
```

Or use Firebase Console → Authentication → Select user → Custom claims

---

**Note**: Replace `USER_UID_HERE` with actual user IDs from Firebase Authentication.
