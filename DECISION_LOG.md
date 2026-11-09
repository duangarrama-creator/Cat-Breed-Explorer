# Decision Log — Cat Breed Explorer & Cat Care

## 1. Project Direction
Decision: Extend the existing Cat Breed Explorer project.
Reason: Preserve the original concept while improving its functionality.

## 2. Frontend Technology
Decision: Use React and Vite.
Reason: React supports reusable components and Vite provides a fast development and production build process.

## 3. Backend Technology
Decision: Use Node.js and Express.
Reason: Handle API requests, authentication, and database operations on the server.

## 4. External API
Decision: Use TheCatAPI.
Reason: Retrieve real cat breed information and images.

## 5. Database
Decision: Use SQLite with better-sqlite3.
Reason: Store user accounts, pets, scan history, and reminders.

## 6. Authentication
Decision: Use bcryptjs and express-session.
Reason: Hash passwords and manage user login sessions.

## 7. Component Structure
Decision: Separate the React interface into reusable components.
Reason: Improve readability, maintainability, and code organization.

## 8. Data Structures and Algorithms

### Insertion Sort
Use a custom Insertion Sort to arrange cat breed names from A-Z or Z-A.
- Best time complexity: O(n)
- Average time complexity: O(n²)
- Worst time complexity: O(n²)
- Space complexity: O(n) because the implementation copies the array.

### Hash Table using Map
Use breed IDs as keys and breed objects as values.
- Average lookup time: O(1)
- Creation time: O(n)
- Space complexity: O(n)

## 9. Loading and Error Handling
Decision: Show loading indicators, error messages, and empty states.
Reason: Help users understand the application's status and recover from failures.

## 10. AI Scanner Limitation
Decision: Keep the scanner as a prototype until a real image-classification model is integrated.
Reason: Image upload alone cannot reliably identify a cat breed.

## 11. Deployment
Decision: Use GitHub for source control and prepare the frontend for Vercel deployment.
Reason: Make the source code accessible and support production deployment. The backend requires separate hosting and persistent database storage.

## 12. Future Improvements
- Integrate a real AI cat breed recognition model.
- Improve breed image matching.
- Add more cat care reminder options.
- Improve mobile responsiveness.
- Deploy the backend with a production database.
