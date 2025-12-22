# How to Host Your App for Free

Since your project is built with **Vite** and **React**, the easiest way to share it is using **Netlify** or **Vercel**.

## Option 1: The Easiest Way (Netlify Drop)
*Best for quickly sharing a specific version.*

1.  **Build your project**:
    Run this command in your terminal:
    ```bash
    npm run build
    ```
    This creates a `dist` folder in your project directory (`c:\verse-planner-app\dist`).

2.  **Upload to Netlify**:
    *   Go to [app.netlify.com/drop](https://app.netlify.com/drop).
    *   Open your file explorer to `c:\verse-planner-app`.
    *   Drag and drop the **`dist`** folder onto the Netlify page.

3.  **Configure Environment Variables (Important!)**:
    Since you use Supabase, you must add your keys to Netlify.
    *   Once uploaded, go to **Site settings** > **Environment variables**.
    *   Add the same keys found in your `.env` file:
        *   `VITE_SUPABASE_URL`
        *   `VITE_SUPABASE_ANON_KEY`

## Option 2: The Professional Way (Vercel + GitHub)
*Best for continuous updates.*

1.  **Push to GitHub**:
    *   Create a repository on GitHub.
    *   Push your code there.

2.  **Deploy on Vercel**:
    *   Go to [vercel.com](https://vercel.com) and log in.
    *   Click "Add New..." > "Project".
    *   Import your GitHub repository.
    *   Vercel detects it's a Vite app automatically.
    *   **Environment Variables**: Before clicking Deploy, expand the "Environment Variables" section and add your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
    *   Click **Deploy**.

## Note on Database
Your **Supabase** database is already in the cloud, so it will work automatically with the hosted site as long as you provide the correct URL and Anon Key in the hosting settings!
