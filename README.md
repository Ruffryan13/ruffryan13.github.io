The static site is at the package root.

## Publish
1. Open the repository `ruffryan13.github.io`.
2. Upload the **contents** of this ZIP to the repository root (not the containing folder).
3. In GitHub, open **Settings → Pages** and select **Deploy from a branch**, branch `main`, folder `/ (root)`.
4. Visit https://ruffryan13.github.io after deployment completes.

## Important hosting limitation
GitHub Pages only serves static files. The original project is a Flask/Python application with accounts, a database, APIs, and server-side features. Those features cannot run on GitHub Pages alone. The edited original application is preserved in `backend-source/` for deployment to a Python-capable host. The root `index.html` is the working GitHub Pages front page.

The Casino, Chat, Memes, Friends, Media, and Groups modules have been removed from the preserved backend configuration and files. The registration server-key field/check has been removed. The front page is English and branded as Ryan.
